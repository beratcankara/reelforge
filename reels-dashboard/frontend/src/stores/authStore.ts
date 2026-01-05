import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  session: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => {
        if (session) {
          localStorage.setItem('session', session);
        } else {
          localStorage.removeItem('session');
        }
        set({ session });
      },
      logout: () => {
        localStorage.removeItem('session');
        set({ user: null, session: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
