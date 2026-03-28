import StaffRepository, {
  StaffFilter,
  StaffRecord,
} from '../repositories/staff.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { UserRole } from '../../../shared/constants/roles';
import { AppError } from '../../../shared/middleware/error-handler';
import { hashPassword } from '../../../shared/utils/password';
import logger from '../../../shared/utils/logger';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';

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

  private ensureAdmin(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can manage staff', 403);
    }
  }

  async getAll(
    actor: AuthenticatedUser,
    filter?: StaffSearchInput,
  ): Promise<StaffRecord[]> {
    this.ensureAdmin(actor);

    const restaurantId = filter?.restaurantId || actor.restaurantId;
    assertRestaurantAccess(actor, restaurantId);

    return this.staffRepository.findAll({
      restaurantId,
      role: filter?.role,
      isActive: filter?.isActive,
      search: filter?.search,
    });
  }

  async getByIdWithRestaurant(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<{
    user: StaffRecord;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  }> {
    this.ensureAdmin(actor);

    const result = await this.staffRepository.findByIdWithRestaurant(id);

    if (!result) {
      throw new AppError('Staff member not found', 404);
    }

    assertRestaurantAccess(actor, result.user.restaurantId);

    return result;
  }

  async getByRestaurantId(
    restaurantId: string,
    actor: AuthenticatedUser,
  ): Promise<StaffRecord[]> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.staffRepository.findByRestaurantId(restaurantId);
  }

  async create(
    data: CreateStaffInput,
    actor: AuthenticatedUser,
  ): Promise<StaffRecord> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, data.restaurantId);

    const restaurant = await this.restaurantRepository.findById(
      data.restaurantId,
    );
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (await this.staffRepository.emailExists(data.email)) {
      throw new AppError('Email already registered', 409);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new AppError('Invalid email format', 400);
    }

    if (data.password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    if (data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const staff = await this.staffRepository.create({
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      passwordHash: hashedPassword,
      role: data.role,
      isActive: true,
    });

    logger.info(
      `Staff member created: ${staff.name} (${staff.id}) by admin ${actor.id}`,
    );

    return staff;
  }

  async update(
    id: string,
    data: UpdateStaffInput,
    actor: AuthenticatedUser,
  ): Promise<StaffRecord> {
    this.ensureAdmin(actor);

    const existing = await this.staffRepository.findById(id);
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (data.email && data.email.toLowerCase() !== existing.email) {
      if (await this.staffRepository.emailExists(data.email, id)) {
        throw new AppError('Email already registered', 409);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    if (data.name && data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    if (
      existing.role === UserRole.ADMIN &&
      data.isActive === false &&
      existing.isActive
    ) {
      const remainingAdmins = await this.staffRepository.countActiveAdmins(
        existing.restaurantId,
        existing.id,
      );

      if (remainingAdmins === 0) {
        throw new AppError(
          'At least one active admin must remain for the restaurant',
          400,
        );
      }
    }

    const staff = await this.staffRepository.update(id, {
      name: data.name?.trim(),
      email: data.email?.toLowerCase(),
      role: data.role,
      isActive: data.isActive,
    });

    if (!staff) {
      throw new AppError('Failed to update staff member', 500);
    }

    logger.info(
      `Staff member updated: ${staff.name} (${staff.id}) by admin ${actor.id}`,
    );

    return staff;
  }

  async updatePassword(
    id: string,
    newPassword: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    this.ensureAdmin(actor);

    const existing = await this.staffRepository.findById(id);
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.staffRepository.updatePassword(id, hashedPassword);

    logger.info(
      `Staff password updated: ${existing.name} (${id}) by admin ${actor.id}`,
    );
  }

  async deactivate(id: string, actor: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(actor);

    const existing = await this.staffRepository.findById(id);
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    if (!existing.isActive) {
      throw new AppError('Staff member is already deactivated', 400);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (existing.role === UserRole.ADMIN) {
      const remainingAdmins = await this.staffRepository.countActiveAdmins(
        existing.restaurantId,
        existing.id,
      );

      if (remainingAdmins === 0) {
        throw new AppError(
          'At least one active admin must remain for the restaurant',
          400,
        );
      }
    }

    await this.staffRepository.softDelete(id);

    logger.info(
      `Staff member deactivated: ${existing.name} (${id}) by admin ${actor.id}`,
    );
  }

  async activate(id: string, actor: AuthenticatedUser): Promise<StaffRecord> {
    this.ensureAdmin(actor);

    const existing = await this.staffRepository.findById(id);
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    if (existing.isActive) {
      throw new AppError('Staff member is already active', 400);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    const staff = await this.staffRepository.update(id, { isActive: true });
    if (!staff) {
      throw new AppError('Failed to activate staff member', 500);
    }

    logger.info(
      `Staff member activated: ${staff.name} (${id}) by admin ${actor.id}`,
    );

    return staff;
  }

  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(actor);

    const existing = await this.staffRepository.findById(id);
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    assertRestaurantAccess(actor, existing.restaurantId);

    if (existing.role === UserRole.ADMIN) {
      const remainingAdmins = await this.staffRepository.countActiveAdmins(
        existing.restaurantId,
        existing.id,
      );

      if (remainingAdmins === 0) {
        throw new AppError(
          'At least one active admin must remain for the restaurant',
          400,
        );
      }
    }

    await this.staffRepository.hardDelete(id);

    logger.info(
      `Staff member deleted: ${existing.name} (${id}) by admin ${actor.id}`,
    );
  }

  async getStats(
    restaurantId: string,
    actor: AuthenticatedUser,
  ): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.staffRepository.getStats(restaurantId);
  }

  async search(params: {
    restaurantId: string;
    query?: string;
    role?: UserRole;
    isActive?: boolean;
    actor: AuthenticatedUser;
  }): Promise<StaffRecord[]> {
    this.ensureAdmin(params.actor);
    assertRestaurantAccess(params.actor, params.restaurantId);

    const filter: StaffFilter = {
      restaurantId: params.restaurantId,
      role: params.role,
      isActive: params.isActive,
      search: params.query,
    };

    return this.staffRepository.findAll(filter);
  }
}

export default StaffService;
