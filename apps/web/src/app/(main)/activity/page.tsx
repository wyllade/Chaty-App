'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    load();
  }, [currentUserId]);

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, created_at, read, actor:actor_id(username, avatar_url)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setNotifications(data as unknown as NotificationItem[]);
  }

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
    <div className="px-4 py-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#262626]">Activity</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-500 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-400 mt-20">No notifications yet</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className="flex items-center gap-3 py-3 border-b border-gray-50 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
              {n.actor?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <p className="text-sm text-[#262626] flex-1">
              <span className="font-semibold">{n.actor?.username}</span>{' '}
              {NOTIFICATION_LABELS[n.type] || 'interacted with you'}
            </p>
            {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          </div>
        ))
      )}
    </div>
  );
}
