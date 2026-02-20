import { Schema, model } from 'mongoose';

export interface IFocusGoal {
  userId: string;
  name: string;
  targetHours: number;
  period: 'daily' | 'weekly' | 'monthly';
  progressHours: number;
  startDate: Date;
  endDate: Date;
}

const schema = new Schema<IFocusGoal>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetHours: { type: Number, required: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    progressHours: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
);

schema.index({ userId: 1, endDate: 1 });

export const FocusGoalModel = model<IFocusGoal>('focus_goals', schema);
