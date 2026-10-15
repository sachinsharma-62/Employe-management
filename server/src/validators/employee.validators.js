import { body, param } from 'express-validator';
import { ALL_ROLES } from '../utils/roles.js';
import { BLOOD_GROUPS, BULK_ACTIONS, EMPLOYMENT_TYPES, GENDERS } from '../utils/enums.js';

const optional = (field) => body(field).optional({ values: 'falsy' });

const emailRule = (field, label) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .isEmail()
    .withMessage(`Enter a valid ${label}`)
    .normalizeEmail();

export const createEmployeeRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
  emailRule('email', 'email'),
  optional('personalEmail').isEmail().withMessage('Enter a valid personal email'),
  optional('gender').isIn(GENDERS).withMessage('Invalid gender'),
  optional('bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  optional('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  optional('joiningDate').isISO8601().withMessage('Invalid joining date'),
  optional('employmentType').isIn(EMPLOYMENT_TYPES).withMessage('Invalid employment type'),
  optional('role').isIn(ALL_ROLES).withMessage('Invalid role'),
  optional('manager').isMongoId().withMessage('Invalid manager'),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
  optional('pincode').isLength({ max: 12 }),
];

export const updateEmployeeRules = [
  optional('firstName').trim().isLength({ max: 60 }),
  optional('lastName').trim().isLength({ max: 60 }),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  optional('personalEmail').isEmail().withMessage('Enter a valid personal email'),
  optional('gender').isIn(GENDERS).withMessage('Invalid gender'),
  optional('bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  optional('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  optional('joiningDate').isISO8601().withMessage('Invalid joining date'),
  optional('employmentType').isIn(EMPLOYMENT_TYPES).withMessage('Invalid employment type'),
  optional('role').isIn(ALL_ROLES).withMessage('Invalid role'),
  optional('manager').isMongoId().withMessage('Invalid manager'),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
];

export const bulkActionRules = [
  body('action').isIn(BULK_ACTIONS).withMessage('Invalid bulk action'),
  body('ids').isArray({ min: 1 }).withMessage('Select at least one employee'),
  body('ids.*').isMongoId().withMessage('Invalid employee id'),
];

export const objectIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage('Invalid id');
