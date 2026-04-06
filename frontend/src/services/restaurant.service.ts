import { api } from './api';
import type { Restaurant, DashboardStats } from '../types';

export const RestaurantService = {
  // Get all restaurants
  getAll: async (): Promise<Restaurant[]> => {
    const response = await api.get<Restaurant[]>('/restaurants');
    return response.data || [];
  },

  // Get restaurant by ID
  getById: async (id: string): Promise<Restaurant> => {
    const response = await api.get<Restaurant>(`/restaurants/${id}`);
    return response.data!;
  },

  // Create restaurant
  create: async (data: {
    name: string;
    address: string;
    contactNumber: string;
  }): Promise<Restaurant> => {
    const response = await api.post<Restaurant>('/restaurants', data);
    return response.data!;
  },

  // Update restaurant
  update: async (
    id: string,
    data: Partial<{
      name: string;
      address: string;
      contactNumber: string;
    }>
  ): Promise<Restaurant> => {
    const response = await api.put<Restaurant>(`/restaurants/${id}`, data);
    return response.data!;
  },

  // Delete restaurant
  delete: async (id: string): Promise<void> => {
    await api.delete(`/restaurants/${id}`);
  },

  // Get stats
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/restaurants/stats');
    return response.data || {
      totalOrders: 0,
      totalRevenue: 0,
      activeTables: 0,
      lowStockItems: 0,
    };
  },
};
