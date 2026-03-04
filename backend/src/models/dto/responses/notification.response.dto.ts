/**
 * Notification Response DTOs
 */

import { BaseResponseDto } from '../base.dto';

/**
 * Notification Response DTO
 */
export class NotificationResponseDto extends BaseResponseDto {
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  priority: 'low' | 'medium' | 'high';
  timeElapsed: string;

  constructor(notification: {
    id: string;
    userId: string;
    message: string;
    type: string;
    isRead: boolean;
    readAt: Date | null;
    metadata: Record<string, unknown> | null;
    actionUrl: string | null;
    priority: 'low' | 'medium' | 'high';
    timeElapsed: string;
    createdAt: Date;
  }) {
    super({
      id: notification.id,
      createdAt: notification.createdAt,
      updatedAt: notification.readAt || notification.createdAt,
      isActive: true,
    });
    this.userId = notification.userId;
    this.message = notification.message;
    this.type = notification.type;
    this.isRead = notification.isRead;
    this.readAt = notification.readAt;
    this.metadata = notification.metadata;
    this.actionUrl = notification.actionUrl;
    this.priority = notification.priority;
    this.timeElapsed = notification.timeElapsed;
  }

  /**
   * Check if notification is urgent
   */
  isUrgent(): boolean {
    return this.priority === 'high' || this.type === 'URGENT';
  }
}

/**
 * Notification Summary Response DTO
 */
export class NotificationSummaryResponseDto {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  timeElapsed: string;

  constructor(notification: {
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    timeElapsed: string;
  }) {
    this.id = notification.id;
    this.message = notification.message;
    this.type = notification.type;
    this.isRead = notification.isRead;
    this.timeElapsed = notification.timeElapsed;
  }
}

/**
 * Unread Count Response DTO
 */
export class UnreadCountResponseDto {
  count: number;
  hasUrgent: boolean;

  constructor(data: { count: number; hasUrgent: boolean }) {
    this.count = data.count;
    this.hasUrgent = data.hasUrgent;
  }
}
