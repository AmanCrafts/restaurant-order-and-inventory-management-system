import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { Order } from './order.entity';
import { TableStatus } from '../../shared/constants/table-status';

/**
 * Table Entity
 * Represents a dining table in the restaurant
 * Demonstrates State Management (Table Status)
 */
export class Table extends BaseEntity {
  private _restaurantId: string;
  private _restaurant: Restaurant | null = null;
  private _tableNumber: number;
  private _capacity: number;
  private _status: TableStatus;
  private _orders: Order[] = [];

  constructor(
    id: string,
    restaurantId: string,
    tableNumber: number,
    capacity: number,
    status: TableStatus = TableStatus.FREE,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._restaurantId = restaurantId;
    this._tableNumber = tableNumber;
    this._capacity = capacity;
    this._status = status;
  }

  // Getters
  get restaurantId(): string {
    return this._restaurantId;
  }

  get restaurant(): Restaurant | null {
    return this._restaurant;
  }

  get tableNumber(): number {
    return this._tableNumber;
  }

  get capacity(): number {
    return this._capacity;
  }

  get status(): TableStatus {
    return this._status;
  }

  get orders(): Order[] {
    return [...this._orders];
  }

  // Setters
  set restaurant(restaurant: Restaurant | null) {
    this._restaurant = restaurant;
    if (restaurant) {
      this._restaurantId = restaurant.id;
    }
  }

  set tableNumber(value: number) {
    if (value <= 0) {
      throw new Error('Table number must be positive');
    }
    this._tableNumber = value;
    this.touch();
  }

  set capacity(value: number) {
    if (value <= 0) {
      throw new Error('Capacity must be at least 1');
    }
    this._capacity = value;
    this.touch();
  }

  /**
   * State Transition Methods
   */

  /**
   * Mark table as occupied
   */
  occupy(): void {
    if (this._status !== TableStatus.FREE) {
      throw new Error(`Cannot occupy table in ${this._status} status`);
    }
    this._status = TableStatus.OCCUPIED;
    this.touch();
  }

  /**
   * Free up the table
   */
  free(): void {
    if (this._status === TableStatus.OCCUPIED && this.hasActiveOrders()) {
      throw new Error('Cannot free table with active orders');
    }
    this._status = TableStatus.FREE;
    this.touch();
  }

  /**
   * Reserve the table
   */
  reserve(): void {
    if (this._status !== TableStatus.FREE) {
      throw new Error(`Cannot reserve table in ${this._status} status`);
    }
    this._status = TableStatus.RESERVED;
    this.touch();
  }

  /**
   * Cancel reservation
   */
  cancelReservation(): void {
    if (this._status !== TableStatus.RESERVED) {
      throw new Error('Table is not reserved');
    }
    this._status = TableStatus.FREE;
    this.touch();
  }

  // Order association
  addOrder(order: Order): void {
    if (!this._orders.find((o) => o.id === order.id)) {
      this._orders.push(order);
      // Auto-occupy table when order is added
      if (this._status === TableStatus.FREE) {
        this._status = TableStatus.OCCUPIED;
      }
      this.touch();
    }
  }

  removeOrder(orderId: string): void {
    this._orders = this._orders.filter((o) => o.id !== orderId);
    // Free table if no active orders
    if (!this.hasActiveOrders() && this._status === TableStatus.OCCUPIED) {
      this._status = TableStatus.FREE;
    }
    this.touch();
  }

  /**
   * Get active (non-closed) orders for this table
   */
  getActiveOrders(): Order[] {
    return this._orders.filter((o) => !o.isClosed());
  }

  /**
   * Check if table has active orders
   */
  hasActiveOrders(): boolean {
    return this.getActiveOrders().length > 0;
  }

  /**
   * Get current order (if any)
   */
  getCurrentOrder(): Order | undefined {
    return this.getActiveOrders()[0];
  }

  /**
   * Check if table is available
   */
  isAvailable(): boolean {
    return this._status === TableStatus.FREE && this._isActive;
  }

  /**
   * Can accommodate party size
   */
  canAccommodate(partySize: number): boolean {
    return partySize <= this._capacity;
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._restaurantId !== undefined &&
      this._restaurantId.length > 0 &&
      this._tableNumber > 0 &&
      this._capacity > 0 &&
      Object.values(TableStatus).includes(this._status)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      restaurantId: this._restaurantId,
      tableNumber: this._tableNumber,
      capacity: this._capacity,
      status: this._status,
      isActive: this._isActive,
      isAvailable: this.isAvailable(),
      hasActiveOrders: this.hasActiveOrders(),
      activeOrdersCount: this.getActiveOrders().length,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromPrisma(data: {
    id: string;
    restaurant_id: string;
    table_number: number;
    capacity: number;
    status: string;
    is_active: boolean;
    created_at: Date;
  }): Table {
    return new Table(
      data.id,
      data.restaurant_id,
      data.table_number,
      data.capacity,
      data.status as TableStatus,
      data.created_at,
      undefined,
      data.is_active,
    );
  }
}
