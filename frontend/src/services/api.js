// VITE_API_URL can be set either to:
// - http://localhost:7000/api
// - http://localhost:7000
// We normalize it to always include `/api` since backend mounts routes under `/api/*`.
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:7000').replace(/\/$/, '');
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

export const fetchSarees = async (category, options = {}) => {
  try {
    const { page, limit } = options;
    const params = new URLSearchParams();
    
    if (category) {
      params.append('category', category);
    }
    if (page) {
      params.append('page', page.toString());
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch sarees');
    }
    const data = await response.json();
    
    // Handle both old format (array) and new format (object with products and pagination)
    if (Array.isArray(data)) {
      return data;
    }
    return data;
  } catch (error) {
    console.error('Error fetching sarees:', error);
    throw error;
  }
};

export const fetchSareeById = async (id) => {
  try {
    if (!id || id === '0' || id === 'undefined' || id === 'null') {
      throw new Error('Invalid product id');
    }
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch saree details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching saree details:', error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data.navigation.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Fetch COLLECTION categories
export const fetchCollectionCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/collection`);
    if (!response.ok) {
      throw new Error('Failed to fetch COLLECTION categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching COLLECTION categories:', error);
    throw error;
  }
};

// Fetch MEN categories
export const fetchMenCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/men`);
    if (!response.ok) {
      throw new Error('Failed to fetch MEN categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching MEN categories:', error);
    throw error;
  }
};

// Fetch WOMEN categories
export const fetchWomenCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/women`);
    if (!response.ok) {
      throw new Error('Failed to fetch WOMEN categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching WOMEN categories:', error);
    throw error;
  }
};

// Fetch BOYS categories
export const fetchBoysCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/boys`);
    if (!response.ok) {
      throw new Error('Failed to fetch BOYS categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BOYS categories:', error);
    throw error;
  }
};

// Fetch GIRLS categories
export const fetchGirlsCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/girls`);
    if (!response.ok) {
      throw new Error('Failed to fetch GIRLS categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching GIRLS categories:', error);
    throw error;
  }
};

// Fetch SISHU categories
export const fetchSishuCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/header/categories/sishu`);
    if (!response.ok) {
      throw new Error('Failed to fetch SISHU categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching SISHU categories:', error);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await fetch(`${API_URL}/header/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

const authHeaders = () => {
  const token = (() => { try { return localStorage.getItem('auth_token'); } catch { return null; } })();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getMyAddress = async () => {
  const res = await fetch(`${API_URL}/address/me`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch address');
  return res.json();
};

export const saveMyAddress = async (payload) => {
  const res = await fetch(`${API_URL}/address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to save address');
  return res.json();
};

export const updateAddressById = async (id, payload) => {
  const res = await fetch(`${API_URL}/address/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update address');
  return res.json();
};

export const deleteAddressById = async (id) => {
  const res = await fetch(`${API_URL}/address/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete address');
  return res.json();
};

export const createPaymentOrder = async (amount, notes = {}) => {
  const res = await fetch(`${API_URL}/payment/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ amount, currency: 'INR', notes }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create payment order');
  return res.json();
};

export const verifyPayment = async (payload) => {
  const res = await fetch(`${API_URL}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to verify payment');
  return res.json();
};

export const createCODOrder = async () => {
  try {
    const res = await fetch(`${API_URL}/payment/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
    });
    
    const contentType = res.headers.get('content-type');
    let errorData = {};
    
    if (!res.ok) {
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
        } else {
          const text = await res.text();
          errorData = { message: text || `HTTP ${res.status} ${res.statusText}` };
        }
      } catch (parseError) {
        errorData = { message: `HTTP ${res.status} ${res.statusText}` };
      }
      
      const errorMessage = errorData?.error || errorData?.message || `Failed to create COD order (${res.status})`;
      console.error('COD Order Error:', errorMessage, errorData);
      throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to server. Please check your connection.');
      console.error('COD Order Network Error:', networkError);
      throw networkError;
    }
    // Re-throw other errors (they already have the message)
    throw error;
  }
};

export const getMyOrders = async () => {
  const res = await fetch(`${API_URL}/orders`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};
