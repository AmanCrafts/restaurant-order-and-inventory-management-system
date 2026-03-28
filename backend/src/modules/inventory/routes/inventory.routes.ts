/**
 * Inventory Routes
 * Inventory management endpoints
 */

import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { z } from 'zod';

const router = Router();
const inventoryController = new InventoryController();

// Validation schemas
const createInventorySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  reorderThreshold: z
    .number()
    .min(0, 'Reorder threshold cannot be negative')
    .optional(),
});

const updateInventorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  reorderThreshold: z
    .number()
    .min(0, 'Reorder threshold cannot be negative')
    .optional(),
});

const updateStockSchema = z.object({
  amount: z.number().min(0, 'Amount cannot be negative'),
  operation: z.enum(['ADD', 'SET', 'DEDUCT']),
  reason: z.string().optional(),
});

const inventoryIdSchema = z.object({
  id: z.string().uuid('Invalid inventory item ID'),
});

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

// Query schemas
const inventoryListQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  search: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

const searchQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  q: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

// Public routes - None

// Protected routes - Admin only
router.get(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, undefined, inventoryListQuerySchema),
  inventoryController.getAll,
);

router.get(
  '/search',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, undefined, searchQuerySchema),
  inventoryController.search,
);

router.get(
  '/alerts/low-stock/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  inventoryController.getLowStock,
);

router.get(
  '/stats/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  inventoryController.getStats,
);

router.get(
  '/restaurant/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  inventoryController.getByRestaurant,
);

router.get(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, inventoryIdSchema),
  inventoryController.getById,
);

router.post(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(createInventorySchema),
  inventoryController.create,
);

router.put(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateInventorySchema, inventoryIdSchema),
  inventoryController.update,
);

router.put(
  '/:id/stock',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateStockSchema, inventoryIdSchema),
  inventoryController.updateStock,
);

router.delete(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, inventoryIdSchema),
  inventoryController.delete,
);

export default router;
