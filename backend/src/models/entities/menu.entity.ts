/**
 * Menu Module Entities
 * Demonstrates Composition and Association
 */

import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { MenuItemIngredient } from './inventory-item.entity';

// Define Decimal type locally to avoid import conflicts
type Decimal = {
  toNumber(): number;
  add(other: Decimal): Decimal;
  subtract(other: Decimal): Decimal;
  multiply(factor: number): Decimal;
  greaterThanOrEqualTo(other: number): boolean;
};

// Helper to create a Decimal-like object
function createDecimal(value: number): Decimal {
  return {
    toNumber: () => value,
    add: (other: Decimal) => createDecimal(value + other.toNumber()),
    subtract: (other: Decimal) => createDecimal(value - other.toNumber()),
    multiply: (factor: number) => createDecimal(value * factor),
    greaterThanOrEqualTo: (other: number) => value >= other,
  };
}

/**
 * Menu Entity
 * Represents a restaurant's menu
 */
export class Menu extends BaseEntity {
  private _restaurantId: string;
  private _restaurant: Restaurant | null = null;
  private _categories: MenuCategory[] = [];

  constructor(
    id: string,
    restaurantId: string,
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._restaurantId = restaurantId;
  }

  // Getters
  get restaurantId(): string {
    return this._restaurantId;
  }

  get restaurant(): Restaurant | null {
    return this._restaurant;
  }

  get categories(): MenuCategory[] {
    return [...this._categories];
  }

  set restaurant(restaurant: Restaurant | null) {
    this._restaurant = restaurant;
    if (restaurant) {
      this._restaurantId = restaurant.id;
    }
  }

  // Category management
  addCategory(category: MenuCategory): void {
    if (!this._categories.find((c) => c.id === category.id)) {
      category.menu = this;
      this._categories.push(category);
      this.touch();
    }
  }

  removeCategory(categoryId: string): void {
    this._categories = this._categories.filter((c) => c.id !== categoryId);
    this.touch();
  }

  getCategoryById(categoryId: string): MenuCategory | undefined {
    return this._categories.find((c) => c.id === categoryId);
  }

  getCategoryByName(name: string): MenuCategory | undefined {
    return this._categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
  }

  /**
   * Get all items across all categories
   */
  getAllItems(): MenuItem[] {
    return this._categories.flatMap((c) => c.items);
  }

  /**
   * Get available items only
   */
  getAvailableItems(): MenuItem[] {
    return this.getAllItems().filter((item) => item.isAvailable);
  }

  /**
   * Search items by name
   */
  searchItems(query: string): MenuItem[] {
    return this.getAllItems().filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._restaurantId !== undefined &&
      this._restaurantId.length > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      restaurantId: this._restaurantId,
      isActive: this._isActive,
      categoriesCount: this._categories.length,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromPrisma(data: {
    id: string;
    restaurant_id: string;
    is_active: boolean;
  }): Menu {
    return new Menu(data.id, data.restaurant_id, data.is_active);
  }
}

/**
 * MenuCategory Entity
 * Represents a category within a menu
 */
export class MenuCategory extends BaseEntity {
  private _menuId: string;
  private _menu: Menu | null = null;
  private _name: string;
  private _items: MenuItem[] = [];

  constructor(
    id: string,
    menuId: string,
    name: string,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._menuId = menuId;
    this._name = name;
  }

  // Getters
  get menuId(): string {
    return this._menuId;
  }

  get menu(): Menu | null {
    return this._menu;
  }

  get name(): string {
    return this._name;
  }

  get items(): MenuItem[] {
    return [...this._items];
  }

  // Setters
  set menu(menu: Menu | null) {
    this._menu = menu;
    if (menu) {
      this._menuId = menu.id;
    }
  }

  set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    this._name = value.trim();
    this.touch();
  }

  // Item management
  addItem(item: MenuItem): void {
    if (!this._items.find((i) => i.id === item.id)) {
      item.category = this;
      this._items.push(item);
      this.touch();
    }
  }

  removeItem(itemId: string): void {
    this._items = this._items.filter((i) => i.id !== itemId);
    this.touch();
  }

  getItemById(itemId: string): MenuItem | undefined {
    return this._items.find((i) => i.id === itemId);
  }

