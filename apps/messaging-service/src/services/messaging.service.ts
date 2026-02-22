import { BadRequestError, NotFoundError } from '../../shared/dist/index';
import { ConversationMemberStateModel } from '../models/ConversationMemberState.model';
import { ConversationModel, type IConversation } from '../models/Conversation.model';
import { MessageModel } from '../models/Message.model';
import { emitMessagingEvent } from '../realtime/event-bus';

const ensureUniqueParticipants = (members: string[]) => Array.from(new Set(members.filter(Boolean)));
const toDmKey = (a: string, b: string) => [a, b].sort().join(':');

export class MessagingService {
  private static async ensureConversationAccessible(userId: string, conversationId: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new NotFoundError('Conversation not found');
    }
    return conversation;
  }

  private static async ensureState(conversationId: string, userId: string) {
    await ConversationMemberStateModel.updateOne(
      { conversationId, userId },
      { $setOnInsert: { conversationId, userId } },
      { upsert: true },
    );
  }

  private static async seedMemberStates(conversationId: string, participantIds: string[]) {
    await Promise.all(participantIds.map((id) => MessagingService.ensureState(conversationId, id)));
  }

  static async listConversations(userId: string) {
    const [conversations, states] = await Promise.all([
      ConversationModel.find({ participantIds: userId }).sort({ updatedAt: -1 }).lean(),
      ConversationMemberStateModel.find({ userId }).lean(),
    ]);
    const stateMap = new Map(states.map((s) => [s.conversationId, s]));
    return conversations.map((conversation) => ({
      ...conversation,
      memberState: stateMap.get(String(conversation._id)) ?? null,
    }));
  }

  static async getConversation(userId: string, conversationId: string) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    const [memberStates, lastMessage] = await Promise.all([
      ConversationMemberStateModel.find({ conversationId: conversation.id }).lean(),
      conversation.lastMessageId ? MessageModel.findById(conversation.lastMessageId).lean() : null,
    ]);
    return { ...conversation.toObject(), memberStates, lastMessage };
  }

  static async createDirectConversation(userId: string, payload: { participantId: string }) {
    const participantId = payload.participantId.trim();
    if (!participantId) {
      throw new BadRequestError('Participant is required');
    }

    const dmKey = toDmKey(userId, participantId);
    const existing = await ConversationModel.findOne({ type: 'direct', dmKey });
    if (existing) {
      await MessagingService.ensureState(existing.id, userId);
      return existing;
    }

    const participants = ensureUniqueParticipants([userId, participantId]);
    try {
      const conversation = await ConversationModel.create({
        type: 'direct',
        createdBy: userId,
        dmKey,
        participantIds: participants,
        adminIds: [userId],
      });
      await MessagingService.seedMemberStates(conversation.id, participants);
      emitMessagingEvent({
        type: 'conversation.updated',
        conversationId: conversation.id,
        participantIds: participants,
        at: new Date().toISOString(),
      });
      return conversation;
    } catch (err) {
      const duplicateKey = (err as { code?: number }).code === 11000;
      if (duplicateKey) {
        const alreadyCreated = await ConversationModel.findOne({ type: 'direct', dmKey });
        if (alreadyCreated) {
          await MessagingService.ensureState(alreadyCreated.id, userId);
          return alreadyCreated;
        }
      }
      throw err;
    }
  }

  static async createGroupConversation(
    userId: string,
    payload: { title?: string; description?: string; avatarUrl?: string; participantIds: string[] },
  ) {
    const participants = ensureUniqueParticipants([userId, ...payload.participantIds]);
    const conversation = await ConversationModel.create({
      type: 'group',
      createdBy: userId,
      title: payload.title?.trim(),
      description: payload.description?.trim(),
      avatarUrl: payload.avatarUrl,
      participantIds: participants,
      adminIds: [userId],
    });
    await MessagingService.seedMemberStates(conversation.id, participants);
    emitMessagingEvent({
      type: 'conversation.updated',
      conversationId: conversation.id,
      participantIds: participants,
      at: new Date().toISOString(),
    });
    return conversation;
  }

  static async updateConversation(
    userId: string,
    conversationId: string,
    payload: { title?: string; description?: string; avatarUrl?: string },
  ) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    if (conversation.type !== 'group') {
      throw new BadRequestError('Direct chats cannot be edited');
    }
    if (!conversation.adminIds.includes(userId)) {
      throw new BadRequestError('Only admins can update group');
    }
    if (payload.title !== undefined) conversation.title = payload.title.trim();
    if (payload.description !== undefined) conversation.description = payload.description.trim();
    if (payload.avatarUrl !== undefined) conversation.avatarUrl = payload.avatarUrl;
    await conversation.save();
    emitMessagingEvent({
      type: 'conversation.updated',
      conversationId: conversation.id,
      participantIds: conversation.participantIds,
      at: new Date().toISOString(),
    });
    return conversation;
  }

  static async deleteConversation(userId: string, conversationId: string) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    const canDelete = conversation.type === 'direct' || conversation.createdBy === userId || conversation.adminIds.includes(userId);
    if (!canDelete) {
      throw new BadRequestError('Only creator/admin can delete conversation');
    }

    await Promise.all([
      MessageModel.deleteMany({ conversationId: conversation.id }),
      ConversationMemberStateModel.deleteMany({ conversationId: conversation.id }),
      ConversationModel.deleteOne({ _id: conversation.id }),
    ]);
    emitMessagingEvent({
      type: 'conversation.deleted',
      conversationId: conversation.id,
      participantIds: conversation.participantIds,
      at: new Date().toISOString(),
    });
  }

  static async addParticipant(userId: string, conversationId: string, participantId: string) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    if (conversation.type !== 'group') throw new BadRequestError('Only group chat supports participants');
    if (!conversation.adminIds.includes(userId)) throw new BadRequestError('Only admins can add participants');

    if (!conversation.participantIds.includes(participantId)) {
      conversation.participantIds = [...conversation.participantIds, participantId];
      await conversation.save();
      await MessagingService.ensureState(conversation.id, participantId);
      emitMessagingEvent({
        type: 'conversation.updated',
        conversationId: conversation.id,
        participantIds: conversation.participantIds,
        at: new Date().toISOString(),
      });
    }
    return conversation;
  }

  static async removeParticipant(userId: string, conversationId: string, participantId: string) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    if (conversation.type !== 'group') throw new BadRequestError('Only group chat supports participants');
    if (!conversation.adminIds.includes(userId)) throw new BadRequestError('Only admins can remove participants');
    if (participantId === conversation.createdBy) throw new BadRequestError('Cannot remove conversation creator');

    conversation.participantIds = conversation.participantIds.filter((id) => id !== participantId);
    conversation.adminIds = conversation.adminIds.filter((id) => id !== participantId);
    await Promise.all([
      conversation.save(),
      ConversationMemberStateModel.deleteOne({ conversationId: conversation.id, userId: participantId }),
    ]);
    emitMessagingEvent({
      type: 'conversation.updated',
      conversationId: conversation.id,
      participantIds: conversation.participantIds,
      at: new Date().toISOString(),
    });
    return conversation;
  }

  static async makeAdmin(userId: string, conversationId: string, participantId: string) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    if (conversation.type !== 'group') throw new BadRequestError('Only group chat supports admins');
    if (!conversation.createdBy || conversation.createdBy !== userId) throw new BadRequestError('Only creator can promote admins');
    if (!conversation.participantIds.includes(participantId)) throw new BadRequestError('Participant not in group');

    if (!conversation.adminIds.includes(participantId)) {
      conversation.adminIds = [...conversation.adminIds, participantId];
      await conversation.save();
      emitMessagingEvent({
        type: 'conversation.updated',
        conversationId: conversation.id,
        participantIds: conversation.participantIds,
        at: new Date().toISOString(),
      });
    }
    return conversation;
  }

  static async setMemberState(
    userId: string,
    conversationId: string,
    key: 'isMuted' | 'isPinned' | 'isArchived',
    value: boolean,
  ) {
    await MessagingService.ensureConversationAccessible(userId, conversationId);
    const state = await ConversationMemberStateModel.findOneAndUpdate(
      { conversationId, userId },
      { $set: { [key]: value } },
      { new: true, upsert: true },
    );
    const conversation = await ConversationModel.findById(conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'presence.updated',
        conversationId,
        participantIds: conversation.participantIds,
        at: new Date().toISOString(),
      });
    }
    return state;
  }

  static async setTyping(userId: string, conversationId: string, isTyping: boolean) {
    await MessagingService.ensureConversationAccessible(userId, conversationId);
    const state = await ConversationMemberStateModel.findOneAndUpdate(
      { conversationId, userId },
      {
        $set: {
          typing: isTyping,
          typingUpdatedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );
    const conversation = await ConversationModel.findById(conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'presence.updated',
        conversationId,
        participantIds: conversation.participantIds,
        at: new Date().toISOString(),
      });
    }
    return state;
  }

  static async markRead(userId: string, conversationId: string, messageId?: string) {
    await MessagingService.ensureConversationAccessible(userId, conversationId);
    const latest = messageId
      ? await MessageModel.findOne({ _id: messageId, conversationId })
      : await MessageModel.findOne({ conversationId }).sort({ createdAt: -1 });
    if (!latest) {
      return null;
    }
    const state = await ConversationMemberStateModel.findOneAndUpdate(
      { conversationId, userId },
      {
        $set: {
          lastReadMessageId: latest.id,
          lastReadAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );
    await MessageModel.updateMany(
      { conversationId, _id: { $lte: latest._id } },
      { $addToSet: { readBy: userId } },
    );
    const conversation = await ConversationModel.findById(conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'presence.updated',
        conversationId,
        participantIds: conversation.participantIds,
        messageId: latest.id,
        at: new Date().toISOString(),
      });
    }
    return state;
  }

  static async listMessages(userId: string, conversationId: string, cursor?: string, limit = 50) {
    await MessagingService.ensureConversationAccessible(userId, conversationId);
    const query: Record<string, unknown> = { conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const items = await MessageModel.find(query).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 100));
    return items.reverse();
  }

  static async createMessage(
    userId: string,
    conversationId: string,
    payload: {
      content?: string;
      messageType?: 'text' | 'system' | 'image' | 'video' | 'audio' | 'file';
      replyToMessageId?: string;
      attachments?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name?: string; size?: number; mimeType?: string }>;
    },
  ) {
    const conversation = await MessagingService.ensureConversationAccessible(userId, conversationId);
    if (!payload.content?.trim() && !(payload.attachments?.length ?? 0)) {
      throw new BadRequestError('Message content or attachments are required');
    }

    const message = await MessageModel.create({
      conversationId,
      senderId: userId,
      content: payload.content?.trim() ?? '',
      messageType: payload.messageType ?? 'text',
      replyToMessageId: payload.replyToMessageId,
      attachments: payload.attachments ?? [],
      deliveredTo: conversation.participantIds,
      readBy: [userId],
      reactions: [],
      isEdited: false,
      isDeleted: false,
    });

    conversation.lastMessageId = message.id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    emitMessagingEvent({
      type: 'message.created',
      conversationId,
      participantIds: conversation.participantIds,
      messageId: message.id,
      at: new Date().toISOString(),
    });
    return message;
  }

  static async updateMessage(userId: string, messageId: string, payload: { content: string }) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');
    if (message.senderId !== userId) throw new BadRequestError('Cannot edit other user message');
    if (message.isDeleted) throw new BadRequestError('Cannot edit deleted message');

    message.content = payload.content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    const conversation = await ConversationModel.findById(message.conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'message.updated',
        conversationId: message.conversationId,
        participantIds: conversation.participantIds,
        messageId: message.id,
        at: new Date().toISOString(),
      });
    }
    return message;
  }

  static async deleteMessage(userId: string, messageId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');
    if (message.senderId !== userId) throw new BadRequestError('Cannot delete other user message');

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    message.attachments = [];
    await message.save();
    const conversation = await ConversationModel.findById(message.conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'message.deleted',
        conversationId: message.conversationId,
        participantIds: conversation.participantIds,
        messageId: message.id,
        at: new Date().toISOString(),
      });
    }
    return message;
  }

  static async addReaction(userId: string, messageId: string, emoji: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');
    await MessagingService.ensureConversationAccessible(userId, message.conversationId);

    const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
    if (existing) {
      if (!existing.userIds.includes(userId)) {
        existing.userIds.push(userId);
      }
    } else {
      message.reactions.push({ emoji, userIds: [userId] });
    }
    await message.save();
    const conversation = await ConversationModel.findById(message.conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'message.updated',
        conversationId: message.conversationId,
        participantIds: conversation.participantIds,
        messageId: message.id,
        at: new Date().toISOString(),
      });
    }
    return message;
  }

  static async removeReaction(userId: string, messageId: string, emoji: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');
    await MessagingService.ensureConversationAccessible(userId, message.conversationId);

    message.reactions = message.reactions
      .map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, userIds: reaction.userIds.filter((id) => id !== userId) }
          : reaction,
      )
      .filter((reaction) => reaction.userIds.length > 0);
    await message.save();
    const conversation = await ConversationModel.findById(message.conversationId).select('participantIds');
    if (conversation) {
      emitMessagingEvent({
        type: 'message.updated',
        conversationId: message.conversationId,
        participantIds: conversation.participantIds,
        messageId: message.id,
        at: new Date().toISOString(),
      });
    }
    return message;
  }
}

