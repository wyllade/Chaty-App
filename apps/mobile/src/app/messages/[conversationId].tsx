import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../../lib/notifications';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [text, setText] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [otherUsername, setOtherUsername] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        loadOtherUser(session.user.id);
      }
    });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    loadMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  async function loadOtherUser(userId: string) {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, user:users!inner(id, username)')
      .eq('conversation_id', conversationId)
      .neq('user_id', userId);

    if (participants?.[0]) {
      const user = (participants[0] as unknown as { user_id: string; user: { id: string; username: string } }).user;
      setOtherUserId(user.id);
      setOtherUsername(user.username);
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageText,
    });

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (otherUserId) {
      createNotification(otherUserId, 'message', currentUserId);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUsername || 'Chat'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMine = item.sender_id === currentUserId;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
              <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#8E8E8E"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} disabled={!text.trim()}>
          <Text style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  backText: { fontSize: 22, color: '#0095F6' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#262626' },
  listContent: { padding: 16 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble: { backgroundColor: '#0095F6', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F0F0F0', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#262626' },
  myBubbleText: { color: '#FFF' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DBDBDB',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 80,
  },
  sendBtn: { color: '#0095F6', fontWeight: '600', fontSize: 15, paddingHorizontal: 4 },
});
