/**
 * Order Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Order Request DTO
 */
export class CreateOrderRequestDto extends BaseCreateRequestDto {
  tableId: string;
  items: CreateOrderItemDto[];

  constructor(data: { tableId: string; items: CreateOrderItemDto[] }) {
    super();
    this.tableId = data.tableId;
    this.items = data.items;
  }

  validate(): boolean {
    return (
      this.tableId.length > 0 &&
      this.items.length > 0 &&
      this.items.every(item => item.validate())
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      tableId: this.tableId,
      items: this.items.map(item => item.toJSON()),
    };
  }
}

/**
 * Create Order Item DTO
 */
export class CreateOrderItemDto {
  menuItemId: string;
  quantity: number;

  constructor(data: { menuItemId: string; quantity: number }) {
    this.menuItemId = data.menuItemId;
    this.quantity = data.quantity;
  }

  validate(): boolean {
    return this.menuItemId.length > 0 && this.quantity > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      menuItemId: this.menuItemId,
      quantity: this.quantity,
    };
  }
}

/**
 * Update Order Status Request DTO
 */
export class UpdateOrderStatusRequestDto extends BaseUpdateRequestDto {
  status: string;
  notes?: string;

  constructor(data: { status: string; notes?: string }) {
    super();
    this.status = data.status;
    this.notes = data.notes;
  }

  validate(): boolean {
    const validStatuses = [
      'CREATED',
      'SENT_TO_KITCHEN',
      'COOKING',
      'READY',
      'SERVED',
      'BILLED',
      'CLOSED',
    ];
    return validStatuses.includes(this.status);
  }

  toJSON(): Record<string, unknown> {
    return {
      status: this.status,
      notes: this.notes,
    };
  }
}

/**
 * Update Order Item Request DTO
 */
export class UpdateOrderItemRequestDto extends BaseUpdateRequestDto {
  quantity: number;

  constructor(data: { quantity: number }) {
    super();
    this.quantity = data.quantity;
  }

  validate(): boolean {
    return this.quantity > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      quantity: this.quantity,
    };
  }
}
