import AuthRepository from '../repositories/auth.repository';
import {
  generateToken,
  verifyToken,
  TokenPayload,
} from '../../../shared/utils/jwt';
import { hashPassword, comparePassword } from '../../../shared/utils/password';
import { AppError } from '../../../shared/middleware/error-handler';
import { UserRole } from '../../../shared/constants/roles';
import logger from '../../../shared/utils/logger';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  restaurantId: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    restaurantId: string;
  };
}

export class AuthService {
  private authRepository: AuthRepository;
  private restaurantRepository: RestaurantRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.restaurantRepository = new RestaurantRepository();
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      logger.warn(`Login attempt for inactive user: ${email}`);
      throw new AppError('Account is deactivated', 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    logger.info(`User logged in: ${email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }

  async register(
    data: RegisterInput,
    actor?: AuthenticatedUser,
  ): Promise<AuthResult> {
    const { email, password, name, role, restaurantId } = data;

    if (actor) {
      if (actor.role !== UserRole.ADMIN) {
        throw new AppError('Only admins can create staff accounts', 403);
      }

      assertRestaurantAccess(actor, restaurantId);
    } else if (role !== UserRole.ADMIN) {
      throw new AppError(
        'Public registration is limited to restaurant admins',
        403,
      );
    }

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const emailExists = await this.authRepository.emailExists(email);
    if (emailExists) {
      throw new AppError('Email already registered', 409);
    }

    if (name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.authRepository.create({
      restaurantId,
      name: name.trim(),
      email,
      passwordHash: hashedPassword,
      role,
      isActive: true,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    logger.info(`User registered: ${email} for restaurant ${restaurant.id}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }

  async logout(token: string): Promise<void> {
    try {
      const payload = verifyToken(token);
      logger.info(`User logged out: ${payload.email}`);
    } catch {
      // Invalid token, but we don't need to throw
    }
  }

  async refreshToken(token: string): Promise<AuthResult> {
    try {
      const payload = verifyToken(token);

      const user = await this.authRepository.findById(payload.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
      }

      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      });

      return {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
        },
      };
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    restaurantId: string;
  } | null> {
    const user = await this.authRepository.findById(userId);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const passwordMatches = await comparePassword(
      currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError('Current password is incorrect', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.updatePassword(userId, hashedPassword);

    logger.info(`Password changed for user: ${userId}`);
  }

  verifyToken(token: string): TokenPayload {
    return verifyToken(token);
  }
}

export default AuthService;
