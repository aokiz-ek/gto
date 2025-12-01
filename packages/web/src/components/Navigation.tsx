'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@gto/ui';
import { useUserStore } from '@/store';
import { useResponsive } from '@/hooks';
import { createClient } from '@/lib/supabase/client';

// SVG Icons for navigation
const Icons = {
  solutions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  analyzer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  practice: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  leaderboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21V11M16 21V8M12 21V3" strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  replayer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  challenge: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
  premium: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const navItems = [
  { href: '/solutions', label: 'Solutions', icon: Icons.solutions },
  { href: '/analyzer', label: 'Analyzer', icon: Icons.analyzer },
  { href: '/practice', label: 'Practice', icon: Icons.practice },
  { href: '/challenge', label: 'Daily', icon: Icons.challenge, highlight: true },
  { href: '/replayer', label: 'Replayer', icon: Icons.replayer },
  { href: '/leaderboard', label: 'Leaderboard', icon: Icons.leaderboard },
  { href: '/history', label: 'History', icon: Icons.history },
];

// Interactive Nav Link Component
function NavLink({ href, isActive, icon, label, isMobile = false, highlight = false }: {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  isMobile?: boolean;
  highlight?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const highlightColor = '#f59e0b'; // Golden color for daily challenge
  const baseColor = highlight && !isActive ? highlightColor : '#22d3bf';

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '12px' : '6px',
        padding: isMobile ? '14px 16px' : '8px 14px',
        borderRadius: isMobile ? '8px' : '6px',
        textDecoration: 'none',
        fontSize: isMobile ? '16px' : '14px',
        fontWeight: 500,
        color: isActive ? '#ffffff' : highlight ? highlightColor : isHovered ? '#ffffff' : '#b3b3b3',
        background: isActive
          ? '#1a1a1a'
          : isHovered
          ? highlight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 211, 191, 0.1)'
          : highlight ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
        transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered && !isActive ? `0 2px 8px ${highlight ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 211, 191, 0.15)'}` : 'none',
        transition: 'all 0.15s ease',
        border: highlight && !isActive ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
      }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isActive ? 1 : isHovered ? 0.9 : highlight ? 1 : 0.7,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease, opacity 0.15s ease',
        color: highlight && !isActive ? highlightColor : 'inherit',
      }}>
        {icon}
      </span>
      <span style={{ lineHeight: 1 }}>{label}</span>
    </Link>
  );
}

// Dropdown Item Component
function DropdownItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        background: isHovered ? (danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 211, 191, 0.1)') : 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: danger ? (isHovered ? '#ef4444' : '#b3b3b3') : (isHovered ? '#22d3bf' : '#b3b3b3'),
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        opacity: isHovered ? 1 : 0.7,
        transition: 'opacity 0.15s ease',
      }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// Interactive Button Component
