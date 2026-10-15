import AppSetting from '../models/AppSetting.js';
import COMPANY from '../config/company.js';

// Centralised defaults for every settings category. New sections are added
// here only — the store stays generic.
export const SETTINGS_DEFAULTS = {
  company: {
    name: COMPANY.name,
    tagline: '',
    logo: '',
    email: COMPANY.email,
    phone: COMPANY.phone,
    website: COMPANY.website,
    addressLine1: COMPANY.address,
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    gstin: COMPANY.gstin,
    cin: COMPANY.cin,
    fiscalYearStart: 0,
  },
  payroll: {
    basic: 40000,
    hraRatio: 0.4,
    conveyance: 1600,
    specialAllowance: 6000,
    pfRatio: 0.12,
    esiRatio: 0.0075,
    professionalTax: 200,
    tdsRatio: 0.1,
  },
  leave: {
    advanceNoticeDays: 2,
    maxConsecutiveDays: 30,
    allowHalfDayRequests: true,
    allowLeaveOnWeekends: false,
    renewalMonth: 0,
  },
  holiday: {
    weekendDays: [0, 6],
    optionalHolidayLimit: 0,
    showOptionalOnCalendar: true,
  },
  notifications: {
    emailEnabled: true,
    leaveApprovalEmail: true,
    leaveCancellationEmail: true,
    payslipReadyEmail: true,
    timesheetReminderEmail: true,
    birthdayReminderEmail: false,
    goalReminderEmail: true,
    announcementEmail: false,
  },
  email: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'Office EMS <no-reply@office.com>',
  },
};

export const SETTINGS_KEYS = Object.freeze(Object.keys(SETTINGS_DEFAULTS));

const merge = (key, data = {}) => ({ ...SETTINGS_DEFAULTS[key], ...(data || {}) });

// Reads a settings section, creating the document (with defaults) on first use.
export const getSetting = async (key) => {
  const doc = await AppSetting.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, data: SETTINGS_DEFAULTS[key] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return merge(key, doc.data);
};

export const getAllSettings = async () => {
  const entries = await Promise.all(
    SETTINGS_KEYS.map(async (key) => [key, await getSetting(key)])
  );
  return Object.fromEntries(entries);
};

// Persists a whitelisted payload onto a settings section.
export const updateSetting = async (key, payload, userId) => {
  const allowed = new Set(Object.keys(SETTINGS_DEFAULTS[key] || {}));
  const next = {};
  for (const [name, value] of Object.entries(payload || {})) {
    if (allowed.has(name)) next[name] = value;
  }

  const doc = await AppSetting.findOneAndUpdate(
    { key },
    { $set: { data: { ...SETTINGS_DEFAULTS[key], ...next }, updatedBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return merge(key, doc.data);
};