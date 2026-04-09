import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  applyCoupon,
  incrementCouponUsage,
  getCouponById,
  updateCoupon,
  getAllCouponsAdmin,
  toggleCouponStatus
} from '../controllers/coupon.controller.js';
import adminOnly from '../middleware/admin.js';
import cookieJwtAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected user routes - require auth
router.post('/apply', cookieJwtAuth, applyCoupon);
router.get('/', cookieJwtAuth, getAllCoupons); // Protected - uses JWT userId to filter first order coupons

// Protected admin routes - require auth + admin
router.post('/', cookieJwtAuth, adminOnly, createCoupon);
router.get('/admin/all', cookieJwtAuth, adminOnly, getAllCouponsAdmin);
router.get('/:id', cookieJwtAuth, adminOnly, getCouponById);
router.put('/:id', cookieJwtAuth, adminOnly, updateCoupon);
router.patch('/:id/toggle', cookieJwtAuth, adminOnly, toggleCouponStatus);
router.delete('/:id', cookieJwtAuth, adminOnly, deleteCoupon);
router.post('/increment', cookieJwtAuth, adminOnly, incrementCouponUsage);

export default router;
