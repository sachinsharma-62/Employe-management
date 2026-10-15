import { body, param } from 'express-validator';
import { ALL_ROLES } from '../utils/roles.js';

const PASSWORD_RULES = [
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be between 8 and 64 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
];

export const resetPasswordRules = [
  param('token').trim().notEmpty().withMessage('Reset token is missing'),
  ...PASSWORD_RULES,
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  ...PASSWORD_RULES,
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const updateProfileRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
];

export const updateRoleRules = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(ALL_ROLES)
    .withMessage('Invalid role'),
];

export const updateStatusRules = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),
];

export const objectIdRule = (field = 'id') =>
  param(field).isMongoId().withMessage('Invalid id');
