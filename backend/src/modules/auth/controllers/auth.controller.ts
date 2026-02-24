import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    res.json({
      status: 'success',
      data: result,
    });
  });

  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.authService.register(req.body);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    },
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];
    await this.authService.logout(token || '');
    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      res.json({
        status: 'success',
        data: result,
      });
    },
  );
}
