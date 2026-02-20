import { Schema, model } from 'mongoose';

export interface IProgressRecorder {
  userId: string;
  todoId?: string;
  activityType: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

const schema = new Schema<IProgressRecorder>(
  {
    userId: { type: String, required: true, index: true },
    todoId: { type: String, index: true },
    activityType: { type: String, required: true, index: true },
    durationSeconds: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ userId: 1, createdAt: -1 });

export const ProgressRecorderModel = model<IProgressRecorder>('feature_usage', schema);
