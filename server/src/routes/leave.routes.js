import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import uploadLeave from '../middleware/uploadLeave.js';
import {
  applyLeaveRules,
  balanceListRules,
  cancelRules,
  decisionRules,
  leaveListRules,
  leaveTypeRules,
  leaveTypeUpdateRules,
  objectIdParam,
  yearRule,
} from '../validators/leave.validators.js';
import {
  applyLeave,
  approveLeave,
  cancelLeave,
  createLeaveType,
  deleteLeaveType,
  getLeaveRequest,
  getMyLeaves,
  listBalances,
  listLeaveRequests,
  listLeaveTypes,
  rejectLeave,
  updateLeaveType,
} from '../controllers/leave.controller.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

// Leave type configuration
router.get('/types', listLeaveTypes);
router.post('/types', canManage, leaveTypeRules, validate, createLeaveType);
router.put('/types/:id', canManage, objectIdParam('id'), leaveTypeUpdateRules, validate, updateLeaveType);
router.delete('/types/:id', canManage, objectIdParam('id'), validate, deleteLeaveType);

// Employee self-service
router.get('/me', yearRule, validate, getMyLeaves);
router.post('/me/apply', uploadLeave.single('attachment'), applyLeaveRules, validate, applyLeave);
router.post('/me/:id/cancel', objectIdParam('id'), cancelRules, validate, cancelLeave);

// Manager / HR views
router.get('/balances', canView, balanceListRules, validate, listBalances);
router.get('/requests', canView, leaveListRules, validate, listLeaveRequests);
router.get('/requests/:id', canView, objectIdParam('id'), validate, getLeaveRequest);
router.post('/requests/:id/approve', canView, objectIdParam('id'), decisionRules, validate, approveLeave);
router.post('/requests/:id/reject', canView, objectIdParam('id'), decisionRules, validate, rejectLeave);

export default router;
