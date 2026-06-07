import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../../components/Avatar';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface UserPost {
  id: string;
  image_url: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData as Profile);

      const { data: postData } = await supabase
        .from('posts')
        .select('id, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (postData) { setPosts(postData); setStats((s) => ({ ...s, posts: postData.length })); }

      const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
      const { count: fwc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
      if (fc !== null) setStats((s) => ({ ...s, followers: fc }));
      if (fwc !== null) setStats((s) => ({ ...s, following: fwc }));
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  if (!profile) return null;

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          <View style={styles.profileSection}>
            <Avatar uri={profile.avatar_url} username={profile.username} size={80} />
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          {posts.length > 0 && (
            <Text style={styles.postsLabel}>Posts</Text>
          )}
        </View>
      }
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <Image source={{ uri: item.image_url }} style={styles.gridImage} />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 8,
  },
  displayName: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  bio: {
    fontSize: 14,
    color: '#262626',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#DBDBDB',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
    marginHorizontal: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ED4956',
    fontSize: 14,
    fontWeight: '600',
  },
  postsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  gridImage: {
    width: '33.33%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#FFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
});
