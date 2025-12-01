'use client';

import { useMemo, useState } from 'react';
import { useUserStore } from '@/store';
import { useToast } from '@/components';
import Link from 'next/link';

// Helper to calculate accuracy percentage
function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Helper to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Share stats to social media
function generateShareText(streak: number, accuracy: number, decisions: number): string {
  const emoji = streak >= 30 ? '👑' : streak >= 7 ? '⚡' : streak >= 3 ? '🔥' : '🎯';
  return `${emoji} GTO训练连续打卡${streak}天！
📊 总正确率: ${accuracy}%
🎴 已完成${decisions}次决策

和我一起提升GTO水平吧！
#GTO训练 #扑克`;
}

export default function StatsPage() {
  const { practiceStats, resetStats } = useUserStore();
  const { showToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);

  // Calculate overall stats
  const overallAccuracy = calcAccuracy(practiceStats.correctDecisions, practiceStats.totalDecisions);

  // Stats by street
  const streetStats = useMemo(() => {
    return Object.entries(practiceStats.byStreet).map(([street, data]) => ({
      name: street === 'preflop' ? '翻前' : street === 'flop' ? '翻牌' : street === 'turn' ? '转牌' : '河牌',
      key: street,
      accuracy: calcAccuracy(data.correct, data.total),
      total: data.total,
    }));
  }, [practiceStats.byStreet]);

  // Stats by scenario
  const scenarioStats = useMemo(() => {
    return Object.entries(practiceStats.byScenario).map(([scenario, data]) => ({
      name: scenario === 'rfi' ? 'RFI' : scenario === 'vs_rfi' ? 'vs RFI' : 'vs 3-Bet',
      key: scenario,
      accuracy: calcAccuracy(data.correct, data.total),
      total: data.total,
    }));
  }, [practiceStats.byScenario]);

  // Stats by position
  const positionStats = useMemo(() => {
    return Object.entries(practiceStats.byPosition)
      .map(([position, data]) => ({
        name: position,
        accuracy: calcAccuracy(data.correct, data.total),
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [practiceStats.byPosition]);

  // Stats by hand type
  const handTypeStats = useMemo(() => {
    return Object.entries(practiceStats.byHandType).map(([type, data]) => ({
      name: type === 'pairs' ? '对子' : type === 'suited' ? '同花' : '杂色',
      key: type,
      accuracy: calcAccuracy(data.correct, data.total),
      total: data.total,
    }));
  }, [practiceStats.byHandType]);

  // Daily trend (last 7 days)
  const dailyTrend = useMemo(() => {
    const last7 = practiceStats.dailyHistory.slice(-7);
    return last7.map(day => ({
      date: formatDate(day.date),
      accuracy: calcAccuracy(day.correct, day.total),
      total: day.total,
    }));
  }, [practiceStats.dailyHistory]);

  // Weak spots with friendly names
  const weakSpotNames: Record<string, string> = {
    preflop_street: '翻前街',
    flop_street: '翻牌街',
    turn_street: '转牌街',
    river_street: '河牌街',
    rfi_scenario: 'RFI场景',
    vs_rfi_scenario: 'vs RFI场景',
    vs_3bet_scenario: 'vs 3-Bet场景',
    pairs_hands: '对子手牌',
    suited_hands: '同花手牌',
    offsuit_hands: '杂色手牌',
  };

  return (
    <div className="stats-page">
      {/* Header */}
      <div className="header">
        <Link href="/practice" className="back-link">← 返回练习</Link>
        <h1>练习统计</h1>
        <button className="reset-btn" onClick={() => {
          if (confirm('确定要重置所有统计数据吗？')) {
            resetStats();
          }
        }}>重置数据</button>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card overall">
          <div className="card-label">总体正确率</div>
          <div className="card-value">{overallAccuracy}%</div>
          <div className="card-sub">{practiceStats.totalDecisions} 次决策</div>
        </div>
        <div className="card streak">
          <div className="card-label">连续天数</div>
          <div className="card-value">{practiceStats.streakDays}</div>
          <div className="card-sub">天</div>
          <button
            className="share-btn"
            onClick={() => setShowShareModal(true)}
            title="分享我的成绩"
          >
            📤 分享
          </button>
        </div>
        <div className="card correct">
          <div className="card-label">正确决策</div>
          <div className="card-value">{practiceStats.correctDecisions}</div>
          <div className="card-sub">/ {practiceStats.totalDecisions}</div>
        </div>
      </div>

      {/* Weak Spots Alert */}
      {practiceStats.weakSpots.length > 0 && (
        <div className="weak-spots-alert">
          <div className="alert-title">需要加强的领域</div>
          <div className="weak-list">
            {practiceStats.weakSpots.map(spot => (
              <span key={spot} className="weak-tag">
                {weakSpotNames[spot] || spot}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Sections */}
      <div className="stats-grid">
        {/* By Street */}
        <div className="stats-section">
          <h2>按街统计</h2>
          <div className="stat-bars">
            {streetStats.map(stat => (
              <div key={stat.key} className="stat-bar-row">
                <span className="stat-name">{stat.name}</span>
                <div className="stat-bar-container">
                  <div
                    className={`stat-bar ${stat.accuracy >= 70 ? 'good' : stat.accuracy >= 50 ? 'medium' : 'bad'}`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <span className="stat-value">{stat.accuracy}%</span>
                <span className="stat-count">({stat.total})</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Scenario */}
        <div className="stats-section">
          <h2>按场景统计</h2>
          <div className="stat-bars">
            {scenarioStats.map(stat => (
              <div key={stat.key} className="stat-bar-row">
                <span className="stat-name">{stat.name}</span>
                <div className="stat-bar-container">
                  <div
                    className={`stat-bar ${stat.accuracy >= 70 ? 'good' : stat.accuracy >= 50 ? 'medium' : 'bad'}`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <span className="stat-value">{stat.accuracy}%</span>
                <span className="stat-count">({stat.total})</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Position */}
        <div className="stats-section">
          <h2>按位置统计</h2>
          <div className="stat-bars">
            {positionStats.length > 0 ? positionStats.map(stat => (
              <div key={stat.name} className="stat-bar-row">
                <span className="stat-name">{stat.name}</span>
                <div className="stat-bar-container">
                  <div
                    className={`stat-bar ${stat.accuracy >= 70 ? 'good' : stat.accuracy >= 50 ? 'medium' : 'bad'}`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <span className="stat-value">{stat.accuracy}%</span>
                <span className="stat-count">({stat.total})</span>
              </div>
            )) : <div className="no-data">暂无数据</div>}
          </div>
        </div>

        {/* By Hand Type */}
        <div className="stats-section">
          <h2>按手牌类型</h2>
          <div className="stat-bars">
            {handTypeStats.map(stat => (
              <div key={stat.key} className="stat-bar-row">
                <span className="stat-name">{stat.name}</span>
                <div className="stat-bar-container">
                  <div
                    className={`stat-bar ${stat.accuracy >= 70 ? 'good' : stat.accuracy >= 50 ? 'medium' : 'bad'}`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <span className="stat-value">{stat.accuracy}%</span>
                <span className="stat-count">({stat.total})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="daily-trend-section">
        <h2>近7天趋势</h2>
        {dailyTrend.length > 0 ? (
          <div className="trend-chart">
            {dailyTrend.map((day, idx) => (
              <div key={idx} className="trend-bar-container">
                <div className="trend-bar" style={{ height: `${day.accuracy}%` }}>
                  <span className="trend-value">{day.accuracy}%</span>
                </div>
                <span className="trend-date">{day.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">暂无历史数据，开始练习来记录你的进步！</div>
        )}
      </div>

      {/* Action Button */}
      <Link href="/practice" className="practice-btn">
        开始练习
      </Link>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>分享我的GTO成绩</h3>
              <button className="close-modal" onClick={() => setShowShareModal(false)}>×</button>
            </div>

            <div className="share-card">
              <div className="share-card-header">
                <span className="share-fire">{practiceStats.streakDays >= 30 ? '👑' : practiceStats.streakDays >= 7 ? '⚡' : practiceStats.streakDays >= 3 ? '🔥' : '🎯'}</span>
                <span className="share-title">GTO训练打卡</span>
              </div>
              <div className="share-stats">
                <div className="share-stat">
                  <span className="share-stat-value">{practiceStats.streakDays}</span>
                  <span className="share-stat-label">连续天数</span>
                </div>
                <div className="share-stat">
                  <span className="share-stat-value">{overallAccuracy}%</span>
                  <span className="share-stat-label">正确率</span>
                </div>
                <div className="share-stat">
                  <span className="share-stat-value">{practiceStats.totalDecisions}</span>
                  <span className="share-stat-label">决策次数</span>
                </div>
              </div>
              <div className="share-footer">GTO Play - 科学提升扑克水平</div>
            </div>

            <div className="share-actions">
              <button
                className="share-action-btn copy"
                onClick={async () => {
                  const text = generateShareText(practiceStats.streakDays, overallAccuracy, practiceStats.totalDecisions);
                  try {
                    await navigator.clipboard.writeText(text);
                    showToast('已复制到剪贴板，快去分享吧！', 'success');
                    setShowShareModal(false);
                  } catch {
                    showToast('复制失败，请手动复制', 'error');
                  }
                }}
              >
                📋 复制文字
              </button>
              <button
                className="share-action-btn twitter"
                onClick={() => {
                  const text = generateShareText(practiceStats.streakDays, overallAccuracy, practiceStats.totalDecisions);
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
              >
                𝕏 分享到 Twitter
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stats-page {
          min-height: 100vh;
          background: #0d0d0d;
          padding: 20px;
          color: #fff;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .back-link {
          color: #888;
          text-decoration: none;
          font-size: 14px;
        }

        .back-link:hover {
          color: #22d3bf;
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
        }

        .reset-btn {
          background: transparent;
          border: 1px solid #333;
          color: #888;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .reset-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        /* Overview Cards */
        .overview-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .card {
          background: #12121a;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .card-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 36px;
          font-weight: 700;
          color: #22d3bf;
        }

        .card.streak .card-value {
          color: #f59e0b;
        }

        .card.correct .card-value {
          color: #22c55e;
        }

        .card-sub {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        /* Weak Spots Alert */
        .weak-spots-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .alert-title {
          font-size: 14px;
          font-weight: 600;
          color: #ef4444;
          margin-bottom: 8px;
        }

        .weak-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .weak-tag {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stats-section {
          background: #12121a;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 20px;
        }

        .stats-section h2 {
          font-size: 14px;
          font-weight: 600;
          color: #888;
          margin-bottom: 16px;
        }

        .stat-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-bar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-name {
          width: 60px;
          font-size: 12px;
          color: #888;
        }

        .stat-bar-container {
          flex: 1;
          height: 8px;
          background: #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
        }

        .stat-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .stat-bar.good {
          background: #22c55e;
        }

        .stat-bar.medium {
          background: #f59e0b;
        }

        .stat-bar.bad {
          background: #ef4444;
        }

        .stat-value {
          width: 40px;
          text-align: right;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .stat-count {
          width: 40px;
          font-size: 11px;
          color: #666;
        }

        .no-data {
          color: #666;
          font-size: 12px;
          text-align: center;
          padding: 20px;
        }

        /* Daily Trend */
        .daily-trend-section {
          background: #12121a;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .daily-trend-section h2 {
          font-size: 14px;
          font-weight: 600;
          color: #888;
          margin-bottom: 16px;
        }

        .trend-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 150px;
          gap: 12px;
        }

        .trend-bar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          height: 100%;
        }

        .trend-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(to top, #22d3bf, #22c55e);
          border-radius: 4px 4px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 4px;
          margin-top: auto;
        }

        .trend-value {
          font-size: 10px;
          font-weight: 600;
          color: #fff;
        }

        .trend-date {
          font-size: 11px;
          color: #666;
          margin-top: 8px;
        }

        /* Practice Button */
        .practice-btn {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          background: #22d3bf;
          color: #000;
          text-align: center;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
        }

        .practice-btn:hover {
          background: #1eb8a6;
        }

        /* Share Button on Streak Card */
        .card.streak {
          position: relative;
        }

        .share-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #f59e0b;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .share-btn:hover {
          background: rgba(245, 158, 11, 0.3);
          border-color: #f59e0b;
          transform: scale(1.05);
        }

        /* Share Modal */
        .share-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .share-modal {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          width: 90%;
          max-width: 360px;
          overflow: hidden;
          animation: modalSlideUp 0.3s ease;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .share-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #2a2a3a;
        }

        .share-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .close-modal {
          background: none;
          border: none;
          color: #666;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .close-modal:hover {
          color: #fff;
        }

        /* Share Card Preview */
        .share-card {
          margin: 20px;
          background: linear-gradient(135deg, #1e1e2e 0%, #12121a 100%);
          border: 1px solid #3a3a4a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .share-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .share-fire {
          font-size: 28px;
        }

        .share-title {
          font-size: 18px;
          font-weight: 700;
          color: #f59e0b;
        }

        .share-stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 16px;
        }

        .share-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .share-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #22d3bf;
        }

        .share-stat-label {
          font-size: 11px;
          color: #888;
          margin-top: 4px;
        }

        .share-footer {
          font-size: 11px;
          color: #666;
          border-top: 1px solid #2a2a3a;
          padding-top: 12px;
          margin-top: 8px;
        }

        /* Share Action Buttons */
        .share-actions {
          display: flex;
          gap: 12px;
          padding: 0 20px 20px;
        }

        .share-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .share-action-btn.copy {
          background: rgba(34, 211, 191, 0.15);
          color: #22d3bf;
          border: 1px solid rgba(34, 211, 191, 0.3);
        }

        .share-action-btn.copy:hover {
          background: rgba(34, 211, 191, 0.25);
          border-color: #22d3bf;
        }

        .share-action-btn.twitter {
          background: rgba(29, 161, 242, 0.15);
          color: #1da1f2;
          border: 1px solid rgba(29, 161, 242, 0.3);
        }

        .share-action-btn.twitter:hover {
          background: rgba(29, 161, 242, 0.25);
          border-color: #1da1f2;
        }

        @media (max-width: 768px) {
          .overview-cards {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
