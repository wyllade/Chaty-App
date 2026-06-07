'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { followUser, unfollowUser } from '@/lib/follow';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface UserPost {
  id: string;
  image_url: string;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId || !currentUserId) return;

    async function load() {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as UserProfile);
      } else {
        router.back();
        return;
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('id, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postData) {
        setPosts(postData);
        setPostCount(postData.length);
      }

      const { count: fc } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: fwc } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setFollowCounts({ followers: fc ?? 0, following: fwc ?? 0 });

      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      setIsFollowed(!!followData);
      setLoading(false);
    }

    load();
  }, [userId, currentUserId, router]);

  async function handleFollow() {
    if (isFollowed) {
      await unfollowUser(currentUserId, userId);
      setIsFollowed(false);
      setFollowCounts((s) => ({ ...s, followers: s.followers - 1 }));
    } else {
      await followUser(currentUserId, userId);
      setIsFollowed(true);
      setFollowCounts((s) => ({ ...s, followers: s.followers + 1 }));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="px-4 py-6 pb-20">
      <Link href="/search" className="text-blue-500 font-semibold text-sm mb-4 inline-block">
        &larr; Back
      </Link>

      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
          {profile.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#262626]">{profile.username}</h1>
          <p className="text-sm text-gray-400">{profile.display_name}</p>
          {profile.bio && <p className="text-sm text-[#262626] mt-1">{profile.bio}</p>}
        </div>
      </div>

      <div className="flex justify-around mb-4">
        <div className="text-center">
          <p className="font-bold text-[#262626]">{postCount}</p>
          <p className="text-xs text-gray-400">posts</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-[#262626]">{followCounts.followers}</p>
          <p className="text-xs text-gray-400">followers</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-[#262626]">{followCounts.following}</p>
          <p className="text-xs text-gray-400">following</p>
        </div>
      </div>

      {currentUserId !== userId && (
        <button
          onClick={handleFollow}
          className={`w-full py-2 rounded-lg text-sm font-semibold mb-6 ${
            isFollowed
              ? 'border border-gray-200 text-[#262626]'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isFollowed ? 'Following' : 'Follow'}
        </button>
      )}

      {posts.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square bg-gray-100">
              <img
                src={post.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
