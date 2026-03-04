/**
 * Authentication Response DTOs
 */
// import { BaseResponseDto } from '../base.dto';

/**
 * User Data in Auth Responses
 */
export class UserDataDto {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;

  constructor(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    restaurantId: string;
  }) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role;
    this.restaurantId = user.restaurantId;
  }
}

/**
 * Login Response DTO
 */
export class LoginResponseDto {
  token: string;
  refreshToken?: string;
  user: UserDataDto;

  constructor(data: {
    token: string;
    refreshToken?: string;
    user: UserDataDto;
  }) {
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.user = data.user;
  }

  /**
   * Get token expiry (simplified - assumes 24h default)
   */
  getExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
  }
}

/**
 * Register Response DTO
 */
export class RegisterResponseDto extends LoginResponseDto {
  message: string;

  constructor(data: {
    token: string;
    refreshToken?: string;
    user: UserDataDto;
    message?: string;
  }) {
    super(data);
    this.message = data.message || 'User registered successfully';
  }
}

/**
 * Logout Response DTO
 */
export class LogoutResponseDto {
  message: string;

  constructor(message: string = 'Logged out successfully') {
    this.message = message;
  }
}
