import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { formatTimeAgo } from '@chaty/shared';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { createNotification } from '../lib/notifications';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentSheetProps {
  visible: boolean;
  postId: string;
  postUserId: string;
  currentUserId: string;
  onClose: () => void;
}

export function CommentSheet({ visible, postId, postUserId, currentUserId, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, user:users(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  }

  useEffect(() => {
    if (visible) loadComments();
  }, [visible, postId]);

  async function sendComment() {
    if (!content.trim()) return;
    const text = content.trim();
    setLoading(true);
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUserId,
      content: text,
    });
    setLoading(false);
    if (!error) {
      setContent('');
      createNotification(postUserId, 'comment', currentUserId, postId);
      loadComments();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Comments</Text>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Avatar uri={item.user?.avatar_url} username={item.user?.username} size={28} />
                <View style={styles.commentBody}>
                  <Text>
                    <Text style={styles.commentUsername}>{item.user?.username} </Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No comments yet</Text>
            }
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#8E8E8E"
              value={content}
              onChangeText={setContent}
              multiline
            />
            <TouchableOpacity
              onPress={sendComment}
              disabled={loading || !content.trim()}
              style={styles.sendButton}
            >
              <Text
                style={[
                  styles.sendText,
                  (!content.trim() || loading) && styles.sendDisabled,
                ]}
              >
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DBDBDB',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    textAlign: 'center',
    marginBottom: 12,
  },
  list: {
    flex: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  commentBody: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
  },
  commentText: {
    fontSize: 14,
    color: '#262626',
  },
  commentTime: {
    fontSize: 11,
    color: '#8E8E8E',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E8E',
    fontSize: 14,
    marginTop: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DBDBDB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    paddingHorizontal: 8,
  },
  sendText: {
    color: '#0095F6',
    fontWeight: '600',
    fontSize: 14,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
