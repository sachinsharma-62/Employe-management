import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ATTENDANCE_STATUSES } from '../utils/enums.js';
import {
  computeAttendanceForSessions,
  computeStatusFromCheckIn,
  currentMonthKey,
  isWeekendDate,
  nowAsTime,
  round,
  timeToMinutes,
  toISODate,
  todayISO,
} from '../utils/attendance.js';
import {
  getAttendanceSettings,
  updateAttendanceSettings,
} from '../utils/attendanceSettings.js';
import { getHolidayTitle, getHolidaysForYear } from '../utils/holidays.js';

const EMPLOYEE_FIELDS = 'firstName lastName employeeId email designation department avatar';
const DECIDER_FIELDS = 'firstName lastName avatar designation';
const WORKING_STATUSES = new Set(['PRESENT', 'LATE', 'WFH', 'HALF_DAY']);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseISODate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const durationMinutes = (checkIn, checkOut) => {
  const start = timeToMinutes(checkIn);
  const end = timeToMinutes(checkOut);
  return start !== null && end !== null && end >= start ? end - start : null;
};

const serializeSessions = (sessions) =>
  (sessions || []).map((session) => ({
    checkIn: session.checkIn || '',
    checkOut: session.checkOut || '',
    minutes: durationMinutes(session.checkIn, session.checkOut),
  }));

// Plain-object view of an attendance record with its per-session history and
// derived first/last/count/total fields used by the dashboard and admin panel.
const serializeAttendance = (record) => {
  if (!record) return null;
  const doc = typeof record.toObject === 'function' ? record.toObject() : record;
  const sessions = serializeSessions(doc.sessions);
  const completed = sessions.filter((session) => session.minutes !== null);
  const firstCheckIn = sessions.find((session) => session.checkIn)?.checkIn || doc.checkIn || '';
  const lastCheckOut =
    [...sessions].reverse().find((session) => session.checkOut)?.checkOut || doc.checkOut || '';
  const openSession = sessions.find((session) => session.checkIn && !session.checkOut) || null;
  return {
    ...doc,
    sessions,
    sessionCount: sessions.length,
    completedSessions: completed.length,
    firstCheckIn,
    lastCheckOut,
    openSession,
    workedMinutes: doc.workedMinutes ?? Math.round((doc.hoursWorked || 0) * 60),
  };
};

const getTodayRange = () => {
  const start = startOfToday();
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start, end };
};

const resolveRange = ({ month, from, to }) => {
  if (from || to) {
    const start = from ? parseISODate(from) : null;
    const rawEnd = to ? parseISODate(to) : null;
    const end = rawEnd ? new Date(rawEnd.getFullYear(), rawEnd.getMonth(), rawEnd.getDate() + 1) : null;
    return { start, end };
  }
  if (month) {
    const [year, m] = month.split('-').map(Number);
    return { start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
  }
  return { start: null, end: null };
};

const buildTodayInfo = async (employeeId) => {
  const { start, end } = getTodayRange();
  const record = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: start, $lt: end },
  });
  const iso = todayISO();
  const serialized = serializeAttendance(record);
  // Derive the available action from the open session itself, so the UI always
  // offers Clock-out while a session is open (even if legacy fields disagree).
  const hasOpenSession = Boolean(serialized?.openSession);
  return {
    date: iso,
    weekday: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
    isWeekend: start.getDay() === 0 || start.getDay() === 6,
    holiday: getHolidayTitle(iso) || '',
    record: serialized,
    canCheckIn: !hasOpenSession,
    canCheckOut: hasOpenSession,
  };
};

