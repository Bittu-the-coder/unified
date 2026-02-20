import { Schema, model } from 'mongoose';

export interface ITaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

const schema = new Schema<ITaskDependency>(
  {
    taskId: { type: String, required: true, index: true },
    dependsOnTaskId: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ taskId: 1, dependsOnTaskId: 1 }, { unique: true });

export const TaskDependencyModel = model<ITaskDependency>('task_dependencies', schema);
