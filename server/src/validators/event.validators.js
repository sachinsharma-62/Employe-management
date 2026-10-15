import { body, param, query } from 'express-validator';
import { EVENT_TYPES } from '../utils/enums.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const createEventRules = [
  body('name').trim().notEmpty().withMessage('Event name is required').isLength({ max: 200 }),
  body('date').matches(DATE_PATTERN).withMessage('Date must be YYYY-MM-DD'),
  body('startTime').trim().notEmpty().withMessage('Start time is required').matches(TIME_PATTERN).withMessage('Start time must be HH:MM'),
  body('endTime').trim().notEmpty().withMessage('End time is required').matches(TIME_PATTERN).withMessage('End time must be HH:MM'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 500 }),
  optional('description').trim().isLength({ max: 2000 }),
  optional('type').isIn(EVENT_TYPES).withMessage('Invalid event type'),
  optional('organizer').isMongoId().withMessage('Invalid organizer'),
  optional('participants').isArray().withMessage('Participants must be an array'),
  optional('participants.*').isMongoId().withMessage('Invalid participant'),
  optional('isPublic').isBoolean().toBoolean(),
  optional('isActive').isBoolean().toBoolean(),
];

export const updateEventRules = [
  optional('name').trim().isLength({ max: 200 }),
  optional('date').matches(DATE_PATTERN).withMessage('Date must be YYYY-MM-DD'),
  optional('startTime').trim().matches(TIME_PATTERN).withMessage('Start time must be HH:MM'),
  optional('endTime').trim().matches(TIME_PATTERN).withMessage('End time must be HH:MM'),
  optional('location').trim().isLength({ max: 500 }),
  optional('description').trim().isLength({ max: 2000 }),
  optional('type').isIn(EVENT_TYPES).withMessage('Invalid event type'),
  optional('organizer').isMongoId().withMessage('Invalid organizer'),
  optional('participants').isArray().withMessage('Participants must be an array'),
  optional('participants.*').isMongoId().withMessage('Invalid participant'),
  optional('isPublic').isBoolean().toBoolean(),
  optional('isActive').isBoolean().toBoolean(),
];

export const listEventsRules = [
  queryOptional('year').isInt({ min: 2000, max: 2100 }).toInt().withMessage('Invalid year'),
  queryOptional('month').isInt({ min: 1, max: 12 }).toInt().withMessage('Invalid month'),
  queryOptional('type').isIn(EVENT_TYPES).withMessage('Invalid event type'),
  queryOptional('search').trim().isLength({ max: 60 }),
  queryOptional('location').trim().isLength({ max: 120 }),
  queryOptional('from').matches(DATE_PATTERN).withMessage('From must be YYYY-MM-DD'),
  queryOptional('to').matches(DATE_PATTERN).withMessage('To must be YYYY-MM-DD'),
  queryOptional('includeInactive').isBoolean().toBoolean(),
];

export const upcomingRules = [
  queryOptional('limit').isInt({ min: 1, max: 20 }).toInt().withMessage('Invalid limit'),
];

export const calendarRules = [
  query('start').matches(DATE_PATTERN).withMessage('Start date must be YYYY-MM-DD'),
  query('end').matches(DATE_PATTERN).withMessage('End date must be YYYY-MM-DD'),
];
