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

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return !!data;
}

export async function getFollowCounts(userId: string) {
  const { count: followers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  const { count: following } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return { followers: followers ?? 0, following: following ?? 0 };
}
