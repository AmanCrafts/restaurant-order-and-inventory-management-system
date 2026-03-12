/**
 * Restaurant Controller
 * Handles HTTP requests for restaurant management
 */

import { Request, Response } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import {
  CreateRestaurantRequestDto,
  UpdateRestaurantRequestDto,
} from '../../../models/dto/requests/restaurant.request.dto';
import {
  RestaurantResponseDto,
  RestaurantDetailResponseDto,
} from '../../../models/dto/responses/restaurant.response.dto';
import logger from '../../../shared/utils/logger';

export class RestaurantController {
  private restaurantService: RestaurantService;

  constructor() {
    this.restaurantService = new RestaurantService();
  }

  /**
   * Get all restaurants
   * GET /api/v1/restaurants
   */
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const restaurants = await this.restaurantService.getAll();

    const response = restaurants.map(
      (r) =>
        new RestaurantResponseDto({
          id: r.id,
          name: r.name,
          address: r.address,
          contactNumber: r.contactNumber,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          usersCount: 0,
          menusCount: 0,
          tablesCount: 0,
        })
    );

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Get restaurant by ID
   * GET /api/v1/restaurants/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const details = await this.restaurantService.getDetails(id);

    if (!details) {
      res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
      return;
    }

    const { restaurant, usersCount, tablesCount, menusCount } = details;

    const response = new RestaurantResponseDto({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      contactNumber: restaurant.contactNumber,
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      usersCount,
      tablesCount,
      menusCount,
    });

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Create restaurant
   * POST /api/v1/restaurants
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = new CreateRestaurantRequestDto(req.body);

    if (!dto.validate()) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid restaurant data',
      });
      return;
    }

    const restaurant = await this.restaurantService.create({
      name: dto.name,
      address: dto.address,
      contactNumber: dto.contactNumber,
    });

    const response = new RestaurantResponseDto({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      contactNumber: restaurant.contactNumber,
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      usersCount: 0,
      menusCount: 0,
      tablesCount: 0,
    });

    res.status(201).json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Update restaurant
   * PUT /api/v1/restaurants/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto = new UpdateRestaurantRequestDto(req.body);

    if (!dto.validate()) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid restaurant data',
      });
      return;
    }

    const restaurant = await this.restaurantService.update(id, {
      name: dto.name,
      address: dto.address,
      contactNumber: dto.contactNumber,
      isActive: dto.isActive,
    });

    const response = new RestaurantResponseDto({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      contactNumber: restaurant.contactNumber,
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      usersCount: 0,
      menusCount: 0,
      tablesCount: 0,
    });

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Delete restaurant (deactivate)
   * DELETE /api/v1/restaurants/:id
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    await this.restaurantService.deactivate(id);

    res.json({
      status: 'success',
      message: 'Restaurant deactivated successfully',
    });
  });

  /**
   * Get restaurant statistics
   * GET /api/v1/restaurants/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.restaurantService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  });
}

export default RestaurantController;
