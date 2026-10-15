import { body, param, query } from 'express-validator';
import {
  LEAVE_APPLICABLE_SCOPES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
} from '../utils/enums.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const applyLeaveRules = [
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(LEAVE_TYPES)
    .withMessage('Invalid leave type'),
  body('fromDate').matches(DATE_PATTERN).withMessage('Start date must be YYYY-MM-DD'),
  body('toDate').matches(DATE_PATTERN).withMessage('End date must be YYYY-MM-DD'),
  optional('reason').trim().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less'),
];

export const cancelRules = [
  optional('reason').trim().isLength({ max: 300 }).withMessage('Reason must be 300 characters or less'),
];

export const decisionRules = [
  optional('note').trim().isLength({ max: 300 }).withMessage('Comment must be 300 characters or less'),
];

export const leaveListRules = [
  query('status').optional({ values: 'falsy' }).isIn(LEAVE_STATUSES).withMessage('Invalid status'),
  query('type').optional({ values: 'falsy' }).isIn(LEAVE_TYPES).withMessage('Invalid leave type'),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  queryOptional('department').trim().isLength({ max: 60 }),
  query('from').optional({ values: 'falsy' }).matches(DATE_PATTERN).withMessage('Invalid from date'),
  query('to').optional({ values: 'falsy' }).matches(DATE_PATTERN).withMessage('Invalid to date'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }).toInt().withMessage('Invalid limit'),
];

export const yearRule = query('year').optional({ values: 'falsy' }).isInt({ min: 2000, max: 2100 }).toInt();

export const balanceListRules = [
  yearRule,
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  queryOptional('department').trim().isLength({ max: 60 }),
];

export const leaveTypeRules = [
  body('code').trim().notEmpty().withMessage('Code is required').isIn(LEAVE_TYPES).withMessage('Invalid leave code'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  optional('description').trim().isLength({ max: 300 }),
  optional('totalDays').isInt({ min: 0, max: 366 }).toInt().withMessage('Invalid total days'),
  optional('carryForward').isBoolean().toBoolean(),
  optional('carryForwardLimit').isInt({ min: 0, max: 366 }).toInt().withMessage('Invalid carry forward limit'),
  optional('encashable').isBoolean().toBoolean(),
  optional('applicableScope').isIn(LEAVE_APPLICABLE_SCOPES).withMessage('Invalid scope'),
  optional('applicableRoles').isArray().withMessage('Roles must be an array'),
  optional('applicableDepartments').isArray().withMessage('Departments must be an array'),
  optional('applicableEmployees').isArray().withMessage('Employees must be an array'),
  optional('applicableEmployees.*').isMongoId().withMessage('Invalid employee id'),
  optional('color').trim().isLength({ max: 30 }),
  optional('isActive').isBoolean().toBoolean(),
];

export const leaveTypeUpdateRules = [
  optional('name').trim().isLength({ max: 80 }),
  optional('description').trim().isLength({ max: 300 }),
  optional('totalDays').isInt({ min: 0, max: 366 }).toInt().withMessage('Invalid total days'),
  optional('carryForward').isBoolean().toBoolean(),
  optional('carryForwardLimit').isInt({ min: 0, max: 366 }).toInt().withMessage('Invalid carry forward limit'),
  optional('encashable').isBoolean().toBoolean(),
  optional('applicableScope').isIn(LEAVE_APPLICABLE_SCOPES).withMessage('Invalid scope'),
  optional('applicableRoles').isArray().withMessage('Roles must be an array'),
  optional('applicableDepartments').isArray().withMessage('Departments must be an array'),
  optional('applicableEmployees').isArray().withMessage('Employees must be an array'),
  optional('applicableEmployees.*').isMongoId().withMessage('Invalid employee id'),
  optional('color').trim().isLength({ max: 30 }),
  optional('isActive').isBoolean().toBoolean(),
];
