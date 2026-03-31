import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/order.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate } from '../../../shared/middleware/auth';
import { OrderStatus } from '../../../shared/constants/order-status';

const router = Router();
const orderController = new OrderController();

const orderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

const orderItemIdSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
  itemId: z.string().uuid('Invalid order item ID'),
});

const orderStatusSchema = z.nativeEnum(OrderStatus);

const createOrderSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableId: z.string().uuid('Invalid table ID'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
      }),
    )
    .optional(),
});

const addItemSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

const updateItemSchema = z.object({
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
});

const listQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  status: orderStatusSchema.optional(),
  waiterId: z.string().uuid('Invalid waiter ID').optional(),
  tableId: z.string().uuid('Invalid table ID').optional(),
});

router.get(
  '/',
  authenticate(),
  validateRequest(undefined, undefined, listQuerySchema),
  orderController.list,
);

router.get(
  '/:id',
  authenticate(),
  validateRequest(undefined, orderIdSchema),
  orderController.getById,
);

router.post(
  '/',
  authenticate(),
  validateRequest(createOrderSchema),
  orderController.create,
);

router.post(
  '/:id/items',
  authenticate(),
  validateRequest(addItemSchema, orderIdSchema),
  orderController.addItem,
);

router.put(
  '/:id/items/:itemId',
  authenticate(),
  validateRequest(updateItemSchema, orderItemIdSchema),
  orderController.updateItem,
);

router.delete(
  '/:id/items/:itemId',
  authenticate(),
  validateRequest(undefined, orderItemIdSchema),
  orderController.removeItem,
);

router.post(
  '/:id/send-to-kitchen',
  authenticate(),
  validateRequest(undefined, orderIdSchema),
  orderController.sendToKitchen,
);

router.post(
  '/:id/serve',
  authenticate(),
  validateRequest(undefined, orderIdSchema),
  orderController.serve,
);

export default router;
