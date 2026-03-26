import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';
import restaurantRoutes from '../../modules/restaurant/routes/restaurant.routes';
import staffRoutes from '../../modules/staff/routes/staff.routes';
import inventoryRoutes from '../../modules/inventory/routes/inventory.routes';

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

// TODO: Add other module routes
// router.use('/menu', menuRoutes);
// router.use('/tables', tableRoutes);
// router.use('/orders', orderRoutes);
// router.use('/kitchen', kitchenRoutes);
// router.use('/bills', billRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
