import axios from 'axios'

const API_BASE_URL = 'http://localhost:5001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth APIs
export const authAPI = {
  login: (payload) => api.post('/auth/signin', payload),
}

// Dashboard APIs - Using admin stats endpoint
export const dashboardAPI = {
  getStats: () => api.get('/admin/stats'),
}

// Products APIs - Using admin routes
export const productsAPI = {
  getAll: () => api.get('/admin/products'),
  add: (payload) => api.post('/admin/products', payload),
  update: (id, payload) => api.patch(`/admin/products/${id}`, payload),
  remove: (id) => api.delete(`/admin/products/${id}`),
  getById: (id) => api.get(`/products/${id}`), // Use public route for single product
}

// Orders APIs - Using admin routes
export const ordersAPI = {
  getAll: () => api.get('/admin/orders'),
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getById: (id) => api.get(`/admin/orders/${id}`),
}

// Categories APIs - Using header routes for categories
export const categoriesAPI = {
  getAll: () => api.get('/header/categories/collection'),
  add: (payload) => api.post('/categories', payload), // This might need to be implemented
  remove: (id) => api.delete(`/categories/${id}`), // This might need to be implemented
}

// Users APIs - Note: This might need to be implemented in backend
export const usersAPI = {
  getAll: () => api.get('/admin/users'), // This might need to be implemented
  remove: (id) => api.delete(`/admin/users/${id}`), // This might need to be implemented
}

export default api

