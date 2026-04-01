import { Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getMine = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const notifications = await this.notificationService.getForCurrentUser(
        req.user,
        limit,
      );

      res.json({
        status: 'success',
        data: notifications,
      });
    },
  );

  getByUser = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const notifications = await this.notificationService.getForUser(
        req.user,
        req.params.userId as string,
        limit,
      );

      res.json({
        status: 'success',
        data: notifications,
      });
    },
  );

  getByRestaurant = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const notifications = await this.notificationService.getForRestaurant(
        req.user,
        req.params.restaurantId as string,
        limit,
      );

      res.json({
        status: 'success',
        data: notifications,
      });
    },
  );

  send = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const notification = await this.notificationService.sendToUser(
        req.user,
        req.body.userId as string,
        req.body.message as string,
      );

      res.status(201).json({
        status: 'success',
        data: notification,
      });
    },
  );
}

export default NotificationController;
