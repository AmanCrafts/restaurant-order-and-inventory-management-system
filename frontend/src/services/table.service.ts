import { api } from './api';
import type { Table, CreateTableDTO, TableStatus } from '../types';

interface TableQuery {
  restaurantId?: string;
  status?: TableStatus;
}

export const TableService = {
  // Get all tables
  getAll: async (params?: TableQuery): Promise<Table[]> => {
    const response = await api.get<Table[]>('/tables', { params });
    return response.data || [];
  },

  // Get table by ID
  getById: async (id: string): Promise<Table> => {
    const response = await api.get<Table>(`/tables/${id}`);
    return response.data!;
  },

  // Create table
  create: async (data: CreateTableDTO): Promise<Table> => {
    const response = await api.post<Table>('/tables', data);
    return response.data!;
  },

  // Update table
  update: async (
    id: string,
    data: Partial<{
      tableNumber: number;
      capacity: number;
      status: TableStatus;
    }>
  ): Promise<Table> => {
    const response = await api.put<Table>(`/tables/${id}`, data);
    return response.data!;
  },

  // Delete table
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tables/${id}`);
  },

  // Get table stats
  getStats: async (restaurantId: string): Promise<{
    totalTables: number;
    occupiedTables: number;
    freeTables: number;
    totalCapacity: number;
  }> => {
    const response = await api.get<{
      totalTables: number;
      occupiedTables: number;
      freeTables: number;
      totalCapacity: number;
    }>(`/tables/stats/${restaurantId}`);
    return response.data || {
      totalTables: 0,
      occupiedTables: 0,
      freeTables: 0,
      totalCapacity: 0,
    };
  },

  // Update table status
  updateStatus: async (id: string, status: TableStatus): Promise<void> => {
    await api.put(`/tables/${id}`, { status });
  },
};
