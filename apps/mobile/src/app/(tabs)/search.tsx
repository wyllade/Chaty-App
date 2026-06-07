import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';
import { followUser, unfollowUser } from '../../lib/follow';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
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
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

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
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Search</Text>

      <TextInput
        style={styles.input}
        placeholder="Search users..."
        placeholderTextColor="#8E8E8E"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => router.push(`/profile/${item.id}`)}
            >
              <Avatar uri={item.avatar_url} username={item.username} size={40} />
              <View style={styles.userText}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.displayName}>{item.display_name}</Text>
              </View>
            </TouchableOpacity>

            {currentUserId !== item.id && (
              <TouchableOpacity
                style={[styles.followBtn, followingMap[item.id] && styles.followingBtn]}
                onPress={() => handleFollow(item.id)}
              >
                <Text style={[styles.followBtnText, followingMap[item.id] && styles.followingBtnText]}>
                  {followingMap[item.id] ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          query ? <Text style={styles.empty}>No users found</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    marginHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#262626',
    borderWidth: 1,
    borderColor: '#DBDBDB',
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E8E',
    marginTop: 40,
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userText: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
  },
  displayName: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#0095F6',
  },
  followingBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  followBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#262626',
  },
});
