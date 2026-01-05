import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/api';

export function useAuth() {
  const { user, isAuthenticated, setUser, setSession, logout } = useAuthStore();
  const navigate = useNavigate();

  const login = async (session: string) => {
    setSession(session);
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout: handleLogout,
  };
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
}
