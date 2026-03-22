import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { BillStatus } from '../../shared/constants/bill-status';

// Import Decimal type as any to avoid type conflicts
// The actual implementation comes from shared/utils/decimal
type Decimal = {
  toNumber(): number;
  add(other: Decimal): Decimal;
  subtract(other: Decimal): Decimal;
  multiply(factor: number): Decimal;
  divide(divisor: number): Decimal;
  greaterThanOrEqualTo(other: number): boolean;
  greaterThan(other: number): boolean;
  lessThan(other: number): boolean;
  equals(other: number): boolean;
};

/**
 * Bill Entity
 * Represents a bill/invoice for an order
 * Demonstrates Financial Calculation Business Logic
 */
export class Bill extends BaseEntity {
  private _orderId: string;
  private _order: Order | null = null;
  private _subtotal: Decimal;
  private _tax: Decimal;
  private _taxRate: number; // as percentage
  private _serviceCharge: Decimal;
  private _serviceChargeRate: number; // as percentage
  private _totalAmount: Decimal;
  private _status: BillStatus;
  private _paidAt: Date | null = null;
  private _paymentMethod: string | null = null;

  constructor(
    id: string,
    orderId: string,
    subtotal: number,
    taxRate: number = 10, // Default 10% tax
    serviceChargeRate: number = 5, // Default 5% service charge
    status: BillStatus = BillStatus.PENDING,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt, true);
    this._orderId = orderId;
    // Use number operations directly and wrap in Decimal later
    this._subtotal = { toNumber: () => subtotal } as Decimal;
    this._taxRate = taxRate;
    this._serviceChargeRate = serviceChargeRate;
    this._status = status;
    this._tax = { toNumber: () => 0 } as Decimal;
    this._serviceCharge = { toNumber: () => 0 } as Decimal;
    this._totalAmount = { toNumber: () => 0 } as Decimal;
    this.calculateTotals();
  }

  // Getters
  get orderId(): string {
    return this._orderId;
  }

  get order(): Order | null {
    return this._order;
  }

  get subtotal(): Decimal {
    return this._subtotal;
  }

  get tax(): Decimal {
    return this._tax;
  }

  get taxRate(): number {
    return this._taxRate;
  }

  get serviceCharge(): Decimal {
    return this._serviceCharge;
  }

  get serviceChargeRate(): number {
    return this._serviceChargeRate;
  }

  get totalAmount(): Decimal {
    return this._totalAmount;
  }

  get status(): BillStatus {
    return this._status;
  }

  get paidAt(): Date | null {
    return this._paidAt;
  }

  get paymentMethod(): string | null {
    return this._paymentMethod;
  }

  // Setters
  set order(order: Order | null) {
    this._order = order;
    if (order) {
      this._orderId = order.id;
    }
  }

  set taxRate(value: number) {
    if (value < 0) {
      throw new Error('Tax rate cannot be negative');
    }
    if (value > 100) {
      throw new Error('Tax rate cannot exceed 100%');
    }
    this._taxRate = value;
    this.calculateTotals();
    this.touch();
  }

  set serviceChargeRate(value: number) {
    if (value < 0) {
      throw new Error('Service charge rate cannot be negative');
    }
    if (value > 100) {
      throw new Error('Service charge rate cannot exceed 100%');
    }
    this._serviceChargeRate = value;
    this.calculateTotals();
    this.touch();
  }

  /**
   * Calculate tax, service charge, and total
   */
  private calculateTotals(): void {
    const subtotalNum = (
      this._subtotal as unknown as { toNumber: () => number }
    ).toNumber();
    const taxNum = subtotalNum * (this._taxRate / 100);
    const serviceChargeNum = subtotalNum * (this._serviceChargeRate / 100);
    const totalNum = subtotalNum + taxNum + serviceChargeNum;

    this._tax = { toNumber: () => taxNum } as unknown as Decimal;
    this._serviceCharge = {
      toNumber: () => serviceChargeNum,
    } as unknown as Decimal;
    this._totalAmount = { toNumber: () => totalNum } as unknown as Decimal;
  }

  /**
   * Recalculate bill from order subtotal
   */
  recalculateFromOrder(order: Order): void {
    if (!order) return;
    const subtotal = order.calculateSubtotal();
    this._subtotal = { toNumber: () => subtotal } as unknown as Decimal;
    this.calculateTotals();
    this.touch();
  }

  /**
   * Apply discount (reduces subtotal)
   */
  applyDiscount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Discount amount must be positive');
    }
    if (amount > this._subtotal.toNumber()) {
      throw new Error('Discount cannot exceed subtotal');
    }
    const newSubtotal = this._subtotal.toNumber() - amount;
    this._subtotal = {
      toNumber: () => newSubtotal,
      add: (other: unknown) =>
        (other as { toNumber: () => number }).toNumber() + newSubtotal,
      subtract: (other: unknown) =>
        newSubtotal - (other as { toNumber: () => number }).toNumber(),
      multiply: (factor: number) => newSubtotal * factor,
      divide: (divisor: number) => newSubtotal / divisor,
      greaterThanOrEqualTo: (other: number) => newSubtotal >= other,
      greaterThan: (other: number) => newSubtotal > other,
      lessThan: (other: number) => newSubtotal < other,
      equals: (other: number) => newSubtotal === other,
    } as unknown as Decimal;
    this.calculateTotals();
    this.touch();
  }

  /**
   * Mark bill as paid
   */
  markAsPaid(paymentMethod: string): void {
    if (this._status === BillStatus.PAID) {
      throw new Error('Bill is already paid');
    }
    this._status = BillStatus.PAID;
    this._paidAt = new Date();
    this._paymentMethod = paymentMethod;
    this.touch();
  }

  /**
   * Cancel bill
   */
  cancel(_reason: string): void {
    if (this._status === BillStatus.PAID) {
      throw new Error('Cannot cancel paid bill');
    }
    this._status = BillStatus.CANCELLED;
    this.touch();
  }

  /**
   * Check if bill is paid
   */
  isPaid(): boolean {
    return this._status === BillStatus.PAID;
  }

  /**
   * Check if bill is pending
   */
  isPending(): boolean {
    return this._status === BillStatus.PENDING;
  }

  /**
   * Get formatted bill breakdown
   */
  getBreakdown(): {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    total: number;
  } {
    return {
      subtotal: this._subtotal.toNumber(),
      tax: this._tax.toNumber(),
      serviceCharge: this._serviceCharge.toNumber(),
      total: this._totalAmount.toNumber(),
    };
  }

  /**
   * Get bill summary
   */
  getSummary(): string {
    const breakdown = this.getBreakdown();
    return (
      `Subtotal: $${breakdown.subtotal.toFixed(2)}, ` +
      `Tax (${this._taxRate}%): $${breakdown.tax.toFixed(2)}, ` +
      `Service Charge (${this._serviceChargeRate}%): $${breakdown.serviceCharge.toFixed(2)}, ` +
      `Total: $${breakdown.total.toFixed(2)}`
    );
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._orderId !== undefined &&
      this._orderId.length > 0 &&
      this._subtotal.toNumber() >= 0 &&
      this._taxRate >= 0 &&
      this._taxRate <= 100 &&
      this._serviceChargeRate >= 0 &&
      this._serviceChargeRate <= 100 &&
      Object.values(BillStatus).includes(this._status)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      orderId: this._orderId,
      subtotal: this._subtotal.toNumber(),
      taxRate: this._taxRate,
      tax: this._tax.toNumber(),
      serviceChargeRate: this._serviceChargeRate,
      serviceCharge: this._serviceCharge.toNumber(),
      totalAmount: this._totalAmount.toNumber(),
      status: this._status,
      isPaid: this.isPaid(),
      isPending: this.isPending(),
      paidAt: this._paidAt,
      paymentMethod: this._paymentMethod,
      breakdown: this.getBreakdown(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromPrisma(data: {
    id: string;
    order_id: string;
    subtotal: number;
    tax: number;
    service_charge: number;
    total_amount: number;
    status: string;
    created_at: Date;
  }): Bill {
    const bill = new Bill(
      data.id,
      data.order_id,
      data.subtotal,
      undefined, // tax rate calculated
      undefined, // service charge rate calculated
      data.status as BillStatus,
      data.created_at,
    );
    return bill;
  }
}
