import Event from '../models/Event.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  buildApplicabilityFilter,
  parseISODate,
  resolveYear,
  serializeEvent,
  startOfDay,
  timeToMinutes,
} from '../utils/eventService.js';

const VIEWER_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'];

const PERSON_FIELDS = 'firstName lastName email avatar designation department';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeParticipants = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id)).filter(Boolean))];
};

const sortEvents = (events) =>
  [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

const buildFilter = (query, user) => {
  const conditions = [];

  if (!VIEWER_ROLES.includes(user.role)) {
    conditions.push(buildApplicabilityFilter(user));
  }
  if (query.includeInactive !== true) conditions.push({ isActive: true });

  const year = resolveYear(query.year);
  if (query.month) {
    const start = new Date(year, Number(query.month) - 1, 1);
    const end = new Date(year, Number(query.month), 1);
    conditions.push({ date: { $gte: start, $lt: end } });
  } else if (query.from || query.to) {
    const range = {};
    const from = query.from ? parseISODate(query.from) : null;
    const to = query.to ? parseISODate(query.to) : null;
    if (from) range.$gte = from;
    if (to) {
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
    conditions.push({ date: range });
  } else if (query.year) {
    conditions.push({ date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });
  }

  if (query.type) conditions.push({ type: query.type });
  if (query.location) {
    const rx = new RegExp(escapeRegex(query.location), 'i');
    conditions.push({ location: rx });
  }
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    conditions.push({ $or: [{ name: rx }, { description: rx }, { location: rx }] });
  }

  return conditions.length ? { $and: conditions } : {};
};

const findEventOrFail = async (id) => {
  const event = await Event.findById(id)
    .populate('organizer', PERSON_FIELDS)
    .populate('participants', PERSON_FIELDS);
  if (!event) throw ApiError.notFound('Event not found');
  return event;
};

// GET /api/events
export const listEvents = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, req.user);
  const events = await Event.find(filter)
    .populate('organizer', PERSON_FIELDS)
    .populate('participants', PERSON_FIELDS);

  const sorted = sortEvents(events);
  res.status(200).json({
    success: true,
    year: resolveYear(req.query.year),
    count: sorted.length,
    events: sorted.map(serializeEvent),
  });
});

// GET /api/events/meta
export const getEventMeta = asyncHandler(async (_req, res) => {
  const users = await User.find({ isActive: true })
    .select(PERSON_FIELDS)
    .sort({ firstName: 1, lastName: 1 });

  res.status(200).json({
    success: true,
    employees: users.map((user) => ({
      id: String(user._id),
      _id: String(user._id),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      avatar: user.avatar || '',
      designation: user.designation || '',
      department: user.department || '',
    })),
  });
});

// GET /api/events/upcoming?limit=
export const getUpcomingEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
  const conditions = [{ isActive: true, date: { $gte: startOfDay(new Date()) } }];
  if (!VIEWER_ROLES.includes(req.user.role)) {
    conditions.push(buildApplicabilityFilter(req.user));
  }

  const events = await Event.find({ $and: conditions })
    .populate('organizer', PERSON_FIELDS)
    .populate('participants', PERSON_FIELDS);

  const sorted = sortEvents(events).slice(0, limit);
  res.status(200).json({ success: true, events: sorted.map(serializeEvent) });
});

// GET /api/events/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getEventCalendar = asyncHandler(async (req, res) => {
  const start = parseISODate(req.query.start);
  const end = parseISODate(req.query.end);
  if (!start || !end) throw ApiError.badRequest('A valid start and end date are required');
  if (end < start) throw ApiError.badRequest('End date must be on or after the start date');
  end.setHours(23, 59, 59, 999);

  const conditions = [{ isActive: true, date: { $gte: start, $lte: end } }];
  if (!VIEWER_ROLES.includes(req.user.role)) {
    conditions.push(buildApplicabilityFilter(req.user));
  }

  const events = await Event.find({ $and: conditions })
    .populate('organizer', PERSON_FIELDS)
    .populate('participants', PERSON_FIELDS);

  res.status(200).json({
    success: true,
    start: req.query.start,
    end: req.query.end,
    count: events.length,
    events: sortEvents(events).map(serializeEvent),
  });
});

