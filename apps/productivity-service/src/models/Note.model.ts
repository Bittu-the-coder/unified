import { Schema, model } from 'mongoose';

export interface INote {
  userId: string;
  title?: string;
  content?: string;
  preview?: string;
  wordCount?: number;
  isPinned: boolean;
  isArchived: boolean;
  color?: string;
  notebookId?: string;
}

const schema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String },
    content: { type: String },
    preview: { type: String },
    wordCount: { type: Number },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    color: { type: String },
    notebookId: { type: String, index: true },
  },
  { timestamps: true },
);

schema.index({ userId: 1, updatedAt: -1 });
schema.index({ userId: 1, notebookId: 1 });

export const NoteModel = model<INote>('notes', schema);
