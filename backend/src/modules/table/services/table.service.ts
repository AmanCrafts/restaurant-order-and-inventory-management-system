import TableRepository, {
  TableFilter,
  TableRecord,
} from '../repositories/table.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { TableStatus } from '../../../shared/constants/table-status';

export class TableService {
  private tableRepository: TableRepository;
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.tableRepository = new TableRepository();
    this.restaurantRepository = new RestaurantRepository();
  }

  private ensureAdmin(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can manage tables', 403);
    }
  }

  async getAll(
    actor: AuthenticatedUser,
    filter?: TableFilter,
  ): Promise<TableRecord[]> {
    const restaurantId = filter?.restaurantId || actor.restaurantId;
    assertRestaurantAccess(actor, restaurantId);

    return this.tableRepository.findAll({
      restaurantId,
      status: filter?.status,
    });
  }

  async getById(id: string, actor: AuthenticatedUser): Promise<TableRecord> {
    const table = await this.tableRepository.findById(id);
    if (!table) {
      throw new AppError('Table not found', 404);
    }

    assertRestaurantAccess(actor, table.restaurantId);

    return table;
  }

  async create(
    actor: AuthenticatedUser,
    input: {
      restaurantId: string;
      tableNumber: number;
      capacity: number;
      status?: TableStatus;
    },
  ): Promise<TableRecord> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, input.restaurantId);

    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (input.tableNumber <= 0) {
      throw new AppError('Table number must be positive', 400);
    }

    if (input.capacity <= 0) {
      throw new AppError('Capacity must be at least 1', 400);
    }

    if (
      await this.tableRepository.tableNumberExists(
        input.restaurantId,
        input.tableNumber,
      )
    ) {
      throw new AppError('Table number already exists in this restaurant', 409);
    }

    return this.tableRepository.create(input);
  }

  async update(
    id: string,
    actor: AuthenticatedUser,
    input: {
      tableNumber?: number;
      capacity?: number;
      status?: TableStatus;
    },
  ): Promise<TableRecord> {
    this.ensureAdmin(actor);

    const existing = await this.tableRepository.findById(id);
    if (!existing) {
      throw new AppError('Table not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (input.tableNumber !== undefined) {
      if (input.tableNumber <= 0) {
        throw new AppError('Table number must be positive', 400);
      }

      if (
        await this.tableRepository.tableNumberExists(
          existing.restaurantId,
          input.tableNumber,
          id,
        )
      ) {
        throw new AppError(
          'Table number already exists in this restaurant',
          409,
        );
      }
    }

    if (input.capacity !== undefined && input.capacity <= 0) {
      throw new AppError('Capacity must be at least 1', 400);
    }

    return this.tableRepository.update(id, input);
  }

  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(actor);

    const existing = await this.tableRepository.findById(id);
    if (!existing) {
      throw new AppError('Table not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (await this.tableRepository.hasActiveOrders(id)) {
      throw new AppError('Cannot delete a table with active orders', 400);
    }

    await this.tableRepository.delete(id);
  }

  async getStats(restaurantId: string, actor: AuthenticatedUser) {
    assertRestaurantAccess(actor, restaurantId);
    return this.tableRepository.getStats(restaurantId);
  }
}

export default TableService;
