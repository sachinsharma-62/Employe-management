import { Router } from 'express';
import {
  getUser,
  listUsers,
  updateUserRole,
  updateUserStatus,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { objectIdRule, updateRoleRules, updateStatusRules } from '../validators/auth.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN'), listUsers);
router.get('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), objectIdRule(), validate, getUser);
router.patch(
  '/:id/role',
  authorize('SUPER_ADMIN'),
  objectIdRule(),
  updateRoleRules,
  validate,
  updateUserRole
);
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'HR_ADMIN'),
  objectIdRule(),
  updateStatusRules,
  validate,
  updateUserStatus
);

export default router;
