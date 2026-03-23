/**
 * Staff Service
 * Business logic for staff management
 */

import StaffRepository, {
  // CreateStaffData,
  // UpdateStaffData,
  StaffFilter,
} from '../repositories/staff.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { User } from '../../../models/entities/user.entity';
import { UserRole } from '../../../shared/constants/roles';
import { AppError } from '../../../shared/middleware/error-handler';
import { hashPassword } from '../../../shared/utils/password';
import { supabaseAdmin } from '../../../shared/config/supabase';
import logger from '../../../shared/utils/logger';

export interface CreateStaffInput {
  restaurantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface StaffSearchInput {
  restaurantId?: string;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export class StaffService {
  private staffRepository: StaffRepository;
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.staffRepository = new StaffRepository();
    this.restaurantRepository = new RestaurantRepository();
  }

  /**
   * Get all staff members
   */
  async getAll(filter?: StaffSearchInput): Promise<User[]> {
    return this.staffRepository.findAll(filter);
  }

  /**
   * Get staff member by ID
   */
  async getById(id: string): Promise<User> {
    const staff = await this.staffRepository.findById(id);

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    return staff;
  }

  /**
   * Get staff member by ID with restaurant details
   */
  async getByIdWithRestaurant(id: string): Promise<{
    user: User;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  }> {
    const result = await this.staffRepository.findByIdWithRestaurant(id);

    if (!result) {
      throw new AppError('Staff member not found', 404);
    }

    return result;
  }

  /**
   * Get all staff members by restaurant ID
   */
  async getByRestaurantId(restaurantId: string): Promise<User[]> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.staffRepository.findByRestaurantId(restaurantId);
  }

  /**
   * Create new staff member
   */
  async create(
    data: CreateStaffInput,
    createdByAdminId: string,
  ): Promise<User> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(
      data.restaurantId,
    );

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Check if email already exists
    const emailExists = await this.staffRepository.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email already registered', 409);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate password strength
    if (data.password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Validate name
    if (data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      logger.error('Supabase auth error:', authError);
      throw new AppError(authError.message, 400);
    }

    if (!authData.user) {
      throw new AppError('Failed to create user', 500);
    }

    try {
      // Create user in database
      const staff = await this.staffRepository.create({
        restaurantId: data.restaurantId,
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
        isActive: true,
      });

      logger.info(
        `Staff member created: ${staff.name} (${staff.id}) by admin ${createdByAdminId}`,
      );

      return staff;
    } catch (error) {
      // Cleanup Supabase user if database creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
  }

  /**
   * Update staff member
   */
  async update(
    id: string,
    data: UpdateStaffInput,
    updatedById: string,
  ): Promise<User> {
    // Check if staff member exists
    const existing = await this.staffRepository.findById(id);

    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (data.email && data.email.toLowerCase() !== existing.email) {
      const emailExists = await this.staffRepository.emailExists(
        data.email,
        id,
      );
      if (emailExists) {
        throw new AppError('Email already registered', 409);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    // Validate name if provided
    if (data.name && data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    const staff = await this.staffRepository.update(id, {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
    });

    if (!staff) {
      throw new AppError('Failed to update staff member', 500);
    }

    logger.info(
      `Staff member updated: ${staff.name} (${staff.id}) by admin ${updatedById}`,
    );

    return staff;
  }

  /**
   * Update staff member's password
   */
  async updatePassword(
    id: string,
    newPassword: string,
    updatedById: string,
  ): Promise<void> {
    // Check if staff member exists
    const existing = await this.staffRepository.findById(id);

    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    // Validate password strength
    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await this.staffRepository.updatePassword(id, hashedPassword);

    logger.info(
      `Staff password updated: ${existing.name} (${id}) by admin ${updatedById}`,
    );
  }

  /**
   * Deactivate staff member
   */
  async deactivate(id: string, deactivatedById: string): Promise<void> {
    const existing = await this.staffRepository.findById(id);

    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    if (!existing.isActive) {
      throw new AppError('Staff member is already deactivated', 400);
    }

    await this.staffRepository.softDelete(id);

    logger.info(
      `Staff member deactivated: ${existing.name} (${id}) by admin ${deactivatedById}`,
    );
  }

  /**
   * Activate staff member
   */
  async activate(id: string, activatedById: string): Promise<User> {
    const existing = await this.staffRepository.findById(id);

    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    if (existing.isActive) {
      throw new AppError('Staff member is already active', 400);
    }

    const staff = await this.staffRepository.update(id, { isActive: true });

    if (!staff) {
      throw new AppError('Failed to activate staff member', 500);
    }

    logger.info(
      `Staff member activated: ${staff.name} (${id}) by admin ${activatedById}`,
    );

    return staff;
  }

  /**
   * Delete staff member permanently (hard delete)
   */
  async delete(id: string, deletedById: string): Promise<void> {
    const existing = await this.staffRepository.findById(id);

    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    await this.staffRepository.hardDelete(id);

    logger.info(
      `Staff member deleted: ${existing.name} (${id}) by admin ${deletedById}`,
    );
  }

  /**
   * Get staff statistics for a restaurant
   */
  async getStats(restaurantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.staffRepository.getStats(restaurantId);
  }

  /**
   * Search staff members
   */
  async search(params: {
    restaurantId: string;
    query?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User[]> {
    const filter: StaffFilter = {
      restaurantId: params.restaurantId,
    };

    if (params.query) {
      filter.search = params.query;
    }

    if (params.role) {
      filter.role = params.role;
    }

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    return this.staffRepository.findAll(filter);
  }
}

export default StaffService;
