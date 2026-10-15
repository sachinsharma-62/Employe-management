import { Router } from 'express';
import {
  assignDepartmentEmployees,
  assignDesignationEmployees,
  createDepartment,
  createDesignation,
  createLocation,
  createTeam,
  deleteDepartment,
  deleteDesignation,
  deleteLocation,
  deleteTeam,
  getDepartment,
  getDesignation,
  getEmploymentTypes,
  getLocation,
  getOrgTree,
  getTeam,
  listDepartments,
  listDesignations,
  listLocations,
  listOrgEmployees,
  listOrgManagers,
  listTeams,
  updateDepartment,
  updateDesignation,
  updateLocation,
  updateTeam,
} from '../controllers/organization.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  assignEmployeesRules,
  departmentRules,
  designationRules,
  locationRules,
  orgObjectIdParam,
  teamRules,
} from '../validators/organization.validators.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/employees', canView, listOrgEmployees);
router.get('/tree', canView, getOrgTree);
router.get('/managers', canView, listOrgManagers);
router.get('/employment-types', canView, getEmploymentTypes);

router.get('/departments', canView, listDepartments);
router.post('/departments', canManage, departmentRules, validate, createDepartment);
router.get('/departments/:id', canView, orgObjectIdParam(), validate, getDepartment);
router.patch(
  '/departments/:id',
  canManage,
  orgObjectIdParam(),
  departmentRules,
  validate,
  updateDepartment
);
router.delete('/departments/:id', canManage, orgObjectIdParam(), validate, deleteDepartment);
router.post(
  '/departments/:id/employees',
  canManage,
  orgObjectIdParam(),
  assignEmployeesRules,
  validate,
  assignDepartmentEmployees
);

router.get('/designations', canView, listDesignations);
router.post('/designations', canManage, designationRules, validate, createDesignation);
router.get('/designations/:id', canView, orgObjectIdParam(), validate, getDesignation);
router.patch(
  '/designations/:id',
  canManage,
  orgObjectIdParam(),
  designationRules,
  validate,
  updateDesignation
);
router.delete('/designations/:id', canManage, orgObjectIdParam(), validate, deleteDesignation);
router.post(
  '/designations/:id/employees',
  canManage,
  orgObjectIdParam(),
  assignEmployeesRules,
  validate,
  assignDesignationEmployees
);

router.get('/teams', canView, listTeams);
router.post('/teams', canManage, teamRules, validate, createTeam);
router.get('/teams/:id', canView, orgObjectIdParam(), validate, getTeam);
router.patch('/teams/:id', canManage, orgObjectIdParam(), teamRules, validate, updateTeam);
router.delete('/teams/:id', canManage, orgObjectIdParam(), validate, deleteTeam);

router.get('/locations', canView, listLocations);
router.post('/locations', canManage, locationRules, validate, createLocation);
router.get('/locations/:id', canView, orgObjectIdParam(), validate, getLocation);
router.patch(
  '/locations/:id',
  canManage,
  orgObjectIdParam(),
  locationRules,
  validate,
  updateLocation
);
router.delete('/locations/:id', canManage, orgObjectIdParam(), validate, deleteLocation);

export default router;