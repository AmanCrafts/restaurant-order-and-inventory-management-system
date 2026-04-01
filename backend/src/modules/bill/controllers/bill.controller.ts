import { Response } from 'express';
import { BillService } from '../services/bill.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';
import { BillStatus } from '../../../shared/constants/bill-status';

export class BillController {
  private billService: BillService;

  constructor() {
    this.billService = new BillService();
  }

  list = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const bills = await this.billService.list(req.user, {
        restaurantId: req.query.restaurantId as string | undefined,
        status: req.query.status as BillStatus | undefined,
      });

      res.json({
        status: 'success',
        data: bills,
      });
    },
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const bill = await this.billService.getById(
        req.user,
        req.params.id as string,
      );

      res.json({
        status: 'success',
        data: bill,
      });
    },
  );

  getByOrder = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const bill = await this.billService.getByOrderId(
        req.user,
        req.params.orderId as string,
      );

      res.json({
        status: 'success',
        data: bill,
      });
    },
  );

  generate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const bill = await this.billService.generate(
        req.user,
        req.params.orderId as string,
        req.body.taxRate as number | undefined,
        req.body.serviceChargeRate as number | undefined,
      );

      res.status(201).json({
        status: 'success',
        data: bill,
      });
    },
  );

  pay = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const bill = await this.billService.pay(req.user, req.params.id as string);

    res.json({
      status: 'success',
      data: bill,
    });
  });

  getStats = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const stats = await this.billService.getStats(
        req.user,
        req.params.restaurantId as string,
      );

      res.json({
        status: 'success',
        data: stats,
      });
    },
  );
}

export default BillController;
