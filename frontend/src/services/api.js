import axios from 'axios';

function normalizeApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  // Default to Vite proxy route: /api -> http://localhost:5000
  if (!envUrl) return '/api';

  // Prevent misconfiguration like:
  // - VITE_API_URL ending with /api (would become /api/api)
  // - accidental whitespace
  const trimmed = String(envUrl).trim().replace(/\/+$/, '');

  // If someone already provided a URL that ends with /api, don't append again
  if (trimmed.endsWith('/api')) return trimmed;

  // Otherwise append /api once
  return `${trimmed}/api`;
}

const baseURL = normalizeApiBaseUrl();
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get('/products/categories'),
  getFeatured: () => api.get('/products/featured'),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, data) => api.put(`/cart/${id}`, data),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  track: (trackingId) => api.get(`/orders/track/${encodeURIComponent(trackingId)}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Product CRUD with FormData support for file uploads
  createProduct: (data) => {
    if (data instanceof FormData) {
      return api.post('/admin/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/products', data);
  },
  updateProduct: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/admin/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/admin/products/${id}`, data);
  },
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getOrderItems: (id) => api.get(`/admin/orders/${id}/items`),

  // Users
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  getCategory: (id) => api.get(`/admin/categories/${id}`),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

export default api;