const buildMonthData = async (employeeId, month, settings) => {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  const [records, corrections] = await Promise.all([
    Attendance.find({ employee: employeeId, date: { $gte: start, $lt: end } }),
    AttendanceCorrection.find({ employee: employeeId, status: 'PENDING' }).select('date requestedStatus'),
  ]);

  const byDate = new Map(records.map((r) => [toISODate(r.date), r]));
  const pendingByDate = new Map(corrections.map((c) => [toISODate(c.date), c.requestedStatus]));

  const daysInMonth = new Date(year, m, 0).getDate();
  const todayKey = todayISO();
  const todayStart = startOfToday();
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && m === now.getMonth() + 1;
  const isFutureMonth =
    year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth() + 1);
  // Only expose days up to today; never render future days in the attendance log.
  const lastVisibleDay = isFutureMonth ? 0 : isCurrentMonth ? now.getDate() : daysInMonth;
  const counts = { PRESENT: 0, LATE: 0, WFH: 0, HALF_DAY: 0, ABSENT: 0, LEAVE: 0, HOLIDAY: 0, NOT_CLOCKED_IN: 0 };
  const days = [];
  const holidays = [];
  let weekendCount = 0;
  let holidayCount = 0;
  let expectedDays = 0;
  let totalHours = 0;
  let totalLate = 0;
  let totalOvertime = 0;
  let totalBreak = 0;
  let totalShort = 0;

  for (let d = 1; d <= lastVisibleDay; d += 1) {
    const date = new Date(year, m - 1, d);
    const iso = toISODate(date);
    const isWeekend = isWeekendDate(date, settings);
    const holidayTitle = getHolidayTitle(iso);
    const rec = byDate.get(iso);
    const isPast = date.getTime() < todayStart.getTime();

    let status = rec?.status || null;
    if (!status && holidayTitle) status = 'HOLIDAY';
    if (!status && !isWeekend && !holidayTitle && isPast) status = 'ABSENT';
    if (!status && iso === todayKey && !isWeekend && !holidayTitle) status = 'NOT_CLOCKED_IN';

    if (isWeekend) weekendCount += 1;
    if (status === 'HOLIDAY') holidayCount += 1;
    if (!isWeekend && !holidayTitle) expectedDays += 1;
    if (status) counts[status] = (counts[status] || 0) + 1;
    if (holidayTitle) holidays.push({ date: iso, title: holidayTitle });

    totalHours += rec?.hoursWorked || 0;
    totalLate += rec?.lateMinutes || 0;
    totalOvertime += rec?.overtimeMinutes || 0;
    totalBreak += rec?.breakMinutes || 0;
    totalShort += rec?.shortMinutes || 0;

    days.push({
      date: iso,
      day: d,
      isWeekend,
      isToday: iso === todayKey,
      holiday: holidayTitle || '',
      status: status || (isWeekend ? 'WEEKLY_OFF' : 'NOT_CLOCKED_IN'),
      pendingCorrection: pendingByDate.get(iso) || '',
      checkIn: rec?.checkIn || '',
      checkOut: rec?.checkOut || '',
      sessions: serializeSessions(rec?.sessions),
      sessionCount: rec?.sessions?.length || 0,
      workMode: rec?.workMode || 'OFFICE',
      hoursWorked: rec?.hoursWorked || 0,
      lateMinutes: rec?.lateMinutes || 0,
      overtimeMinutes: rec?.overtimeMinutes || 0,
      breakMinutes: rec?.breakMinutes || 0,
      shortMinutes: rec?.shortMinutes || 0,
      note: rec?.note || '',
    });
  }

  const credited = counts.PRESENT + counts.WFH + counts.LATE + counts.HALF_DAY * 0.5;
  const percentage = expectedDays > 0 ? Math.round((credited / expectedDays) * 1000) / 10 : 0;

  const stats = {
    ym: month,
    daysInMonth,
    weekendCount,
    holidayCount,
    expectedDays,
    counts,
    totalHours: round(totalHours),
    lateMinutes: round(totalLate),
    overtimeMinutes: round(totalOvertime),
    breakMinutes: round(totalBreak),
    shortMinutes: round(totalShort),
    percentage,
  };

  return { days, stats, holidays };
};

// GET /api/attendance/me
export const getMyMonth = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonthKey();
  const settings = await getAttendanceSettings();
  const [today, monthData, pendingCorrections] = await Promise.all([
    buildTodayInfo(req.user._id),
    buildMonthData(req.user._id, month, settings),
    AttendanceCorrection.countDocuments({ employee: req.user._id, status: 'PENDING' }),
  ]);

  res.status(200).json({
    success: true,
    month,
    today,
    settings,
    pendingCorrections,
    ...monthData,
  });
});

