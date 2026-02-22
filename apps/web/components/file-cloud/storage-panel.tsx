'use client';

import { Button } from '@/components/ui/button';
import type { CloudQuota } from '@/lib/api';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export function StoragePanel({ quota, provider, setProvider }: { quota: CloudQuota | null, provider: 'imagekit' | 'cloudinary', setProvider: (v: 'imagekit'|'cloudinary') => void }) {
  const usagePercent = quota && quota.limitBytes > 0 ? Math.min(100, Math.round((quota.usedBytes / quota.limitBytes) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 p-4 shadow-sm glass-panel bg-surface/80">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Storage Quota</p>
        {quota ? (
          <>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-1000 ease-in-out" style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">{formatBytes(quota.usedBytes)}</span>
              <span className="text-muted-foreground">{formatBytes(quota.limitBytes)}</span>
            </div>
          </>
        ) : (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 p-4 shadow-sm glass-panel bg-surface/80">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload Provider</p>
        <div className="space-y-2">
          <Button size="sm" className="w-full justify-start font-semibold transition-all" variant={provider === 'imagekit' ? 'default' : 'outline'} onClick={() => setProvider('imagekit')}>
            ImageKit
          </Button>
          <Button size="sm" className="w-full justify-start font-semibold transition-all" variant={provider === 'cloudinary' ? 'default' : 'outline'} onClick={() => setProvider('cloudinary')}>
            Cloudinary
          </Button>
        </div>
      </div>
    </div>
  );
}
