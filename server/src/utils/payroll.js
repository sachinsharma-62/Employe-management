import {
  PAYROLL_DEDUCTION_FIELDS,
  PAYROLL_EARNING_FIELDS,
  PAYROLL_GROSS_FIELDS,
  PAYROLL_STATUSES,
} from './enums.js';

// Ordered workflow used by the UI and the transition guard.
export const PAYROLL_WORKFLOW = PAYROLL_STATUSES;

export const DEFAULT_CURRENCY = 'INR';

// Percentage of basic used to derive the default salary structure, and the
// statutory deduction ratios applied when a structure is missing.
export const DEFAULT_SALARY = Object.freeze({
  basic: 40000,
  hraRatio: 0.4,
  conveyance: 1600,
  specialAllowance: 6000,
  pfRatio: 0.12,
  esiRatio: 0.0075,
  professionalTax: 200,
  tdsRatio: 0.1,
});

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
};

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const sumFields = (source, fields) =>
  fields.reduce((total, field) => total + num(source?.[field]), 0);

// Gross salary is the fixed monthly earning; total earnings adds the variable
// components (bonus, incentives, overtime).
export const computeTotals = (source = {}) => {
  const grossSalary = sumFields(source, PAYROLL_GROSS_FIELDS);
  const totalEarnings = sumFields(source, PAYROLL_EARNING_FIELDS);
  const totalDeductions = sumFields(source, PAYROLL_DEDUCTION_FIELDS);
  const netSalary = totalEarnings - totalDeductions;

  return {
    grossSalary: round2(grossSalary),
    totalEarnings: round2(totalEarnings),
    totalDeductions: round2(totalDeductions),
    netSalary: round2(netSalary),
  };
};

export const buildDefaultStructure = (basic = DEFAULT_SALARY.basic, cfg = {}) => {
  const settings = { ...DEFAULT_SALARY, ...(cfg || {}) };
  const base = num(basic) || settings.basic;
  return {
    currency: DEFAULT_CURRENCY,
    basic: base,
    hra: round2(base * settings.hraRatio),
    conveyance: settings.conveyance,
    specialAllowance: settings.specialAllowance,
    bonus: 0,
    incentives: 0,
    overtime: 0,
    pf: round2(base * settings.pfRatio),
    esi: round2(base * settings.esiRatio),
    professionalTax: settings.professionalTax,
    tds: round2(base * settings.tdsRatio),
    loanDeduction: 0,
    otherDeduction: 0,
  };
};

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const isValidMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '').trim());

export const toISODate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// First and last day of a YYYY-MM month key.
export const monthBounds = (monthKey) => {
  const [year, month] = String(monthKey).split('-').map(Number);
  return {
    year,
    month,
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0),
  };
};

// Count payable working days in a month: weekdays minus public holidays.
export const countWorkingDays = (monthKey, { weekendDays = [0, 6], holidayDates = [] } = {}) => {
  const { start, end } = monthBounds(monthKey);
  const skip = new Set((weekendDays || [0, 6]).map(Number));
  const holidays = new Set(holidayDates);
  let count = 0;
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (skip.has(cursor.getDay())) continue;
    if (holidays.has(toISODate(cursor))) continue;
    count += 1;
  }
  return count;
};

// Full ordered workflow statuses that are considered "final" and should not be
// edited or regenerated.
export const LOCKED_STATUSES = new Set(['APPROVED', 'PAID']);

export const nextStatus = (status) => {
  const index = PAYROLL_WORKFLOW.indexOf(status);
  if (index === -1 || index === PAYROLL_WORKFLOW.length - 1) return null;
  return PAYROLL_WORKFLOW[index + 1];
};

export const getStructureComponents = (structure) => {
  const base = structure || buildDefaultStructure();
  const components = {};
  PAYROLL_EARNING_FIELDS.forEach((field) => {
    components[field] = num(base[field]);
  });
  PAYROLL_DEDUCTION_FIELDS.forEach((field) => {
    components[field] = num(base[field]);
  });
  return components;
};
