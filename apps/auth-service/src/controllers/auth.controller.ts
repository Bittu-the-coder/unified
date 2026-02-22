import type { Response } from 'express';
import { ok } from '../../shared/dist/index';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  static async register(req: any, res: Response) {
    const user = await AuthService.register(req.body);
    return ok(res, user, 'User registered', 201);
  }

  static async login(req: any, res: Response) {
    const session = await AuthService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ok(res, session, 'Login successful');
  }

  static async refresh(req: any, res: Response) {
    const tokens = await AuthService.refresh(req.body.refreshToken);
    return ok(res, tokens, 'Token refreshed');
  }

  static async logout(req: any, res: Response) {
    await AuthService.logout(req.body.refreshToken);
    return ok(res, null, 'Logged out');
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response) {
    await AuthService.logoutAll(req.user!.id);
    return ok(res, null, 'Logged out from all sessions');
  }

  static async sessions(req: AuthenticatedRequest, res: Response) {
    const sessions = await AuthService.listSessions(req.user!.id);
    return ok(res, sessions, 'Sessions fetched');
  }

  static async revokeSession(req: AuthenticatedRequest, res: Response) {
    await AuthService.revokeSession(req.user!.id, String(req.params.sessionId));
    return ok(res, null, 'Session revoked');
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    await AuthService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    return ok(res, null, 'Password changed');
  }

  static async forgotPassword(req: any, res: Response) {
    const data = await AuthService.forgotPassword(req.body.email);
    return ok(res, data, 'If the account exists, a reset token has been issued');
  }

  static async resetPassword(req: any, res: Response) {
    await AuthService.resetPassword(req.body.resetToken, req.body.newPassword);
    return ok(res, null, 'Password reset successful');
  }

  static async checkAvailability(req: any, res: Response) {
    const data = await AuthService.checkAvailability(req.body);
    return ok(res, data, 'Availability checked');
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    const me = await AuthService.me(req.user!.id);
    return ok(res, me, 'Profile fetched');
  }
}

