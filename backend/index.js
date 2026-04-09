import { configDotenv } from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport, { setupPassport } from './config/passport.js';

import authRoutes from './routes/auth.routes.js';
import headerRoutes from './routes/header.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import addressRoutes from './routes/address.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import adminRoutes from './routes/admin.routes.js';
import policyRoutes from './routes/policy.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import couponRoutes from './routes/coupon.routes.js';

import connectDB from './config/DataBaseConnection.js';
import cookieJwtAuth from './middleware/authMiddleware.js';

configDotenv();

console.log(
  'Razorpay env loaded:',
  Boolean(process.env.RAZORPAY_KEY_ID),
  Boolean(process.env.RAZORPAY_KEY_SECRET)
);

const server = express();

// When behind proxy (Render)
server.set('trust proxy', 1);

// 🚀 **OPEN CORS FOR ALL ORIGINS**
server.use(
  cors({
    origin: true,  // reflects request origin automatically
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

server.use(express.json());
server.use(cookieParser());

// Initialize Passport
setupPassport();
server.use(passport.initialize());

// Health check
server.get('/api/health', (req, res) => res.json({ ok: true }));

// Current user route (cookie + JWT)
server.get('/api/me', cookieJwtAuth, (req, res) => {
  res.json({ user: req.user });
});

// Routes
server.use('/api/auth', authRoutes);
server.use('/api/header', headerRoutes);
server.use('/api/products', productRoutes);
server.use('/api/cart', cartRoutes);
server.use('/api/payment', paymentRoutes);
server.use('/api/address', addressRoutes);
server.use('/api/orders', ordersRoutes);
server.use('/api/admin', adminRoutes);
server.use('/api/policy', policyRoutes);
server.use('/api/settings', settingsRoutes);
server.use('/api/coupons', couponRoutes);

const PORT = process.env.PORT || 5000;

// Connect DB
await connectDB(process.env.MONGODB_URI || '');

// Start server
server.listen(PORT, () => {
  console.log('Server is running at', PORT);
});
