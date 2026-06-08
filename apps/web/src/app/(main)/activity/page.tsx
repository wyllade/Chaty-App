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
    <div className="px-4 py-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Activity</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-semibold btn-gradient rounded-xl px-4 py-2 text-white transition-all hover:shadow-lg hover:shadow-[#FF6B6B]/20"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center mt-20 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white text-3xl opacity-50">
            🔔
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`${n.read ? '' : 'unread-accent'} flex items-center gap-3 p-3 rounded-2xl card-hover cursor-pointer transition-all ${
                n.read ? 'opacity-60' : 'glass'
              } animate-fade-in stagger-${Math.min(i + 2, 10)}`}
            >
              <div className={`w-10 h-10 rounded-full ${n.read ? '' : 'gradient-ring'} p-[2px] shrink-0`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white text-xs font-medium">
                    {n.actor?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>
              <p className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                <span className="font-semibold">{n.actor?.username}</span>{' '}
                {NOTIFICATION_LABELS[n.type] || 'interacted with you'}
              </p>
              {!n.read && (
                <div className="relative">
                  <span className="w-3 h-3 rounded-full shrink-0 block" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFB347)' }} />
                  <span className="badge-pulse absolute inset-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
