import { useState, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

type Mode = 'post' | 'story';

export default function CreateScreen() {
  const [mode, setMode] = useState<Mode>('post');
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: mode === 'post' ? [1, 1] : [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(mode === 'story' ? 'stories' : 'posts')
      .upload(fileName, blob, { contentType: `image/${fileExt}` });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(mode === 'story' ? 'stories' : 'posts')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleShare() {
    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadImage(image);

      if (mode === 'story') {
        const { error } = await supabase.from('stories').insert({
          user_id: userId,
          image_url: imageUrl,
        });
        if (error) throw error;
        Alert.alert('Story shared!', 'Your story will be visible for 24 hours.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        const { error } = await supabase.from('posts').insert({
          user_id: userId,
          image_url: imageUrl,
          caption: caption || null,
          location: location || null,
        });
        if (error) throw error;
        Alert.alert('Posted!', 'Your photo has been shared.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      }

      setImage(null);
      setCaption('');
      setLocation('');
    } catch {
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (!image) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Create</Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'post' && styles.modeActive]}
            onPress={() => setMode('post')}
          >
            <Text style={[styles.modeText, mode === 'post' && styles.modeTextActive]}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'story' && styles.modeActive]}
            onPress={() => setMode('story')}
          >
            <Text style={[styles.modeText, mode === 'story' && styles.modeTextActive]}>Story</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pickContainer}>
          <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
            <Text style={styles.pickIcon}>📷</Text>
            <Text style={styles.pickText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => { setImage(null); setCaption(''); }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New {mode === 'story' ? 'Story' : 'Post'}</Text>
        <TouchableOpacity onPress={handleShare} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#0095F6" />
          ) : (
            <Text style={styles.shareText}>
              {mode === 'story' ? 'Add Story' : 'Share'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <Image
          source={{ uri: image }}
          style={[styles.preview, mode === 'story' && styles.storyPreview]}
          resizeMode="cover"
        />
        {mode === 'post' && (
          <View style={styles.form}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#8E8E8E"
              value={caption}
              onChangeText={setCaption}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Add location"
              placeholderTextColor="#8E8E8E"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  cancelText: {
    fontSize: 16,
    color: '#262626',
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 3,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E8E',
  },
  modeTextActive: {
    color: '#262626',
    fontWeight: '600',
  },
  pickContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickButton: {
    alignItems: 'center',
    gap: 12,
  },
  pickIcon: {
    fontSize: 48,
  },
  pickText: {
    fontSize: 16,
    color: '#0095F6',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
  },
  storyPreview: {
    flex: 1,
    aspectRatio: undefined,
    height: '100%',
  },
  form: {
    padding: 16,
    gap: 12,
  },
  captionInput: {
    fontSize: 16,
    color: '#262626',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#262626',
  },
});
