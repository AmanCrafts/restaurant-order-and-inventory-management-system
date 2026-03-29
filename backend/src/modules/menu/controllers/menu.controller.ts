import { Request, Response } from 'express';
import { MenuService } from '../services/menu.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { AuthRequest } from '../../../shared/middleware/auth';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  getByRestaurant = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const menu = await this.menuService.getByRestaurant(
        req.params.restaurantId as string,
      );

      res.json({
        status: 'success',
        data: menu,
      });
    },
  );

  createForRestaurant = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const menu = await this.menuService.createForRestaurant(
        req.params.restaurantId as string,
        req.user,
      );

      res.status(201).json({
        status: 'success',
        data: menu,
      });
    },
  );

  createCategory = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const category = await this.menuService.createCategory(
        req.body.restaurantId as string,
        req.body.name as string,
        req.user,
      );

      res.status(201).json({
        status: 'success',
        data: category,
      });
    },
  );

  updateCategory = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const category = await this.menuService.updateCategory(
        req.params.id as string,
        req.body.name as string,
        req.user,
      );

      res.json({
        status: 'success',
        data: category,
      });
    },
  );

  deleteCategory = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await this.menuService.deleteCategory(req.params.id as string, req.user);

      res.json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    },
  );

  createItem = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const item = await this.menuService.createItem(req.user, {
        categoryId: req.body.categoryId as string,
        name: req.body.name as string,
        price: req.body.price as number,
        isAvailable: req.body.isAvailable as boolean | undefined,
        preparationTime: req.body.preparationTime as number,
        ingredients:
          (req.body.ingredients as Array<{
            inventoryItemId: string;
            quantityRequired: number;
          }>) ?? [],
      });

      res.status(201).json({
        status: 'success',
        data: item,
      });
    },
  );

  updateItem = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const item = await this.menuService.updateItem(
        req.params.id as string,
        req.user,
        {
          name: req.body.name as string | undefined,
          price: req.body.price as number | undefined,
          isAvailable: req.body.isAvailable as boolean | undefined,
          preparationTime: req.body.preparationTime as number | undefined,
          ingredients: req.body.ingredients as
            | Array<{
                inventoryItemId: string;
                quantityRequired: number;
              }>
            | undefined,
        },
      );

      res.json({
        status: 'success',
        data: item,
      });
    },
  );

  listItems = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const items = await this.menuService.listItems(
        req.query.restaurantId as string,
        {
          q: req.query.q as string | undefined,
          available:
            req.query.available !== undefined
              ? req.query.available === 'true'
              : undefined,
        },
      );

      res.json({
        status: 'success',
        data: items,
      });
    },
  );

  getItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const item = await this.menuService.getItem(req.params.id as string);

    res.json({
      status: 'success',
      data: item,
    });
  });
}

export default MenuController;
