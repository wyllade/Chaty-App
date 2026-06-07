import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';
import { followUser, unfollowUser, getFollowCounts } from '../../lib/follow';

interface UserProfile {
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

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId || !currentUserId) return;

    async function load() {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) setProfile(profileData as UserProfile);

      const { data: postData } = await supabase
        .from('posts')
        .select('id, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postData) setPosts(postData);

      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      setIsFollowed(!!followData);
      setFollowCounts(await getFollowCounts(userId));
      setLoading(false);
    }

    load();
  }, [userId, currentUserId]);

  async function handleFollow() {
    if (isFollowed) {
      await unfollowUser(currentUserId, userId);
      setIsFollowed(false);
      setFollowCounts((s) => ({ ...s, followers: s.followers - 1 }));
    } else {
      await followUser(currentUserId, userId);
      setIsFollowed(true);
      setFollowCounts((s) => ({ ...s, followers: s.followers + 1 }));
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <Avatar uri={profile.avatar_url} username={profile.username} size={80} />
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followCounts.followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followCounts.following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>

          {currentUserId !== userId && (
            <TouchableOpacity
              style={[styles.followButton, isFollowed && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followText, isFollowed && styles.followingText]}>
                {isFollowed ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}

          {posts.length > 0 && <Text style={styles.postsLabel}>Posts</Text>}
        </View>
      }
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <Image source={{ uri: item.image_url }} style={styles.gridImage} />
      )}
    />
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
    backgroundColor: '#FFF',
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  backText: {
    fontSize: 16,
    color: '#0095F6',
    fontWeight: '600',
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
  followButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0095F6',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  followText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingText: {
    color: '#262626',
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
});
