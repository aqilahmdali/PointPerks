import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Handle 401 globally - auto logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout'),
  googleLogin: (referralCode) => {
    const base = process.env.REACT_APP_GOOGLE_REDIRECT || 'http://localhost:5000/api/auth/google';
    window.location.href = referralCode ? `${base}?ref=${encodeURIComponent(referralCode)}` : base;
  },
};

// Vouchers
export const voucherAPI = {
  getAll: (params) => API.get('/vouchers', { params }),
  getOne: (id) => API.get(`/vouchers/${id}`),
  getCategories: () => API.get('/vouchers/categories'),
  create: (data) => API.post('/vouchers', data),
  update: (id, data) => API.put(`/vouchers/${id}`, data),
  delete: (id) => API.delete(`/vouchers/${id}`),
  toggle: (id) => API.patch(`/vouchers/${id}/toggle`),
};

// Redemptions
export const redemptionAPI = {
  redeem: (voucherId) => API.post('/redemptions', { voucherId }),
  getMy: (params) => API.get('/redemptions/my', { params }),
  getOne: (id) => API.get(`/redemptions/${id}`),
  downloadPDF: (id) => API.get(`/redemptions/${id}/pdf`, { responseType: 'blob' }),
  cancel: (id) => API.post(`/redemptions/${id}/cancel`),
  getAll: (params) => API.get('/redemptions', { params }),
  markUsed: (id) => API.patch(`/redemptions/${id}/mark-used`),
  delete: (id) => API.delete(`/redemptions/${id}`),
};

// Users
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  getPointsHistory: (params) => API.get('/users/points-history', { params }),
  getAll: (params) => API.get('/users', { params }),
  getOne: (id) => API.get(`/users/${id}`),
  updateRole: (id, role) => API.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => API.patch(`/users/${id}/toggle`),
  adjustPoints: (id, data) => API.patch(`/users/${id}/points`, data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => API.get('/analytics/dashboard'),
  getTopVouchers: (limit) => API.get('/analytics/top-vouchers', { params: { limit } }),
  getLowVouchers: (limit) => API.get('/analytics/low-vouchers', { params: { limit } }),
  getRedemptionsOverTime: (params) => API.get('/analytics/redemptions-over-time', { params }),
  getCategoryBreakdown: () => API.get('/analytics/category-breakdown'),
  getUserActivity: (limit) => API.get('/analytics/user-activity', { params: { limit } }),
  getGrossValue: (params) => API.get('/analytics/gross-value', { params }),
  getAvgTimeToRedeem: (params) => API.get('/analytics/avg-time-to-redeem', { params }),
  getUserGrowth: (params) => API.get('/analytics/user-growth', { params }),
};

// Referrals
export const referralAPI = {
  getMy: () => API.get('/referrals/my'),
  validate: (code) => API.get(`/referrals/validate/${code}`),
  getAll: () => API.get('/referrals'),
};

export default API;
