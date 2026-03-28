/**
 * Auth Module
 * Authentication and authorization module
 */

// Export controllers
export { AuthController } from './controllers/auth.controller';

// Export services
export { AuthService } from './services/auth.service';

// Export repositories
export {
  AuthRepository,
  AuthUserRecord,
  CreateUserData,
} from './repositories/auth.repository';

// Export routes
export { default as authRoutes } from './routes/auth.routes';
