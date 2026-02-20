import { Schema, model } from 'mongoose';

export interface IPomodoroSession {
  userId: string;
  taskId?: string;
  sessionType: 'focus' | 'short_break' | 'long_break';
  duration: number;
  completedDuration?: number;
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

const schema = new Schema<IPomodoroSession>(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: String, index: true },
    sessionType: { type: String, enum: ['focus', 'short_break', 'long_break'], required: true },
    duration: { type: Number, required: true },
    completedDuration: { type: Number },
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ userId: 1, startedAt: -1 });

export const PomodoroSessionModel = model<IPomodoroSession>('pomodoro_sessions', schema);
