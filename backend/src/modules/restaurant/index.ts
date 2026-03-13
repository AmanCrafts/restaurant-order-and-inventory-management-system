/**
 * Restaurant Module
 * Restaurant management functionality
 */

// Export controllers
export { RestaurantController } from './controllers/restaurant.controller';

// Export services
export { RestaurantService } from './services/restaurant.service';

// Export repositories
export {
  RestaurantRepository,
  CreateRestaurantData,
  UpdateRestaurantData,
} from './repositories/restaurant.repository';

// Export routes
export { default as restaurantRoutes } from './routes/restaurant.routes';
