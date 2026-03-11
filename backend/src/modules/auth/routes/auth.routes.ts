/**
 * Auth Routes
 * Authentication endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate } from '../../../shared/middleware/auth';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']),
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Public routes
router.post('/login', validateRequest(loginSchema), authController.login);
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register,
);
router.post('/logout', authController.logout);
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  authController.refreshToken,
);

// Protected routes
router.get('/me', authenticate(), authController.getCurrentUser);
router.post(
  '/change-password',
  authenticate(),
  validateRequest(changePasswordSchema),
  authController.changePassword,
);

export default router;
