import { Router } from 'express';
import {
  addDocument,
  addNote,
  deleteDocument,
  deleteNote,
  downloadProfile,
  getActivity,
  getAssets,
  getAttendance,
  getDocuments,
  getGoals,
  getLeaves,
  getNotes,
  getPayroll,
  getPerformance,
  getProfile,
} from '../controllers/profile.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import uploadDocument from '../middleware/uploadDocument.js';
import {
  documentIdParam,
  documentRules,
  employeeParam,
  noteIdParam,
  noteRules,
} from '../validators/profile.validators.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/profile', canView, employeeParam(), validate, getProfile);
router.get('/profile/download', canView, employeeParam(), validate, downloadProfile);

router.get('/attendance', canView, employeeParam(), validate, getAttendance);
router.get('/leaves', canView, employeeParam(), validate, getLeaves);
router.get('/payroll', canView, employeeParam(), validate, getPayroll);
router.get('/performance', canView, employeeParam(), validate, getPerformance);
router.get('/goals', canView, employeeParam(), validate, getGoals);
router.get('/assets', canView, employeeParam(), validate, getAssets);

router.get('/documents', canView, employeeParam(), validate, getDocuments);
router.post(
  '/documents',
  canView,
  employeeParam(),
  uploadDocument.single('file'),
  documentRules,
  validate,
  addDocument
);
router.delete(
  '/documents/:documentId',
  canManage,
  employeeParam(),
  documentIdParam,
  validate,
  deleteDocument
);

router.get('/notes', canView, employeeParam(), validate, getNotes);
router.post('/notes', canView, employeeParam(), noteRules, validate, addNote);
router.delete(
  '/notes/:noteId',
  canManage,
  employeeParam(),
  noteIdParam,
  validate,
  deleteNote
);

router.get('/activity', canView, employeeParam(), validate, getActivity);

export default router;
