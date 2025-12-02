import { Router } from 'express';
import { initializeInventory, getInventory } from '../controllers/inventoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

router.post('/initialize', initializeInventory);
router.get('/', getInventory);

export default router;

