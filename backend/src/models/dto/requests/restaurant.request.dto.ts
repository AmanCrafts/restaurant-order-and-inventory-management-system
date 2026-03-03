/**
 * Restaurant Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Restaurant Request DTO
 */
export class CreateRestaurantRequestDto extends BaseCreateRequestDto {
  name: string;
  address: string;
  contactNumber: string;

  constructor(data: { name: string; address: string; contactNumber: string }) {
    super();
    this.name = data.name.trim();
    this.address = data.address.trim();
    this.contactNumber = data.contactNumber.trim();
  }

  validate(): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return (
      this.name.length >= 2 &&
      this.address.length >= 5 &&
      phoneRegex.test(this.contactNumber)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      address: this.address,
      contactNumber: this.contactNumber,
    };
  }
}

/**
 * Update Restaurant Request DTO
 */
export class UpdateRestaurantRequestDto extends BaseUpdateRequestDto {
  name?: string;
  address?: string;
  contactNumber?: string;
  isActive?: boolean;

  constructor(data: {
    name?: string;
    address?: string;
    contactNumber?: string;
    isActive?: boolean;
  }) {
    super();
    if (data.name) this.name = data.name.trim();
    if (data.address) this.address = data.address.trim();
    if (data.contactNumber) this.contactNumber = data.contactNumber.trim();
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  validate(): boolean {
    if (this.contactNumber) {
      const phoneRegex =
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(this.contactNumber)) return false;
    }
    if (this.name && this.name.length < 2) return false;
    if (this.address && this.address.length < 5) return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.name !== undefined) result.name = this.name;
    if (this.address !== undefined) result.address = this.address;
    if (this.contactNumber !== undefined)
      result.contactNumber = this.contactNumber;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    return result;
  }
}
