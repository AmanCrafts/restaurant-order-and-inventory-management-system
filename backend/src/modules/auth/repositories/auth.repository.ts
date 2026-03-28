import { prisma } from '../../../shared/config/database';
import { UserRole } from '../../../shared/constants/roles';

export interface AuthUserRecord {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateUserData {
  restaurantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}

function mapUser(user: {
  id: string;
  restaurant_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}): AuthUserRecord {
  return {
    id: user.id,
    restaurantId: user.restaurant_id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    role: user.role as UserRole,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

export class AuthRepository {
  async findById(id: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findUnique({ where: { id } });

    return user ? mapUser(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? mapUser(user) : null;
  }

  async create(data: CreateUserData): Promise<AuthUserRecord> {
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

    return mapUser(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });
    if (!user) {
      throw new Error('Failed to update password');
    }
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async getCountByRestaurant(restaurantId: string): Promise<number> {
    return prisma.user.count({
      where: { restaurant_id: restaurantId },
    });
  }
}

export default AuthRepository;
