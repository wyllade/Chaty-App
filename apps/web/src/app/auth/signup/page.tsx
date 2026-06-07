'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password || !username || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        username,
        display_name: displayName,
      });

      setLoading(false);

      if (profileError) {
        setError('Failed to create profile');
        return;
      }

      router.push('/auth/login?created=true');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-[#262626]">Chaty</h1>
          <p className="mt-2 text-[#8E8E8E]">Create your account</p>
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
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:border-[#0095F6]"
          />
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:border-[#0095F6]"
          />

          {error && <p className="text-sm text-[#ED4956]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0095F6] py-3 text-sm font-semibold text-white hover:bg-[#0081D6] disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-[#8E8E8E]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-[#0095F6]">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
