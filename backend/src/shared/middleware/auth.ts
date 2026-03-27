import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../constants/roles';
import { AppError } from './error-handler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId: string;
  };
}

export type AuthenticatedUser = NonNullable<AuthRequest['user']>;

export function assertRestaurantAccess(
  user: AuthenticatedUser,
  restaurantId?: string,
): void {
  if (!restaurantId) {
    return;
  }

  if (user.restaurantId !== restaurantId) {
    throw new AppError('Forbidden: Access denied for this restaurant', 403);
  }
}

export function authenticate() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized: No token provided',
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        restaurantId: payload.restaurantId,
      };

      next();
    } catch {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Invalid or expired token',
      });
    }
  };
}

export function authenticateOptional() {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role as UserRole,
          restaurantId: payload.restaurantId,
        };
      }
    } catch {
      req.user = undefined;
    }

    next();
  };
}

export function authorize(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

export function requireRestaurantAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const restaurantId =
      req.params.restaurantId ||
      req.params.id ||
      req.body.restaurantId ||
      (req.query.restaurantId as string | undefined);

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      assertRestaurantAccess(req.user, restaurantId);
    } catch (error) {
      return next(error);
    }

    next();
  };
}
