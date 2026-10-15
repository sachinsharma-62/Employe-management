import Holiday from '../models/Holiday.js';
import Location from '../models/Location.js';
import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  buildApplicabilityFilter,
  parseISODate,
  resolveYear,
  serializeHoliday,
  startOfDay,
} from '../utils/holidayService.js';

const VIEWER_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeTargeting = (scope, locations = [], departments = []) => {
  if (scope === 'LOCATIONS') {
    const list = [...new Set(locations.map((item) => String(item).trim()).filter(Boolean))];
    if (list.length === 0) throw ApiError.badRequest('Select at least one location');
    return { scope, locations: list, departments: [] };
  }
  if (scope === 'DEPARTMENTS') {
    const list = [...new Set(departments.map((item) => String(item).trim()).filter(Boolean))];
    if (list.length === 0) throw ApiError.badRequest('Select at least one department');
    return { scope, locations: [], departments: list };
  }
  return { scope: 'ALL', locations: [], departments: [] };
};

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
  } else if (year) {
    conditions.push({ date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });
  }

  if (query.type) conditions.push({ type: query.type });
  if (query.optional !== undefined) conditions.push({ optional: query.optional });
  if (query.location) {
    conditions.push({ $or: [{ scope: 'ALL' }, { locations: query.location }] });
  }
  if (query.department) {
    conditions.push({ $or: [{ scope: 'ALL' }, { departments: query.department }] });
  }
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    conditions.push({ $or: [{ name: rx }, { description: rx }] });
  }

  return conditions.length ? { $and: conditions } : {};
};

// GET /api/holidays
export const listHolidays = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, req.user);
  const holidays = await Holiday.find(filter).sort({ date: 1, name: 1 });
  res.status(200).json({
    success: true,
    year: resolveYear(req.query.year),
    count: holidays.length,
    holidays: holidays.map(serializeHoliday),
  });
});

// GET /api/holidays/meta
export const getHolidayMeta = asyncHandler(async (_req, res) => {
  const [locations, departments] = await Promise.all([
    Location.find({ isActive: true }).select('name').sort('name'),
    Department.find({ isActive: true }).select('name').sort('name'),
  ]);
  res.status(200).json({
    success: true,
    locations: locations.map((location) => location.name),
    departments: departments.map((department) => department.name),
  });
});

// GET /api/holidays/upcoming?limit=
export const getUpcomingHolidays = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
  const conditions = [{ isActive: true, date: { $gte: startOfDay(new Date()) } }];
  if (!VIEWER_ROLES.includes(req.user.role)) {
    conditions.push(buildApplicabilityFilter(req.user));
  }

  const holidays = await Holiday.find({ $and: conditions }).sort({ date: 1 }).limit(limit);
  res.status(200).json({
    success: true,
    holidays: holidays.map(serializeHoliday),
  });
});

// GET /api/holidays/:id
export const getHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw ApiError.notFound('Holiday not found');
  res.status(200).json({ success: true, holiday: serializeHoliday(holiday) });
});

// POST /api/holidays
export const createHoliday = asyncHandler(async (req, res) => {
  const date = parseISODate(req.body.date);
  if (!date) throw ApiError.badRequest('A valid holiday date (YYYY-MM-DD) is required');

  const duplicate = await Holiday.findOne({ name: req.body.name.trim(), date });
  if (duplicate) throw ApiError.conflict('A holiday with this name already exists on this date');

  const targeting = normalizeTargeting(
    req.body.scope || 'ALL',
    req.body.locations || [],
    req.body.departments || []
  );

  const holiday = await Holiday.create({
    name: req.body.name.trim(),
    date,
    type: req.body.type || 'NATIONAL',
    optional: Boolean(req.body.optional),
    description: req.body.description?.trim() || '',
    ...targeting,
    isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
    createdBy: req.user._id,
  });

  res
    .status(201)
    .json({ success: true, message: 'Holiday created', holiday: serializeHoliday(holiday) });
});

// PUT /api/holidays/:id
export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw ApiError.notFound('Holiday not found');

  if (req.body.date !== undefined) {
    const date = parseISODate(req.body.date);
    if (!date) throw ApiError.badRequest('A valid holiday date (YYYY-MM-DD) is required');
    holiday.date = date;
  }
  if (req.body.name !== undefined) holiday.name = req.body.name.trim();
  if (req.body.type !== undefined) holiday.type = req.body.type;
  if (req.body.optional !== undefined) holiday.optional = Boolean(req.body.optional);
  if (req.body.description !== undefined) holiday.description = req.body.description.trim();
  if (req.body.isActive !== undefined) holiday.isActive = Boolean(req.body.isActive);

  const nextScope = req.body.scope !== undefined ? req.body.scope : holiday.scope;
  if (
    req.body.scope !== undefined ||
    req.body.locations !== undefined ||
    req.body.departments !== undefined
  ) {
    const targeting = normalizeTargeting(
      nextScope,
      req.body.locations !== undefined ? req.body.locations : holiday.locations,
      req.body.departments !== undefined ? req.body.departments : holiday.departments
    );
    Object.assign(holiday, targeting);
  }

  const duplicate = await Holiday.findOne({
    _id: { $ne: holiday._id },
    name: holiday.name,
    date: holiday.date,
  });
  if (duplicate) throw ApiError.conflict('A holiday with this name already exists on this date');

  await holiday.save();
  res
    .status(200)
    .json({ success: true, message: 'Holiday updated', holiday: serializeHoliday(holiday) });
});

// DELETE /api/holidays/:id
export const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw ApiError.notFound('Holiday not found');
  await holiday.deleteOne();
  res.status(200).json({ success: true, message: 'Holiday deleted' });
});
