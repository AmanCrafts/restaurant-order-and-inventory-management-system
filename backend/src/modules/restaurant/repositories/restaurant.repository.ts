/**
 * Restaurant Repository
 * Handles database operations for restaurants
 */

import { prisma } from '../../../shared/config/database';
import { Restaurant } from '../../../models/entities/restaurant.entity';

export interface CreateRestaurantData {
  name: string;
  address: string;
  contactNumber: string;
}

export interface UpdateRestaurantData {
  name?: string;
  address?: string;
  contactNumber?: string;
  isActive?: boolean;
}

export class RestaurantRepository {
  /**
   * Find all restaurants
   */
  async findAll(): Promise<Restaurant[]> {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { created_at: 'desc' },
    });

    return restaurants.map((r) => Restaurant.fromPrisma(r));
  }

  /**
   * Find restaurant by ID
   */
  async findById(id: string): Promise<Restaurant | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) return null;

    return Restaurant.fromPrisma(restaurant);
  }

  /**
   * Find restaurant by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<{
    id: string;
    name: string;
    address: string;
    contact_number: string;
    is_active: boolean;
    created_at: Date;
    users: { id: string; name: string; email: string; role: string }[];
    tables: {
      id: string;
      table_number: number;
      capacity: number;
      status: string;
    }[];
    menus: { id: string; is_active: boolean }[];
  } | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        tables: {
          select: {
            id: true,
            table_number: true,
            capacity: true,
            status: true,
          },
        },
        menus: {
          select: { id: true, is_active: true },
        },
      },
    });

    return restaurant;
  }

  /**
   * Create new restaurant
   */
  async create(data: CreateRestaurantData): Promise<Restaurant> {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        contact_number: data.contactNumber,
        is_active: true,
      },
    });

    return Restaurant.fromPrisma(restaurant);
  }

  /**
   * Update restaurant
   */
  async update(
    id: string,
    data: UpdateRestaurantData,
  ): Promise<Restaurant | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.contactNumber !== undefined)
      updateData.contact_number = data.contactNumber;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    return Restaurant.fromPrisma(restaurant);
  }

  /**
   * Soft delete restaurant (deactivate)
   */
  async softDelete(id: string): Promise<void> {
    await prisma.restaurant.update({
      where: { id },
      data: { is_active: false },
    });
  }

  /**
   * Check if restaurant exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.restaurant.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Count active restaurants
   */
  async countActive(): Promise<number> {
    return prisma.restaurant.count({
      where: { is_active: true },
    });
  }
}

export default RestaurantRepository;
