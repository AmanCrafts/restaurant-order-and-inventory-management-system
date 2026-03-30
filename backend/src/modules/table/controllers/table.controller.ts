import { Response } from 'express';
import { TableService } from '../services/table.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';
import { TableStatus } from '../../../shared/constants/table-status';

export class TableController {
  private tableService: TableService;

  constructor() {
    this.tableService = new TableService();
  }

  getAll = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const tables = await this.tableService.getAll(req.user, {
        restaurantId: req.query.restaurantId as string | undefined,
        status: req.query.status as TableStatus | undefined,
      });

      res.json({
        status: 'success',
        data: tables,
      });
    },
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const table = await this.tableService.getById(
        req.params.id as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: table,
      });
    },
  );

  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const table = await this.tableService.create(req.user, {
        restaurantId: req.body.restaurantId as string,
        tableNumber: req.body.tableNumber as number,
        capacity: req.body.capacity as number,
        status: req.body.status as TableStatus | undefined,
      });

      res.status(201).json({
        status: 'success',
        data: table,
      });
    },
  );

  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const table = await this.tableService.update(
        req.params.id as string,
        req.user,
        {
          tableNumber: req.body.tableNumber as number | undefined,
          capacity: req.body.capacity as number | undefined,
          status: req.body.status as TableStatus | undefined,
        },
      );

      res.json({
        status: 'success',
        data: table,
      });
    },
  );

  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.tableService.delete(req.params.id as string, req.user);

      res.json({
        status: 'success',
        message: 'Table deleted successfully',
      });
    },
  );

  getStats = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const stats = await this.tableService.getStats(
        req.params.restaurantId as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: stats,
      });
    },
  );
}

export default TableController;
