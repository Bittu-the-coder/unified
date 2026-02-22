'use client';

import { Button } from '@/components/ui/button';
import type { CloudFile, CloudFolder } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, Files, Folder, Trash2 } from 'lucide-react';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value: string) => { try { return new Date(value).toLocaleDateString(); } catch { return '-'; } };

export function FileGrid({
  folders, files, loading, dragOverFolderId, setDragOverFolderId,
  onDropToFolder, deleteFolder, deleteFile, setCurrentFolderId
}: any) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm glass-panel">
      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_90px] gap-4 border-b border-border/60 bg-surface/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <span>Name</span>
        <span>Modified</span>
        <span>Size</span>
        <span className="text-right">Action</span>
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {/* Mobile View */}
        <div className="space-y-3 p-3 md:hidden">
          {folders.map((folder: CloudFolder) => (
            <div
              key={`folder-mobile-${folder._id}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id }))}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder._id); }}
              onDragLeave={() => setDragOverFolderId((prev: any) => (prev === folder._id ? null : prev))}
              onDrop={(e) => void onDropToFolder(e, folder._id)}
              className={cn('rounded-xl border p-4 shadow-sm transition-all', dragOverFolderId === folder._id ? 'border-primary bg-primary/10' : 'border-border/60 bg-surface')}
            >
              <div className="flex items-start justify-between gap-3">
                <button className="flex min-w-0 items-center gap-3 text-left flex-1" onClick={() => setCurrentFolderId(folder._id)}>
                  <div className="p-2 bg-accent/10 rounded-lg"><Folder className="h-5 w-5 shrink-0 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Updated: {formatDate(folder.updatedAt)}</p>
                  </div>
                </button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 text-destructive shrink-0" onClick={() => deleteFolder(folder._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {files.map((file: CloudFile) => (
            <div key={`file-mobile-${file._id}`} className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <a href={file.publicUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 flex-1 group">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><Files className="h-5 w-5 shrink-0 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">{file.name}</p>
                    <div className="flex gap-2 items-center mt-0.5 text-[10px] text-muted-foreground font-medium">
                      <span>{formatBytes(file.size)}</span> • <span>{formatDate(file.updatedAt)}</span>
                    </div>
                  </div>
                </a>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 text-primary" asChild>
                    <a href={file.publicUrl} target="_blank" download><ArrowDownToLine className="h-4 w-4" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => deleteFile(file._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        {folders.map((folder: CloudFolder) => (
          <div
            key={`folder-row-${folder._id}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id }))}
            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder._id); }}
            onDragLeave={() => setDragOverFolderId((prev: any) => (prev === folder._id ? null : prev))}
            onDrop={(e) => void onDropToFolder(e, folder._id)}
            className={cn(
              'hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_90px] items-center gap-4 border-b border-border/40 px-4 py-3 text-sm transition-all group cursor-pointer',
              dragOverFolderId === folder._id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/40 bg-surface/30',
            )}
            onClick={() => setCurrentFolderId(folder._id)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Folder className="h-5 w-5 text-accent shrink-0" />
              <span className="truncate font-medium">{folder.name}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate">{formatDate(folder.updatedAt)}</span>
            <span className="text-xs text-muted-foreground">-</span>
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder(folder._id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {files.map((file: CloudFile) => (
          <div
            key={`file-row-${file._id}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'file', id: file._id }))}
            className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_90px_90px] items-center gap-4 border-b border-border/40 px-4 py-3 text-sm hover:bg-muted/40 transition-colors group cursor-pointer bg-surface/30"
            onClick={() => window.open(file.publicUrl, '_blank')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Files className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate font-medium">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate">{formatDate(file.updatedAt)}</span>
            <span className="text-xs text-muted-foreground text-nowrap">{formatBytes(file.size)}</span>
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={(e) => { e.stopPropagation(); window.open(file.publicUrl, '_blank'); }}>
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFile(file._id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {!loading && !folders.length && !files.length ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground italic">No files or folders in this location.</div>
        ) : null}
      </div>
    </div>
  );
}
