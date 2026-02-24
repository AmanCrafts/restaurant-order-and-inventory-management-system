import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// TODO: Add other module routes
// router.use('/restaurants', restaurantRoutes);
// router.use('/staff', staffRoutes);
// router.use('/menu', menuRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/tables', tableRoutes);
// router.use('/orders', orderRoutes);
// router.use('/kitchen', kitchenRoutes);
// router.use('/bills', billRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
