import { Schema, model } from 'mongoose';

export interface IConversationMemberState {
  conversationId: string;
  userId: string;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  typing: boolean;
  typingUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IConversationMemberState>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    isMuted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    lastReadMessageId: { type: String },
    lastReadAt: { type: Date },
    typing: { type: Boolean, default: false },
    typingUpdatedAt: { type: Date },
  },
  { timestamps: true },
);

schema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationMemberStateModel = model<IConversationMemberState>('conversation_member_states', schema);
