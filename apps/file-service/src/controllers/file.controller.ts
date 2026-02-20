import type { Response } from 'express';
import { ok, type AuthenticatedRequest } from '@unified/shared';
import { FileService } from '../services/file.service';

export class FileController {
  static async quota(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.getQuota(req.user!.id);
    return ok(res, data, 'Storage quota fetched');
  }

  static async listFiles(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.listFiles(req.user!.id, {
      folderId: req.query.folderId ? String(req.query.folderId) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return ok(res, data, 'Files fetched');
  }

  static async createUploadSignature(req: AuthenticatedRequest, res: Response) {
    const data = FileService.createUploadSignature(req.user!.id, req.body);
    return ok(res, data, 'Upload signature generated');
  }

  static async createFile(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.createFile(req.user!.id, req.body);
    return ok(res, data, 'File created', 201);
  }

  static async deleteFile(req: AuthenticatedRequest, res: Response) {
    await FileService.deleteFile(req.user!.id, String(req.params.id));
    return ok(res, null, 'File deleted');
  }

  static async listFolders(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.listFolders(
      req.user!.id,
      req.query.parentFolderId ? String(req.query.parentFolderId) : undefined,
    );
    return ok(res, data, 'Folders fetched');
  }

  static async createFolder(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.createFolder(req.user!.id, req.body);
    return ok(res, data, 'Folder created', 201);
  }

  static async updateFolder(req: AuthenticatedRequest, res: Response) {
    const data = await FileService.renameFolder(req.user!.id, String(req.params.id), req.body);
    return ok(res, data, 'Folder updated');
  }

  static async deleteFolder(req: AuthenticatedRequest, res: Response) {
    await FileService.deleteFolder(req.user!.id, String(req.params.id));
    return ok(res, null, 'Folder deleted');
  }
}

