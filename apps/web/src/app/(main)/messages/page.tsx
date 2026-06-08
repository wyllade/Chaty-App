'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatTimeAgo } from '@chaty/shared';

interface Conversation {
  id: string;
  last_message_at: string | null;
  participant: { id: string; username: string; avatar_url: string | null };
  last_message: { content: string | null; image_url: string | null; created_at: string } | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
  }, [currentUserId]);

  async function loadConversations() {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (!participations || participations.length === 0) return;

    const convoIds = participations.map((p) => p.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('id, last_message_at, messages(id, content, image_url, created_at)')
      .in('id', convoIds)
      .order('last_message_at', { ascending: false });

    if (!convos) return;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user:users(id, username, avatar_url)')
      .in('conversation_id', convoIds);

    const participantMap: Record<string, { id: string; username: string; avatar_url: string | null }> = {};
    participants?.forEach((p) => {
      const user = p.user as unknown as { id: string; username: string; avatar_url: string | null };
      if (user.id !== currentUserId) participantMap[p.conversation_id] = user;
    });

    const list: Conversation[] = convos.map((c) => {
      const msgs = (c.messages as unknown as { id: string; content: string | null; image_url: string | null; created_at: string }[]) || [];
      return {
        id: c.id,
        last_message_at: c.last_message_at,
        participant: participantMap[c.id] || { id: '', username: 'Unknown', avatar_url: null },
        last_message: msgs[msgs.length - 1] || null,
      };
    });

    setConversations(list);
  }

  return (
    <div className="px-4 py-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Messages</h1>
        <Link
          href="/messages/new"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl transition-shadow"
        >
          +
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center mt-20 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white text-3xl opacity-50">
            ✉️
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No messages</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Start a conversation</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c, i) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className={`flex items-center gap-3 p-3 glass rounded-2xl card-hover animate-fade-in stagger-${Math.min(i + 2, 10)}`}
            >
              <div className="w-12 h-12 rounded-full gradient-ring p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white font-medium">
                    {c.participant.username[0]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{c.participant.username}</span>
                  {c.last_message && (
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatTimeAgo(c.last_message.created_at)}</span>
                  )}
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {c.last_message?.content || (c.last_message?.image_url ? '📷 Photo' : 'No messages yet')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
