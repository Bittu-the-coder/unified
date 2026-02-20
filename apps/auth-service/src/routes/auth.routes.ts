import { Router } from 'express';
import { validateBody } from '@unified/shared';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  changePasswordSchema,
  checkAvailabilitySchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), AuthController.register);
authRouter.post('/login', validateBody(loginSchema), AuthController.login);
authRouter.post('/check-availability', validateBody(checkAvailabilitySchema), AuthController.checkAvailability);
authRouter.post('/refresh', validateBody(refreshSchema), AuthController.refresh);
authRouter.post('/logout', validateBody(refreshSchema), AuthController.logout);
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);
authRouter.get('/me', requireAuth, AuthController.me);
authRouter.get('/sessions', requireAuth, AuthController.sessions);
authRouter.delete('/sessions/:sessionId', requireAuth, AuthController.revokeSession);
authRouter.post('/logout-all', requireAuth, AuthController.logoutAll);
authRouter.post('/change-password', requireAuth, validateBody(changePasswordSchema), AuthController.changePassword);
