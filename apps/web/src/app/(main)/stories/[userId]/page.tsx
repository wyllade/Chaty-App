'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface StoryItem {
  id: string;
  image_url: string;
  created_at: string;
  user: { username: string; avatar_url: string | null };
}

export default function StoryViewerPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('stories')
        .select('id, image_url, created_at, user:users(username, avatar_url)')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setStories(data as unknown as StoryItem[]);
      } else {
        router.back();
      }
    }
    load();
  }, [userId, router]);

  const advance = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      router.back();
    }
  }, [currentIndex, stories.length, router]);

  const recede = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    } else {
      router.back();
    }
  }, [currentIndex, router]);

  useEffect(() => {
    if (stories.length === 0) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.02;
        if (next >= 1) {
          advance();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [stories.length, advance]);

  const story = stories[currentIndex];

  if (!story) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full max-w-lg aspect-[9/16]">
        <img
          src={story.image_url}
          alt="Story"
          className="w-full h-full object-contain animate-scale-in"
        />

        <div className="absolute top-12 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="story-progress">
              <div
                className={`story-progress-fill ${i < currentIndex ? 'played' : ''} ${i === currentIndex ? 'active' : ''}`}
                style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-16 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-ring p-[2px]">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center text-white text-xs font-medium">
                  {story.user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </div>
            <span className="text-white font-semibold text-sm">{story.user?.username}</span>
          </div>
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>

        <button onClick={recede} className="absolute left-0 top-0 bottom-0 w-2/5 z-10 active:bg-white/5 transition-colors" />
        <button onClick={advance} className="absolute right-0 top-0 bottom-0 w-3/5 z-10 active:bg-white/5 transition-colors" />
      </div>
    </div>
  );
}
