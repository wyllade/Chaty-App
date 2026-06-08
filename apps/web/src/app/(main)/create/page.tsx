'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreatePostPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleShare() {
    if (!file || !preview) return;
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: session.user.id,
        image_url: publicUrl,
        caption: caption || null,
        location: location || null,
      });

      if (insertError) throw insertError;

      router.push('/');
    } catch {
      alert('Failed to post. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ background: 'var(--color-surface)' }}>
        <div className="dashed-border-animate p-12 text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white text-4xl shadow-lg shadow-[#FF6B6B]/20 animate-float">
            📷
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>New Post</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Tap to upload a photo</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-gradient px-8 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-[#FF6B6B]/30"
          >
            Choose from Library
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <div className="glass border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => { setPreview(null); setFile(null); setCaption(''); }}
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <h1 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>New Post</h1>
          <button
            onClick={handleShare}
            disabled={uploading}
            className="btn-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#FF6B6B]/20"
          >
            {uploading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 animate-fade-in">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="relative group">
            <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <div className="p-4 space-y-4">
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-focus w-full rounded-xl px-4 py-3 text-base outline-none resize-none min-h-[80px]"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            />
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-focus w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
