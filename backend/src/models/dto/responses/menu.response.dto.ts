/**
 * Menu Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Menu Item Response DTO
 */
export class MenuItemResponseDto extends BaseResponseDto {
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  preparationTime: number;
  canBePrepared: boolean;

  constructor(item: {
    id: string;
    categoryId: string;
    name: string;
    price: number;
    isAvailable: boolean;
    preparationTime: number;
    canBePrepared?: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super(item);
    this.categoryId = item.categoryId;
    this.name = item.name;
    this.price = item.price;
    this.isAvailable = item.isAvailable;
    this.preparationTime = item.preparationTime;
    this.canBePrepared = item.canBePrepared ?? true;
  }
}

/**
 * Menu Category Response DTO
 */
export class MenuCategoryResponseDto extends BaseResponseDto {
  menuId: string;
  name: string;
  items: MenuItemResponseDto[];
  itemsCount: number;
  availableItemsCount: number;

  constructor(category: {
    id: string;
    menuId: string;
    name: string;
    items?: MenuItemResponseDto[];
    createdAt: Date;
    updatedAt?: Date;
    isActive?: boolean;
  }) {
    super(category);
    this.menuId = category.menuId;
    this.name = category.name;
    this.items = category.items || [];
    this.itemsCount = this.items.length;
    this.availableItemsCount = this.items.filter((i) => i.isAvailable).length;
  }
}

/**
 * Menu Response DTO
 */
export class MenuResponseDto extends BaseResponseDto {
  restaurantId: string;
  categories: MenuCategoryResponseDto[];
  categoriesCount: number;
  totalItems: number;

  constructor(menu: {
    id: string;
    restaurantId: string;
    categories?: MenuCategoryResponseDto[];
    createdAt: Date;
    updatedAt?: Date;
    isActive?: boolean;
  }) {
    super(menu);
    this.restaurantId = menu.restaurantId;
    this.categories = menu.categories || [];
    this.categoriesCount = this.categories.length;
    this.totalItems = this.categories.reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    );
  }
}

/**
 * Menu Summary Response DTO
 */
export class MenuSummaryResponseDto {
  id: string;
  restaurantId: string;
  isActive: boolean;
  categoriesCount: number;

  constructor(menu: {
    id: string;
    restaurantId: string;
    isActive: boolean;
    categoriesCount?: number;
  }) {
    this.id = menu.id;
    this.restaurantId = menu.restaurantId;
    this.isActive = menu.isActive;
    this.categoriesCount = menu.categoriesCount || 0;
  }
}
