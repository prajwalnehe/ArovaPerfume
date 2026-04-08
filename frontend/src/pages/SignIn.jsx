import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { FiPhone } from 'react-icons/fi';

const SignIn = () => {
  const rawApiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');
  const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
  const googleAuthUrl = `${apiBase}/api/auth/google`;

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'otp'
  
  // Email/Password form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // OTP form data
  const [otpData, setOtpData] = useState({
    mobile: '',
    otp: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    setOtpData({ ...otpData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const resp = await api.signin({ email: formData.email, password: formData.password });
      // store token then redirect to intended page or home
      if (resp?.token) localStorage.setItem('auth_token', resp.token);
      if (resp?.user?.isAdmin) {
        localStorage.setItem('auth_is_admin', 'true');
      } else {
        try { localStorage.removeItem('auth_is_admin'); } catch {}
      }
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(otpData.mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOTP(true);
    try {
      const resp = await api.sendOTP({ mobile: otpData.mobile });
      setSuccess(resp.message || 'OTP sent successfully');
      setOtpSent(true);
      
      // Start countdown timer (10 minutes = 600 seconds)
      setOtpTimer(600);
      const timerInterval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const resp = await api.verifyOTP({
        mobile: otpData.mobile,
        otp: otpData.otp,
      });
      
      // Store token and redirect
      if (resp?.token) localStorage.setItem('auth_token', resp.token);
      if (resp?.user?.isAdmin) {
        localStorage.setItem('auth_is_admin', 'true');
      } else {
        try { localStorage.removeItem('auth_is_admin'); } catch {}
      }
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200">
      <div className="flex h-screen">
        {/* Left Side - Logo */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 items-center justify-center">
          <div className="text-center">
            <Link to="/" className="inline-block mb-8">
              <h1 className="text-5xl font-serif font-bold text-black">
                ArovaPerfume
              </h1>
            </Link>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-block mb-6">
                <h1 className="text-2xl font-serif font-bold text-black">
                  ArovaPerfume
                </h1>
              </Link>
            </div>

            {/* Form Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-serif font-semibold text-neutral-800 mb-1">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to your account to continue shopping
              </p>
            </div>

            {/* Sign In Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100">
              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email');
                    setError('');
                    setSuccess('');
                    setOtpSent(false);
                    setOtpTimer(0);
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === 'email'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setError('');
                    setSuccess('');
                    setOtpSent(false);
                    setOtpTimer(0);
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === 'otp'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Login with OTP
                </button>
              </div>

              {error && (<div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>)}
              {success && (<div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</div>)}

              {/* Email/Password Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-rose-500 focus:ring-rose-400 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(location.state?.from?.pathname || '/')}
                  className="w-full mt-2 border border-neutral-200 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-50 transition-all duration-300"
                >
                  Continue as Guest
                </button>
              </form>
              )}

              {/* OTP Login Form */}
              {loginMethod === 'otp' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                          <FiPhone className="w-4 h-4" />
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={otpData.mobile}
                          onChange={handleOtpChange}
                          required
                          maxLength="10"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                          placeholder="Enter 10-digit mobile number"
                        />
                        <p className="mt-1 text-xs text-gray-500">We'll send you a 6-digit OTP</p>
                      </div>

                      <button
                        type="submit"
                        disabled={sendingOTP}
                        className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {sendingOTP ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <div>
                        <label htmlFor="mobile-display" className="block text-sm font-medium text-neutral-700 mb-2">
                          Mobile Number
                        </label>
                        <div className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-gray-50 text-gray-600">
                          +91 {otpData.mobile}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpData({ ...otpData, otp: '' });
                            setError('');
                            setSuccess('');
                          }}
                          className="mt-1 text-xs text-rose-500 hover:text-rose-600"
                        >
                          Change number
                        </button>
                      </div>

                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-2">
                          Enter OTP
                        </label>
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          value={otpData.otp}
                          onChange={handleOtpChange}
                          required
                          maxLength="6"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                          placeholder="000000"
                        />
                        {otpTimer > 0 && (
                          <p className="mt-2 text-xs text-gray-500 text-center">
                            OTP expires in: <span className="font-semibold text-rose-600">{formatTimer(otpTimer)}</span>
                          </p>
                        )}
                        {otpTimer === 0 && otpSent && (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-medium"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-rose-500 hover:text-rose-600 font-semibold transition-colors"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>

              <div className="mt-4">
                <a
                  href={googleAuthUrl}
                  className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z" />
                  </svg>
                  Continue with Google
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;