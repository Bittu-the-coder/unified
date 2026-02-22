import type { Request, Response } from 'express';
import { ok, type AuthenticatedRequest } from '../../shared/dist/index';
import { UserService } from '../services/user.service';

export class UserController {
  static async me(req: AuthenticatedRequest, res: Response) {
    const profile = await UserService.getMe(
      req.user!.id,
      req.user!.email,
      req.user!.uniqueNumber,
      req.user!.username,
      req.user!.fullName,
    );
    return ok(res, profile, 'My profile fetched');
  }

  static async getById(req: Request, res: Response) {
    const id = String(req.params.id);
    const profile = await UserService.getPublicProfile(id);
    return ok(res, profile, 'Profile fetched');
  }

  static async search(req: AuthenticatedRequest, res: Response) {
    const users = await UserService.searchUsers({
      q: String(req.query.q ?? ''),
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      me: req.user?.id,
    });
    return ok(res, users, 'Users fetched');
  }

  static async getByUniqueNumber(req: AuthenticatedRequest, res: Response) {
    const uniqueNumber = String(req.params.uniqueNumber ?? '').trim();
    const profile = await UserService.getByUniqueNumber(uniqueNumber);
    return ok(res, profile, 'Profile fetched');
  }

  static async updateMe(req: AuthenticatedRequest, res: Response) {
    const profile = await UserService.upsertOwnProfile(req.user!.id, req.body, {
      email: req.user!.email,
      uniqueNumber: req.user!.uniqueNumber,
      username: req.user!.username,
      fullName: req.user!.fullName,
    });
    return ok(res, profile, 'Profile updated');
  }

  static async follow(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const follow = await UserService.follow(req.user!.id, id);
    return ok(res, follow, 'Followed user');
  }

  static async unfollow(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    await UserService.unfollow(req.user!.id, id);
    return ok(res, null, 'Unfollowed user');
  }

  static async block(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    await UserService.block(req.user!.id, id);
    return ok(res, null, 'Blocked user');
  }

  static async unblock(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    await UserService.unblock(req.user!.id, id);
    return ok(res, null, 'Unblocked user');
  }

  static async followers(req: AuthenticatedRequest, res: Response) {
    const users = await UserService.getFollowers(req.user!.id);
    return ok(res, users, 'Followers fetched');
  }

  static async following(req: AuthenticatedRequest, res: Response) {
    const users = await UserService.getFollowing(req.user!.id);
    return ok(res, users, 'Following fetched');
  }

  static async blocked(req: AuthenticatedRequest, res: Response) {
    const users = await UserService.getBlockedUsers(req.user!.id);
    return ok(res, users, 'Blocked users fetched');
  }

  static async stats(req: AuthenticatedRequest, res: Response) {
    const data = await UserService.getSocialStats(req.user!.id);
    return ok(res, data, 'User stats fetched');
  }
}

