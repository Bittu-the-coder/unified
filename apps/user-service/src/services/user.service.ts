import { BadRequestError, NotFoundError } from '@unified/shared';
import { UserBlockModel } from '../models/UserBlock.model';
import { UserFollowModel } from '../models/UserFollow.model';
import { UserProfileModel } from '../models/UserProfile.model';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (username: string) => username.trim().toLowerCase();
const profileView = {
  authUserId: 1,
  uniqueNumber: 1,
  email: 1,
  username: 1,
  fullName: 1,
  bio: 1,
  avatarUrl: 1,
  preferences: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

const seedProfileDefaults = (userId: string, email?: string, uniqueNumber?: string, username?: string, fullName?: string) => {
  const normalizedEmail = email ? normalizeEmail(email) : `${userId}@local.dev`;
  const usernameFromEmail = normalizedEmail.split('@')[0]?.replace(/[^a-z0-9_]/gi, '_').toLowerCase() ?? '';
  const fallbackUsername = usernameFromEmail ? usernameFromEmail.slice(0, 24) : `user_${userId.slice(0, 8)}`;

  return {
    uniqueNumber,
    email: normalizedEmail,
    username: username ? normalizeUsername(username) : fallbackUsername,
    fullName: fullName?.trim() || 'New User',
  };
};

export class UserService {
  static async ensureUserExists(userId: string) {
    const exists = await UserProfileModel.exists({ authUserId: userId });
    if (!exists) {
      throw new NotFoundError('User profile not found');
    }
  }

  static async getMe(
    userId: string,
    email?: string,
    uniqueNumber?: string,
    username?: string,
    fullName?: string,
  ) {
    let profile = await UserProfileModel.findOne({ authUserId: userId });
    if (!profile) {
      const defaults = seedProfileDefaults(userId, email, uniqueNumber, username, fullName);
      profile = await UserProfileModel.create({
        authUserId: userId,
        ...defaults,
      });
    } else {
      const normalizedEmail = email ? normalizeEmail(email) : profile.email;
      const normalizedUsername = username ? normalizeUsername(username) : profile.username;
      const normalizedFullName = fullName?.trim() || profile.fullName;
      const resolvedUniqueNumber = uniqueNumber ?? profile.uniqueNumber;

      const shouldSync =
        profile.email !== normalizedEmail ||
        profile.username !== normalizedUsername ||
        profile.fullName !== normalizedFullName ||
        profile.uniqueNumber !== resolvedUniqueNumber ||
        profile.fullName === 'New User';

      if (shouldSync) {
        profile.email = normalizedEmail;
        profile.username = normalizedUsername;
        profile.fullName = normalizedFullName;
        profile.uniqueNumber = resolvedUniqueNumber;
        await profile.save();
      }
    }
    return profile;
  }

  static async getPublicProfile(id: string) {
    const profile = await UserProfileModel.findOne({ authUserId: id }).select('-email');
    if (!profile) {
      throw new NotFoundError('User profile not found');
    }
    return profile;
  }

  static async getByUniqueNumber(uniqueNumber: string) {
    const profile = await UserProfileModel.findOne({ uniqueNumber: uniqueNumber.trim() }).select('-email');
    if (!profile) {
      throw new NotFoundError('User profile not found');
    }
    return profile;
  }

  static async searchUsers(input: { q: string; limit?: number; me?: string }) {
    const query = input.q.trim();
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const users = await UserProfileModel.find({
      $or: [{ username: regex }, { fullName: regex }, { email: regex }, { uniqueNumber: regex }],
      ...(input.me ? { authUserId: { $ne: input.me } } : {}),
    })
      .sort({ updatedAt: -1 })
      .limit(input.limit ?? 10)
      .select(profileView);
    return users;
  }

  static async upsertOwnProfile(
    userId: string,
    payload: {
      email?: string;
      username?: string;
      fullName?: string;
      bio?: string;
      avatarUrl?: string;
      preferences?: Record<string, unknown>;
    },
    authContext?: { email?: string; uniqueNumber?: string; username?: string; fullName?: string },
  ) {
    if (payload.email) {
      payload.email = normalizeEmail(payload.email);
      const emailOwner = await UserProfileModel.findOne({
        email: payload.email,
        authUserId: { $ne: userId },
      }).select('_id');
      if (emailOwner) {
        throw new BadRequestError('Email is already in use');
      }
    }

    if (payload.username) {
      payload.username = normalizeUsername(payload.username);
      const usernameOwner = await UserProfileModel.findOne({
        username: payload.username,
        authUserId: { $ne: userId },
      }).select('_id');
      if (usernameOwner) {
        throw new BadRequestError('Username is already in use');
      }
    }

    const defaults = seedProfileDefaults(
      userId,
      authContext?.email ?? payload.email,
      authContext?.uniqueNumber,
      authContext?.username,
      authContext?.fullName,
    );
    const profile = await UserProfileModel.findOneAndUpdate(
      { authUserId: userId },
      {
        $set: {
          ...payload,
          ...(authContext?.uniqueNumber ? { uniqueNumber: authContext.uniqueNumber } : {}),
        },
        $setOnInsert: {
          ...defaults,
          ...(payload.username ? { username: payload.username } : {}),
          ...(payload.fullName ? { fullName: payload.fullName } : {}),
        },
      },
      { upsert: true, new: true },
    );
    return profile;
  }

  static async follow(me: string, target: string) {
    if (me === target) {
      throw new BadRequestError('Cannot follow yourself');
    }

    await UserService.ensureUserExists(target);

    const blockedRelation = await UserBlockModel.findOne({
      $or: [
        { blockerId: me, blockedId: target },
        { blockerId: target, blockedId: me },
      ],
    }).select('_id');
    if (blockedRelation) {
      throw new BadRequestError('Follow unavailable due to block settings');
    }

    await UserFollowModel.updateOne(
      { followerId: me, followingId: target },
      { $set: { followerId: me, followingId: target } },
      { upsert: true },
    );
    return { followerId: me, followingId: target };
  }

  static async unfollow(me: string, target: string) {
    await UserFollowModel.deleteOne({ followerId: me, followingId: target });
  }

  static async block(me: string, target: string) {
    if (me === target) {
      throw new BadRequestError('Cannot block yourself');
    }

    await UserService.ensureUserExists(target);

    await UserBlockModel.updateOne(
      { blockerId: me, blockedId: target },
      { $set: { blockerId: me, blockedId: target } },
      { upsert: true },
    );
    await UserFollowModel.deleteMany({
      $or: [
        { followerId: me, followingId: target },
        { followerId: target, followingId: me },
      ],
    });
  }

  static async unblock(me: string, target: string) {
    await UserBlockModel.deleteOne({ blockerId: me, blockedId: target });
  }

  static async getFollowers(userId: string) {
    const relations = await UserFollowModel.find({ followingId: userId }).select('followerId -_id');
    const followerIds = relations.map((r) => r.followerId);
    if (followerIds.length === 0) {
      return [];
    }
    return UserProfileModel.find({ authUserId: { $in: followerIds } }).select(profileView);
  }

  static async getFollowing(userId: string) {
    const relations = await UserFollowModel.find({ followerId: userId }).select('followingId -_id');
    const followingIds = relations.map((r) => r.followingId);
    if (followingIds.length === 0) {
      return [];
    }
    return UserProfileModel.find({ authUserId: { $in: followingIds } }).select(profileView);
  }

  static async getBlockedUsers(userId: string) {
    const relations = await UserBlockModel.find({ blockerId: userId }).select('blockedId -_id');
    const blockedIds = relations.map((r) => r.blockedId);
    if (blockedIds.length === 0) {
      return [];
    }
    return UserProfileModel.find({ authUserId: { $in: blockedIds } }).select(profileView);
  }

  static async getSocialStats(userId: string) {
    const [followers, following, blocked] = await Promise.all([
      UserFollowModel.countDocuments({ followingId: userId }),
      UserFollowModel.countDocuments({ followerId: userId }),
      UserBlockModel.countDocuments({ blockerId: userId }),
    ]);
    return { followers, following, blocked };
  }
}
