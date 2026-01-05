import { mockApprovals, mockAccounts, mockNotifications, mockAnalytics, mockWorkflows, mockLogs, mockSettings, mockUser } from './mockData';

// Development mode flag - set to false when connecting to real API
export const USE_MOCK_DATA = false;

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth endpoints
  auth: {
    google: async () => {
      await delay();
      return { authUrl: `${window.location.origin}/auth/callback?session=mock-session-123` };
    },
    me: async () => {
      await delay();
      return { user: mockUser };
    },
    logout: async () => {
      await delay();
      return { success: true };
    },
  },

  // Approvals endpoints
  approvals: {
    list: async (status?: string) => {
      await delay();
      const filtered = status 
        ? mockApprovals.filter(a => a.status === status)
        : mockApprovals;
      return { approvals: filtered };
    },
    get: async (id: string) => {
      await delay();
      const approval = mockApprovals.find(a => a.id === id);
      if (!approval) throw new Error('Approval not found');
      return { approval };
    },
    approve: async (id: string) => {
      await delay(1000);
      const approval = mockApprovals.find(a => a.id === id);
      if (!approval) throw new Error('Approval not found');
      return { 
        approval: { 
          ...approval, 
          status: 'approved',
          reviewedBy: mockUser.id,
          reviewedAt: new Date().toISOString(),
        } 
      };
    },
    reject: async (id: string, reason: string) => {
      await delay(1000);
      const approval = mockApprovals.find(a => a.id === id);
      if (!approval) throw new Error('Approval not found');
      return { 
        approval: { 
          ...approval, 
          status: 'rejected',
          reviewedBy: mockUser.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason,
        } 
      };
    },
    update: async (id: string, data: any) => {
      await delay();
      const approval = mockApprovals.find(a => a.id === id);
      if (!approval) throw new Error('Approval not found');
      return { approval: { ...approval, ...data } };
    },
    stats: async () => {
      await delay();
      return {
        stats: {
          total: mockApprovals.length,
          pending: mockApprovals.filter(a => a.status === 'pending').length,
          approved: mockApprovals.filter(a => a.status === 'approved').length,
          rejected: mockApprovals.filter(a => a.status === 'rejected').length,
        },
      };
    },
  },

  // Accounts endpoints
  accounts: {
    list: async () => {
      await delay();
      return { accounts: mockAccounts };
    },
    get: async (id: number) => {
      await delay();
      const account = mockAccounts.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      return { account };
    },
    toggle: async (id: number) => {
      await delay();
      const account = mockAccounts.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      return { account: { ...account, isActive: !account.isActive } };
    },
  },

  // Analytics endpoints
  analytics: {
    overview: async (period: string = 'daily') => {
      await delay();
      return { snapshots: mockAnalytics };
    },
    account: async (accountId: number, days: number = 30) => {
      await delay();
      const snapshots = mockAnalytics.filter(a => a.accountId === accountId);
      return { snapshots };
    },
  },

  // Workflows endpoints
  workflows: {
    list: async () => {
      await delay();
      return { workflows: mockWorkflows };
    },
    get: async (id: string) => {
      await delay();
      const workflow = mockWorkflows.find(w => w.workflowId === id);
      if (!workflow) throw new Error('Workflow not found');
      return { workflow };
    },
    toggle: async (id: string) => {
      await delay();
      const workflow = mockWorkflows.find(w => w.workflowId === id);
      if (!workflow) throw new Error('Workflow not found');
      return { workflow: { ...workflow, isActive: !workflow.isActive } };
    },
  },

  // Settings endpoints
  settings: {
    list: async (category?: string) => {
      await delay();
      const filtered = category
        ? mockSettings.filter(s => s.category === category)
        : mockSettings;
      return { settings: filtered };
    },
    get: async (key: string) => {
      await delay();
      const setting = mockSettings.find(s => s.key === key);
      if (!setting) throw new Error('Setting not found');
      return { setting };
    },
    update: async (key: string, value: any) => {
      await delay();
      const setting = mockSettings.find(s => s.key === key);
      return { 
        setting: { 
          ...setting, 
          value,
          updatedBy: mockUser.id,
          updatedAt: new Date().toISOString(),
        } 
      };
    },
  },

  // Logs endpoints
  logs: {
    list: async (level?: string, source?: string) => {
      await delay();
      let filtered = mockLogs;
      if (level) filtered = filtered.filter(l => l.level === level);
      if (source) filtered = filtered.filter(l => l.source === source);
      return { logs: filtered };
    },
  },

  // Notifications endpoints
  notifications: {
    list: async (unreadOnly: boolean = false) => {
      await delay();
      const filtered = unreadOnly
        ? mockNotifications.filter(n => !n.isRead)
        : mockNotifications;
      return { notifications: filtered };
    },
    markRead: async (id: string) => {
      await delay();
      const notification = mockNotifications.find(n => n.id === id);
      if (!notification) throw new Error('Notification not found');
      return { notification: { ...notification, isRead: true } };
    },
    markAllRead: async () => {
      await delay();
      return { success: true };
    },
  },
};
