import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createJob,
  deleteJob,
  getJob,
  getJobMeta,
  listJobs,
  updateJob,
} from '../controllers/job.controller.js';
import {
  jobListRules,
  jobRules,
  jobUpdateRules,
  objectIdParam,
} from '../validators/job.validators.js';

const router = Router();

router.use(authenticate);

const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/', jobListRules, validate, listJobs);
router.get('/meta', getJobMeta);

router.post('/', canManage, jobRules, validate, createJob);

router.get('/:id', objectIdParam('id'), validate, getJob);
router.put('/:id', canManage, objectIdParam('id'), jobUpdateRules, validate, updateJob);
router.delete('/:id', canManage, objectIdParam('id'), validate, deleteJob);

export default router;