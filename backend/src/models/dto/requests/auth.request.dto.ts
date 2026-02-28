/**
 * Authentication Request DTOs
 */

/**
 * Login Request DTO
 */
export class LoginRequestDto {
  email: string;
  password: string;

  constructor(data: { email: string; password: string }) {
    this.email = data.email.toLowerCase().trim();
    this.password = data.password;
  }

  validate(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email) && this.password.length >= 6;
  }

  toJSON(): Record<string, unknown> {
    return {
      email: this.email,
      password: '***HIDDEN***', // Never log actual password
    };
  }
}

/**
 * Register Request DTO
 */
export class RegisterRequestDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'COOK';
  restaurantId: string;

  constructor(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    restaurantId: string;
  }) {
    this.email = data.email.toLowerCase().trim();
    this.password = data.password;
    this.name = data.name.trim();
    this.role = data.role.toUpperCase() as 'ADMIN' | 'WAITER' | 'COOK';
    this.restaurantId = data.restaurantId;
  }

  validate(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ['ADMIN', 'WAITER', 'COOK'];

    return (
      emailRegex.test(this.email) &&
      this.password.length >= 6 &&
      this.name.length >= 2 &&
      validRoles.includes(this.role) &&
      this.restaurantId.length > 0
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      email: this.email,
      name: this.name,
      role: this.role,
      restaurantId: this.restaurantId,
      password: '***HIDDEN***',
    };
  }
}

/**
 * Refresh Token Request DTO
 */
export class RefreshTokenRequestDto {
  refreshToken: string;

  constructor(data: { refreshToken: string }) {
    this.refreshToken = data.refreshToken;
  }

  validate(): boolean {
    return this.refreshToken.length > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      refreshToken: this.refreshToken.substring(0, 10) + '...',
    };
  }
}
