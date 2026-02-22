import type { Response } from 'express';
import { ok, type AuthenticatedRequest } from '../../shared/dist/index';
import { MessagingService } from '../services/messaging.service';
import { subscribeMessagingEvents } from '../realtime/event-bus';

export class MessagingController {
  static stream(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const unsubscribe = subscribeMessagingEvents((event) => {
      if (!event.participantIds.includes(userId)) {
        return;
      }
      res.write(`event: message\ndata: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  }

  static async listConversations(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.listConversations(req.user!.id);
    return ok(res, data, 'Conversations fetched');
  }

  static async getConversation(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.getConversation(req.user!.id, String(req.params.id));
    return ok(res, data, 'Conversation fetched');
  }

  static async createDirectConversation(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.createDirectConversation(req.user!.id, req.body);
    return ok(res, data, 'Direct conversation created', 201);
  }

  static async createGroupConversation(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.createGroupConversation(req.user!.id, req.body);
    return ok(res, data, 'Group conversation created', 201);
  }

  static async updateConversation(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.updateConversation(req.user!.id, String(req.params.id), req.body);
    return ok(res, data, 'Conversation updated');
  }

  static async deleteConversation(req: AuthenticatedRequest, res: Response) {
    await MessagingService.deleteConversation(req.user!.id, String(req.params.id));
    return ok(res, null, 'Conversation deleted');
  }

  static async listMessages(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.listMessages(
      req.user!.id,
      String(req.params.id),
      req.query.cursor ? String(req.query.cursor) : undefined,
      req.query.limit ? Number(req.query.limit) : undefined,
    );
    return ok(res, data, 'Messages fetched');
  }

  static async createMessage(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.createMessage(req.user!.id, String(req.params.id), req.body);
    return ok(res, data, 'Message created', 201);
  }

  static async updateMessage(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.updateMessage(req.user!.id, String(req.params.id), req.body);
    return ok(res, data, 'Message updated');
  }

  static async deleteMessage(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.deleteMessage(req.user!.id, String(req.params.id));
    return ok(res, null, 'Message deleted');
  }

  static async addParticipant(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.addParticipant(req.user!.id, String(req.params.id), req.body.participantId);
    return ok(res, data, 'Participant added');
  }

  static async removeParticipant(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.removeParticipant(req.user!.id, String(req.params.id), req.body.participantId);
    return ok(res, data, 'Participant removed');
  }

  static async makeAdmin(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.makeAdmin(req.user!.id, String(req.params.id), req.body.participantId);
    return ok(res, data, 'Participant promoted');
  }

  static async setMuted(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.setMemberState(req.user!.id, String(req.params.id), 'isMuted', req.body.value);
    return ok(res, data, 'Mute state updated');
  }

  static async setPinned(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.setMemberState(req.user!.id, String(req.params.id), 'isPinned', req.body.value);
    return ok(res, data, 'Pin state updated');
  }

  static async setArchived(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.setMemberState(req.user!.id, String(req.params.id), 'isArchived', req.body.value);
    return ok(res, data, 'Archive state updated');
  }

  static async setTyping(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.setTyping(req.user!.id, String(req.params.id), req.body.isTyping);
    return ok(res, data, 'Typing state updated');
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.markRead(req.user!.id, String(req.params.id), req.body.messageId);
    return ok(res, data, 'Messages marked as read');
  }

  static async addReaction(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.addReaction(req.user!.id, String(req.params.id), req.body.emoji);
    return ok(res, data, 'Reaction added');
  }

  static async removeReaction(req: AuthenticatedRequest, res: Response) {
    const data = await MessagingService.removeReaction(req.user!.id, String(req.params.id), String(req.params.emoji));
    return ok(res, data, 'Reaction removed');
  }
}

