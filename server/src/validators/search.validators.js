import { query } from 'express-validator';

export const searchRules = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Enter something to search')
    .isLength({ max: 100 })
    .withMessage('Search is too long'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 20 }).toInt().withMessage('Invalid limit'),
];