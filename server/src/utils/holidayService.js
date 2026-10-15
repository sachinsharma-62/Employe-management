import { HOLIDAY_SCOPE_LABELS, HOLIDAY_TYPE_LABELS } from './enums.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const parseISODate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const toISODate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const resolveYear = (value) => {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100) return year;
  return new Date().getFullYear();
};

export const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const daysUntil = (value) => {
  const target = startOfDay(value);
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
};

export const isWeekend = (value) => {
  const day = new Date(value).getDay();
  return day === 0 || day === 6;
};

export const serializeHoliday = (holiday) => {
  const doc = typeof holiday.toObject === 'function' ? holiday.toObject() : holiday;
  const date = new Date(doc.date);
  const valid = !Number.isNaN(date.getTime());
  return {
    ...doc,
    id: String(doc._id),
    dateISO: valid ? toISODate(date) : '',
    dayName: valid ? DAY_NAMES[date.getDay()] : '',
    dayOfWeek: valid ? date.getDay() : null,
    weekend: valid ? isWeekend(date) : false,
    daysUntil: valid ? daysUntil(date) : null,
    typeLabel: HOLIDAY_TYPE_LABELS[doc.type] || doc.type,
    scopeLabel: HOLIDAY_SCOPE_LABELS[doc.scope] || doc.scope,
  };
};

// Holidays visible to a given employee based on location/department targeting.
export const buildApplicabilityFilter = (employee) => ({
  $or: [
    { scope: 'ALL' },
    { scope: 'LOCATIONS', locations: employee?.workLocation || '__none__' },
    { scope: 'DEPARTMENTS', departments: employee?.department || '__none__' },
  ],
});

export const groupByMonth = (holidays) =>
  holidays.reduce((acc, holiday) => {
    const key = holiday.dateISO.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(holiday);
    return acc;
  }, {});
