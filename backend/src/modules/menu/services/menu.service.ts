import MenuRepository, {
  MenuItemRecord,
  MenuRecord,
} from '../repositories/menu.repository';
import RestaurantRepository from '../../restaurant/repositories/restaurant.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';
import InventoryRepository from '../../inventory/repositories/inventory.repository';

export class MenuService {
  private menuRepository: MenuRepository;
  private restaurantRepository: RestaurantRepository;
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
    this.restaurantRepository = new RestaurantRepository();
    this.inventoryRepository = new InventoryRepository();
  }

  private ensureAdmin(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can manage the menu', 403);
    }
  }

  private async validateIngredients(
    restaurantId: string,
    ingredients: Array<{
      inventoryItemId: string;
      quantityRequired: number;
    }>,
  ): Promise<void> {
    for (const ingredient of ingredients) {
      if (ingredient.quantityRequired <= 0) {
        throw new AppError(
          'Ingredient quantity required must be greater than zero',
          400,
        );
      }

      const inventoryItem = await this.inventoryRepository.findById(
        ingredient.inventoryItemId,
      );

      if (!inventoryItem || inventoryItem.restaurantId !== restaurantId) {
        throw new AppError(
          'All ingredients must belong to the same restaurant inventory',
          400,
        );
      }
    }
  }

  async getByRestaurant(restaurantId: string): Promise<MenuRecord> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurant not found', 404);
    }

    const menu = await this.menuRepository.findActiveByRestaurant(restaurantId);
    if (!menu) {
      throw new AppError('Active menu not found for restaurant', 404);
    }

    return menu;
  }

  async createForRestaurant(
    restaurantId: string,
    actor: AuthenticatedUser,
  ): Promise<MenuRecord> {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const existing =
      await this.menuRepository.findActiveByRestaurant(restaurantId);
    if (existing) {
      return existing;
    }

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return this.menuRepository.createForRestaurant(restaurantId);
  }

  async createCategory(
    restaurantId: string,
    name: string,
    actor: AuthenticatedUser,
  ) {
    this.ensureAdmin(actor);
    assertRestaurantAccess(actor, restaurantId);

    const menu = await this.menuRepository.findActiveByRestaurant(restaurantId);
    if (!menu) {
      throw new AppError('Active menu not found for restaurant', 404);
    }

    if (!name.trim()) {
      throw new AppError('Category name is required', 400);
    }

    if (
      menu.categories.some(
        (category) => category.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      throw new AppError('Category already exists in this menu', 409);
    }

    return this.menuRepository.createCategory(menu.id, name.trim());
  }

  async updateCategory(
    categoryId: string,
    name: string,
    actor: AuthenticatedUser,
  ) {
    this.ensureAdmin(actor);

    const category = await this.menuRepository.findCategoryById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    assertRestaurantAccess(actor, category.menu.restaurant_id);

    if (!name.trim()) {
      throw new AppError('Category name is required', 400);
    }

    return this.menuRepository.updateCategory(categoryId, name.trim());
  }

  async deleteCategory(categoryId: string, actor: AuthenticatedUser) {
    this.ensureAdmin(actor);

    const category = await this.menuRepository.findCategoryById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    assertRestaurantAccess(actor, category.menu.restaurant_id);

    if (category.items.length > 0) {
      throw new AppError(
        'Remove menu items from the category before deleting it',
        400,
      );
    }

    await this.menuRepository.deleteCategory(categoryId);
  }

  async createItem(
    actor: AuthenticatedUser,
    input: {
      categoryId: string;
      name: string;
      price: number;
      isAvailable?: boolean;
      preparationTime: number;
      ingredients?: Array<{
        inventoryItemId: string;
        quantityRequired: number;
      }>;
    },
  ) {
    this.ensureAdmin(actor);

    const category = await this.menuRepository.findCategoryById(
      input.categoryId,
    );
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    assertRestaurantAccess(actor, category.menu.restaurant_id);

    if (!input.name.trim()) {
      throw new AppError('Item name is required', 400);
    }

    if (input.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    if (input.preparationTime < 0) {
      throw new AppError('Preparation time cannot be negative', 400);
    }

    await this.validateIngredients(
      category.menu.restaurant_id,
      input.ingredients ?? [],
    );

    return this.menuRepository.createItem({
      categoryId: input.categoryId,
      name: input.name.trim(),
      price: input.price,
      isAvailable: input.isAvailable ?? true,
      preparationTime: input.preparationTime,
      ingredients: input.ingredients ?? [],
    });
  }

  async updateItem(
    itemId: string,
    actor: AuthenticatedUser,
    input: {
      name?: string;
      price?: number;
      isAvailable?: boolean;
      preparationTime?: number;
      ingredients?: Array<{
        inventoryItemId: string;
        quantityRequired: number;
      }>;
    },
  ) {
    this.ensureAdmin(actor);

    const item = await this.menuRepository.findItemById(itemId);
    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    assertRestaurantAccess(actor, item.category.menu.restaurant_id);

    if (input.name !== undefined && !input.name.trim()) {
      throw new AppError('Item name cannot be empty', 400);
    }

    if (input.price !== undefined && input.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    if (input.preparationTime !== undefined && input.preparationTime < 0) {
      throw new AppError('Preparation time cannot be negative', 400);
    }

    if (input.ingredients) {
      await this.validateIngredients(
        item.category.menu.restaurant_id,
        input.ingredients,
      );
    }

    return this.menuRepository.updateItem(itemId, {
      name: input.name?.trim(),
      price: input.price,
      isAvailable: input.isAvailable,
      preparationTime: input.preparationTime,
      ingredients: input.ingredients,
    });
  }

  async listItems(
    restaurantId: string,
    params?: { q?: string; available?: boolean },
  ) {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurant not found', 404);
    }

    let items = await this.menuRepository.listItems(restaurantId);

    if (params?.q) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(params.q!.toLowerCase()),
      );
    }

    if (params?.available !== undefined) {
      items = items.filter((item) => item.isAvailable === params.available);
    }

    return items;
  }

  async getItem(itemId: string): Promise<MenuItemRecord> {
    const item = await this.menuRepository.findItemById(itemId);
    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    return {
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      price: Number(item.price),
      isAvailable: item.is_available,
      preparationTime: item.preparation_time,
      ingredients: item.ingredients.map((ingredient) => ({
        inventoryItemId: ingredient.inventory_item_id,
        inventoryItemName: ingredient.inventoryItem?.name,
        unit: ingredient.inventoryItem?.unit,
        quantityRequired: Number(ingredient.quantity_required),
      })),
    };
  }
}

export default MenuService;
