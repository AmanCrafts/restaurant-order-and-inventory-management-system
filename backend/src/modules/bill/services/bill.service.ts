import { prisma } from '../../../shared/config/database';
import BillRepository, { BillRecord } from '../repositories/bill.repository';
import OrderRepository from '../../order/repositories/order.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { BillStatus } from '../../../shared/constants/bill-status';
import { OrderStatus } from '../../../shared/constants/order-status';
import { TableStatus } from '../../../shared/constants/table-status';
import { roundCurrency } from '../../../shared/utils/number';

export class BillService {
  private billRepository: BillRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.billRepository = new BillRepository();
    this.orderRepository = new OrderRepository();
  }

  private ensureWaiterOrAdmin(actor: AuthenticatedUser): void {
    if (![UserRole.ADMIN, UserRole.WAITER].includes(actor.role)) {
      throw new AppError('Only admins and waiters can manage bills', 403);
    }
  }

  private assertBillAccess(actor: AuthenticatedUser, bill: BillRecord): void {
    assertRestaurantAccess(actor, bill.restaurantId);

    if (actor.role === UserRole.WAITER && bill.waiterId !== actor.id) {
      throw new AppError('Waiters can only manage their own bills', 403);
    }
  }

  async list(
    actor: AuthenticatedUser,
    filter: { restaurantId?: string; status?: BillStatus },
  ) {
    this.ensureWaiterOrAdmin(actor);

    const restaurantId = filter.restaurantId || actor.restaurantId;
    assertRestaurantAccess(actor, restaurantId);

    return this.billRepository.findAll({
      restaurantId,
      status: filter.status,
      waiterId: actor.role === UserRole.WAITER ? actor.id : undefined,
    });
  }

  async getById(actor: AuthenticatedUser, id: string) {
    this.ensureWaiterOrAdmin(actor);

    const bill = await this.billRepository.findById(id);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    this.assertBillAccess(actor, bill);
    return bill;
  }

  async getByOrderId(actor: AuthenticatedUser, orderId: string) {
    this.ensureWaiterOrAdmin(actor);

    const bill = await this.billRepository.findByOrderId(orderId);
    if (!bill) {
      throw new AppError('Bill not found for the order', 404);
    }

    this.assertBillAccess(actor, bill);
    return bill;
  }

  async generate(
    actor: AuthenticatedUser,
    orderId: string,
    taxRate = 10,
    serviceChargeRate = 5,
  ): Promise<BillRecord> {
    this.ensureWaiterOrAdmin(actor);

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    assertRestaurantAccess(actor, order.restaurantId);

    if (actor.role === UserRole.WAITER && order.waiterId !== actor.id) {
      throw new AppError('Waiters can only bill their own orders', 403);
    }

    if (order.status !== OrderStatus.SERVED) {
      throw new AppError('Only served orders can be billed', 400);
    }

    const existingBill = await this.billRepository.findByOrderId(orderId);
    if (existingBill) {
      return existingBill;
    }

    const subtotal = roundCurrency(
      order.items.reduce((sum, item) => sum + item.total, 0),
    );
    const tax = roundCurrency(subtotal * (taxRate / 100));
    const serviceCharge = roundCurrency(subtotal * (serviceChargeRate / 100));
    const totalAmount = roundCurrency(subtotal + tax + serviceCharge);

    const bill = await prisma.$transaction(async (tx) => {
      const createdBill = await tx.bill.create({
        data: {
          order_id: orderId,
          subtotal,
          tax,
          service_charge: serviceCharge,
          total_amount: totalAmount,
          status: BillStatus.PENDING,
        },
        include: {
          order: {
            select: {
              restaurant_id: true,
              waiter_id: true,
            },
          },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.BILLED },
      });

      return createdBill;
    });

    return {
      id: bill.id,
      orderId: bill.order_id,
      restaurantId: bill.order.restaurant_id,
      waiterId: bill.order.waiter_id,
      subtotal,
      tax,
      serviceCharge,
      totalAmount,
      status: bill.status as BillStatus,
      createdAt: bill.created_at,
    };
  }

  async pay(actor: AuthenticatedUser, billId: string): Promise<BillRecord> {
    this.ensureWaiterOrAdmin(actor);

    const bill = await this.billRepository.findById(billId);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    this.assertBillAccess(actor, bill);

    if (bill.status === BillStatus.PAID) {
      return bill;
    }

    const order = await this.orderRepository.findByIdRaw(bill.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bill.update({
        where: { id: billId },
        data: { status: BillStatus.PAID },
      });

      await tx.order.update({
        where: { id: bill.orderId },
        data: { status: OrderStatus.CLOSED },
      });

      await tx.table.update({
        where: { id: order.table_id },
        data: { status: TableStatus.FREE },
      });
    });

    return (await this.billRepository.findById(billId)) as BillRecord;
  }

  async getStats(actor: AuthenticatedUser, restaurantId: string) {
    this.ensureWaiterOrAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);
    return this.billRepository.getStats(restaurantId);
  }
}

export default BillService;
