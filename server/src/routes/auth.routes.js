import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  resetPassword,
  securityInfo,
  updateProfile,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';
import {
  changePasswordRules,
  forgotPasswordRules,
  loginRules,
  resetPasswordRules,
  updateProfileRules,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/login', loginLimiter, loginRules, validate, login);
router.post('/refresh', loginLimiter, refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, me);

router.post('/forgot-password', passwordResetLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPasswordRules, validate, resetPassword);
router.post('/change-password', authenticate, changePasswordRules, validate, changePassword);

router.patch(
  '/profile',
  authenticate,
  upload.single('avatar'),
  updateProfileRules,
  validate,
  updateProfile
);

router.get('/security-info', authenticate, securityInfo);

export default router;
