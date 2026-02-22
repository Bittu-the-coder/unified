'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageCircleHeart, MessageSquareReply, Pencil, ShieldPlus, Trash2, UserMinus, UserPlus } from 'lucide-react';

const quickReactions = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F525}', '\u{1F44F}'] as const;

export function MessageThread({
  messages, currentUserId, getLabel, conversation,
  toggleReaction, setReplyTo, editMsg, deleteMsg,
  manageId, setManageId, addPart, rmPart, mkAdmin,
}: any) {
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground opacity-60">
        <MessageCircleHeart className="h-16 w-16 mb-4 opacity-30" />
        <div className="border-2 border-dashed border-border/60 rounded-2xl p-8 glass-panel text-lg font-medium tracking-tight">Select or create a conversation <br/> to start messaging.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {conversation.type === 'group' && (
        <div className="shrink-0 space-y-3 border-b border-border/30 p-4 bg-muted/10 shadow-[inset_0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Group Participants</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Add participant by unique number" value={manageId} onChange={(e) => setManageId(e.target.value)} className="h-8 text-xs bg-background/50 border-border/60" />
            <Button size="sm" variant="secondary" onClick={addPart} className="h-8 shrink-0"><UserPlus className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {conversation.participantIds.map((id: string) => (
              <div key={id} className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs shrink-0 glass-panel shadow-sm">
                <span className="font-medium text-foreground">{getLabel(id)}</span>
                <div className="flex gap-0.5 ml-2 -mr-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-muted" onClick={() => mkAdmin(id)}><ShieldPlus className="h-3 w-3" /></Button>
                  {id !== currentUserId && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => rmPart(id)}><UserMinus className="h-3 w-3 text-destructive" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: ChatMessage) => {
          const own = message.senderId === currentUserId;
          const replyTo = message.replyToMessageId ? messages.find((item: ChatMessage) => item._id === message.replyToMessageId) : undefined;

          return (
            <div key={message._id} className={cn('flex group', own ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative', own ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'border border-border/60 bg-surface/80 rounded-tl-sm')}>
                {!own ? <p className="mb-1 text-[10px] font-bold text-accent">{getLabel(message.senderId)}</p> : null}
                {replyTo ? <div className={cn('mb-2 rounded-lg px-3 py-1.5 text-xs font-medium border-l-2 opacity-90', own ? 'bg-black/20 border-white/40' : 'bg-muted/50 border-accent/40')}>{replyTo.content.substring(0,40)}</div> : null}
                <p className="break-words leading-relaxed">{message.content}</p>

                <div className="mt-2 flex flex-wrap gap-1 md:gap-1.5 justify-end">
                  {quickReactions.map((emoji) => {
                    const reaction = message.reactions.find((item) => item.emoji === emoji);
                    if (!reaction?.userIds.length) return null;
                    const active = reaction.userIds.includes(currentUserId);
                    return (
                      <button key={emoji} onClick={() => toggleReaction(message, emoji)} className={cn('rounded-full px-1.5 text-[10px] flex items-center gap-1 transition-all', active ? 'bg-accent/20 text-accent font-bold' : 'bg-muted/50 opacity-60 hover:opacity-100')}>
                        {emoji} <span>{reaction.userIds.length}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={cn("mt-1.5 flex items-center gap-3 text-[9px] font-medium uppercase tracking-widest", own ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground')}>
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.isEdited ? ' (edited)' : ''}</span>
                  {own && <span>{message.readBy.length}/{conversation.participantIds.length} read</span>}
                </div>

                <div className={cn("absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1", own ? '-left-[110px]' : '-right-[40px]')}>
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-surface shadow-md border border-border/40 hover:bg-muted" onClick={() => setReplyTo(message._id, message.content)}>
                    <MessageSquareReply className="h-4 w-4 text-muted-foreground" />
                   </Button>
                   {own && (
                     <>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-surface shadow-md border border-border/40 hover:bg-muted" onClick={() => editMsg(message)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-surface shadow-md border border-border/40 hover:bg-destructive/10" onClick={() => deleteMsg(message._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                     </>
                   )}
                </div>
              </div>
            </div>
          );
        })}
        {!messages.length && <p className="text-sm text-muted-foreground italic text-center py-8">It's quiet... say hello!</p>}
      </div>
    </div>
  );
}
