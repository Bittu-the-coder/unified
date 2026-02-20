import { Schema, model } from 'mongoose';

export interface ITodo {
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  isRecurring: boolean;
  recurrencePattern?: Record<string, unknown>;
  parentTaskId?: string;
  categoryId?: string;
}

const schema = new Schema<ITodo>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    dueDate: { type: Date },
    completedAt: { type: Date },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { type: Schema.Types.Mixed },
    parentTaskId: { type: String, index: true },
    categoryId: { type: String, index: true },
  },
  { timestamps: true },
);

schema.index({ userId: 1, status: 1 });
schema.index({ userId: 1, dueDate: 1 });
schema.index({ userId: 1, categoryId: 1 });
schema.index({ userId: 1, parentTaskId: 1 });

export const TodosModel = model<ITodo>('tasks', schema);
