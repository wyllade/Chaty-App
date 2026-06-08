'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';

interface FeedPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  user: { username: string; avatar_url: string | null };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

interface StoryUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      setCurrentUserId(session.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!currentUserId) return;

    async function loadPosts() {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, image_url, caption, created_at, user_id,
          user:users(username, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setPosts(data as unknown as FeedPost[]);
      setLoading(false);
    }

    async function loadStories() {
      const { data } = await supabase
        .from('stories')
        .select('user_id, user:users!inner(username, avatar_url)')
        .or(`user_id.eq.${currentUserId},user_id.in.(${
          (await supabase.from('follows').select('following_id').eq('follower_id', currentUserId)).data?.map(f => f.following_id).join(',') || ''
        })`)
        .gte('expires_at', new Date().toISOString());

      if (data) {
        const seen = new Set<string>();
        const users: StoryUser[] = [];
        for (const s of data as unknown as { user_id: string; user: { username: string; avatar_url: string | null } }[]) {
          if (!seen.has(s.user_id)) {
            seen.add(s.user_id);
            users.push({ user_id: s.user_id, username: s.user.username, avatar_url: s.user.avatar_url });
          }
        }
        setStoryUsers(users.filter(u => u.user_id !== currentUserId));
      }
    }

    loadPosts();
    loadStories();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-4 px-4 pb-20">
        <div className="flex gap-3 overflow-x-auto px-2 pb-4 mb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
              <div className="w-16 h-16 rounded-full skeleton-avatar" />
              <div className="w-12 skeleton-text" />
            </div>
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`glass rounded-2xl mb-4 overflow-hidden animate-fade-in stagger-${i + 1}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 skeleton-avatar" />
              <div className="w-24 skeleton-text" />
            </div>
            <div className="w-full aspect-square skeleton" />
            <div className="px-4 py-3 space-y-2">
              <div className="w-16 skeleton-text" />
              <div className="w-48 skeleton-text" />
              <div className="w-32 skeleton-text" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-4 pb-20">
      <div className="flex items-center justify-between mb-4 px-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          <span className="bg-gradient-to-r from-[#FF6B6B] to-[#FFB347] bg-clip-text text-transparent">Chaty</span>
        </h1>
        <Link href="/create" className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl hover:shadow-[#FF6B6B]/30 transition-shadow">
          +
        </Link>
      </div>

      {storyUsers.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-2 pb-4 mb-4 scrollbar-none">
          {storyUsers.map((u, i) => (
            <Link
              key={u.user_id}
              href={`/stories/${u.user_id}`}
              className={`flex flex-col items-center gap-1 min-w-[64px] animate-fade-in stagger-${(i % 7) + 1}`}
            >
              <div className="w-16 h-16 rounded-full p-[2px] gradient-ring shadow-lg">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white font-medium text-sm shadow-inner">
                    {u.username[0]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>
              <span className="text-xs truncate w-full text-center" style={{ color: 'var(--color-text-secondary)' }}>
                {u.username}
              </span>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white text-3xl opacity-50">
            📷
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No posts yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Follow users to see their posts</p>
        </div>
      ) : (
        posts.map((post, i) => (
          <div key={post.id} className={`animate-fade-in-up stagger-${Math.min(i % 7 + 1, 8)}`}>
            <PostCard post={post} currentUserId={currentUserId} />
          </div>
        ))
      )}
    </div>
  );
}
