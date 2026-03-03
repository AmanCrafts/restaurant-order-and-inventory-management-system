/**
 * Menu Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Menu Request DTO
 */
export class CreateMenuRequestDto extends BaseCreateRequestDto {
  restaurantId: string;

  constructor(data: { restaurantId: string }) {
    super();
    this.restaurantId = data.restaurantId;
  }

  validate(): boolean {
    return this.restaurantId.length > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      restaurantId: this.restaurantId,
    };
  }
}

/**
 * Create Menu Category Request DTO
 */
export class CreateMenuCategoryRequestDto extends BaseCreateRequestDto {
  menuId: string;
  name: string;

  constructor(data: { menuId: string; name: string }) {
    super();
    this.menuId = data.menuId;
    this.name = data.name.trim();
  }

  validate(): boolean {
    return this.menuId.length > 0 && this.name.length >= 2;
  }

  toJSON(): Record<string, unknown> {
    return {
      menuId: this.menuId,
      name: this.name,
    };
  }
}

/**
 * Create Menu Item Request DTO
 */
export class CreateMenuItemRequestDto extends BaseCreateRequestDto {
  categoryId: string;
  name: string;
  price: number;
  preparationTime: number;

  constructor(data: {
    categoryId: string;
    name: string;
    price: number;
    preparationTime?: number;
  }) {
    super();
    this.categoryId = data.categoryId;
    this.name = data.name.trim();
    this.price = data.price;
    this.preparationTime = data.preparationTime || 15;
  }

  validate(): boolean {
    return (
      this.categoryId.length > 0 &&
      this.name.length >= 2 &&
      this.price >= 0 &&
      this.preparationTime >= 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      categoryId: this.categoryId,
      name: this.name,
      price: this.price,
      preparationTime: this.preparationTime,
    };
  }
}

/**
 * Update Menu Item Request DTO
 */
export class UpdateMenuItemRequestDto extends BaseUpdateRequestDto {
  name?: string;
  price?: number;
  isAvailable?: boolean;
  preparationTime?: number;

  constructor(data: {
    name?: string;
    price?: number;
    isAvailable?: boolean;
    preparationTime?: number;
  }) {
    super();
    if (data.name) this.name = data.name.trim();
    if (data.price !== undefined) this.price = data.price;
    if (data.isAvailable !== undefined) this.isAvailable = data.isAvailable;
    if (data.preparationTime !== undefined)
      this.preparationTime = data.preparationTime;
  }

  validate(): boolean {
    if (this.name !== undefined && this.name.length < 2) return false;
    if (this.price !== undefined && this.price < 0) return false;
    if (this.preparationTime !== undefined && this.preparationTime < 0)
      return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.name !== undefined) result.name = this.name;
    if (this.price !== undefined) result.price = this.price;
    if (this.isAvailable !== undefined) result.isAvailable = this.isAvailable;
    if (this.preparationTime !== undefined)
      result.preparationTime = this.preparationTime;
    return result;
  }
}
