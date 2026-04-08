import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from '../controllers/cart.controller.js';

const router = Router();

// GET /api/cart -> current user's cart
router.get('/', auth, getCart);

// POST /api/cart/add -> { productId, quantity?, size? }
router.post('/add', auth, addToCart);

// DELETE /api/cart/remove/:productId -> remove by productId
router.delete('/remove/:productId', auth, removeFromCart);

// PUT /api/cart/update -> { productId, quantity }
router.put('/update', auth, updateCartItemQuantity);

export default router;
