import { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  search: '🔍',
  messages: '✉️',
  notifications: '❤️',
  profile: '👤',
};

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    async function loadUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('read', false);
      if (count !== null) setUnreadCount(count);
    }

    loadUnread();

    const channel = supabase
      .channel('notifications-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`,
      }, () => {
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: '#DBDBDB',
          borderTopWidth: 0.5,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#262626',
        tabBarInactiveTintColor: '#8E8E8E',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS.index}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS.search}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS.messages}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <View>
              <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS.notifications}</Text>
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  backgroundColor: '#ED4956',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS.profile}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
