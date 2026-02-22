'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fileCloudApi, type CloudFile, type CloudFolder, type CloudQuota } from '@/lib/api';
import { CornerUpLeft, FolderPlus, HardDrive, Search, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FileGrid } from '@/components/file-cloud/file-grid';
import { FolderTreeComponent } from '@/components/file-cloud/folder-tree';
import { StoragePanel } from '@/components/file-cloud/storage-panel';
import { UploadZone } from '@/components/file-cloud/upload-zone';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

type DragPayload = { kind: 'file' | 'folder'; id: string };

export function FileCloudWorkspace({ onError, onSuccess }: { onError: (msg: string) => void; onSuccess: (msg: string) => void }) {
  const folderStorageKey = 'unified:filecloud:current-folder';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [quota, setQuota] = useState<CloudQuota | null>(null);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<CloudFolder[]>([]);
  const [search, setSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [provider, setProvider] = useState<'imagekit' | 'cloudinary'>('imagekit');
  const [dragOverUpload, setDragOverUpload] = useState(false);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderStateReady, setFolderStateReady] = useState(false);

  const parseDragPayload = (e: React.DragEvent) => { try { return JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload; } catch { return null; } };

  const loadBreadcrumbs = async (folderId?: string) => {
    if (!folderId) return setBreadcrumbs([]);
    const chain: CloudFolder[] = [];
    let cursor: string | undefined = folderId;
    while (cursor) {
      const folder = await fileCloudApi.getFolder(cursor);
      chain.unshift(folder); cursor = folder.parentFolderId;
    }
    setBreadcrumbs(chain);
  };

  const loadDirectory = async (folderId = currentFolderId) => {
    if (folderId) {
      try { await fileCloudApi.getFolder(folderId); }
      catch {
        setCurrentFolderId(undefined); setBreadcrumbs([]);
        if (typeof window !== 'undefined') window.localStorage.removeItem(folderStorageKey);
        const [q, fData, fileData] = await Promise.all([ fileCloudApi.quota(), fileCloudApi.listFolders(undefined), fileCloudApi.listFiles({ folderId: undefined, search: search.trim() || undefined }) ]);
        setQuota(q); setFolders(fData); setFiles(fileData);
        onError('Previous folder no longer exists. Moved to root.');
        return;
      }
    }

    const [q, fData, fileData] = await Promise.all([ fileCloudApi.quota(), fileCloudApi.listFolders(folderId), fileCloudApi.listFiles({ folderId, search: search.trim() || undefined }) ]);
    setQuota(q); setFolders(fData); setFiles(fileData);
    await loadBreadcrumbs(folderId);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(folderStorageKey)?.trim();
    setCurrentFolderId(saved || undefined); setFolderStateReady(true);
  }, []);

  useEffect(() => {
    if (!folderStateReady || typeof window === 'undefined') return;
    if (!currentFolderId) window.localStorage.removeItem(folderStorageKey);
    else window.localStorage.setItem(folderStorageKey, currentFolderId);
  }, [currentFolderId, folderStateReady]);

  useEffect(() => {
    if (!folderStateReady) return;
    const run = async () => { try { setLoading(true); await loadDirectory(); } catch (err) { onError((err as Error).message); } finally { setLoading(false); } };
    void run();
  }, [currentFolderId, folderStateReady]);

  const onSearch = async () => { try { await loadDirectory(); } catch (err) { onError((err as Error).message); } };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try { await fileCloudApi.createFolder({ name: newFolderName.trim(), parentFolderId: currentFolderId }); setNewFolderName(''); await loadDirectory(); onSuccess('Folder created'); }
    catch (err) { onError((err as Error).message); }
  };

  const deleteFolder = async (id: string) => {
    if (!window.confirm('Delete folder? Must be empty.')) return;
    try { await fileCloudApi.deleteFolder(id); await loadDirectory(); onSuccess('Folder deleted'); }
    catch (err) { onError((err as Error).message); }
  };

  const deleteFile = async (id: string) => {
    if (!window.confirm('Delete file?')) return;
    try { await fileCloudApi.deleteFile(id); await loadDirectory(); onSuccess('File deleted'); }
    catch (err) { onError((err as Error).message); }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (!filesToUpload.length) return;
    setUploading(true);
    setUploadProgress({});

    try {
      for (const f of filesToUpload) {
        if (provider === 'imagekit' && f.size > 25 * 1024 * 1024) {
          throw new Error(`File ${f.name} exceeds ImageKit's 25MB free tier limit.`);
        }
        if (provider === 'cloudinary' && f.size > 100 * 1024 * 1024) {
          throw new Error(`File ${f.name} exceeds Cloudinary's 100MB limit.`);
        }
        if (provider === 'cloudinary' && f.size > 20 * 1024 * 1024 && !f.type.startsWith('video/')) {
          throw new Error(`File ${f.name} exceeds Cloudinary's 20MB limit for non-video files.`);
        }

        setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
        const sig = await fileCloudApi.createUploadSignature({ provider, fileName: f.name });
        const fd = new FormData(); fd.append('file', f);
        if (sig.provider === 'imagekit') { Object.entries(sig.params).forEach(([k, v]) => fd.append(k, String(v))); }
        else { fd.append('api_key', String(sig.params.apiKey)); fd.append('timestamp', String(sig.params.timestamp)); fd.append('signature', String(sig.params.signature)); fd.append('folder', String(sig.params.folder)); fd.append('public_id', String(sig.params.public_id)); }

        const res = await axios.post(sig.uploadUrl, fd, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [f.name]: percentCompleted }));
            }
          }
        });

        const up = res.data;
        const pubUrl = String(up.url ?? up.secure_url ?? up.filePath ?? '');
        if (!pubUrl) throw new Error(`Upload URL missing for ${f.name}`);

        await fileCloudApi.createFile({
          name: f.name, originalName: f.name, fileType: f.type || 'application/octet-stream', mimeType: f.type || undefined, size: f.size, storageProvider: sig.provider, providerFileId: String(up.fileId ?? up.public_id ?? '').trim() || undefined,
          providerResourceType: up.resource_type === 'image' || up.resource_type === 'video' || up.resource_type === 'raw' ? up.resource_type : undefined,
          storagePath: String(up.filePath ?? up.public_id ?? f.name), publicUrl: pubUrl, thumbnailUrl: up.thumbnail_url ? String(up.thumbnail_url) : undefined, parentFolderId: currentFolderId,
        });

        setUploadProgress(prev => ({ ...prev, [f.name]: 100 }));
      }
      await loadDirectory(); onSuccess('Files uploaded');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || (err as Error).message;
      onError(msg);
    }
    finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const moveItem = async (p: DragPayload, to: string | null) => {
    if (p.kind === 'file') await fileCloudApi.updateFile(p.id, { parentFolderId: to });
    else await fileCloudApi.updateFolder(p.id, { parentFolderId: to });
  };

  const onDropToFolder = async (e: React.DragEvent, fid: string) => {
    e.preventDefault(); setDragOverFolderId(null); const p = parseDragPayload(e); if (!p) return;
    try { await moveItem(p, fid); await loadDirectory(); onSuccess('Item moved'); } catch(err) { onError((err as Error).message); }
  };
  const onDropToRoot = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOverRoot(false); const p = parseDragPayload(e); if (!p) return;
    try { await moveItem(p, null); await loadDirectory(); onSuccess('Item moved to root'); } catch(err) { onError((err as Error).message); }
  };
  const onDropUpload = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOverUpload(false);
    const dropped = Array.from(e.dataTransfer.files ?? []); if(dropped.length) await uploadFiles(dropped);
  };

  const goUp = () => {
    if (!currentFolderId) return;
    if (breadcrumbs.length <= 1) setCurrentFolderId(undefined);
    else setCurrentFolderId(breadcrumbs[breadcrumbs.length - 2]?._id);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <Card className="glass-card border-border/40 shadow-xl overflow-hidden min-h-[calc(100vh-8rem)]">
        <CardHeader className="border-b border-border/30 bg-surface/50 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <HardDrive className="h-6 w-6 text-accent" /> Unified Drive
              </CardTitle>
              <CardDescription className="text-sm mt-1 opacity-80">Professional file workspace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] h-full min-h-[600px]">
            <aside className="border-b border-border/40 bg-muted/10 p-5 lg:border-b-0 lg:border-r space-y-6">
              <StoragePanel quota={quota} provider={provider} setProvider={setProvider} />
              <FolderTreeComponent
                folders={folders} currentFolderId={currentFolderId} setCurrentFolderId={setCurrentFolderId}
                onDropToFolder={onDropToFolder} deleteFolder={deleteFolder} onDropToRoot={onDropToRoot}
                dragOverRoot={dragOverRoot} setDragOverRoot={setDragOverRoot} dragOverFolderId={dragOverFolderId} setDragOverFolderId={setDragOverFolderId}
              />
            </aside>
            <main className="min-w-0 p-5 md:p-6 bg-surface/20 flex flex-col">
              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-10 border-border/50 bg-background/50 shadow-sm transition-all focus:bg-background" placeholder="Search in current folder" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
                </div>
                <Button variant="secondary" onClick={onSearch} className="w-full lg:w-32 h-10">Search</Button>
                <Button variant="outline" onClick={goUp} disabled={!currentFolderId} className="w-full lg:w-auto h-10 border-border/60 hover:bg-muted/50 transition-colors" title="Go one level up"><CornerUpLeft className="mr-2 h-4 w-4" />Up</Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full lg:w-auto h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:-translate-y-0.5"><Upload className="mr-2 h-4 w-4" />Upload</Button>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input placeholder="New folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} className="h-10 border-border/50 bg-background/50 shadow-sm" />
                <Button onClick={createFolder} className="w-full sm:w-auto h-10 border border-border/50 bg-surface hover:bg-muted/60 text-foreground transition-colors shadow-sm"><FolderPlus className="mr-2 h-4 w-4 text-accent" />New Folder</Button>
              </div>

              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={async (e) => { const s = Array.from(e.target.files ?? []); e.currentTarget.value = ''; await uploadFiles(s); }} />

              <UploadZone dragOver={dragOverUpload} setDragOver={setDragOverUpload} onDrop={onDropUpload} />

              <div className="mb-4 rounded-xl border border-border/40 bg-background/40 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-widest shadow-inner shadow-black/5">
                Path: <span className="text-foreground ml-2 capitalize tracking-normal text-sm font-semibold">{breadcrumbs.length ? ['Root', ...breadcrumbs.map(f => f.name)].join(' / ') : 'Root'}</span>
              </div>

              {Object.keys(uploadProgress).length > 0 && (
                <div className="mb-6 space-y-3 rounded-xl border border-border/40 bg-surface p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent animate-pulse" /> Uploading Files...
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                          <span className="truncate max-w-[70%]">{fileName}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FileGrid
                folders={folders} files={files} loading={loading} dragOverFolderId={dragOverFolderId} setDragOverFolderId={setDragOverFolderId}
                onDropToFolder={onDropToFolder} deleteFolder={deleteFolder} deleteFile={deleteFile} setCurrentFolderId={setCurrentFolderId}
              />
            </main>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
