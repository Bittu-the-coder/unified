import { Schema, model } from 'mongoose';

export interface ITimeEntry {
  userId: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isManual: boolean;
}

const schema = new Schema<ITimeEntry>(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: String, index: true },
    description: { type: String },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    duration: { type: Number },
    isManual: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ userId: 1, startTime: -1 });

export const TimeEntryModel = model<ITimeEntry>('time_entries', schema);
