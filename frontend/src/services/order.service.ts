import { api } from './api';
import type {
  Order,
  OrderItem,
  CreateOrderDTO,
  AddOrderItemDTO,
  OrderStatus,
} from '../types';

interface OrderQuery {
  restaurantId?: string;
  status?: OrderStatus;
  waiterId?: string;
  tableId?: string;
}

export const OrderService = {
  // Get all orders
  getAll: async (params?: OrderQuery): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders', { params });
    return response.data || [];
  },

  // Get order by ID
  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data!;
  },

  // Create order
  create: async (data: CreateOrderDTO): Promise<Order> => {
    const response = await api.post<Order>('/orders', data);
    return response.data!;
  },

  // Add item to order
  addItem: async (orderId: string, data: AddOrderItemDTO): Promise<OrderItem> => {
    const response = await api.post<OrderItem>(`/orders/${orderId}/items`, data);
    return response.data!;
  },

  // Update order item
  updateItem: async (
    orderId: string,
    itemId: string,
    data: { quantity: number }
  ): Promise<OrderItem> => {
    const response = await api.put<OrderItem>(`/orders/${orderId}/items/${itemId}`, data);
    return response.data!;
  },

  // Remove item from order
  removeItem: async (orderId: string, itemId: string): Promise<void> => {
    await api.delete(`/orders/${orderId}/items/${itemId}`);
  },

  // Send order to kitchen
  sendToKitchen: async (orderId: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${orderId}/send-to-kitchen`);
    return response.data!;
  },

  // Mark order as served
  serve: async (orderId: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${orderId}/serve`);
    return response.data!;
  },

  // Get active orders
  getActiveOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders', {
      params: {
        restaurantId,
        status: ['CREATED', 'SENT_TO_KITCHEN', 'COOKING', 'READY', 'SERVED'],
      },
    });
    return response.data || [];
  },

  // Get orders by table
  getByTable: async (tableId: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders', {
      params: { tableId },
    });
    return response.data || [];
  },
};
