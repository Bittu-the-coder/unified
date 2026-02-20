import { Schema, model } from 'mongoose';

export interface INoteVersion {
  noteId: string;
  content: string;
  versionNumber: number;
  createdBy: string;
}

const schema = new Schema<INoteVersion>(
  {
    noteId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ noteId: 1, versionNumber: 1 }, { unique: true });

export const NoteVersionModel = model<INoteVersion>('note_versions', schema);