function InteractiveButton({ children, variant = 'default', onClick, style = {} }: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'premium' | 'ghost';
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles: Record<string, React.CSSProperties> = {
    default: {
      background: '#1a1a1a',
      border: '1px solid #333333',
      color: '#ffffff',
    },
    primary: {
      background: '#22d3bf',
      border: 'none',
      color: '#000000',
    },
    premium: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      border: 'none',
      color: '#000000',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid #333333',
      color: '#ffffff',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    default: {
      background: '#242424',
      borderColor: '#22d3bf',
      boxShadow: '0 0 15px rgba(34, 211, 191, 0.2)',
    },
    primary: {
      background: '#14b8a6',
      boxShadow: '0 4px 15px rgba(34, 211, 191, 0.4)',
    },
    premium: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
    },
    ghost: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderColor: '#22d3bf',
    },
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 16px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        ...baseStyles[variant],
        ...(isHovered ? hoverStyles[variant] : {}),
        transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useUserStore();
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [menuButtonHovered, setMenuButtonHovered] = useState(false);
  const [upgradeHovered, setUpgradeHovered] = useState(false);
  const [upgradePressed, setUpgradePressed] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Handle hydration for Zustand persist
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      logout();
      setUserDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
        height: '56px',
        background: '#0d0d0d',
        borderBottom: '1px solid #333333',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transform: logoHovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #22d3bf 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: logoHovered ? '0 0 20px rgba(34, 211, 191, 0.5)' : 'none',
            transform: logoHovered ? 'rotate(5deg)' : 'rotate(0deg)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <span style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 700,
            color: logoHovered ? '#22d3bf' : '#ffffff',
            letterSpacing: '-0.5px',
            transition: 'color 0.2s ease',
          }}>
            Aokiz GTO
          </span>
        </Link>

        {/* Desktop Nav Links */}
        {!isMobileOrTablet && (
          <div style={{
            display: 'flex',
            gap: '4px',
            height: '100%',
            alignItems: 'center',
          }}>
            {navItems.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  isActive={isActive}
                  icon={item.icon}
                  label={item.label}
                  highlight={'highlight' in item && item.highlight}
                />
              );
            })}
          </div>
        )}

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          {/* Upgrade Button - Hide on mobile */}
          {!isMobile && (
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button
                onMouseEnter={() => setUpgradeHovered(true)}
                onMouseLeave={() => { setUpgradeHovered(false); setUpgradePressed(false); }}
                onMouseDown={() => setUpgradePressed(true)}
                onMouseUp={() => setUpgradePressed(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isTablet ? '6px 10px' : '8px 14px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transform: upgradePressed ? 'scale(0.95)' : upgradeHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
                  boxShadow: upgradeHovered ? '0 4px 15px rgba(245, 158, 11, 0.5)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  display: 'flex',
                  animation: upgradeHovered ? 'pulse 1s ease-in-out infinite' : 'none',
                }}>
                  {Icons.premium}
                </span>
                <span>{isTablet ? 'Pro' : 'Upgrade'}</span>
              </button>
            </Link>
          )}

          {/* Auth Section - Desktop */}
          {!isMobileOrTablet && (
            hydrated && isAuthenticated ? (
              <div ref={userDropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onMouseEnter={() => setUserHovered(true)}
                  onMouseLeave={() => setUserHovered(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    background: userDropdownOpen ? '#242424' : userHovered ? '#242424' : '#1a1a1a',
                    borderRadius: '6px',
                    border: `1px solid ${userDropdownOpen || userHovered ? '#22d3bf' : '#333333'}`,
                    cursor: 'pointer',
                    transform: userHovered ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: userHovered ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    transform: userHovered ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                  }}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>
                    {user?.name || 'User'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#666666"
                    strokeWidth="2"
                    style={{
                      transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '200px',
                    background: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    overflow: 'hidden',
                    zIndex: 200,
                  }}>
                    {/* User Info */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #333333',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                        {user?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>
                        {user?.email || ''}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '8px' }}>
                      <DropdownItem
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        }
                        label="Profile"
                        onClick={() => { setUserDropdownOpen(false); router.push('/profile'); }}
                      />
                      <DropdownItem
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        }
                        label="Settings"
                        onClick={() => { setUserDropdownOpen(false); router.push('/settings'); }}
                      />
                      <DropdownItem
                        icon={Icons.history}
                        label="Hand History"
                        onClick={() => { setUserDropdownOpen(false); router.push('/history'); }}
                      />
                    </div>

                    {/* Logout */}
                    <div style={{ padding: '8px', borderTop: '1px solid #333333' }}>
                      <DropdownItem
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        }
                        label="Log out"
                        onClick={handleLogout}
                        danger
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )
          )}

          {/* Mobile Menu Button */}
          {isMobileOrTablet && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              onMouseEnter={() => setMenuButtonHovered(true)}
              onMouseLeave={() => setMenuButtonHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: menuButtonHovered ? 'rgba(34, 211, 191, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: menuButtonHovered ? '#22d3bf' : '#ffffff',
                cursor: 'pointer',
                transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'all 0.3s ease',
              }}
            >
              {mobileMenuOpen ? Icons.close : Icons.menu}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileOrTablet && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 99,
            opacity: mobileMenuOpen ? 1 : 0,
            pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {isMobileOrTablet && (
        <div style={{
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          background: '#0d0d0d',
          borderBottom: mobileMenuOpen ? '1px solid #333333' : 'none',
          zIndex: 100,
          maxHeight: mobileMenuOpen ? '100vh' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {/* Nav Items */}
            {navItems.map((item, index) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <div
                  key={item.href}
                  style={{
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.3s ease ${index * 0.05}s`,
                  }}
                >
                  <NavLink
                    href={item.href}
                    isActive={isActive}
                    icon={item.icon}
                    label={item.label}
                    isMobile
                    highlight={'highlight' in item && item.highlight}
                  />
                </div>
              );
            })}

            {/* Divider */}
            <div style={{
              height: '1px',
              background: '#333333',
              margin: '12px 0',
              opacity: mobileMenuOpen ? 1 : 0,
              transition: 'opacity 0.3s ease 0.2s',
            }} />

            {/* Upgrade Button - Mobile */}
            <div style={{
              opacity: mobileMenuOpen ? 1 : 0,
              transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.3s ease 0.25s',
            }}>
              <Link href="/pricing" style={{ textDecoration: 'none' }}>
                <InteractiveButton variant="premium" style={{ width: '100%' }}>
                  {Icons.premium}
                  <span>Upgrade to Pro</span>
                </InteractiveButton>
              </Link>
            </div>

            {/* Auth Section - Mobile */}
            <div style={{
              opacity: mobileMenuOpen ? 1 : 0,
              transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.3s ease 0.3s',
              marginTop: '8px',
            }}>
              {isAuthenticated ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666666' }}>
                      View Profile
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link href="/auth/login" style={{ flex: 1, textDecoration: 'none' }}>
                    <InteractiveButton variant="ghost" style={{ width: '100%' }}>
                      Log in
                    </InteractiveButton>
                  </Link>
                  <Link href="/auth/register" style={{ flex: 1, textDecoration: 'none' }}>
                    <InteractiveButton variant="primary" style={{ width: '100%' }}>
                      Sign up
                    </InteractiveButton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
