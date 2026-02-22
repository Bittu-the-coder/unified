'use client';

import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Conversation } from '@/lib/api';
import { Archive, ArchiveRestore, BellOff, BellRing, Pin, PinOff } from 'lucide-react';

export function ConversationHeader({ conversation, getTitle, toggleState }: { conversation: Conversation | null, getTitle: (c: Conversation) => string, toggleState: (s: 'mute'|'pin'|'archive') => void }) {
  return (
    <CardHeader className="border-b border-border/30 pb-4 shrink-0 bg-surface/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="break-words text-xl">{conversation ? getTitle(conversation) : 'Select a chat'}</CardTitle>
          <CardDescription className="mt-1">
            {conversation
              ? `${conversation.type === 'group' ? 'Group' : 'Direct'} · ${conversation.participantIds.length} participants`
              : 'No chat selected'}
          </CardDescription>
        </div>
        {conversation && (
          <div className="flex flex-wrap gap-2">
            <Button size="icon" variant="outline" onClick={() => toggleState('mute')} className="h-9 w-9 border-border/60 hover:bg-muted/50 rounded-full transition-all">
              {conversation.memberState?.isMuted ? <BellRing className="h-4 w-4 text-muted-foreground" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => toggleState('pin')} className="h-9 w-9 border-border/60 hover:bg-muted/50 rounded-full transition-all">
              {conversation.memberState?.isPinned ? <PinOff className="h-4 w-4 text-accent" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => toggleState('archive')} className="h-9 w-9 border-border/60 hover:bg-muted/50 rounded-full transition-all">
              {conversation.memberState?.isArchived ? <ArchiveRestore className="h-4 w-4 text-muted-foreground" /> : <Archive className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
