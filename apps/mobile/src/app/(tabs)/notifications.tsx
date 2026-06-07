import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';

interface NotificationItem {
  id: string;
  type: string;
  created_at: string;
  read: boolean;
  actor: { username: string; avatar_url: string | null };
}

const NOTIFICATION_LABELS: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  message: 'sent you a message',
  story_reply: 'replied to your story',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  async function load() {
    if (!currentUserId) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, created_at, read, actor:actor_id(username, avatar_url)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setNotifications(data as unknown as NotificationItem[]);
  }

  useFocusEffect(useCallback(() => { load(); }, [currentUserId]));

  async function markAllRead() {
    if (!currentUserId) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentUserId)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Activity</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => !item.read && markRead(item.id)}>
            <Avatar uri={item.actor?.avatar_url} username={item.actor?.username} size={36} />
            <View style={styles.content}>
              <Text style={styles.text}>
                <Text style={styles.username}>{item.actor?.username} </Text>
                {NOTIFICATION_LABELS[item.type] || 'interacted with you'}
              </Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 12 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#262626' },
  markReadText: { fontSize: 14, color: '#0095F6', fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  content: { flex: 1 },
  text: { fontSize: 14, color: '#262626' },
  username: { fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0095F6' },
  empty: { textAlign: 'center', color: '#8E8E8E', marginTop: 60, fontSize: 14 },
});