  /**
   * Get available items in this category
   */
  getAvailableItems(): MenuItem[] {
    return this._items.filter((i) => i.isAvailable);
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._menuId !== undefined &&
      this._menuId.length > 0 &&
      this._name !== undefined &&
      this._name.length > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      menuId: this._menuId,
      name: this._name,
      isActive: this._isActive,
      itemsCount: this._items.length,
      availableItemsCount: this.getAvailableItems().length,
    };
  }

  static fromPrisma(data: {
    id: string;
    menu_id: string;
    name: string;
  }): MenuCategory {
    return new MenuCategory(data.id, data.menu_id, data.name);
  }
}

/**
 * MenuItem Entity
 * Represents an item in the menu
 */
export class MenuItem extends BaseEntity {
  private _categoryId: string;
  private _category: MenuCategory | null = null;
  private _name: string;
  private _price: Decimal;
  private _isAvailable: boolean;
  private _preparationTime: number; // in minutes
  private _ingredients: MenuItemIngredient[] = [];

  constructor(
    id: string,
    categoryId: string,
    name: string,
    price: number,
    isAvailable: boolean = true,
    preparationTime: number = 15,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._categoryId = categoryId;
    this._name = name;
    this._price = createDecimal(price);
    this._isAvailable = isAvailable;
    this._preparationTime = preparationTime;
  }

  // Getters
  get categoryId(): string {
    return this._categoryId;
  }

  get category(): MenuCategory | null {
    return this._category;
  }

  get name(): string {
    return this._name;
  }

  get price(): Decimal {
    return this._price;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get preparationTime(): number {
    return this._preparationTime;
  }

  get ingredients(): MenuItemIngredient[] {
    return [...this._ingredients];
  }

  // Setters
  set category(category: MenuCategory | null) {
    this._category = category;
    if (category) {
      this._categoryId = category.id;
    }
  }

  set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Item name cannot be empty');
    }
    this._name = value.trim();
    this.touch();
  }

  set price(value: number) {
    if (value < 0) {
      throw new Error('Price cannot be negative');
    }
    this._price = createDecimal(value);
    this.touch();
  }

  set isAvailable(value: boolean) {
    this._isAvailable = value;
    this.touch();
  }

  set preparationTime(value: number) {
    if (value < 0) {
      throw new Error('Preparation time cannot be negative');
    }
    this._preparationTime = value;
    this.touch();
  }

  // Ingredient management
  addIngredient(ingredient: MenuItemIngredient): void {
    if (
      !this._ingredients.find(
        (i) =>
          i.menuItemId === ingredient.menuItemId &&
          i.inventoryItemId === ingredient.inventoryItemId,
      )
    ) {
      ingredient.menuItem = this;
      this._ingredients.push(ingredient);
      this.touch();
    }
  }

  removeIngredient(inventoryItemId: string): void {
    this._ingredients = this._ingredients.filter(
      (i) => i.inventoryItemId !== inventoryItemId,
    );
    this.touch();
  }

  /**
   * Check if item can be prepared with current inventory
   */
  canBePrepared(): boolean {
    if (!this._isAvailable) return false;
    return this._ingredients.every((ing) => ing.hasSufficientStock());
  }

  /**
   * Get total ingredient cost
   */
  getIngredientCost(): Decimal {
    return this._ingredients.reduce(
      (sum, ing) => sum.add(ing.cost),
      createDecimal(0),
    );
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._categoryId !== undefined &&
      this._categoryId.length > 0 &&
      this._name !== undefined &&
      this._name.length > 0 &&
      this._price.greaterThanOrEqualTo(0) &&
      this._preparationTime >= 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      categoryId: this._categoryId,
      name: this._name,
      price: this._price.toNumber(),
      isAvailable: this._isAvailable,
      preparationTime: this._preparationTime,
      ingredientsCount: this._ingredients.length,
      canBePrepared: this.canBePrepared(),
    };
  }

  static fromPrisma(data: {
    id: string;
    category_id: string;
    name: string;
    price: number | { toNumber(): number };
    is_available: boolean;
    preparation_time: number;
  }): MenuItem {
    const priceNum =
      typeof data.price === 'number' ? data.price : data.price.toNumber();
    return new MenuItem(
      data.id,
      data.category_id,
      data.name,
      priceNum,
      data.is_available,
      data.preparation_time,
    );
  }
}
