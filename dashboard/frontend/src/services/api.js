/**
 * API Service - Axios wrapper for backend communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth if needed
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH ENDPOINTS
// ============================================================

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  changePassword: (username, oldPassword, newPassword) =>
    api.post('/auth/change-password', { username, oldPassword, newPassword }),
};

// ============================================================
// APPROVALS ENDPOINTS
// ============================================================

export const approvalsAPI = {
  list: (params = {}) => api.get('/approvals', { params }),

  get: (id) => api.get(`/approvals/${id}`),

  approve: (id, reviewedBy) =>
    api.post(`/approvals/${id}/approve`, { reviewed_by: reviewedBy }),

  reject: (id, reviewedBy, notes) =>
    api.post(`/approvals/${id}/reject`, { reviewed_by: reviewedBy, notes }),

  edit: (id, caption, hashtags) =>
    api.put(`/approvals/${id}/edit`, { caption, hashtags }),

  stats: () => api.get('/approvals/stats/summary'),
};

// ============================================================
// ACCOUNTS ENDPOINTS
// ============================================================

export const accountsAPI = {
  list: (params = {}) => api.get('/accounts', { params }),

  get: (id) => api.get(`/accounts/${id}`),

  create: (data) => api.post('/accounts', data),

  update: (id, data) => api.put(`/accounts/${id}`, data),

  delete: (id) => api.delete(`/accounts/${id}`),

  toggle: (id) => api.post(`/accounts/${id}/toggle`),
};

// ============================================================
// STATS ENDPOINTS
// ============================================================

export const statsAPI = {
  overview: () => api.get('/stats/overview'),

  activity: (params = {}) => api.get('/stats/activity', { params }),

  performance: (params = {}) => api.get('/stats/performance', { params }),

  costs: (params = {}) => api.get('/stats/costs', { params }),
};

// ============================================================
// VIDEO ENDPOINTS
// ============================================================

export const videoAPI = {
  stream: (id) => `${API_BASE_URL}/videos/${id}`,

  thumbnail: (id) => `${API_BASE_URL}/videos/${id}/thumbnail`,
};

export default api;
