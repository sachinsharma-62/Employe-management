import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createCandidate,
  deleteCandidate,
  getCandidate,
  getCandidateMeta,
  listCandidates,
  updateCandidate,
} from '../controllers/candidate.controller.js';
import {
  candidateListRules,
  candidateRules,
  candidateUpdateRules,
  objectIdParam,
} from '../validators/candidate.validators.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/', canView, candidateListRules, validate, listCandidates);
router.get('/meta', canView, getCandidateMeta);

router.post('/', canManage, candidateRules, validate, createCandidate);

router.get('/:id', canView, objectIdParam('id'), validate, getCandidate);
router.put('/:id', canManage, objectIdParam('id'), candidateUpdateRules, validate, updateCandidate);
router.delete('/:id', canManage, objectIdParam('id'), validate, deleteCandidate);

export default router;