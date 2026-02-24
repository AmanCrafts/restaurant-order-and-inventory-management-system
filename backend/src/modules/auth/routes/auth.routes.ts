import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../../../shared/middleware/validate-request';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'WAITER', 'COOK']),
  restaurantId: z.string().uuid(),
});

router.post('/login', validateRequest(loginSchema), authController.login);
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register,
);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;
