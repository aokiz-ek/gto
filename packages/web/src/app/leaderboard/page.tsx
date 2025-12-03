'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Skeleton, SkeletonGroup } from '@gto/ui';
import { useUserStore } from '@/store';
import { useResponsive } from '@/hooks';

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  games_played: number;
  games_won?: number;
  best_streak?: number;
  rank_tier: string;
  rank: number;
  isCurrentUser: boolean;
}

const RANK_COLORS: Record<string, string> = {
  diamond: '#b9f2ff',
  platinum: '#e5e4e2',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
};

const RANK_ICONS: Record<string, string> = {
  diamond: '💎',
  platinum: '🏆',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

export default function LeaderboardPage() {
  const { isAuthenticated } = useUserStore();
  const { isMobile } = useResponsive();
  const [period, setPeriod] = useState<'all_time' | 'weekly' | 'monthly'>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?period=${period}&limit=50`);
      const data = await response.json();

      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #ffd700 0%, #ffed4a 100%)' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #cd7f32 0%, #e8a85c 100%)' };
    return { background: '#1a1a24' };
  };

  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '32px' }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '36px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '8px',
        }}>
          Leaderboard
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: isMobile ? '12px' : '14px' }}>
          Top players ranked by GTO mastery
        </p>
      </div>

      {/* Period Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px',
      }}>
        {(['all_time', 'weekly', 'monthly'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'primary' : 'ghost'}
            onClick={() => setPeriod(p)}
            style={{ textTransform: 'capitalize' }}
          >
            {p.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* User's Rank (if not in top 50) */}
      {userRank && !leaderboard.some(e => e.isCurrentUser) && (
        <Card variant="outlined" padding="md" style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#1a1a24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#00f5d4',
              }}>
                #{userRank.rank}
              </div>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{ color: '#00f5d4', fontWeight: 600 }}>
                    {userRank.username || 'You'}
                  </span>
                  <span style={{ fontSize: '12px' }}>
                    {RANK_ICONS[userRank.rank_tier]}
                  </span>
                </div>
                <div style={{ color: '#6b6b7b', fontSize: '12px' }}>
                  {userRank.games_played} games played
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#00f5d4',
            }}>
              {userRank.score.toLocaleString()}
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <Card variant="glass" padding="lg">
          <SkeletonGroup.List count={8} itemHeight={70} gap={8} animation="wave" />
        </Card>
      ) : leaderboard.length === 0 ? (
        <Card variant="default" padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>
            No rankings yet for this period
          </p>
          {!isAuthenticated && (
            <Button variant="primary" onClick={() => window.location.href = '/auth/login'}>
              Login to Compete
            </Button>
          )}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((entry) => (
            <Card
              key={entry.id}
              variant={entry.isCurrentUser ? 'outlined' : 'default'}
              padding="md"
              style={{
                border: entry.isCurrentUser ? '2px solid #00f5d4' : undefined,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Rank */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    ...getRankStyle(entry.rank),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: entry.rank <= 3 ? '#0a0a0f' : '#ffffff',
                    fontSize: entry.rank <= 3 ? '16px' : '14px',
                  }}>
                    {entry.rank <= 3 ? (
                      <span style={{ fontSize: '20px' }}>
                        {entry.rank === 1 ? '🏆' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        color: entry.isCurrentUser ? '#00f5d4' : '#ffffff',
                        fontWeight: 600,
                      }}>
                        {entry.username || 'Anonymous'}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: `${RANK_COLORS[entry.rank_tier]}20`,
                        color: RANK_COLORS[entry.rank_tier],
                        textTransform: 'uppercase',
                      }}>
                        {entry.rank_tier}
                      </span>
                    </div>
                    <div style={{
                      color: '#6b6b7b',
                      fontSize: '12px',
                      display: 'flex',
                      gap: '12px',
                    }}>
                      <span>{entry.games_played} games</span>
                      {entry.games_won !== undefined && (
                        <span>{entry.games_won} wins</span>
                      )}
                      {entry.best_streak !== undefined && entry.best_streak > 0 && (
                        <span>{entry.best_streak} best streak</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: entry.isCurrentUser ? '#00f5d4' : '#ffffff',
                }}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rank Tiers Info */}
      <Card variant="gradient" padding="md" hoverEffect style={{ marginTop: isMobile ? '24px' : '32px' }}>
        <h3 style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 600,
          color: '#9b5de5',
          marginBottom: '12px',
        }}>
          Rank Tiers
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '4px' : '8px',
        }}>
          {[
            { tier: 'bronze', min: 0, label: 'Bronze' },
            { tier: 'silver', min: 500, label: 'Silver' },
            { tier: 'gold', min: 2000, label: 'Gold' },
            { tier: 'platinum', min: 5000, label: 'Platinum' },
            { tier: 'diamond', min: 10000, label: 'Diamond' },
          ].map(({ tier, min, label }) => (
            <div
              key={tier}
              style={{
                textAlign: 'center',
                padding: '8px',
                borderRadius: '8px',
                background: '#1a1a24',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {RANK_ICONS[tier]}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: RANK_COLORS[tier],
              }}>
                {label}
              </div>
              <div style={{ fontSize: '10px', color: '#6b6b7b' }}>
                {min.toLocaleString()}+
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
