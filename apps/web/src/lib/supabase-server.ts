import { createServerClient } from '@supabase/ssr';
import type { cookies } from 'next/headers';

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  const store = cookieStore as unknown as {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options: Record<string, unknown>) => void;
    remove: (name: string, options: Record<string, unknown>) => void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = store.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          store.set(name, value, options);
        },
        remove(name: string, options: Record<string, unknown>) {
          store.remove(name, options);
        },
      },
    },
  );
}
