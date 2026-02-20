import { Schema, model } from 'mongoose';

export interface IFile {
  userId: string;
  name: string;
  originalName: string;
  description?: string;
  fileType: string;
  mimeType?: string;
  size: number;
  storageProvider: 'imagekit' | 'cloudinary';
  providerFileId?: string;
  providerResourceType?: 'image' | 'video' | 'raw';
  storagePath: string;
  publicUrl: string;
  thumbnailUrl?: string;
  hash?: string;
  isPublic: boolean;
  isStarred: boolean;
  version: number;
  parentFolderId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const fileSchema = new Schema<IFile>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    description: { type: String },
    fileType: { type: String, required: true, index: true },
    mimeType: { type: String },
    size: { type: Number, required: true },
    storageProvider: { type: String, enum: ['imagekit', 'cloudinary'], required: true },
    providerFileId: { type: String, index: true },
    providerResourceType: { type: String, enum: ['image', 'video', 'raw'] },
    storagePath: { type: String, required: true },
    publicUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    hash: { type: String, index: true },
    isPublic: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1 },
    parentFolderId: { type: String, index: true },
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

fileSchema.index({ userId: 1, parentFolderId: 1, deletedAt: 1 });
fileSchema.index({ userId: 1, fileType: 1, deletedAt: 1 });
fileSchema.index({ userId: 1, createdAt: -1 });

export const FileModel = model<IFile>('files', fileSchema);
