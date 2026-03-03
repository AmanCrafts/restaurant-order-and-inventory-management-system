/**
 * Inventory Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Inventory Item Request DTO
 */
export class CreateInventoryItemRequestDto extends BaseCreateRequestDto {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;

  constructor(data: {
    restaurantId: string;
    name: string;
    quantity: number;
    unit: string;
    reorderThreshold?: number;
  }) {
    super();
    this.restaurantId = data.restaurantId;
    this.name = data.name.trim();
    this.quantity = data.quantity;
    this.unit = data.unit.trim().toLowerCase();
    this.reorderThreshold = data.reorderThreshold ?? 10;
  }

  validate(): boolean {
    return (
      this.restaurantId.length > 0 &&
      this.name.length >= 2 &&
      this.quantity >= 0 &&
      this.unit.length > 0 &&
      this.reorderThreshold >= 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      restaurantId: this.restaurantId,
      name: this.name,
      quantity: this.quantity,
      unit: this.unit,
      reorderThreshold: this.reorderThreshold,
    };
  }
}

/**
 * Update Inventory Item Request DTO
 */
export class UpdateInventoryItemRequestDto extends BaseUpdateRequestDto {
  name?: string;
  unit?: string;
  reorderThreshold?: number;
  isActive?: boolean;

  constructor(data: {
    name?: string;
    unit?: string;
    reorderThreshold?: number;
    isActive?: boolean;
  }) {
    super();
    if (data.name) this.name = data.name.trim();
    if (data.unit) this.unit = data.unit.trim().toLowerCase();
    if (data.reorderThreshold !== undefined)
      this.reorderThreshold = data.reorderThreshold;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  validate(): boolean {
    if (this.name !== undefined && this.name.length < 2) return false;
    if (this.unit !== undefined && this.unit.length === 0) return false;
    if (this.reorderThreshold !== undefined && this.reorderThreshold < 0)
      return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.name !== undefined) result.name = this.name;
    if (this.unit !== undefined) result.unit = this.unit;
    if (this.reorderThreshold !== undefined)
      result.reorderThreshold = this.reorderThreshold;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    return result;
  }
}

/**
 * Update Stock Request DTO
 */
export class UpdateStockRequestDto extends BaseUpdateRequestDto {
  amount: number;
  operation: 'ADD' | 'SET' | 'DEDUCT';
  reason?: string;

  constructor(data: {
    amount: number;
    operation: 'ADD' | 'SET' | 'DEDUCT';
    reason?: string;
  }) {
    super();
    this.amount = data.amount;
    this.operation = data.operation;
    this.reason = data.reason;
  }

  validate(): boolean {
    return (
      this.amount >= 0 && ['ADD', 'SET', 'DEDUCT'].includes(this.operation)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      amount: this.amount,
      operation: this.operation,
      reason: this.reason,
    };
  }
}
