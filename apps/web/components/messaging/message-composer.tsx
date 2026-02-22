'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';

export function MessageComposer({
  replyId, replyPreview, clearReply, composerText, onChange, onFocus, onBlur, onSend, disabled
}: any) {
  return (
    <div className="shrink-0 p-4 pt-2 bg-surface/80 backdrop-blur-md border-t border-border/30">
      {replyId && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-xs">
          <div className="flex-1 truncate"><span className="font-semibold text-accent mr-2">Replying to:</span>{replyPreview}</div>
          <button onClick={clearReply} className="ml-2 rounded-full p-1 hover:bg-accent/20 text-accent transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <div className="flex gap-2 relative">
        <Input
          placeholder="Type a message..."
          value={composerText}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          className="bg-background/80 focus:bg-background border-border/60 shadow-inner rounded-full px-5 h-12 pr-12"
        />
        <Button onClick={onSend} disabled={disabled || !composerText.trim()} className="absolute right-1 top-1 bottom-1 shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-105 p-0 group">
          <Send className="h-4 w-4 -ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
