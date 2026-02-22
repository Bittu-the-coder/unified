import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@unified/shared';
import { PasswordResetTokenModel } from '../models/PasswordResetToken.model';
import { SessionModel } from '../models/Session.model';
import { UserDeviceModel } from '../models/UserDevice.model';
import { UserModel, type IUser } from '../models/User.model';

type RegisterInput = {
  email: string;
  username: string;
  fullName: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
};

const refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
const resetTokenTtlMs = 30 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (username: string) => username.trim().toLowerCase();
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const buildUniqueNumberCandidate = () => String(Math.floor(6000000000 + Math.random() * 4000000000));
const generateUniqueNumber = async () => {
  for (let i = 0; i < 30; i += 1) {
    const uniqueNumber = buildUniqueNumberCandidate();
    const exists = await UserModel.exists({ uniqueNumber });
    if (!exists) {
      return uniqueNumber;
    }
  }
  throw new BadRequestError('Failed to generate a unique user number. Please try again.');
};
const sanitizeUser = (
  user: Pick<
    IUser,
    'email' | 'username' | 'fullName' | 'uniqueNumber' | 'role' | 'status' | 'emailVerified' | 'createdAt' | 'updatedAt'
  > & { id?: string; _id?: unknown },
) => ({
  id: user.id ?? String(user._id ?? ''),
  email: user.email,
  username: user.username,
  fullName: user.fullName,
  uniqueNumber: user.uniqueNumber,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class AuthService {
  static async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username);
    const exists = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (exists) {
      throw new BadRequestError('Email or username already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    let user: (IUser & { id?: string; _id?: unknown }) | null = null;
    let created = false;
    for (let i = 0; i < 5 && !created; i += 1) {
      const uniqueNumber = await generateUniqueNumber();
      try {
        user = await UserModel.create({
          email,
          username,
          fullName: input.fullName.trim(),
          uniqueNumber,
          passwordHash,
          salt,
        });
        created = true;
      } catch (err) {
        const duplicateKey = (err as { code?: number }).code === 11000;
        if (!duplicateKey) {
          throw err;
        }
      }
    }

    if (!created || !user) {
      throw new BadRequestError('Failed to create user. Please try again.');
    }

    return sanitizeUser(user);
  }

  static async login(input: LoginInput) {
    const user = await UserModel.findOne({ email: normalizeEmail(input.email) });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const okPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!okPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is not active');
    }

    const userId = String((user as unknown as { _id?: unknown })._id ?? user.id ?? '');
    if (!userId) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = {
      sub: userId,
      email: user.email,
      uniqueNumber: user.uniqueNumber,
      username: user.username,
      fullName: user.fullName,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    try {
      await SessionModel.create({
        userId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + refreshTtlMs),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceInfo: {
          id: input.deviceId,
          name: input.deviceName,
          type: input.deviceType,
        },
      });

      if (input.deviceId) {
        await UserDeviceModel.updateOne(
          { userId, deviceId: input.deviceId },
          {
            $set: {
              userId,
              deviceId: input.deviceId,
              deviceName: input.deviceName,
              deviceType: input.deviceType,
              lastActive: new Date(),
            },
          },
          { upsert: true },
        );
      }
    } catch (error) {
      // Do not block successful login if telemetry/session persistence fails.
      // Tokens are already minted; the client can proceed.
      console.error('[auth-service] login session persistence failed', error);
    }

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('Session expired');
    }
    const session = await SessionModel.findOne({ refreshToken, userId: payload.sub });
    if (!session) {
      throw new UnauthorizedError('Session expired');
    }
    if (session.expiresAt.getTime() < Date.now()) {
      await SessionModel.deleteOne({ _id: session.id });
      throw new UnauthorizedError('Session expired');
    }

    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      uniqueNumber: user.uniqueNumber,
      username: user.username,
      fullName: user.fullName,
    });
    const newRefreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      uniqueNumber: user.uniqueNumber,
      username: user.username,
      fullName: user.fullName,
    });

    session.accessToken = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + refreshTtlMs);
    await session.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken: string) {
    await SessionModel.deleteOne({ refreshToken });
  }

  static async logoutAll(userId: string) {
    await SessionModel.deleteMany({ userId });
  }

  static async listSessions(userId: string) {
    const sessions = await SessionModel.find({ userId })
      .sort({ updatedAt: -1 })
      .select('id userAgent ipAddress deviceInfo createdAt updatedAt expiresAt');
    return sessions;
  }

  static async revokeSession(userId: string, sessionId: string) {
    const session = await SessionModel.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    await SessionModel.deleteOne({ _id: session.id });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const okPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!okPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.salt = salt;
    user.passwordHash = passwordHash;
    await user.save();
    await SessionModel.deleteMany({ userId });
  }

  static async forgotPassword(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const user = await UserModel.findOne({ email });
    if (!user) {
      return { resetToken: null as string | null };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    await PasswordResetTokenModel.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + resetTokenTtlMs),
    });

    return { resetToken: rawToken };
  }

  static async resetPassword(resetToken: string, newPassword: string) {
    const tokenHash = hashToken(resetToken);
    const tokenDoc = await PasswordResetTokenModel.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const user = await UserModel.findById(tokenDoc.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.salt = salt;
    user.passwordHash = passwordHash;
    await user.save();

    tokenDoc.usedAt = new Date();
    await tokenDoc.save();
    await SessionModel.deleteMany({ userId: user.id });
  }

  static async checkAvailability(input: { email?: string; username?: string }) {
    const checks: { emailAvailable?: boolean; usernameAvailable?: boolean } = {};

    if (input.email) {
      const exists = await UserModel.exists({ email: normalizeEmail(input.email) });
      checks.emailAvailable = !exists;
    }
    if (input.username) {
      const exists = await UserModel.exists({ username: normalizeUsername(input.username) });
      checks.usernameAvailable = !exists;
    }

    return checks;
  }

  static async me(userId: string) {
    const user = await UserModel.findById(userId).select('-passwordHash -salt');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return sanitizeUser(user);
  }
}
