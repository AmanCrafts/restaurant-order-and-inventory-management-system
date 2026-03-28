import { prisma } from '../../../shared/config/database';

export interface CreateRestaurantData {
  name: string;
  address: string;
  contactNumber: string;
}

export interface UpdateRestaurantData {
  name?: string;
  address?: string;
  contactNumber?: string;
}

export interface RestaurantRecord {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: Date;
}

function mapRestaurant(data: {
  id: string;
  name: string;
  address: string;
  contact_number: string;
  is_active: boolean;
  created_at: Date;
}): RestaurantRecord {
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    contactNumber: data.contact_number,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

export interface RestaurantDetails extends RestaurantRecord {
  usersCount: number;
  tablesCount: number;
  menusCount: number;
}

export class RestaurantRepository {
  async findAll(): Promise<RestaurantRecord[]> {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { created_at: 'desc' },
    });

    return restaurants.map(mapRestaurant);
  }

  async findById(id: string): Promise<RestaurantRecord | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    return restaurant ? mapRestaurant(restaurant) : null;
  }

  async findByIdWithRelations(id: string): Promise<RestaurantDetails | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            tables: true,
            menus: true,
          },
        },
      },
    });

    if (!restaurant) {
      return null;
    }

    return {
      ...mapRestaurant(restaurant),
      usersCount: restaurant._count.users,
      tablesCount: restaurant._count.tables,
      menusCount: restaurant._count.menus,
    };
  }

  async create(data: CreateRestaurantData): Promise<RestaurantRecord> {
    const restaurant = await prisma.$transaction(async (tx) => {
      const createdRestaurant = await tx.restaurant.create({
        data: {
          name: data.name,
          address: data.address,
          contact_number: data.contactNumber,
          is_active: true,
        },
      });

      await tx.menu.create({
        data: {
          restaurant_id: createdRestaurant.id,
          is_active: true,
        },
      });

      return createdRestaurant;
    });

    return mapRestaurant(restaurant);
  }

  async update(
    id: string,
    data: UpdateRestaurantData,
  ): Promise<RestaurantRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.contactNumber !== undefined)
      updateData.contact_number = data.contactNumber;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    return mapRestaurant(restaurant);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.restaurant.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.restaurant.count({
      where: { id },
    });
    return count > 0;
  }

  async countActive(): Promise<number> {
    return prisma.restaurant.count({
      where: { is_active: true },
    });
  }
}

export default RestaurantRepository;
