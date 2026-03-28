import { Response } from 'express';
import { StaffService } from '../services/staff.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { UserRole } from '../../../shared/constants/roles';
import { AuthRequest } from '../../../shared/middleware/auth';

export class StaffController {
  private staffService: StaffService;

  constructor() {
    this.staffService = new StaffService();
  }

  getAll = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const staff = await this.staffService.getAll(req.user, {
        restaurantId: req.query.restaurantId as string | undefined,
        role: req.query.role as UserRole | undefined,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === 'true'
            : undefined,
        search: req.query.search as string | undefined,
      });

      res.json({
        status: 'success',
        data: staff,
      });
    },
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const result = await this.staffService.getByIdWithRestaurant(
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

      const staff = await this.staffService.getByRestaurantId(
        req.params.restaurantId as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: staff,
      });
    },
  );

  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const staff = await this.staffService.create(
        {
          restaurantId: req.body.restaurantId as string,
          name: req.body.name as string,
          email: req.body.email as string,
          password: req.body.password as string,
          role: req.body.role as UserRole,
        },
        req.user,
      );

      res.status(201).json({
        status: 'success',
        data: staff,
      });
    },
  );

  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const staff = await this.staffService.update(
        req.params.id as string,
        {
          name: req.body.name as string | undefined,
          email: req.body.email as string | undefined,
          role: req.body.role as UserRole | undefined,
          isActive: req.body.isActive as boolean | undefined,
        },
        req.user,
      );

      res.json({
        status: 'success',
        data: staff,
      });
    },
  );

  updatePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.staffService.updatePassword(
        req.params.id as string,
        req.body.newPassword as string,
        req.user,
      );

      res.json({
        status: 'success',
        message: 'Password updated successfully',
      });
    },
  );

  deactivate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.staffService.deactivate(req.params.id as string, req.user);

      res.json({
        status: 'success',
        message: 'Staff member deactivated successfully',
      });
    },
  );

  activate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const staff = await this.staffService.activate(
        req.params.id as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: staff,
      });
    },
  );

  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.staffService.delete(req.params.id as string, req.user);

      res.json({
        status: 'success',
        message: 'Staff member deleted permanently',
      });
    },
  );

  getStats = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const stats = await this.staffService.getStats(
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

      const staff = await this.staffService.search({
        restaurantId: req.query.restaurantId as string,
        query: req.query.q as string | undefined,
        role: req.query.role as UserRole | undefined,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === 'true'
            : undefined,
        actor: req.user,
      });

      res.json({
        status: 'success',
        data: staff,
      });
    },
  );
}

export default StaffController;
