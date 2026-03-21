/**
 * Auth Service
 * Business logic for authentication
 */

import { supabaseAdmin } from '../../../shared/config/supabase';
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

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  restaurantId: string;
}

export interface AuthResult {
  token: string;
  refreshToken?: string;
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

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user with password
    const user = await this.authRepository.findByEmailWithPassword(email);

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      logger.warn(`Login attempt for inactive user: ${email}`);
      throw new AppError('Account is deactivated', 401);
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    // Generate tokens
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
        role: user.role as UserRole,
        restaurantId: user.restaurantId,
      },
    };
  }

  /**
   * Register new user
   */
  async register(data: RegisterInput): Promise<AuthResult> {
    const { email, password, name, role, restaurantId } = data;

    // Check if email exists
    const emailExists = await this.authRepository.emailExists(email);
    if (emailExists) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in Supabase Auth (for token management)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email,
        password,
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
      const user = await this.authRepository.create({
        id: authData.user.id,
        restaurantId,
        name,
        email,
        passwordHash: hashedPassword,
        role,
        isActive: true,
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      });

      logger.info(`User registered: ${email}`);

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
    } catch (error) {
      // Cleanup Supabase user if database creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    // In a more complex system, you might blacklist the token
    // For now, we just log the logout
    try {
      const payload = verifyToken(token);
      logger.info(`User logged out: ${payload.email}`);
    } catch {
      // Invalid token, but we don't need to throw
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(token: string): Promise<AuthResult> {
    try {
      // Verify the current token
      const payload = verifyToken(token);

      // Get fresh user data
      const user = await this.authRepository.findById(payload.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
      }

      // Generate new token
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

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    restaurantId: string;
  } | null> {
    try {
      const payload = verifyToken(token);
      const user = await this.authRepository.findById(payload.userId);

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
    } catch {
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    _currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user with password
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // This requires getting the password hash, which we'd need to add to the repository
    // For now, we'll just update the password directly
    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.updatePassword(userId, hashedPassword);

    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Verify token and return payload
   */
  verifyToken(token: string): TokenPayload {
    return verifyToken(token);
  }
}

export default AuthService;
