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

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, display_name: displayName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('Account created. Please log in.');
      return;
    }

    router.push('/');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#667EEA] via-[#764BA2] to-[#FF6B6B]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      <div className="blob w-80 h-80 bg-[#667EEA] top-[-5%] right-[-10%] animate-float-slow" style={{ animationDuration: '7s' }} />
      <div className="blob w-64 h-64 bg-[#764BA2] bottom-[-5%] left-[-10%] animate-float" style={{ animationDelay: '1.5s', animationDuration: '5s' }} />
      <div className="blob w-40 h-40 bg-[#FF6B6B] top-[30%] left-[20%] animate-float-slow" style={{ animationDelay: '3s' }} />

      <div className="relative w-full max-w-sm glass-strong rounded-2xl p-8 animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Chaty</h1>
          <p className="mt-2 text-white/70 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-focus w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
          />
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
            ) : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-white hover:text-white/80 transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
