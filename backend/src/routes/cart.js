import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cartController.js';

const router = Router();
router.use(authenticate);
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/', clearCart);

export default router;