// POST /api/attendance/check-in
export const checkIn = asyncHandler(async (req, res) => {
  const { start, end } = getTodayRange();
  const mode = req.body.mode || 'OFFICE';
  const existing = await Attendance.findOne({ employee: req.user._id, date: { $gte: start, $lt: end } });

  const sessions = Array.isArray(existing?.sessions)
    ? existing.sessions.map((s) => ({
        checkIn: s.checkIn,
        checkOut: s.checkOut || '',
        checkInTime: s.checkInTime || null,
        checkOutTime: s.checkOutTime || null,
      }))
    : [];

  if (existing?.checkIn && sessions.length === 0) {
    sessions.push({
      checkIn: existing.checkIn,
      checkOut: existing.checkOut || '',
      checkInTime: existing.createdAt || null,
      checkOutTime: existing.checkOut ? existing.updatedAt : null,
    });
  }

  const openSession = sessions.find(
    (session) => timeToMinutes(session.checkIn) !== null && !session.checkOut
  );
  if (openSession) {
    throw ApiError.conflict('You are already clocked in. Clock out first to start a new session.');
  }

  const settings = await getAttendanceSettings();
  const now = new Date();
  const time = nowAsTime(now);
  sessions.push({ checkIn: time, checkOut: '', checkInTime: now, checkOutTime: null });

  const status = computeStatusFromCheckIn({ mode });
  const summary = computeAttendanceForSessions({ sessions, status, settings });

  let record = existing;
  if (record) {
    record.status = status;
    record.workMode = mode;
    record.sessions = sessions;
    record.checkIn = sessions[0].checkIn;
    record.checkOut = '';
    Object.assign(record, summary);
  } else {
    record = new Attendance({
      employee: req.user._id,
      date: start,
      status,
      workMode: mode,
      sessions,
      checkIn: sessions[0].checkIn,
      checkOut: '',
      ...summary,
    });
  }
  await record.save();

  res.status(201).json({
    success: true,
    message: 'Checked in successfully',
    record,
    canCheckIn: false,
    canCheckOut: true,
  });
});

// POST /api/attendance/check-out
export const checkOut = asyncHandler(async (req, res) => {
  const { start, end } = getTodayRange();
  const record = await Attendance.findOne({ employee: req.user._id, date: { $gte: start, $lt: end } });
  if (!record || !record.checkIn) {
    throw ApiError.conflict('You are not clocked in right now.');
  }

  const sessions = Array.isArray(record.sessions)
    ? record.sessions.map((s) => ({
        checkIn: s.checkIn,
        checkOut: s.checkOut || '',
        checkInTime: s.checkInTime || null,
        checkOutTime: s.checkOutTime || null,
      }))
    : [];

  if (sessions.length === 0) {
    sessions.push({
      checkIn: record.checkIn,
      checkOut: record.checkOut || '',
      checkInTime: record.createdAt || null,
      checkOutTime: record.checkOut ? record.updatedAt : null,
    });
  }

  const openSession = sessions.find(
    (session) => timeToMinutes(session.checkIn) !== null && !session.checkOut
  );
  if (!openSession) {
    throw ApiError.conflict('You are not clocked in right now.');
  }

  const settings = await getAttendanceSettings();
  const now = new Date();
  const time = nowAsTime(now);
  openSession.checkOut = time;
  openSession.checkOutTime = now;
  record.sessions = sessions;
  record.checkOut = time;
  if (req.body.note) record.note = req.body.note.trim();
  Object.assign(record, computeAttendanceForSessions({ sessions, status: record.status, settings }));
  await record.save();

  res.status(200).json({
    success: true,
    message: 'Checked out successfully',
    record,
    canCheckIn: true,
    canCheckOut: false,
  });
});

// GET /api/attendance/me/corrections
export const getMyCorrections = asyncHandler(async (req, res) => {
  const corrections = await AttendanceCorrection.find({ employee: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ success: true, corrections });
});

// POST /api/attendance/me/corrections
export const requestCorrection = asyncHandler(async (req, res) => {
  const date = parseISODate(req.body.date);
  if (!date) throw ApiError.badRequest('Invalid date');
  if (date.getTime() > startOfToday().getTime()) {
    throw ApiError.badRequest('Cannot request a correction for a future date');
  }

  const existing = await Attendance.findOne({ employee: req.user._id, date });

  const correction = await AttendanceCorrection.create({
    employee: req.user._id,
    date,
    currentStatus: existing?.status || 'ABSENT',
    requestedStatus: req.body.requestedStatus || 'PRESENT',
    requestedCheckIn: req.body.requestedCheckIn || '',
    requestedCheckOut: req.body.requestedCheckOut || '',
    reason: req.body.reason.trim(),
  });

  res.status(201).json({ success: true, message: 'Correction requested', correction });
});

