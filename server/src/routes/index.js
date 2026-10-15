import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import employeeRoutes from './employee.routes.js';
import organizationRoutes from './organization.routes.js';
import attendanceRoutes from './attendance.routes.js';
import leaveRoutes from './leave.routes.js';
import holidayRoutes from './holiday.routes.js';
import eventRoutes from './event.routes.js';
import payrollRoutes from './payroll.routes.js';
import documentRoutes from './document.routes.js';
import settingsRoutes from './settings.routes.js';
import jobRoutes from './job.routes.js';
import candidateRoutes from './candidate.routes.js';
import searchRoutes from './search.routes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/organization', organizationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/events', eventRoutes);
router.use('/payroll', payrollRoutes);
router.use('/documents', documentRoutes);
router.use('/settings', settingsRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);
router.use('/search', searchRoutes);

router.get('/protected-demo', authenticate, (req, res) => {
  res.json({ success: true, message: `Hello ${req.user.fullName}` });
});

export default router;
