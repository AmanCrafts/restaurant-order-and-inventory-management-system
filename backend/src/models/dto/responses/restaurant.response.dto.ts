/**
 * Restaurant Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Restaurant Response DTO
 */
export class RestaurantResponseDto extends BaseResponseDto {
  name: string;
  address: string;
  contactNumber: string;
  usersCount: number;
  menusCount: number;
  tablesCount: number;

  constructor(restaurant: {
    id: string;
    name: string;
    address: string;
    contactNumber: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    usersCount?: number;
    menusCount?: number;
    tablesCount?: number;
  }) {
    super(restaurant);
    this.name = restaurant.name;
    this.address = restaurant.address;
    this.contactNumber = restaurant.contactNumber;
    this.usersCount = restaurant.usersCount || 0;
    this.menusCount = restaurant.menusCount || 0;
    this.tablesCount = restaurant.tablesCount || 0;
  }
}

/**
 * Restaurant Detail Response DTO
 */
export class RestaurantDetailResponseDto extends RestaurantResponseDto {
  // Could include full nested data like users, menus, tables
  // For now, keeping it simple with counts
}

/**
 * Restaurant Summary Response DTO
 * For list views
 */
export class RestaurantSummaryResponseDto {
  id: string;
  name: string;
  contactNumber: string;
  isActive: boolean;

  constructor(restaurant: {
    id: string;
    name: string;
    contactNumber: string;
    isActive: boolean;
  }) {
    this.id = restaurant.id;
    this.name = restaurant.name;
    this.contactNumber = restaurant.contactNumber;
    this.isActive = restaurant.isActive;
  }
}
