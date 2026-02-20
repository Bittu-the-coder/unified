import { Schema, model } from 'mongoose';

export interface IConversation {
  type: 'direct' | 'group';
  createdBy: string;
  dmKey?: string;
  title?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
  adminIds: string[];
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['direct', 'group'], required: true, index: true },
    createdBy: { type: String, required: true, index: true },
    dmKey: { type: String, index: true },
    title: { type: String },
    description: { type: String },
    avatarUrl: { type: String },
    participantIds: { type: [String], required: true, index: true },
    adminIds: { type: [String], required: true, default: [] },
    lastMessageId: { type: String, index: true },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

schema.index({ participantIds: 1, updatedAt: -1 });
schema.index({ dmKey: 1 }, { unique: true, sparse: true });

export const ConversationModel = model<IConversation>('conversations', schema);
