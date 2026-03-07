import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { MenuItem } from './menu.entity';

/**
 * Inventory Module Entities
 * Demonstrates Association and Business Logic
 */

/**
 * InventoryItem Entity
 * Represents an ingredient/stock item in the restaurant
 */
export class InventoryItem extends BaseEntity {
  private _restaurantId: string;
  private _restaurant: Restaurant | null = null;
  private _name: string;
  private _quantity: Decimal;
  private _unit: string;
  private _reorderThreshold: Decimal;
  private _ingredients: MenuItemIngredient[] = [];

  constructor(
    id: string,
    restaurantId: string,
    name: string,
    quantity: number,
    unit: string,
    reorderThreshold: number,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._restaurantId = restaurantId;
    this._name = name;
    this._quantity = new Decimal(quantity);
    this._unit = unit;
    this._reorderThreshold = new Decimal(reorderThreshold);
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

  get quantity(): Decimal {
    return this._quantity;
  }

  get unit(): string {
    return this._unit;
  }

  get reorderThreshold(): Decimal {
    return this._reorderThreshold;
  }

  get ingredients(): MenuItemIngredient[] {
    return [...this._ingredients];
  }

  // Setters
  set restaurant(restaurant: Restaurant | null) {
    this._restaurant = restaurant;
    if (restaurant) {
      this._restaurantId = restaurant.id;
    }
  }

  set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Inventory item name cannot be empty');
    }
    this._name = value.trim();
    this.touch();
  }

  set unit(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Unit cannot be empty');
    }
    this._unit = value.trim().toLowerCase();
    this.touch();
  }

  set reorderThreshold(value: number) {
    if (value < 0) {
      throw new Error('Reorder threshold cannot be negative');
    }
    this._reorderThreshold = new Decimal(value);
    this.touch();
  }

  /**
   * Business Methods
   */

  /**
   * Add stock quantity
   */
  addStock(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount to add must be positive');
    }
    this._quantity = this._quantity.add(new Decimal(amount));
    this.touch();
  }

  /**
   * Deduct stock quantity
   */
  deductStock(amount: number): boolean {
    if (amount <= 0) {
      throw new Error('Amount to deduct must be positive');
    }
    if (this._quantity.toNumber() < amount) {
      return false; // Insufficient stock
    }
    this._quantity = this._quantity.subtract(new Decimal(amount));
    this.touch();
    return true;
  }

  /**
   * Set stock quantity directly
   */
  setStock(amount: number): void {
    if (amount < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    this._quantity = new Decimal(amount);
    this.touch();
  }

  /**
   * Check if stock is low
   */
  isLowStock(): boolean {
    return this._quantity.toNumber() <= this._reorderThreshold.toNumber();
  }

  /**
   * Check if sufficient stock is available
   */
  hasSufficientStock(requiredAmount: number): boolean {
    return this._quantity.toNumber() >= requiredAmount;
  }

  /**
   * Get stock status
   */
  getStockStatus(): 'adequate' | 'low' | 'out_of_stock' {
    if (this._quantity.toNumber() === 0) return 'out_of_stock';
    if (this.isLowStock()) return 'low';
    return 'adequate';
  }

  /**
   * Calculate how much more stock is needed
   */
  getReorderAmount(): number {
    const deficit =
      this._reorderThreshold.toNumber() - this._quantity.toNumber();
    return deficit > 0 ? deficit : 0;
  }

  // MenuItemIngredient association
  addIngredient(ingredient: MenuItemIngredient): void {
    if (
      !this._ingredients.find(
        (i) =>
          i.inventoryItemId === ingredient.inventoryItemId &&
          i.menuItemId === ingredient.menuItemId,
      )
    ) {
      ingredient.inventoryItem = this;
      this._ingredients.push(ingredient);
    }
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._restaurantId !== undefined &&
      this._restaurantId.length > 0 &&
      this._name !== undefined &&
      this._name.length > 0 &&
      this._unit !== undefined &&
      this._unit.length > 0 &&
      this._quantity.toNumber() >= 0 &&
      this._reorderThreshold.toNumber() >= 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      restaurantId: this._restaurantId,
      name: this._name,
      quantity: this._quantity.toNumber(),
      unit: this._unit,
      reorderThreshold: this._reorderThreshold.toNumber(),
      isActive: this._isActive,
      stockStatus: this.getStockStatus(),
      isLowStock: this.isLowStock(),
      reorderAmount: this.getReorderAmount(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromPrisma(data: {
    id: string;
    restaurant_id: string;
    name: string;
    quantity: number;
    unit: string;
    reorder_threshold: number;
    is_active: boolean;
    created_at: Date;
  }): InventoryItem {
    return new InventoryItem(
      data.id,
      data.restaurant_id,
      data.name,
      data.quantity,
      data.unit,
      data.reorder_threshold,
      data.created_at,
      undefined,
      data.is_active,
    );
  }
}

/**
 * MenuItemIngredient Entity
 * Junction entity for many-to-many relationship between MenuItem and InventoryItem
 * Demonstrates Association Pattern
 */
export class MenuItemIngredient extends BaseEntity {
  private _menuItemId: string;
  private _menuItem: MenuItem | null = null;
  private _inventoryItemId: string;
  private _inventoryItem: InventoryItem | null = null;
  private _quantityRequired: Decimal;

  constructor(
    menuItemId: string,
    inventoryItemId: string,
    quantityRequired: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(`${menuItemId}_${inventoryItemId}`, createdAt, updatedAt, true);
    this._menuItemId = menuItemId;
    this._inventoryItemId = inventoryItemId;
    this._quantityRequired = new Decimal(quantityRequired);
  }

  // Getters
  get menuItemId(): string {
    return this._menuItemId;
  }

  get menuItem(): MenuItem | null {
    return this._menuItem;
  }

  get inventoryItemId(): string {
    return this._inventoryItemId;
  }

  get inventoryItem(): InventoryItem | null {
    return this._inventoryItem;
  }

  get quantityRequired(): Decimal {
    return this._quantityRequired;
  }

  // Setters
  set menuItem(menuItem: MenuItem | null) {
    this._menuItem = menuItem;
    if (menuItem) {
      this._menuItemId = menuItem.id;
    }
  }

  set inventoryItem(inventoryItem: InventoryItem | null) {
    this._inventoryItem = inventoryItem;
    if (inventoryItem) {
      this._inventoryItemId = inventoryItem.id;
    }
  }

  set quantityRequired(value: number) {
    if (value <= 0) {
      throw new Error('Quantity required must be positive');
    }
    this._quantityRequired = new Decimal(value);
    this.touch();
  }

  /**
   * Check if inventory has sufficient stock for this requirement
   */
  hasSufficientStock(): boolean {
    if (!this._inventoryItem) return false;
    return this._inventoryItem.hasSufficientStock(
      this._quantityRequired.toNumber(),
    );
  }

  /**
   * Get the cost of this ingredient requirement
   */
  get cost(): Decimal {
    // Simplified cost calculation - in real app, might use weighted average cost
    return new Decimal(0); // Placeholder - would calculate based on inventory cost
  }

  /**
   * Deduct required quantity from inventory
   */
  deductFromInventory(): boolean {
    if (!this._inventoryItem) return false;
    return this._inventoryItem.deductStock(this._quantityRequired.toNumber());
  }

  validate(): boolean {
    return (
      this._menuItemId !== undefined &&
      this._menuItemId.length > 0 &&
      this._inventoryItemId !== undefined &&
      this._inventoryItemId.length > 0 &&
      this._quantityRequired.toNumber() > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      menuItemId: this._menuItemId,
      inventoryItemId: this._inventoryItemId,
      quantityRequired: this._quantityRequired.toNumber(),
      hasSufficientStock: this.hasSufficientStock(),
    };
  }
}

// Decimal class helper
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
}
