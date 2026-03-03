/**
 * User Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create User Request DTO
 */
export class CreateUserRequestDto extends BaseCreateRequestDto {
  restaurantId: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'WAITER' | 'COOK';

  constructor(data: {
    restaurantId: string;
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    super();
    this.restaurantId = data.restaurantId;
    this.name = data.name.trim();
    this.email = data.email.toLowerCase().trim();
    this.password = data.password;
    this.role = data.role.toUpperCase() as 'ADMIN' | 'WAITER' | 'COOK';
  }

  validate(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ['ADMIN', 'WAITER', 'COOK'];

    return (
      this.restaurantId.length > 0 &&
      this.name.length >= 2 &&
      emailRegex.test(this.email) &&
      this.password.length >= 6 &&
      validRoles.includes(this.role)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      restaurantId: this.restaurantId,
      name: this.name,
      email: this.email,
      role: this.role,
      password: '***HIDDEN***',
    };
  }
}

/**
 * Update User Request DTO
 */
export class UpdateUserRequestDto extends BaseUpdateRequestDto {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'WAITER' | 'COOK';
  isActive?: boolean;

  constructor(data: {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }) {
    super();
    if (data.name) this.name = data.name.trim();
    if (data.email) this.email = data.email.toLowerCase().trim();
    if (data.role)
      this.role = data.role.toUpperCase() as 'ADMIN' | 'WAITER' | 'COOK';
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  validate(): boolean {
    if (this.name !== undefined && this.name.length < 2) return false;
    if (this.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) return false;
    }
    if (this.role !== undefined) {
      const validRoles = ['ADMIN', 'WAITER', 'COOK'];
      if (!validRoles.includes(this.role)) return false;
    }
    return true;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.name !== undefined) result.name = this.name;
    if (this.email !== undefined) result.email = this.email;
    if (this.role !== undefined) result.role = this.role;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    return result;
  }
}

/**
 * Update Password Request DTO
 */
export class UpdatePasswordRequestDto extends BaseUpdateRequestDto {
  currentPassword: string;
  newPassword: string;

  constructor(data: { currentPassword: string; newPassword: string }) {
    super();
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
  }

  validate(): boolean {
    return (
      this.currentPassword.length >= 6 &&
      this.newPassword.length >= 6 &&
      this.currentPassword !== this.newPassword
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      currentPassword: '***HIDDEN***',
      newPassword: '***HIDDEN***',
    };
  }
}
