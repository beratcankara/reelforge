import axios from 'axios';
import { USE_MOCK_DATA, mockApi } from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('session');
  if (session) {
    config.headers.Authorization = `Bearer ${session}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Mock API wrapper - intercepts calls when in dev mode
export const apiClient = {
  get: async (url: string, config?: any) => {
    if (USE_MOCK_DATA) {
      return handleMockRequest('GET', url, config);
    }
    return api.get(url, config);
  },
  post: async (url: string, data?: any, config?: any) => {
    if (USE_MOCK_DATA) {
      return handleMockRequest('POST', url, { ...config, data });
    }
    return api.post(url, data, config);
  },
  patch: async (url: string, data?: any, config?: any) => {
    if (USE_MOCK_DATA) {
      return handleMockRequest('PATCH', url, { ...config, data });
    }
    return api.patch(url, data, config);
  },
  put: async (url: string, data?: any, config?: any) => {
    if (USE_MOCK_DATA) {
      return handleMockRequest('PUT', url, { ...config, data });
    }
    return api.put(url, data, config);
  },
  delete: async (url: string, config?: any) => {
    if (USE_MOCK_DATA) {
      return handleMockRequest('DELETE', url, config);
    }
    return api.delete(url, config);
  },
};

// Mock request handler
async function handleMockRequest(method: string, url: string, config?: any) {
  console.log(`[MOCK] ${method} ${url}`, config?.data);

  // Parse URL to route to correct mock endpoint
  const path = url.replace('/api/', '').replace(/^\//, '');
  const segments = path.split('/');

  try {
    let result;

    // Route to appropriate mock endpoint
    if (path === 'auth/google' || path.startsWith('auth/google')) {
      result = await mockApi.auth.google();
    } else if (path === 'auth/me') {
      result = await mockApi.auth.me();
    } else if (path === 'auth/logout') {
      result = await mockApi.auth.logout();
    } else if (path.startsWith('approvals/stats')) {
      result = await mockApi.approvals.stats();
    } else if (path.startsWith('approvals') && segments[1] && segments[2] === 'approve') {
      result = await mockApi.approvals.approve(segments[1]);
    } else if (path.startsWith('approvals') && segments[1] && segments[2] === 'reject') {
      result = await mockApi.approvals.reject(segments[1], config?.data?.reason || '');
    } else if (path.startsWith('approvals') && segments[1]) {
      if (method === 'PATCH') {
        result = await mockApi.approvals.update(segments[1], config?.data);
      } else {
        result = await mockApi.approvals.get(segments[1]);
      }
    } else if (path.startsWith('approvals')) {
      result = await mockApi.approvals.list(config?.params?.status);
    } else if (path.startsWith('accounts') && segments[1] && segments[2] === 'toggle') {
      result = await mockApi.accounts.toggle(parseInt(segments[1]));
    } else if (path.startsWith('accounts') && segments[1]) {
      result = await mockApi.accounts.get(parseInt(segments[1]));
    } else if (path.startsWith('accounts')) {
      result = await mockApi.accounts.list();
    } else if (path.startsWith('analytics/account')) {
      result = await mockApi.analytics.account(parseInt(segments[2]), config?.params?.days);
    } else if (path.startsWith('analytics')) {
      result = await mockApi.analytics.overview(config?.params?.period);
    } else if (path.startsWith('workflows') && segments[1] && segments[2] === 'toggle') {
      result = await mockApi.workflows.toggle(segments[1]);
    } else if (path.startsWith('workflows') && segments[1]) {
      result = await mockApi.workflows.get(segments[1]);
    } else if (path.startsWith('workflows')) {
      result = await mockApi.workflows.list();
    } else if (path.startsWith('settings') && segments[1]) {
      if (method === 'PUT') {
        result = await mockApi.settings.update(segments[1], config?.data?.value);
      } else {
        result = await mockApi.settings.get(segments[1]);
      }
    } else if (path.startsWith('settings')) {
      result = await mockApi.settings.list(config?.params?.category);
    } else if (path.startsWith('logs')) {
      result = await mockApi.logs.list(config?.params?.level, config?.params?.source);
    } else if (path.startsWith('notifications/read-all')) {
      result = await mockApi.notifications.markAllRead();
    } else if (path.startsWith('notifications') && segments[1] && segments[2] === 'read') {
      result = await mockApi.notifications.markRead(segments[1]);
    } else if (path.startsWith('notifications')) {
      result = await mockApi.notifications.list(config?.params?.unreadOnly === 'true');
    } else {
      throw new Error(`Mock endpoint not found: ${path}`);
    }

    return { data: result };
  } catch (error: any) {
    console.error('[MOCK] Error:', error.message);
    throw error;
  }
}

