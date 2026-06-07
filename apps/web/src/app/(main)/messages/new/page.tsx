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
    if (!query.trim() || !currentUserId) { setResults([]); return; }

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
    <div className="px-4 py-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <Link href="/messages" className="text-blue-500">&larr; Cancel</Link>
        <h1 className="font-semibold text-[#262626]">New Message</h1>
        <div className="w-12" />
      </div>

      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none mb-4"
      />

      {results.map((user) => (
        <button
          key={user.id}
          onClick={() => startConversation(user.id)}
          className="flex items-center gap-3 py-3 w-full text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-[#262626]">{user.username}</p>
            <p className="text-sm text-gray-400">{user.display_name}</p>
          </div>
        </button>
      ))}

      {query && results.length === 0 && (
        <p className="text-center text-gray-400 mt-10">No users found</p>
      )}
    </div>
  );
}
