'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store';
import {
  REFERRAL_CONFIG,
  generateReferralCode,
  calculateReferralRewards,
  UserReferralStats,
} from '@/config/promotions';
import './ReferralPanel.css';

interface ReferralPanelProps {
  /** Compact mode for sidebar */
  compact?: boolean;
}

export default function ReferralPanel({ compact = false }: ReferralPanelProps) {
  const { user, isAuthenticated } = useUserStore();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Generate referral code based on user ID
      const code = generateReferralCode(user.id);
      setReferralCode(code);

      // Mock stats - in production, fetch from API
      setStats({
        referralCode: code,
        totalReferrals: 8,
        successfulReferrals: 3,
        pendingRewards: 14,
        claimedRewards: 7,
        referralHistory: [
          {
            refereeId: '1',
            refereeName: '小明',
            date: '2025-01-28',
            status: 'converted',
            reward: 7,
          },
          {
            refereeId: '2',
            refereeName: '小红',
            date: '2025-01-25',
            status: 'converted',
            reward: 7,
          },
          {
            refereeId: '3',
            refereeName: '小张',
            date: '2025-01-20',
            status: 'converted',
            reward: 7,
          },
          {
            refereeId: '4',
            refereeName: '小李',
            date: '2025-01-18',
            status: 'pending',
          },
          {
            refereeId: '5',
            refereeName: '小王',
            date: '2025-01-15',
            status: 'pending',
          },
        ],
      });
    }
  }, [user?.id]);

  const handleCopy = async () => {
    const referralLink = `${window.location.origin}/auth/register?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const referralLink = `${window.location.origin}/auth/register?ref=${referralCode}`;
    const shareText = `我在GTO Play学习扑克策略，使用我的邀请链接注册可享首购8折优惠！${referralLink}`;

    if (navigator.share) {
      navigator.share({
        title: 'GTO Play 邀请',
        text: shareText,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`referral-panel ${compact ? 'compact' : ''}`}>
        <div className="referral-login-prompt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <p>登录后解锁邀请奖励</p>
          <a href="/auth/login" className="referral-login-btn">登录</a>
        </div>
      </div>
    );
  }

  const rewards = stats ? calculateReferralRewards(stats) : null;
  const config = REFERRAL_CONFIG;

  if (compact) {
    return (
      <div className="referral-panel compact">
        <div className="referral-compact-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>邀请好友</span>
        </div>
        <div className="referral-compact-reward">
          <span className="reward-highlight">{config.referrerReward.value}天</span>
          <span className="reward-text">每邀请1人</span>
        </div>
        <button className="referral-compact-btn" onClick={handleCopy}>
          {copied ? '已复制' : '复制链接'}
        </button>
      </div>
    );
  }

  return (
    <div className="referral-panel">
      <div className="referral-header">
        <div className="referral-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <h3 className="referral-title">邀请好友赢奖励</h3>
          <p className="referral-subtitle">分享链接，双方都有奖</p>
        </div>
      </div>

      <div className="referral-rewards">
        <div className="reward-card">
          <span className="reward-label">你将获得</span>
          <span className="reward-value">{config.referrerReward.value}天</span>
          <span className="reward-desc">会员时长/每人</span>
        </div>
        <div className="reward-divider">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div className="reward-card">
          <span className="reward-label">好友获得</span>
          <span className="reward-value">{config.refereeReward.value}%</span>
          <span className="reward-desc">首购折扣</span>
        </div>
      </div>

      <div className="referral-code-section">
        <label className="referral-code-label">你的邀请码</label>
        <div className="referral-code-box">
          <span className="referral-code">{referralCode}</span>
          <button className="referral-copy-btn" onClick={handleCopy}>
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="referral-actions">
        <button className="referral-share-btn" onClick={handleShare}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          分享邀请链接
        </button>
      </div>

      {stats && (
        <div className="referral-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalReferrals}</span>
              <span className="stat-label">总邀请</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.successfulReferrals}</span>
              <span className="stat-label">已转化</span>
            </div>
            <div className="stat-item highlight">
              <span className="stat-value">{rewards?.totalDays || 0}天</span>
              <span className="stat-label">已获奖励</span>
            </div>
          </div>

          <button
            className="stats-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '收起' : '查看'}邀请记录
            <svg
              className={showHistory ? 'rotated' : ''}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showHistory && (
            <div className="referral-history">
              {stats.referralHistory.map((item) => (
                <div key={item.refereeId} className="history-item">
                  <div className="history-avatar">
                    {item.refereeName.charAt(0)}
                  </div>
                  <div className="history-info">
                    <span className="history-name">{item.refereeName}</span>
                    <span className="history-date">{item.date}</span>
                  </div>
                  <div className={`history-status ${item.status}`}>
                    {item.status === 'converted' && (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        +{item.reward}天
                      </>
                    )}
                    {item.status === 'pending' && '待转化'}
                    {item.status === 'expired' && '已过期'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="referral-note">
        * 好友需购买专业版及以上套餐，奖励自动发放
      </p>
    </div>
  );
}
