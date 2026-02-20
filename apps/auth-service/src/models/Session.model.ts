import { Schema, model } from 'mongoose';

export interface ISession {
  userId: string;
  refreshToken: string;
  accessToken?: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String },
    deviceInfo: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export const SessionModel = model<ISession>('sessions', sessionSchema);
