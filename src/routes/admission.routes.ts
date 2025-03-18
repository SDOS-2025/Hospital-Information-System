import { Router } from 'express';
import { AdmissionController } from '../controllers/admission.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AsyncRequestHandler } from '../types/express.types';

const admissionController = new AdmissionController();
const router = Router();

const wrapHandler = (handler: Function): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
};

const wrapMiddleware = (middleware: Function): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

router.post('/', wrapHandler(admissionController.submitApplication));

router.post(
  '/bulk',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.bulkSubmitApplications)
);

router.post(
  '/bulk-status',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.bulkUpdateStatus)
);

router.post('/:id/documents', wrapHandler(admissionController.uploadDocuments));

router.get(
  '/',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.getAllAdmissions)
);

router.get(
  '/:id',
  wrapMiddleware(authenticate),
  wrapHandler(admissionController.getAdmissionById)
);

router.put(
  '/:id',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.updateAdmission)
);

router.post(
  '/:id/schedule-interview',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.scheduleInterview)
);

router.post(
  '/:id/interview-results',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN, UserRole.FACULTY)),
  wrapHandler(admissionController.recordInterviewResults)
);

router.post(
  '/:id/complete-enrollment',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.completeEnrollment)
);

router.delete(
  '/:id',
  wrapMiddleware(authenticate),
  wrapMiddleware(authorize(UserRole.ADMIN)),
  wrapHandler(admissionController.cancelAdmission)
);

export default router;