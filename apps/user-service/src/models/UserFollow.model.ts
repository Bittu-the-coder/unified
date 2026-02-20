import { Schema, model } from 'mongoose';

export interface IUserFollow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const schema = new Schema<IUserFollow>(
  {
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const UserFollowModel = model<IUserFollow>('user_follows', schema);
