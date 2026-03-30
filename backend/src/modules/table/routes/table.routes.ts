import { Router } from 'express';
import { z } from 'zod';
import { TableController } from '../controllers/table.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { TableStatus } from '../../../shared/constants/table-status';

const router = Router();
const tableController = new TableController();

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

const tableIdSchema = z.object({
  id: z.string().uuid('Invalid table ID'),
});

const tableStatusSchema = z.nativeEnum(TableStatus);

const createTableSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableNumber: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().positive('Capacity must be positive'),
  status: tableStatusSchema.optional(),
});

const updateTableSchema = z.object({
  tableNumber: z
    .number()
    .int()
    .positive('Table number must be positive')
    .optional(),
  capacity: z.number().int().positive('Capacity must be positive').optional(),
  status: tableStatusSchema.optional(),
});

const listQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  status: tableStatusSchema.optional(),
});

router.get(
  '/',
  authenticate(),
  validateRequest(undefined, undefined, listQuerySchema),
  tableController.getAll,
);

router.get(
  '/stats/:restaurantId',
  authenticate(),
  validateRequest(undefined, restaurantIdSchema),
  tableController.getStats,
);

router.get(
  '/:id',
  authenticate(),
  validateRequest(undefined, tableIdSchema),
  tableController.getById,
);

router.post(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(createTableSchema),
  tableController.create,
);

router.put(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateTableSchema, tableIdSchema),
  tableController.update,
);

router.delete(
  '/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, tableIdSchema),
  tableController.delete,
);

export default router;
