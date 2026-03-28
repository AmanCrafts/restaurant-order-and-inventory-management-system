import RestaurantRepository, {
  CreateRestaurantData,
  RestaurantDetails,
  RestaurantRecord,
  UpdateRestaurantData,
} from '../repositories/restaurant.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import logger from '../../../shared/utils/logger';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';

export class RestaurantService {
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.restaurantRepository = new RestaurantRepository();
  }

  async getAll(): Promise<RestaurantRecord[]> {
    return this.restaurantRepository.findAll();
  }

  async getById(id: string): Promise<RestaurantRecord> {
    const restaurant = await this.restaurantRepository.findById(id);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return restaurant;
  }

  async getDetails(id: string): Promise<RestaurantDetails> {
    const data = await this.restaurantRepository.findByIdWithRelations(id);

    if (!data) {
      throw new AppError('Restaurant not found', 404);
    }

    return data;
  }

  async create(data: CreateRestaurantData): Promise<RestaurantRecord> {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(data.contactNumber)) {
      throw new AppError('Invalid contact number format', 400);
    }

    const restaurant = await this.restaurantRepository.create({
      ...data,
      name: data.name.trim(),
      address: data.address.trim(),
      contactNumber: data.contactNumber.trim(),
    });

    logger.info(`Restaurant created: ${restaurant.name} (${restaurant.id})`);

    return restaurant;
  }

  async update(
    id: string,
    data: UpdateRestaurantData,
    actor: AuthenticatedUser,
  ): Promise<RestaurantRecord> {
    const existing = await this.restaurantRepository.findById(id);

    if (!existing) {
      throw new AppError('Restaurant not found', 404);
    }

    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can update restaurant details', 403);
    }

    assertRestaurantAccess(actor, id);

    if (data.contactNumber) {
      const phoneRegex =
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(data.contactNumber)) {
        throw new AppError('Invalid contact number format', 400);
      }
    }

    const restaurant = await this.restaurantRepository.update(id, {
      name: data.name?.trim(),
      address: data.address?.trim(),
      contactNumber: data.contactNumber?.trim(),
    });

    if (!restaurant) {
      throw new AppError('Failed to update restaurant', 500);
    }

    logger.info(`Restaurant updated: ${restaurant.name} (${restaurant.id})`);

    return restaurant;
  }

  async deactivate(id: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.restaurantRepository.findById(id);

    if (!existing) {
      throw new AppError('Restaurant not found', 404);
    }

    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can deactivate restaurants', 403);
    }

    assertRestaurantAccess(actor, id);

    await this.restaurantRepository.softDelete(id);

    logger.info(`Restaurant deactivated: ${id}`);
  }

  async exists(id: string): Promise<boolean> {
    return this.restaurantRepository.exists(id);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
  }> {
    const all = await this.restaurantRepository.findAll();
    const active = await this.restaurantRepository.countActive();

    return {
      total: all.length,
      active,
    };
  }
}

export default RestaurantService;
