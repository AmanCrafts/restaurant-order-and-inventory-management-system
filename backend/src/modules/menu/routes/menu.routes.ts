import { Router } from 'express';
import { z } from 'zod';
import { MenuController } from '../controllers/menu.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';

const router = Router();
const menuController = new MenuController();

const restaurantIdSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

const menuItemIdSchema = z.object({
  id: z.string().uuid('Invalid menu item ID'),
});

const menuCategoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

const ingredientSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  quantityRequired: z.number().positive('Quantity required must be positive'),
});

const createCategorySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  name: z.string().min(1, 'Category name is required'),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const createItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(0, 'Preparation time cannot be negative'),
  ingredients: z.array(ingredientSchema).optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z
    .number()
    .min(0, 'Preparation time cannot be negative')
    .optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

const itemListQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  q: z.string().optional(),
  available: z.enum(['true', 'false']).optional(),
});

router.get(
  '/restaurant/:restaurantId',
  validateRequest(undefined, restaurantIdSchema),
  menuController.getByRestaurant,
);

router.get(
  '/items',
  validateRequest(undefined, undefined, itemListQuerySchema),
  menuController.listItems,
);

router.get(
  '/items/:id',
  validateRequest(undefined, menuItemIdSchema),
  menuController.getItem,
);

router.post(
  '/restaurant/:restaurantId',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, restaurantIdSchema),
  menuController.createForRestaurant,
);

router.post(
  '/categories',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(createCategorySchema),
  menuController.createCategory,
);

router.put(
  '/categories/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateCategorySchema, menuCategoryIdSchema),
  menuController.updateCategory,
);

router.delete(
  '/categories/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(undefined, menuCategoryIdSchema),
  menuController.deleteCategory,
);

router.post(
  '/items',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(createItemSchema),
  menuController.createItem,
);

router.put(
  '/items/:id',
  authenticate(),
  authorize([UserRole.ADMIN]),
  validateRequest(updateItemSchema, menuItemIdSchema),
  menuController.updateItem,
);

export default router;
