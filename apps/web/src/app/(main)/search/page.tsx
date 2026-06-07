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
    <div className="px-4 py-4 pb-20">
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:bg-white focus:border focus:border-blue-500"
        />
      </form>

      {results.map((user) => (
        <div key={user.id} className="flex items-center gap-3 py-3">
          <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#262626]">{user.username}</p>
              <p className="text-sm text-gray-400">{user.display_name}</p>
            </div>
          </Link>

          {currentUserId !== user.id && (
            <button
              onClick={() => handleFollow(user.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                followingMap[user.id]
                  ? 'border border-gray-200 text-[#262626]'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {followingMap[user.id] ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      ))}

      {results.length === 0 && query && (
        <p className="text-center text-gray-400 mt-10">No users found</p>
      )}
    </div>
  );
}
