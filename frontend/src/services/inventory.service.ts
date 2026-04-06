import { api } from './api';
import type {
  InventoryItem,
  CreateInventoryDTO,
  UpdateStockDTO,
} from '../types';

interface InventoryQuery {
  restaurantId?: string;
  search?: string;
  lowStock?: 'true' | 'false';
}

export const InventoryService = {
  // Get all inventory items
  getAll: async (params?: InventoryQuery): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory', { params });
    return response.data || [];
  },

  // Get inventory by ID
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data!;
  },

  // Get inventory by restaurant
  getByRestaurant: async (restaurantId: string): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>(`/inventory/restaurant/${restaurantId}`);
    return response.data || [];
  },

  // Search inventory
  search: async (params: {
    restaurantId: string;
    q?: string;
    lowStock?: 'true' | 'false';
  }): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory/search', { params });
    return response.data || [];
  },

  // Get low stock items
  getLowStock: async (restaurantId: string): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>(`/inventory/alerts/low-stock/${restaurantId}`);
    return response.data || [];
  },

  // Create inventory item
  create: async (data: CreateInventoryDTO): Promise<InventoryItem> => {
    const response = await api.post<InventoryItem>('/inventory', data);
    return response.data!;
  },

  // Update inventory item
  update: async (
    id: string,
    data: Partial<{
      name: string;
      unit: string;
      reorderThreshold: number;
    }>
  ): Promise<InventoryItem> => {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
    return response.data!;
  },

  // Update stock
  updateStock: async (id: string, data: UpdateStockDTO): Promise<void> => {
    await api.put(`/inventory/${id}/stock`, data);
  },

  // Delete inventory item
  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  // Get inventory stats
  getStats: async (restaurantId: string): Promise<{
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
  }> => {
    const response = await api.get<{
      totalItems: number;
      lowStockCount: number;
      totalValue: number;
    }>(`/inventory/stats/${restaurantId}`);
    return response.data || {
      totalItems: 0,
      lowStockCount: 0,
      totalValue: 0,
    };
  },
};
