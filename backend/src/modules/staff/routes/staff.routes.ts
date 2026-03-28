/**
 * Staff Routes
 * Staff management endpoints
 */

import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { z } from 'zod';

const router = Router();
const staffController = new StaffController();

// Validation schemas
const createStaffSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']),
});

const updateStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']).optional(),
  isActive: z.boolean().optional(),
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const staffIdSchema = z.object({
  id: z.string().uuid('Invalid staff ID'),
});

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

// Query schemas
const staffListQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

const searchQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  q: z.string().optional(),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// Public routes - None

// Protected routes - Admin only
router.get(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, undefined, staffListQuerySchema),
  staffController.getAll,
);

router.get(
  '/search',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, undefined, searchQuerySchema),
  staffController.search,
);

router.get(
  '/stats/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  staffController.getStats,
);

router.get(
  '/restaurant/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  staffController.getByRestaurant,
);

router.get(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, staffIdSchema),
  staffController.getById,
);

router.post(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(createStaffSchema),
  staffController.create,
);

router.put(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateStaffSchema, staffIdSchema),
  staffController.update,
);

router.put(
  '/:id/password',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updatePasswordSchema, staffIdSchema),
  staffController.updatePassword,
);

router.patch(
  '/:id/activate',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, staffIdSchema),
  staffController.activate,
);

router.delete(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, staffIdSchema),
  staffController.deactivate,
);

router.delete(
  '/:id/permanent',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, staffIdSchema),
  staffController.delete,
);

export default router;
