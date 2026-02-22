import crypto from 'crypto';
import { BadRequestError, NotFoundError } from '../../shared/dist/index';
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
  private static imageKitAuthHeader() {
    if (!env.IMAGEKIT_PRIVATE_KEY) {
      throw new BadRequestError('ImageKit is not configured');
    }
    const auth = Buffer.from(`${env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
    return { Authorization: `Basic ${auth}` };
  }

  private static parseStoragePathParts(input: { storagePath: string; publicUrl: string }) {
    const normalizedStoragePath = input.storagePath?.trim() || '';
    const fromUrlPath = (() => {
      try {
        const parsed = new URL(input.publicUrl);
        return decodeURIComponent(parsed.pathname || '');
      } catch {
        return '';
      }
    })();

    const raw = normalizedStoragePath || fromUrlPath;
    const cleaned = raw.replace(/^\/+/, '');
    const segments = cleaned.split('/').filter(Boolean);
    const name = segments.length ? segments[segments.length - 1] : '';
    const folder = segments.length > 1 ? `/${segments.slice(0, -1).join('/')}` : '/';
    const fullPath = cleaned ? `/${cleaned}` : '';
    return { folder, name, fullPath };
  }

  private static async resolveImageKitFileIdByPath(input: { storagePath: string; publicUrl: string }) {
    const { folder, name, fullPath } = FileService.parseStoragePathParts(input);
    if (!name) return undefined;

    const response = await fetch(
      `https://api.imagekit.io/v1/files?path=${encodeURIComponent(folder)}&limit=100`,
      {
        method: 'GET',
        headers: FileService.imageKitAuthHeader(),
      },
    );
    if (!response.ok) return undefined;

    const rows = (await response.json()) as Array<{ fileId?: string; name?: string; filePath?: string }>;
    const matched = rows.find((row) => row.filePath === fullPath || row.name === name);
    return matched?.fileId;
  }

  private static async resolveImageKitFileId(file: { providerFileId?: string; storagePath: string; publicUrl: string }) {
    if (file.providerFileId) {
      return file.providerFileId;
    }

    const byPath = await FileService.resolveImageKitFileIdByPath(file);
    if (byPath) {
      return byPath;
    }

    const fromUrl = (() => {
      try {
        const parsed = new URL(file.publicUrl);
        const name = parsed.pathname.split('/').pop();
        return name ? decodeURIComponent(name) : '';
      } catch {
        return '';
      }
    })();

    const candidates = Array.from(
      new Set(
        [file.storagePath, fromUrl]
          .map((v) => v.trim())
          .filter(Boolean)
          .flatMap((v) => (v.startsWith('/') ? [v, v.slice(1)] : [v, `/${v}`])),
      ),
    );

    for (const candidate of candidates) {
      const safe = candidate.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const searchQuery = `filePath = "${safe}" OR name = "${safe}"`;
      const response = await fetch(
        `https://api.imagekit.io/v1/files?searchQuery=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          method: 'GET',
          headers: FileService.imageKitAuthHeader(),
        },
      );
      if (!response.ok) {
        continue;
      }
      const data = (await response.json()) as Array<{ fileId?: string }>;
      const fileId = data[0]?.fileId;
      if (fileId) {
        return fileId;
      }
    }

    throw new BadRequestError('Missing ImageKit file id for deletion');
  }

  private static async deleteFromImageKit(file: { providerFileId?: string }) {
    const initialFileId = await FileService.resolveImageKitFileId({
      providerFileId: file.providerFileId,
      storagePath: (file as { storagePath?: string }).storagePath ?? '',
      publicUrl: (file as { publicUrl?: string }).publicUrl ?? '',
    });
    const deleteById = async (fileId: string) =>
      fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: FileService.imageKitAuthHeader(),
      });

    let response = await deleteById(initialFileId);
    if (response.ok || response.status === 404) {
      return;
    }

    const fallbackId = await FileService.resolveImageKitFileId({
      storagePath: (file as { storagePath?: string }).storagePath ?? '',
      publicUrl: (file as { publicUrl?: string }).publicUrl ?? '',
    });
    if (fallbackId !== initialFileId) {
      response = await deleteById(fallbackId);
      if (response.ok || response.status === 404) {
        return;
      }
    }

    throw new BadRequestError('Failed to delete file from ImageKit');
  }

  private static async deleteFromCloudinary(file: {
    providerFileId?: string;
    storagePath: string;
    providerResourceType?: 'image' | 'video' | 'raw';
  }) {
    if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_CLOUD_NAME) {
      throw new BadRequestError('Cloudinary is not configured');
    }
    const publicId = file.providerFileId || file.storagePath;
    if (!publicId) {
      throw new BadRequestError('Missing Cloudinary public id for deletion');
    }
    const resourceType = file.providerResourceType ?? 'raw';
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const form = new URLSearchParams();
    form.set('public_id', publicId);
    form.set('timestamp', String(timestamp));
    form.set('api_key', env.CLOUDINARY_API_KEY);
    form.set('signature', signature);
    form.set('invalidate', 'true');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      },
    );
    if (!response.ok) {
      throw new BadRequestError('Failed to delete file from Cloudinary');
    }
  }

  private static async deleteFromProvider(file: {
    storageProvider: 'imagekit' | 'cloudinary';
    providerFileId?: string;
    storagePath: string;
    publicUrl: string;
    providerResourceType?: 'image' | 'video' | 'raw';
  }) {
    if (file.storageProvider === 'imagekit') {
      await FileService.deleteFromImageKit(file);
      return;
    }
    await FileService.deleteFromCloudinary(file);
  }

  private static async ensureFolderExists(userId: string, folderId: string) {
    const folder = await FolderModel.findOne({ _id: folderId, userId, deletedAt: { $exists: false } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }
    return folder;
  }

  private static normalizeParentFolderId(parentFolderId?: string | null) {
    if (parentFolderId === undefined) return undefined;
    if (parentFolderId === null) return null;
    const trimmed = parentFolderId.trim();
    return trimmed ? trimmed : null;
  }

  private static async getParentFolderId(userId: string, folderId: string): Promise<string | undefined> {
    const doc = await FolderModel.findOne({
      _id: folderId,
      userId,
      deletedAt: { $exists: false },
    }).select('parentFolderId');
    if (!doc) {
      return undefined;
    }
    const parentFolderId = (doc as unknown as { parentFolderId?: string }).parentFolderId;
    return parentFolderId || undefined;
  }

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
    } else {
      query.parentFolderId = { $exists: false };
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
      providerFileId?: string;
      providerResourceType?: 'image' | 'video' | 'raw';
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
        providerFileId: input.providerFileId,
        providerResourceType: input.providerResourceType,
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

  static async updateFile(
    userId: string,
    fileId: string,
    input: {
      name?: string;
      description?: string;
      parentFolderId?: string | null;
      isPublic?: boolean;
      isStarred?: boolean;
    },
  ) {
    const file = await FileModel.findOne({ _id: fileId, userId, deletedAt: { $exists: false } });
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (input.name !== undefined) file.name = input.name.trim();
    if (input.description !== undefined) file.description = input.description.trim();
    if (input.isPublic !== undefined) file.isPublic = input.isPublic;
    if (input.isStarred !== undefined) file.isStarred = input.isStarred;

    const normalizedParent = FileService.normalizeParentFolderId(input.parentFolderId);
    if (normalizedParent !== undefined) {
      if (normalizedParent === null) {
        file.parentFolderId = undefined;
      } else {
        await FileService.ensureFolderExists(userId, normalizedParent);
        file.parentFolderId = normalizedParent;
      }
    }
    await file.save();
    return file;
  }

  static async deleteFile(userId: string, fileId: string) {
    const file = await FileModel.findOne({ _id: fileId, userId, deletedAt: { $exists: false } });
    if (!file) {
      throw new NotFoundError('File not found');
    }
    await FileService.deleteFromProvider({
      storageProvider: file.storageProvider,
      providerFileId: file.providerFileId,
      providerResourceType: file.providerResourceType,
      storagePath: file.storagePath,
      publicUrl: file.publicUrl,
    });
    file.deletedAt = new Date();
    await file.save();
    await decreaseQuota(userId, file.size);
  }

  static async listFolders(userId: string, parentFolderId?: string) {
    return FolderModel.find({
      userId,
      deletedAt: { $exists: false },
      ...(parentFolderId !== undefined ? { parentFolderId } : { parentFolderId: { $exists: false } }),
    }).sort({ updatedAt: -1 });
  }

  static async getFolder(userId: string, folderId: string) {
    return FileService.ensureFolderExists(userId, folderId);
  }

  static async createFolder(userId: string, input: { name: string; description?: string; parentFolderId?: string }) {
    return FolderModel.create({
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      parentFolderId: input.parentFolderId,
    });
  }

  static async renameFolder(
    userId: string,
    folderId: string,
    input: { name?: string; description?: string; parentFolderId?: string | null },
  ) {
    const folder = await FolderModel.findOne({ _id: folderId, userId, deletedAt: { $exists: false } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    if (input.name !== undefined) {
      folder.name = input.name.trim();
    }
    if (input.description !== undefined) {
      folder.description = input.description.trim();
    }

    const normalizedParent = FileService.normalizeParentFolderId(input.parentFolderId);
    if (normalizedParent !== undefined) {
      if (normalizedParent === folderId) {
        throw new BadRequestError('Folder cannot be moved into itself');
      }

      if (normalizedParent === null) {
        folder.parentFolderId = undefined;
      } else {
        await FileService.ensureFolderExists(userId, normalizedParent);
        let cursor: string | undefined = normalizedParent;
        while (cursor) {
          if (cursor === folderId) {
            throw new BadRequestError('Cannot move folder into one of its children');
          }
          cursor = await FileService.getParentFolderId(userId, cursor);
        }
        folder.parentFolderId = normalizedParent;
      }
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

