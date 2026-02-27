import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { Table } from './table.entity';
import { User } from './user.entity';
import { MenuItem } from './menu.entity';
import { Bill } from './bill.entity';
import { OrderStatus, canTransitionOrderStatus } from '../../shared/constants/order-status';
import { UserRole } from '../../shared/constants/roles';

/**
 * Order Module Entities
 * Demonstrates State Machine Pattern and Business Logic
 */

/**
 * Order Entity
 * Represents a customer order with lifecycle management
 */
export class Order extends BaseEntity {
  private _restaurantId: string;
  private _restaurant: Restaurant | null = null;
  private _tableId: string;
  private _table: Table | null = null;
  private _waiterId: string;
  private _waiter: User | null = null;
  private _status: OrderStatus;
  private _items: OrderItem[] = [];
  private _bill: Bill | null = null;
  private _statusHistory: { status: OrderStatus; timestamp: Date; notes?: string }[] = [];

  constructor(
    id: string,
    restaurantId: string,
    tableId: string,
    waiterId: string,
    status: OrderStatus = OrderStatus.CREATED,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt, true);
    this._restaurantId = restaurantId;
    this._tableId = tableId;
    this._waiterId = waiterId;
    this._status = status;
    this._statusHistory.push({ status: this._status, timestamp: new Date() });
  }

  // Getters
  get restaurantId(): string {
    return this._restaurantId;
  }

  get restaurant(): Restaurant | null {
    return this._restaurant;
  }

  get tableId(): string {
    return this._tableId;
  }

  get table(): Table | null {
    return this._table;
  }

  get waiterId(): string {
    return this._waiterId;
  }

  get waiter(): User | null {
    return this._waiter;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get items(): OrderItem[] {
    return [...this._items];
  }

  get bill(): Bill | null {
    return this._bill;
  }

  get statusHistory() {
    return [...this._statusHistory];
  }

  // Setters
  set restaurant(restaurant: Restaurant | null) {
    this._restaurant = restaurant;
    if (restaurant) {
      this._restaurantId = restaurant.id;
    }
  }

  set table(table: Table | null) {
    this._table = table;
    if (table) {
      this._tableId = table.id;
    }
  }

  set waiter(waiter: User | null) {
    this._waiter = waiter;
    if (waiter) {
      this._waiterId = waiter.id;
    }
  }

  /**
   * State Transition Methods
   * Enforces valid state transitions based on OrderStatusFlow
   */

  /**
   * Transition order status with validation
   */
  private transitionTo(newStatus: OrderStatus, notes?: string): void {
    if (!canTransitionOrderStatus(this._status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${newStatus}`
      );
    }
    this._status = newStatus;
    this._statusHistory.push({ status: newStatus, timestamp: new Date(), notes });
    this.touch();
  }

  /**
   * Send order to kitchen
   */
  sendToKitchen(): void {
    this.transitionTo(OrderStatus.SENT_TO_KITCHEN, 'Order sent to kitchen');
  }

  /**
   * Start cooking
   */
  startCooking(): void {
    this.transitionTo(OrderStatus.COOKING, 'Cooking started');
  }

  /**
   * Mark as ready
   */
  markAsReady(): void {
    this.transitionTo(OrderStatus.READY, 'Food is ready');
  }

  /**
   * Mark as served
   */
  markAsServed(): void {
    this.transitionTo(OrderStatus.SERVED, 'Food served to customer');
  }

  /**
   * Mark as billed
   */
  markAsBilled(): void {
    this.transitionTo(OrderStatus.BILLED, 'Bill generated');
  }

  /**
   * Close order
   */
  closeOrder(): void {
    this.transitionTo(OrderStatus.CLOSED, 'Order completed');
  }

  /**
   * Cancel order (special transition)
   */
  cancelOrder(reason: string): void {
    if (this._status === OrderStatus.CLOSED || this._status === OrderStatus.BILLED) {
      throw new Error('Cannot cancel closed or billed order');
    }
    this._status = OrderStatus.CLOSED;
    this._statusHistory.push({
      status: OrderStatus.CLOSED,
      timestamp: new Date(),
      notes: `Cancelled: ${reason}`,
    });
    this.touch();
  }

  // Item management
  addItem(item: OrderItem): void {
    if (this._status !== OrderStatus.CREATED) {
      throw new Error('Cannot add items after order is sent to kitchen');
    }
    const existingItem = this._items.find(i => i.menuItemId === item.menuItemId);
    if (existingItem) {
      existingItem.increaseQuantity(item.quantity);
    } else {
      item.order = this;
      this._items.push(item);
    }
    this.touch();
  }

  removeItem(itemId: string): void {
    if (this._status !== OrderStatus.CREATED) {
      throw new Error('Cannot remove items after order is sent to kitchen');
    }
    this._items = this._items.filter(i => i.id !== itemId);
    this.touch();
  }

  updateItemQuantity(itemId: string, newQuantity: number): void {
    if (this._status !== OrderStatus.CREATED) {
      throw new Error('Cannot modify items after order is sent to kitchen');
    }
    const item = this._items.find(i => i.id === itemId);
    if (item) {
      item.setQuantity(newQuantity);
      this.touch();
    }
  }

  /**
   * Get order item by ID
   */
  getItem(itemId: string): OrderItem | undefined {
    return this._items.find(i => i.id === itemId);
  }

  /**
   * Calculate subtotal
   */
  calculateSubtotal(): Decimal {
    return this._items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Decimal(0)
    );
  }

  /**
   * Calculate total items count
   */
  getTotalItems(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get unique items count
   */
  getUniqueItemsCount(): number {
    return this._items.length;
  }

  /**
   * Check if order is modifiable
   */
  isModifiable(): boolean {
    return this._status === OrderStatus.CREATED;
  }

  /**
   * Check if order can be sent to kitchen
   */
  canSendToKitchen(): boolean {
    return this._status === OrderStatus.CREATED && this._items.length > 0;
  }

  /**
   * Check if order is in progress
   */
  isInProgress(): boolean {
    return [
      OrderStatus.SENT_TO_KITCHEN,
      OrderStatus.COOKING,
      OrderStatus.READY,
    ].includes(this._status);
  }

  /**
   * Check if order is closed
   */
  isClosed(): boolean {
    return this._status === OrderStatus.CLOSED;
  }

  /**
   * Check if order is billed
   */
  isBilled(): boolean {
    return this._status === OrderStatus.BILLED;
  }

  /**
   * Check if order is pending (created but not sent)
   */
  isPending(): boolean {
    return this._status === OrderStatus.CREATED;
  }

  /**
   * Assign bill to order
   */
  assignBill(bill: Bill): void {
    this._bill = bill;
    if (!this.isBilled()) {
      this.markAsBilled();
    }
  }

  /**
   * Get estimated preparation time
   */
  getEstimatedPreparationTime(): number {
    return Math.max(...this._items.map(item => item.preparationTime), 0);
  }

  /**
   * Check if user can modify this order
   */
  canBeModifiedBy(user: User): boolean {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.WAITER && user.id === this._waiterId) {
      return this.isModifiable();
    }
    return false;
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._restaurantId !== undefined &&
      this._restaurantId.length > 0 &&
      this._tableId !== undefined &&
      this._tableId.length > 0 &&
      this._waiterId !== undefined &&
      this._waiterId.length > 0 &&
      Object.values(OrderStatus).includes(this._status)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      restaurantId: this._restaurantId,
      tableId: this._tableId,
      waiterId: this._waiterId,
      status: this._status,
      itemsCount: this._items.length,
      subtotal: this.calculateSubtotal().toNumber(),
      isModifiable: this.isModifiable(),
      isInProgress: this.isInProgress(),
      isClosed: this.isClosed(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      statusHistory: this._statusHistory,
    };
  }

  static fromPrisma(data: {
    id: string;
    restaurant_id: string;
    table_id: string;
    waiter_id: string;
    status: string;
    created_at: Date;
  }): Order {
    return new Order(
      data.id,
      data.restaurant_id,
      data.table_id,
      data.waiter_id,
      data.status as OrderStatus,
      data.created_at
    );
  }
}

/**
 * OrderItem Entity
 * Represents an item within an order
 */
export class OrderItem extends BaseEntity {
  private _orderId: string;
  private _order: Order | null = null;
  private _menuItemId: string;
  private _menuItem: MenuItem | null = null;
  private _quantity: number;
  private _price: Decimal; // Price at time of order

  constructor(
    id: string,
    orderId: string,
    menuItemId: string,
    quantity: number,
    price: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt, true);
    this._orderId = orderId;
    this._menuItemId = menuItemId;
    this._quantity = quantity;
    this._price = new Decimal(price);
  }

  // Getters
  get orderId(): string {
    return this._orderId;
  }

  get order(): Order | null {
    return this._order;
  }

  get menuItemId(): string {
    return this._menuItemId;
  }

  get menuItem(): MenuItem | null {
    return this._menuItem;
  }

  get quantity(): number {
    return this._quantity;
  }

  get price(): Decimal {
    return this._price;
  }

  get totalPrice(): Decimal {
    return this._price.multiply(this._quantity);
  }

  get preparationTime(): number {
    return this._menuItem?.preparationTime || 0;
  }

  // Setters
  set order(order: Order | null) {
    this._order = order;
    if (order) {
      this._orderId = order.id;
    }
  }

  set menuItem(menuItem: MenuItem | null) {
    this._menuItem = menuItem;
    if (menuItem) {
      this._menuItemId = menuItem.id;
    }
  }

  /**
   * Set quantity with validation
   */
  setQuantity(value: number): void {
    if (value <= 0) {
      throw new Error('Quantity must be positive');
    }
    this._quantity = value;
    this.touch();
  }

  /**
   * Increase quantity
   */
  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this._quantity += amount;
    this.touch();
  }

  /**
   * Decrease quantity
   */
  decreaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (amount >= this._quantity) {
      throw new Error('Cannot decrease below 1. Remove item instead.');
    }
    this._quantity -= amount;
    this.touch();
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._orderId !== undefined &&
      this._orderId.length > 0 &&
      this._menuItemId !== undefined &&
      this._menuItemId.length > 0 &&
      this._quantity > 0 &&
      this._price.toNumber() >= 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      orderId: this._orderId,
      menuItemId: this._menuItemId,
      quantity: this._quantity,
      price: this._price.toNumber(),
      totalPrice: this.totalPrice.toNumber(),
    };
  }

  static fromPrisma(data: {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    price: number;
  }): OrderItem {
    return new OrderItem(
      data.id,
      data.order_id,
      data.menu_item_id,
      data.quantity,
      data.price
    );
  }
}

// Decimal helper class
class Decimal {
  private value: number;

  constructor(value: number) {
    this.value = Math.round(value * 100) / 100;
  }

  toNumber(): number {
    return this.value;
  }

  add(other: Decimal): Decimal {
    return new Decimal(this.value + other.value);
  }

  subtract(other: Decimal): Decimal {
    return new Decimal(this.value - other.value);
  }

  multiply(factor: number): Decimal {
    return new Decimal(this.value * factor);
  }
}
