import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  bulkRules,
  bulkSendRules,
  decisionRules,
  generateRules,
  monthQueryRules,
  objectIdParam,
  payrollListRules,
  payrollUpdateRules,
  reportRules,
  structureRules,
} from '../validators/payroll.validators.js';
import {
  bulkTransition,
  deletePayroll,
  deleteSalaryStructure,
  downloadPayslip,
  downloadPayslipPdf,
  downloadSalaryReport,
  generatePayroll,
  getDepartmentPayroll,
  getMyPayslips,
  getPayroll,
  getPayrollStats,
  getPayslipHistory,
  getSalaryReport,
  getSalaryStructure,
  listPayroll,
  listSalaryStructures,
  revertPayroll,
  sendPayslip,
  sendPayslips,
  transitionPayroll,
  updatePayroll,
  upsertSalaryStructure,
} from '../controllers/payroll.controller.js';

const router = Router();

router.use(authenticate);

const canView = authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const canManage = authorize('SUPER_ADMIN', 'HR_ADMIN');

router.get('/me', getMyPayslips);

router.get('/', canView, payrollListRules, validate, listPayroll);
router.get('/stats', canView, monthQueryRules, validate, getPayrollStats);
router.get('/departments', canView, monthQueryRules, validate, getDepartmentPayroll);
router.get('/report', canView, reportRules, validate, getSalaryReport);
router.get('/report/download', canView, monthQueryRules, validate, downloadSalaryReport);
router.get('/history/:employeeId', canView, objectIdParam('employeeId'), validate, getPayslipHistory);

router.post('/generate', canManage, generateRules, validate, generatePayroll);
router.post('/bulk', canManage, bulkRules, validate, bulkTransition);
router.post('/send', canManage, bulkSendRules, validate, sendPayslips);

router.get('/salary-structures', canView, listSalaryStructures);
router.get('/salary-structures/:employeeId', canView, objectIdParam('employeeId'), validate, getSalaryStructure);
router.put('/salary-structures/:employeeId', canManage, objectIdParam('employeeId'), structureRules, validate, upsertSalaryStructure);
router.delete('/salary-structures/:employeeId', canManage, objectIdParam('employeeId'), validate, deleteSalaryStructure);

router.get('/:id/payslip/download', objectIdParam('id'), validate, downloadPayslip);
router.get('/:id/payslip.pdf', objectIdParam('id'), validate, downloadPayslipPdf);
router.post('/:id/send', canManage, objectIdParam('id'), validate, sendPayslip);

router.get('/:id', canView, objectIdParam('id'), validate, getPayroll);
router.patch('/:id', canManage, objectIdParam('id'), payrollUpdateRules, validate, updatePayroll);
router.delete('/:id', canManage, objectIdParam('id'), validate, deletePayroll);

router.post('/:id/process', canManage, objectIdParam('id'), decisionRules, validate, transitionPayroll('process'));
router.post('/:id/review', canManage, objectIdParam('id'), decisionRules, validate, transitionPayroll('review'));
router.post('/:id/approve', canManage, objectIdParam('id'), decisionRules, validate, transitionPayroll('approve'));
router.post('/:id/pay', canManage, objectIdParam('id'), decisionRules, validate, transitionPayroll('pay'));
router.post('/:id/revert', canManage, objectIdParam('id'), decisionRules, validate, revertPayroll);

export default router;
