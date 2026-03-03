/**
 * Notification Request DTOs
 */

import { BaseCreateRequestDto, BaseUpdateRequestDto } from '../base.dto';

/**
 * Create Notification Request DTO
 */
export class CreateNotificationRequestDto extends BaseCreateRequestDto {
  userId: string;
  message: string;
  type:
    | 'INFO'
    | 'ORDER_READY'
    | 'ORDER_UPDATED'
    | 'LOW_STOCK'
    | 'NEW_ORDER'
    | 'ERROR'
    | 'URGENT'
    | 'SYSTEM';
  metadata?: Record<string, unknown>;
  actionUrl?: string;

  constructor(data: {
    userId: string;
    message: string;
    type?: string;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
  }) {
    super();
    this.userId = data.userId;
    this.message = data.message.trim();
    this.type = (data.type?.toUpperCase() || 'INFO') as
      | 'INFO'
      | 'ORDER_READY'
      | 'ORDER_UPDATED'
      | 'LOW_STOCK'
      | 'NEW_ORDER'
      | 'ERROR'
      | 'URGENT'
      | 'SYSTEM';
    this.metadata = data.metadata;
    this.actionUrl = data.actionUrl;
  }

  validate(): boolean {
    const validTypes = [
      'INFO',
      'ORDER_READY',
      'ORDER_UPDATED',
      'LOW_STOCK',
      'NEW_ORDER',
      'ERROR',
      'URGENT',
      'SYSTEM',
    ];
    return (
      this.userId.length > 0 &&
      this.message.length > 0 &&
      validTypes.includes(this.type)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      userId: this.userId,
      message: this.message,
      type: this.type,
      metadata: this.metadata,
      actionUrl: this.actionUrl,
    };
  }
}

/**
 * Mark Notification Read Request DTO
 */
export class MarkNotificationReadRequestDto extends BaseUpdateRequestDto {
  isRead: boolean;

  constructor(data: { isRead: boolean }) {
    super();
    this.isRead = data.isRead;
  }

  validate(): boolean {
    return typeof this.isRead === 'boolean';
  }

  toJSON(): Record<string, unknown> {
    return {
      isRead: this.isRead,
    };
  }
}
