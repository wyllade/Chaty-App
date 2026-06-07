'use client';

import { useState } from 'react';
import { formatTimeAgo } from '@chaty/shared';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

interface PostCardProps {
  post: {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    user_id: string;
    user: { username: string; avatar_url: string | null };
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
  currentUserId: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const isLiked = post.likes?.some((l) => l.user_id === currentUserId);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; content: string; created_at: string; user_id: string; user: { username: string; avatar_url: string | null } }[]>([]);
  const [commentText, setCommentText] = useState('');

  async function toggleLike() {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    if (liked) {
      await supabase.from('likes').delete().eq('user_id', currentUserId).eq('post_id', post.id);
    } else {
      await supabase.from('likes').insert({ user_id: currentUserId, post_id: post.id });
      createNotification(post.user_id, 'like', currentUserId, post.id);
    }
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, user:users(username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data as any);
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUserId,
      content: commentText.trim(),
    });
    setCommentText('');
    createNotification(post.user_id, 'comment', currentUserId, post.id);
    loadComments();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
          {post.user?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="font-semibold text-sm text-[#262626]">{post.user?.username}</span>
      </div>

      <img src={post.image_url} alt="Post" className="w-full aspect-square object-cover" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={toggleLike} className="text-2xl">
            {liked ? '❤️' : '🤍'}
          </button>
          <button onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }} className="text-2xl">
            💬
          </button>
          <button className="text-2xl">↗️</button>
        </div>

        {likeCount > 0 && (
          <p className="font-semibold text-sm text-[#262626] mb-1">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        <p className="text-sm text-[#262626]">
          <span className="font-semibold">{post.user?.username}</span>{' '}
          {post.caption}
        </p>

        {post.comments?.length > 0 && (
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}
            className="text-sm text-gray-400 mt-1"
          >
            View all {post.comments.length} comments
          </button>
        )}

        <p className="text-xs text-gray-400 uppercase mt-2">{formatTimeAgo(post.created_at)}</p>
      </div>

      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-2">
              <span className="font-semibold text-sm text-[#262626]">{c.user?.username}</span>
              <span className="text-sm text-[#262626]">{c.content}</span>
            </div>
          ))}
          <form onSubmit={sendComment} className="flex gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="text-sm font-semibold text-blue-500 disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
