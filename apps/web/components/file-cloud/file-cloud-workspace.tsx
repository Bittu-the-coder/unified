'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fileCloudApi, type CloudFile, type CloudFolder, type CloudQuota } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  CloudUpload,
  CornerUpLeft,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  HardDrive,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type FileCloudWorkspaceProps = {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

type DragPayload = {
  kind: 'file' | 'folder';
  id: string;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '-';
  }
};

export function FileCloudWorkspace({ onError, onSuccess }: FileCloudWorkspaceProps) {
  const folderStorageKey = 'unified:filecloud:current-folder';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  const usagePercent = useMemo(() => {
    if (!quota || quota.limitBytes <= 0) return 0;
    return Math.min(100, Math.round((quota.usedBytes / quota.limitBytes) * 100));
  }, [quota]);

  const parseDragPayload = (event: React.DragEvent) => {
    try {
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) return null;
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  };

  const loadBreadcrumbs = async (folderId?: string) => {
    if (!folderId) {
      setBreadcrumbs([]);
      return;
    }

    const chain: CloudFolder[] = [];
    let cursor: string | undefined = folderId;
    while (cursor) {
      const folder = await fileCloudApi.getFolder(cursor);
      chain.unshift(folder);
      cursor = folder.parentFolderId;
    }
    setBreadcrumbs(chain);
  };

  const loadDirectory = async (folderId = currentFolderId) => {
    if (folderId) {
      try {
        await fileCloudApi.getFolder(folderId);
      } catch {
        setCurrentFolderId(undefined);
        setBreadcrumbs([]);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(folderStorageKey);
        }
        const [quotaData, folderData, fileData] = await Promise.all([
          fileCloudApi.quota(),
          fileCloudApi.listFolders(undefined),
          fileCloudApi.listFiles({ folderId: undefined, search: search.trim() || undefined }),
        ]);
        setQuota(quotaData);
        setFolders(folderData);
        setFiles(fileData);
        onError('Previous folder no longer exists. Moved to root.');
        return;
      }
    }

    const [quotaData, folderData, fileData] = await Promise.all([
      fileCloudApi.quota(),
      fileCloudApi.listFolders(folderId),
      fileCloudApi.listFiles({ folderId, search: search.trim() || undefined }),
    ]);
    setQuota(quotaData);
    setFolders(folderData);
    setFiles(fileData);
    await loadBreadcrumbs(folderId);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedFolderId = window.localStorage.getItem(folderStorageKey)?.trim();
    setCurrentFolderId(savedFolderId || undefined);
    setFolderStateReady(true);
  }, [folderStorageKey]);

  useEffect(() => {
    if (!folderStateReady || typeof window === 'undefined') return;
    if (!currentFolderId) {
      window.localStorage.removeItem(folderStorageKey);
      return;
    }
    window.localStorage.setItem(folderStorageKey, currentFolderId);
  }, [currentFolderId, folderStateReady, folderStorageKey]);

  useEffect(() => {
    if (!folderStateReady) return;
    const run = async () => {
      try {
        setLoading(true);
        await loadDirectory();
      } catch (err) {
        onError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, folderStateReady]);

  const onSearch = async () => {
    try {
      await loadDirectory();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fileCloudApi.createFolder({
        name: newFolderName.trim(),
        parentFolderId: currentFolderId,
      });
      setNewFolderName('');
      await loadDirectory();
      onSuccess('Folder created');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const deleteFolder = async (folderId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this folder? Folder must be empty.');
    if (!confirmed) return;
    try {
      await fileCloudApi.deleteFolder(folderId);
      await loadDirectory();
      onSuccess('Folder deleted');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const deleteFile = async (fileId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this file?');
    if (!confirmed) return;
    try {
      await fileCloudApi.deleteFile(fileId);
      await loadDirectory();
      onSuccess('File deleted');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const uploadFiles = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    setUploading(true);
    try {
      for (const selectedFile of selectedFiles) {
        const sig = await fileCloudApi.createUploadSignature({
          provider,
          fileName: selectedFile.name,
        });

        const formData = new FormData();
        formData.append('file', selectedFile);

        if (sig.provider === 'imagekit') {
          Object.entries(sig.params).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        } else {
          formData.append('api_key', String(sig.params.apiKey));
          formData.append('timestamp', String(sig.params.timestamp));
          formData.append('signature', String(sig.params.signature));
          formData.append('folder', String(sig.params.folder));
          formData.append('public_id', String(sig.params.public_id));
        }

        const uploadResponse = await fetch(sig.uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${selectedFile.name}`);
        }

        const uploaded = (await uploadResponse.json()) as Record<string, unknown>;
        const publicUrl = String(uploaded.url ?? uploaded.secure_url ?? uploaded.filePath ?? '');
        if (!publicUrl) {
          throw new Error(`Upload URL missing for ${selectedFile.name}`);
        }

        const providerFileIdRaw = String(uploaded.fileId ?? uploaded.public_id ?? '').trim();
        await fileCloudApi.createFile({
          name: selectedFile.name,
          originalName: selectedFile.name,
          fileType: selectedFile.type || 'application/octet-stream',
          mimeType: selectedFile.type || undefined,
          size: selectedFile.size,
          storageProvider: sig.provider,
          providerFileId: providerFileIdRaw || undefined,
          providerResourceType:
            uploaded.resource_type === 'image' || uploaded.resource_type === 'video' || uploaded.resource_type === 'raw'
              ? (uploaded.resource_type as 'image' | 'video' | 'raw')
              : undefined,
          storagePath: String(uploaded.filePath ?? uploaded.public_id ?? selectedFile.name),
          publicUrl,
          thumbnailUrl: uploaded.thumbnail_url ? String(uploaded.thumbnail_url) : undefined,
          parentFolderId: currentFolderId,
        });
      }

      await loadDirectory();
      onSuccess('Files uploaded');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const moveItemToFolder = async (payload: DragPayload, targetFolderId: string | null) => {
    if (payload.kind === 'file') {
      await fileCloudApi.updateFile(payload.id, { parentFolderId: targetFolderId });
      return;
    }
    await fileCloudApi.updateFolder(payload.id, { parentFolderId: targetFolderId });
  };

  const onDropToFolder = async (event: React.DragEvent, folderId: string) => {
    event.preventDefault();
    setDragOverFolderId(null);

    const payload = parseDragPayload(event);
    if (!payload) return;

    try {
      await moveItemToFolder(payload, folderId);
      await loadDirectory();
      onSuccess('Item moved');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const onDropToRoot = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverRoot(false);
    const payload = parseDragPayload(event);
    if (!payload) return;

    try {
      await moveItemToFolder(payload, null);
      await loadDirectory();
      onSuccess('Item moved to root');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const onDropUpload = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverUpload(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (!dropped.length) return;
    await uploadFiles(dropped);
  };

  const currentPathLabel = breadcrumbs.length
    ? ['Root', ...breadcrumbs.map((folder) => folder.name)].join(' / ')
    : 'Root';

  const goOneLevelUp = () => {
    if (!currentFolderId) return;
    if (breadcrumbs.length <= 1) {
      setCurrentFolderId(undefined);
      return;
    }
    const parent = breadcrumbs[breadcrumbs.length - 2];
    setCurrentFolderId(parent?._id);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4 text-accent" />
                Unified Drive
              </CardTitle>
              <CardDescription className="mt-1">Professional file workspace</CardDescription>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-border/70 bg-muted/20 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Storage</p>
                {quota ? (
                  <>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatBytes(quota.usedBytes)} / {formatBytes(quota.limitBytes)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Locations</p>
                <button
                  onClick={() => setCurrentFolderId(undefined)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverRoot(true);
                  }}
                  onDragLeave={() => setDragOverRoot(false)}
                  onDrop={onDropToRoot}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                    !currentFolderId ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted/50',
                    dragOverRoot && 'ring-2 ring-primary',
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  Root
                </button>

                <div className="max-h-72 space-y-1 overflow-auto pr-1">
                  {folders.map((folder) => (
                    <div
                      key={folder._id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id } satisfies DragPayload));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverFolderId(folder._id);
                      }}
                      onDragLeave={() => setDragOverFolderId((prev) => (prev === folder._id ? null : prev))}
                      onDrop={(e) => void onDropToFolder(e, folder._id)}
                      className={cn(
                        'group flex items-center justify-between rounded-lg border px-2 py-2 transition',
                        dragOverFolderId === folder._id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <button
                        className="flex min-w-0 items-center gap-2 text-left text-sm"
                        onClick={() => setCurrentFolderId(folder._id)}
                      >
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-70 group-hover:opacity-100"
                        onClick={() => deleteFolder(folder._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {!folders.length && <p className="text-xs text-muted-foreground">No folders in this directory.</p>}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Upload Provider</p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full justify-start"
                    variant={provider === 'imagekit' ? 'default' : 'outline'}
                    onClick={() => setProvider('imagekit')}
                  >
                    ImageKit
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-start"
                    variant={provider === 'cloudinary' ? 'default' : 'outline'}
                    onClick={() => setProvider('cloudinary')}
                  >
                    Cloudinary
                  </Button>
                </div>
              </div>
            </aside>

            <main className="min-w-0 p-4">
              <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search in current folder"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={onSearch} className="w-full lg:w-auto">
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={goOneLevelUp}
                  disabled={!currentFolderId}
                  className="w-full lg:w-auto"
                  title="Go one level up"
                >
                  <CornerUpLeft className="mr-2 h-4 w-4" />
                  Up
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full lg:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Create new folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button onClick={createFolder} className="w-full sm:w-auto">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const selected = Array.from(e.target.files ?? []);
                  e.currentTarget.value = '';
                  await uploadFiles(selected);
                }}
              />

              <div
                className={cn(
                  'mb-4 rounded-xl border border-dashed p-4 transition',
                  dragOverUpload ? 'border-primary bg-primary/10' : 'border-border bg-muted/20',
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverUpload(true);
                }}
                onDragLeave={() => setDragOverUpload(false)}
                onDrop={onDropUpload}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <CloudUpload className="h-4 w-4" />
                  Drag files here to upload directly into this folder.
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Path: {currentPathLabel}
              </div>

              <div className="overflow-hidden rounded-xl border border-border/80">
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_70px] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Name</span>
                  <span>Modified</span>
                  <span>Size</span>
                  <span className="text-right">Action</span>
                </div>
                <div className="max-h-[460px] overflow-auto">
                  <div className="space-y-2 p-2 md:hidden">
                    {folders.map((folder) => (
                      <div
                        key={`folder-mobile-${folder._id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id } satisfies DragPayload));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverFolderId(folder._id);
                        }}
                        onDragLeave={() => setDragOverFolderId((prev) => (prev === folder._id ? null : prev))}
                        onDrop={(e) => void onDropToFolder(e, folder._id)}
                        className={cn(
                          'rounded-xl border p-3',
                          dragOverFolderId === folder._id ? 'border-primary bg-primary/10' : 'border-border bg-surface/70',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button className="flex min-w-0 items-center gap-2 text-left" onClick={() => setCurrentFolderId(folder._id)}>
                            <Folder className="h-4 w-4 shrink-0 text-accent" />
                            <span className="truncate text-sm font-medium">{folder.name}</span>
                          </button>
                          <Button size="sm" variant="ghost" onClick={() => deleteFolder(folder._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Updated: {formatDate(folder.updatedAt)}</p>
                      </div>
                    ))}

                    {files.map((file) => (
                      <div key={`file-mobile-${file._id}`} className="rounded-xl border border-border bg-surface/70 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <a href={file.publicUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2">
                            <Files className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm font-medium">{file.name}</span>
                          </a>
                          <Button size="sm" variant="ghost" onClick={() => deleteFile(file._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatBytes(file.size)}</span>
                          <span>{formatDate(file.updatedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {folders.map((folder) => (
                    <div
                      key={`folder-row-${folder._id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id } satisfies DragPayload));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverFolderId(folder._id);
                      }}
                      onDragLeave={() => setDragOverFolderId((prev) => (prev === folder._id ? null : prev))}
                      onDrop={(e) => void onDropToFolder(e, folder._id)}
                      className={cn(
                        'hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_70px] items-center gap-2 border-b border-border/70 px-3 py-2 text-sm',
                        dragOverFolderId === folder._id ? 'bg-primary/10' : 'hover:bg-muted/30',
                      )}
                    >
                      <button className="flex min-w-0 items-center gap-2 text-left" onClick={() => setCurrentFolderId(folder._id)}>
                        <Folder className="h-4 w-4 text-accent" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <span className="text-xs text-muted-foreground">{formatDate(folder.updatedAt)}</span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => deleteFolder(folder._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {files.map((file) => (
                    <div
                      key={`file-row-${file._id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'file', id: file._id } satisfies DragPayload));
                      }}
                      className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_70px] items-center gap-2 border-b border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                    >
                      <a href={file.publicUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2">
                        <Files className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </a>
                      <span className="text-xs text-muted-foreground">{formatDate(file.updatedAt)}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => deleteFile(file._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {!loading && !folders.length && !files.length ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">No files or folders in this location.</div>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
