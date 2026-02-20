import { z } from 'zod';

export const createGroupConversationSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  participantIds: z.array(z.string().min(1)).min(1),
});

export const createDirectConversationSchema = z.object({
  participantId: z.string().min(1),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  messageType: z.enum(['text', 'system', 'image', 'video', 'audio', 'file']).optional(),
  replyToMessageId: z.string().min(1).optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'video', 'audio', 'file']),
        url: z.string().url(),
        name: z.string().optional(),
        size: z.number().int().positive().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const participantActionSchema = z.object({
  participantId: z.string().min(1),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(16),
});

export const memberStateSchema = z.object({
  value: z.boolean(),
});

export const markReadSchema = z.object({
  messageId: z.string().min(1).optional(),
});

export const typingSchema = z.object({
  isTyping: z.boolean(),
});
