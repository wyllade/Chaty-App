import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-around py-3">
          <Link href="/" className="text-2xl">🏠</Link>
          <Link href="/search" className="text-2xl">🔍</Link>
          <Link href="/messages" className="text-2xl">✉️</Link>
          <Link href="/activity" className="text-2xl">❤️</Link>
          <Link href="/profile" className="text-2xl">👤</Link>
        </div>
      </nav>
    </div>
  );
}
