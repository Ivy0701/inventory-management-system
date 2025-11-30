import { Router } from 'express';
import { getOrders, createOrder, confirmOrderReceipt, returnOrder, cancelOrder, confirmOrder, shipOrder } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all routes (optional, allows guest access)
router.use(authenticateToken);

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/confirm', confirmOrder);
router.patch('/:id/ship', shipOrder);
router.patch('/:id/confirm-receipt', confirmOrderReceipt);
router.patch('/:id/return', returnOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;

