import { Router } from 'express';
import { getProducts, getProduct, getCategories, getFeaturedProducts } from '../controllers/productController.js';

const router = Router();
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProduct);

export default router;
