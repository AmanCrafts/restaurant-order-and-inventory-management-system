/**
 * Bill Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Bill Breakdown DTO
 */
export class BillBreakdownDto {
  subtotal: number;
  taxRate: number;
  tax: number;
  serviceChargeRate: number;
  serviceCharge: number;
  discount: number;
  total: number;

  constructor(data: {
    subtotal: number;
    taxRate: number;
    tax: number;
    serviceChargeRate: number;
    serviceCharge: number;
    discount?: number;
    total: number;
  }) {
    this.subtotal = data.subtotal;
    this.taxRate = data.taxRate;
    this.tax = data.tax;
    this.serviceChargeRate = data.serviceChargeRate;
    this.serviceCharge = data.serviceCharge;
    this.discount = data.discount || 0;
    this.total = data.total;
  }
}

/**
 * Bill Response DTO
 */
export class BillResponseDto extends BaseResponseDto {
  orderId: string;
  tableNumber: number;
  status: string;
  breakdown: BillBreakdownDto;
  isPaid: boolean;
  paidAt: Date | null;
  paymentMethod: string | null;

  constructor(bill: {
    id: string;
    orderId: string;
    tableNumber: number;
    status: string;
    breakdown: BillBreakdownDto;
    isPaid: boolean;
    paidAt: Date | null;
    paymentMethod: string | null;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super(bill);
    this.orderId = bill.orderId;
    this.tableNumber = bill.tableNumber;
    this.status = bill.status;
    this.breakdown = bill.breakdown;
    this.isPaid = bill.isPaid;
    this.paidAt = bill.paidAt;
    this.paymentMethod = bill.paymentMethod;
  }

  /**
   * Get formatted total
   */
  getFormattedTotal(): string {
    return `$${this.breakdown.total.toFixed(2)}`;
  }
}

/**
 * Bill Summary Response DTO
 */
export class BillSummaryResponseDto {
  id: string;
  orderId: string;
  tableNumber: number;
  total: number;
  status: string;
  isPaid: boolean;
  createdAt: Date;

  constructor(bill: {
    id: string;
    orderId: string;
    tableNumber: number;
    total: number;
    status: string;
    isPaid: boolean;
    createdAt: Date;
  }) {
    this.id = bill.id;
    this.orderId = bill.orderId;
    this.tableNumber = bill.tableNumber;
    this.total = bill.total;
    this.status = bill.status;
    this.isPaid = bill.isPaid;
    this.createdAt = bill.createdAt;
  }
}
