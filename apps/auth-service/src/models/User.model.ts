import { Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  username: string;
  fullName: string;
  uniqueNumber: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    uniqueNumber: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('users', userSchema);
