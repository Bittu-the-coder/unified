import { Schema, model } from 'mongoose';

export interface IUserDevice {
  userId: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  lastActive?: Date;
  isTrusted: boolean;
  createdAt: Date;
}

const userDeviceSchema = new Schema<IUserDevice>(
  {
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String },
    deviceType: { type: String },
    lastActive: { type: Date },
    isTrusted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const UserDeviceModel = model<IUserDevice>('user_devices', userDeviceSchema);
