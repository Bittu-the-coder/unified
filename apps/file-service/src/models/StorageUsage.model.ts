import { Schema, model } from 'mongoose';

export interface IStorageUsage {
  userId: string;
  usedBytes: number;
  limitBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IStorageUsage>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    usedBytes: { type: Number, required: true, default: 0 },
    limitBytes: { type: Number, required: true },
  },
  { timestamps: true },
);

export const StorageUsageModel = model<IStorageUsage>('storage_usages', schema);

