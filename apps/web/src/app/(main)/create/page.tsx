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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-xl font-semibold text-[#262626] mb-6">New Post</h1>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-5xl">📷</span>
          <span className="text-blue-500 font-semibold">Choose from Library</span>
        </button>
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
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button onClick={() => { setPreview(null); setFile(null); setCaption(''); }} className="text-[#262626]">
          Cancel
        </button>
        <h1 className="font-semibold text-[#262626]">New Post</h1>
        <button
          onClick={handleShare}
          disabled={uploading}
          className="text-blue-500 font-semibold disabled:opacity-50"
        >
          {uploading ? 'Sharing...' : 'Share'}
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
        <div className="p-4 space-y-4">
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full text-base text-[#262626] outline-none resize-none min-h-[80px]"
          />
          <input
            type="text"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
