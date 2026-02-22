'use client';

import { Button } from '@/components/ui/button';
import type { CloudFolder } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FolderOpen, FolderTree, Trash2 } from 'lucide-react';

export function FolderTreeComponent({
  folders, currentFolderId, setCurrentFolderId, onDropToFolder, deleteFolder, onDropToRoot, dragOverRoot, setDragOverRoot, dragOverFolderId, setDragOverFolderId
}: any) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Locations</p>
      <button
        onClick={() => setCurrentFolderId(undefined)}
        onDragOver={(e) => { e.preventDefault(); setDragOverRoot(true); }}
        onDragLeave={() => setDragOverRoot(false)}
        onDrop={onDropToRoot}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all shadow-sm',
          !currentFolderId ? 'border-primary/50 bg-primary/10 text-primary shadow-primary/10' : 'border-border/50 hover:bg-surface/80 bg-surface/40',
          dragOverRoot && 'ring-2 ring-primary ring-offset-1',
        )}
      >
        <FolderOpen className={cn("h-4 w-4", !currentFolderId ? "text-primary" : "text-muted-foreground")} />
        Root
      </button>

      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-2 scrollbar-hide py-1">
        {folders.map((folder: CloudFolder) => (
          <div
            key={folder._id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: folder._id }))}
            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder._id); }}
            onDragLeave={() => setDragOverFolderId((prev: any) => (prev === folder._id ? null : prev))}
            onDrop={(e) => void onDropToFolder(e, folder._id)}
            className={cn(
              'group flex items-center justify-between rounded-xl border px-2 py-2 transition-all shadow-sm',
              dragOverFolderId === folder._id ? 'border-primary/50 bg-primary/10' : 'border-border/50 hover:bg-surface/80 bg-surface/40',
              currentFolderId === folder._id && dragOverFolderId !== folder._id ? 'border-accent/40 bg-accent/5' : ''
            )}
          >
            <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm truncate" onClick={() => setCurrentFolderId(folder._id)}>
              <FolderTree className={cn("h-4 w-4 shrink-0", currentFolderId === folder._id ? "text-accent" : "text-muted-foreground")} />
              <span className={cn("truncate font-medium", currentFolderId === folder._id ? "text-accent" : "text-foreground")}>{folder.name}</span>
            </button>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all shrink-0" onClick={() => deleteFolder(folder._id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {!folders.length && <p className="text-xs text-muted-foreground italic px-2 py-4 text-center">No nested folders.</p>}
      </div>
    </div>
  );
}
