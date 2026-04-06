import { api, setTokens, clearTokens } from './api';
import type {
  User,
  LoginCredentials,
  AuthTokens,
} from '../types';

export const AuthService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', credentials);
    if (response.data) {
      setTokens(response.data.tokens);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!;
  },

  // Register user (for restaurant creation flow)
  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    restaurantId: string;
  }): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data!;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const response = await api.get<User>('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data || null;
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.post('/auth/change-password', data);
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
