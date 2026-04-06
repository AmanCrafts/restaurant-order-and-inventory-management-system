// User Roles
export const UserRole = {
  ADMIN: 'ADMIN',
  WAITER: 'WAITER',
  COOK: 'COOK',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

// Order Status
export const OrderStatus = {
  CREATED: 'CREATED',
  SENT_TO_KITCHEN: 'SENT_TO_KITCHEN',
  COOKING: 'COOKING',
  READY: 'READY',
  SERVED: 'SERVED',
  BILLED: 'BILLED',
  CLOSED: 'CLOSED',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Table Status
export const TableStatus = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
} as const;
export type TableStatus = typeof TableStatus[keyof typeof TableStatus];

// Bill Status
export const BillStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type BillStatus = typeof BillStatus[keyof typeof BillStatus];

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
}

// Restaurant Interface
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
}

// Menu Item Interface
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  preparationTime: number;
  categoryId: string;
  category?: MenuCategory;
  ingredients?: MenuItemIngredient[];
}

// Menu Category Interface
export interface MenuCategory {
  id: string;
  name: string;
  menuId: string;
  items?: MenuItem[];
}

// Menu Item Ingredient Interface
export interface MenuItemIngredient {
  inventoryItemId: string;
  quantityRequired: number;
  inventoryItem?: InventoryItem;
}

// Inventory Item Interface
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
  restaurantId: string;
}

// Table Interface
export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  restaurantId: string;
}

// Order Interface
export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  createdAt: string;
  table?: Table;
  waiter?: User;
  items?: OrderItem[];
  bill?: Bill;
}

// Order Item Interface
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
}

// Bill Interface
export interface Bill {
  id: string;
  orderId: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  totalAmount: number;
  status: BillStatus;
  createdAt: string;
  order?: Order;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  message: string;
  sentAt: string;
  isRead?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create Order DTO
export interface CreateOrderDTO {
  restaurantId: string;
  tableId: string;
  items?: { menuItemId: string; quantity: number }[];
}

// Add Item to Order DTO
export interface AddOrderItemDTO {
  menuItemId: string;
  quantity: number;
}

// Generate Bill DTO
export interface GenerateBillDTO {
  taxRate?: number;
  serviceChargeRate?: number;
}

// Create Staff DTO
export interface CreateStaffDTO {
  restaurantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// Create Table DTO
export interface CreateTableDTO {
  restaurantId: string;
  tableNumber: number;
  capacity: number;
}

// Create Inventory DTO
export interface CreateInventoryDTO {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold?: number;
}

// Update Stock DTO
export interface UpdateStockDTO {
  amount: number;
  operation: 'ADD' | 'SET' | 'DEDUCT';
  reason?: string;
}

// Create Category DTO
export interface CreateCategoryDTO {
  restaurantId: string;
  name: string;
}

// Create Menu Item DTO
export interface CreateMenuItemDTO {
  categoryId: string;
  name: string;
  price: number;
  isAvailable?: boolean;
  preparationTime: number;
  ingredients?: { inventoryItemId: string; quantityRequired: number }[];
}

// Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeTables: number;
  lowStockItems: number;
}
