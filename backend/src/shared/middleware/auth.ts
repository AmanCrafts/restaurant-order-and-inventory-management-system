import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
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
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: No token provided' });
      }

      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }

      // Get user details from database
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('User')
        .select('id, email, role, restaurant_id')
        .eq('id', user.id)
        .single();

      if (dbError || !userData) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: User not found' });
      }

      req.user = {
        id: userData.id,
        email: userData.email,
        role: userData.role as UserRole,
        restaurantId: userData.restaurant_id,
      };

      next();
    } catch (error) {
      return res.status(500).json({ message: error });
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
