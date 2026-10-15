import { body, param } from 'express-validator';
import {
  LEAVE_STATUSES,
  LEAVE_TYPES,
  NOTE_VISIBILITIES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
} from '../utils/enums.js';

export const employeeParam = (field = 'id') =>
  param(field).isMongoId().withMessage('Invalid employee id');

export const noteIdParam = param('noteId').isMongoId().withMessage('Invalid note id');

export const documentIdParam = param('documentId')
  .isMongoId()
  .withMessage('Invalid document id');

export const noteRules = [
  body('body').trim().notEmpty().withMessage('Note content is required').isLength({ max: 2000 }),
  body('visibility')
    .optional({ values: 'falsy' })
    .isIn(NOTE_VISIBILITIES)
    .withMessage('Invalid note visibility'),
];

export const documentRules = [
  body('title').trim().notEmpty().withMessage('Document title is required').isLength({ max: 160 }),
  body('category')
    .optional({ values: 'falsy' })
    .isIn(DOCUMENT_CATEGORIES)
    .withMessage('Invalid document category'),
  body('documentType')
    .optional({ values: 'falsy' })
    .isIn(DOCUMENT_TYPES)
    .withMessage('Invalid document type'),
  body('expiryDate')
    .optional({ values: 'falsy' })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Expiry date must be YYYY-MM-DD'),
];

export const leaveQueryRules = [
  body('type').optional({ values: 'falsy' }).isIn(LEAVE_TYPES).withMessage('Invalid leave type'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(LEAVE_STATUSES)
    .withMessage('Invalid leave status'),
];
