'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, Button, Skeleton, SkeletonGroup, Modal } from '@gto/ui';
import { useUserStore } from '@/store';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './leaderboard.css';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  gto_rating: number;
  games_played: number;
  games_won?: number;
  win_rate?: number;
  best_streak?: number;
  current_streak?: number;
  rank_tier: string;
  rank: number;
  rank_change?: number;
  isCurrentUser: boolean;
  isFriend?: boolean;
  country?: string;
  game_type?: string;
  achievements?: Achievement[];
  recent_matches?: RecentMatch[];
  rank_history?: RankHistoryPoint[];
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned_at: string;
}

interface RecentMatch {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  score_change: number;
  date: string;
}

interface ActivityEvent {
  id: string;
  type: 'rank_up' | 'achievement' | 'streak' | 'milestone';
  player: string;
  message: string;
  icon: string;
  timestamp: Date;
}

interface SeasonInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  prize_pool?: string;
  total_players: number;
  rewards?: SeasonReward[];
}

interface SeasonReward {
  rank: string;
  prize: string;
  icon: string;
}

interface RankHistoryPoint {
  date: string;
  rank: number;
  score: number;
}

interface RankNotification {
  id: string;
  type: 'rank_up' | 'rank_down' | 'achievement' | 'challenge';
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
}

interface PastSeason {
  id: string;
  name: string;
  end_date: string;
  your_rank?: number;
  winner: string;
  total_players: number;
}

