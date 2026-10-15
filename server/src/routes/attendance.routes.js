import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  attendanceListRules,
  calendarRules,
  checkInRules,
  checkOutRules,
  correctionListRules,
  correctionRules,
  decisionRules,
  monthParam,
  objectIdParam,
  rosterRules,
  settingsRules,
  updateAttendanceRules,
} from '../validators/attendance.validators.js';
import {
  approveCorrection,
  checkIn,
  checkOut,
  getAttendanceDetail,
  getCalendar,
  getMyCorrections,
  getMyMonth,
  getSettings,
  listAttendance,
  listCorrections,
  listHolidays,
  listRoster,
  rejectCorrection,
  requestCorrection,
  updateAttendance,
  updateSettings,
} from '../controllers/attendance.controller.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/me', monthParam, validate, getMyMonth);
router.post('/check-in', checkInRules, validate, checkIn);
router.post('/check-out', checkOutRules, validate, checkOut);
router.get('/me/corrections', getMyCorrections);
router.post('/me/corrections', correctionRules, validate, requestCorrection);

router.get('/', canView, attendanceListRules, validate, listAttendance);
router.get('/roster', canView, rosterRules, validate, listRoster);
router.get('/calendar', canView, calendarRules, validate, getCalendar);
router.get('/holidays', listHolidays);
router.get('/settings', getSettings);
router.put('/settings', canManage, settingsRules, validate, updateSettings);
router.get('/corrections', canView, correctionListRules, validate, listCorrections);
router.post('/corrections/:id/approve', canView, objectIdParam('id'), decisionRules, validate, approveCorrection);
router.post('/corrections/:id/reject', canView, objectIdParam('id'), decisionRules, validate, rejectCorrection);

router.get('/:id', canView, objectIdParam('id'), validate, getAttendanceDetail);
router.patch('/:id', canView, objectIdParam('id'), updateAttendanceRules, validate, updateAttendance);

export default router;