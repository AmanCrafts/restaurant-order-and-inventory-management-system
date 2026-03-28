import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { UserRole } from '../../../shared/constants/roles';
import { AuthRequest } from '../../../shared/middleware/auth';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const response = await this.authService.login(email, password);

    res.json({
      status: 'success',
      data: response,
    });
  });

  register = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const { email, password, name, role, restaurantId } = req.body as {
        email: string;
        password: string;
        name: string;
        role: UserRole;
        restaurantId: string;
      };

      const response = await this.authService.register(
        {
          email,
          password,
          name,
          role,
          restaurantId,
        },
        req.user,
      );

      res.status(201).json({
        status: 'success',
        data: {
          ...response,
          message: 'User registered successfully',
        },
      });
    },
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      await this.authService.logout(token);
    }

    res.json({
      status: 'success',
      data: { message: 'Logged out successfully' },
    });
  });

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const refreshToken =
        (req.body as { refreshToken?: string }).refreshToken ||
        req.headers.authorization?.split(' ')[1];

      if (!refreshToken) {
        res.status(400).json({
          status: 'error',
          message: 'Refresh token is required',
        });
        return;
      }

      const response = await this.authService.refreshToken(refreshToken);

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  getCurrentUser = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const user = await this.authService.getCurrentUser(req.user.id);

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
          user,
        },
      });
    },
  );

  changePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required',
        });
        return;
      }

      await this.authService.changePassword(
        req.user.id,
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
