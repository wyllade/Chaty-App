'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [text, setText] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [otherUsername, setOtherUsername] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadOtherUser(userId: string) {
    const { data } = await supabase
      .from('conversation_participants')
      .select('user_id, user:users!inner(id, username)')
      .eq('conversation_id', conversationId)
      .neq('user_id', userId);

    if (data?.[0]) {
      const user = (data[0] as unknown as { user_id: string; user: { id: string; username: string } }).user;
      setOtherUserId(user.id);
      setOtherUsername(user.username);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const msg = text.trim();
    setText('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: msg,
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
    <div className="flex flex-col h-screen animate-fade-in">
      <div className="glass border-b border-white/20 px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-sm transition-transform hover:scale-110" style={{ color: 'var(--color-text-primary)' }}>
            ←
          </button>
          <div className="w-9 h-9 rounded-full gradient-ring p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white font-medium text-sm">
                {otherUsername[0]?.toUpperCase() || '?'}
              </div>
            </div>
          </div>
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{otherUsername || 'Chat'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" ref={bottomRef}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId;
          const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1]?.created_at).toDateString();
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center mb-4">
                  <span className="text-[10px] font-medium px-3 py-1 rounded-full" style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-secondary)' }}>
                    {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isMine ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? 'bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] text-white rounded-2xl rounded-br-md shadow-lg shadow-[#FF6B6B]/20 hover-lift'
                      : 'glass rounded-2xl rounded-bl-md hover-lift'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : ''}`} style={{ color: isMine ? undefined : 'var(--color-text-secondary)' }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass border-t border-white/20 px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-focus flex-1 rounded-full px-5 py-2.5 text-sm outline-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="btn-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#FF6B6B]/20"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
