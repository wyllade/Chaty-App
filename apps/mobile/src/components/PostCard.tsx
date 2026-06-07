import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { formatTimeAgo } from '@chaty/shared';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { createNotification } from '../lib/notifications';

interface PostCardProps {
  post: {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    user_id: string;
    user: {
      username: string;
      avatar_url: string | null;
    };
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
  currentUserId: string;
  onLike?: () => void;
  onComment?: () => void;
}

export function PostCard({ post, currentUserId, onLike, onComment }: PostCardProps) {
  const isLiked = post.likes?.some((l) => l.user_id === currentUserId);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  async function toggleLike() {
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', post.id);
      if (error) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      }
    } else {
      const { error } = await supabase.from('likes').insert({
        user_id: currentUserId,
        post_id: post.id,
      });
      if (error) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      } else {
        createNotification(post.user_id, 'like', currentUserId, post.id);
      }
    }
    onLike?.();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar uri={post.user?.avatar_url} username={post.user?.username} size={32} />
        <Text style={styles.username}>{post.user?.username}</Text>
      </View>

      <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />

      <View style={styles.actions}>
        <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
          <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
            {liked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↗️</Text>
        </TouchableOpacity>
      </View>

      {likeCount > 0 && (
        <Text style={styles.likes}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
      )}

      <View style={styles.captionRow}>
        <Text style={styles.username}>{post.user?.username}</Text>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>

      {post.comments?.length > 0 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>
            View all {post.comments.length} comments
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
    marginRight: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  likedIcon: {
    color: '#ED4956',
  },
  likes: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  captionRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  caption: {
    fontSize: 14,
    color: '#262626',
    flexShrink: 1,
  },
  viewComments: {
    fontSize: 14,
    color: '#8E8E8E',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  timeAgo: {
    fontSize: 11,
    color: '#8E8E8E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
});
