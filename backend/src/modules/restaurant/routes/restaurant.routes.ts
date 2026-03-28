import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { z } from 'zod';

const router = Router();
const restaurantController = new RestaurantController();

// Validation schemas
const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  contactNumber: z
    .string()
    .min(10, 'Contact number must be at least 10 characters'),
});

const updateRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .optional(),
  contactNumber: z
    .string()
    .min(10, 'Contact number must be at least 10 characters')
    .optional(),
});

const restaurantIdSchema = z.object({
  id: z.string().uuid('Invalid restaurant ID'),
});

// Public routes
router.get('/', restaurantController.getAll);
router.get('/stats', restaurantController.getStats);
router.get(
  '/:id',
  validateRequest(undefined, restaurantIdSchema),
  restaurantController.getById,
);

// Public bootstrap route
router.post(
  '/',
  validateRequest(createRestaurantSchema),
  restaurantController.create,
);

// Protected routes - Restaurant admin only
router.put(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateRestaurantSchema, restaurantIdSchema),
  restaurantController.update,
);

router.delete(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  restaurantController.delete,
);

export default router;
