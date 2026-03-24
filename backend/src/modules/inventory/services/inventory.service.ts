/**
 * Inventory Service
 * Business logic for inventory management
 */

import InventoryRepository, {
  // CreateInventoryItemData,
  // UpdateInventoryItemData,
  InventoryFilter,
} from '../repositories/inventory.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { InventoryItem } from '../../../models/entities/inventory-item.entity';
import { AppError } from '../../../shared/middleware/error-handler';
import logger from '../../../shared/utils/logger';

export interface CreateInventoryItemInput {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
}

export interface UpdateInventoryItemInput {
  name?: string;
  unit?: string;
  reorderThreshold?: number;
  isActive?: boolean;
}

export interface UpdateStockInput {
  amount: number;
  operation: 'ADD' | 'SET' | 'DEDUCT';
  reason?: string;
}

export interface InventorySearchInput {
  restaurantId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export class InventoryService {
  private inventoryRepository: InventoryRepository;
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
    this.restaurantRepository = new RestaurantRepository();
  }

  /**
   * Get all inventory items
   */
  async getAll(filter?: InventorySearchInput): Promise<InventoryItem[]> {
    const repoFilter: InventoryFilter = {};

    if (filter?.restaurantId) repoFilter.restaurantId = filter.restaurantId;
    if (filter?.search) repoFilter.search = filter.search;
    if (filter?.isActive !== undefined) repoFilter.isActive = filter.isActive;
    if (filter?.lowStock) repoFilter.lowStock = filter.lowStock;

    return this.inventoryRepository.findAll(repoFilter);
  }

  /**
   * Get inventory item by ID
   */
  async getById(id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findById(id);

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    return item;
  }

  /**
   * Get inventory item by ID with restaurant details
   */
  async getByIdWithRestaurant(id: string): Promise<{
    item: InventoryItem;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  }> {
    const result = await this.inventoryRepository.findByIdWithRestaurant(id);

    if (!result) {
      throw new AppError('Inventory item not found', 404);
    }

    return result;
  }

