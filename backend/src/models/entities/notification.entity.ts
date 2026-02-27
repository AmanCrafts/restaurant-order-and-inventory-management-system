import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Notification Entity
 * Represents system notifications for users
 * Demonstrates Simple Data Object with Business Logic
 */
export class Notification extends BaseEntity {
  private _userId: string;
  private _user: User | null = null;
  private _message: string;
  private _type: NotificationType;
  private _read: boolean;
  private _readAt: Date | null = null;
  private _metadata: Record<string, unknown> | null = null;
  private _actionUrl: string | null = null;

  constructor(
    id: string,
    userId: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    metadata?: Record<string, unknown>,
    actionUrl?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt, true);
    this._userId = userId;
    this._message = message;
    this._type = type;
    this._read = false;
    this._metadata = metadata || null;
    this._actionUrl = actionUrl || null;
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get user(): User | null {
    return this._user;
  }

  get message(): string {
    return this._message;
  }

  get type(): NotificationType {
    return this._type;
  }

  get isRead(): boolean {
    return this._read;
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  get metadata(): Record<string, unknown> | null {
    return this._metadata;
  }

  get actionUrl(): string | null {
    return this._actionUrl;
  }

  // Setters
  set user(user: User | null) {
    this._user = user;
    if (user) {
      this._userId = user.id;
    }
  }

  set message(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Notification message cannot be empty');
    }
    this._message = value.trim();
    this.touch();
  }

  /**
   * Mark notification as read
   */
  markAsRead(): void {
    if (!this._read) {
      this._read = true;
      this._readAt = new Date();
      this.touch();
    }
  }

  /**
   * Mark notification as unread
   */
  markAsUnread(): void {
    this._read = false;
    this._readAt = null;
    this.touch();
  }

  /**
   * Check if notification is urgent
   */
  isUrgent(): boolean {
    return this._type === NotificationType.URGENT ||
           this._type === NotificationType.LOW_STOCK;
  }

  /**
   * Get notification priority
   */
  getPriority(): 'low' | 'medium' | 'high' {
    switch (this._type) {
      case NotificationType.URGENT:
      case NotificationType.LOW_STOCK:
        return 'high';
      case NotificationType.ORDER_READY:
      case NotificationType.ERROR:
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get time elapsed since notification
   */
  getTimeElapsed(): string {
    const now = new Date();
    const diff = now.getTime() - this._createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  validate(): boolean {
    return (
      this._id !== undefined &&
      this._id.length > 0 &&
      this._userId !== undefined &&
      this._userId.length > 0 &&
      this._message !== undefined &&
      this._message.length > 0 &&
      Object.values(NotificationType).includes(this._type)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      message: this._message,
      type: this._type,
      isRead: this._read,
      readAt: this._readAt,
      metadata: this._metadata,
      actionUrl: this._actionUrl,
      priority: this.getPriority(),
      timeElapsed: this.getTimeElapsed(),
      createdAt: this._createdAt,
    };
  }

  static fromPrisma(data: {
    id: string;
    user_id: string;
    message: string;
    type?: string;
    is_read?: boolean;
    read_at?: Date | null;
    metadata?: Record<string, unknown>;
    action_url?: string;
    sent_at: Date;
  }): Notification {
    const notification = new Notification(
      data.id,
      data.user_id,
      data.message,
      (data.type as NotificationType) || NotificationType.INFO,
      data.metadata,
      data.action_url,
      data.sent_at
    );

    if (data.is_read) {
      notification._read = true;
      notification._readAt = data.read_at || null;
    }

    return notification;
  }
}

/**
 * Notification Types
 */
export enum NotificationType {
  INFO = 'INFO',
  ORDER_READY = 'ORDER_READY',
  ORDER_UPDATED = 'ORDER_UPDATED',
  LOW_STOCK = 'LOW_STOCK',
  NEW_ORDER = 'NEW_ORDER',
  ERROR = 'ERROR',
  URGENT = 'URGENT',
  SYSTEM = 'SYSTEM',
}

/**
 * Notification Factory
 * Creates common notification types
 */
export class NotificationFactory {
  static createOrderReadyNotification(userId: string, orderId: string, tableNumber: number): Notification {
    return new Notification(
      `notif_${Date.now()}`,
      userId,
      `Order for Table ${tableNumber} is ready!`,
      NotificationType.ORDER_READY,
      { orderId, tableNumber },
      `/orders/${orderId}`
    );
  }

  static createLowStockNotification(userId: string, itemName: string, currentStock: number): Notification {
    return new Notification(
      `notif_${Date.now()}`,
      userId,
      `Low stock alert: ${itemName} (${currentStock} remaining)`,
      NotificationType.LOW_STOCK,
      { itemName, currentStock },
      '/inventory'
    );
  }

  static createNewOrderNotification(userId: string, orderId: string, tableNumber: number): Notification {
    return new Notification(
      `notif_${Date.now()}`,
      userId,
      `New order received for Table ${tableNumber}`,
      NotificationType.NEW_ORDER,
      { orderId, tableNumber },
      `/kitchen/orders/${orderId}`
    );
  }

  static createSystemNotification(userId: string, message: string): Notification {
    return new Notification(
      `notif_${Date.now()}`,
      userId,
      message,
      NotificationType.SYSTEM
    );
  }
}
