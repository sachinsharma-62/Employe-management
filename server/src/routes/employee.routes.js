import { Router } from 'express';
import {
  bulkAction,
  createEmployee,
  deleteEmployee,
  exportEmployees,
  getEmployee,
  getEmployeeMeta,
  listEmployees,
  updateEmployee,
} from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import profileRoutes from './employeeProfile.routes.js';
import {
  bulkActionRules,
  createEmployeeRules,
  objectIdParam,
  updateEmployeeRules,
} from '../validators/employee.validators.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/', canView, listEmployees);
router.get('/meta', canView, getEmployeeMeta);
router.get('/export', canManage, exportEmployees);
router.post('/', canManage, upload.single('avatar'), createEmployeeRules, validate, createEmployee);
router.post('/bulk', canManage, bulkActionRules, validate, bulkAction);

router.use('/:id', profileRoutes);

router.get('/:id', canView, objectIdParam(), validate, getEmployee);
router.patch(
  '/:id',
  canManage,
  upload.single('avatar'),
  objectIdParam(),
  updateEmployeeRules,
  validate,
  updateEmployee
);
router.delete('/:id', canManage, objectIdParam(), validate, deleteEmployee);

export default router;
