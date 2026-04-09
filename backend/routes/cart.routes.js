import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  applyCouponToCart,
  removeCouponFromCart,
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

// POST /api/cart/coupon -> apply coupon
router.post('/coupon', auth, applyCouponToCart);

// DELETE /api/cart/coupon -> remove coupon
router.delete('/coupon', auth, removeCouponFromCart);

export default router;
