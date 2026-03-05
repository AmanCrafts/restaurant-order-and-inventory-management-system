/**
 * Abstract Base Entity class
 * Provides common properties and methods for all entities
 * Demonstrates Abstraction and Encapsulation OOP principles
 */
export abstract class BaseEntity {
  protected _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _isActive: boolean;

  constructor(
    id: string,
    createdAt?: Date,
    updatedAt?: Date,
    isActive: boolean = true,
  ) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._isActive = isActive;
  }

  // Getters - Encapsulation
  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Setters with validation
  set isActive(value: boolean) {
    this._isActive = value;
    this.touch();
  }

  /**
   * Updates the updatedAt timestamp
   * Protected method to be used by subclasses
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Soft delete - marks entity as inactive
   */
  softDelete(): void {
    this._isActive = false;
    this.touch();
  }

  /**
   * Restore soft-deleted entity
   */
  restore(): void {
    this._isActive = true;
    this.touch();
  }

  /**
   * Abstract method to convert entity to plain object
   * Must be implemented by subclasses
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * Abstract method to validate entity state
   * Must be implemented by subclasses
   */
  abstract validate(): boolean;
}
