import InventoryRepository, {
  InventoryFilter,
  InventoryRecord,
} from '../repositories/inventory.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import logger from '../../../shared/utils/logger';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import NotificationService from '../../notification/services/notification.service';

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
}

export interface UpdateStockInput {
  amount: number;
  operation: 'ADD' | 'SET' | 'DEDUCT';
  reason?: string;
}

export interface InventorySearchInput {
  restaurantId?: string;
  search?: string;
  lowStock?: boolean;
}

export class InventoryService {
  private inventoryRepository: InventoryRepository;
  private restaurantRepository: RestaurantRepository;
  private notificationService: NotificationService;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
    this.restaurantRepository = new RestaurantRepository();
    this.notificationService = new NotificationService();
  }

  private ensureAdmin(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can manage inventory', 403);
    }
  }

  getStockStatus(
    item: Pick<InventoryRecord, 'quantity' | 'reorderThreshold'>,
  ): 'adequate' | 'low' | 'out_of_stock' {
    if (item.quantity === 0) {
      return 'out_of_stock';
    }

    if (item.quantity <= item.reorderThreshold) {
      return 'low';
    }

    return 'adequate';
  }

  getReorderAmount(
    item: Pick<InventoryRecord, 'quantity' | 'reorderThreshold'>,
  ): number {
    return Math.max(item.reorderThreshold - item.quantity, 0);
  }

  isLowStock(
    item: Pick<InventoryRecord, 'quantity' | 'reorderThreshold'>,
  ): boolean {
    return item.quantity <= item.reorderThreshold;
  }

  formatItem(item: InventoryRecord) {
    return {
      ...item,
      stockStatus: this.getStockStatus(item),
      isLowStock: this.isLowStock(item),
      reorderAmount: this.getReorderAmount(item),
    };
  }

  async getAll(
    actor: AuthenticatedUser,
    filter?: InventorySearchInput,
  ): Promise<ReturnType<InventoryService['formatItem']>[]> {
    this.ensureAdmin(actor);

    const restaurantId = filter?.restaurantId || actor.restaurantId;
    assertRestaurantAccess(actor, restaurantId);

    const repoFilter: InventoryFilter = {
      restaurantId,
      search: filter?.search,
      lowStock: filter?.lowStock,
    };

    const items = await this.inventoryRepository.findAll(repoFilter);
    return items.map((item) => this.formatItem(item));
  }

  async getByIdWithRestaurant(id: string, actor: AuthenticatedUser) {
    this.ensureAdmin(actor);

    const result = await this.inventoryRepository.findByIdWithRestaurant(id);
    if (!result) {
      throw new AppError('Inventory item not found', 404);
    }

    assertRestaurantAccess(actor, result.item.restaurantId);

    return {
      ...result,
      item: this.formatItem(result.item),
    };
  }

  async getByRestaurantId(
    restaurantId: string,
    actor: AuthenticatedUser,
  ): Promise<ReturnType<InventoryService['formatItem']>[]> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const items =
      await this.inventoryRepository.findByRestaurantId(restaurantId);
    return items.map((item) => this.formatItem(item));
  }

  async create(
    data: CreateInventoryItemInput,
    actor: AuthenticatedUser,
  ): Promise<ReturnType<InventoryService['formatItem']>> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, data.restaurantId);

    const restaurant = await this.restaurantRepository.findById(
      data.restaurantId,
    );
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    if (data.quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400);
    }

    if (!data.unit || data.unit.trim().length === 0) {
      throw new AppError('Unit is required', 400);
    }

    if (data.reorderThreshold < 0) {
      throw new AppError('Reorder threshold cannot be negative', 400);
    }

    if (
      await this.inventoryRepository.nameExists(data.name, data.restaurantId)
    ) {
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
      reorderThreshold: data.reorderThreshold,
    });

    logger.info(
      `Inventory item created: ${item.name} (${item.id}) by admin ${actor.id}`,
    );

    return this.formatItem(item);
  }

  async update(
    id: string,
    data: UpdateInventoryItemInput,
    actor: AuthenticatedUser,
  ): Promise<ReturnType<InventoryService['formatItem']>> {
    this.ensureAdmin(actor);

    const existing = await this.inventoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (data.name !== undefined) {
      if (data.name.trim().length < 2) {
        throw new AppError('Name must be at least 2 characters', 400);
      }

      if (
        await this.inventoryRepository.nameExists(
          data.name,
          existing.restaurantId,
          id,
        )
      ) {
        throw new AppError(
          `Inventory item with name "${data.name}" already exists`,
          409,
        );
      }
    }

    if (data.unit !== undefined && data.unit.trim().length === 0) {
      throw new AppError('Unit cannot be empty', 400);
    }

    if (data.reorderThreshold !== undefined && data.reorderThreshold < 0) {
      throw new AppError('Reorder threshold cannot be negative', 400);
    }

    const item = await this.inventoryRepository.update(id, {
      name: data.name?.trim(),
      unit: data.unit?.trim().toLowerCase(),
      reorderThreshold: data.reorderThreshold,
    });

    if (!item) {
      throw new AppError('Failed to update inventory item', 500);
    }

    logger.info(
      `Inventory item updated: ${item.name} (${item.id}) by admin ${actor.id}`,
    );

    return this.formatItem(item);
  }

  async updateStock(
    id: string,
    data: UpdateStockInput,
    actor: AuthenticatedUser,
  ): Promise<ReturnType<InventoryService['formatItem']>> {
    this.ensureAdmin(actor);

    const existing = await this.inventoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (data.amount < 0) {
      throw new AppError('Amount cannot be negative', 400);
    }

    let newQuantity: number;

    switch (data.operation) {
      case 'ADD':
        newQuantity = existing.quantity + data.amount;
        break;
      case 'DEDUCT':
        if (existing.quantity < data.amount) {
          throw new AppError('Insufficient stock for deduction', 400);
        }
        newQuantity = existing.quantity - data.amount;
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
      `Inventory stock ${data.operation.toLowerCase()} for ${item.name} by admin ${actor.id}`,
    );

    if (item.quantity <= item.reorderThreshold) {
      await this.notificationService.notifyRole(
        item.restaurantId,
        UserRole.ADMIN,
        `Low stock alert: ${item.name} is at ${item.quantity} ${item.unit}.`,
      );
    }

    return this.formatItem(item);
  }

  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(actor);

    const existing = await this.inventoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    await this.inventoryRepository.hardDelete(id);

    logger.info(
      `Inventory item deleted: ${existing.name} (${id}) by admin ${actor.id}`,
    );
  }

  async getLowStockItems(
    restaurantId: string,
    actor: AuthenticatedUser,
  ): Promise<ReturnType<InventoryService['formatItem']>[]> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const items = await this.inventoryRepository.getLowStockItems(restaurantId);
    return items.map((item) => this.formatItem(item));
  }

  async getStats(restaurantId: string, actor: AuthenticatedUser) {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.inventoryRepository.getStats(restaurantId);
  }

  async search(params: {
    restaurantId: string;
    query?: string;
    lowStock?: boolean;
    actor: AuthenticatedUser;
  }): Promise<ReturnType<InventoryService['formatItem']>[]> {
    this.ensureAdmin(params.actor);
    assertRestaurantAccess(params.actor, params.restaurantId);

    const items = await this.inventoryRepository.findAll({
      restaurantId: params.restaurantId,
      search: params.query,
      lowStock: params.lowStock,
    });

    return items.map((item) => this.formatItem(item));
  }
}

export default InventoryService;
