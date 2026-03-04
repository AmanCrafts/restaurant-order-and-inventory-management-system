/**
 * User Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * User Response DTO
 */
export class UserResponseDto extends BaseResponseDto {
  restaurantId: string;
  name: string;
  email: string;
  role: string;
  ordersCount: number;

  constructor(user: {
    id: string;
    restaurantId: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    ordersCount?: number;
  }) {
    super(user);
    this.restaurantId = user.restaurantId;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.ordersCount = user.ordersCount || 0;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  /**
   * Check if user is waiter
   */
  isWaiter(): boolean {
    return this.role === 'WAITER';
  }

  /**
   * Check if user is cook
   */
  isCook(): boolean {
    return this.role === 'COOK';
  }
}

/**
 * User Summary Response DTO
 * For list views
 */
export class UserSummaryResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;

  constructor(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.isActive = user.isActive;
  }
}

/**
 * Current User Response DTO
 * For /me endpoint
 */
export class CurrentUserResponseDto extends UserResponseDto {
  permissions: string[];

  constructor(user: {
    id: string;
    restaurantId: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    permissions?: string[];
  }) {
    super(user);
    this.permissions = user.permissions || [];
  }
}
