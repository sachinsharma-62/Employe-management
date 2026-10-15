export const SETTINGS_DEFAULTS = Object.freeze({
  officeStart: '09:30',
  officeEnd: '18:30',
  graceMinutes: 15,
  requiredWorkHours: 8,
  breakMinutes: 60,
  breakThresholdHours: 6,
  weekendDays: [0, 6],
});

// Business hours fallbacks kept for backwards compatibility.
export const SHIFT_START_MINUTES = 9 * 60 + 30;
export const SHIFT_END_MINUTES = 18 * 60 + 30;
export const GRACE_MINUTES = 15;
export const BREAK_MINUTES = 60;
export const BREAK_THRESHOLD_MINUTES = 6 * 60;

export const toISODate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayISO = () => toISODate(new Date());

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const timeToMinutes = (time) => {
  if (!time || typeof time !== 'string') return null;
  const match = time.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const minutesToTime = (minutes) => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const nowAsTime = (date = new Date()) =>
  minutesToTime(date.getHours() * 60 + date.getMinutes());

export const round = (value) => Math.round(value * 100) / 100;

const resolveSettings = (settings = {}) => ({
  startMin: timeToMinutes(settings.officeStart) ?? SHIFT_START_MINUTES,
  endMin: timeToMinutes(settings.officeEnd) ?? SHIFT_END_MINUTES,
  graceMinutes: settings.graceMinutes ?? GRACE_MINUTES,
  breakMinutes: settings.breakMinutes ?? BREAK_MINUTES,
  breakThresholdMinutes:
    (settings.breakThresholdHours ?? SETTINGS_DEFAULTS.breakThresholdHours) * 60,
  requiredMinutes:
    (settings.requiredWorkHours ?? SETTINGS_DEFAULTS.requiredWorkHours) * 60,
  weekendDays: Array.isArray(settings.weekendDays) ? settings.weekendDays : SETTINGS_DEFAULTS.weekendDays,
});

export const isWeekendDate = (date, settings) => {
  const { weekendDays } = resolveSettings(settings);
  return weekendDays.includes(date.getDay());
};

export const computeLateMinutes = (checkIn, settings) => {
  const inMin = timeToMinutes(checkIn);
  if (inMin === null) return 0;
  const { startMin, graceMinutes } = resolveSettings(settings);
  return Math.max(0, inMin - (startMin + graceMinutes));
};

const NON_WORKING_STATUSES = ['ABSENT', 'LEAVE', 'HOLIDAY'];

export const computeAttendance = ({ checkIn, checkOut, status, settings }) => {
  const base = {
    hoursWorked: 0,
    lateMinutes: computeLateMinutes(checkIn, settings),
    overtimeMinutes: 0,
    breakMinutes: 0,
    shortMinutes: 0,
  };
  const inMin = timeToMinutes(checkIn);
  const outMin = timeToMinutes(checkOut);
  if (inMin === null || outMin === null || outMin < inMin) return base;

  const { endMin, breakMinutes: configuredBreak, breakThresholdMinutes, requiredMinutes } =
    resolveSettings(settings);
  const span = outMin - inMin;
  const breakMinutes = span >= breakThresholdMinutes ? configuredBreak : 0;
  const workedMinutes = Math.max(0, span - breakMinutes);
  const overtimeMinutes = status === 'HALF_DAY' ? 0 : Math.max(0, outMin - endMin);
  const shortMinutes = NON_WORKING_STATUSES.includes(status)
    ? 0
    : Math.max(0, requiredMinutes - workedMinutes);

  return {
    hoursWorked: round(workedMinutes / 60),
    lateMinutes: base.lateMinutes,
    overtimeMinutes,
    breakMinutes,
    shortMinutes,
  };
};

export const computeStatusFromCheckIn = ({ mode = 'OFFICE' }) =>
  mode === 'WFH' ? 'WFH' : 'PRESENT';

// Aggregates worked time across multiple clock-in/clock-out cycles in a day.
// Working time is the sum of each completed session's duration; the gaps
// between a clock-out and the next clock-in are treated as break and are not
// counted as working time.
export const computeAttendanceForSessions = ({ sessions = [], status, settings }) => {
  const completed = sessions.filter(
    (session) => timeToMinutes(session.checkIn) !== null && timeToMinutes(session.checkOut) !== null
  );
  const firstSession = sessions.find((session) => timeToMinutes(session.checkIn) !== null);
  const lateMinutes = computeLateMinutes(firstSession?.checkIn, settings);

  if (completed.length === 0) {
    return {
      workedMinutes: 0,
      hoursWorked: 0,
      lateMinutes,
      overtimeMinutes: 0,
      breakMinutes: 0,
      shortMinutes: 0,
    };
  }

  const { endMin, requiredMinutes } = resolveSettings(settings);
  const workedMinutes = completed.reduce(
    (sum, session) => sum + (timeToMinutes(session.checkOut) - timeToMinutes(session.checkIn)),
    0
  );
  const firstIn = timeToMinutes(completed[0].checkIn);
  const lastOut = timeToMinutes(completed[completed.length - 1].checkOut);
  const breakMinutes = Math.max(0, lastOut - firstIn - workedMinutes);
  const overtimeMinutes =
    status === 'HALF_DAY' ? 0 : Math.max(0, lastOut - endMin);
  const shortMinutes = NON_WORKING_STATUSES.includes(status)
    ? 0
    : Math.max(0, requiredMinutes - workedMinutes);

  return {
    workedMinutes,
    hoursWorked: round(workedMinutes / 60),
    lateMinutes,
    overtimeMinutes,
    breakMinutes,
    shortMinutes,
  };
};