const RANK_CONFIG: Record<string, { color: string; gradient: string; icon: string; minScore: number }> = {
  grandmaster: { color: '#ff4757', gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)', icon: '👑', minScore: 25000 },
  diamond: { color: '#00d4ff', gradient: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)', icon: '💎', minScore: 10000 },
  platinum: { color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7 0%, #e879f9 100%)', icon: '🏆', minScore: 5000 },
  gold: { color: '#fbbf24', gradient: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)', icon: '🥇', minScore: 2000 },
  silver: { color: '#94a3b8', gradient: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)', icon: '🥈', minScore: 500 },
  bronze: { color: '#cd7f32', gradient: 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)', icon: '🥉', minScore: 0 },
};

const ACHIEVEMENTS_CONFIG: Record<string, { icon: string; name: string; description: string }> = {
  first_win: { icon: '🎉', name: 'First Blood', description: 'Win your first match' },
  streak_5: { icon: '🔥', name: 'On Fire', description: '5 win streak' },
  streak_10: { icon: '💥', name: 'Unstoppable', description: '10 win streak' },
  games_100: { icon: '🎮', name: 'Veteran', description: 'Play 100 games' },
  gto_master: { icon: '🧠', name: 'GTO Master', description: 'Achieve 90%+ GTO accuracy' },
  top_10: { icon: '⭐', name: 'Elite', description: 'Reach top 10' },
  diamond_rank: { icon: '💎', name: 'Diamond Player', description: 'Reach Diamond rank' },
  perfect_session: { icon: '✨', name: 'Flawless', description: 'Perfect session with 100% accuracy' },
};

const MOCK_SEASON: SeasonInfo = {
  id: 'season-1',
  name: 'Season 1',
  start_date: '2024-12-01',
  end_date: '2025-02-28',
  prize_pool: '$10,000',
  total_players: 2547,
  rewards: [
    { rank: '1st', prize: '$5,000 + Diamond Avatar', icon: '🥇' },
    { rank: '2nd', prize: '$2,500 + Platinum Avatar', icon: '🥈' },
    { rank: '3rd', prize: '$1,500 + Gold Avatar', icon: '🥉' },
    { rank: 'Top 10', prize: '1 Year Premium', icon: '⭐' },
    { rank: 'Top 100', prize: '6 Month Premium', icon: '🏅' },
  ],
};

// Past seasons mock data
const PAST_SEASONS: PastSeason[] = [
  { id: 'beta-3', name: 'Beta Season 3', end_date: '2024-11-30', your_rank: 42, winner: 'PokerPro99', total_players: 1823 },
  { id: 'beta-2', name: 'Beta Season 2', end_date: '2024-09-30', your_rank: 78, winner: 'GTO_Master', total_players: 1456 },
  { id: 'beta-1', name: 'Beta Season 1', end_date: '2024-07-31', winner: 'TableKing', total_players: 892 },
];

// Countries for filter
const COUNTRIES = [
  { code: 'all', name: 'All Regions', flag: '🌍' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
];

// Game types for filter
const GAME_TYPES = [
  { id: 'all', name: 'All Games', icon: '🃏' },
  { id: '6max', name: '6-Max', icon: '👥' },
  { id: 'hu', name: 'Heads Up', icon: '🎯' },
  { id: 'mtt', name: 'MTT', icon: '🏆' },
  { id: 'spin', name: 'Spin & Go', icon: '🎰' },
];

// Mock activity events for demo
const generateMockActivity = (): ActivityEvent[] => [
  { id: '1', type: 'rank_up', player: 'PokerPro99', message: 'reached Diamond rank!', icon: '💎', timestamp: new Date(Date.now() - 30000) },
  { id: '2', type: 'achievement', player: 'GTO_Master', message: 'earned "Unstoppable" badge!', icon: '💥', timestamp: new Date(Date.now() - 120000) },
  { id: '3', type: 'streak', player: 'AceKing', message: 'is on a 7 win streak!', icon: '🔥', timestamp: new Date(Date.now() - 300000) },
  { id: '4', type: 'milestone', player: 'TableCaptain', message: 'played 500 games!', icon: '🎮', timestamp: new Date(Date.now() - 600000) },
  { id: '5', type: 'rank_up', player: 'BluffKing', message: 'climbed to #15!', icon: '📈', timestamp: new Date(Date.now() - 900000) },
];

// Generate mock rank history for chart
const generateMockRankHistory = (): RankHistoryPoint[] => {
  const history: RankHistoryPoint[] = [];
  const now = new Date();
  let rank = Math.floor(Math.random() * 50) + 20;
  let score = Math.floor(Math.random() * 5000) + 3000;

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    rank = Math.max(1, Math.min(100, rank + Math.floor(Math.random() * 7) - 3));
    score += Math.floor(Math.random() * 200) - 50;
    history.push({
      date: date.toISOString().split('T')[0],
      rank,
      score: Math.max(0, score),
    });
  }
  return history;
};

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useUserStore();
  const { isMobile, isTablet } = useResponsive();

  // Core state
  const [period, setPeriod] = useState<'season' | 'weekly' | 'monthly' | 'all_time'>('season');
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // New feature states
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(generateMockActivity());
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [comparePlayer, setComparePlayer] = useState<LeaderboardEntry | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // New feature states (8 additional features)
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedGameType, setSelectedGameType] = useState('all');
  const [notifications, setNotifications] = useState<RankNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSeasonHistory, setShowSeasonHistory] = useState(false);
  const [showRankChart, setShowRankChart] = useState(false);
  const [rankHistory, setRankHistory] = useState<RankHistoryPoint[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<LeaderboardEntry | null>(null);
  const [isConnected, setIsConnected] = useState(true); // WebSocket connection status
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      const endDate = new Date(MOCK_SEASON.end_date);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate activity feed
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityFeed(prev => {
        const newEvent: ActivityEvent = {
          id: Date.now().toString(),
          type: ['rank_up', 'achievement', 'streak', 'milestone'][Math.floor(Math.random() * 4)] as ActivityEvent['type'],
          player: `Player${Math.floor(Math.random() * 1000)}`,
          message: ['reached a new rank!', 'earned a badge!', 'is on fire!', 'hit a milestone!'][Math.floor(Math.random() * 4)],
          icon: ['💎', '🔥', '⭐', '🎮'][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
        };
        return [newEvent, ...prev.slice(0, 4)];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, viewMode, selectedCountry, selectedGameType]);

  // Generate mock rank history
  useEffect(() => {
    setRankHistory(generateMockRankHistory());
  }, []);

  // Simulate WebSocket real-time updates
  useEffect(() => {
    const wsSimulator = setInterval(() => {
      // Simulate occasional rank changes
      if (Math.random() > 0.7 && leaderboard.length > 0) {
        setLeaderboard(prev => {
          const newList = [...prev];
          const randomIndex = Math.floor(Math.random() * Math.min(10, newList.length));
          if (newList[randomIndex]) {
            const change = Math.floor(Math.random() * 100) - 50;
            newList[randomIndex] = {
              ...newList[randomIndex],
              score: Math.max(0, (newList[randomIndex].score || 0) + change),
              rank_change: change > 0 ? 1 : change < 0 ? -1 : 0,
            };
          }
          return newList;
        });
        setLastUpdate(new Date());
      }

      // Simulate new notifications
      if (Math.random() > 0.85 && isAuthenticated) {
        const notifTypes: RankNotification['type'][] = ['rank_up', 'rank_down', 'achievement', 'challenge'];
        const notifMessages = {
          rank_up: 'You climbed up in rankings!',
          rank_down: 'You dropped in rankings.',
          achievement: 'You earned a new achievement!',
          challenge: 'Someone challenged you to a match!',
        };
        const notifIcons = {
          rank_up: '📈',
          rank_down: '📉',
          achievement: '🏅',
          challenge: '⚔️',
        };
        const type = notifTypes[Math.floor(Math.random() * notifTypes.length)];

        setNotifications(prev => [{
          id: Date.now().toString(),
          type,
          message: notifMessages[type],
          icon: notifIcons[type],
          timestamp: new Date(),
          read: false,
        }, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(wsSimulator);
  }, [leaderboard.length, isAuthenticated]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePlayers();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = new URLSearchParams({
        period,
        limit: '20',
        friends: String(viewMode === 'friends'),
        country: selectedCountry,
        game_type: selectedGameType,
      });
      const response = await fetch(`/api/leaderboard?${params}`);
      const data = await response.json();

      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
        setHasMore(data.leaderboard.length >= 20);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard;

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        (entry.username || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTier) {
      filtered = filtered.filter(entry => entry.rank_tier === selectedTier);
    }

    if (selectedCountry !== 'all') {
      filtered = filtered.filter(entry => entry.country === selectedCountry);
    }

    if (selectedGameType !== 'all') {
      filtered = filtered.filter(entry => entry.game_type === selectedGameType);
    }

    return filtered;
  }, [leaderboard, searchQuery, selectedTier, selectedCountry, selectedGameType]);

  // Export leaderboard to CSV
  const exportToCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const headers = ['Rank', 'Username', 'Score', 'GTO Rating', 'Games Played', 'Win Rate', 'Tier'];
      const rows = filteredLeaderboard.map(entry => [
        entry.rank,
        entry.username || 'Anonymous',
        entry.score || 0,
        entry.gto_rating || 0,
        entry.games_played || 0,
        `${entry.win_rate?.toFixed(1) || 0}%`,
        entry.rank_tier || 'bronze',
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leaderboard_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredLeaderboard, period]);

  // Share player stats
  const handleShare = useCallback(async (entry: LeaderboardEntry) => {
    setShareData(entry);
    setShowShareModal(true);
  }, []);

  const copyShareLink = useCallback(() => {
    if (!shareData) return;
    const shareUrl = `${window.location.origin}/leaderboard?player=${shareData.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  }, [shareData]);

  const shareToTwitter = useCallback(() => {
    if (!shareData) return;
    const text = `Check out ${shareData.username || 'this player'}'s stats on GTO Trainer! Rank #${shareData.rank} with ${shareData.score?.toLocaleString()} points! 🏆`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }, [shareData]);

  // Challenge a player
  const handleChallenge = useCallback((entry: LeaderboardEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please login to challenge players!');
      return;
    }
    // In real app, this would send a challenge request
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'challenge',
      message: `Challenge sent to ${entry.username || 'Anonymous'}!`,
      icon: '⚔️',
      timestamp: new Date(),
      read: false,
    }, ...prev]);
    alert(`Challenge sent to ${entry.username || 'Anonymous'}! They will be notified.`);
  }, [isAuthenticated]);

  const loadMorePlayers = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/leaderboard?period=${period}&limit=20&offset=${page * 20}&friends=${viewMode === 'friends'}`);
      const data = await response.json();

      if (data.leaderboard && data.leaderboard.length > 0) {
        setLeaderboard(prev => [...prev, ...data.leaderboard]);
        setPage(nextPage);
        setHasMore(data.leaderboard.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const top3 = filteredLeaderboard.slice(0, 3);
  const restOfLeaderboard = filteredLeaderboard.slice(3);

  // Get next tier progress
  const getNextTierProgress = (entry: LeaderboardEntry) => {
    const tiers = Object.entries(RANK_CONFIG).sort((a, b) => b[1].minScore - a[1].minScore);
    const currentTierIndex = tiers.findIndex(([tier]) => tier === entry.rank_tier);

    if (currentTierIndex <= 0) return null; // Already at highest tier

    const nextTier = tiers[currentTierIndex - 1];
    const currentTier = tiers[currentTierIndex];
    const progress = ((entry.score - currentTier[1].minScore) / (nextTier[1].minScore - currentTier[1].minScore)) * 100;
    const pointsNeeded = nextTier[1].minScore - entry.score;

    return {
      nextTierName: nextTier[0],
      nextTierIcon: nextTier[1].icon,
      nextTierColor: nextTier[1].color,
      progress: Math.min(100, Math.max(0, progress)),
      pointsNeeded,
    };
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return null;
    if (change > 0) return <span className="rank-change up">▲ {change}</span>;
    return <span className="rank-change down">▼ {Math.abs(change)}</span>;
  };

  const handlePlayerClick = (entry: LeaderboardEntry) => {
    setSelectedPlayer(entry);
  };

  const handleCompareClick = (entry: LeaderboardEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!comparePlayer) {
      setComparePlayer(entry);
    } else if (comparePlayer.id === entry.id) {
      setComparePlayer(null);
    } else {
      setShowCompareModal(true);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="leaderboard-page">
      {/* Animated Background */}
      <div className="leaderboard-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="leaderboard-content">
        {/* Header Section */}
        <header className="leaderboard-header">
          <div className="header-top-row">
            {/* Connection Status */}
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot" />
              <span className="status-text">{isConnected ? t.leaderboard.live : 'Offline'}</span>
            </div>

            {/* Header Actions */}
            <div className="header-actions">
              {/* Notifications */}
              <button
                className="header-action-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>

              {/* Season History */}
              <button
                className="header-action-btn"
                onClick={() => setShowSeasonHistory(true)}
                title="Season History"
              >
                📅
              </button>

              {/* Rank Chart */}
              <button
                className="header-action-btn"
                onClick={() => setShowRankChart(true)}
                title="Rank History"
              >
                📊
              </button>

              {/* Export */}
              <button
                className="header-action-btn"
                onClick={exportToCSV}
                disabled={isExporting}
                title="Export to CSV"
              >
                {isExporting ? '⏳' : '📥'}
              </button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notifications</h4>
                <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="no-notifications">No notifications yet</div>
              ) : (
                <div className="notifications-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                      <span className="notif-icon">{notif.icon}</span>
                      <div className="notif-content">
                        <span className="notif-message">{notif.message}</span>
                        <span className="notif-time">{formatTimeAgo(notif.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="header-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">COMPETITIVE</span>
          </div>
          <h1 className="header-title">
            <span className="title-gradient">{t.leaderboard.title}</span>
          </h1>
          <p className="header-subtitle">
            {t.leaderboard.subtitle}
          </p>

          {/* Last update indicator */}
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </header>

        {/* Live Activity Feed */}
        <div className="activity-feed">
          <div className="activity-feed-header">
            <span className="live-dot" />
            <span>Live Activity</span>
          </div>
          <div className="activity-feed-content">
            {activityFeed.slice(0, 3).map((event, idx) => (
              <div
                key={event.id}
                className="activity-item"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="activity-icon">{event.icon}</span>
                <span className="activity-text">
                  <strong>{event.player}</strong> {event.message}
                </span>
                <span className="activity-time">{formatTimeAgo(event.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Season Banner with Countdown */}
        {period === 'season' && (
          <div className="season-banner animate-slideUp">
            <div className="season-info">
              <div className="season-badge">
                <span className="season-icon">⚡</span>
                <span className="season-name">{MOCK_SEASON.name}</span>
              </div>
              <div className="season-meta">
                <span className="season-players">
                  <span className="meta-icon">👥</span>
                  {MOCK_SEASON.total_players.toLocaleString()} Players
                </span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="countdown-timer">
              <div className="countdown-label">Season Ends In</div>
              <div className="countdown-units">
                <div className="countdown-unit">
                  <span className="countdown-value">{countdown.days}</span>
                  <span className="countdown-name">Days</span>
                </div>
                <span className="countdown-separator">:</span>
                <div className="countdown-unit">
                  <span className="countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="countdown-name">Hours</span>
                </div>
                <span className="countdown-separator">:</span>
                <div className="countdown-unit">
                  <span className="countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="countdown-name">Min</span>
                </div>
                <span className="countdown-separator hide-mobile">:</span>
                <div className="countdown-unit hide-mobile">
                  <span className="countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className="countdown-name">Sec</span>
                </div>
              </div>
            </div>

            {MOCK_SEASON.prize_pool && (
              <div className="season-prize">
                <span className="prize-label">Prize Pool</span>
                <span className="prize-value">{MOCK_SEASON.prize_pool}</span>
              </div>
            )}
          </div>
        )}

        {/* View Mode Toggle (All / Friends) */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <span className="view-icon">🌍</span>
            {t.leaderboard.global}
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'friends' ? 'active' : ''}`}
            onClick={() => setViewMode('friends')}
          >
            <span className="view-icon">👥</span>
            {t.leaderboard.friends}
          </button>
        </div>

        {/* Period Toggle */}
        <div className="period-toggle">
          {(['season', 'weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'season' ? t.leaderboard.season : p === 'weekly' ? t.leaderboard.weekly : p === 'monthly' ? t.leaderboard.monthly : t.leaderboard.allTime}
              {period === p && <span className="btn-glow" />}
            </button>
          ))}
        </div>

        {/* Enhanced Filters - Region & Game Type */}
        <div className="enhanced-filters">
          {/* Region Filter */}
          <div className="filter-group">
            <label className="filter-label">{t.leaderboard.region}</label>
            <div className="filter-options">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  className={`filter-chip ${selectedCountry === country.code ? 'active' : ''}`}
                  onClick={() => setSelectedCountry(country.code)}
                  title={country.name}
                >
                  <span className="chip-icon">{country.flag}</span>
                  {!isMobile && <span className="chip-text">{country.code === 'all' ? 'All' : country.code.toUpperCase()}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Game Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Game Type</label>
            <div className="filter-options">
              {GAME_TYPES.map(game => (
                <button
                  key={game.id}
                  className={`filter-chip ${selectedGameType === game.id ? 'active' : ''}`}
                  onClick={() => setSelectedGameType(game.id)}
                  title={game.name}
                >
                  <span className="chip-icon">{game.icon}</span>
                  {!isMobile && <span className="chip-text">{game.name}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compare Mode Indicator */}
        {comparePlayer && (
          <div className="compare-mode-banner">
            <span>Comparing with <strong>{comparePlayer.username || 'Anonymous'}</strong></span>
            <button onClick={() => setComparePlayer(null)}>Cancel</button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="tier-filters">
            <button
              className={`tier-chip ${selectedTier === null ? 'active' : ''}`}
              onClick={() => setSelectedTier(null)}
            >
              All
            </button>
            {Object.entries(RANK_CONFIG).map(([tier, config]) => (
              <button
                key={tier}
                className={`tier-chip ${selectedTier === tier ? 'active' : ''}`}
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                style={{ '--tier-color': config.color } as React.CSSProperties}
              >
                {config.icon}
              </button>
            ))}
          </div>
        </div>

        {/* User's Current Rank with Progress Bar */}
        {userRank && !filteredLeaderboard.some(e => e.isCurrentUser) && (() => {
          const userDisplayName = userRank.username || 'You';
          const tierProgress = getNextTierProgress(userRank);
          return (
            <div className="user-rank-card animate-slideUp">
              <div className="user-rank-position">
                <span className="position-label">{t.leaderboard.yourRank}</span>
                <span className="position-number">#{userRank.rank}</span>
              </div>
              <div className="user-rank-info">
                <div className="user-avatar-container">
                  <div className="user-avatar" style={{ background: RANK_CONFIG[userRank.rank_tier]?.gradient }}>
                    {userRank.avatar ? (
                      <img src={userRank.avatar} alt={userDisplayName} />
                    ) : (
                      userDisplayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="tier-badge">{RANK_CONFIG[userRank.rank_tier]?.icon}</span>
                </div>
                <div className="user-details">
                  <span className="user-name">{userDisplayName}</span>
                  <span className="user-stats">{userRank.games_played || 0} games • {userRank.win_rate?.toFixed(1) || 0}% win rate</span>
                  {/* Rank Progress Bar */}
                  {tierProgress && (
                    <div className="rank-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${tierProgress.progress}%`,
                            background: tierProgress.nextTierColor,
                          }}
                        />
                      </div>
                      <span className="progress-text">
                        {tierProgress.pointsNeeded.toLocaleString()} pts to {tierProgress.nextTierIcon} {tierProgress.nextTierName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="user-rank-score">
                <span className="score-value">{userRank.score?.toLocaleString() || '0'}</span>
                <span className="score-label">points</span>
              </div>
            </div>
          );
        })()}

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="podium-skeleton">
              {[2, 1, 3].map((pos) => (
                <div key={pos} className={`podium-item-skeleton pos-${pos}`}>
                  <Skeleton width={80} height={80} variant="circular" animation="wave" />
                  <Skeleton width={100} height={20} animation="wave" />
                  <Skeleton width={60} height={16} animation="wave" />
                </div>
              ))}
            </div>
            <Card variant="glass" padding="lg">
              <SkeletonGroup.List count={10} itemHeight={70} gap={8} animation="wave" />
            </Card>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>{viewMode === 'friends' ? 'No Friends Yet' : 'No Rankings Yet'}</h3>
            <p>{viewMode === 'friends' ? 'Add friends to see their rankings!' : 'Be the first to compete and claim your spot!'}</p>
            {!isAuthenticated && (
              <Button variant="primary" onClick={() => window.location.href = '/auth/login'}>
                Login to Compete
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="podium-section">
                {[1, 0, 2].map((index) => {
                  const entry = top3[index];
                  if (!entry) return null;
                  const position = index === 1 ? 1 : index === 0 ? 2 : 3;
                  const displayName = entry.username || 'Anonymous';
                  const tierProgress = getNextTierProgress(entry);
                  return (
                    <div
                      key={entry.id}
                      className={`podium-card position-${position} ${entry.isCurrentUser ? 'is-current' : ''} ${comparePlayer?.id === entry.id ? 'comparing' : ''} animate-slideUp`}
                      style={{ animationDelay: `${position * 100}ms` }}
                      onClick={() => handlePlayerClick(entry)}
                    >
                      <div className="podium-rank">
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                      </div>

                      {/* Achievements badges */}
                      {entry.achievements && entry.achievements.length > 0 && (
                        <div className="podium-achievements">
                          {entry.achievements.slice(0, 3).map(ach => (
                            <span key={ach.id} className="achievement-badge" title={ach.name}>
                              {ACHIEVEMENTS_CONFIG[ach.id]?.icon || '🏅'}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="podium-avatar-container">
                        <div
                          className="podium-avatar"
                          style={{ background: RANK_CONFIG[entry.rank_tier]?.gradient }}
                        >
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={displayName} />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {position === 1 && <div className="crown-aura" />}
                        <span className="podium-tier">{RANK_CONFIG[entry.rank_tier]?.icon}</span>
                      </div>
                      <div className="podium-info">
                        <span className="podium-name">{displayName}</span>
                        <span
                          className="podium-tier-badge"
                          style={{ background: `${RANK_CONFIG[entry.rank_tier]?.color}20`, color: RANK_CONFIG[entry.rank_tier]?.color }}
                        >
                          {entry.rank_tier === 'grandmaster' ? t.leaderboard.tiers.grandmaster.toUpperCase() : entry.rank_tier === 'diamond' ? t.leaderboard.tiers.diamond.toUpperCase() : entry.rank_tier === 'platinum' ? t.leaderboard.tiers.platinum.toUpperCase() : entry.rank_tier === 'gold' ? t.leaderboard.tiers.gold.toUpperCase() : entry.rank_tier === 'silver' ? t.leaderboard.tiers.silver.toUpperCase() : t.leaderboard.tiers.bronze.toUpperCase()}
                        </span>
                      </div>

                      {/* Progress to next tier */}
                      {tierProgress && (
                        <div className="podium-progress">
                          <div className="mini-progress-bar">
                            <div
                              className="mini-progress-fill"
                              style={{ width: `${tierProgress.progress}%`, background: tierProgress.nextTierColor }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="podium-stats">
                        <div className="stat-item">
                          <span className="stat-value">{entry.score?.toLocaleString() || '0'}</span>
                          <span className="stat-label">{t.leaderboard.points}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{entry.gto_rating || '--'}</span>
                          <span className="stat-label">{t.leaderboard.gtoRating}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{entry.win_rate?.toFixed(0) || '--'}%</span>
                          <span className="stat-label">{t.leaderboard.winRate}</span>
                        </div>
                      </div>

                      {entry.current_streak && entry.current_streak > 0 && (
                        <div className="streak-badge">
                          🔥 {entry.current_streak} streak
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="podium-actions">
                        <button
                          className={`action-btn compare-btn ${comparePlayer?.id === entry.id ? 'active' : ''}`}
                          onClick={(e) => handleCompareClick(entry, e)}
                          title={comparePlayer ? 'Click to compare' : 'Select to compare'}
                        >
                          ⚔️
                        </button>
                        {!entry.isCurrentUser && (
                          <button
                            className="action-btn challenge-btn"
                            onClick={(e) => handleChallenge(entry, e)}
                            title="Challenge player"
                          >
                            🎯
                          </button>
                        )}
                        <button
                          className="action-btn share-btn"
                          onClick={(e) => { e.stopPropagation(); handleShare(entry); }}
                          title="Share stats"
                        >
                          📤
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Leaderboard List */}
            <div className="leaderboard-list">
              {restOfLeaderboard.map((entry, idx) => {
                const playerName = entry.username || 'Anonymous';
                const tierProgress = getNextTierProgress(entry);
                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-row ${entry.isCurrentUser ? 'is-current' : ''} ${comparePlayer?.id === entry.id ? 'comparing' : ''} stagger-item`}
                    style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                    onClick={() => handlePlayerClick(entry)}
                  >
                    <div className="row-rank">
                      <span className="rank-number">#{entry.rank}</span>
                      {getRankChangeIcon(entry.rank_change)}
                    </div>

                    <div className="row-player">
                      <div
                        className="player-avatar"
                        style={{ background: RANK_CONFIG[entry.rank_tier]?.gradient }}
                      >
                        {entry.avatar ? (
                          <img src={entry.avatar} alt={playerName} />
                        ) : (
                          playerName.charAt(0).toUpperCase()
                        )}
                        {entry.isFriend && <span className="friend-indicator">👥</span>}
                      </div>
                      <div className="player-info">
                        <div className="player-name-row">
                          <span className="player-name">{playerName}</span>
                          <span
                            className="player-tier"
                            style={{ background: `${RANK_CONFIG[entry.rank_tier]?.color}20`, color: RANK_CONFIG[entry.rank_tier]?.color }}
                          >
                            {RANK_CONFIG[entry.rank_tier]?.icon} {entry.rank_tier === 'grandmaster' ? t.leaderboard.tiers.grandmaster : entry.rank_tier === 'diamond' ? t.leaderboard.tiers.diamond : entry.rank_tier === 'platinum' ? t.leaderboard.tiers.platinum : entry.rank_tier === 'gold' ? t.leaderboard.tiers.gold : entry.rank_tier === 'silver' ? t.leaderboard.tiers.silver : t.leaderboard.tiers.bronze}
                          </span>
                          {/* Achievements */}
                          {entry.achievements && entry.achievements.length > 0 && (
                            <div className="row-achievements">
                              {entry.achievements.slice(0, 2).map(ach => (
                                <span key={ach.id} className="mini-achievement" title={ach.name}>
                                  {ACHIEVEMENTS_CONFIG[ach.id]?.icon || '🏅'}
                                </span>
                              ))}
                              {entry.achievements.length > 2 && (
                                <span className="more-achievements">+{entry.achievements.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="player-meta">
                          <span>{entry.games_played || 0} games</span>
                          {entry.games_won !== undefined && <span>• {entry.games_won} wins</span>}
                          {entry.best_streak !== undefined && entry.best_streak > 0 && (
                            <span>• 🔥 {entry.best_streak} best streak</span>
                          )}
                        </div>
                        {/* Mini progress bar */}
                        {tierProgress && (
                          <div className="row-progress">
                            <div className="mini-progress-bar">
                              <div
                                className="mini-progress-fill"
                                style={{ width: `${tierProgress.progress}%`, background: tierProgress.nextTierColor }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="row-stats hide-mobile">
                      <div className="stat-cell">
                        <span className="stat-value">{entry.gto_rating || '--'}</span>
                        <span className="stat-label">{t.leaderboard.gtoRating}</span>
                      </div>
                      <div className="stat-cell">
                        <span className="stat-value">{entry.win_rate?.toFixed(0) || '--'}%</span>
                        <span className="stat-label">{t.leaderboard.winRate}</span>
                      </div>
                    </div>

                    <div className="row-score">
                      <span className="score-value">{entry.score?.toLocaleString() || '0'}</span>
                      <span className="score-label">pts</span>
                    </div>

                    {/* Action buttons */}
                    <div className="row-actions">
                      <button
                        className={`row-action-btn ${comparePlayer?.id === entry.id ? 'active' : ''}`}
                        onClick={(e) => handleCompareClick(entry, e)}
                        title="Compare"
                      >
                        ⚔️
                      </button>
                      {!entry.isCurrentUser && (
                        <button
                          className="row-action-btn challenge-btn"
                          onClick={(e) => handleChallenge(entry, e)}
                          title="Challenge"
                        >
                          🎯
                        </button>
                      )}
                      <button
                        className="row-action-btn share-btn"
                        onClick={(e) => { e.stopPropagation(); handleShare(entry); }}
                        title="Share"
                      >
                        📤
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Infinite scroll loader */}
              <div ref={loadMoreRef} className="load-more-trigger">
                {loadingMore && (
                  <div className="loading-more">
                    <div className="spinner" />
                    <span>Loading more...</span>
                  </div>
                )}
                {!hasMore && leaderboard.length > 0 && (
                  <div className="end-of-list">
                    You've reached the end!
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Rank Tiers Legend */}
        <div className="tiers-legend animate-slideUp">
          <h3 className="legend-title">
            <span className="legend-icon">📊</span>
            {t.leaderboard.rankTiers}
          </h3>
          <div className="tiers-grid">
            {Object.entries(RANK_CONFIG).map(([tier, config]) => (
              <div key={tier} className="tier-card">
                <div className="tier-icon-wrapper" style={{ background: config.gradient }}>
                  <span>{config.icon}</span>
                </div>
                <div className="tier-info">
                  <span className="tier-name" style={{ color: config.color }}>
                    {tier === 'grandmaster' ? t.leaderboard.tiers.grandmaster : tier === 'diamond' ? t.leaderboard.tiers.diamond : tier === 'platinum' ? t.leaderboard.tiers.platinum : tier === 'gold' ? t.leaderboard.tiers.gold : tier === 'silver' ? t.leaderboard.tiers.silver : t.leaderboard.tiers.bronze}
                  </span>
                  <span className="tier-requirement">
                    {config.minScore.toLocaleString()}+ pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Showcase */}
        <div className="achievements-showcase animate-slideUp">
          <h3 className="section-title">
            <span className="section-icon">🏅</span>
            {t.leaderboard.achievements}
          </h3>
          <div className="achievements-grid">
            {Object.entries(ACHIEVEMENTS_CONFIG).map(([id, config]) => (
              <div key={id} className="achievement-card">
                <span className="achievement-icon">{config.icon}</span>
                <div className="achievement-info">
                  <span className="achievement-name">{config.name}</span>
                  <span className="achievement-desc">{config.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="how-it-works animate-slideUp">
          <h3 className="section-title">
            <span className="section-icon">💡</span>
            {t.leaderboard.howItWorks}
          </h3>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h4>GTO-Based Scoring</h4>
              <p>Your score reflects precise GTO play, not just volume or aggression.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📈</div>
              <h4>Climb the Ranks</h4>
              <p>Win matches against players of similar skill to climb the leaderboard.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🏅</div>
              <h4>Seasonal Rewards</h4>
              <p>Top performers receive exclusive avatars and subscription discounts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="player-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPlayer(null)}>×</button>

            <div className="modal-header">
              <div
                className="modal-avatar"
                style={{ background: RANK_CONFIG[selectedPlayer.rank_tier]?.gradient }}
              >
                {selectedPlayer.avatar ? (
                  <img src={selectedPlayer.avatar} alt={selectedPlayer.username || 'Player'} />
                ) : (
                  (selectedPlayer.username || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className="modal-player-info">
                <h2>{selectedPlayer.username || 'Anonymous'}</h2>
                <span
                  className="modal-tier"
                  style={{ background: `${RANK_CONFIG[selectedPlayer.rank_tier]?.color}20`, color: RANK_CONFIG[selectedPlayer.rank_tier]?.color }}
                >
                  {RANK_CONFIG[selectedPlayer.rank_tier]?.icon} {selectedPlayer.rank_tier === 'grandmaster' ? t.leaderboard.tiers.grandmaster.toUpperCase() : selectedPlayer.rank_tier === 'diamond' ? t.leaderboard.tiers.diamond.toUpperCase() : selectedPlayer.rank_tier === 'platinum' ? t.leaderboard.tiers.platinum.toUpperCase() : selectedPlayer.rank_tier === 'gold' ? t.leaderboard.tiers.gold.toUpperCase() : selectedPlayer.rank_tier === 'silver' ? t.leaderboard.tiers.silver.toUpperCase() : t.leaderboard.tiers.bronze.toUpperCase()}
                </span>
                <span className="modal-rank">Rank #{selectedPlayer.rank}</span>
              </div>
            </div>

            <div className="modal-stats-grid">
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.score?.toLocaleString() || '0'}</span>
                <span className="modal-stat-label">{t.leaderboard.points}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.gto_rating || '--'}</span>
                <span className="modal-stat-label">{t.leaderboard.gtoRating}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.games_played || 0}</span>
                <span className="modal-stat-label">{t.leaderboard.games}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.win_rate?.toFixed(1) || 0}%</span>
                <span className="modal-stat-label">{t.leaderboard.winRate}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.current_streak || 0}</span>
                <span className="modal-stat-label">{t.leaderboard.currentStreak}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-value">{selectedPlayer.best_streak || 0}</span>
                <span className="modal-stat-label">{t.leaderboard.bestStreak}</span>
              </div>
            </div>

            {/* Achievements */}
            <div className="modal-section">
              <h4>{t.leaderboard.achievements}</h4>
              <div className="modal-achievements">
                {selectedPlayer.achievements && selectedPlayer.achievements.length > 0 ? (
                  selectedPlayer.achievements.map(ach => (
                    <div key={ach.id} className="modal-achievement">
                      <span className="ach-icon">{ACHIEVEMENTS_CONFIG[ach.id]?.icon || '🏅'}</span>
                      <span className="ach-name">{ACHIEVEMENTS_CONFIG[ach.id]?.name || ach.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-achievements">No achievements yet</p>
                )}
              </div>
            </div>

            {/* Progress to next tier */}
            {(() => {
              const progress = getNextTierProgress(selectedPlayer);
              if (!progress) return null;
              return (
                <div className="modal-section">
                  <h4>Progress to {progress.nextTierIcon} {progress.nextTierName}</h4>
                  <div className="modal-progress">
                    <div className="modal-progress-bar">
                      <div
                        className="modal-progress-fill"
                        style={{ width: `${progress.progress}%`, background: progress.nextTierColor }}
                      />
                    </div>
                    <span className="modal-progress-text">
                      {progress.pointsNeeded.toLocaleString()} points needed
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setComparePlayer(selectedPlayer);
                  setSelectedPlayer(null);
                }}
              >
                ⚔️ Compare
              </Button>
              {!selectedPlayer.isCurrentUser && (
                <Button variant="primary">
                  👥 Add Friend
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && comparePlayer && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCompareModal(false)}>×</button>

            <h2 className="compare-title">⚔️ Player Comparison</h2>

            <div className="compare-players">
              {/* Player 1 */}
              <div className="compare-player">
                <div
                  className="compare-avatar"
                  style={{ background: RANK_CONFIG[comparePlayer.rank_tier]?.gradient }}
                >
                  {comparePlayer.avatar ? (
                    <img src={comparePlayer.avatar} alt={comparePlayer.username || 'Player'} />
                  ) : (
                    (comparePlayer.username || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="compare-name">{comparePlayer.username || 'Anonymous'}</span>
                <span className="compare-rank">#{comparePlayer.rank}</span>
              </div>

              <div className="vs-badge">VS</div>

              {/* Player 2 */}
              <div className="compare-player">
                <div
                  className="compare-avatar"
                  style={{ background: RANK_CONFIG[selectedPlayer.rank_tier]?.gradient }}
                >
                  {selectedPlayer.avatar ? (
                    <img src={selectedPlayer.avatar} alt={selectedPlayer.username || 'Player'} />
                  ) : (
                    (selectedPlayer.username || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="compare-name">{selectedPlayer.username || 'Anonymous'}</span>
                <span className="compare-rank">#{selectedPlayer.rank}</span>
              </div>
            </div>

            <div className="compare-stats">
              {[
                { label: t.leaderboard.points, key: 'score' },
                { label: t.leaderboard.gtoRating, key: 'gto_rating' },
                { label: t.leaderboard.games, key: 'games_played' },
                { label: t.leaderboard.winRate, key: 'win_rate', suffix: '%' },
                { label: t.leaderboard.bestStreak, key: 'best_streak' },
              ].map(({ label, key, suffix }) => {
                const val1 = comparePlayer[key as keyof LeaderboardEntry] as number || 0;
                const val2 = selectedPlayer[key as keyof LeaderboardEntry] as number || 0;
                const winner = val1 > val2 ? 1 : val2 > val1 ? 2 : 0;
                return (
                  <div key={key} className="compare-stat-row">
                    <span className={`compare-val ${winner === 1 ? 'winner' : ''}`}>
                      {typeof val1 === 'number' ? val1.toLocaleString() : val1}{suffix || ''}
                    </span>
                    <span className="compare-label">{label}</span>
                    <span className={`compare-val ${winner === 2 ? 'winner' : ''}`}>
                      {typeof val2 === 'number' ? val2.toLocaleString() : val2}{suffix || ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              className="compare-close-btn"
              onClick={() => {
                setShowCompareModal(false);
                setComparePlayer(null);
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Season History Modal */}
      {showSeasonHistory && (
        <div className="modal-overlay" onClick={() => setShowSeasonHistory(false)}>
          <div className="season-history-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSeasonHistory(false)}>×</button>

            <h2 className="modal-title">📅 Season History</h2>

            {/* Current Season */}
            <div className="current-season-card">
              <div className="season-card-header">
                <span className="season-active-badge">🟢 Active</span>
                <h3>{MOCK_SEASON.name}</h3>
              </div>
              <div className="season-card-info">
                <span>Prize Pool: <strong>{MOCK_SEASON.prize_pool}</strong></span>
                <span>Players: <strong>{MOCK_SEASON.total_players.toLocaleString()}</strong></span>
                <span>Ends: <strong>{new Date(MOCK_SEASON.end_date).toLocaleDateString()}</strong></span>
              </div>

              {/* Season Rewards */}
              {MOCK_SEASON.rewards && (
                <div className="season-rewards">
                  <h4>Rewards</h4>
                  <div className="rewards-list">
                    {MOCK_SEASON.rewards.map((reward, idx) => (
                      <div key={idx} className="reward-item">
                        <span className="reward-icon">{reward.icon}</span>
                        <span className="reward-rank">{reward.rank}</span>
                        <span className="reward-prize">{reward.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Past Seasons */}
            <h4 className="past-seasons-title">Past Seasons</h4>
            <div className="past-seasons-list">
              {PAST_SEASONS.map(season => (
                <div key={season.id} className="past-season-card">
                  <div className="past-season-info">
                    <h4>{season.name}</h4>
                    <span className="past-season-date">Ended {new Date(season.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="past-season-stats">
                    <span>🏆 Winner: <strong>{season.winner}</strong></span>
                    <span>👥 {season.total_players.toLocaleString()} players</span>
                    {season.your_rank && (
                      <span className="your-past-rank">Your Rank: <strong>#{season.your_rank}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rank History Chart Modal */}
      {showRankChart && (
        <div className="modal-overlay" onClick={() => setShowRankChart(false)}>
          <div className="rank-chart-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRankChart(false)}>×</button>

            <h2 className="modal-title">📊 Your Rank History</h2>

            {/* Simple SVG Line Chart */}
            <div className="rank-chart-container">
              {rankHistory.length > 0 && (
                <>
                  <div className="chart-labels">
                    <span className="chart-label-max">#{Math.min(...rankHistory.map(h => h.rank))}</span>
                    <span className="chart-label-min">#{Math.max(...rankHistory.map(h => h.rank))}</span>
                  </div>
                  <svg className="rank-chart" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34, 211, 191, 0.5)" />
                        <stop offset="100%" stopColor="rgba(34, 211, 191, 0)" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d={(() => {
                        const minRank = Math.min(...rankHistory.map(h => h.rank));
                        const maxRank = Math.max(...rankHistory.map(h => h.rank));
                        const range = maxRank - minRank || 1;
                        const points = rankHistory.map((h, i) => {
                          const x = (i / (rankHistory.length - 1)) * 400;
                          const y = ((h.rank - minRank) / range) * 130 + 10;
                          return `${x},${y}`;
                        }).join(' L ');
                        return `M 0,140 L ${points} L 400,140 Z`;
                      })()}
                      fill="url(#chartGradient)"
                    />
                    {/* Line */}
                    <path
                      d={(() => {
                        const minRank = Math.min(...rankHistory.map(h => h.rank));
                        const maxRank = Math.max(...rankHistory.map(h => h.rank));
                        const range = maxRank - minRank || 1;
                        const points = rankHistory.map((h, i) => {
                          const x = (i / (rankHistory.length - 1)) * 400;
                          const y = ((h.rank - minRank) / range) * 130 + 10;
                          return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                        }).join(' ');
                        return points;
                      })()}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />
                    {/* Points */}
                    {rankHistory.filter((_, i) => i % 5 === 0 || i === rankHistory.length - 1).map((h, idx) => {
                      const minRank = Math.min(...rankHistory.map(p => p.rank));
                      const maxRank = Math.max(...rankHistory.map(p => p.rank));
                      const range = maxRank - minRank || 1;
                      const origIdx = rankHistory.findIndex(p => p.date === h.date);
                      const x = (origIdx / (rankHistory.length - 1)) * 400;
                      const y = ((h.rank - minRank) / range) * 130 + 10;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="var(--primary)"
                          stroke="var(--surface)"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                  <div className="chart-x-labels">
                    <span>{rankHistory[0]?.date}</span>
                    <span>{rankHistory[rankHistory.length - 1]?.date}</span>
                  </div>
                </>
              )}
            </div>

            {/* Stats Summary */}
            <div className="chart-stats">
              <div className="chart-stat">
                <span className="chart-stat-value">#{rankHistory[rankHistory.length - 1]?.rank || '--'}</span>
                <span className="chart-stat-label">Current Rank</span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value">#{Math.min(...rankHistory.map(h => h.rank)) || '--'}</span>
                <span className="chart-stat-label">Best Rank</span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value">
                  {rankHistory.length > 1 ? (
                    rankHistory[0].rank - rankHistory[rankHistory.length - 1].rank > 0 ?
                      `+${rankHistory[0].rank - rankHistory[rankHistory.length - 1].rank}` :
                      rankHistory[0].rank - rankHistory[rankHistory.length - 1].rank
                  ) : '0'}
                </span>
                <span className="chart-stat-label">30 Day Change</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareData && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>×</button>

            <h2 className="modal-title">📤 Share Stats</h2>

            <div className="share-preview">
              <div className="share-card">
                <div className="share-card-header">
                  <div
                    className="share-avatar"
                    style={{ background: RANK_CONFIG[shareData.rank_tier]?.gradient }}
                  >
                    {(shareData.username || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="share-info">
                    <h3>{shareData.username || 'Anonymous'}</h3>
                    <span className="share-rank">Rank #{shareData.rank}</span>
                  </div>
                </div>
                <div className="share-stats">
                  <div className="share-stat">
                    <span className="val">{shareData.score?.toLocaleString() || '0'}</span>
                    <span className="label">Points</span>
                  </div>
                  <div className="share-stat">
                    <span className="val">{shareData.gto_rating || '--'}</span>
                    <span className="label">GTO</span>
                  </div>
                  <div className="share-stat">
                    <span className="val">{shareData.win_rate?.toFixed(0) || '--'}%</span>
                    <span className="label">Win</span>
                  </div>
                </div>
                <div className="share-footer">
                  <span>🏆 GTO Trainer Leaderboard</span>
                </div>
              </div>
            </div>

            <div className="share-actions">
              <button className="share-btn twitter" onClick={shareToTwitter}>
                🐦 Twitter
              </button>
              <button className="share-btn copy" onClick={copyShareLink}>
                📋 Copy Link
              </button>
              <button
                className="share-btn native"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${shareData.username || 'Player'}'s GTO Stats`,
                      text: `Check out this player's stats! Rank #${shareData.rank} with ${shareData.score?.toLocaleString()} points!`,
                      url: `${window.location.origin}/leaderboard?player=${shareData.id}`,
                    });
                  } else {
                    copyShareLink();
                  }
                }}
              >
                📱 Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
