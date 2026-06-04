import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createOrder, getOrders, getOrder,
  trackOrderPublic,
} from '../controllers/orderController.js';

const router = Router();

router.get('/track/:trackingId', trackOrderPublic);

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

export default router;
