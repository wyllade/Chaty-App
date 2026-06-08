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
    <div className="pb-20 animate-fade-in">
      <div className="relative h-32 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFB347]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      </div>

      <div className="px-4 -mt-12 relative z-10">
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full gradient-ring p-[3px] shadow-xl mx-auto">
            <div className="w-full h-full rounded-full bg-white p-[3px]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                {profile.username[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{profile.username}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{profile.display_name}</p>
            {profile.bio && <p className="text-sm mt-2 px-4" style={{ color: 'var(--color-text-primary)' }}>{profile.bio}</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6 animate-scale-in">
          <div className="flex justify-around">
            <div className="text-center animate-fade-in stagger-1">
              <p className="text-xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#FFB347] bg-clip-text text-transparent">{postCount}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>posts</p>
            </div>
            <div className="text-center animate-fade-in stagger-2">
              <p className="text-xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">{followerCount}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>followers</p>
            </div>
            <div className="text-center animate-fade-in stagger-3">
              <p className="text-xl font-bold bg-gradient-to-r from-[#10B981] to-[#34D399] bg-clip-text text-transparent">{followingCount}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>following</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-semibold hover-glow transition-all duration-200 hover:scale-[1.02] active:scale-95"
          style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-light)', color: '#EF4444' }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
