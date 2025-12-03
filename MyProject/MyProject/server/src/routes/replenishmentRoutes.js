import { Router } from 'express';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import {
  getReplenishmentAlerts,
  getReplenishmentProgress,
  submitReplenishmentApplication,
  getReplenishmentApplications,
  updateReplenishmentApplicationStatus
} from '../controllers/replenishmentController.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAuth);

router.get('/alerts', getReplenishmentAlerts);
router.get('/progress', getReplenishmentProgress);
router.post('/applications', submitReplenishmentApplication);
router.get('/applications', getReplenishmentApplications);
router.patch('/applications/:requestId', updateReplenishmentApplicationStatus);

export default router;