// GET /api/attendance
export const listAttendance = asyncHandler(async (req, res) => {
  const { search, department, status, month, from, to, employeeId } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const filter = {};

  if (status) filter.status = status;
  if (employeeId) filter.employee = employeeId;

  if (!employeeId && (search || department)) {
    const userFilter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      userFilter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
    }
    if (department) userFilter.department = department;
    const ids = await User.find(userFilter).select('_id');
    filter.employee = { $in: ids.map((u) => u._id) };
  }

  if (month || from || to) {
    const { start, end } = resolveRange({ month, from, to });
    if (start) filter.date = { ...(filter.date || {}), $gte: start };
    if (end) filter.date = { ...(filter.date || {}), $lt: end };
  }

  const [total, records, summaryRows] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', EMPLOYEE_FIELDS),
    Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          hours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
          late: { $sum: { $ifNull: ['$lateMinutes', 0] } },
          overtime: { $sum: { $ifNull: ['$overtimeMinutes', 0] } },
          short: { $sum: { $ifNull: ['$shortMinutes', 0] } },
        },
      },
    ]),
  ]);

  const counts = {};
  let totalHours = 0;
  let totalLate = 0;
  let totalOvertime = 0;
  let totalShort = 0;
  for (const s of ATTENDANCE_STATUSES) counts[s] = 0;
  summaryRows.forEach((row) => {
    counts[row._id] = row.count;
    totalHours += row.hours;
    totalLate += row.late;
    totalOvertime += row.overtime;
    totalShort += row.short;
  });

  res.status(200).json({
    success: true,
    records: records.map(serializeAttendance),
    summary: {
      counts,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      totalHours: round(totalHours),
      lateMinutes: round(totalLate),
      overtimeMinutes: round(totalOvertime),
      shortMinutes: round(totalShort),
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/attendance/roster?date=&search=&department=&status=
// Per-employee clock-in roster for a single day: lists every active employee
// (whether or not they clocked in) so absentees show as "Not clock in".
export const listRoster = asyncHandler(async (req, res) => {
  const base = req.query.date ? parseISODate(req.query.date) : startOfToday();
  if (!base) throw ApiError.badRequest('Invalid date');
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const { search, department, status } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const userFilter = { isActive: true };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    userFilter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
  }
  if (department) userFilter.department = department;

  const users = await User.find(userFilter)
    .select(EMPLOYEE_FIELDS)
    .sort({ firstName: 1, lastName: 1 });

  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const records = await Attendance.find({
    date: { $gte: date, $lt: end },
    employee: { $in: users.map((u) => u._id) },
  });
  const byEmployee = new Map(records.map((r) => [String(r.employee), r]));

  const settings = await getAttendanceSettings();
  const iso = toISODate(date);
  const isWeekend = isWeekendDate(date, settings);
  const holiday = getHolidayTitle(iso) || '';

  let roster = users.map((user) => {
    const serialized = serializeAttendance(byEmployee.get(String(user._id)));
    let entryStatus = serialized?.status;
    if (!serialized?.sessionCount && (!entryStatus || WORKING_STATUSES.has(entryStatus))) {
      entryStatus = holiday ? 'HOLIDAY' : isWeekend ? 'WEEKLY_OFF' : 'NOT_CLOCKED_IN';
    }
    if (!entryStatus) entryStatus = 'NOT_CLOCKED_IN';
    return {
      employee: user,
      date: iso,
      hasRecord: Boolean(serialized),
      status: entryStatus,
      record: serialized,
      firstCheckIn: serialized?.firstCheckIn || '',
      lastCheckOut: serialized?.lastCheckOut || '',
      sessions: serialized?.sessions || [],
      sessionCount: serialized?.sessionCount || 0,
      openSession: serialized?.openSession || null,
      hoursWorked: serialized?.hoursWorked || 0,
      workedMinutes: serialized?.workedMinutes || 0,
    };
  });

  if (status) roster = roster.filter((entry) => entry.status === status);

  const total = roster.length;
  const paged = roster.slice((page - 1) * limit, (page - 1) * limit + limit);

  const counts = {};
  let clockedIn = 0;
  let notClockedIn = 0;
  roster.forEach((entry) => {
    counts[entry.status] = (counts[entry.status] || 0) + 1;
    if (entry.sessionCount > 0) clockedIn += 1;
    if (entry.status === 'NOT_CLOCKED_IN') notClockedIn += 1;
  });

  res.status(200).json({
    success: true,
    date: iso,
    isWeekend,
    holiday,
    records: paged,
    summary: {
      totalEmployees: total,
      clockedIn,
      notClockedIn,
      counts,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/attendance/calendar?month=&employeeId=
export const getCalendar = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonthKey();
  const employeeId = req.query.employeeId || req.user._id;
  const settings = await getAttendanceSettings();
  const [monthData, employee] = await Promise.all([
    buildMonthData(employeeId, month, settings),
    User.findById(employeeId).select(EMPLOYEE_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    month,
    employee,
    settings,
    ...monthData,
  });
});

// GET /api/attendance/holidays?year=
export const listHolidays = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  res.status(200).json({ success: true, ...getHolidaysForYear(year) });
});

// GET /api/attendance/settings
export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await getAttendanceSettings();
  res.status(200).json({ success: true, settings });
});

// PUT /api/attendance/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await updateAttendanceSettings(req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Attendance settings updated', settings });
});

