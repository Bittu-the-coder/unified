import { Schema, model } from 'mongoose';

export interface IMessageReaction {
  emoji: string;
  userIds: string[];
}

export interface IMessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface IMessage {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'system' | 'image' | 'video' | 'audio' | 'file';
  replyToMessageId?: string;
  attachments: IMessageAttachment[];
  deliveredTo: string[];
  readBy: string[];
  reactions: IMessageReaction[];
  editedAt?: Date;
  deletedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'system', 'image', 'video', 'audio', 'file'], default: 'text' },
    replyToMessageId: { type: String, index: true },
    attachments: {
      type: [
        {
          type: { type: String, enum: ['image', 'video', 'audio', 'file'], required: true },
          url: { type: String, required: true },
          name: { type: String },
          size: { type: Number },
          mimeType: { type: String },
        },
      ],
      default: [],
    },
    deliveredTo: { type: [String], default: [] },
    readBy: { type: [String], default: [] },
    reactions: {
      type: [
        {
          emoji: { type: String, required: true },
          userIds: { type: [String], required: true, default: [] },
        },
      ],
      default: [],
    },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel = model<IMessage>('messages', schema);
