import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import uploadDocument from '../middleware/uploadDocument.js';
import {
  deleteDocument,
  downloadDocument,
  getDocument,
  getDocumentMeta,
  getDocumentStats,
  getMyDocuments,
  listDocuments,
  updateDocument,
  uploadDocument as uploadDocumentController,
  verifyDocument,
} from '../controllers/document.controller.js';
import {
  listRules,
  objectIdParam,
  updateRules,
  uploadRules,
  verifyRules,
} from '../validators/document.validators.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/me', getMyDocuments);

router.get('/stats', canView, getDocumentStats);
router.get('/meta', canView, getDocumentMeta);
router.get('/', canView, listRules, validate, listDocuments);

router.post('/', uploadDocument.single('file'), uploadRules, validate, uploadDocumentController);

router.get('/:id/download', objectIdParam('id'), validate, downloadDocument);
router.get('/:id', objectIdParam('id'), validate, getDocument);

router.patch('/:id', objectIdParam('id'), updateRules, validate, updateDocument);
router.post('/:id/verify', canManage, objectIdParam('id'), verifyRules, validate, verifyDocument);
router.delete('/:id', objectIdParam('id'), validate, deleteDocument);

export default router;
