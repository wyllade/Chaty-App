import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { PostCard } from '../../components/PostCard';
import { CommentSheet } from '../../components/CommentSheet';
import { StoryRing } from '../../components/StoryRing';

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

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

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
    setRefreshing(false);
  }

  async function loadStories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('stories')
      .select('user_id, user:users!inner(username, avatar_url)')
      .or(`user_id.eq.${user.id},user_id.in.(${
        (await supabase.from('follows').select('following_id').eq('follower_id', user.id)).data?.map(f => f.following_id).join(',') || ''
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
      if (currentUserId) {
        setStoryUsers(users.filter(u => u.user_id !== currentUserId));
      } else {
        setStoryUsers(users);
      }
    }
  }

  useEffect(() => {
    loadPosts();
    loadStories();
  }, [currentUserId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
    loadStories();
  }, []);

  function renderStoryBar() {
    if (storyUsers.length === 0) return null;

    return (
      <View style={styles.storyBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyContent}>
          {storyUsers.map((u) => (
            <StoryRing
              key={u.user_id}
              uri={u.avatar_url}
              username={u.username}
              hasStory
              onPress={() => router.push(`/stories?userId=${u.user_id}`)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Chaty</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStoryBar}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUserId}
            onComment={() => setCommentPostId(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0095F6" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>Follow users to see their posts</Text>
          </View>
        }
      />

{commentPostId && (() => {
  const post = posts.find((p) => p.id === commentPostId);
  return (
    <CommentSheet
      visible={!!commentPostId}
      postId={commentPostId}
      postUserId={post?.user_id || ''}
      currentUserId={currentUserId}
      onClose={() => setCommentPostId(null)}
    />
  );
})()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
  },
  storyBar: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
    paddingVertical: 12,
  },
  storyContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: '#8E8E8E',
  },
});
