import { prisma } from '../../../shared/config/database';
import { UserRole } from '../../../shared/constants/roles';

export interface NotificationRecord {
  id: string;
  userId: string;
  message: string;
  sentAt: Date;
}

function mapNotification(data: {
  id: string;
  user_id: string;
  message: string;
  sent_at: Date;
}): NotificationRecord {
  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    sentAt: data.sent_at,
  };
}

export class NotificationRepository {
  async create(userId: string, message: string): Promise<NotificationRecord> {
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        message,
      },
    });

    return mapNotification(notification);
  }

  async createMany(userIds: string[], message: string): Promise<number> {
    if (userIds.length === 0) {
      return 0;
    }

    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        user_id: userId,
        message,
      })),
    });

    return result.count;
  }

  async findByUserId(
    userId: string,
    limit = 50,
  ): Promise<NotificationRecord[]> {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
      take: limit,
    });

    return notifications.map(mapNotification);
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    return notification ? mapNotification(notification) : null;
  }

  async findByRestaurant(
    restaurantId: string,
    limit = 100,
  ): Promise<
    Array<
      NotificationRecord & {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
      }
    >
  > {
    const notifications = await prisma.notification.findMany({
      where: {
        user: {
          restaurant_id: restaurantId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { sent_at: 'desc' },
      take: limit,
    });

    return notifications.map((notification) => ({
      ...mapNotification(notification),
      user: notification.user,
    }));
  }

  async findRecipientIdsByRole(
    restaurantId: string,
    role: UserRole,
  ): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        restaurant_id: restaurantId,
        role,
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    return users.map((user) => user.id);
  }

  async findUserRestaurant(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        restaurant_id: true,
      },
    });

    return user?.restaurant_id ?? null;
  }
}

export default NotificationRepository;