  /**
   * Get all inventory items by restaurant ID
   */
  async getByRestaurantId(restaurantId: string): Promise<InventoryItem[]> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.inventoryRepository.findByRestaurantId(restaurantId);
  }

  /**
   * Create new inventory item
   */
  async create(
    data: CreateInventoryItemInput,
    createdById: string,
  ): Promise<InventoryItem> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(
      data.restaurantId,
    );

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate name
    if (!data.name || data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    // Validate quantity
    if (data.quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400);
    }

    // Validate unit
    if (!data.unit || data.unit.trim().length === 0) {
      throw new AppError('Unit is required', 400);
    }

    // Validate reorder threshold
    if (data.reorderThreshold < 0) {
      throw new AppError('Reorder threshold cannot be negative', 400);
    }

    // Check if name already exists in restaurant
    const nameExists = await this.inventoryRepository.nameExists(
      data.name,
      data.restaurantId,
    );
    if (nameExists) {
      throw new AppError(
        `Inventory item with name "${data.name}" already exists`,
        409,
      );
    }

    const item = await this.inventoryRepository.create({
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      quantity: data.quantity,
      unit: data.unit.trim().toLowerCase(),
      reorderThreshold: data.reorderThreshold ?? 10,
      isActive: true,
    });

    logger.info(
      `Inventory item created: ${item.name} (${item.id}) by admin ${createdById}`,
    );

    return item;
  }

  /**
   * Update inventory item
   */
  async update(
    id: string,
    data: UpdateInventoryItemInput,
    updatedById: string,
  ): Promise<InventoryItem> {
    // Check if item exists
    const existing = await this.inventoryRepository.findById(id);

    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.trim().length < 2) {
        throw new AppError('Name must be at least 2 characters', 400);
      }

      // Check if name already exists
      const nameExists = await this.inventoryRepository.nameExists(
        data.name,
        existing.restaurantId,
        id,
      );
      if (nameExists) {
        throw new AppError(
          `Inventory item with name "${data.name}" already exists`,
          409,
        );
      }
    }

    // Validate unit if provided
    if (data.unit !== undefined && data.unit.trim().length === 0) {
      throw new AppError('Unit cannot be empty', 400);
    }

    // Validate reorder threshold if provided
    if (data.reorderThreshold !== undefined && data.reorderThreshold < 0) {
      throw new AppError('Reorder threshold cannot be negative', 400);
    }

    const item = await this.inventoryRepository.update(id, {
      name: data.name?.trim(),
      unit: data.unit?.trim().toLowerCase(),
      reorderThreshold: data.reorderThreshold,
      isActive: data.isActive,
    });

    if (!item) {
      throw new AppError('Failed to update inventory item', 500);
    }

    logger.info(
      `Inventory item updated: ${item.name} (${item.id}) by admin ${updatedById}`,
    );

    return item;
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    id: string,
    data: UpdateStockInput,
    updatedById: string,
  ): Promise<InventoryItem> {
    // Check if item exists
    const existing = await this.inventoryRepository.findById(id);

    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    // Validate amount
    if (data.amount < 0) {
      throw new AppError('Amount cannot be negative', 400);
    }

    // Convert Decimal to number for calculations
    const currentQuantity = existing.quantity.toNumber();
    let newQuantity: number;

    switch (data.operation) {
      case 'ADD':
        newQuantity = currentQuantity + data.amount;
        break;
      case 'DEDUCT':
        if (currentQuantity < data.amount) {
          throw new AppError('Insufficient stock for deduction', 400);
        }
        newQuantity = currentQuantity - data.amount;
        break;
      case 'SET':
        newQuantity = data.amount;
        break;
      default:
        throw new AppError('Invalid operation', 400);
    }

    const item = await this.inventoryRepository.updateQuantity(id, newQuantity);

    if (!item) {
      throw new AppError('Failed to update stock', 500);
    }

    logger.info(
      `Stock ${data.operation.toLowerCase()}ed for ${item.name}: ${currentQuantity} -> ${newQuantity} by admin ${updatedById}`,
    );

    return item;
  }

  /**
   * Deactivate inventory item
   */
  async deactivate(id: string, deactivatedById: string): Promise<void> {
    const existing = await this.inventoryRepository.findById(id);

    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    if (!existing.isActive) {
      throw new AppError('Inventory item is already deactivated', 400);
    }

    await this.inventoryRepository.softDelete(id);

    logger.info(
      `Inventory item deactivated: ${existing.name} (${id}) by admin ${deactivatedById}`,
    );
  }

  /**
   * Activate inventory item
   */
  async activate(id: string, activatedById: string): Promise<InventoryItem> {
    const existing = await this.inventoryRepository.findById(id);

    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    if (existing.isActive) {
      throw new AppError('Inventory item is already active', 400);
    }

    const item = await this.inventoryRepository.update(id, { isActive: true });

    if (!item) {
      throw new AppError('Failed to activate inventory item', 500);
    }

    logger.info(
      `Inventory item activated: ${item.name} (${id}) by admin ${activatedById}`,
    );

    return item;
  }

  /**
   * Delete inventory item permanently
   */
  async delete(id: string, deletedById: string): Promise<void> {
    const existing = await this.inventoryRepository.findById(id);

    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    await this.inventoryRepository.hardDelete(id);

    logger.info(
      `Inventory item deleted: ${existing.name} (${id}) by admin ${deletedById}`,
    );
  }

  /**
   * Get low stock items for restaurant
   */
  async getLowStockItems(restaurantId: string): Promise<InventoryItem[]> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.inventoryRepository.getLowStockItems(restaurantId);
  }

  /**
   * Get inventory statistics
   */
  async getStats(restaurantId: string): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
    byUnit: Record<string, number>;
  }> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.inventoryRepository.getStats(restaurantId);
  }

  /**
   * Search inventory items
   */
  async search(params: {
    restaurantId: string;
    query?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }): Promise<InventoryItem[]> {
    const filter: InventoryFilter = {
      restaurantId: params.restaurantId,
    };

    if (params.query) {
      filter.search = params.query;
    }

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    if (params.lowStock) {
      filter.lowStock = params.lowStock;
    }

    return this.inventoryRepository.findAll(filter);
  }

  /**
   * Deduct stock for menu item ingredients
   * Called when an order is placed
   */
  async deductStockForOrder(
    menuItemId: string,
    quantity: number,
    restaurantId: string,
  ): Promise<{ success: boolean; insufficientItems: string[] }> {
    // Get all ingredients for this menu item
    const ingredients = await prisma.menuItemIngredient.findMany({
      where: { menu_item_id: menuItemId },
      include: { inventoryItem: true },
    });

    if (ingredients.length === 0) {
      return { success: true, insufficientItems: [] };
    }

    const insufficientItems: string[] = [];

    // Check if all ingredients have sufficient stock
    for (const ingredient of ingredients) {
      const requiredAmount = Number(ingredient.quantity_required) * quantity;
      const availableStock = Number(ingredient.inventoryItem.quantity);

      if (availableStock < requiredAmount) {
        insufficientItems.push(ingredient.inventoryItem.name);
      }
    }

    if (insufficientItems.length > 0) {
      return { success: false, insufficientItems };
    }

    // Deduct stock for all ingredients
    for (const ingredient of ingredients) {
      const requiredAmount = Number(ingredient.quantity_required) * quantity;
      const newQuantity =
        Number(ingredient.inventoryItem.quantity) - requiredAmount;

      await this.inventoryRepository.updateQuantity(
        ingredient.inventory_item_id,
        newQuantity,
      );
    }

    logger.info(
      `Stock deducted for order: menu item ${menuItemId} x${quantity} in restaurant ${restaurantId}`,
    );

    return { success: true, insufficientItems: [] };
  }
}

// Need to import prisma for the deductStockForOrder method
import { prisma } from '../../../shared/config/database';

export default InventoryService;
