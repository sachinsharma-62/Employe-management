import { body, param, query } from 'express-validator';
import { CANDIDATE_SOURCES, CANDIDATE_STAGES } from '../utils/enums.js';

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const candidateRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('A valid email is required').isLength({ max: 120 }),
  optional('phone').trim().isLength({ max: 30 }),
  optional('job').isMongoId().withMessage('Invalid job reference'),
  optional('stage').isIn(CANDIDATE_STAGES).withMessage('Invalid candidate stage'),
  optional('source').isIn(CANDIDATE_SOURCES).withMessage('Invalid candidate source'),
  optional('resumeUrl').trim().isLength({ max: 300 }),
  optional('resumeName').trim().isLength({ max: 160 }),
  optional('notes').trim().isLength({ max: 2000 }),
  optional('appliedAt').isISO8601().toDate().withMessage('Invalid applied date'),
  optional('isActive').isBoolean().toBoolean(),
];

export const candidateUpdateRules = [
  optional('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  optional('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
  optional('email').trim().isEmail().withMessage('A valid email is required').isLength({ max: 120 }),
  optional('phone').trim().isLength({ max: 30 }),
  optional('job').isMongoId().withMessage('Invalid job reference'),
  optional('stage').isIn(CANDIDATE_STAGES).withMessage('Invalid candidate stage'),
  optional('source').isIn(CANDIDATE_SOURCES).withMessage('Invalid candidate source'),
  optional('resumeUrl').trim().isLength({ max: 300 }),
  optional('resumeName').trim().isLength({ max: 160 }),
  optional('notes').trim().isLength({ max: 2000 }),
  optional('appliedAt').isISO8601().toDate().withMessage('Invalid applied date'),
  optional('isActive').isBoolean().toBoolean(),
];

export const candidateListRules = [
  queryOptional('q').trim().isLength({ max: 60 }),
  queryOptional('job').isMongoId().withMessage('Invalid job reference'),
  queryOptional('stage').isIn(CANDIDATE_STAGES).withMessage('Invalid candidate stage'),
  queryOptional('source').isIn(CANDIDATE_SOURCES).withMessage('Invalid candidate source'),
  queryOptional('page').isInt({ min: 1 }).toInt().withMessage('Invalid page'),
  queryOptional('limit').isInt({ min: 1, max: 100 }).toInt().withMessage('Invalid limit'),
];