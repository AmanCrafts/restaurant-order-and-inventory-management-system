/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { UserRole } from '../../../shared/constants/roles';
import {
  LoginRequestDto,
  RegisterRequestDto,
} from '../../../models/dto/requests/auth.request.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  LogoutResponseDto,
  UserDataDto,
} from '../../../models/dto/responses/auth.response.dto';
// import logger from '../../../shared/utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Login endpoint
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = new LoginRequestDto(req.body);

    if (!dto.validate()) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid login data',
      });
      return;
    }

    const result = await this.authService.login(dto.email, dto.password);

    const response = new LoginResponseDto({
      token: result.token,
      user: new UserDataDto(result.user),
    });

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Register endpoint
   * POST /api/v1/auth/register
   */
  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const dto = new RegisterRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid registration data',
        });
        return;
      }

      const result = await this.authService.register({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role as UserRole,
        restaurantId: dto.restaurantId,
      });

      const response = new RegisterResponseDto({
        token: result.token,
        user: new UserDataDto(result.user),
        message: 'User registered successfully',
      });

      res.status(201).json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Logout endpoint
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      await this.authService.logout(token);
    }

    const response = new LogoutResponseDto();

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Refresh token endpoint
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          status: 'error',
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      const response = new LoginResponseDto({
        token: result.token,
        user: new UserDataDto(result.user),
      });

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Get current user endpoint
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const user = await this.authService.getCurrentUser(token);

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid or expired token',
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          user: new UserDataDto(user),
        },
      });
    },
  );

  /**
   * Change password endpoint
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const token = req.headers.authorization?.split(' ')[1];
      const { currentPassword, newPassword } = req.body;

      if (!token) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required',
        });
        return;
      }

      const payload = this.authService.verifyToken(token);

      await this.authService.changePassword(
        payload.userId,
        currentPassword,
        newPassword,
      );

      res.json({
        status: 'success',
        message: 'Password changed successfully',
      });
    },
  );
}

export default AuthController;
