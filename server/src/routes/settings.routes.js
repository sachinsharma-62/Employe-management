import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import uploadLogo from '../middleware/uploadLogo.js';
import {
  companySettingsRules,
  emailSettingsRules,
  holidaySettingsRules,
  leaveSettingsRules,
  notificationSettingsRules,
  payrollSettingsRules,
} from '../validators/settings.validators.js';
import {
  getSettings,
  testEmailSettings,
  updateCompany,
  updateEmail,
  updateSection,
} from '../controllers/settings.controller.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/', canView, getSettings);

router.put(
  '/company',
  canManage,
  uploadLogo.single('logo'),
  companySettingsRules,
  validate,
  updateCompany
);
router.put('/payroll', canManage, payrollSettingsRules, validate, updateSection('payroll'));
router.put('/leave', canManage, leaveSettingsRules, validate, updateSection('leave'));
router.put('/holiday', canManage, holidaySettingsRules, validate, updateSection('holiday'));
router.put('/notifications', canManage, notificationSettingsRules, validate, updateSection('notifications'));
router.put('/email', canManage, emailSettingsRules, validate, updateEmail);
router.post('/email/test', canManage, testEmailSettings);

export default router;