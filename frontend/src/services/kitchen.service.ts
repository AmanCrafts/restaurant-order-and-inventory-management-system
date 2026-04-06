import { api } from './api';
import type { Order, OrderStatus } from '../types';

interface KitchenQuery {
  restaurantId?: string;
  status?: OrderStatus;
}

export const KitchenService = {
  // Get kitchen orders
  getOrders: async (params?: KitchenQuery): Promise<Order[]> => {
    const response = await api.get<Order[]>('/kitchen/orders', { params });
    return response.data || [];
  },

  // Start cooking order
  startCooking: async (orderId: string): Promise<Order> => {
    const response = await api.post<Order>(`/kitchen/orders/${orderId}/start`);
    return response.data!;
  },

  // Mark order as ready
  markReady: async (orderId: string): Promise<Order> => {
    const response = await api.post<Order>(`/kitchen/orders/${orderId}/ready`);
    return response.data!;
  },

  // Get pending orders (SENT_TO_KITCHEN)
  getPendingOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/kitchen/orders', {
      params: {
        restaurantId,
        status: 'SENT_TO_KITCHEN',
      },
    });
    return response.data || [];
  },

  // Get cooking orders
  getCookingOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/kitchen/orders', {
      params: {
        restaurantId,
        status: 'COOKING',
      },
    });
    return response.data || [];
  },

  // Get ready orders
  getReadyOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/kitchen/orders', {
      params: {
        restaurantId,
        status: 'READY',
      },
    });
    return response.data || [];
  },
};
