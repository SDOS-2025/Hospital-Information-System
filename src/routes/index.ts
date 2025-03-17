import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import thesisRoutes from './thesis.routes';
import feeRoutes from './fee.routes';
import grievanceRoutes from './grievance.routes';
// Import other route modules as they are created
// import leaveRoutes from './leave.routes';
// import examRoutes from './exam.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/thesis', thesisRoutes);
router.use('/fees', feeRoutes);
router.use('/grievances', grievanceRoutes);
// router.use('/leaves', leaveRoutes);
// router.use('/exams', examRoutes);

export default router;