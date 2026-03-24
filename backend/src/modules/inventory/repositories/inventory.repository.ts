/**
 * Inventory Repository
 * Handles database operations for inventory management
 */

import { prisma } from '../../../shared/config/database';
import { InventoryItem } from '../../../models/entities/inventory-item.entity';

export interface CreateInventoryItemData {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
  isActive?: boolean;
}

export interface UpdateInventoryItemData {
  name?: string;
  unit?: string;
  reorderThreshold?: number;
  isActive?: boolean;
}

export interface InventoryFilter {
  restaurantId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export class InventoryRepository {
  /**
   * Find all inventory items with optional filtering
   */
  async findAll(filter?: InventoryFilter): Promise<InventoryItem[]> {
    const where: Record<string, unknown> = {};

    if (filter?.restaurantId) {
      where.restaurant_id = filter.restaurantId;
    }

    if (filter?.isActive !== undefined) {
      where.is_active = filter.isActive;
    }

    if (filter?.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    if (filter?.lowStock) {
      // Custom condition for low stock - use raw query
      const items = await prisma.$queryRaw<
        Array<{
          id: string;
          restaurant_id: string;
          name: string;
          quantity: number;
          unit: string;
          reorder_threshold: number;
          is_active: boolean;
          created_at: Date;
          updated_at: Date;
        }>
      >`
        SELECT * FROM inventory_items
        WHERE restaurant_id = ${filter.restaurantId}
        AND quantity <= reorder_threshold
        AND is_active = true
        ORDER BY name ASC
      `;
      return items.map((i) => InventoryItem.fromPrisma(i));
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return items.map((i) => InventoryItem.fromPrisma(i));
  }

  /**
   * Find inventory item by ID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) return null;

    return InventoryItem.fromPrisma(item);
  }

  /**
   * Find inventory item by ID with restaurant details
   */
  async findByIdWithRestaurant(id: string): Promise<{
    item: InventoryItem;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  } | null> {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!item || !item.restaurant) return null;

    return {
      item: InventoryItem.fromPrisma(item),
      restaurant: item.restaurant,
    };
  }

  /**
   * Find all inventory items by restaurant ID
   */
  async findByRestaurantId(restaurantId: string): Promise<InventoryItem[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { name: 'asc' },
    });

    return items.map((i) => InventoryItem.fromPrisma(i));
  }

  /**
   * Find inventory items by name (search)
   */
  async findByName(
    restaurantId: string,
    name: string,
  ): Promise<InventoryItem[]> {
    const items = await prisma.inventoryItem.findMany({
      where: {
        restaurant_id: restaurantId,
        name: { contains: name, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
    });

    return items.map((i) => InventoryItem.fromPrisma(i));
  }

  /**
   * Create new inventory item
   */
  async create(data: CreateInventoryItemData): Promise<InventoryItem> {
    const item = await prisma.inventoryItem.create({
      data: {
        restaurant_id: data.restaurantId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        reorder_threshold: data.reorderThreshold,
        is_active: data.isActive ?? true,
      },
    });

    return InventoryItem.fromPrisma(item);
  }

  /**
   * Update inventory item
   */
  async update(
    id: string,
    data: UpdateInventoryItemData,
  ): Promise<InventoryItem | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.reorderThreshold !== undefined)
      updateData.reorder_threshold = data.reorderThreshold;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return InventoryItem.fromPrisma(item);
  }

  /**
   * Update inventory item quantity
   */
  async updateQuantity(
    id: string,
    quantity: number,
  ): Promise<InventoryItem | null> {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity },
    });

    return InventoryItem.fromPrisma(item);
  }

  /**
   * Soft delete inventory item (deactivate)
   * Note: InventoryItem doesn't have is_active field, so we do nothing
   */
  async softDelete(id: string): Promise<void> {
    // InventoryItem model doesn't have is_active field in the database
    // This is a no-op - implement archiving logic if needed
    await prisma.inventoryItem.update({
      where: { id },
      data: {},
    });
  }

  /**
   * Hard delete inventory item
   */
  async hardDelete(id: string): Promise<void> {
    await prisma.inventoryItem.delete({
      where: { id },
    });
  }

  /**
   * Check if inventory item exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.inventoryItem.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if name exists in restaurant
   */
  async nameExists(
    name: string,
    restaurantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: Record<string, unknown> = {
      name: { contains: name, mode: 'insensitive' },
      restaurant_id: restaurantId,
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await prisma.inventoryItem.count({ where });
    return count > 0;
  }

  /**
   * Get low stock items for restaurant
   */
  async getLowStockItems(restaurantId: string): Promise<InventoryItem[]> {
    const items = await prisma.$queryRaw<
      Array<{
        id: string;
        restaurant_id: string;
        name: string;
        quantity: number;
        unit: string;
        reorder_threshold: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      SELECT * FROM inventory_items
      WHERE restaurant_id = ${restaurantId}
      AND quantity <= reorder_threshold
      AND is_active = true
      ORDER BY quantity / reorder_threshold ASC
    `;

    return items.map((i) => InventoryItem.fromPrisma(i));
  }

  /**
   * Get inventory statistics for restaurant
   */
  async getStats(restaurantId: string): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
    byUnit: Record<string, number>;
  }> {
    const [total, lowStock, outOfStock] = await Promise.all([
      prisma.inventoryItem.count({
        where: { restaurant_id: restaurantId, is_active: true },
      }),
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM inventory_items
        WHERE restaurant_id = ${restaurantId}
        AND quantity <= reorder_threshold
        AND quantity > 0
        AND is_active = true
      `,
      prisma.inventoryItem.count({
        where: { restaurant_id: restaurantId, quantity: 0, is_active: true },
      }),
    ]);

    // Get counts by unit
    const itemsByUnit = await prisma.inventoryItem.groupBy({
      by: ['unit'],
      where: { restaurant_id: restaurantId, is_active: true },
      _count: { unit: true },
    });

    const byUnit: Record<string, number> = {};
    itemsByUnit.forEach((u) => {
      byUnit[u.unit] = u._count.unit;
    });

    return {
      total,
      lowStock: lowStock[0]?.count || 0,
      outOfStock,
      byUnit,
    };
  }

  /**
   * Count inventory items by restaurant
   */
  async countByRestaurant(restaurantId: string): Promise<number> {
    return prisma.inventoryItem.count({
      where: { restaurant_id: restaurantId, is_active: true },
    });
  }
}

export default InventoryRepository;
