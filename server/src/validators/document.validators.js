import { body, param, query } from 'express-validator';
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  DOCUMENT_VERIFICATION_STATUSES,
} from '../utils/enums.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optional = (field) => body(field).optional({ values: 'falsy' });
const queryOptional = (field) => query(field).optional({ values: 'falsy' });

export const objectIdParam = (field = 'id') => param(field).isMongoId().withMessage('Invalid id');

export const uploadRules = [
  body('title').trim().notEmpty().withMessage('Document name is required').isLength({ max: 160 }),
  optional('documentType').isIn(DOCUMENT_TYPES).withMessage('Invalid document type'),
  optional('category').trim().isLength({ max: 40 }),
  optional('employee').isMongoId().withMessage('Invalid employee id'),
  optional('expiryDate').matches(DATE_PATTERN).withMessage('Expiry date must be YYYY-MM-DD'),
  optional('status').isIn(DOCUMENT_STATUSES).withMessage('Invalid document status'),
];

export const updateRules = [
  optional('title').trim().isLength({ max: 160 }),
  optional('documentType').isIn(DOCUMENT_TYPES).withMessage('Invalid document type'),
  optional('category').trim().isLength({ max: 40 }),
  optional('status').isIn(DOCUMENT_STATUSES).withMessage('Invalid document status'),
  body('expiryDate')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || DATE_PATTERN.test(value))
    .withMessage('Expiry date must be YYYY-MM-DD'),
];

export const verifyRules = [
  body('status')
    .isIn(['VERIFIED', 'REJECTED'])
    .withMessage('Verification status must be VERIFIED or REJECTED'),
  optional('rejectionReason').trim().isLength({ max: 300 }),
];

export const listRules = [
  queryOptional('employee').isMongoId().withMessage('Invalid employee id'),
  queryOptional('documentType').isIn(DOCUMENT_TYPES).withMessage('Invalid document type'),
  queryOptional('verificationStatus')
    .isIn(DOCUMENT_VERIFICATION_STATUSES)
    .withMessage('Invalid verification status'),
  queryOptional('status').isIn(DOCUMENT_STATUSES).withMessage('Invalid document status'),
  queryOptional('search').trim().isLength({ max: 80 }),
  queryOptional('expiring').isBoolean().toBoolean(),
  queryOptional('page').isInt({ min: 1 }).toInt(),
  queryOptional('limit').isInt({ min: 1, max: 100 }).toInt(),
];
