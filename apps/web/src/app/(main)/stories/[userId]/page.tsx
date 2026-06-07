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
          className="w-full h-full object-contain"
        />

        <div className="absolute top-12 left-4 right-4 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white rounded transition-all duration-75"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-16 left-4 right-4 flex items-center justify-between">
          <span className="text-white font-semibold">{story.user?.username}</span>
          <button onClick={() => router.back()} className="text-white text-xl">&times;</button>
        </div>

        <button onClick={recede} className="absolute left-0 top-0 bottom-0 w-2/5" />
        <button onClick={advance} className="absolute right-0 top-0 bottom-0 w-3/5" />
      </div>
    </div>
  );
}
