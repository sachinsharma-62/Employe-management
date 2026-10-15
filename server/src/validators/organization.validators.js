import { body, param } from 'express-validator';
import { LOCATION_TYPES } from '../utils/enums.js';

const optional = (field) => body(field).optional({ values: 'falsy' });

export const departmentRules = [
  body('name').trim().notEmpty().withMessage('Department name is required').isLength({ max: 60 }),
  body('code')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Code must be 2-20 characters'),
  optional('head').isMongoId().withMessage('Invalid department head'),
  optional('description').trim().isLength({ max: 500 }),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
];

export const designationRules = [
  body('title').trim().notEmpty().withMessage('Designation title is required').isLength({ max: 60 }),
  optional('department').isMongoId().withMessage('Invalid department'),
  optional('description').trim().isLength({ max: 500 }),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
];

export const teamRules = [
  body('name').trim().notEmpty().withMessage('Team name is required').isLength({ max: 60 }),
  optional('department').isMongoId().withMessage('Invalid department'),
  optional('manager').isMongoId().withMessage('Invalid team manager'),
  optional('description').trim().isLength({ max: 500 }),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
];

export const locationRules = [
  body('name').trim().notEmpty().withMessage('Location name is required').isLength({ max: 60 }),
  body('type').isIn(LOCATION_TYPES).withMessage('Invalid location type'),
  optional('address').trim().isLength({ max: 200 }),
  optional('city').trim().isLength({ max: 60 }),
  optional('state').trim().isLength({ max: 60 }),
  optional('country').trim().isLength({ max: 60 }),
  optional('pincode').trim().isLength({ max: 12 }),
  optional('isActive').isBoolean().withMessage('Invalid status').toBoolean(),
];

export const assignEmployeesRules = [
  body('employeeIds').isArray({ min: 1 }).withMessage('Select at least one employee'),
  body('employeeIds.*').isMongoId().withMessage('Invalid employee id'),
];

export const orgObjectIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage('Invalid id');