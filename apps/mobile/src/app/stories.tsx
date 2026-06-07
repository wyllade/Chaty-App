import { useState, useEffect, useRef } from 'react';
import {
  View, Image, Text, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StoryItem {
  id: string;
  image_url: string;
  created_at: string;
  user_id: string;
  user: { username: string; avatar_url: string | null };
}

export default function StoriesViewer() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadStories() {
      const { data } = await supabase
        .from('stories')
        .select('id, image_url, created_at, user_id, user:users(username, avatar_url)')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setStories(data as unknown as StoryItem[]);
      } else {
        router.back();
      }
    }
    loadStories();
  }, [userId]);

  const currentStory = stories[currentIndex];

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    progressRef.current = 0;

    timerRef.current = setInterval(() => {
      progressRef.current += 0.02;
      setProgress((p) => p + 0.02);

      if (progressRef.current >= 1) {
        goNext();
      }
    }, 50);
  }

  useEffect(() => {
    if (stories.length > 0) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, stories.length]);

  function goNext() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.back();
    }
  }

  function goPrev() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      router.back();
    }
  }

  if (!currentStory) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentStory.image_url }} style={styles.image} resizeMode="contain" />

      <View style={styles.progressRow}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.topBar}>
        <Text style={styles.username}>{currentStory.user?.username}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.tapLeft} onPress={goPrev} />
      <TouchableOpacity style={styles.tapRight} onPress={goNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 70,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '300',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '40%',
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '60%',
  },
});
