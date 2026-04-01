import { prisma } from '../../../shared/config/database';
import { BillStatus } from '../../../shared/constants/bill-status';
import { toNumber } from '../../../shared/utils/number';

export interface BillRecord {
  id: string;
  orderId: string;
  restaurantId: string;
  waiterId: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  totalAmount: number;
  status: BillStatus;
  createdAt: Date;
}

function mapBill(data: {
  id: string;
  order_id: string;
  subtotal: number | { toNumber(): number };
  tax: number | { toNumber(): number };
  service_charge: number | { toNumber(): number };
  total_amount: number | { toNumber(): number };
  status: string;
  created_at: Date;
  order?: {
    restaurant_id: string;
    waiter_id: string;
  };
}): BillRecord {
  return {
    id: data.id,
    orderId: data.order_id,
    restaurantId: data.order?.restaurant_id ?? '',
    waiterId: data.order?.waiter_id ?? '',
    subtotal: toNumber(data.subtotal),
    tax: toNumber(data.tax),
    serviceCharge: toNumber(data.service_charge),
    totalAmount: toNumber(data.total_amount),
    status: data.status as BillStatus,
    createdAt: data.created_at,
  };
}

export class BillRepository {
  async findAll(filter: {
    restaurantId: string;
    status?: BillStatus;
    waiterId?: string;
  }): Promise<BillRecord[]> {
    const bills = await prisma.bill.findMany({
      where: {
        order: {
          restaurant_id: filter.restaurantId,
          ...(filter.waiterId ? { waiter_id: filter.waiterId } : {}),
        },
        ...(filter.status ? { status: filter.status } : {}),
      },
      include: {
        order: {
          select: {
            restaurant_id: true,
            waiter_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return bills.map(mapBill);
  }

  async findById(id: string): Promise<BillRecord | null> {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            restaurant_id: true,
            waiter_id: true,
          },
        },
      },
    });

    return bill ? mapBill(bill) : null;
  }

  async findByOrderId(orderId: string): Promise<BillRecord | null> {
    const bill = await prisma.bill.findUnique({
      where: { order_id: orderId },
      include: {
        order: {
          select: {
            restaurant_id: true,
            waiter_id: true,
          },
        },
      },
    });

    return bill ? mapBill(bill) : null;
  }

  async create(data: {
    orderId: string;
    subtotal: number;
    tax: number;
    serviceCharge: number;
    totalAmount: number;
  }): Promise<BillRecord> {
    const bill = await prisma.bill.create({
      data: {
        order_id: data.orderId,
        subtotal: data.subtotal,
        tax: data.tax,
        service_charge: data.serviceCharge,
        total_amount: data.totalAmount,
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

    return mapBill(bill);
  }

  async updateStatus(id: string, status: BillStatus): Promise<void> {
    await prisma.bill.update({
      where: { id },
      data: { status },
    });
  }

  async getStats(restaurantId: string) {
    const [total, pending, paid, bills] = await Promise.all([
      prisma.bill.count({
        where: {
          order: {
            restaurant_id: restaurantId,
          },
        },
      }),
      prisma.bill.count({
        where: {
          order: {
            restaurant_id: restaurantId,
          },
          status: BillStatus.PENDING,
        },
      }),
      prisma.bill.count({
        where: {
          order: {
            restaurant_id: restaurantId,
          },
          status: BillStatus.PAID,
        },
      }),
      prisma.bill.findMany({
        where: {
          order: {
            restaurant_id: restaurantId,
          },
          status: BillStatus.PAID,
        },
        select: {
          total_amount: true,
        },
      }),
    ]);

    const revenue = bills.reduce(
      (sum, bill) => sum + toNumber(bill.total_amount),
      0,
    );

    return {
      total,
      pending,
      paid,
      revenue,
    };
  }
}

export default BillRepository;
