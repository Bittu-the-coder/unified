import { Schema, model } from 'mongoose';

export interface IFolder {
  userId: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  isStarred: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    parentFolderId: { type: String, index: true },
    isStarred: { type: Boolean, default: false, index: true },
    isPublic: { type: Boolean, default: false },
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

folderSchema.index({ userId: 1, parentFolderId: 1, name: 1, deletedAt: 1 }, { unique: true });

export const FolderModel = model<IFolder>('folders', folderSchema);

