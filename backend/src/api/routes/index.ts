import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';
import restaurantRoutes from '../../modules/restaurant/routes/restaurant.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// TODO: Add other module routes
// router.use('/staff', staffRoutes);
// router.use('/staff', staffRoutes);
// router.use('/menu', menuRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/tables', tableRoutes);
// router.use('/orders', orderRoutes);
// router.use('/kitchen', kitchenRoutes);
// router.use('/bills', billRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
