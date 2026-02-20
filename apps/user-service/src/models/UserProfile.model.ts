import { Schema, model } from 'mongoose';

export interface IUserProfile {
  authUserId: string;
  uniqueNumber?: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUserProfile>(
  {
    authUserId: { type: String, required: true, unique: true, index: true },
    uniqueNumber: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    bio: { type: String },
    avatarUrl: { type: String },
    preferences: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const UserProfileModel = model<IUserProfile>('users', schema);
