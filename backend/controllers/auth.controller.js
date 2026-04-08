import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';

function generateJwt(userId) {
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '7d' });
}

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const token = generateJwt(user.id);
    return res.status(201).json({
      message: 'Account created',
      user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.isAdmin },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

export async function signin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateJwt(user.id);
    return res.json({
      message: 'Signed in',
      user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.isAdmin },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Signin failed', error: err.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If account exists, email sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = expires;
    await user.save();

    // Normally send email with link containing token; for now, return token
    return res.json({ message: 'Reset token generated', token });
  } catch (err) {
    return res.status(500).json({ message: 'Forgot password failed', error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.passwordHash = await User.hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Reset password failed', error: err.message });
  }
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via FAST2SMS
async function sendOTPviaSMS(mobile, otp) {
  try {
    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '1wFebuyq627952JQjs2c1Q4hafm8Ss5yGkxY44jX9uJbHXVGkimYiLoEmy2q';
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    
    // FAST2SMS expects numbers as a string (comma-separated for multiple)
    const message = `Your ArovaPerfume login OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: mobile
      })
    });

    const data = await response.json();
    // FAST2SMS returns success if return is true
    if (data.return === true) {
      return true;
    }
    
    // Alternative: Try OTP route
    const otpResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: mobile
      })
    });
    
    const otpData = await otpResponse.json();
    return otpData.return === true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

// Send OTP to mobile number
export async function sendOTP(req, res) {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: 'Invalid mobile number. Please enter a valid 10-digit mobile number.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this mobile
    await OTP.deleteMany({ mobile });

    // Save OTP
    await OTP.create({
      mobile,
      otp,
      expiresAt
    });

    // Send OTP via SMS
    const sent = await sendOTPviaSMS(mobile, otp);
    
    if (!sent) {
      // In development, return OTP for testing
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          message: 'OTP sent (dev mode)', 
          otp: otp // Only in development
        });
      }
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

    return res.json({ message: 'OTP sent successfully to your mobile number' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
}

// Verify OTP and login/signup
export async function verifyOTP(req, res) {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      mobile,
      otp,
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ phone: mobile });
    
    if (!user) {
      // Create new user with default name based on mobile number
      const defaultName = `User ${mobile.slice(-4)}`;
      user = await User.create({
        name: defaultName,
        phone: mobile,
        provider: 'local'
      });
    }

    // Generate JWT token
    const token = generateJwt(user.id);
    
    return res.json({
      message: 'Login successful',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email || null, 
        phone: user.phone,
        isAdmin: !!user.isAdmin 
      },
      token
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
}

export default { signup, signin, forgotPassword, resetPassword, sendOTP, verifyOTP };


