import { body, param, query } from 'express-validator';
import { PAYROLL_DEDUCTION_FIELDS, PAYROLL_EARNING_FIELDS, PAYROLL_STATUSES } from '../utils/enums.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const COMPONENT_FIELDS = [...PAYROLL_EARNING_FIELDS, ...PAYROLL_DEDUCTION_FIELDS];

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

const componentRules = (validator) =>
  COMPONENT_FIELDS.map((field) =>
    validator(field).isFloat({ min: 0 }).toFloat().withMessage(`${field} must be a positive number`)
  );

export const payrollListRules = [
  queryOptional('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  queryOptional('department').trim().isLength({ max: 60 }),
  queryOptional('status').isIn(PAYROLL_STATUSES).withMessage('Invalid status'),
  queryOptional('search').trim().isLength({ max: 60 }),
  queryOptional('employeeId').isMongoId().withMessage('Invalid employee id'),
  queryOptional('page').isInt({ min: 1 }).toInt(),
  queryOptional('limit').isInt({ min: 1, max: 200 }).toInt(),
];

export const monthQueryRules = [
  queryOptional('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  queryOptional('department').trim().isLength({ max: 60 }),
];

export const reportRules = [
  queryOptional('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  queryOptional('months').isInt({ min: 1, max: 12 }).toInt(),
];

export const generateRules = [
  body('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  optional('department').trim().isLength({ max: 60 }),
  optional('employeeIds').isArray().withMessage('employeeIds must be an array'),
  optional('employeeIds.*').isMongoId().withMessage('Invalid employee id'),
];

export const bulkRules = [
  body('action')
    .isIn(['process', 'review', 'approve', 'pay', 'revert'])
    .withMessage('Invalid payroll action'),
  optional('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  optional('department').trim().isLength({ max: 60 }),
  optional('status').isIn(PAYROLL_STATUSES).withMessage('Invalid status'),
  optional('ids').isArray().withMessage('ids must be an array'),
  optional('ids.*').isMongoId().withMessage('Invalid id'),
];

export const payrollUpdateRules = [
  ...componentRules(optional),
  optional('workingDays').isInt({ min: 0 }).toInt().withMessage('Invalid working days'),
  optional('paidDays').isInt({ min: 0 }).toInt().withMessage('Invalid paid days'),
  optional('note').trim().isLength({ max: 300 }),
  optional('payDate').isISO8601().withMessage('Invalid pay date'),
  optional('status').isIn(PAYROLL_STATUSES).withMessage('Invalid status'),
];

export const bulkSendRules = [
  optional('month').matches(MONTH_PATTERN).withMessage('Month must be YYYY-MM'),
  optional('department').trim().isLength({ max: 60 }),
  optional('status').isIn(PAYROLL_STATUSES).withMessage('Invalid status'),
  optional('ids').isArray().withMessage('ids must be an array'),
  optional('ids.*').isMongoId().withMessage('Invalid id'),
];

export const structureRules = [
  ...componentRules(optional),
  optional('currency').trim().isLength({ max: 8 }),
  optional('effectiveFrom').isISO8601().withMessage('Invalid effective date'),
  optional('isActive').isBoolean().toBoolean(),
];

export const decisionRules = [optional('note').trim().isLength({ max: 300 })];
