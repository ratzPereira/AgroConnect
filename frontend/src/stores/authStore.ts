import { create } from 'zustand';
import { useNotificationStore } from '@/stores/notificationStore';
import type { UserResponse } from '@/types/auth';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse | null) => void;
  clearTokens: () => void;
  logout: () => void;
}

function loadInitialState() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userJson = localStorage.getItem('user');
  const user = userJson ? (JSON.parse(userJson) as UserResponse) : null;
  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: accessToken !== null,
  };
}

const initial = loadInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  isAuthenticated: initial.isAuthenticated,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Session identity changed — a stale unread badge from the previous user must not survive.
    useNotificationStore.getState().resetUnread();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    useNotificationStore.getState().resetUnread();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
