/**
 * Staff Controller
 * Handles HTTP requests for staff management
 */

import { Request, Response } from 'express';
import { StaffService } from '../services/staff.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from '../../../models/dto/requests/user.request.dto';
import {
  UserResponseDto,
  UserSummaryResponseDto,
} from '../../../models/dto/responses/user.response.dto';
import { UserRole } from '../../../shared/constants/roles';
import { AuthRequest } from '../../../shared/middleware/auth';

export class StaffController {
  private staffService: StaffService;

  constructor() {
    this.staffService = new StaffService();
  }

  /**
   * Get all staff members
   * GET /api/v1/staff
   */
  getAll = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.query.restaurantId as string;
      const role = req.query.role as UserRole;
      const isActive = req.query.isActive as string | undefined;
      const search = req.query.search as string;

      const filter: {
        restaurantId?: string;
        role?: UserRole;
        isActive?: boolean;
        search?: string;
      } = {};

      if (restaurantId) filter.restaurantId = restaurantId;
      if (role) filter.role = role;
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
      if (search) filter.search = search;

      const staff = await this.staffService.getAll(
        Object.keys(filter).length > 0 ? filter : undefined
      );

      const response = staff.map(
        (s) =>
          new UserSummaryResponseDto({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            isActive: s.isActive,
          })
      );

      res.json({
        status: 'success',
        data: response,
      });
    }
  );

  /**
   * Get staff member by ID
   * GET /api/v1/staff/:id
   */
  getById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const result = await this.staffService.getByIdWithRestaurant(id);
      const { user, restaurant } = result;

      const response = new UserResponseDto({
        id: user.id,
        restaurantId: user.restaurantId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ordersCount: user.orders.length,
      });

      res.json({
        status: 'success',
        data: {
          ...response,
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
          },
        },
      });
    }
  );

  /**
   * Get staff members by restaurant ID
   * GET /api/v1/staff/restaurant/:restaurantId
   */
  getByRestaurant = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.params.restaurantId as string;

      const staff = await this.staffService.getByRestaurantId(restaurantId);

      const response = staff.map(
        (s) =>
          new UserResponseDto({
            id: s.id,
            restaurantId: s.restaurantId,
            name: s.name,
            email: s.email,
            role: s.role,
            isActive: s.isActive,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            ordersCount: s.orders.length,
          })
      );

      res.json({
        status: 'success',
        data: response,
      });
    }
  );

  /**
   * Create new staff member
   * POST /api/v1/staff
   */
  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const dto = new CreateUserRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid staff data',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const staff = await this.staffService.create(
        {
          restaurantId: dto.restaurantId,
          name: dto.name,
          email: dto.email,
          password: dto.password,
          role: dto.role as UserRole,
        },
        adminId
      );

      const response = new UserResponseDto({
        id: staff.id,
        restaurantId: staff.restaurantId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        ordersCount: 0,
      });

      res.status(201).json({
        status: 'success',
        data: response,
      });
    }
  );

  /**
   * Update staff member
   * PUT /api/v1/staff/:id
   */
  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const dto = new UpdateUserRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid staff data',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const staff = await this.staffService.update(
        id,
        {
          name: dto.name,
          email: dto.email,
          role: dto.role as UserRole,
          isActive: dto.isActive,
        },
        adminId
      );

      const response = new UserResponseDto({
        id: staff.id,
        restaurantId: staff.restaurantId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        ordersCount: staff.orders.length,
      });

      res.json({
        status: 'success',
        data: response,
      });
    }
  );

  /**
   * Update staff member password
   * PUT /api/v1/staff/:id/password
   */
  updatePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          status: 'error',
          message: 'New password must be at least 6 characters',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      await this.staffService.updatePassword(id, newPassword, adminId);

      res.json({
        status: 'success',
        message: 'Password updated successfully',
      });
    }
  );

  /**
   * Deactivate staff member
   * DELETE /api/v1/staff/:id
   */
  deactivate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      await this.staffService.deactivate(id, adminId);

      res.json({
        status: 'success',
        message: 'Staff member deactivated successfully',
      });
    }
  );

  /**
   * Activate staff member
   * PATCH /api/v1/staff/:id/activate
   */
  activate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const staff = await this.staffService.activate(id, adminId);

      const response = new UserResponseDto({
        id: staff.id,
        restaurantId: staff.restaurantId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        ordersCount: staff.orders.length,
      });

      res.json({
        status: 'success',
        data: response,
      });
    }
  );

  /**
   * Delete staff member permanently
   * DELETE /api/v1/staff/:id/permanent
   */
  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      await this.staffService.delete(id, adminId);

      res.json({
        status: 'success',
        message: 'Staff member deleted permanently',
      });
    }
  );

  /**
   * Get staff statistics for a restaurant
   * GET /api/v1/staff/stats/:restaurantId
   */
  getStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.params.restaurantId as string;

      const stats = await this.staffService.getStats(restaurantId);

      res.json({
        status: 'success',
        data: stats,
      });
    }
  );

  /**
   * Search staff members
   * GET /api/v1/staff/search
   */
  search = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.query.restaurantId as string;
      const query = req.query.q as string;
      const role = req.query.role as UserRole;
      const isActive = req.query.isActive as string | undefined;

      if (!restaurantId) {
        res.status(400).json({
          status: 'error',
          message: 'restaurantId is required',
        });
        return;
      }

      const staff = await this.staffService.search({
        restaurantId,
        query,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      const response = staff.map(
        (s) =>
          new UserSummaryResponseDto({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            isActive: s.isActive,
          })
      );

      res.json({
        status: 'success',
        data: response,
      });
    }
  );
}

export default StaffController;
