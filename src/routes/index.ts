import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import thesisRoutes from './thesis.routes';
import feeRoutes from './fee.routes';
import grievanceRoutes from './grievance.routes';
import examRoutes from './exam.routes';
import leaveRoutes from './leave.routes';
import admissionRoutes from './admission.routes';
import auditRoutes from './audit.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/thesis', thesisRoutes);
router.use('/fees', feeRoutes);
router.use('/grievances', grievanceRoutes);
router.use('/exams', examRoutes);
router.use('/leaves', leaveRoutes);
router.use('/admissions', admissionRoutes);
router.use('/audit', auditRoutes);

export default router;