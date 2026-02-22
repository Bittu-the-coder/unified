'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Conversation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageCircle, Pin, Plus, Search, Users } from 'lucide-react';

type Props = {
  searchText: string; setSearchText: (v: string) => void;
  newDirect: string; setNewDirect: (v: string) => void; createDirect: () => void;
  newGroupTitle: string; setNewGroupTitle: (v: string) => void;
  newGroupParts: string; setNewGroupParts: (v: string) => void; createGroup: () => void;
  createSelf: () => void;
  conversations: Conversation[];
  selectedId: string; setSelectedId: (id: string) => void;
  getTitle: (c: Conversation) => string;
  loading: boolean;
};

export function ConversationList({
  searchText, setSearchText, newDirect, setNewDirect, createDirect,
  newGroupTitle, setNewGroupTitle, newGroupParts, setNewGroupParts, createGroup,
  createSelf, conversations, selectedId, setSelectedId, getTitle, loading
}: Props) {
  return (
    <Card className="glass-card border-border/40 flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageCircle className="h-5 w-5 text-accent" /> Chats
        </CardTitle>
        <CardDescription>Pinned chats stay on top</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col flex-1 overflow-hidden h-full pb-0">
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 bg-background/50 border-border/50" placeholder="Search chats" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>

        <div className="space-y-3 shrink-0">
          <div className="space-y-2 rounded-xl glass-panel p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Direct</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="User unique number" value={newDirect} onChange={(e) => setNewDirect(e.target.value)} className="h-8 text-xs bg-background/50" />
              <Button size="sm" onClick={createDirect} className="h-8 shrink-0 bg-primary"><Plus className="h-4 w-4" /></Button>
            </div>
            <Button size="sm" variant="outline" onClick={createSelf} className="w-full h-8 text-xs gap-2">
              <MessageCircle className="h-3.5 w-3.5" /> Self Chat
            </Button>
          </div>

          <div className="space-y-2 rounded-xl glass-panel p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Group</p>
            <Input placeholder="Group title" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="h-8 text-xs bg-background/50" />
            <Input placeholder="Participant numbers (comma separated)" value={newGroupParts} onChange={(e) => setNewGroupParts(e.target.value)} className="h-8 text-xs bg-background/50" />
            <Button size="sm" variant="secondary" onClick={createGroup} className="w-full h-8 text-xs gap-2">
              <Users className="h-3.5 w-3.5" /> Create Group
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-4 mt-2">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => setSelectedId(conversation._id)}
              className={cn(
                'w-full rounded-xl p-3 text-left transition-all border outline-none',
                selectedId === conversation._id ? 'bg-primary/10 border-primary/30 shadow-sm' : 'hover:bg-surface/80 border-transparent bg-surface/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-sm text-foreground">{getTitle(conversation)}</p>
                {conversation.memberState?.isPinned ? <Pin className="h-3.5 w-3.5 text-accent shrink-0" /> : null}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="opacity-80 font-medium">{conversation.type === 'group' ? 'Group' : 'Direct'}</span>
                <span className="opacity-60">{new Date(conversation.lastMessageAt ?? conversation.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
          {!loading && !conversations.length ? <p className="text-sm text-muted-foreground italic px-2 py-4 text-center">No conversations yet.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
