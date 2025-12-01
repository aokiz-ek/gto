'use client';

import { useRef, useState, useCallback } from 'react';
import './ShareCard.css';

export interface ShareCardData {
  type: 'challenge' | 'practice' | 'pk' | 'achievement' | 'streak';
  title: string;
  subtitle?: string;
  stats?: {
    label: string;
    value: string | number;
    highlight?: boolean;
  }[];
  score?: number;
  maxScore?: number;
  rank?: number;
  date?: string;
  username?: string;
  avatarInitial?: string;
}

interface ShareCardProps {
  data: ShareCardData;
  onGenerate?: (dataUrl: string) => void;
}

// 获取类型对应的渐变色和图标
function getTypeStyle(type: ShareCardData['type']) {
  switch (type) {
    case 'challenge':
      return {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        icon: '🏆',
        accentColor: '#f59e0b',
      };
    case 'practice':
      return {
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1e3a5f 100%)',
        icon: '📚',
        accentColor: '#8b5cf6',
      };
    case 'pk':
      return {
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        bgGradient: 'linear-gradient(135deg, #2e1a1a 0%, #3e1616 50%, #4a1010 100%)',
        icon: '⚔️',
        accentColor: '#ef4444',
      };
    case 'achievement':
      return {
        gradient: 'linear-gradient(135deg, #22d3bf 0%, #14b8a6 100%)',
        bgGradient: 'linear-gradient(135deg, #0a2e2a 0%, #0f3d36 50%, #145045 100%)',
        icon: '🎖️',
        accentColor: '#22d3bf',
      };
    case 'streak':
      return {
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        bgGradient: 'linear-gradient(135deg, #2e1a0a 0%, #3d2510 50%, #4a2d12 100%)',
        icon: '🔥',
        accentColor: '#f97316',
      };
    default:
      return {
        gradient: 'linear-gradient(135deg, #22d3bf 0%, #3b82f6 100%)',
        bgGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        icon: '♠️',
        accentColor: '#22d3bf',
      };
  }
}

