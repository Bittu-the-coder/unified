import { Schema, model } from 'mongoose';

export interface IUserBlock {
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
}

const schema = new Schema<IUserBlock>(
  {
    blockerId: { type: String, required: true, index: true },
    blockedId: { type: String, required: true, index: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const UserBlockModel = model<IUserBlock>('user_blocks', schema);
