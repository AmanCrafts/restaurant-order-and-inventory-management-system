/**
 * Table Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Table Request DTO
 */
export class CreateTableRequestDto extends BaseCreateRequestDto {
  restaurantId: string;
  tableNumber: number;
  capacity: number;

  constructor(data: {
    restaurantId: string;
    tableNumber: number;
    capacity: number;
  }) {
    super();
    this.restaurantId = data.restaurantId;
    this.tableNumber = data.tableNumber;
    this.capacity = data.capacity;
  }

  validate(): boolean {
    return (
      this.restaurantId.length > 0 && this.tableNumber > 0 && this.capacity > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      restaurantId: this.restaurantId,
      tableNumber: this.tableNumber,
      capacity: this.capacity,
    };
  }
}

/**
 * Update Table Request DTO
 */
export class UpdateTableRequestDto extends BaseUpdateRequestDto {
  tableNumber?: number;
  capacity?: number;
  isActive?: boolean;

  constructor(data: {
    tableNumber?: number;
    capacity?: number;
    isActive?: boolean;
  }) {
    super();
    if (data.tableNumber !== undefined) this.tableNumber = data.tableNumber;
    if (data.capacity !== undefined) this.capacity = data.capacity;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  validate(): boolean {
    if (this.tableNumber !== undefined && this.tableNumber <= 0) return false;
    if (this.capacity !== undefined && this.capacity <= 0) return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.tableNumber !== undefined) result.tableNumber = this.tableNumber;
    if (this.capacity !== undefined) result.capacity = this.capacity;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    return result;
  }
}

/**
 * Update Table Status Request DTO
 */
export class UpdateTableStatusRequestDto extends BaseUpdateRequestDto {
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';

  constructor(data: { status: string }) {
    super();
    this.status = data.status.toUpperCase() as 'FREE' | 'OCCUPIED' | 'RESERVED';
  }

  validate(): boolean {
    const validStatuses = ['FREE', 'OCCUPIED', 'RESERVED'];
    return validStatuses.includes(this.status);
  }

  toJSON(): Record<string, unknown> {
    return {
      status: this.status,
    };
  }
}
