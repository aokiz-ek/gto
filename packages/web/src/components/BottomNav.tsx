'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '@/hooks';

// SVG Icons
const Icons = {
  solutions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  practice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  analyzer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  replayer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const navItems = [
  { href: '/solutions', label: 'Solutions', icon: Icons.solutions },
  { href: '/practice', label: 'Practice', icon: Icons.practice },
  { href: '/analyzer', label: 'Analyze', icon: Icons.analyzer },
  { href: '/replayer', label: 'Replay', icon: Icons.replayer },
  { href: '/profile', label: 'Profile', icon: Icons.profile },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Spacer component to prevent content from being hidden by bottom nav
export function BottomNavSpacer() {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <div
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}
      aria-hidden="true"
    />
  );
}
