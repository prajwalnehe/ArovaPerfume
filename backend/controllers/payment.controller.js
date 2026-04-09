import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import { Address } from '../models/Address.js';

const getClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!key_id || !key_secret) return null;
  return { client: new Razorpay({ key_id, key_secret }), key_id, key_secret };
};

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body || {};
    const rupees = Number(amount);
    if (!rupees || Number.isNaN(rupees) || rupees <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const ctx = getClient();
    if (!ctx) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    const options = {
      amount: Math.round(rupees * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    };

    const order = await ctx.client.orders.create(options);
    return res.json({ order, key: ctx.key_id });
  } catch (err) {
    console.error('Razorpay createOrder error:', err?.message || err);
    if (err?.error?.description) console.error('Razorpay API:', err.error.description);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const ctx = getClient();
    if (!ctx) {
      return res.status(500).json({ error: 'Server secret missing' });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', ctx.key_secret).update(payload).digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Prepare order items with name and image
    const orderItems = cart.items.map(i => {
      const p = i.product;
      // Get price from product.pricing.salePrice (correct field from Product model)
      let base = Number(p?.pricing?.salePrice) || 0;
      if (!base && p?.pricing?.mrp) {
        // Fallback: calculate from MRP if salePrice not set
        const mrp = Number(p.pricing.mrp) || 0;
        const discountPercent = Number(p.pricing.discountPercent) || 0;
        base = Math.round(mrp - (mrp * discountPercent) / 100) || mrp;
      }
      return { 
        product: p._id, 
        name: p.title || p.name || 'Product',
        image: p.images?.[0] || p.images?.image1 || p.image || '',
        quantity: i.quantity, 
        price: base, 
        size: i.size || undefined 
      };
    });
    
    // Calculate price breakdown
    const itemsPrice = orderItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const taxPrice = Math.round(itemsPrice * 0.05); // 5% tax
    
    // Shipping price logic: Free if order > 5000, else ₹99
    const shippingPrice = itemsPrice >= 5000 ? 0 : 99;
    
    // Apply coupon discount if available
    let discount = 0;
    let couponCode = null;
    if (cart.appliedCoupon && cart.appliedCoupon.discountAmount > 0) {
      discount = cart.appliedCoupon.discountAmount;
      couponCode = cart.appliedCoupon.code;
      console.log('[Razorpay Order] Applying coupon:', couponCode, 'discount:', discount);
    }
    
    // Calculate total price
    const totalPrice = itemsPrice + taxPrice + shippingPrice - discount;

    // Load user's current address to snapshot into the order
    let shippingAddress = null;
    try {
      const addr = await Address.findOne({ userId });
      if (addr) {
        const { fullName, mobileNumber, pincode, locality, address, city, state, landmark, alternatePhone, addressType } = addr;
        shippingAddress = { fullName, mobileNumber, pincode, locality, address, city, state, landmark, alternatePhone, addressType };
      }
    } catch {}

    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('[Razorpay Order] Creating order with userId:', userId);
    console.log('[Razorpay Order] userObjectId:', userObjectId);

    const order = await Order.create({
      user: userObjectId,
      items: orderItems,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      totalPrice,
      couponCode,
      couponDiscount: discount,
      isPaid: true,
      paidAt: new Date(),
      currency: 'INR',
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      shippingAddress,
    });

    cart.items = [];
    cart.appliedCoupon = undefined; // Clear applied coupon
    await cart.save();

    console.log('[Razorpay Order] Created successfully:', order._id);
    console.log('[Razorpay Order] Saved user field:', order.user);
    return res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay verifyPayment error:', err?.message || err);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

export const createCODOrder = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      console.error('COD Order: No userId found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      console.error('COD Order: Cart is empty for user', userId);
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Prepare order items with name and image
    const orderItems = cart.items.map(i => {
      const p = i.product;
      // Get price from product.pricing.salePrice (correct field from Product model)
      let base = Number(p?.pricing?.salePrice) || 0;
      if (!base && p?.pricing?.mrp) {
        // Fallback: calculate from MRP if salePrice not set
        const mrp = Number(p.pricing.mrp) || 0;
        const discountPercent = Number(p.pricing.discountPercent) || 0;
        base = Math.round(mrp - (mrp * discountPercent) / 100) || mrp;
      }
      return { 
        product: p._id, 
        name: p.title || p.name || 'Product',
        image: p.images?.[0] || p.images?.image1 || p.image || '',
        quantity: i.quantity, 
        price: base, 
        size: i.size || undefined 
      };
    });
    
    // Calculate price breakdown
    const itemsPrice = orderItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const taxPrice = Math.round(itemsPrice * 0.05); // 5% tax
    
    // Shipping price logic: Free if order > 5000, else ₹99
    const shippingPrice = itemsPrice >= 5000 ? 0 : 99;
    
    // Apply coupon discount if available
    let discount = 0;
    let couponCode = null;
    if (cart.appliedCoupon && cart.appliedCoupon.discountAmount > 0) {
      discount = cart.appliedCoupon.discountAmount;
      couponCode = cart.appliedCoupon.code;
      console.log('[COD Order] Applying coupon:', couponCode, 'discount:', discount);
    }
    
    // Calculate total price
    const totalPrice = itemsPrice + taxPrice + shippingPrice - discount;

    // Load user's current address to snapshot into the order
    let shippingAddress = null;
    try {
      const addr = await Address.findOne({ userId });
      if (addr) {
        const { fullName, mobileNumber, pincode, locality, address, city, state, landmark, alternatePhone, addressType } = addr;
        shippingAddress = { fullName, mobileNumber, pincode, locality, address, city, state, landmark, alternatePhone, addressType };
      } else {
        console.error('COD Order: No address found for user', userId);
      }
    } catch (addrErr) {
      console.error('COD Order: Error fetching address:', addrErr?.message || addrErr);
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required. Please save your delivery address first.' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('[COD Order] Creating order with userId:', userId);
    console.log('[COD Order] userObjectId:', userObjectId);
    console.log('[COD Order] userObjectId type:', typeof userObjectId);
    console.log('[COD Order] userObjectId.toString():', userObjectId.toString());

    const order = await Order.create({
      user: userObjectId,
      items: orderItems,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      totalPrice,
      couponCode,
      couponDiscount: discount,
      isPaid: false,
      currency: 'INR',
      status: 'pending',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      paymentMethod: 'cod',
      shippingAddress,
    });

    cart.items = [];
    cart.appliedCoupon = undefined; // Clear applied coupon
    await cart.save();

    console.log('[COD Order] Created successfully:', order._id);
    console.log('[COD Order] Saved user field:', order.user);
    console.log('[COD Order] Saved user field type:', typeof order.user);
    console.log('[COD Order] Saved user field toString:', order.user.toString());
    return res.json({ success: true, order });
  } catch (err) {
    console.error('Create COD order error:', err?.message || err);
    console.error('Stack:', err?.stack);
    return res.status(500).json({ error: err?.message || 'Failed to create COD order' });
  }
};
