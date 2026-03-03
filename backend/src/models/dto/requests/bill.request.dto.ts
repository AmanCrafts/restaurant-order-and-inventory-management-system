/**
 * Bill Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Bill Request DTO
 */
export class CreateBillRequestDto extends BaseCreateRequestDto {
  orderId: string;
  taxRate: number;
  serviceChargeRate: number;

  constructor(data: {
    orderId: string;
    taxRate?: number;
    serviceChargeRate?: number;
  }) {
    super();
    this.orderId = data.orderId;
    this.taxRate = data.taxRate ?? 10;
    this.serviceChargeRate = data.serviceChargeRate ?? 5;
  }

  validate(): boolean {
    return (
      this.orderId.length > 0 &&
      this.taxRate >= 0 &&
      this.taxRate <= 100 &&
      this.serviceChargeRate >= 0 &&
      this.serviceChargeRate <= 100
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      taxRate: this.taxRate,
      serviceChargeRate: this.serviceChargeRate,
    };
  }
}

/**
 * Pay Bill Request DTO
 */
export class PayBillRequestDto extends BaseUpdateRequestDto {
  paymentMethod: string;

  constructor(data: { paymentMethod: string }) {
    super();
    this.paymentMethod = data.paymentMethod;
  }

  validate(): boolean {
    const validMethods = ['CASH', 'CARD', 'UPI', 'WALLET', 'OTHER'];
    return validMethods.includes(this.paymentMethod.toUpperCase());
  }

  toJSON(): Record<string, unknown> {
    return {
      paymentMethod: this.paymentMethod,
    };
  }
}

/**
 * Apply Discount Request DTO
 */
export class ApplyDiscountRequestDto extends BaseUpdateRequestDto {
  amount: number;
  reason: string;

  constructor(data: { amount: number; reason: string }) {
    super();
    this.amount = data.amount;
    this.reason = data.reason.trim();
  }

  validate(): boolean {
    return this.amount > 0 && this.reason.length > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      amount: this.amount,
      reason: this.reason,
    };
  }
}
