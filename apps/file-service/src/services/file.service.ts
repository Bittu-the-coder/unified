import crypto from 'crypto';
import { BadRequestError, NotFoundError } from '@unified/shared';
import { env } from '../config/env';
import { FileModel } from '../models/File.model';
import { FolderModel } from '../models/Folder.model';
import { StorageUsageModel } from '../models/StorageUsage.model';

const clampNonNegative = (value: number) => Math.max(0, value);

const ensureUsageDoc = async (userId: string) => {
  let usage = await StorageUsageModel.findOne({ userId });
  if (!usage) {
    usage = await StorageUsageModel.create({
      userId,
      usedBytes: 0,
      limitBytes: env.FREE_STORAGE_BYTES,
    });
  }
  return usage;
};

const ensureQuota = async (userId: string, bytesToAdd: number) => {
  if (bytesToAdd <= 0) {
    throw new BadRequestError('File size must be greater than zero');
  }
  const usage = await ensureUsageDoc(userId);
  const next = usage.usedBytes + bytesToAdd;
  if (next > usage.limitBytes) {
    throw new BadRequestError('Storage quota exceeded (250MB free plan)');
  }
  usage.usedBytes = next;
  await usage.save();
  return usage;
};

const decreaseQuota = async (userId: string, bytesToSubtract: number) => {
  const usage = await ensureUsageDoc(userId);
  usage.usedBytes = clampNonNegative(usage.usedBytes - clampNonNegative(bytesToSubtract));
  await usage.save();
  return usage;
};

export class FileService {
  static async getQuota(userId: string) {
    const usage = await ensureUsageDoc(userId);
    return {
      usedBytes: usage.usedBytes,
      limitBytes: usage.limitBytes,
      remainingBytes: clampNonNegative(usage.limitBytes - usage.usedBytes),
    };
  }

  static async listFiles(userId: string, input: { folderId?: string; search?: string; limit?: number }) {
    const query: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    if (input.folderId !== undefined) {
      query.parentFolderId = input.folderId;
    }
    if (input.search?.trim()) {
      const escaped = input.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ name: regex }, { originalName: regex }, { fileType: regex }];
    }
    return FileModel.find(query)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Math.max(input.limit ?? 30, 1), 100));
  }

  static async createFile(
    userId: string,
    input: {
      name: string;
      originalName: string;
      fileType: string;
      mimeType?: string;
      size: number;
      storageProvider: 'imagekit' | 'cloudinary';
      storagePath: string;
      publicUrl: string;
      thumbnailUrl?: string;
      hash?: string;
      parentFolderId?: string;
      description?: string;
      isPublic?: boolean;
    },
  ) {
    await ensureQuota(userId, input.size);
    try {
      const file = await FileModel.create({
        userId,
        name: input.name.trim(),
        originalName: input.originalName.trim(),
        description: input.description?.trim(),
        fileType: input.fileType.trim(),
        mimeType: input.mimeType,
        size: input.size,
        storageProvider: input.storageProvider,
        storagePath: input.storagePath.trim(),
        publicUrl: input.publicUrl.trim(),
        thumbnailUrl: input.thumbnailUrl,
        hash: input.hash,
        parentFolderId: input.parentFolderId,
        isPublic: Boolean(input.isPublic),
      });
      return file;
    } catch (err) {
      await decreaseQuota(userId, input.size);
      throw err;
    }
  }

  static async deleteFile(userId: string, fileId: string) {
    const file = await FileModel.findOne({ _id: fileId, userId, deletedAt: { $exists: false } });
    if (!file) {
      throw new NotFoundError('File not found');
    }
    file.deletedAt = new Date();
    await file.save();
    await decreaseQuota(userId, file.size);
  }

  static async listFolders(userId: string, parentFolderId?: string) {
    return FolderModel.find({
      userId,
      deletedAt: { $exists: false },
      ...(parentFolderId !== undefined ? { parentFolderId } : {}),
    }).sort({ updatedAt: -1 });
  }

  static async createFolder(userId: string, input: { name: string; description?: string; parentFolderId?: string }) {
    return FolderModel.create({
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      parentFolderId: input.parentFolderId,
    });
  }

  static async renameFolder(userId: string, folderId: string, input: { name: string; description?: string }) {
    const folder = await FolderModel.findOne({ _id: folderId, userId, deletedAt: { $exists: false } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }
    folder.name = input.name.trim();
    if (input.description !== undefined) {
      folder.description = input.description.trim();
    }
    await folder.save();
    return folder;
  }

  static async deleteFolder(userId: string, folderId: string) {
    const folder = await FolderModel.findOne({ _id: folderId, userId, deletedAt: { $exists: false } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    const hasChildren = await FolderModel.exists({
      userId,
      parentFolderId: folderId,
      deletedAt: { $exists: false },
    });
    const hasFiles = await FileModel.exists({
      userId,
      parentFolderId: folderId,
      deletedAt: { $exists: false },
    });
    if (hasChildren || hasFiles) {
      throw new BadRequestError('Folder is not empty');
    }

    folder.deletedAt = new Date();
    await folder.save();
  }

  static createUploadSignature(
    userId: string,
    input: {
      provider?: 'imagekit' | 'cloudinary';
      fileName: string;
      folder?: string;
    },
  ) {
    const provider = input.provider ?? env.DEFAULT_STORAGE_PROVIDER;
    const folder = (input.folder?.trim() || `unified/${userId}`).replace(/\/{2,}/g, '/');
    const safeFileName = input.fileName.trim().replace(/\s+/g, '-');

    if (provider === 'imagekit') {
      if (!env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
        throw new BadRequestError('ImageKit is not configured');
      }
      const expire = Math.floor(Date.now() / 1000) + 15 * 60;
      const token = crypto.randomBytes(12).toString('hex');
      const signature = crypto
        .createHmac('sha1', env.IMAGEKIT_PRIVATE_KEY)
        .update(`${token}${expire}`)
        .digest('hex');

      return {
        provider,
        uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
        params: {
          token,
          expire,
          signature,
          publicKey: env.IMAGEKIT_PUBLIC_KEY,
          fileName: safeFileName,
          folder: `/${folder}`,
          useUniqueFileName: true,
        },
      };
    }

    if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
      throw new BadRequestError('Cloudinary is not configured');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${folder}/${Date.now()}-${safeFileName}`;
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    return {
      provider,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      params: {
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        timestamp,
        signature,
        folder,
        public_id: publicId,
      },
    };
  }
}

