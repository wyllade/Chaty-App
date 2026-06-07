import { supabase } from './supabase';

type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'story_reply';

export async function createNotification(
  userId: string,
  type: NotificationType,
  actorId: string,
  postId?: string,
) {
  if (userId === actorId) return;

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    actor_id: actorId,
    post_id: postId || null,
  });
}
