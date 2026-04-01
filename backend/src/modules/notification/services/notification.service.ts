import NotificationRepository, {
  NotificationRecord,
} from '../repositories/notification.repository';
import { AppError } from '../../../shared/middleware/error-handler';
import {
  AuthenticatedUser,
  assertRestaurantAccess,
} from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/constants/roles';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getForCurrentUser(actor: AuthenticatedUser, limit = 50) {
    return this.notificationRepository.findByUserId(actor.id, limit);
  }

  async getForUser(
    actor: AuthenticatedUser,
    userId: string,
    limit = 50,
  ): Promise<NotificationRecord[]> {
    if (actor.id !== userId && actor.role !== UserRole.ADMIN) {
      throw new AppError('You can only access your own notifications', 403);
    }

    if (actor.role === UserRole.ADMIN && actor.id !== userId) {
      const userRestaurantId =
        await this.notificationRepository.findUserRestaurant(userId);

      if (!userRestaurantId) {
        throw new AppError('User not found', 404);
      }

      assertRestaurantAccess(actor, userRestaurantId);
    }

    return this.notificationRepository.findByUserId(userId, limit);
  }

  async getForRestaurant(
    actor: AuthenticatedUser,
    restaurantId: string,
    limit = 100,
  ) {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can view restaurant notifications', 403);
    }

    assertRestaurantAccess(actor, restaurantId);

    return this.notificationRepository.findByRestaurant(restaurantId, limit);
  }

  async sendToUser(
    actor: AuthenticatedUser,
    userId: string,
    message: string,
  ): Promise<NotificationRecord> {
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError('Only admins can send manual notifications', 403);
    }

    if (!message.trim()) {
      throw new AppError('Notification message is required', 400);
    }

    return this.notificationRepository.create(userId, message.trim());
  }

  async notifyUsers(userIds: string[], message: string): Promise<number> {
    return this.notificationRepository.createMany(userIds, message);
  }

  async notifyRole(
    restaurantId: string,
    role: UserRole,
    message: string,
  ): Promise<number> {
    const recipientIds =
      await this.notificationRepository.findRecipientIdsByRole(
        restaurantId,
        role,
      );

    return this.notificationRepository.createMany(recipientIds, message);
  }
}

export default NotificationService;
