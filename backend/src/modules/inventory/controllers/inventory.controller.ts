import { Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getAll = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const items = await this.inventoryService.getAll(req.user, {
        restaurantId: req.query.restaurantId as string | undefined,
        search: req.query.search as string | undefined,
        lowStock:
          req.query.lowStock !== undefined
            ? req.query.lowStock === 'true'
            : undefined,
      });

      res.json({
        status: 'success',
        data: items,
      });
    },
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const result = await this.inventoryService.getByIdWithRestaurant(
        req.params.id as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: result,
      });
    },
  );

  getByRestaurant = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const items = await this.inventoryService.getByRestaurantId(
        req.params.restaurantId as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: items,
      });
    },
  );

  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const item = await this.inventoryService.create(
        {
          restaurantId: req.body.restaurantId as string,
          name: req.body.name as string,
          quantity: req.body.quantity as number,
          unit: req.body.unit as string,
          reorderThreshold:
            (req.body.reorderThreshold as number | undefined) ?? 0,
        },
        req.user,
      );

      res.status(201).json({
        status: 'success',
        data: item,
      });
    },
  );

  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const item = await this.inventoryService.update(
        req.params.id as string,
        {
          name: req.body.name as string | undefined,
          unit: req.body.unit as string | undefined,
          reorderThreshold: req.body.reorderThreshold as number | undefined,
        },
        req.user,
      );

      res.json({
        status: 'success',
        data: item,
      });
    },
  );

  updateStock = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const item = await this.inventoryService.updateStock(
        req.params.id as string,
        {
          amount: req.body.amount as number,
          operation: req.body.operation as 'ADD' | 'SET' | 'DEDUCT',
          reason: req.body.reason as string | undefined,
        },
        req.user,
      );

      res.json({
        status: 'success',
        data: item,
      });
    },
  );

  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.inventoryService.delete(req.params.id as string, req.user);

      res.json({
        status: 'success',
        message: 'Inventory item deleted successfully',
      });
    },
  );

  getLowStock = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const items = await this.inventoryService.getLowStockItems(
        req.params.restaurantId as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: items,
      });
    },
  );

  getStats = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const stats = await this.inventoryService.getStats(
        req.params.restaurantId as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: stats,
      });
    },
  );

  search = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const items = await this.inventoryService.search({
        restaurantId: req.query.restaurantId as string,
        query: req.query.q as string | undefined,
        lowStock:
          req.query.lowStock !== undefined
            ? req.query.lowStock === 'true'
            : undefined,
        actor: req.user,
      });

      res.json({
        status: 'success',
        data: items,
      });
    },
  );
}

export default InventoryController;
