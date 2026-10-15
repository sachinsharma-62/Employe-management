import { body, param, query } from 'express-validator';
import { ATTENDANCE_MODES, ATTENDANCE_STATUSES } from '../utils/enums.js';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const monthParam = query('month')
  .optional({ values: 'falsy' })
  .matches(MONTH_PATTERN)
  .withMessage('Month must be in YYYY-MM format');

export const checkInRules = [
  optional('mode')
    .isIn(ATTENDANCE_MODES)
    .withMessage('Invalid work mode'),
  optional('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  optional('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

export const checkOutRules = [
  optional('note').trim().isLength({ max: 300 }).withMessage('Note must be 300 characters or less'),
];

export const correctionRules = [
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  body('reason').trim().notEmpty().withMessage('Reason is required').isLength({ min: 5, max: 500 }),
  optional('requestedStatus')
    .isIn(ATTENDANCE_STATUSES)
    .withMessage('Invalid requested status'),
  optional('requestedCheckIn').matches(TIME_PATTERN).withMessage('Invalid check-in time'),
  optional('requestedCheckOut').matches(TIME_PATTERN).withMessage('Invalid check-out time'),
];

export const attendanceListRules = [
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  queryOptional('employeeId').isMongoId().withMessage('Invalid employee id'),
  queryOptional('department').trim().isLength({ max: 60 }),
  query('status').optional({ values: 'falsy' }).isIn(ATTENDANCE_STATUSES).withMessage('Invalid status'),
  monthParam,
  query('from').optional({ values: 'falsy' }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid from date'),
  query('to').optional({ values: 'falsy' }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid to date'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }).toInt().withMessage('Invalid limit'),
];

export const rosterRules = [
  query('date').optional({ values: 'falsy' }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date'),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  queryOptional('department').trim().isLength({ max: 60 }),
  query('status').optional({ values: 'falsy' }).isIn(ATTENDANCE_STATUSES).withMessage('Invalid status'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 200 }).toInt().withMessage('Invalid limit'),
];

export const calendarRules = [
  monthParam,
  query('employeeId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid employee id'),
];
export const updateAttendanceRules = [
  optional('status').isIn(ATTENDANCE_STATUSES).withMessage('Invalid status'),
  optional('workMode').isIn(ATTENDANCE_MODES).withMessage('Invalid work mode'),
  optional('checkIn').matches(TIME_PATTERN).withMessage('Invalid check-in time'),
  optional('checkOut').matches(TIME_PATTERN).withMessage('Invalid check-out time'),
  optional('hoursWorked').isFloat({ min: 0, max: 24 }).toFloat().withMessage('Invalid hours worked'),
  optional('note').trim().isLength({ max: 300 }).withMessage('Note must be 300 characters or less'),
];

export const correctionListRules = [
  query('status').optional({ values: 'falsy' }).isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 50 }).toInt().withMessage('Invalid limit'),
];

export const decisionRules = [
  optional('note').trim().isLength({ max: 300 }).withMessage('Note must be 300 characters or less'),
];

export const settingsRules = [
  optional('officeStart').matches(TIME_PATTERN).withMessage('Invalid office start time'),
  optional('officeEnd').matches(TIME_PATTERN).withMessage('Invalid office end time'),
  optional('graceMinutes').isInt({ min: 0, max: 180 }).toInt().withMessage('Invalid grace minutes'),
  optional('requiredWorkHours')
    .isFloat({ min: 1, max: 24 })
    .toFloat()
    .withMessage('Invalid required working hours'),
  optional('breakMinutes').isInt({ min: 0, max: 240 }).toInt().withMessage('Invalid break minutes'),
  optional('breakThresholdHours')
    .isFloat({ min: 1, max: 12 })
    .toFloat()
    .withMessage('Invalid break threshold hours'),
  optional('weekendDays').isArray({ max: 7 }).withMessage('Weekend days must be an array'),
  optional('weekendDays.*').isInt({ min: 0, max: 6 }).toInt().withMessage('Invalid weekend day'),
];

export const objectIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage('Invalid id');