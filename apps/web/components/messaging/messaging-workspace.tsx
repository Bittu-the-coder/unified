'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  BellOff,
  BellRing,
  MessageCircle,
  MessageSquareReply,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
  ShieldPlus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
  Pencil,
} from 'lucide-react';
import { authTokenStore, messagingApi, userApi, type ChatMessage, type Conversation, type UserProfile } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MessagingWorkspaceProps = {
  currentUserId: string;
  onError: (message: string) => void;
};

const quickReactions = ['👍', '❤️', '😂', '🔥', '👏'] as const;
const REALTIME_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export function MessagingWorkspace({ currentUserId, onError }: MessagingWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchText, setSearchText] = useState('');
  const [newDirectParticipantId, setNewDirectParticipantId] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupParticipants, setNewGroupParticipants] = useState('');
  const [composerText, setComposerText] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | undefined>(undefined);
  const [replyPreview, setReplyPreview] = useState<string>('');
  const [manageParticipantId, setManageParticipantId] = useState('');
  const [isTypingSent, setIsTypingSent] = useState(false);
  const [participantDirectory, setParticipantDirectory] = useState<Record<string, UserProfile>>({});

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const formatParticipantLabel = (participantId: string) => {
    const profile = participantDirectory[participantId];
    if (!profile) {
      return participantId;
    }
    const suffix = profile.uniqueNumber ? ` #${profile.uniqueNumber}` : '';
    return `${profile.fullName} (@${profile.username})${suffix}`;
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title?.trim()) {
      return conversation.title;
    }
    if (conversation.type === 'group') {
      return 'Group';
    }
    const otherParticipantId = conversation.participantIds.find((id) => id !== currentUserId) ?? conversation.participantIds[0];
    return otherParticipantId ? formatParticipantLabel(otherParticipantId) : 'Direct Chat';
  };

  const filteredConversations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [
        getConversationTitle(conversation),
        conversation.description ?? '',
        conversation.participantIds.map((id) => formatParticipantLabel(id)).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, searchText, participantDirectory]);

  const hydrateParticipants = async (conversationList: Conversation[]) => {
    const uniqueIds = Array.from(new Set(conversationList.flatMap((conversation) => conversation.participantIds)));
    const missingIds = uniqueIds.filter((id) => !participantDirectory[id]);
    if (!missingIds.length) {
      return;
    }

    const profiles = await Promise.all(
      missingIds.map(async (id) => {
        try {
          return await userApi.getById(id);
        } catch {
          return null;
        }
      }),
    );

    setParticipantDirectory((prev) => {
      const next = { ...prev };
      profiles.forEach((profile, index) => {
        if (!profile) return;
        next[missingIds[index]] = profile;
      });
      return next;
    });
  };

  const loadConversations = async () => {
    const list = await messagingApi.listConversations();
    setConversations(list);
    await hydrateParticipants(list);
    if (!selectedConversationId && list[0]) {
      setSelectedConversationId(list[0]._id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const list = await messagingApi.listMessages(conversationId);
    setMessages(list);
    await messagingApi.markRead(conversationId, list[list.length - 1]?._id);
  };

  const refreshThread = async () => {
    if (!selectedConversationId) return;
    await loadMessages(selectedConversationId);
    await loadConversations();
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadConversations();
      } catch (err) {
        onError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId).catch((err) => onError((err as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  useEffect(() => {
    if (!currentUserId) return;
    const accessToken = authTokenStore.getAccessToken();
    if (!accessToken) return;

    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const reconnect = () => {
      if (closed) return;
      reconnectTimer = setTimeout(() => {
        void connect();
      }, 1500);
    };

    const onRealtimeEvent = async (event: { conversationId?: string }) => {
      try {
        await loadConversations();
        if (event.conversationId && event.conversationId === selectedConversationId) {
          await loadMessages(event.conversationId);
        }
      } catch (err) {
        onError((err as Error).message);
      }
    };

    const connect = async () => {
      try {
        const response = await fetch(`${REALTIME_BASE}/messaging/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok || !response.body) {
          reconnect();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const lines = chunk.split('\n');
            const dataLine = lines.find((line) => line.startsWith('data: '));
            if (!dataLine) continue;
            try {
              const event = JSON.parse(dataLine.slice(6)) as { conversationId?: string };
              void onRealtimeEvent(event);
            } catch {
              // ignore malformed event lines
            }
          }
        }
      } catch {
        if (!closed) {
          reconnect();
        }
      }
    };

    void connect();

    return () => {
      closed = true;
      controller.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, selectedConversationId]);

  const createDirectConversation = async () => {
    const uniqueNumber = newDirectParticipantId.trim();
    if (!uniqueNumber) return;
    try {
      const participant = await userApi.getByUniqueNumber(uniqueNumber);
      await messagingApi.createDirectConversation({ participantId: participant.authUserId });
      setNewDirectParticipantId('');
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const createSelfConversation = async () => {
    try {
      await messagingApi.createDirectConversation({ participantId: currentUserId });
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const createGroupConversation = async () => {
    const uniqueNumbers = newGroupParticipants
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!uniqueNumbers.length) return;
    try {
      const profiles = await Promise.all(uniqueNumbers.map((uniqueNumber) => userApi.getByUniqueNumber(uniqueNumber)));
      await messagingApi.createGroupConversation({
        title: newGroupTitle.trim() || undefined,
        participantIds: profiles.map((profile) => profile.authUserId),
      });
      setNewGroupTitle('');
      setNewGroupParticipants('');
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const toggleMemberState = async (type: 'mute' | 'pin' | 'archive') => {
    if (!selectedConversation) return;
    try {
      const current = selectedConversation.memberState;
      if (type === 'mute') {
        await messagingApi.setMuted(selectedConversation._id, !(current?.isMuted ?? false));
      }
      if (type === 'pin') {
        await messagingApi.setPinned(selectedConversation._id, !(current?.isPinned ?? false));
      }
      if (type === 'archive') {
        await messagingApi.setArchived(selectedConversation._id, !(current?.isArchived ?? false));
      }
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !composerText.trim()) return;
    try {
      await messagingApi.createMessage(selectedConversationId, {
        content: composerText.trim(),
        replyToMessageId,
      });
      setComposerText('');
      setReplyToMessageId(undefined);
      setReplyPreview('');
      setIsTypingSent(false);
      await messagingApi.setTyping(selectedConversationId, false);
      await refreshThread();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const editMessage = async (message: ChatMessage) => {
    const content = window.prompt('Edit message', message.content);
    if (content === null) return;
    try {
      await messagingApi.updateMessage(message._id, { content });
      await refreshThread();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await messagingApi.deleteMessage(messageId);
      await refreshThread();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const toggleReaction = async (message: ChatMessage, emoji: string) => {
    try {
      const reaction = message.reactions.find((r) => r.emoji === emoji);
      const hasReacted = reaction?.userIds.includes(currentUserId) ?? false;
      if (hasReacted) {
        await messagingApi.removeReaction(message._id, emoji);
      } else {
        await messagingApi.addReaction(message._id, emoji);
      }
      await refreshThread();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const addParticipant = async () => {
    const uniqueNumber = manageParticipantId.trim();
    if (!selectedConversation || !uniqueNumber) return;
    try {
      const participant = await userApi.getByUniqueNumber(uniqueNumber);
      await messagingApi.addParticipant(selectedConversation._id, participant.authUserId);
      setManageParticipantId('');
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!selectedConversation) return;
    try {
      await messagingApi.removeParticipant(selectedConversation._id, participantId);
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const makeAdmin = async (participantId: string) => {
    if (!selectedConversation) return;
    try {
      await messagingApi.makeAdmin(selectedConversation._id, participantId);
      await loadConversations();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const setTyping = async (typing: boolean) => {
    if (!selectedConversationId) return;
    try {
      await messagingApi.setTyping(selectedConversationId, typing);
    } catch {
      // ignore typing errors to keep composer responsive
    }
  };

  const onComposerChange = async (value: string) => {
    setComposerText(value);
    if (!selectedConversationId) return;
    if (value.trim() && !isTypingSent) {
      setIsTypingSent(true);
      await setTyping(true);
    }
    if (!value.trim() && isTypingSent) {
      setIsTypingSent(false);
      await setTyping(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent" />
            Chats
          </CardTitle>
          <CardDescription>Direct and group conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search chats" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New Direct</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Participant unique number"
                value={newDirectParticipantId}
                onChange={(e) => setNewDirectParticipantId(e.target.value)}
              />
              <Button size="sm" onClick={createDirectConversation}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="secondary" onClick={createSelfConversation} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Self Chat
            </Button>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New Group</p>
            <Input placeholder="Group title" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} />
            <Input
              placeholder="Participant numbers (comma separated)"
              value={newGroupParticipants}
              onChange={(e) => setNewGroupParticipants(e.target.value)}
            />
            <Button size="sm" variant="secondary" onClick={createGroupConversation} className="gap-2">
              <Users className="mr-1 h-4 w-4" />
              Group
            </Button>
          </div>
          <div className="max-h-[320px] space-y-2 overflow-auto sm:max-h-[420px] lg:max-h-[480px]">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setSelectedConversationId(conversation._id)}
                className={cn(
                  'w-full rounded-xl border border-border p-3 text-left transition',
                  selectedConversationId === conversation._id ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{getConversationTitle(conversation)}</p>
                  {conversation.memberState?.isPinned ? <span className="text-xs text-accent">Pinned</span> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="sm:hidden">{conversation.participantIds.length}</span>
                  <span className="hidden sm:inline">{conversation.participantIds.length} participants</span>
                </p>
              </button>
            ))}
            {!loading && !filteredConversations.length ? <p className="text-sm text-muted-foreground">No conversations.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="break-words">{selectedConversation ? getConversationTitle(selectedConversation) : 'Select a chat'}</CardTitle>
              <CardDescription>
                {selectedConversation ? `${selectedConversation.type} - ${selectedConversation.participantIds.length} participants` : 'No chat selected'}
              </CardDescription>
            </div>
            {selectedConversation ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMemberState('mute')}
                  title={selectedConversation.memberState?.isMuted ? 'Unmute' : 'Mute'}
                >
                  {selectedConversation.memberState?.isMuted ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMemberState('pin')}
                  title={selectedConversation.memberState?.isPinned ? 'Unpin' : 'Pin'}
                >
                  {selectedConversation.memberState?.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMemberState('archive')}
                  title={selectedConversation.memberState?.isArchived ? 'Unarchive' : 'Archive'}
                >
                  {selectedConversation.memberState?.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedConversation ? (
            <>
              {selectedConversation.type === 'group' ? (
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Group Participants</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Add participant by unique number"
                      value={manageParticipantId}
                      onChange={(e) => setManageParticipantId(e.target.value)}
                    />
                    <Button size="sm" variant="secondary" onClick={addParticipant} title="Add participant">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-24 space-y-1 overflow-auto">
                    {selectedConversation.participantIds.map((participantId) => (
                      <div key={participantId} className="flex items-center justify-between rounded-lg border border-border px-2 py-1 text-xs">
                        <span>{formatParticipantLabel(participantId)}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => makeAdmin(participantId)} title="Make admin">
                            <ShieldPlus className="h-4 w-4" />
                          </Button>
                          {participantId !== currentUserId ? (
                            <Button size="sm" variant="ghost" onClick={() => removeParticipant(participantId)} title="Remove participant">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="max-h-[340px] space-y-2 overflow-auto rounded-xl border border-border p-3 sm:max-h-[430px]">
                {messages.map((message) => {
                  const own = message.senderId === currentUserId;
                  const replyTo = message.replyToMessageId ? messages.find((item) => item._id === message.replyToMessageId) : undefined;

                  return (
                    <div key={message._id} className={cn('flex', own ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3 py-2 text-sm',
                          own ? 'bg-primary text-white' : 'border border-border bg-surface',
                        )}
                      >
                        {!own ? <p className="mb-1 text-xs opacity-70">{formatParticipantLabel(message.senderId)}</p> : null}
                        {replyTo ? (
                          <div className={cn('mb-1 rounded-lg px-2 py-1 text-xs', own ? 'bg-white/20' : 'bg-muted')}>
                            Reply: {replyTo.content}
                          </div>
                        ) : null}
                          <p className="break-words">{message.content}</p>
                        {message.attachments.length ? (
                          <p className="mt-1 text-xs opacity-70">Attachments: {message.attachments.length}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {quickReactions.map((emoji, index) => {
                            const reaction = message.reactions.find((item) => item.emoji === emoji);
                            const active = reaction?.userIds.includes(currentUserId) ?? false;
                            return (
                              <button
                                key={`${message._id}-reaction-${index}`}
                                onClick={() => void toggleReaction(message, emoji)}
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs transition',
                                  active ? (own ? 'bg-white/25' : 'bg-primary/15 text-primary') : own ? 'bg-white/10' : 'bg-muted',
                                )}
                              >
                                {emoji} {reaction?.userIds.length ?? 0}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-70">
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.isEdited ? ' - edited' : ''}
                          </span>
                          <span>
                            {message.readBy.length}/{selectedConversation.participantIds.length} read
                          </span>
                        </div>
                        <div className="mt-1 flex gap-1">
                          <Button
                            size="sm"
                            variant={own ? 'outline' : 'ghost'}
                            onClick={() => {
                              setReplyToMessageId(message._id);
                              setReplyPreview(message.content);
                            }}
                            title="Reply"
                          >
                            <MessageSquareReply className="h-4 w-4" />
                          </Button>
                          {own ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => editMessage(message)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteMessage(message._id)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!messages.length ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
              </div>

              {replyToMessageId ? (
                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs">
                  Replying: {replyPreview}
                  <button
                    onClick={() => {
                      setReplyToMessageId(undefined);
                      setReplyPreview('');
                    }}
                    className="ml-2 inline-flex items-center underline"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    cancel
                  </button>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message"
                  value={composerText}
                  onChange={(e) => void onComposerChange(e.target.value)}
                  onFocus={() => void setTyping(true)}
                  onBlur={() => void setTyping(false)}
                />
                <Button onClick={sendMessage} title="Send" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
              Select or create a conversation to start messaging.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
