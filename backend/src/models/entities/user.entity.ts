import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { Order } from './order.entity';
import { Notification } from './notification.entity';
import { UserRole, RolePermissions } from '../../shared/constants/roles';

/**
 * User Entity
 * Represents a staff member in the restaurant
 * Demonstrates Association and Encapsulation
 */
export class User extends BaseEntity {
  private _restaurantId: string;
  private _restaurant: Restaurant | null = null;
  private _name: string;
  private _email: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _orders: Order[] = [];
  private _notifications: Notification[] = [];

  constructor(
    id: string,
    restaurantId: string,
    name: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._restaurantId = restaurantId;
    this._name = name;
    this._email = email;
    this._passwordHash = passwordHash;
    this._role = role;
  }

  // Getters
  get restaurantId(): string {
    return this._restaurantId;
  }

  get restaurant(): Restaurant | null {
    return this._restaurant;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get orders(): Order[] {
    return [...this._orders];
  }

  get notifications(): Notification[] {
    return [...this._notifications];
  }

  // Setters with validation
  set name(value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this._name = value.trim();
    this.touch();
  }

  set email(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    this._email = value.toLowerCase().trim();
    this.touch();
  }

  set passwordHash(value: string) {
    if (!value || value.length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    this._passwordHash = value;
    this.touch();
  }

  set role(value: UserRole) {
    if (!Object.values(UserRole).includes(value)) {
      throw new Error('Invalid user role');
    }
    this._role = value;
    this.touch();
  }

  set restaurant(restaurant: Restaurant | null) {
    this._restaurant = restaurant;
    if (restaurant) {
      this._restaurantId = restaurant.id;
    }
  }

  // Association methods
  addOrder(order: Order): void {
    if (!this._orders.find((o) => o.id === order.id)) {
      this._orders.push(order);
    }
  }

  removeOrder(orderId: string): void {
    this._orders = this._orders.filter((o) => o.id !== orderId);
  }

  addNotification(notification: Notification): void {
    this._notifications.push(notification);
  }

  clearNotifications(): void {
    this._notifications = [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = RolePermissions[this._role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user can perform action on order
   */
  canManageOrder(order: Order): boolean {
    if (this._role === UserRole.ADMIN) return true;
    if (this._role === UserRole.WAITER && order.waiterId === this._id)
      return true;
    return false;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * Check if user is waiter
   */
  isWaiter(): boolean {
    return this._role === UserRole.WAITER;
  }

  /**
   * Check if user is cook
   */
  isCook(): boolean {
    return this._role === UserRole.COOK;
  }

  /**
   * Get pending orders for waiter
   */
  getPendingOrders(): Order[] {
    return this._orders.filter((o) => o.isPending());
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._restaurantId !== undefined &&
      this._restaurantId.length > 0 &&
      this._name !== undefined &&
      this._name.length >= 2 &&
      this._email !== undefined &&
      this._email.includes('@') &&
      this._passwordHash !== undefined &&
      this._passwordHash.length > 0 &&
      Object.values(UserRole).includes(this._role)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      restaurantId: this._restaurantId,
      name: this._name,
      email: this._email,
      role: this._role,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ordersCount: this._orders.length,
    };
  }

  /**
   * Factory method to create User from Prisma data
   */
  static fromPrisma(data: {
    id: string;
    restaurant_id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    created_at: Date;
  }): User {
    return new User(
      data.id,
      data.restaurant_id,
      data.name,
      data.email,
      data.password_hash,
      data.role as UserRole,
      data.created_at,
      undefined,
      data.is_active,
    );
  }
}