// GET /api/events/:id
export const getEvent = asyncHandler(async (req, res) => {
  const event = await findEventOrFail(req.params.id);
  res.status(200).json({ success: true, event: serializeEvent(event) });
});

// POST /api/events
export const createEvent = asyncHandler(async (req, res) => {
  const date = parseISODate(req.body.date);
  if (!date) throw ApiError.badRequest('A valid event date (YYYY-MM-DD) is required');

  if (timeToMinutes(req.body.endTime) < timeToMinutes(req.body.startTime)) {
    throw ApiError.badRequest('End time must be after the start time');
  }

  const organizerId = req.body.organizer || req.user._id;
  const organizer = await User.findById(organizerId).select('_id isActive');
  if (!organizer || !organizer.isActive) throw ApiError.badRequest('Select a valid organizer');

  const participants = normalizeParticipants(req.body.participants);
  if (participants.length) {
    const count = await User.countDocuments({ _id: { $in: participants } });
    if (count !== participants.length) throw ApiError.badRequest('One or more participants are invalid');
  }

  const duplicate = await Event.findOne({ name: req.body.name.trim(), date });
  if (duplicate) throw ApiError.conflict('An event with this name already exists on this date');

  const event = await Event.create({
    name: req.body.name.trim(),
    date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    location: req.body.location.trim(),
    description: req.body.description?.trim() || '',
    organizer: organizerId,
    participants,
    type: req.body.type || 'COMPANY_EVENT',
    isPublic: Boolean(req.body.isPublic),
    isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
    createdBy: req.user._id,
  });

  const populated = await findEventOrFail(event._id);
  res
    .status(201)
    .json({ success: true, message: 'Event created', event: serializeEvent(populated) });
});

// PUT /api/events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');

  if (req.body.date !== undefined) {
    const date = parseISODate(req.body.date);
    if (!date) throw ApiError.badRequest('A valid event date (YYYY-MM-DD) is required');
    event.date = date;
  }
  if (req.body.name !== undefined) event.name = req.body.name.trim();
  if (req.body.startTime !== undefined) event.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) event.endTime = req.body.endTime;
  if (req.body.location !== undefined) event.location = req.body.location.trim();
  if (req.body.description !== undefined) event.description = req.body.description.trim();
  if (req.body.type !== undefined) event.type = req.body.type;
  if (req.body.isPublic !== undefined) event.isPublic = Boolean(req.body.isPublic);
  if (req.body.isActive !== undefined) event.isActive = Boolean(req.body.isActive);

  if (req.body.organizer !== undefined) {
    const organizer = await User.findById(req.body.organizer).select('_id isActive');
    if (!organizer || !organizer.isActive) throw ApiError.badRequest('Select a valid organizer');
    event.organizer = req.body.organizer;
  }

  if (req.body.participants !== undefined) {
    const participants = normalizeParticipants(req.body.participants);
    if (participants.length) {
      const count = await User.countDocuments({ _id: { $in: participants } });
      if (count !== participants.length) throw ApiError.badRequest('One or more participants are invalid');
    }
    event.participants = participants;
  }

  if (timeToMinutes(event.endTime) < timeToMinutes(event.startTime)) {
    throw ApiError.badRequest('End time must be after the start time');
  }

  const duplicate = await Event.findOne({
    _id: { $ne: event._id },
    name: event.name,
    date: event.date,
  });
  if (duplicate) throw ApiError.conflict('An event with this name already exists on this date');

  await event.save();
  const populated = await findEventOrFail(event._id);
  res
    .status(200)
    .json({ success: true, message: 'Event updated', event: serializeEvent(populated) });
});

// DELETE /api/events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await event.deleteOne();
  res.status(200).json({ success: true, message: 'Event deleted' });
});
