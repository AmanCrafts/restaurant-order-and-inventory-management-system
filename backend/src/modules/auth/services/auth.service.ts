import { supabaseAdmin } from '../../../shared/config/supabase';
import { prisma } from '../../../shared/config/database';
import { generateToken } from '../../../shared/utils/jwt';
import { AppError } from '../../../shared/middleware/error-handler';
import { comparePassword, hashPassword } from '../../../shared/utils/password';
import { UserRole } from '../../../shared/constants/roles';

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

export class AuthService {
  async login(email: string, password: string) {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
    };
  }

  async register(data: RegisterInput) {
    const { email, password, name, role, restaurantId } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email,
        password,
      });

    if (authError) {
      throw new AppError(authError.message, 400);
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: authData.user!.id,
        email,
        name,
        password_hash: hashedPassword,
        role,
        restaurant_id: restaurantId,
        is_active: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
    };
  }

  async logout(_token: string): Promise<void> {
    // Add token to blacklist or handle session cleanup
    // Implementation depends on your session management strategy
  }

  async refreshToken(_refreshToken: string) {
    // Implement token refresh logic
    throw new AppError('Not implemented', 501);
  }
}
