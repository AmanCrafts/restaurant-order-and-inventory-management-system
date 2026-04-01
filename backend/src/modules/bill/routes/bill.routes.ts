import { Router } from 'express';
import { z } from 'zod';
import { BillController } from '../controllers/bill.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate } from '../../../shared/middleware/auth';
import { BillStatus } from '../../../shared/constants/bill-status';

const router = Router();
const billController = new BillController();

const billIdSchema = z.object({
  id: z.string().uuid('Invalid bill ID'),
});

const orderIdSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

const generateBillSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  serviceChargeRate: z.number().min(0).max(100).optional(),
});

const listQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  status: z.nativeEnum(BillStatus).optional(),
});

router.get(
  '/',
  authenticate(),
  validateRequest(undefined, undefined, listQuerySchema),
  billController.list,
);

router.get(
  '/stats/:restaurantId',
  authenticate(),
  validateRequest(undefined, restaurantIdSchema),
  billController.getStats,
);

router.get(
  '/order/:orderId',
  authenticate(),
  validateRequest(undefined, orderIdSchema),
  billController.getByOrder,
);

router.get(
  '/:id',
  authenticate(),
  validateRequest(undefined, billIdSchema),
  billController.getById,
);

router.post(
  '/order/:orderId/generate',
  authenticate(),
  validateRequest(generateBillSchema, orderIdSchema),
  billController.generate,
);

router.post(
  '/:id/pay',
  authenticate(),
  validateRequest(undefined, billIdSchema),
  billController.pay,
);

export default router;
