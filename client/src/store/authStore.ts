import { create } from 'zustand';
import type { User } from '../types';
import { loginApi, registerApi, checkAuthApi, logoutApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true, // true initially — we check auth on mount
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginApi(email, password);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerApi(name, email, password);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await logoutApi();
    set({ user: null, isLoggedIn: false, isLoading: false, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await checkAuthApi();
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch {
      set({ user: null, isLoggedIn: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
