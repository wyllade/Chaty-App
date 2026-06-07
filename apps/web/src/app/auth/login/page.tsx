'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-[#262626]">Chaty</h1>
          <p className="mt-2 text-[#8E8E8E]">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:border-[#0095F6]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:border-[#0095F6]"
          />

          {error && <p className="text-sm text-[#ED4956]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0095F6] py-3 text-sm font-semibold text-white hover:bg-[#0081D6] disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Log In'}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-[#8E8E8E]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-[#0095F6]">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
