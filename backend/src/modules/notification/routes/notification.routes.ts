import { Router } from 'express';
import { z } from 'zod';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';

const router = Router();
const notificationController = new NotificationController();

const userIdSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

const sendNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  message: z.string().min(1, 'Message is required'),
});

router.get(
  '/me',
  authenticate(),
  validateRequest(undefined, undefined, limitQuerySchema),
  notificationController.getMine,
);

router.get(
  '/user/:userId',
  authenticate(),
  validateRequest(undefined, userIdSchema, limitQuerySchema),
  notificationController.getByUser,
);

router.get(
  '/restaurant/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema, limitQuerySchema),
  notificationController.getByRestaurant,
);

router.post(
  '/',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(sendNotificationSchema),
  notificationController.send,
);

export default router;
