import { supabase } from './supabase';

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: followingId,
    type: 'follow',
    actor_id: followerId,
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}
