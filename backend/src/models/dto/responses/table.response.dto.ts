/**
 * Table Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Table Response DTO
 */
export class TableResponseDto extends BaseResponseDto {
  restaurantId: string;
  tableNumber: number;
  capacity: number;
  status: string;
  isAvailable: boolean;
  hasActiveOrders: boolean;
  activeOrdersCount: number;

  constructor(table: {
    id: string;
    restaurantId: string;
    tableNumber: number;
    capacity: number;
    status: string;
    isActive: boolean;
    isAvailable: boolean;
    hasActiveOrders: boolean;
    activeOrdersCount: number;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super(table);
    this.restaurantId = table.restaurantId;
    this.tableNumber = table.tableNumber;
    this.capacity = table.capacity;
    this.status = table.status;
    this.isAvailable = table.isAvailable;
    this.hasActiveOrders = table.hasActiveOrders;
    this.activeOrdersCount = table.activeOrdersCount;
  }
}

/**
 * Table Summary Response DTO
 */
export class TableSummaryResponseDto {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
  isAvailable: boolean;

  constructor(table: {
    id: string;
    tableNumber: number;
    capacity: number;
    status: string;
    isAvailable: boolean;
  }) {
    this.id = table.id;
    this.tableNumber = table.tableNumber;
    this.capacity = table.capacity;
    this.status = table.status;
    this.isAvailable = table.isAvailable;
  }
}

/**
 * Available Table Response DTO
 */
export class AvailableTableResponseDto {
  id: string;
  tableNumber: number;
  capacity: number;

  constructor(table: { id: string; tableNumber: number; capacity: number }) {
    this.id = table.id;
    this.tableNumber = table.tableNumber;
    this.capacity = table.capacity;
  }
}
