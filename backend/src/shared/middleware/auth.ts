import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../constants/roles';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId: string;
  };
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
    const restaurantId = req.params.restaurantId || req.body.restaurantId;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Admin can access any restaurant
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Others can only access their own restaurant
    if (restaurantId && restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    next();
  };
}
