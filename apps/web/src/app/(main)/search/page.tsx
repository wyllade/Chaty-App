'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { followUser, unfollowUser } from '@/lib/follow';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (data) {
      setResults(data);

      if (currentUserId) {
        const ids = data.map((u) => u.id);
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', ids);

        const map: Record<string, boolean> = {};
        follows?.forEach((f) => { map[f.following_id] = true; });
        setFollowingMap(map);
      }
    }
  }

  async function handleFollow(userId: string) {
    if (followingMap[userId]) {
      await unfollowUser(currentUserId, userId);
      setFollowingMap((m) => ({ ...m, [userId]: false }));
    } else {
      await followUser(currentUserId, userId);
      setFollowingMap((m) => ({ ...m, [userId]: true }));
    }
  }

  return (
    <div className="px-4 py-4 pb-20 animate-fade-in">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
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
      </form>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user, i) => (
            <div key={user.id} className={`glass rounded-2xl p-3 card-hover flex items-center gap-3 animate-fade-in stagger-${Math.min(i + 2, 10)}`}>
              <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full gradient-ring p-[2px] shrink-0">
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white font-medium text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{user.username}</p>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>{user.display_name}</p>
                </div>
              </Link>

              {currentUserId !== user.id && (
                <button
                  onClick={() => handleFollow(user.id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                    followingMap[user.id]
                      ? 'glass'
                      : 'btn-gradient text-white shadow-lg shadow-[#FF6B6B]/20'
                  }`}
                >
                  {followingMap[user.id] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && (
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No users found</p>
        </div>
      )}
    </div>
  );
}
