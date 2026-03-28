import { prisma } from '../../../shared/config/database';
import { UserRole } from '../../../shared/constants/roles';

export interface StaffRecord {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  ordersCount: number;
}

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

function mapStaff(user: {
  id: string;
  restaurant_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  _count?: { orders: number };
}): StaffRecord {
  return {
    id: user.id,
    restaurantId: user.restaurant_id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.is_active,
    createdAt: user.created_at,
    ordersCount: user._count?.orders ?? 0,
  };
}

export class StaffRepository {
  async findAll(filter?: StaffFilter): Promise<StaffRecord[]> {
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
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map(mapStaff);
  }

  async findById(id: string): Promise<StaffRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return user ? mapStaff(user) : null;
  }

  async findByIdWithRestaurant(id: string): Promise<{
    user: StaffRecord;
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
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user || !user.restaurant) {
      return null;
    }

    return {
      user: mapStaff(user),
      restaurant: user.restaurant,
    };
  }

  async findByRestaurantId(restaurantId: string): Promise<StaffRecord[]> {
    const users = await prisma.user.findMany({
      where: { restaurant_id: restaurantId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map(mapStaff);
  }

  async create(data: CreateStaffData): Promise<StaffRecord> {
    const user = await prisma.user.create({
      data: {
        restaurant_id: data.restaurantId,
        name: data.name,
        email: data.email.toLowerCase(),
        password_hash: data.passwordHash,
        role: data.role,
        is_active: data.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return mapStaff(user);
  }

  async update(id: string, data: UpdateStaffData): Promise<StaffRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return mapStaff(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email: email.toLowerCase(),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    return count > 0;
  }

  async countActiveAdmins(
    restaurantId: string,
    excludeId?: string,
  ): Promise<number> {
    return prisma.user.count({
      where: {
        restaurant_id: restaurantId,
        role: UserRole.ADMIN,
        is_active: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  }

  async getStats(restaurantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, admins, waiters, cooks] = await Promise.all([
      prisma.user.count({
        where: { restaurant_id: restaurantId },
      }),
      prisma.user.count({
        where: { restaurant_id: restaurantId, is_active: true },
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
      inactive: total - active,
      byRole: {
        [UserRole.ADMIN]: admins,
        [UserRole.WAITER]: waiters,
        [UserRole.COOK]: cooks,
      },
    };
  }
}

export default StaffRepository;
