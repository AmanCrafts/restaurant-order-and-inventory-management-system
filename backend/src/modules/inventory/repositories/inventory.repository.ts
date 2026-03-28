import { prisma } from '../../../shared/config/database';
import { toNumber } from '../../../shared/utils/number';

export interface InventoryRecord {
  id: string;
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
}

export interface CreateInventoryItemData {
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
}

export interface UpdateInventoryItemData {
  name?: string;
  unit?: string;
  reorderThreshold?: number;
}

export interface InventoryFilter {
  restaurantId?: string;
  search?: string;
  lowStock?: boolean;
}

function mapInventoryItem(data: {
  id: string;
  restaurant_id: string;
  name: string;
  quantity: number | { toNumber(): number };
  unit: string;
  reorder_threshold: number | { toNumber(): number };
}): InventoryRecord {
  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    name: data.name,
    quantity: toNumber(data.quantity),
    unit: data.unit,
    reorderThreshold: toNumber(data.reorder_threshold),
  };
}

export class InventoryRepository {
  async findAll(filter?: InventoryFilter): Promise<InventoryRecord[]> {
    const where: Record<string, unknown> = {};

    if (filter?.restaurantId) {
      where.restaurant_id = filter.restaurantId;
    }

    if (filter?.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const mappedItems = items.map(mapInventoryItem);

    if (filter?.lowStock) {
      return mappedItems.filter(
        (item) => item.quantity <= item.reorderThreshold,
      );
    }

    return mappedItems;
  }

  async findById(id: string): Promise<InventoryRecord | null> {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    return item ? mapInventoryItem(item) : null;
  }

  async findByIdWithRestaurant(id: string): Promise<{
    item: InventoryRecord;
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

    if (!item || !item.restaurant) {
      return null;
    }

    return {
      item: mapInventoryItem(item),
      restaurant: item.restaurant,
    };
  }

  async findByRestaurantId(restaurantId: string): Promise<InventoryRecord[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { name: 'asc' },
    });

    return items.map(mapInventoryItem);
  }

  async create(data: CreateInventoryItemData): Promise<InventoryRecord> {
    const item = await prisma.inventoryItem.create({
      data: {
        restaurant_id: data.restaurantId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        reorder_threshold: data.reorderThreshold,
      },
    });

    return mapInventoryItem(item);
  }

  async update(
    id: string,
    data: UpdateInventoryItemData,
  ): Promise<InventoryRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.reorderThreshold !== undefined) {
      updateData.reorder_threshold = data.reorderThreshold;
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return mapInventoryItem(item);
  }

  async updateQuantity(
    id: string,
    quantity: number,
  ): Promise<InventoryRecord | null> {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity },
    });

    return mapInventoryItem(item);
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.inventoryItem.delete({
      where: { id },
    });
  }

  async nameExists(
    name: string,
    restaurantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await prisma.inventoryItem.count({
      where: {
        restaurant_id: restaurantId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    return count > 0;
  }

  async getLowStockItems(restaurantId: string): Promise<InventoryRecord[]> {
    const items = await prisma.$queryRaw<
      Array<{
        id: string;
        restaurant_id: string;
        name: string;
        quantity: number;
        unit: string;
        reorder_threshold: number;
      }>
    >`
      SELECT id, restaurant_id, name, quantity, unit, reorder_threshold
      FROM "InventoryItem"
      WHERE restaurant_id = ${restaurantId}
      AND quantity <= reorder_threshold
      ORDER BY quantity ASC
    `;

    return items.map(mapInventoryItem);
  }

  async getStats(restaurantId: string): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
    byUnit: Record<string, number>;
  }> {
    const [total, outOfStock, items, grouped] = await Promise.all([
      prisma.inventoryItem.count({
        where: { restaurant_id: restaurantId },
      }),
      prisma.inventoryItem.count({
        where: { restaurant_id: restaurantId, quantity: 0 },
      }),
      prisma.inventoryItem.findMany({
        where: { restaurant_id: restaurantId },
        select: {
          quantity: true,
          reorder_threshold: true,
        },
      }),
      prisma.inventoryItem.groupBy({
        by: ['unit'],
        where: { restaurant_id: restaurantId },
        _count: { unit: true },
      }),
    ]);

    const lowStock = items.filter(
      (item) => toNumber(item.quantity) <= toNumber(item.reorder_threshold),
    ).length;

    const byUnit: Record<string, number> = {};
    grouped.forEach((group) => {
      byUnit[group.unit] = group._count.unit;
    });

    return {
      total,
      lowStock,
      outOfStock,
      byUnit,
    };
  }
}

export default InventoryRepository;
