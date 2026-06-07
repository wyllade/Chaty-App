'use client';

import { useEffect, useState } from 'react';
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
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-4 pb-20">
      <h1 className="text-2xl font-bold text-[#262626] mb-4 px-2">Chaty</h1>

      {storyUsers.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-2 pb-4 mb-2 border-b border-gray-100">
          {storyUsers.map((u) => (
            <Link
              key={u.user_id}
              href={`/stories/${u.user_id}`}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-pink-500">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {u.username[0]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {u.username}
              </span>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-[#262626]">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1">Follow users to see their posts</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))
      )}
    </div>
  );
}
