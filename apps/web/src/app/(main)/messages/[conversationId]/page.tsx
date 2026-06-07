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
    <div className="flex flex-col h-screen pb-20">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200">
        <button onClick={() => router.back()} className="text-blue-500">&larr;</button>
        <span className="font-semibold text-[#262626]">{otherUsername || 'Chat'}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-[#262626] rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200">
        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="text-blue-500 font-semibold text-sm disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
