import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  holidayCreateRules,
  holidayListRules,
  holidayUpdateRules,
  objectIdParam,
  upcomingRules,
} from '../validators/holiday.validators.js';
import {
  createHoliday,
  deleteHoliday,
  getHoliday,
  getHolidayMeta,
  getUpcomingHolidays,
  listHolidays,
  updateHoliday,
} from '../controllers/holiday.controller.js';

const router = Router();

router.use(authenticate);

const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

// Views
router.get('/', holidayListRules, validate, listHolidays);
router.get('/meta', getHolidayMeta);
router.get('/upcoming', upcomingRules, validate, getUpcomingHolidays);
router.get('/:id', objectIdParam('id'), validate, getHoliday);

// Configuration
router.post('/', canManage, holidayCreateRules, validate, createHoliday);
router.put('/:id', canManage, objectIdParam('id'), holidayUpdateRules, validate, updateHoliday);
router.delete('/:id', canManage, objectIdParam('id'), validate, deleteHoliday);

export default router;