import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { getAllOrders, updateOrderStatus, getOrderItems } from '../controllers/orderController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { getUsers, updateUserRole, deleteUser } from '../controllers/userController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

const router = Router();
router.use(authenticate, adminOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Products
router.post('/products', upload.array('images', 10), createProduct);
router.put('/products/:id', upload.array('images', 10), updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id/items', getOrderItems);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Categories
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
