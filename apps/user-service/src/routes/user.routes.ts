import { Router } from 'express';
import { requireAuth, validateBody, validateQuery } from '@unified/shared';
import { UserController } from '../controllers/user.controller';
import { searchUsersSchema, updateProfileSchema } from '../validators/user.validators';

export const userRouter = Router();

userRouter.get('/me', requireAuth, UserController.me);
userRouter.get('/by-number/:uniqueNumber', requireAuth, UserController.getByUniqueNumber);
userRouter.get('/search', requireAuth, validateQuery(searchUsersSchema), UserController.search);
userRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), UserController.updateMe);
userRouter.get('/me/followers', requireAuth, UserController.followers);
userRouter.get('/me/following', requireAuth, UserController.following);
userRouter.get('/me/blocked', requireAuth, UserController.blocked);
userRouter.get('/me/stats', requireAuth, UserController.stats);
userRouter.post('/:id/follow', requireAuth, UserController.follow);
userRouter.delete('/:id/follow', requireAuth, UserController.unfollow);
userRouter.post('/:id/block', requireAuth, UserController.block);
userRouter.delete('/:id/block', requireAuth, UserController.unblock);
userRouter.get('/:id', UserController.getById);
