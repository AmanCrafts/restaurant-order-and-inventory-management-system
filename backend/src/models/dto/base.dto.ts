/**
 * Base DTO Classes
 * Provides common properties and patterns for all DTOs
 */

/**
 * Base Response DTO
 * All response DTOs should extend this
 */
export abstract class BaseResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;

  constructor(entity: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    isActive?: boolean;
  }) {
    this.id = entity.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt ?? entity.createdAt;
    this.isActive = entity.isActive ?? true;
  }
}

/**
 * Base Create Request DTO
 */
export abstract class BaseCreateRequestDto {
  abstract validate(): boolean;
  abstract toJSON(): Record<string, unknown>;
}

/**
 * Base Update Request DTO
 */
export abstract class BaseUpdateRequestDto {
  abstract validate(): boolean;
  abstract toJSON(): Record<string, unknown>;
}

/**
 * Pagination DTO
 */
export class PaginationDto {
  page: number;
  limit: number;
  offset: number;

  constructor(page: number = 1, limit: number = 10) {
    this.page = Math.max(1, page);
    this.limit = Math.min(100, Math.max(1, limit));
    this.offset = (this.page - 1) * this.limit;
  }
}

/**
 * Paginated Response DTO
 */
export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  constructor(data: T[], total: number, pagination: PaginationDto) {
    this.data = data;
    const totalPages = Math.ceil(total / pagination.limit);
    this.meta = {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1,
    };
  }
}

/**
 * API Response Wrapper
 */
export class ApiResponseDto<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;

  constructor(
    status: 'success' | 'error',
    data?: T,
    message?: string,
    errors?: Record<string, string[]>,
  ) {
    this.status = status;
    this.data = data;
    this.message = message;
    this.errors = errors;
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto('success', data, message);
  }

  static error(
    message: string,
    errors?: Record<string, string[]>,
  ): ApiResponseDto<null> {
    return new ApiResponseDto('error', null, message, errors);
  }
}
