import { Request, Response } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';

export class RestaurantController {
  private restaurantService: RestaurantService;

  constructor() {
    this.restaurantService = new RestaurantService();
  }

  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const restaurants = await this.restaurantService.getAll();

    res.json({
      status: 'success',
      data: restaurants,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    const details = await this.restaurantService.getDetails(id);

    res.json({
      status: 'success',
      data: details,
    });
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const restaurant = await this.restaurantService.create({
      name: req.body.name as string,
      address: req.body.address as string,
      contactNumber: req.body.contactNumber as string,
    });

    res.status(201).json({
      status: 'success',
      data: restaurant,
    });
  });

  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const restaurant = await this.restaurantService.update(
        id,
        {
          name: req.body.name as string | undefined,
          address: req.body.address as string | undefined,
          contactNumber: req.body.contactNumber as string | undefined,
        },
        req.user,
      );

      res.json({
        status: 'success',
        data: restaurant,
      });
    },
  );

  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      await this.restaurantService.deactivate(id, req.user);

      res.json({
        status: 'success',
        message: 'Restaurant deactivated successfully',
      });
    },
  );

  getStats = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const stats = await this.restaurantService.getStats();

      res.json({
        status: 'success',
        data: stats,
      });
    },
  );
}

export default RestaurantController;
