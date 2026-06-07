import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';
import { formatTimeAgo } from '@chaty/shared';

interface Conversation {
  id: string;
  last_message_at: string | null;
  participant: { id: string; username: string; avatar_url: string | null };
  last_message: { content: string | null; image_url: string | null; created_at: string } | null;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  async function loadConversations() {
    if (!currentUserId) return;

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (!participations || participations.length === 0) return;

    const convoIds = participations.map((p) => p.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('id, last_message_at, messages(id, content, image_url, created_at)')
      .in('id', convoIds)
      .order('last_message_at', { ascending: false });

    if (!convos) return;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user:users(id, username, avatar_url)')
      .in('conversation_id', convoIds);

    const participantMap: Record<string, { id: string; username: string; avatar_url: string | null }> = {};
    participants?.forEach((p) => {
      const user = p.user as unknown as { id: string; username: string; avatar_url: string | null };
      if (user.id !== currentUserId) {
        participantMap[p.conversation_id] = user;
      }
    });

    const list: Conversation[] = convos.map((c) => {
      const msgs = c.messages as unknown as { id: string; content: string | null; image_url: string | null; created_at: string }[] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return {
        id: c.id,
        last_message_at: c.last_message_at,
        participant: participantMap[c.id] || { id: '', username: 'Unknown', avatar_url: null },
        last_message: lastMsg,
      };
    });

    setConversations(list);
  }

  useFocusEffect(
    useCallback(() => { loadConversations(); }, [currentUserId])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/messages/new')}>
          <Text style={styles.newMsgBtn}>✎</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.convoRow}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <Avatar uri={item.participant.avatar_url} username={item.participant.username} size={52} />
            <View style={styles.convoInfo}>
              <View style={styles.convoHeader}>
                <Text style={styles.convoName}>{item.participant.username}</Text>
                {item.last_message && (
                  <Text style={styles.convoTime}>{formatTimeAgo(item.last_message.created_at)}</Text>
                )}
              </View>
              <Text style={styles.convoPreview} numberOfLines={1}>
                {item.last_message?.content || (item.last_message?.image_url ? '📷 Photo' : 'No messages yet')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages</Text>
            <Text style={styles.emptySub}>Start a conversation</Text>
          </View>
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#262626' },
  newMsgBtn: { fontSize: 22, color: '#0095F6', fontWeight: '600' },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  convoInfo: { flex: 1 },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  convoName: { fontWeight: '600', fontSize: 15, color: '#262626' },
  convoTime: { fontSize: 12, color: '#8E8E8E' },
  convoPreview: { fontSize: 14, color: '#8E8E8E' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#262626' },
  emptySub: { fontSize: 14, color: '#8E8E8E', marginTop: 4 },
});
