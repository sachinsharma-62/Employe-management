import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { globalSearch } from '../controllers/search.controller.js';
import { searchRules } from '../validators/search.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', searchRules, validate, globalSearch);

export default router;