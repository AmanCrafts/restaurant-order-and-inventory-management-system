import { api } from './api';
import type { Notification } from '../types';

export const NotificationService = {
  // Get my notifications
  getMine: async (limit?: number): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications/me', {
      params: { limit },
    });
    return response.data || [];
  },

  // Get notifications by user
  getByUser: async (userId: string, limit?: number): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`/notifications/user/${userId}`, {
      params: { limit },
    });
    return response.data || [];
  },

  // Get notifications by restaurant
  getByRestaurant: async (restaurantId: string, limit?: number): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`/notifications/restaurant/${restaurantId}`, {
      params: { limit },
    });
    return response.data || [];
  },

  // Send notification
  send: async (userId: string, message: string): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', {
      userId,
      message,
    });
    return response.data!;
  },
};
