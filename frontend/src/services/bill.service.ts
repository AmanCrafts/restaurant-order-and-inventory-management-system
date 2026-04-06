import { api } from './api';
import type { Bill, BillStatus, GenerateBillDTO } from '../types';

interface BillQuery {
  restaurantId?: string;
  status?: BillStatus;
}

export const BillService = {
  // Get all bills
  getAll: async (params?: BillQuery): Promise<Bill[]> => {
    const response = await api.get<Bill[]>('/bills', { params });
    return response.data || [];
  },

  // Get bill by ID
  getById: async (id: string): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${id}`);
    return response.data!;
  },

  // Get bill by order ID
  getByOrder: async (orderId: string): Promise<Bill | null> => {
    const response = await api.get<Bill>(`/bills/order/${orderId}`);
    return response.data || null;
  },

  // Generate bill
  generate: async (orderId: string, data?: GenerateBillDTO): Promise<Bill> => {
    const response = await api.post<Bill>(`/bills/order/${orderId}/generate`, data);
    return response.data!;
  },

  // Mark bill as paid
  pay: async (billId: string): Promise<Bill> => {
    const response = await api.post<Bill>(`/bills/${billId}/pay`);
    return response.data!;
  },

  // Get pending bills
  getPendingBills: async (restaurantId: string): Promise<Bill[]> => {
    const response = await api.get<Bill[]>('/bills', {
      params: {
        restaurantId,
        status: 'PENDING',
      },
    });
    return response.data || [];
  },

  // Get bill stats
  getStats: async (restaurantId: string): Promise<{
    totalBills: number;
    totalRevenue: number;
    pendingAmount: number;
    paidAmount: number;
  }> => {
    const response = await api.get<{
      totalBills: number;
      totalRevenue: number;
      pendingAmount: number;
      paidAmount: number;
    }>(`/bills/stats/${restaurantId}`);
    return response.data || {
      totalBills: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0,
    };
  },
};
