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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FFB347]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      <div className="blob w-72 h-72 bg-[#FF6B6B] top-[-5%] left-[-10%] animate-float-slow" />
      <div className="blob w-96 h-96 bg-[#FFB347] bottom-[-10%] right-[-15%] animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="blob w-48 h-48 bg-[#667EEA] top-[40%] right-[-5%] animate-float-slow" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-sm glass-strong rounded-2xl p-8 animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Chaty</h1>
          <p className="mt-2 text-white/70 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-focus w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-focus w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
          />

          {error && <p className="text-sm text-[#FFB347] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </span>
            ) : 'Log In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/60">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-white hover:text-white/80 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
