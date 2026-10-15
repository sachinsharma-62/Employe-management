import { body, param, query } from 'express-validator';
import { HOLIDAY_SCOPES, HOLIDAY_TYPES } from '../utils/enums.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const holidayCreateRules = [
  body('name').trim().notEmpty().withMessage('Holiday name is required').isLength({ max: 100 }),
  body('date').matches(DATE_PATTERN).withMessage('Holiday date must be YYYY-MM-DD'),
  optional('type').isIn(HOLIDAY_TYPES).withMessage('Invalid holiday type'),
  optional('optional').isBoolean().toBoolean(),
  optional('description').trim().isLength({ max: 300 }).withMessage('Description must be 300 characters or less'),
  optional('scope').isIn(HOLIDAY_SCOPES).withMessage('Invalid scope'),
  optional('locations').isArray().withMessage('Locations must be an array'),
  optional('locations.*').trim().isLength({ max: 60 }),
  optional('departments').isArray().withMessage('Departments must be an array'),
  optional('departments.*').trim().isLength({ max: 60 }),
  optional('isActive').isBoolean().toBoolean(),
];

export const holidayUpdateRules = [
  optional('name').trim().isLength({ max: 100 }),
  optional('date').matches(DATE_PATTERN).withMessage('Holiday date must be YYYY-MM-DD'),
  optional('type').isIn(HOLIDAY_TYPES).withMessage('Invalid holiday type'),
  optional('optional').isBoolean().toBoolean(),
  optional('description').trim().isLength({ max: 300 }).withMessage('Description must be 300 characters or less'),
  optional('scope').isIn(HOLIDAY_SCOPES).withMessage('Invalid scope'),
  optional('locations').isArray().withMessage('Locations must be an array'),
  optional('locations.*').trim().isLength({ max: 60 }),
  optional('departments').isArray().withMessage('Departments must be an array'),
  optional('departments.*').trim().isLength({ max: 60 }),
  optional('isActive').isBoolean().toBoolean(),
];

export const holidayListRules = [
  queryOptional('year').isInt({ min: 2000, max: 2100 }).toInt().withMessage('Invalid year'),
  queryOptional('month').isInt({ min: 1, max: 12 }).toInt().withMessage('Invalid month'),
  queryOptional('type').isIn(HOLIDAY_TYPES).withMessage('Invalid holiday type'),
  queryOptional('location').trim().isLength({ max: 60 }),
  queryOptional('department').trim().isLength({ max: 60 }),
  queryOptional('search').trim().isLength({ max: 60 }),
  queryOptional('optional').isBoolean().toBoolean(),
  queryOptional('includeInactive').isBoolean().toBoolean(),
];

export const upcomingRules = [
  queryOptional('limit').isInt({ min: 1, max: 20 }).toInt().withMessage('Invalid limit'),
];
