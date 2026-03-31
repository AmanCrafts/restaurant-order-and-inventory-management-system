import { prisma } from '../../../shared/config/database';
import OrderRepository, {
  OrderFilter,
  OrderRecord,
} from '../repositories/order.repository';
import TableRepository from '../../table/repositories/table.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import {
  OrderStatus,
  canTransitionOrderStatus,
} from '../../../shared/constants/order-status';
import { TableStatus } from '../../../shared/constants/table-status';
import NotificationService from '../../notification/services/notification.service';
import logger from '../../../shared/utils/logger';
import { toNumber } from '../../../shared/utils/number';

export class OrderService {
  private orderRepository: OrderRepository;
  private tableRepository: TableRepository;
  private restaurantRepository: RestaurantRepository;
  private notificationService: NotificationService;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.tableRepository = new TableRepository();
    this.restaurantRepository = new RestaurantRepository();
    this.notificationService = new NotificationService();
  }

  private ensureWaiterOrAdmin(actor: AuthenticatedUser): void {
    if (![UserRole.ADMIN, UserRole.WAITER].includes(actor.role)) {
      throw new AppError('Only admins and waiters can manage orders', 403);
    }
  }

  private ensureKitchenOrAdmin(actor: AuthenticatedUser): void {
    if (![UserRole.ADMIN, UserRole.COOK].includes(actor.role)) {
      throw new AppError(
        'Only admins and cooks can access kitchen actions',
        403,
      );
    }
  }

  private assertOrderAccess(
    actor: AuthenticatedUser,
    order: OrderRecord,
  ): void {
    assertRestaurantAccess(actor, order.restaurantId);

    if (actor.role === UserRole.WAITER && order.waiterId !== actor.id) {
      throw new AppError('Waiters can only manage their own orders', 403);
    }
  }

  async list(
    actor: AuthenticatedUser,
    filter?: OrderFilter,
  ): Promise<OrderRecord[]> {
    const restaurantId = filter?.restaurantId || actor.restaurantId;
    assertRestaurantAccess(actor, restaurantId);

    const effectiveFilter: OrderFilter = {
      restaurantId,
      status: filter?.status,
      tableId: filter?.tableId,
      waiterId: actor.role === UserRole.WAITER ? actor.id : filter?.waiterId,
    };

    return this.orderRepository.findAll(effectiveFilter);
  }

  async getById(actor: AuthenticatedUser, id: string): Promise<OrderRecord> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    this.assertOrderAccess(actor, order);

    return order;
  }

  async create(
    actor: AuthenticatedUser,
    input: {
      restaurantId: string;
      tableId: string;
      items?: Array<{ menuItemId: string; quantity: number }>;
    },
  ): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);
    assertRestaurantAccess(actor, input.restaurantId);

    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const table = await this.tableRepository.findById(input.tableId);
    if (!table || table.restaurantId !== input.restaurantId) {
      throw new AppError('Table not found for the restaurant', 404);
    }

    const activeOrder = await this.orderRepository.findActiveByTable(
      input.tableId,
    );
    if (activeOrder) {
      throw new AppError('This table already has an active order', 409);
    }

    const orderId = await prisma.$transaction(async (tx) => {
      await tx.table.update({
        where: { id: input.tableId },
        data: { status: TableStatus.OCCUPIED },
      });

      const createdOrder = await tx.order.create({
        data: {
          restaurant_id: input.restaurantId,
          table_id: input.tableId,
          waiter_id: actor.id,
          status: OrderStatus.CREATED,
        },
      });

      return createdOrder.id;
    });

    if (input.items?.length) {
      for (const item of input.items) {
        await this.addItem(actor, orderId, item);
      }
    }

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async addItem(
    actor: AuthenticatedUser,
    orderId: string,
    input: { menuItemId: string; quantity: number },
  ): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (order.status !== OrderStatus.CREATED) {
      throw new AppError(
        'Items can only be modified before kitchen dispatch',
        400,
      );
    }

    if (input.quantity <= 0) {
      throw new AppError('Quantity must be positive', 400);
    }

    const menuItem = await this.orderRepository.findMenuItemForRestaurant(
      input.menuItemId,
      order.restaurantId,
    );

    if (!menuItem) {
      throw new AppError('Menu item not found for the restaurant', 404);
    }

    if (!menuItem.is_available) {
      throw new AppError('Menu item is currently unavailable', 400);
    }

    for (const ingredient of menuItem.ingredients) {
      const required = toNumber(ingredient.quantity_required) * input.quantity;
      const available = toNumber(ingredient.inventoryItem.quantity);

      if (available < required) {
        throw new AppError(
          `Insufficient stock for ${ingredient.inventoryItem.name}`,
          400,
        );
      }
    }

    const existingItem = await this.orderRepository.findOrderItemByOrderAndMenu(
      orderId,
      input.menuItemId,
    );

    if (existingItem) {
      await this.orderRepository.updateOrderItem(existingItem.id, {
        quantity: existingItem.quantity + input.quantity,
        price: toNumber(existingItem.price),
      });
    } else {
      await this.orderRepository.addOrderItem({
        orderId,
        menuItemId: input.menuItemId,
        quantity: input.quantity,
        price: toNumber(menuItem.price),
      });
    }

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async updateItem(
    actor: AuthenticatedUser,
    orderId: string,
    itemId: string,
    quantity: number,
  ): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (order.status !== OrderStatus.CREATED) {
      throw new AppError(
        'Items can only be modified before kitchen dispatch',
        400,
      );
    }

    const existingItem = await this.orderRepository.findOrderItem(itemId);
    if (!existingItem || existingItem.order_id !== orderId) {
      throw new AppError('Order item not found', 404);
    }

    if (quantity <= 0) {
      await this.orderRepository.deleteOrderItem(itemId);
    } else {
      const menuItem = await this.orderRepository.findMenuItemForRestaurant(
        existingItem.menu_item_id,
        order.restaurantId,
      );

      if (!menuItem) {
        throw new AppError('Menu item not found for the restaurant', 404);
      }

      for (const ingredient of menuItem.ingredients) {
        const required = toNumber(ingredient.quantity_required) * quantity;
        const available = toNumber(ingredient.inventoryItem.quantity);

        if (available < required) {
          throw new AppError(
            `Insufficient stock for ${ingredient.inventoryItem.name}`,
            400,
          );
        }
      }

      await this.orderRepository.updateOrderItem(itemId, { quantity });
    }

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async removeItem(
    actor: AuthenticatedUser,
    orderId: string,
    itemId: string,
  ): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (order.status !== OrderStatus.CREATED) {
      throw new AppError(
        'Items can only be modified before kitchen dispatch',
        400,
      );
    }

    const existingItem = await this.orderRepository.findOrderItem(itemId);
    if (!existingItem || existingItem.order_id !== orderId) {
      throw new AppError('Order item not found', 404);
    }

    await this.orderRepository.deleteOrderItem(itemId);

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async sendToKitchen(
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (order.status !== OrderStatus.CREATED) {
      throw new AppError('Order has already been sent to the kitchen', 400);
    }

    if (order.items.length === 0) {
      throw new AppError(
        'Add items before sending the order to the kitchen',
        400,
      );
    }

    const orderForProcessing = await this.orderRepository.findByIdRaw(orderId);
    if (!orderForProcessing) {
      throw new AppError('Order not found', 404);
    }

    const deductions = new Map<string, { name: string; amount: number }>();

    for (const item of orderForProcessing.orderItems) {
      for (const ingredient of item.menuItem.ingredients) {
        const inventoryId = ingredient.inventory_item_id;
        const amount = toNumber(ingredient.quantity_required) * item.quantity;
        const current = deductions.get(inventoryId);

        deductions.set(inventoryId, {
          name: ingredient.inventoryItem.name,
          amount: (current?.amount ?? 0) + amount,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const [inventoryId, deduction] of deductions.entries()) {
        const inventoryItem = await tx.inventoryItem.findUniqueOrThrow({
          where: { id: inventoryId },
        });

        const currentQuantity = toNumber(inventoryItem.quantity);
        if (currentQuantity < deduction.amount) {
          throw new AppError(`Insufficient stock for ${deduction.name}`, 400);
        }

        await tx.inventoryItem.update({
          where: { id: inventoryId },
          data: {
            quantity: currentQuantity - deduction.amount,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SENT_TO_KITCHEN,
        },
      });
    });

    await this.notificationService.notifyRole(
      order.restaurantId,
      UserRole.COOK,
      `New order for Table ${order.tableNumber} is ready for preparation.`,
    );

    const updatedInventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: {
          in: Array.from(deductions.keys()),
        },
      },
    });

    for (const inventoryItem of updatedInventoryItems) {
      const quantity = toNumber(inventoryItem.quantity);
      const reorderThreshold = toNumber(inventoryItem.reorder_threshold);

      if (quantity <= reorderThreshold) {
        await this.notificationService.notifyRole(
          order.restaurantId,
          UserRole.ADMIN,
          `Low stock alert: ${inventoryItem.name} is at ${quantity} ${inventoryItem.unit}.`,
        );
      }
    }

    logger.info(`Order ${orderId} sent to kitchen by ${actor.id}`);

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async startCooking(
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderRecord> {
    this.ensureKitchenOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (!canTransitionOrderStatus(order.status, OrderStatus.COOKING)) {
      throw new AppError(
        'Order cannot move to COOKING from current state',
        400,
      );
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.COOKING);
    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async markReady(
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderRecord> {
    this.ensureKitchenOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (!canTransitionOrderStatus(order.status, OrderStatus.READY)) {
      throw new AppError('Order cannot move to READY from current state', 400);
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.READY);

    await this.notificationService.notifyUsers(
      [order.waiterId],
      `Order for Table ${order.tableNumber} is ready to serve.`,
    );

    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }

  async serve(actor: AuthenticatedUser, orderId: string): Promise<OrderRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.getById(actor, orderId);
    if (!canTransitionOrderStatus(order.status, OrderStatus.SERVED)) {
      throw new AppError('Order cannot move to SERVED from current state', 400);
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.SERVED);
    return (await this.orderRepository.findById(orderId)) as OrderRecord;
  }
}

export default OrderService;
