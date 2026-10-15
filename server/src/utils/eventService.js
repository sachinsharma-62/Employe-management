import { EVENT_TYPE_LABELS, EVENT_TYPES } from './enums.js';

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

// Renders "14:30" / "14:30:00" as "2:30 PM" for display purposes.
export const formatTime = (value) => {
  const match = String(value || '').match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!match) return String(value || '').trim();
  const hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${meridiem}`;
};

// Minutes from midnight for a "HH:MM" string, used for chronological sorting.
export const timeToMinutes = (value) => {
  const match = String(value || '').match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
};

const serializePerson = (person) => {
  if (!person) return null;
  if (typeof person !== 'object') return null;
  const rawId = person._id ?? person.id;
  const id = String(rawId ?? person);
  return {
    id,
    _id: id,
    fullName: [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Employee',
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    email: person.email || '',
    avatar: person.avatar || '',
    designation: person.designation || '',
    department: person.department || '',
  };
};

export const serializeEvent = (event) => {
  const doc = typeof event.toObject === 'function' ? event.toObject() : event;
  const date = new Date(doc.date);
  const valid = !Number.isNaN(date.getTime());

  const organizer = serializePerson(doc.organizer);
  const rawParticipants = Array.isArray(doc.participants) ? doc.participants : [];
  const participants = rawParticipants
    .map((participant) => serializePerson(participant) || { id: String(participant), _id: String(participant), fullName: 'Employee' })
    .filter(Boolean);

  return {
    ...doc,
    id: String(doc._id),
    organizer,
    participants,
    participantCount: participants.length,
    dateISO: valid ? toISODate(date) : '',
    dayName: valid ? DAY_NAMES[date.getDay()] : '',
    dayOfWeek: valid ? date.getDay() : null,
    weekend: valid ? isWeekend(date) : false,
    daysUntil: valid ? daysUntil(date) : null,
    isPast: valid ? daysUntil(date) < 0 : false,
    type: EVENT_TYPES.includes(doc.type) ? doc.type : 'COMPANY_EVENT',
    typeLabel: EVENT_TYPE_LABELS[doc.type] || doc.type,
    timeLabel: `${formatTime(doc.startTime)} – ${formatTime(doc.endTime)}`,
  };
};

// Events visible to a given user: managers/HR see everything, while regular
// employees only see public events or ones they organise / participate in.
export const buildApplicabilityFilter = (user) => ({
  $or: [
    { isPublic: true },
    { organizer: user?._id },
    { participants: user?._id },
  ],
});
