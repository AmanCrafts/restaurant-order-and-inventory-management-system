/**
 * Order Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Order Item Response DTO
 */
export class OrderItemResponseDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  totalPrice: number;

  constructor(item: {
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    price: number;
  }) {
    this.id = item.id;
    this.menuItemId = item.menuItemId;
    this.menuItemName = item.menuItemName;
    this.quantity = item.quantity;
    this.price = item.price;
    this.totalPrice = item.price * item.quantity;
  }
}

/**
 * Order Response DTO
 */
export class OrderResponseDto extends BaseResponseDto {
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  status: string;
  items: OrderItemResponseDto[];
  subtotal: number;
  itemsCount: number;
  isModifiable: boolean;
  estimatedPreparationTime: number;

  constructor(order: {
    id: string;
    restaurantId: string;
    tableId: string;
    tableNumber: number;
    waiterId: string;
    waiterName: string;
    status: string;
    items: OrderItemResponseDto[];
    subtotal: number;
    isModifiable: boolean;
    estimatedPreparationTime: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(order);
    this.restaurantId = order.restaurantId;
    this.tableId = order.tableId;
    this.tableNumber = order.tableNumber;
    this.waiterId = order.waiterId;
    this.waiterName = order.waiterName;
    this.status = order.status;
    this.items = order.items;
    this.subtotal = order.subtotal;
    this.itemsCount = order.items.length;
    this.isModifiable = order.isModifiable;
    this.estimatedPreparationTime = order.estimatedPreparationTime;
  }
}

/**
 * Order Status History Item
 */
export class OrderStatusHistoryDto {
  status: string;
  timestamp: Date;
  notes?: string;

  constructor(data: { status: string; timestamp: Date; notes?: string }) {
    this.status = data.status;
    this.timestamp = data.timestamp;
    this.notes = data.notes;
  }
}

/**
 * Order Detail Response DTO
 */
export class OrderDetailResponseDto extends OrderResponseDto {
  statusHistory: OrderStatusHistoryDto[];

  constructor(order: {
    id: string;
    restaurantId: string;
    tableId: string;
    tableNumber: number;
    waiterId: string;
    waiterName: string;
    status: string;
    items: OrderItemResponseDto[];
    subtotal: number;
    isModifiable: boolean;
    estimatedPreparationTime: number;
    statusHistory: OrderStatusHistoryDto[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(order);
    this.statusHistory = order.statusHistory;
  }
}

/**
 * Order Summary Response DTO
 * For list views
 */
export class OrderSummaryResponseDto {
  id: string;
  tableNumber: number;
  status: string;
  itemsCount: number;
  subtotal: number;
  createdAt: Date;

  constructor(order: {
    id: string;
    tableNumber: number;
    status: string;
    itemsCount: number;
    subtotal: number;
    createdAt: Date;
  }) {
    this.id = order.id;
    this.tableNumber = order.tableNumber;
    this.status = order.status;
    this.itemsCount = order.itemsCount;
    this.subtotal = order.subtotal;
    this.createdAt = order.createdAt;
  }
}
