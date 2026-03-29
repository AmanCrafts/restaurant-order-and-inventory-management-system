import { prisma } from '../../../shared/config/database';
import { toNumber } from '../../../shared/utils/number';

export interface MenuIngredientRecord {
  inventoryItemId: string;
  inventoryItemName?: string;
  unit?: string;
  quantityRequired: number;
}

export interface MenuItemRecord {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  preparationTime: number;
  ingredients: MenuIngredientRecord[];
}

export interface MenuCategoryRecord {
  id: string;
  menuId: string;
  name: string;
  items: MenuItemRecord[];
}

export interface MenuRecord {
  id: string;
  restaurantId: string;
  isActive: boolean;
  categories: MenuCategoryRecord[];
}

function mapIngredient(data: {
  inventory_item_id: string;
  quantity_required: number | { toNumber(): number };
  inventoryItem?: { name: string; unit: string };
}): MenuIngredientRecord {
  return {
    inventoryItemId: data.inventory_item_id,
    inventoryItemName: data.inventoryItem?.name,
    unit: data.inventoryItem?.unit,
    quantityRequired: toNumber(data.quantity_required),
  };
}

function mapItem(data: {
  id: string;
  category_id: string;
  name: string;
  price: number | { toNumber(): number };
  is_available: boolean;
  preparation_time: number;
  ingredients?: Array<{
    inventory_item_id: string;
    quantity_required: number | { toNumber(): number };
    inventoryItem?: { name: string; unit: string };
  }>;
}): MenuItemRecord {
  return {
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    price: toNumber(data.price),
    isAvailable: data.is_available,
    preparationTime: data.preparation_time,
    ingredients: (data.ingredients ?? []).map(mapIngredient),
  };
}

function mapCategory(data: {
  id: string;
  menu_id: string;
  name: string;
  items?: Array<{
    id: string;
    category_id: string;
    name: string;
    price: number | { toNumber(): number };
    is_available: boolean;
    preparation_time: number;
    ingredients?: Array<{
      inventory_item_id: string;
      quantity_required: number | { toNumber(): number };
      inventoryItem?: { name: string; unit: string };
    }>;
  }>;
}): MenuCategoryRecord {
  return {
    id: data.id,
    menuId: data.menu_id,
    name: data.name,
    items: (data.items ?? []).map(mapItem),
  };
}

function mapMenu(data: {
  id: string;
  restaurant_id: string;
  is_active: boolean;
  categories?: Array<{
    id: string;
    menu_id: string;
    name: string;
    items?: Array<{
      id: string;
      category_id: string;
      name: string;
      price: number | { toNumber(): number };
      is_available: boolean;
      preparation_time: number;
      ingredients?: Array<{
        inventory_item_id: string;
        quantity_required: number | { toNumber(): number };
        inventoryItem?: { name: string; unit: string };
      }>;
    }>;
  }>;
}): MenuRecord {
  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    isActive: data.is_active,
    categories: (data.categories ?? []).map(mapCategory),
  };
}

export class MenuRepository {
  async findActiveByRestaurant(
    restaurantId: string,
  ): Promise<MenuRecord | null> {
    const menu = await prisma.menu.findFirst({
      where: {
        restaurant_id: restaurantId,
        is_active: true,
      },
      include: {
        categories: {
          orderBy: { name: 'asc' },
          include: {
            items: {
              orderBy: { name: 'asc' },
              include: {
                ingredients: {
                  include: {
                    inventoryItem: {
                      select: {
                        name: true,
                        unit: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return menu ? mapMenu(menu) : null;
  }

  async createForRestaurant(restaurantId: string): Promise<MenuRecord> {
    const menu = await prisma.menu.create({
      data: {
        restaurant_id: restaurantId,
        is_active: true,
      },
    });

    return mapMenu(menu);
  }

  async findCategoryById(id: string) {
    return prisma.menuCategory.findUnique({
      where: { id },
      include: {
        menu: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async createCategory(
    menuId: string,
    name: string,
  ): Promise<MenuCategoryRecord> {
    const category = await prisma.menuCategory.create({
      data: {
        menu_id: menuId,
        name,
      },
    });

    return mapCategory(category);
  }

  async updateCategory(id: string, name: string): Promise<MenuCategoryRecord> {
    const category = await prisma.menuCategory.update({
      where: { id },
      data: { name },
    });

    return mapCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    await prisma.menuCategory.delete({
      where: { id },
    });
  }

  async findItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: true,
          },
        },
        ingredients: {
          include: {
            inventoryItem: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });
  }

  async createItem(input: {
    categoryId: string;
    name: string;
    price: number;
    isAvailable: boolean;
    preparationTime: number;
    ingredients: Array<{
      inventoryItemId: string;
      quantityRequired: number;
    }>;
  }): Promise<MenuItemRecord> {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.menuItem.create({
        data: {
          category_id: input.categoryId,
          name: input.name,
          price: input.price,
          is_available: input.isAvailable,
          preparation_time: input.preparationTime,
        },
      });

      if (input.ingredients.length > 0) {
        await tx.menuItemIngredient.createMany({
          data: input.ingredients.map((ingredient) => ({
            menu_item_id: created.id,
            inventory_item_id: ingredient.inventoryItemId,
            quantity_required: ingredient.quantityRequired,
          })),
        });
      }

      return tx.menuItem.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          ingredients: {
            include: {
              inventoryItem: {
                select: {
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });
    });

    return mapItem(item);
  }

  async updateItem(
    id: string,
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
  ): Promise<MenuItemRecord> {
    const item = await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.isAvailable !== undefined
            ? { is_available: input.isAvailable }
            : {}),
          ...(input.preparationTime !== undefined
            ? { preparation_time: input.preparationTime }
            : {}),
        },
      });

      if (input.ingredients) {
        await tx.menuItemIngredient.deleteMany({
          where: { menu_item_id: id },
        });

        if (input.ingredients.length > 0) {
          await tx.menuItemIngredient.createMany({
            data: input.ingredients.map((ingredient) => ({
              menu_item_id: id,
              inventory_item_id: ingredient.inventoryItemId,
              quantity_required: ingredient.quantityRequired,
            })),
          });
        }
      }

      return tx.menuItem.findUniqueOrThrow({
        where: { id },
        include: {
          ingredients: {
            include: {
              inventoryItem: {
                select: {
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });
    });

    return mapItem(item);
  }

  async listItems(restaurantId: string): Promise<MenuItemRecord[]> {
    const items = await prisma.menuItem.findMany({
      where: {
        category: {
          menu: {
            restaurant_id: restaurantId,
            is_active: true,
          },
        },
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items.map(mapItem);
  }
}

export default MenuRepository;
