import { Schema, model } from 'mongoose';

export interface INotebook {
  userId: string;
  name: string;
  description?: string;
  parentNotebookId?: string;
  color?: string;
  icon?: string;
}

const schema = new Schema<INotebook>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    parentNotebookId: { type: String, index: true },
    color: { type: String },
    icon: { type: String },
  },
  { timestamps: true },
);

schema.index({ userId: 1, name: 1 }, { unique: true });

export const NotebookModel = model<INotebook>('notebooks', schema);
