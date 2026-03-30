import { prisma } from '../../../shared/config/database';
import { TableStatus } from '../../../shared/constants/table-status';

export interface TableRecord {
  id: string;
  restaurantId: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
}

export interface CreateTableData {
  restaurantId: string;
  tableNumber: number;
  capacity: number;
  status?: TableStatus;
}

export interface UpdateTableData {
  tableNumber?: number;
  capacity?: number;
  status?: TableStatus;
}

export interface TableFilter {
  restaurantId?: string;
  status?: TableStatus;
}

function mapTable(data: {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  status: string;
}): TableRecord {
  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    tableNumber: data.table_number,
    capacity: data.capacity,
    status: data.status as TableStatus,
  };
}

export class TableRepository {
  async findAll(filter?: TableFilter): Promise<TableRecord[]> {
    const tables = await prisma.table.findMany({
      where: {
        ...(filter?.restaurantId ? { restaurant_id: filter.restaurantId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: { table_number: 'asc' },
    });

    return tables.map(mapTable);
  }

  async findById(id: string): Promise<TableRecord | null> {
    const table = await prisma.table.findUnique({
      where: { id },
    });

    return table ? mapTable(table) : null;
  }

  async create(data: CreateTableData): Promise<TableRecord> {
    const table = await prisma.table.create({
      data: {
        restaurant_id: data.restaurantId,
        table_number: data.tableNumber,
        capacity: data.capacity,
        status: data.status ?? TableStatus.FREE,
      },
    });

    return mapTable(table);
  }

  async update(id: string, data: UpdateTableData): Promise<TableRecord> {
    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(data.tableNumber !== undefined
          ? { table_number: data.tableNumber }
          : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    return mapTable(table);
  }

  async delete(id: string): Promise<void> {
    await prisma.table.delete({
      where: { id },
    });
  }

  async tableNumberExists(
    restaurantId: string,
    tableNumber: number,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await prisma.table.count({
      where: {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    return count > 0;
  }

  async hasActiveOrders(id: string): Promise<boolean> {
    const count = await prisma.order.count({
      where: {
        table_id: id,
        status: {
          not: 'CLOSED',
        },
      },
    });

    return count > 0;
  }

  async getStats(restaurantId: string) {
    const [total, free, occupied, reserved] = await Promise.all([
      prisma.table.count({
        where: { restaurant_id: restaurantId },
      }),
      prisma.table.count({
        where: { restaurant_id: restaurantId, status: TableStatus.FREE },
      }),
      prisma.table.count({
        where: { restaurant_id: restaurantId, status: TableStatus.OCCUPIED },
      }),
      prisma.table.count({
        where: { restaurant_id: restaurantId, status: TableStatus.RESERVED },
      }),
    ]);

    return {
      total,
      free,
      occupied,
      reserved,
    };
  }
}

export default TableRepository;
