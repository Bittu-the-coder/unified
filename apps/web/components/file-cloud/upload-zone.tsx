'use client';

import { cn } from '@/lib/utils';
import { CloudUpload } from 'lucide-react';

export function UploadZone({ dragOver, setDragOver, onDrop }: { dragOver: boolean, setDragOver: (b: boolean) => void, onDrop: (e: React.DragEvent) => void }) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border-2 border-dashed p-8 transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-3',
        dragOver ? 'border-accent bg-accent/10 scale-[1.02] shadow-lg' : 'border-border/60 bg-surface/30 hover:border-border hover:bg-surface/50',
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className={cn("p-4 rounded-full transition-colors", dragOver ? "bg-accent/20" : "bg-muted")}>
        <CloudUpload className={cn("h-8 w-8 transition-colors", dragOver ? "text-accent" : "text-muted-foreground")} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Drag and drop files here to upload directly
      </p>
    </div>
  );
}
