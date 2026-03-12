/**
 * Auth Repository
 * Handles database operations for authentication
 */

import { prisma } from '../../../shared/config/database';
import { User } from '../../../models/entities/user.entity';
import { UserRole } from '../../../shared/constants/roles';

export interface CreateUserData {
  id?: string;
  restaurantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class AuthRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return User.fromPrisma(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    return User.fromPrisma(user);
  }

  /**
   * Find user by email with password hash
   */
  async findByEmailWithPassword(email: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string;
    restaurantId: string;
    isActive: boolean;
  } | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: user.password_hash,
      restaurantId: user.restaurant_id,
      isActive: user.is_active,
    };
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        id: data.id,
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
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.passwordHash !== undefined)
      updateData.password_hash = data.passwordHash;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return User.fromPrisma(user);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { updated_at: new Date() },
    });
  }

  /**
   * Update password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Get user count by restaurant
   */
  async getCountByRestaurant(restaurantId: string): Promise<number> {
    return prisma.user.count({
      where: { restaurant_id: restaurantId },
    });
  }
}

export default AuthRepository;
