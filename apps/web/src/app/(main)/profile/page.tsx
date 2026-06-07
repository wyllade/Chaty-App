'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      const { count: pc } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
      const { count: fwc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

      if (pc !== null) setPostCount(pc);
      if (fc !== null) setFollowerCount(fc);
      if (fwc !== null) setFollowingCount(fwc);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  if (!profile) return null;

  return (
    <div className="px-4 py-6 pb-20">
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

      <div className="flex justify-around mb-6">
        <div className="text-center">
          <p className="font-bold text-[#262626]">{postCount}</p>
          <p className="text-xs text-gray-400">posts</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-[#262626]">{followerCount}</p>
          <p className="text-xs text-gray-400">followers</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-[#262626]">{followingCount}</p>
          <p className="text-xs text-gray-400">following</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-2 border border-gray-200 rounded-lg text-sm text-red-500 font-semibold"
      >
        Log Out
      </button>
    </div>
  );
}
