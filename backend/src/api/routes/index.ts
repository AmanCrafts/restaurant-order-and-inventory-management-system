import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';
import restaurantRoutes from '../../modules/restaurant/routes/restaurant.routes';
import staffRoutes from '../../modules/staff/routes/staff.routes';
import inventoryRoutes from '../../modules/inventory/routes/inventory.routes';
import menuRoutes from '../../modules/menu/routes/menu.routes';
import tableRoutes from '../../modules/table/routes/table.routes';
import orderRoutes from '../../modules/order/routes/order.routes';
import kitchenRoutes from '../../modules/kitchen/routes/kitchen.routes';
import billRoutes from '../../modules/bill/routes/bill.routes';
import notificationRoutes from '../../modules/notification/routes/notification.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// Staff routes
router.use('/staff', staffRoutes);

// Inventory routes
router.use('/inventory', inventoryRoutes);

// Menu routes
router.use('/menu', menuRoutes);

// Table routes
router.use('/tables', tableRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Kitchen routes
router.use('/kitchen', kitchenRoutes);

// Bill routes
router.use('/bills', billRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

export default router;
