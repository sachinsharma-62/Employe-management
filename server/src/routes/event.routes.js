import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  calendarRules,
  createEventRules,
  listEventsRules,
  objectIdParam,
  upcomingRules,
  updateEventRules,
} from '../validators/event.validators.js';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEventCalendar,
  getEventMeta,
  getUpcomingEvents,
  listEvents,
  updateEvent,
} from '../controllers/event.controller.js';

const router = Router();

router.use(authenticate);

const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');

// Views
router.get('/', listEventsRules, validate, listEvents);
router.get('/meta', getEventMeta);
router.get('/upcoming', upcomingRules, validate, getUpcomingEvents);
router.get('/calendar', calendarRules, validate, getEventCalendar);
router.get('/:id', objectIdParam('id'), validate, getEvent);

// Management
router.post('/', canManage, createEventRules, validate, createEvent);
router.put('/:id', canManage, objectIdParam('id'), updateEventRules, validate, updateEvent);
router.delete('/:id', canManage, objectIdParam('id'), validate, deleteEvent);

export default router;
