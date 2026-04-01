import { Router } from 'express';
import { z } from 'zod';
import { KitchenController } from '../controllers/kitchen.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import { OrderStatus } from '../../../shared/constants/order-status';

const router = Router();
const kitchenController = new KitchenController();

const orderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

const listQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

router.get(
  '/orders',
  authenticate(),
  authorize([UserRole.ADMIN, UserRole.COOK]),
  validateRequest(undefined, undefined, listQuerySchema),
  kitchenController.listOrders,
);

router.post(
  '/orders/:id/start',
  authenticate(),
  authorize([UserRole.ADMIN, UserRole.COOK]),
  validateRequest(undefined, orderIdSchema),
  kitchenController.startCooking,
);

router.post(
  '/orders/:id/ready',
  authenticate(),
  authorize([UserRole.ADMIN, UserRole.COOK]),
  validateRequest(undefined, orderIdSchema),
  kitchenController.markReady,
);

export default router;
