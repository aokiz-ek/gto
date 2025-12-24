'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { ReferralPanel } from '@/components';
import { useTranslation } from '@/i18n';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, practiceStats, logout } = useUserStore();
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const { t } = useTranslation();

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>{t.profile.loginRequired}</p>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              padding: '12px 24px',
              background: '#22d3bf',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.profile.login}
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  const accuracy = practiceStats.totalDecisions > 0
    ? Math.round((practiceStats.correctDecisions / practiceStats.totalDecisions) * 100)
    : 0;

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#0a0a0f',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '32px',
        }}>
          {t.profile.title}
        </h1>

        {/* User Info Card */}
        <div style={{
          background: '#12121a',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '4px',
              }}>
                {user.name}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666666',
              }}>
                {user.email}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: user.subscription === 'free' ? '#333333' : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: user.subscription === 'free' ? '#a0a0b0' : '#000',
                marginTop: '8px',
                textTransform: 'uppercase',
              }}>
                {user.subscription} {t.profile.plan}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              background: '#1a1a24',
              padding: '16px',
              borderRadius: '8px',
            }}>
              <p style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>{t.profile.memberSince}</p>
              <p style={{ fontSize: '16px', color: '#ffffff', fontWeight: 500 }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{
              background: '#1a1a24',
              padding: '16px',
              borderRadius: '8px',
            }}>
              <p style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>{t.profile.userId}</p>
              <p style={{ fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' }}>
                {user.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Practice Stats Card */}
        <div style={{
          background: '#12121a',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '20px',
          }}>
            {t.profile.practiceStats}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
          }}>
            <StatCard label={t.profile.totalSessions} value={practiceStats.totalSessions} />
            <StatCard label={t.profile.totalDecisions} value={practiceStats.totalDecisions} />
            <StatCard label={t.profile.correct} value={practiceStats.correctDecisions} color="#22d3bf" />
            <StatCard label={t.profile.accuracy} value={`${accuracy}%`} color={accuracy >= 70 ? '#22d3bf' : accuracy >= 50 ? '#f59e0b' : '#ef4444'} />
            <StatCard label={t.profile.streak} value={`${practiceStats.streakDays} ${t.profile.days}`} color="#8b5cf6" />
          </div>
        </div>

        {/* Referral Panel - 邀请奖励 */}
        <ReferralPanel />

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <ActionButton
            label={t.profile.settings}
            isHovered={isHovered === 'settings'}
            onHover={() => setIsHovered('settings')}
            onLeave={() => setIsHovered(null)}
            onClick={() => router.push('/settings')}
          />
          <ActionButton
            label={t.profile.handHistory}
            isHovered={isHovered === 'history'}
            onHover={() => setIsHovered('history')}
            onLeave={() => setIsHovered(null)}
            onClick={() => router.push('/history')}
          />
          <ActionButton
            label={t.profile.upgradePlan}
            isHovered={isHovered === 'upgrade'}
            onHover={() => setIsHovered('upgrade')}
            onLeave={() => setIsHovered(null)}
            onClick={() => router.push('/pricing')}
            variant="primary"
          />
          <ActionButton
            label={t.profile.logout}
            isHovered={isHovered === 'logout'}
            onHover={() => setIsHovered('logout')}
            onLeave={() => setIsHovered(null)}
            onClick={handleLogout}
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = '#ffffff' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: '#1a1a24',
      padding: '16px',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>
        {value}
      </p>
      <p style={{ fontSize: '12px', color: '#666666' }}>
        {label}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  isHovered,
  onHover,
  onLeave,
  onClick,
  variant = 'default',
}: {
  label: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const styles = {
    default: {
      background: isHovered ? '#242424' : '#1a1a1a',
      border: `1px solid ${isHovered ? '#22d3bf' : '#333333'}`,
      color: '#ffffff',
    },
    primary: {
      background: isHovered ? '#14b8a6' : '#22d3bf',
      border: 'none',
      color: '#000000',
    },
    danger: {
      background: isHovered ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
      border: `1px solid ${isHovered ? '#ef4444' : '#333333'}`,
      color: isHovered ? '#ef4444' : '#a0a0b0',
    },
  };

  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
        ...styles[variant],
      }}
    >
      {label}
    </button>
  );
}
