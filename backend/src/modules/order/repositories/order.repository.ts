import { prisma } from '../../../shared/config/database';
import { OrderStatus } from '../../../shared/constants/order-status';
import { TableStatus } from '../../../shared/constants/table-status';
import { BillStatus } from '../../../shared/constants/bill-status';
import { toNumber } from '../../../shared/utils/number';

export interface OrderItemRecord {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  status: OrderStatus;
  createdAt: Date;
  items: OrderItemRecord[];
  bill: {
    id: string;
    subtotal: number;
    tax: number;
    serviceCharge: number;
    totalAmount: number;
    status: BillStatus;
  } | null;
}

export interface OrderFilter {
  restaurantId?: string;
  status?: OrderStatus;
  waiterId?: string;
  tableId?: string;
}

function mapOrderItem(data: {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number | { toNumber(): number };
  menuItem?: { name: string };
}): OrderItemRecord {
  const price = toNumber(data.price);

  return {
    id: data.id,
    menuItemId: data.menu_item_id,
    menuItemName: data.menuItem?.name ?? '',
    quantity: data.quantity,
    price,
    total: price * data.quantity,
  };
}

function mapOrder(data: {
  id: string;
  restaurant_id: string;
  table_id: string;
  waiter_id: string;
  status: string;
  created_at: Date;
  table?: { table_number: number };
  waiter?: { name: string };
  orderItems?: Array<{
    id: string;
    menu_item_id: string;
    quantity: number;
    price: number | { toNumber(): number };
    menuItem?: { name: string };
  }>;
  bill?: {
    id: string;
    subtotal: number | { toNumber(): number };
    tax: number | { toNumber(): number };
    service_charge: number | { toNumber(): number };
    total_amount: number | { toNumber(): number };
    status: string;
  } | null;
}): OrderRecord {
  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    tableId: data.table_id,
    tableNumber: data.table?.table_number ?? 0,
    waiterId: data.waiter_id,
    waiterName: data.waiter?.name ?? '',
    status: data.status as OrderStatus,
    createdAt: data.created_at,
    items: (data.orderItems ?? []).map(mapOrderItem),
    bill: data.bill
      ? {
          id: data.bill.id,
          subtotal: toNumber(data.bill.subtotal),
          tax: toNumber(data.bill.tax),
          serviceCharge: toNumber(data.bill.service_charge),
          totalAmount: toNumber(data.bill.total_amount),
          status: data.bill.status as BillStatus,
        }
      : null,
  };
}

export class OrderRepository {
  async findAll(filter?: OrderFilter): Promise<OrderRecord[]> {
    const orders = await prisma.order.findMany({
      where: {
        ...(filter?.restaurantId ? { restaurant_id: filter.restaurantId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.waiterId ? { waiter_id: filter.waiterId } : {}),
        ...(filter?.tableId ? { table_id: filter.tableId } : {}),
      },
      include: {
        table: {
          select: {
            table_number: true,
          },
        },
        waiter: {
          select: {
            name: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        bill: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return orders.map(mapOrder);
  }

  async findById(id: string): Promise<OrderRecord | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: {
          select: {
            table_number: true,
          },
        },
        waiter: {
          select: {
            name: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        bill: true,
      },
    });

    return order ? mapOrder(order) : null;
  }

  async findByIdRaw(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: true,
        orderItems: {
          include: {
            menuItem: {
              include: {
                ingredients: {
                  include: {
                    inventoryItem: true,
                  },
                },
              },
            },
          },
        },
        bill: true,
      },
    });
  }

  async create(input: {
    restaurantId: string;
    tableId: string;
    waiterId: string;
  }): Promise<OrderRecord> {
    const order = await prisma.order.create({
      data: {
        restaurant_id: input.restaurantId,
        table_id: input.tableId,
        waiter_id: input.waiterId,
        status: OrderStatus.CREATED,
      },
      include: {
        table: {
          select: {
            table_number: true,
          },
        },
        waiter: {
          select: {
            name: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        bill: true,
      },
    });

    return mapOrder(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async updateTableStatus(tableId: string, status: TableStatus): Promise<void> {
    await prisma.table.update({
      where: { id: tableId },
      data: { status },
    });
  }

  async findActiveByTable(tableId: string) {
    return prisma.order.findFirst({
      where: {
        table_id: tableId,
        status: {
          not: OrderStatus.CLOSED,
        },
      },
    });
  }

  async findOrderItemByOrderAndMenu(orderId: string, menuItemId: string) {
    return prisma.orderItem.findFirst({
      where: {
        order_id: orderId,
        menu_item_id: menuItemId,
      },
    });
  }

  async findOrderItem(id: string) {
    return prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
  }

  async addOrderItem(input: {
    orderId: string;
    menuItemId: string;
    quantity: number;
    price: number;
  }): Promise<void> {
    await prisma.orderItem.create({
      data: {
        order_id: input.orderId,
        menu_item_id: input.menuItemId,
        quantity: input.quantity,
        price: input.price,
      },
    });
  }

  async updateOrderItem(
    id: string,
    input: { quantity: number; price?: number },
  ): Promise<void> {
    await prisma.orderItem.update({
      where: { id },
      data: {
        quantity: input.quantity,
        ...(input.price !== undefined ? { price: input.price } : {}),
      },
    });
  }

  async deleteOrderItem(id: string): Promise<void> {
    await prisma.orderItem.delete({
      where: { id },
    });
  }

  async findMenuItemForRestaurant(menuItemId: string, restaurantId: string) {
    return prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        category: {
          menu: {
            restaurant_id: restaurantId,
            is_active: true,
          },
        },
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }
}

export default OrderRepository;
