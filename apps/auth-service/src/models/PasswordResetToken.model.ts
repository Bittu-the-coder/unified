import { Schema, model } from 'mongoose';

export interface IPasswordResetToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

export const PasswordResetTokenModel = model<IPasswordResetToken>('password_reset_tokens', passwordResetTokenSchema);
