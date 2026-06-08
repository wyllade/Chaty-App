'use client';

import { useState } from 'react';
import { formatTimeAgo } from '@chaty/shared';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';
import { HeartIcon, CommentIcon, ShareIcon } from '@/components/Icons';

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
  const [animLike, setAnimLike] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; content: string; created_at: string; user_id: string; user: { username: string; avatar_url: string | null } }[]>([]);
  const [commentText, setCommentText] = useState('');

  async function toggleLike() {
    const becoming = !liked;
    setLiked(becoming);
    setLikeCount((c) => (becoming ? c + 1 : c - 1));
    if (becoming) {
      setAnimLike(true);
      setTimeout(() => setAnimLike(false), 400);
    }

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
    <div className="glass rounded-2xl mb-4 overflow-hidden card-hover animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full gradient-ring flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {post.user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{post.user?.username}</span>
      </div>

      <div className="relative overflow-hidden group cursor-pointer">
        <img
          src={post.image_url}
          alt="Post"
          className="w-full aspect-square object-cover image-reveal transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={toggleLike} className={`transition-all duration-200 ${liked ? 'text-[#EF4444]' : ''} hover:scale-110 active:scale-90`}>
            {liked ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={animLike ? 'animate-heart-beat' : ''}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <HeartIcon size={24} />
            )}
          </button>
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}
            className="transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <CommentIcon size={24} />
          </button>
          <button className="transition-all duration-200 hover:scale-110 active:scale-90 ml-auto" style={{ color: 'var(--color-text-primary)' }}>
            <ShareIcon size={24} />
          </button>
        </div>

        {likeCount > 0 && (
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          <span className="font-semibold">{post.user?.username}</span>{' '}
          {post.caption}
        </p>

        {post.comments?.length > 0 && (
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}
            className="text-sm mt-1 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            View all {post.comments.length} comments
          </button>
        )}

        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>{formatTimeAgo(post.created_at)}</p>
      </div>

      {showComments && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--color-border-light)' }}>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{c.user?.username}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{c.content}</span>
            </div>
          ))}
          <form onSubmit={sendComment} className="flex gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="input-focus flex-1 rounded-xl px-4 py-2 text-sm outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