export function ShareCard({ data, onGenerate }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const style = getTypeStyle(data.type);

  const generateImage = useCallback(async () => {
    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);

    try {
      // 动态导入 html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // 高清
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      onGenerate?.(dataUrl);

      // 触发下载
      const link = document.createElement('a');
      link.download = `gto-${data.type}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate share image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data.type, isGenerating, onGenerate]);

  const scorePercentage = data.score && data.maxScore
    ? Math.round((data.score / data.maxScore) * 100)
    : null;

  return (
    <div className="share-card-wrapper">
      {/* 可导出的卡片 */}
      <div
        ref={cardRef}
        className="share-card"
        style={{ background: style.bgGradient }}
      >
        {/* 装饰性背景元素 */}
        <div className="share-card-decoration" style={{ background: `${style.accentColor}15` }} />
        <div className="share-card-decoration-2" style={{ background: `${style.accentColor}10` }} />

        {/* 头部 */}
        <div className="share-card-header">
          <div className="share-card-logo">
            <div className="logo-icon" style={{ background: style.gradient }}>
              <span>GTO</span>
            </div>
            <span className="logo-text">Aokiz GTO</span>
          </div>
          {data.date && (
            <span className="share-card-date">{data.date}</span>
          )}
        </div>

        {/* 主要内容 */}
        <div className="share-card-content">
          {/* 类型图标 */}
          <div className="share-card-type-icon" style={{ background: `${style.accentColor}20` }}>
            <span>{style.icon}</span>
          </div>

          {/* 标题 */}
          <h2 className="share-card-title">{data.title}</h2>
          {data.subtitle && (
            <p className="share-card-subtitle">{data.subtitle}</p>
          )}

          {/* 分数展示 */}
          {scorePercentage !== null && (
            <div className="share-card-score">
              <div className="score-circle" style={{ borderColor: style.accentColor }}>
                <span className="score-value" style={{ color: style.accentColor }}>
                  {scorePercentage}%
                </span>
                <span className="score-label">准确率</span>
              </div>
              {data.score !== undefined && data.maxScore !== undefined && (
                <div className="score-detail">
                  <span className="score-numbers">{data.score}/{data.maxScore}</span>
                  <span className="score-text">正确题数</span>
                </div>
              )}
            </div>
          )}

          {/* 排名 */}
          {data.rank && (
            <div className="share-card-rank" style={{ background: `${style.accentColor}15` }}>
              <span className="rank-label">排名</span>
              <span className="rank-value" style={{ color: style.accentColor }}>#{data.rank}</span>
            </div>
          )}

          {/* 统计数据 */}
          {data.stats && data.stats.length > 0 && (
            <div className="share-card-stats">
              {data.stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span
                    className="stat-value"
                    style={stat.highlight ? { color: style.accentColor } : undefined}
                  >
                    {stat.value}
                  </span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="share-card-footer">
          {data.username && (
            <div className="share-card-user">
              <div className="user-avatar" style={{ background: style.gradient }}>
                {data.avatarInitial || data.username[0]?.toUpperCase()}
              </div>
              <span className="user-name">{data.username}</span>
            </div>
          )}
          <div className="share-card-qr">
            <div className="qr-placeholder">
              <span>扫码加入</span>
            </div>
            <span className="qr-url">gtoplay.com</span>
          </div>
        </div>

        {/* 水印 */}
        <div className="share-card-watermark">
          Powered by Aokiz GTO
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        className="share-card-generate-btn"
        onClick={generateImage}
        disabled={isGenerating}
        style={{ background: style.gradient }}
      >
        {isGenerating ? (
          <>
            <span className="btn-spinner" />
            生成中...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            保存分享图片
          </>
        )}
      </button>
    </div>
  );
}

// 预设分享卡片类型
export function ChallengeShareCard({
  score,
  totalQuestions,
  rank,
  date,
  username
}: {
  score: number;
  totalQuestions: number;
  rank?: number;
  date: string;
  username?: string;
}) {
  return (
    <ShareCard
      data={{
        type: 'challenge',
        title: 'Daily Challenge',
        subtitle: '每日挑战完成',
        score,
        maxScore: totalQuestions,
        rank,
        date,
        username,
        avatarInitial: username?.[0],
      }}
    />
  );
}

export function PKShareCard({
  result,
  myScore,
  opponentScore,
  opponentName,
  username,
}: {
  result: 'win' | 'lose' | 'draw';
  myScore: number;
  opponentScore: number;
  opponentName: string;
  username?: string;
}) {
  const resultText = result === 'win' ? '胜利' : result === 'lose' ? '失败' : '平局';
  const resultEmoji = result === 'win' ? '🎉' : result === 'lose' ? '😢' : '🤝';

  return (
    <ShareCard
      data={{
        type: 'pk',
        title: `PK ${resultText} ${resultEmoji}`,
        subtitle: `vs ${opponentName}`,
        stats: [
          { label: '我的得分', value: myScore, highlight: result === 'win' },
          { label: '对手得分', value: opponentScore, highlight: result === 'lose' },
        ],
        username,
        date: new Date().toLocaleDateString('zh-CN'),
      }}
    />
  );
}

export function StreakShareCard({
  days,
  totalSessions,
  accuracy,
  username,
}: {
  days: number;
  totalSessions: number;
  accuracy: number;
  username?: string;
}) {
  return (
    <ShareCard
      data={{
        type: 'streak',
        title: `${days} 天连续练习`,
        subtitle: '坚持就是胜利！',
        stats: [
          { label: '练习天数', value: `${days}天`, highlight: true },
          { label: '总练习次数', value: totalSessions },
          { label: '平均准确率', value: `${accuracy}%` },
        ],
        username,
        date: new Date().toLocaleDateString('zh-CN'),
      }}
    />
  );
}

export function AchievementShareCard({
  achievementName,
  achievementDescription,
  username,
}: {
  achievementName: string;
  achievementDescription: string;
  username?: string;
}) {
  return (
    <ShareCard
      data={{
        type: 'achievement',
        title: achievementName,
        subtitle: achievementDescription,
        username,
        date: new Date().toLocaleDateString('zh-CN'),
      }}
    />
  );
}

export default ShareCard;
