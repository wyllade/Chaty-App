import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function NewMessageScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20);
      if (data) setResults(data);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  async function startConversation(otherUserId: string, otherUsername: string) {
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (existing) {
      const convoIds = existing.map((c) => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', convoIds)
        .single();

      if (match) {
        router.replace(`/messages/${match.conversation_id}`);
        return;
      }
    }

    const { data: convo } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();

    if (!convo) return;

    await supabase.from('conversation_participants').insert([
      { conversation_id: convo.id, user_id: currentUserId },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);

    router.replace(`/messages/${convo.id}`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={{ width: 60 }} />
      </View>

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
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => startConversation(item.id, item.username)}
          >
            <Avatar uri={item.avatar_url} username={item.username} size={44} />
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.displayName}>{item.display_name}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query ? <Text style={styles.empty}>No users found</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  cancelText: { fontSize: 16, color: '#0095F6' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#262626' },
  input: {
    margin: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  username: { fontWeight: '600', fontSize: 15, color: '#262626' },
  displayName: { fontSize: 13, color: '#8E8E8E' },
  empty: { textAlign: 'center', color: '#8E8E8E', marginTop: 40 },
});
