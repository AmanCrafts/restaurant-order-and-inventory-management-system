import { Response } from 'express';
import { KitchenService } from '../services/kitchen.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';
import { OrderStatus } from '../../../shared/constants/order-status';

export class KitchenController {
  private kitchenService: KitchenService;

  constructor() {
    this.kitchenService = new KitchenService();
  }

  listOrders = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const orders = await this.kitchenService.listKitchenOrders(
        req.user,
        req.query.restaurantId as string | undefined,
        req.query.status as OrderStatus | undefined,
      );

      res.json({
        status: 'success',
        data: orders,
      });
    },
  );

  startCooking = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.kitchenService.startCooking(
        req.user,
        req.params.id as string,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  markReady = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.kitchenService.markReady(
        req.user,
        req.params.id as string,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );
}

export default KitchenController;
