import { api } from './api';
import type {
  MenuItem,
  MenuCategory,
  CreateCategoryDTO,
  CreateMenuItemDTO,
} from '../types';

interface MenuQuery {
  restaurantId: string;
  q?: string;
  available?: 'true' | 'false';
}

export const MenuService = {
  // Get menu by restaurant
  getByRestaurant: async (restaurantId: string): Promise<MenuCategory[]> => {
    const response = await api.get<MenuCategory[]>(`/menu/restaurant/${restaurantId}`);
    return response.data || [];
  },

  // Get menu items with filters
  getItems: async (params: MenuQuery): Promise<MenuItem[]> => {
    const response = await api.get<MenuItem[]>('/menu/items', { params });
    return response.data || [];
  },

  // Get menu item by ID
  getItem: async (id: string): Promise<MenuItem> => {
    const response = await api.get<MenuItem>(`/menu/items/${id}`);
    return response.data!;
  },

  // Create menu for restaurant
  createMenu: async (restaurantId: string): Promise<void> => {
    await api.post(`/menu/restaurant/${restaurantId}`);
  },

  // Create category
  createCategory: async (data: CreateCategoryDTO): Promise<MenuCategory> => {
    const response = await api.post<MenuCategory>('/menu/categories', data);
    return response.data!;
  },

  // Update category
  updateCategory: async (id: string, data: { name: string }): Promise<MenuCategory> => {
    const response = await api.put<MenuCategory>(`/menu/categories/${id}`, data);
    return response.data!;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/menu/categories/${id}`);
  },

  // Create menu item
  createItem: async (data: CreateMenuItemDTO): Promise<MenuItem> => {
    const response = await api.post<MenuItem>('/menu/items', data);
    return response.data!;
  },

  // Update menu item
  updateItem: async (
    id: string,
    data: Partial<CreateMenuItemDTO>
  ): Promise<MenuItem> => {
    const response = await api.put<MenuItem>(`/menu/items/${id}`, data);
    return response.data!;
  },

  // Toggle item availability
  toggleAvailability: async (id: string, isAvailable: boolean): Promise<void> => {
    await api.put(`/menu/items/${id}`, { isAvailable });
  },
};
