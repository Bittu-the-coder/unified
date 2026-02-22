'use client';

import { ConversationHeader } from '@/components/messaging/conversation-header';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageComposer } from '@/components/messaging/message-composer';
import { MessageThread } from '@/components/messaging/message-thread';
import { Card } from '@/components/ui/card';
import { authTokenStore, messagingApi, userApi, type ChatMessage, type Conversation, type UserProfile } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

const REALTIME_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim() ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://gateway-three-psi.vercel.app');

export function MessagingWorkspace({ currentUserId, onError }: { currentUserId: string; onError: (msg: string) => void }) {
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
    () => conversations.find((c) => c._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const formatParticipantLabel = (participantId: string) => {
    const profile = participantDirectory[participantId];
    if (!profile) return participantId;
    const suffix = profile.uniqueNumber ? ` #${profile.uniqueNumber}` : '';
    return `${profile.fullName} (@${profile.username})${suffix}`;
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title?.trim()) return conversation.title;
    if (conversation.type === 'group') return 'Group';
    const otherId = conversation.participantIds.find((id) => id !== currentUserId) ?? conversation.participantIds[0];
    return otherId ? formatParticipantLabel(otherId) : 'Direct Chat';
  };

  const sortedConversations = useMemo(() => {
    const rows = [...conversations];
    rows.sort((a, b) => {
      const aPinned = a.memberState?.isPinned ? 1 : 0;
      const bPinned = b.memberState?.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const aTime = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
      const bTime = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
      return bTime - aTime;
    });
    return rows;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return sortedConversations;
    return sortedConversations.filter((conversation) =>
      [
        getConversationTitle(conversation),
        conversation.description ?? '',
        conversation.participantIds.map(formatParticipantLabel).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [sortedConversations, searchText, participantDirectory]);

  const hydrateParticipants = async (list: Conversation[]) => {
    const uniqueIds = Array.from(new Set(list.flatMap((c) => c.participantIds)));
    const missingIds = uniqueIds.filter((id) => !participantDirectory[id]);
    if (!missingIds.length) return;

    const profiles = await Promise.all(
      missingIds.map(id => userApi.getById(id).catch(() => null))
    );

    setParticipantDirectory((prev) => {
      const next = { ...prev };
      profiles.forEach((profile, i) => { if (profile) next[missingIds[i]] = profile; });
      return next;
    });
  };

  const loadConversations = async () => {
    const list = await messagingApi.listConversations();
    setConversations(list);
    await hydrateParticipants(list);
    if (!selectedConversationId && list[0]) setSelectedConversationId(list[0]._id);
  };

  const loadMessages = async (cid: string) => {
    const list = await messagingApi.listMessages(cid);
    setMessages(list);
    if (list.length) await messagingApi.markRead(cid, list[list.length - 1]._id);
  };

  const refreshThread = async () => {
    if (!selectedConversationId) return;
    await loadMessages(selectedConversationId);
    await loadConversations();
  };

  useEffect(() => {
    const run = async () => {
      try { setLoading(true); await loadConversations(); }
      catch (err) { onError((err as Error).message); }
      finally { setLoading(false); }
    };
    void run();
  }, []);

  useEffect(() => {
    if (selectedConversationId) void loadMessages(selectedConversationId).catch(err => onError((err as Error).message));
  }, [selectedConversationId]);

  useEffect(() => {
    if (!currentUserId) return;
    const token = authTokenStore.getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    let rTimer: any = null;
    let closed = false;

    const connect = async () => {
      try {
        const res = await fetch(`${REALTIME_BASE}/messaging/stream`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' });
        if (!res.ok || !res.body) return rTimer = setTimeout(() => !closed && connect(), 1500);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const line = chunk.split('\n').find(l => l.startsWith('data: '));
            if (!line) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              await loadConversations();
              if (ev.conversationId === selectedConversationId) await loadMessages(ev.conversationId);
            } catch {}
          }
        }
      } catch {
        if (!closed) rTimer = setTimeout(() => !closed && connect(), 1500);
      }
    };
    void connect();

    return () => { closed = true; controller.abort(); if (rTimer) clearTimeout(rTimer); };
  }, [currentUserId, selectedConversationId]);

  const toggleMemberState = async (type: 'mute' | 'pin' | 'archive') => {
    if (!selectedConversation) return;
    const id = selectedConversation._id;
    const ms = selectedConversation.memberState || {} as any;
    const val = !(ms[type === 'mute' ? 'isMuted' : type === 'pin' ? 'isPinned' : 'isArchived']);

    setConversations(prev => prev.map(c => c._id === id ? { ...c, memberState: { ...c.memberState, [type === 'mute' ? 'isMuted' : type === 'pin' ? 'isPinned' : 'isArchived']: val } as any } : c));
    try {
      if (type === 'mute') await messagingApi.setMuted(id, val);
      if (type === 'pin') await messagingApi.setPinned(id, val);
      if (type === 'archive') await messagingApi.setArchived(id, val);
      await loadConversations();
    } catch { await loadConversations(); }
  };

  const onComposerChange = async (v: string) => {
    setComposerText(v);
    if (!selectedConversationId) return;
    if (v.trim() && !isTypingSent) { setIsTypingSent(true); messagingApi.setTyping(selectedConversationId, true).catch(()=>{}); }
    if (!v.trim() && isTypingSent) { setIsTypingSent(false); messagingApi.setTyping(selectedConversationId, false).catch(()=>{}); }
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !composerText.trim()) return;
    try {
      await messagingApi.createMessage(selectedConversationId, { content: composerText.trim(), replyToMessageId });
      setComposerText(''); setReplyToMessageId(undefined); setReplyPreview(''); setIsTypingSent(false);
      await messagingApi.setTyping(selectedConversationId, false);
      await refreshThread();
    } catch (e) { onError((e as Error).message); }
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[370px_minmax(0,1fr)] h-full min-h-[calc(100vh-8rem)] animate-fade-in">
      <ConversationList
        searchText={searchText} setSearchText={setSearchText}
        newDirect={newDirectParticipantId} setNewDirect={setNewDirectParticipantId}
        createDirect={async () => {
          if (!newDirectParticipantId.trim()) return;
          try { const p = await userApi.getByUniqueNumber(newDirectParticipantId.trim()); await messagingApi.createDirectConversation({ participantId: p.authUserId }); setNewDirectParticipantId(''); await loadConversations(); } catch(e) { onError((e as Error).message); }
        }}
        newGroupTitle={newGroupTitle} setNewGroupTitle={setNewGroupTitle}
        newGroupParts={newGroupParticipants} setNewGroupParts={setNewGroupParticipants}
        createGroup={async () => {
          const ids = newGroupParticipants.split(',').map(i => i.trim()).filter(Boolean);
          if (!ids.length) return;
          try {
            const p = await Promise.all(ids.map(i => userApi.getByUniqueNumber(i)));
            await messagingApi.createGroupConversation({ title: newGroupTitle.trim() || undefined, participantIds: p.map(x => x.authUserId) });
            setNewGroupTitle(''); setNewGroupParticipants(''); await loadConversations();
          } catch(e) { onError((e as Error).message); }
        }}
        createSelf={async () => { try { await messagingApi.createDirectConversation({ participantId: currentUserId }); await loadConversations(); } catch(e) { onError((e as Error).message); } }}
        conversations={filteredConversations}
        selectedId={selectedConversationId} setSelectedId={setSelectedConversationId}
        getTitle={getConversationTitle} loading={loading}
      />
      <Card className="flex flex-col overflow-hidden glass-card border-border/40 pb-0 shadow-lg h-full max-h-[calc(100vh-6rem)] relative">
        <ConversationHeader conversation={selectedConversation} getTitle={getConversationTitle} toggleState={toggleMemberState} />
        <MessageThread
          messages={messages} currentUserId={currentUserId} getLabel={formatParticipantLabel}
          conversation={selectedConversation}
          toggleReaction={async (m: any, e: string) => { try { const r = m.reactions.find((x: any) => x.emoji === e); if (r?.userIds.includes(currentUserId)) await messagingApi.removeReaction(m._id, e); else await messagingApi.addReaction(m._id, e); await refreshThread(); } catch (err) { onError((err as Error).message); } }}
          setReplyTo={(id: string, text: string) => { setReplyToMessageId(id); setReplyPreview(text); }}
          editMsg={async (m: any) => { const c = window.prompt('Edit message', m.content); if(c) { try { await messagingApi.updateMessage(m._id, { content: c }); await refreshThread(); } catch(err) { onError((err as Error).message); } } }}
          deleteMsg={async (id: string) => { try { await messagingApi.deleteMessage(id); await refreshThread(); } catch(err) { onError((err as Error).message); } }}
          manageId={manageParticipantId} setManageId={setManageParticipantId}
          addPart={async () => { if(!selectedConversation) return; try { const p = await userApi.getByUniqueNumber(manageParticipantId.trim()); await messagingApi.addParticipant(selectedConversation._id, p.authUserId); setManageParticipantId(''); await loadConversations(); } catch(err) { onError((err as Error).message); } }}
          rmPart={async (id: string) => { if(!selectedConversation) return; try { await messagingApi.removeParticipant(selectedConversation._id, id); await loadConversations(); } catch(err) { onError((err as Error).message); } }}
          mkAdmin={async (id: string) => { if(!selectedConversation) return; try { await messagingApi.makeAdmin(selectedConversation._id, id); await loadConversations(); } catch(err) { onError((err as Error).message); } }}
        />
        <MessageComposer
          replyId={replyToMessageId} replyPreview={replyPreview}
          clearReply={() => { setReplyToMessageId(undefined); setReplyPreview(''); }}
          composerText={composerText} onChange={onComposerChange}
          onFocus={() => { if(selectedConversationId) messagingApi.setTyping(selectedConversationId, true).catch(()=>{}); }}
          onBlur={() => { if(selectedConversationId) messagingApi.setTyping(selectedConversationId, false).catch(()=>{}); }}
          onSend={sendMessage}
          disabled={!selectedConversationId}
        />
      </Card>
    </div>
  );
}
