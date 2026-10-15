import { body, param, query } from 'express-validator';
import { JOB_STATUSES, JOB_TYPES } from '../utils/enums.js';

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const jobRules = [
  body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 120 }),
  optional('department').trim().isLength({ max: 60 }),
  optional('location').trim().isLength({ max: 60 }),
  optional('jobType').isIn(JOB_TYPES).withMessage('Invalid job type'),
  optional('openings').isInt({ min: 0, max: 500 }).toInt().withMessage('Openings must be between 0 and 500'),
  optional('status').isIn(JOB_STATUSES).withMessage('Invalid job status'),
  optional('minExperience').isFloat({ min: 0, max: 60 }).toFloat(),
  optional('maxExperience').isFloat({ min: 0, max: 60 }).toFloat(),
  optional('salaryRange').trim().isLength({ max: 80 }),
  optional('skills').isArray().withMessage('Skills must be an array'),
  optional('skills.*').trim().isLength({ max: 40 }),
  optional('description').trim().isLength({ max: 2000 }),
  optional('requirements').trim().isLength({ max: 2000 }),
  optional('closesOn').isISO8601().toDate().withMessage('Invalid closing date'),
  optional('isActive').isBoolean().toBoolean(),
];

export const jobUpdateRules = [
  optional('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 120 }),
  optional('department').trim().isLength({ max: 60 }),
  optional('location').trim().isLength({ max: 60 }),
  optional('jobType').isIn(JOB_TYPES).withMessage('Invalid job type'),
  optional('openings').isInt({ min: 0, max: 500 }).toInt().withMessage('Openings must be between 0 and 500'),
  optional('status').isIn(JOB_STATUSES).withMessage('Invalid job status'),
  optional('minExperience').isFloat({ min: 0, max: 60 }).toFloat(),
  optional('maxExperience').isFloat({ min: 0, max: 60 }).toFloat(),
  optional('salaryRange').trim().isLength({ max: 80 }),
  optional('skills').isArray().withMessage('Skills must be an array'),
  optional('skills.*').trim().isLength({ max: 40 }),
  optional('description').trim().isLength({ max: 2000 }),
  optional('requirements').trim().isLength({ max: 2000 }),
  optional('closesOn').isISO8601().toDate().withMessage('Invalid closing date'),
  optional('isActive').isBoolean().toBoolean(),
];

export const jobListRules = [
  queryOptional('q').trim().isLength({ max: 60 }),
  queryOptional('status').isIn(JOB_STATUSES).withMessage('Invalid job status'),
  queryOptional('department').trim().isLength({ max: 60 }),
  queryOptional('jobType').isIn(JOB_TYPES).withMessage('Invalid job type'),
  queryOptional('page').isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  queryOptional('limit').isInt({ min: 1, max: 100 }).toInt().withMessage('Invalid limit'),
];