import express from 'express';
import { getUserOrders, getUserOrderById } from '../controllers/userOrder.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/orders - Get all orders for logged-in user
router.get('/', auth, getUserOrders);

// GET /api/orders/:orderId - Get single order by ID
router.get('/:orderId', auth, getUserOrderById);

export default router;
