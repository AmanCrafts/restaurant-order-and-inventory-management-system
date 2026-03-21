/**
 * Restaurant Service
 * Business logic for restaurant management
 */

import RestaurantRepository, {
  CreateRestaurantData,
  UpdateRestaurantData,
} from '../repositories/restaurant.repository';
import { Restaurant } from '../../../models/entities/restaurant.entity';
import { AppError } from '../../../shared/middleware/error-handler';
import logger from '../../../shared/utils/logger';

export class RestaurantService {
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.restaurantRepository = new RestaurantRepository();
  }

  /**
   * Get all restaurants
   */
  async getAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.findAll();
  }

  /**
   * Get restaurant by ID
   */
  async getById(id: string): Promise<Restaurant | null> {
    const restaurant = await this.restaurantRepository.findById(id);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return restaurant;
  }

  /**
   * Get restaurant details with relations
   */
  async getDetails(id: string): Promise<{
    restaurant: Restaurant;
    usersCount: number;
    tablesCount: number;
    menusCount: number;
  } | null> {
    const data = await this.restaurantRepository.findByIdWithRelations(id);

    if (!data) {
      throw new AppError('Restaurant not found', 404);
    }

    const restaurant = Restaurant.fromPrisma(data);

    return {
      restaurant,
      usersCount: data.users.length,
      tablesCount: data.tables.length,
      menusCount: data.menus.length,
    };
  }

  /**
   * Create new restaurant
   */
  async create(data: CreateRestaurantData): Promise<Restaurant> {
    // Validate phone number format
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(data.contactNumber)) {
      throw new AppError('Invalid contact number format', 400);
    }

    const restaurant = await this.restaurantRepository.create(data);

    logger.info(`Restaurant created: ${restaurant.name} (${restaurant.id})`);

    return restaurant;
  }

  /**
   * Update restaurant
   */
  async update(id: string, data: UpdateRestaurantData): Promise<Restaurant> {
    const existing = await this.restaurantRepository.findById(id);

    if (!existing) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate phone number if provided
    if (data.contactNumber) {
      const phoneRegex =
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(data.contactNumber)) {
        throw new AppError('Invalid contact number format', 400);
      }
    }

    const restaurant = await this.restaurantRepository.update(id, data);

    if (!restaurant) {
      throw new AppError('Failed to update restaurant', 500);
    }

    logger.info(`Restaurant updated: ${restaurant.name} (${restaurant.id})`);

    return restaurant;
  }

  /**
   * Deactivate restaurant
   */
  async deactivate(id: string): Promise<void> {
    const existing = await this.restaurantRepository.findById(id);

    if (!existing) {
      throw new AppError('Restaurant not found', 404);
    }

    await this.restaurantRepository.softDelete(id);

    logger.info(`Restaurant deactivated: ${id}`);
  }

  /**
   * Check if restaurant exists
   */
  async exists(id: string): Promise<boolean> {
    return this.restaurantRepository.exists(id);
  }

  /**
   * Get restaurant statistics
   */
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
