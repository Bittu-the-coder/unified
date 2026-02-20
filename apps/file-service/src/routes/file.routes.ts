import { Router } from 'express';
import { requireAuth, validateBody, validateQuery } from '@unified/shared';
import { FileController } from '../controllers/file.controller';
import {
  createFileSchema,
  createFolderSchema,
  createUploadSignatureSchema,
  listFilesQuerySchema,
  updateFolderSchema,
} from '../validators/file.validators';

export const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.get('/quota', FileController.quota);
fileRouter.get('/files', validateQuery(listFilesQuerySchema), FileController.listFiles);
fileRouter.post('/upload/signature', validateBody(createUploadSignatureSchema), FileController.createUploadSignature);
fileRouter.post('/files', validateBody(createFileSchema), FileController.createFile);
fileRouter.delete('/files/:id', FileController.deleteFile);

fileRouter.get('/folders', FileController.listFolders);
fileRouter.post('/folders', validateBody(createFolderSchema), FileController.createFolder);
fileRouter.patch('/folders/:id', validateBody(updateFolderSchema), FileController.updateFolder);
fileRouter.delete('/folders/:id', FileController.deleteFolder);

