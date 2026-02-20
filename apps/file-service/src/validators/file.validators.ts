import { z } from 'zod';

export const listFilesQuerySchema = z.object({
  folderId: z.string().min(1).optional(),
  search: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createUploadSignatureSchema = z.object({
  provider: z.enum(['imagekit', 'cloudinary']).optional(),
  fileName: z.string().min(1).max(500),
  folder: z.string().min(1).max(500).optional(),
});

export const createFileSchema = z.object({
  name: z.string().min(1).max(500),
  originalName: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  fileType: z.string().min(1).max(100),
  mimeType: z.string().max(100).optional(),
  size: z.coerce.number().int().positive(),
  storageProvider: z.enum(['imagekit', 'cloudinary']),
  providerFileId: z.string().max(255).optional(),
  providerResourceType: z.enum(['image', 'video', 'raw']).optional(),
  storagePath: z.string().min(1).max(1200),
  publicUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  hash: z.string().max(255).optional(),
  parentFolderId: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  parentFolderId: z.string().min(1).optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
}).refine((v) => v.name !== undefined || v.description !== undefined || v.parentFolderId !== undefined, {
  message: 'At least one field is required',
});

export const updateFileSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
  isPublic: z.boolean().optional(),
  isStarred: z.boolean().optional(),
}).refine((v) => v.name !== undefined || v.description !== undefined || v.parentFolderId !== undefined || v.isPublic !== undefined || v.isStarred !== undefined, {
  message: 'At least one field is required',
});
