import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function cookieJwtAuth(req, res, next) {
  try {
    // Check cookies first, then Authorization header
    let token = req.cookies?.jwt || req.cookies?.token;
    if (!token) {
      const authHeader = req.headers.authorization || '';
      const parts = authHeader.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }
    if (!token) return res.status(401).json({ message: 'No auth token' });
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret);
    const userId = payload.id || payload._id || payload.userId;
    if (!userId) return res.status(401).json({ message: 'Invalid token' });
    const user = await User.findById(userId).select('name email isAdmin googleId avatar provider');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    req.userId = String(user._id);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
