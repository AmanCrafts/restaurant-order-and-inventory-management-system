import { api } from './api';
import type { User, CreateStaffDTO, UserRole } from '../types';

interface StaffQuery {
  restaurantId?: string;
  role?: UserRole;
  isActive?: 'true' | 'false';
  search?: string;
}

export const StaffService = {
  // Get all staff
  getAll: async (params?: StaffQuery): Promise<User[]> => {
    const response = await api.get<User[]>('/staff', { params });
    return response.data || [];
  },

  // Get staff by ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/staff/${id}`);
    return response.data!;
  },

  // Get staff by restaurant
  getByRestaurant: async (restaurantId: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/staff/restaurant/${restaurantId}`);
    return response.data || [];
  },

  // Search staff
  search: async (params: {
    restaurantId: string;
    q?: string;
    role?: UserRole;
    isActive?: 'true' | 'false';
  }): Promise<User[]> => {
    const response = await api.get<User[]>('/staff/search', { params });
    return response.data || [];
  },

  // Create staff
  create: async (data: CreateStaffDTO): Promise<User> => {
    const response = await api.post<User>('/staff', data);
    return response.data!;
  },

  // Update staff
  update: async (
    id: string,
    data: Partial<{
      name: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    }>
  ): Promise<User> => {
    const response = await api.put<User>(`/staff/${id}`, data);
    return response.data!;
  },

  // Update staff password
  updatePassword: async (id: string, newPassword: string): Promise<void> => {
    await api.put(`/staff/${id}/password`, { newPassword });
  },

  // Activate staff
  activate: async (id: string): Promise<void> => {
    await api.patch(`/staff/${id}/activate`);
  },

  // Deactivate staff (soft delete)
  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },

  // Delete staff (hard delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}/permanent`);
  },

  // Get staff stats
  getStats: async (restaurantId: string): Promise<{
    totalStaff: number;
    byRole: Record<UserRole, number>;
    activeStaff: number;
  }> => {
    const response = await api.get<{
      totalStaff: number;
      byRole: Record<UserRole, number>;
      activeStaff: number;
    }>(`/staff/stats/${restaurantId}`);
    return response.data || {
      totalStaff: 0,
      byRole: { ADMIN: 0, WAITER: 0, COOK: 0 },
      activeStaff: 0,
    };
  },
};
