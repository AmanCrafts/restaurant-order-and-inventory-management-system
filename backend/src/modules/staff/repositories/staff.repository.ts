/**
 * Staff Repository
 * Handles database operations for staff management
 */

import { prisma } from '../../../shared/config/database';
import { User } from '../../../models/entities/user.entity';
import { UserRole } from '../../../shared/constants/roles';

export interface CreateStaffData {
  restaurantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateStaffData {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface StaffFilter {
  restaurantId?: string;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export class StaffRepository {
  /**
   * Find all staff members with optional filtering
   */
  async findAll(filter?: StaffFilter): Promise<User[]> {
    const where: Record<string, unknown> = {};

    if (filter?.restaurantId) {
      where.restaurant_id = filter.restaurantId;
    }

    if (filter?.role) {
      where.role = filter.role;
    }

    if (filter?.isActive !== undefined) {
      where.is_active = filter.isActive;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return users.map((u) => User.fromPrisma(u));
  }

  /**
   * Find staff member by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return User.fromPrisma(user);
  }

  /**
   * Find staff member by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    return User.fromPrisma(user);
  }

  /**
   * Find staff member by ID with restaurant details
   */
  async findByIdWithRestaurant(id: string): Promise<{
    user: User;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  } | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!user || !user.restaurant) return null;

    return {
      user: User.fromPrisma(user),
      restaurant: {
        id: user.restaurant.id,
        name: user.restaurant.name,
        address: user.restaurant.address,
      },
    };
  }

  /**
   * Find all staff members by restaurant ID
   */
  async findByRestaurantId(restaurantId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { created_at: 'desc' },
    });

    return users.map((u) => User.fromPrisma(u));
  }

  /**
   * Create new staff member
   */
  async create(data: CreateStaffData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        restaurant_id: data.restaurantId,
        name: data.name,
        email: data.email.toLowerCase(),
        password_hash: data.passwordHash,
        role: data.role,
        is_active: data.isActive ?? true,
      },
    });

    return User.fromPrisma(user);
  }

  /**
   * Update staff member
   */
  async update(id: string, data: UpdateStaffData): Promise<User | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return User.fromPrisma(user);
  }

  /**
   * Update staff member's password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });
  }

  /**
   * Soft delete staff member (deactivate)
   */
  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });
  }

  /**
   * Hard delete staff member
   */
  async hardDelete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Check if staff member exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = {
      email: email.toLowerCase(),
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await prisma.user.count({ where });
    return count > 0;
  }

  /**
   * Count staff by restaurant
   */
  async countByRestaurant(restaurantId: string): Promise<number> {
    return prisma.user.count({
      where: { restaurant_id: restaurantId },
    });
  }

  /**
   * Count staff by role
   */
  async countByRole(restaurantId: string, role: UserRole): Promise<number> {
    return prisma.user.count({
      where: {
        restaurant_id: restaurantId,
        role,
      },
    });
  }

  /**
   * Get staff statistics for restaurant
   */
  async getStats(restaurantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, inactive, adminCount, waiterCount, cookCount] =
      await Promise.all([
        prisma.user.count({ where: { restaurant_id: restaurantId } }),
        prisma.user.count({
          where: { restaurant_id: restaurantId, is_active: true },
        }),
        prisma.user.count({
          where: { restaurant_id: restaurantId, is_active: false },
        }),
        prisma.user.count({
          where: { restaurant_id: restaurantId, role: UserRole.ADMIN },
        }),
        prisma.user.count({
          where: { restaurant_id: restaurantId, role: UserRole.WAITER },
        }),
        prisma.user.count({
          where: { restaurant_id: restaurantId, role: UserRole.COOK },
        }),
      ]);

    return {
      total,
      active,
      inactive,
      byRole: {
        ADMIN: adminCount,
        WAITER: waiterCount,
        COOK: cookCount,
      },
    };
  }
}

export default StaffRepository;
