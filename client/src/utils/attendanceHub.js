// Attendance Hub — date/time helpers, calculations and option builders.

export const WEEKDAY_TABS = [
  { key: 1, label: 'M', name: 'Monday' },
  { key: 2, label: 'T', name: 'Tuesday' },
  { key: 3, label: 'W', name: 'Wednesday' },
  { key: 4, label: 'T', name: 'Thursday' },
  { key: 5, label: 'F', name: 'Friday' },
  { key: 6, label: 'S', name: 'Saturday' },
  { key: 0, label: 'S', name: 'Sunday' },
];

export const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const RANGE_OPTIONS = [
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

export const REQUEST_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

// ---------------- date helpers ----------------

export const pad2 = (n) => String(n).padStart(2, '0');

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const fromDateKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

export const addMonths = (monthKey, delta) => {
  const [year, month] = String(monthKey).split('-').map(Number);
  return currentMonthKey(new Date(year, month - 1 + delta, 1));
};

export const monthShortLabel = (monthKey) => {
  const [, month] = String(monthKey).split('-').map(Number);
  return MONTH_SHORT[(month - 1 + 12) % 12];
};

export const monthLongLabel = (monthKey) => {
  const [year, month] = String(monthKey).split('-').map(Number);
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[(month - 1 + 12) % 12]} ${year}`;
};

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const weekdayName = (date) => WEEKDAY_NAMES[date.getDay()];

export const formatDateLabel = (date) =>
  `${weekdayName(date).slice(0, 3)}, ${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;

export const formatLongDate = (date) =>
  `${weekdayName(date)}, ${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}`;

// ---------------- time helpers ----------------

export const parseClock = (value) => {
  const [h, m] = String(value).split(':').map(Number);
  return h * 60 + m;
};

export const minutesToHM = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
};

export const minutesToClock = (minutes, use24 = true) => {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  let h = Math.floor(safe / 60);
  const m = pad2(safe % 60);
  if (use24) return `${pad2(h)}:${m}`;
  const mer = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${mer}`;
};

export const clockParts = (date, use24) => {
  let h = date.getHours();
  const mer = h >= 12 ? 'PM' : 'AM';
  if (!use24) h = h % 12 || 12;
  return {
    hours: use24 ? pad2(date.getHours()) : String(h),
    minutes: pad2(date.getMinutes()),
    seconds: pad2(date.getSeconds()),
    meridiem: use24 ? '' : mer,
  };
};

// ---------------- calculations ----------------

export function computeStats(logs) {
  const working = logs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE');
  if (working.length === 0) return { avgMinutes: 0, onTimePct: 0, days: 0 };
  const total = working.reduce((sum, l) => sum + l.effectiveMinutes, 0);
  const onTime = working.filter((l) => l.lateMinutes === 0).length;
  return {
    avgMinutes: Math.round(total / working.length),
    onTimePct: Math.round((onTime / working.length) * 100),
    days: working.length,
  };
}

export function rangeBounds(range, custom) {
  const today = startOfToday();
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = addDays(today, -mondayOffset);

  switch (range) {
    case 'this-week':
      return { from: thisMonday, to: addDays(thisMonday, 6) };
    case 'last-week': {
      const monday = addDays(thisMonday, -7);
      return { from: monday, to: addDays(monday, 6) };
    }
    case 'custom':
      return {
        from: custom?.from ? fromDateKey(custom.from) : thisMonday,
        to: custom?.to ? fromDateKey(custom.to) : today,
      };
    case 'this-month':
    default:
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
  }
}

export function filterLogsByRange(logs, from, to) {
  const f = toDateKey(from);
  const t = toDateKey(to);
  return logs.filter((l) => l.date >= f && l.date <= t);
}

export function monthOptions(count = 6) {
  const options = [];
  const base = currentMonthKey();
  for (let i = 0; i < count; i += 1) {
    const key = addMonths(base, -i);
    options.push({ key, label: monthShortLabel(key), long: monthLongLabel(key) });
  }
  return options;
}
