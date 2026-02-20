import { Schema, model } from 'mongoose';

export interface ITaskCategory {
  userId: string;
  name: string;
  color?: string;
  icon?: string;
}

const schema = new Schema<ITaskCategory>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String },
    icon: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ userId: 1, name: 1 }, { unique: true });

export const TaskCategoryModel = model<ITaskCategory>('task_categories', schema);
