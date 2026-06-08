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
    <div className="pb-20 animate-fade-in">
      <div className="relative h-32 bg-gradient-to-r from-[#667EEA] via-[#764BA2] to-[#FF6B6B]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <Link href="/search" className="absolute top-4 left-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white text-sm backdrop-blur-md">
          ←
        </Link>
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

        <div className="glass rounded-2xl p-4 mb-4 animate-scale-in">
          <div className="flex justify-around">
            <div className="text-center animate-fade-in stagger-1">
              <p className="text-xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#FFB347] bg-clip-text text-transparent">{postCount}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>posts</p>
            </div>
            <div className="text-center animate-fade-in stagger-2">
              <p className="text-xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">{followCounts.followers}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>followers</p>
            </div>
            <div className="text-center animate-fade-in stagger-3">
              <p className="text-xl font-bold bg-gradient-to-r from-[#10B981] to-[#34D399] bg-clip-text text-transparent">{followCounts.following}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>following</p>
            </div>
          </div>
        </div>

        {currentUserId !== userId && (
          <button
            onClick={handleFollow}
            className={`w-full py-3 rounded-xl text-sm font-semibold mb-6 transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
              isFollowed
                ? 'glass'
                : 'btn-gradient text-white shadow-lg shadow-[#FF6B6B]/20'
            }`}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>
        )}

        {posts.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square rounded-xl overflow-hidden card-hover" style={{ background: 'var(--color-surface-card)' }}>
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
