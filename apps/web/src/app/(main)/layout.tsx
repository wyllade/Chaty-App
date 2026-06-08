'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, MessageIcon, HeartIcon, ProfileIcon, HomeFilledIcon, SearchFilledIcon, MessageFilledIcon, HeartFilledIcon, ProfileFilledIcon } from '@/components/Icons';

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: HomeIcon, IconActive: HomeFilledIcon },
  { href: '/search', label: 'Search', Icon: SearchIcon, IconActive: SearchFilledIcon },
  { href: '/create', label: '', Icon: () => (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white font-bold text-xl -mt-3 shadow-lg shadow-[#FF6B6B]/30 transition-transform hover:scale-110 active:scale-95">+</div>
  ), IconActive: () => (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FFB347] flex items-center justify-center text-white font-bold text-xl -mt-3 shadow-lg shadow-[#FF6B6B]/40 scale-110">+</div>
  ) },
  { href: '/activity', label: 'Activity', Icon: HeartIcon, IconActive: HeartFilledIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon, IconActive: ProfileFilledIcon },
  { href: '/messages', label: 'Messages', Icon: MessageIcon, IconActive: MessageFilledIcon },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getActiveIndex = () => {
    const idx = NAV_ITEMS.findIndex(({ href }) => href === '/' ? pathname === '/' : pathname.startsWith(href));
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-4xl mx-auto">
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20">
        <div className="max-w-4xl mx-auto flex items-start justify-around py-1 relative">
          {NAV_ITEMS.map(({ href, label, Icon, IconActive }, i) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const Comp = isActive ? IconActive : Icon;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'scale-110' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <Comp size={22} />
                <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-gradient-brand' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="h-3" />
      </nav>
    </div>
  );
}
