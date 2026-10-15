import { body } from 'express-validator';

// `values: 'undefined'` keeps falsy-but-valid values (e.g. 0) so numeric
// settings like professional tax can legitimately be set to zero.
const optNum = (field, min, max, message) =>
  body(field)
    .optional({ values: 'undefined' })
    .toFloat()
    .isFloat({ min, max })
    .withMessage(message);

const optBool = (field) => body(field).optional({ values: 'undefined' }).isBoolean().toBoolean();

const optStr = (field, max) => body(field).optional({ values: 'undefined' }).trim().isLength({ max });

const optStrRequired = (field, max) =>
  body(field).trim().notEmpty().withMessage(`${field} is required`).isLength({ max });

export const companySettingsRules = [
  optStrRequired('name', 120),
  optStr('tagline', 200),
  optStr('email', 120).isEmail().withMessage('A valid company email is required'),
  optStr('phone', 40),
  optStr('website', 160),
  optStr('addressLine1', 200),
  optStr('addressLine2', 200),
  optStr('city', 80),
  optStr('state', 80),
  optStr('country', 80),
  optStr('pincode', 20),
  optStr('gstin', 20),
  optStr('cin', 30),
  body('fiscalYearStart').optional({ values: 'undefined' }).toInt().isInt({ min: 0, max: 11 }),
];

export const payrollSettingsRules = [
  optNum('basic', 0, 10000000, 'Basic salary must be between 0 and 1,00,00,000'),
  optNum('hraRatio', 0, 1, 'HRA ratio must be between 0 and 1'),
  optNum('conveyance', 0, 100000, 'Conveyance must be between 0 and 1,00,000'),
  optNum('specialAllowance', 0, 1000000, 'Special allowance must be between 0 and 10,00,000'),
  optNum('pfRatio', 0, 1, 'PF ratio must be between 0 and 1'),
  optNum('esiRatio', 0, 1, 'ESI ratio must be between 0 and 1'),
  optNum('professionalTax', 0, 5000, 'Professional tax must be between 0 and 5000'),
  optNum('tdsRatio', 0, 1, 'TDS ratio must be between 0 and 1'),
];

export const leaveSettingsRules = [
  optNum('advanceNoticeDays', 0, 60, 'Advance notice must be between 0 and 60 days'),
  optNum('maxConsecutiveDays', 1, 366, 'Max consecutive days must be between 1 and 366'),
  optBool('allowHalfDayRequests'),
  optBool('allowLeaveOnWeekends'),
  body('renewalMonth').optional({ values: 'undefined' }).toInt().isInt({ min: 0, max: 11 }),
];

export const holidaySettingsRules = [
  body('weekendDays').optional({ values: 'undefined' }).isArray({ max: 7 }),
  body('weekendDays.*').toInt().isInt({ min: 0, max: 6 }),
  optNum('optionalHolidayLimit', 0, 366, 'Optional holiday limit must be between 0 and 366'),
  optBool('showOptionalOnCalendar'),
];

export const notificationSettingsRules = [
  optBool('emailEnabled'),
  optBool('leaveApprovalEmail'),
  optBool('leaveCancellationEmail'),
  optBool('payslipReadyEmail'),
  optBool('timesheetReminderEmail'),
  optBool('birthdayReminderEmail'),
  optBool('goalReminderEmail'),
  optBool('announcementEmail'),
];

export const emailSettingsRules = [
  optBool('enabled'),
  optStr('host', 120),
  optNum('port', 1, 65535, 'Port must be between 1 and 65535'),
  optBool('secure'),
  optStr('user', 120),
  optStr('pass', 200),
  optStr('from', 160),
];