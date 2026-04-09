// Backend base URL – prefer VITE_API_URL, fallback to local 5001
// VITE_API_URL can be with or without `/api` suffix; we normalize below.
const RAW_API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');
const API_BASE_URL = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isCookieSession = token === 'cookie' || (token && !token.includes('.'));
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(!isCookieSession && token ? { Authorization: `Bearer ${token}` } : {}),
  };
  try {
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `Request failed with status ${res.status}`);
    return data;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`);
    }
    throw error;
  }
}

export const api = {
  signin: (payload) => request('/auth/signin', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  sendOTP: (payload) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOTP: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  me: async () => {
    try {
      return await request('/me', { method: 'GET' });
    } catch (e) {
      // Fallback for header-token based auth
      return await request('/auth/me', { method: 'GET' });
    }
  },
  // Cart endpoints
  getCart: () => request('/cart', { method: 'GET' }),
  addToCart: ({ productId, quantity = 1, size }) => request('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity, size }) }),
  removeFromCart: (productId) => request(`/cart/remove/${productId}`, { method: 'DELETE' }),
  updateCart: ({ productId, quantity }) => request('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity }) }),
  // Coupon endpoints (both now use JWT token for user identification)
  applyCoupon: (payload) => request('/coupons/apply', { method: 'POST', body: JSON.stringify(payload) }),
  getCoupons: () => request('/coupons', { method: 'GET' }),
  // Cart coupon endpoints
  applyCouponToCart: (payload) => request('/cart/coupon', { method: 'POST', body: JSON.stringify(payload) }),
  removeCouponFromCart: () => request('/cart/coupon', { method: 'DELETE' }),
  // Admin endpoints
  admin: {
    stats: () => request('/admin/stats', { method: 'GET' }),
    createProduct: (payload) => request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
    updateProduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    listProducts: () => request('/admin/products', { method: 'GET' }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    listOrders: () => request('/admin/orders', { method: 'GET' }),
    getOrder: (id) => request(`/admin/orders/${id}`, { method: 'GET' }),
    listAddresses: () => request('/admin/addresses', { method: 'GET' }),
    updateOrderStatus: (id, status) => request(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus: status }) }),
    updateOrder: (id, payload) => request(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    // Policy endpoints
    getPolicies: () => request('/admin/policies', { method: 'GET' }),
    getPolicy: (type) => request(`/admin/policies/${type}`, { method: 'GET' }),
    updatePolicy: (type, payload) => request(`/admin/policies/${type}`, { method: 'PUT', body: JSON.stringify(payload) }),
    // Logo endpoints
    getLogo: () => request('/admin/logo', { method: 'GET' }),
    updateLogo: (payload) => request('/admin/logo', { method: 'PUT', body: JSON.stringify(payload) }),
    // Hero Slider endpoints
    getHeroSlider: () => request('/admin/hero-slider', { method: 'GET' }),
    updateHeroSlider: (payload) => request('/admin/hero-slider', { method: 'PUT', body: JSON.stringify(payload) }),
  },
  // Public policy endpoint
  getPolicy: (type) => request(`/policy/${type}`, { method: 'GET' }),
  // Public settings endpoint
  getLogo: () => request('/settings/logo', { method: 'GET' }),
  // Public hero slider endpoint
  getHeroSlider: () => request('/settings/hero-slider', { method: 'GET' }),
};

export default api;



