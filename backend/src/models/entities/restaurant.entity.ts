import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Menu } from './menu.entity';
import { InventoryItem } from './inventory-item.entity';
import { Table } from './table.entity';
import { Order } from './order.entity';

/**
 * Restaurant Entity
 * Represents a restaurant in the system
 * Demonstrates Association (has relationships with other entities)
 */
export class Restaurant extends BaseEntity {
  private _name: string;
  private _address: string;
  private _contactNumber: string;
  private _users: User[] = [];
  private _menus: Menu[] = [];
  private _inventoryItems: InventoryItem[] = [];
  private _tables: Table[] = [];
  private _orders: Order[] = [];

  constructor(
    id: string,
    name: string,
    address: string,
    contactNumber: string,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    super(id, createdAt, updatedAt, isActive);
    this._name = name;
    this._address = address;
    this._contactNumber = contactNumber;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get contactNumber(): string {
    return this._contactNumber;
  }

  get users(): User[] {
    return [...this._users];
  }

  get menus(): Menu[] {
    return [...this._menus];
  }

  get inventoryItems(): InventoryItem[] {
    return [...this._inventoryItems];
  }

  get tables(): Table[] {
    return [...this._tables];
  }

  get orders(): Order[] {
    return [...this._orders];
  }

  // Setters
  set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Restaurant name cannot be empty');
    }
    this._name = value.trim();
    this.touch();
  }

  set address(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Restaurant address cannot be empty');
    }
    this._address = value.trim();
    this.touch();
  }

  set contactNumber(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Contact number cannot be empty');
    }
    // Basic phone validation
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('Invalid contact number format');
    }
    this._contactNumber = value.trim();
    this.touch();
  }

  // Association methods
  addUser(user: User): void {
    if (!this._users.find((u) => u.id === user.id)) {
      this._users.push(user);
      this.touch();
    }
  }

  removeUser(userId: string): void {
    this._users = this._users.filter((u) => u.id !== userId);
    this.touch();
  }

  addMenu(menu: Menu): void {
    if (!this._menus.find((m) => m.id === menu.id)) {
      this._menus.push(menu);
      this.touch();
    }
  }

  removeMenu(menuId: string): void {
    this._menus = this._menus.filter((m) => m.id !== menuId);
    this.touch();
  }

  addInventoryItem(item: InventoryItem): void {
    if (!this._inventoryItems.find((i) => i.id === item.id)) {
      this._inventoryItems.push(item);
      this.touch();
    }
  }

  removeInventoryItem(itemId: string): void {
    this._inventoryItems = this._inventoryItems.filter((i) => i.id !== itemId);
    this.touch();
  }

  addTable(table: Table): void {
    if (!this._tables.find((t) => t.id === table.id)) {
      this._tables.push(table);
      this.touch();
    }
  }

  removeTable(tableId: string): void {
    this._tables = this._tables.filter((t) => t.id !== tableId);
    this.touch();
  }

  addOrder(order: Order): void {
    if (!this._orders.find((o) => o.id === order.id)) {
      this._orders.push(order);
      this.touch();
    }
  }

  /**
   * Get active tables count
   */
  getActiveTablesCount(): number {
    return this._tables.filter((t) => t.isActive).length;
  }

  /**
   * Get active menus count
   */
  getActiveMenusCount(): number {
    return this._menus.filter((m) => m.isActive).length;
  }

  /**
   * Get low stock inventory items
   */
  getLowStockItems(): InventoryItem[] {
    return this._inventoryItems.filter((item) => item.isLowStock());
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._name !== undefined &&
      this._name.length > 0 &&
      this._address !== undefined &&
      this._address.length > 0 &&
      this._contactNumber !== undefined &&
      this._contactNumber.length > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      address: this._address,
      contactNumber: this._contactNumber,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      usersCount: this._users.length,
      menusCount: this._menus.length,
      tablesCount: this._tables.length,
    };
  }

  /**
   * Factory method to create Restaurant from Prisma data
   */
  static fromPrisma(data: {
    id: string;
    name: string;
    address: string;
    contact_number: string;
    is_active: boolean;
    created_at: Date;
  }): Restaurant {
    return new Restaurant(
      data.id,
      data.name,
      data.address,
      data.contact_number,
      data.created_at,
      undefined,
      data.is_active,
    );
  }
}
