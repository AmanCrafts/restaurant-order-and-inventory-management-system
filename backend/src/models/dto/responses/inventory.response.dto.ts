/**
 * Inventory Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Inventory Item Response DTO
 */
export class InventoryItemResponseDto extends BaseResponseDto {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
  stockStatus: 'adequate' | 'low' | 'out_of_stock';
  isLowStock: boolean;
  reorderAmount: number;

  constructor(item: {
    id: string;
    restaurantId: string;
    name: string;
    quantity: number;
    unit: string;
    reorderThreshold: number;
    stockStatus: 'adequate' | 'low' | 'out_of_stock';
    isLowStock: boolean;
    reorderAmount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super(item);
    this.restaurantId = item.restaurantId;
    this.name = item.name;
    this.quantity = item.quantity;
    this.unit = item.unit;
    this.reorderThreshold = item.reorderThreshold;
    this.stockStatus = item.stockStatus;
    this.isLowStock = item.isLowStock;
    this.reorderAmount = item.reorderAmount;
  }
}

/**
 * Inventory Summary Response DTO
 */
export class InventorySummaryResponseDto {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  stockStatus: 'adequate' | 'low' | 'out_of_stock';

  constructor(item: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    stockStatus: 'adequate' | 'low' | 'out_of_stock';
  }) {
    this.id = item.id;
    this.name = item.name;
    this.quantity = item.quantity;
    this.unit = item.unit;
    this.stockStatus = item.stockStatus;
  }
}

/**
 * Low Stock Alert Response DTO
 */
export class LowStockAlertResponseDto {
  itemId: string;
  name: string;
  currentStock: number;
  unit: string;
  reorderThreshold: number;
  reorderAmount: number;

  constructor(item: {
    itemId: string;
    name: string;
    currentStock: number;
    unit: string;
    reorderThreshold: number;
    reorderAmount: number;
  }) {
    this.itemId = item.itemId;
    this.name = item.name;
    this.currentStock = item.currentStock;
    this.unit = item.unit;
    this.reorderThreshold = item.reorderThreshold;
    this.reorderAmount = item.reorderAmount;
  }
}