// GET /api/attendance/corrections
export const listCorrections = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const filter = status ? { status } : {};

  const [total, corrections] = await Promise.all([
    AttendanceCorrection.countDocuments(filter),
    AttendanceCorrection.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', EMPLOYEE_FIELDS)
      .populate('decidedBy', DECIDER_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    corrections,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// POST /api/attendance/corrections/:id/approve
export const approveCorrection = asyncHandler(async (req, res) => {
  const correction = await AttendanceCorrection.findById(req.params.id);
  if (!correction) throw ApiError.notFound('Correction not found');
  if (correction.status !== 'PENDING') {
    throw ApiError.conflict('This correction has already been decided');
  }

  let record = await Attendance.findOne({ employee: correction.employee, date: correction.date });
  if (!record) {
    record = new Attendance({ employee: correction.employee, date: correction.date });
  }

  const settings = await getAttendanceSettings();
  if (correction.requestedStatus) record.status = correction.requestedStatus;
  if (correction.requestedCheckIn) record.checkIn = correction.requestedCheckIn;
  if (correction.requestedCheckOut) record.checkOut = correction.requestedCheckOut;
  const sessions = [{ checkIn: record.checkIn, checkOut: record.checkOut }];
  record.sessions = sessions;
  Object.assign(
    record,
    computeAttendanceForSessions({ sessions, status: record.status, settings })
  );
  await record.save();

  correction.status = 'APPROVED';
  correction.decidedBy = req.user._id;
  correction.decidedAt = new Date();
  correction.decisionNote = req.body.note?.trim() || 'Approved';
  await correction.save();

  res.status(200).json({
    success: true,
    message: 'Correction approved',
    correction,
    attendance: serializeAttendance(record),
  });
});

// POST /api/attendance/corrections/:id/reject
export const rejectCorrection = asyncHandler(async (req, res) => {
  const correction = await AttendanceCorrection.findById(req.params.id);
  if (!correction) throw ApiError.notFound('Correction not found');
  if (correction.status !== 'PENDING') {
    throw ApiError.conflict('This correction has already been decided');
  }

  correction.status = 'REJECTED';
  correction.decidedBy = req.user._id;
  correction.decidedAt = new Date();
  correction.decisionNote = req.body.note?.trim() || 'Rejected';
  await correction.save();

  res.status(200).json({
    success: true,
    message: 'Correction rejected',
    correction,
  });
});

// GET /api/attendance/:id
export const getAttendanceDetail = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id).populate('employee', EMPLOYEE_FIELDS);
  if (!record) throw ApiError.notFound('Attendance record not found');
  res.status(200).json({ success: true, record: serializeAttendance(record) });
});

// PATCH /api/attendance/:id
export const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw ApiError.notFound('Attendance record not found');

  const settings = await getAttendanceSettings();
  const { status, workMode, checkIn, checkOut, hoursWorked, note } = req.body;
  if (status) record.status = status;
  if (workMode) record.workMode = workMode;
  if (checkIn !== undefined) record.checkIn = checkIn;
  if (checkOut !== undefined) record.checkOut = checkOut;
  if (note !== undefined) record.note = note;

  if (checkIn !== undefined || checkOut !== undefined || status !== undefined) {
    const sessions = [{ checkIn: record.checkIn, checkOut: record.checkOut }];
    record.sessions = sessions;
    Object.assign(
      record,
      computeAttendanceForSessions({ sessions, status: record.status, settings })
    );
  }
  if (hoursWorked !== undefined) {
    record.hoursWorked = hoursWorked;
    record.workedMinutes = Math.round(hoursWorked * 60);
  }

  await record.save();
  const populated = await record.populate('employee', EMPLOYEE_FIELDS);

  res.status(200).json({
    success: true,
    message: 'Attendance updated',
    record: serializeAttendance(populated),
  });
});
