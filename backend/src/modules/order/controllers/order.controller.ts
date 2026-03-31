import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';
import { OrderStatus } from '../../../shared/constants/order-status';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  list = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const orders = await this.orderService.list(req.user, {
        restaurantId: req.query.restaurantId as string | undefined,
        status: req.query.status as OrderStatus | undefined,
        waiterId: req.query.waiterId as string | undefined,
        tableId: req.query.tableId as string | undefined,
      });

      res.json({
        status: 'success',
        data: orders,
      });
    },
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.getById(
        req.user,
        req.params.id as string,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.create(req.user, {
        restaurantId: req.body.restaurantId as string,
        tableId: req.body.tableId as string,
        items: req.body.items as
          | Array<{ menuItemId: string; quantity: number }>
          | undefined,
      });

      res.status(201).json({
        status: 'success',
        data: order,
      });
    },
  );

  addItem = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.addItem(
        req.user,
        req.params.id as string,
        {
          menuItemId: req.body.menuItemId as string,
          quantity: req.body.quantity as number,
        },
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  updateItem = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.updateItem(
        req.user,
        req.params.id as string,
        req.params.itemId as string,
        req.body.quantity as number,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  removeItem = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.removeItem(
        req.user,
        req.params.id as string,
        req.params.itemId as string,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  sendToKitchen = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.sendToKitchen(
        req.user,
        req.params.id as string,
      );

      res.json({
        status: 'success',
        data: order,
      });
    },
  );

  serve = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const order = await this.orderService.serve(
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

export default OrderController;
