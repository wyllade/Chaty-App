'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function NewMessagePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!query.trim() || !currentUserId) return;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20);
      if (data) setResults(data);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  useEffect(() => {
    if (query.trim() || !currentUserId) return;

    const timer = setTimeout(() => setResults([]), 0);
    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  async function startConversation(otherUserId: string) {
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (existing) {
      const convoIds = existing.map((c) => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', convoIds)
        .single();

      if (match) {
        router.push(`/messages/${match.conversation_id}`);
        return;
      }
    }

    const { data: convo } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();

    if (!convo) return;

    await supabase.from('conversation_participants').insert([
      { conversation_id: convo.id, user_id: currentUserId },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);

    router.push(`/messages/${convo.id}`);
  }

  return (
    <div className="px-4 py-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Link href="/messages" className="text-sm font-semibold transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
          ← Cancel
        </Link>
        <h1 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>New Message</h1>
        <div className="w-12" />
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-focus w-full rounded-xl px-4 py-3 text-sm outline-none pl-10"
          style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div className="space-y-1">
        {results.map((user) => (
          <button
            key={user.id}
            onClick={() => startConversation(user.id)}
            className="flex items-center gap-3 p-3 w-full text-left rounded-xl transition-all hover:glass card-hover"
          >
            <div className="w-10 h-10 rounded-full gradient-ring p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white font-medium text-sm">
                  {user.username[0].toUpperCase()}
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{user.username}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.display_name}</p>
            </div>
          </button>
        ))}
      </div>

      {query && results.length === 0 && (
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No users found</p>
        </div>
      )}
    </div>
  );
}
