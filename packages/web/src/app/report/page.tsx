'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';

type WeaknessCategory = 'position' | 'street' | 'scenario' | 'hand_type';
type Severity = 'critical' | 'major' | 'minor' | 'none';

interface WeaknessData {
  category: WeaknessCategory;
  name: string;
  nameZh: string;
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number;
  evLossBB: number;
  trend: 'improving' | 'declining' | 'stable';
  severity: Severity;
}

interface Recommendation {
  priority: number;
  category: WeaknessCategory;
  targetArea: string;
  targetAreaZh: string;
  description: string;
  descriptionZh: string;
  suggestedPractice: string;
  suggestedPracticeZh: string;
  practiceUrl?: string;
}

interface WeaknessReport {
  success: boolean;
  userId: string;
  generatedAt: string;
  summary: {
    totalDecisions: number;
    overallAccuracy: number;
    totalEvLossBB: number;
    avgEvLossPerDecision: number;
    overallRating: string;
    overallRatingEn: string;
    improvementFromLastWeek?: number;
  };
  weaknesses: {
    critical: WeaknessData[];
    major: WeaknessData[];
    minor: WeaknessData[];
  };
  strengths: WeaknessData[];
  recommendations: Recommendation[];
  byPosition: WeaknessData[];
  byStreet: WeaknessData[];
  byScenario: WeaknessData[];
  byHandType: WeaknessData[];
  recentTrend: {
    date: string;
    accuracy: number;
    evLossBB: number;
  }[];
}

type TabType = 'overview' | 'position' | 'street' | 'scenario' | 'hand_type';

export default function ReportPage() {
  const { isMobile } = useResponsive();
  const [report, setReport] = useState<WeaknessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [error, setError] = useState<string | null>(null);

  // Fetch report on mount
  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch('/api/analysis/weakness');
        const data = await response.json();
        if (data.success) {
          setReport(data);
        } else {
          setError(data.error || '加载失败');
        }
      } catch (err) {
        setError('网络错误，请重试');
      }
      setLoading(false);
    }
    fetchReport();
  }, []);

  // Get severity color
  const getSeverityColor = (severity: Severity): string => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'major': return '#ff9500';
      case 'minor': return '#f5d000';
      default: return '#22d3bf';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '↑';
      case 'declining': return '↓';
      default: return '→';
    }
  };

  // Get trend color
  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'improving': return '#22c55e';
      case 'declining': return '#ef4444';
      default: return '#888';
    }
  };

  // Render weakness card
  const renderWeaknessCard = (weakness: WeaknessData) => (
    <div
      key={`${weakness.category}-${weakness.name}`}
      className="weakness-card"
      style={{ borderLeftColor: getSeverityColor(weakness.severity) }}
    >
      <div className="card-header">
        <span className="weakness-name">{weakness.nameZh}</span>
        <span
          className="trend-badge"
          style={{ color: getTrendColor(weakness.trend) }}
        >
          {getTrendIcon(weakness.trend)}
        </span>
      </div>
      <div className="card-stats">
        <div className="stat">
          <span className="stat-value">{weakness.accuracy.toFixed(0)}%</span>
          <span className="stat-label">准确率</span>
        </div>
        <div className="stat">
          <span className="stat-value">{weakness.totalDecisions}</span>
          <span className="stat-label">决策数</span>
        </div>
        <div className="stat">
          <span className="stat-value">{weakness.evLossBB.toFixed(2)}</span>
          <span className="stat-label">EV损失(BB)</span>
        </div>
      </div>
      <div className="accuracy-bar">
        <div
          className="accuracy-fill"
          style={{
            width: `${weakness.accuracy}%`,
            backgroundColor: getSeverityColor(weakness.severity),
          }}
        />
      </div>
    </div>
  );

  // Render recommendation card
  const renderRecommendation = (rec: Recommendation) => (
    <div key={rec.priority} className="recommendation-card">
      <div className="rec-header">
        <span className="priority-badge">#{rec.priority}</span>
        <span className="target-area">{rec.targetAreaZh}</span>
      </div>
      <p className="rec-description">{rec.descriptionZh}</p>
      <p className="rec-suggestion">{rec.suggestedPracticeZh}</p>
      {rec.practiceUrl && (
        <Link href={rec.practiceUrl} className="practice-link">
          开始练习 →
        </Link>
      )}
    </div>
  );

  // Render data table
  const renderDataTable = (data: WeaknessData[], title: string) => (
    <div className="data-section">
      <h3>{title}</h3>
      <div className="data-table">
        <div className="table-header">
          <span>名称</span>
          <span>准确率</span>
          <span>决策数</span>
          <span>EV损失</span>
          <span>趋势</span>
        </div>
        {data.map(item => (
          <div
            key={`${item.category}-${item.name}`}
            className="table-row"
            style={{ borderLeftColor: getSeverityColor(item.severity) }}
          >
            <span className="name-cell">{item.nameZh}</span>
            <span className="accuracy-cell" style={{ color: getSeverityColor(item.severity) }}>
              {item.accuracy.toFixed(0)}%
            </span>
            <span>{item.totalDecisions}</span>
            <span>{item.evLossBB.toFixed(2)} BB</span>
            <span style={{ color: getTrendColor(item.trend) }}>
              {getTrendIcon(item.trend)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="report-page loading">
        <div className="loading-spinner" />
        <p>正在分析您的练习数据...</p>
        <style jsx>{`
          .report-page.loading {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #888;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #333;
            border-top-color: #22d3bf;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-page error">
        <div className="error-icon">!</div>
        <p>{error || '加载失败'}</p>
        <Link href="/" className="back-link">返回首页</Link>
        <style jsx>{`
          .report-page.error {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #888;
          }
          .error-icon {
            width: 48px;
            height: 48px;
            border: 2px solid #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ef4444;
            font-size: 24px;
            margin-bottom: 16px;
          }
          .back-link {
            margin-top: 16px;
            color: #22d3bf;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="header">
        <Link href="/" className="back-link">← 返回</Link>
        <h1>弱点诊断报告</h1>
        <div className="generated-at">
          {new Date(report.generatedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>

      {/* Summary Card */}
      <div className="summary-card">
        <div className="rating-section">
          <div className="overall-rating">{report.summary.overallRating}</div>
          {report.summary.improvementFromLastWeek !== undefined && (
            <div
              className="improvement"
              style={{
                color: report.summary.improvementFromLastWeek >= 0 ? '#22c55e' : '#ef4444'
              }}
            >
              {report.summary.improvementFromLastWeek >= 0 ? '+' : ''}
              {report.summary.improvementFromLastWeek.toFixed(1)}% 较上周
            </div>
          )}
        </div>

        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{report.summary.overallAccuracy.toFixed(1)}%</span>
            <span className="stat-label">总体准确率</span>
          </div>
          <div className="stat">
            <span className="stat-value">{report.summary.totalDecisions}</span>
            <span className="stat-label">总决策数</span>
          </div>
          <div className="stat">
            <span className="stat-value">{report.summary.totalEvLossBB.toFixed(2)}</span>
            <span className="stat-label">总EV损失(BB)</span>
          </div>
          <div className="stat">
            <span className="stat-value">{report.summary.avgEvLossPerDecision.toFixed(3)}</span>
            <span className="stat-label">每决策损失</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'overview', label: '概览' },
          { id: 'position', label: '按位置' },
          { id: 'street', label: '按街' },
          { id: 'scenario', label: '按场景' },
          { id: 'hand_type', label: '按手牌' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <>
            {/* Recommendations */}
            <div className="section">
              <h2>改进建议</h2>
              <div className="recommendations-list">
                {report.recommendations.map(renderRecommendation)}
              </div>
            </div>

            {/* Critical Weaknesses */}
            {report.weaknesses.critical.length > 0 && (
              <div className="section">
                <h2 className="section-title critical">
                  <span className="severity-dot" style={{ background: '#ff4444' }} />
                  严重弱点 ({report.weaknesses.critical.length})
                </h2>
                <div className="weakness-grid">
                  {report.weaknesses.critical.map(renderWeaknessCard)}
                </div>
              </div>
            )}

            {/* Major Weaknesses */}
            {report.weaknesses.major.length > 0 && (
              <div className="section">
                <h2 className="section-title major">
                  <span className="severity-dot" style={{ background: '#ff9500' }} />
                  主要弱点 ({report.weaknesses.major.length})
                </h2>
                <div className="weakness-grid">
                  {report.weaknesses.major.map(renderWeaknessCard)}
                </div>
              </div>
            )}

            {/* Strengths */}
            {report.strengths.length > 0 && (
              <div className="section">
                <h2 className="section-title strengths">
                  <span className="severity-dot" style={{ background: '#22c55e' }} />
                  优势领域 ({report.strengths.length})
                </h2>
                <div className="weakness-grid">
                  {report.strengths.slice(0, 4).map(renderWeaknessCard)}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'position' && renderDataTable(report.byPosition, '按位置分析')}
        {activeTab === 'street' && renderDataTable(report.byStreet, '按街分析')}
        {activeTab === 'scenario' && renderDataTable(report.byScenario, '按场景分析')}
        {activeTab === 'hand_type' && renderDataTable(report.byHandType, '按手牌类型分析')}
      </div>

      {/* Action Button */}
      <div className="action-section">
        <Link href="/practice" className="practice-btn">
          开始针对性练习
        </Link>
      </div>

      <style jsx>{`
        .report-page {
          min-height: 100vh;
          background: #0d0d0d;
          padding: 20px;
          padding-bottom: 100px;
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
          font-size: 20px;
          font-weight: 600;
        }

        .generated-at {
          font-size: 12px;
          color: #666;
        }

        /* Summary Card */
        .summary-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .rating-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .overall-rating {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #22d3bf, #9b5de5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .improvement {
          font-size: 14px;
          margin-top: 8px;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(${isMobile ? 2 : 4}, 1fr);
          gap: 16px;
        }

        .summary-stats .stat {
          text-align: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }

        .stat-label {
          font-size: 11px;
          color: #888;
          margin-top: 4px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tab {
          flex: 0 0 auto;
          padding: 10px 16px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
        }

        .tab.active {
          border-color: #22d3bf;
          color: #22d3bf;
        }

        /* Sections */
        .section {
          margin-bottom: 32px;
        }

        .section h2 {
          font-size: 16px;
          color: #fff;
          margin-bottom: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .severity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* Weakness Grid */
        .weakness-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .weakness-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-left-width: 4px;
          border-radius: 12px;
          padding: 16px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .weakness-name {
          font-weight: 600;
          font-size: 15px;
        }

        .trend-badge {
          font-size: 16px;
          font-weight: 700;
        }

        .card-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .card-stats .stat {
          flex: 1;
        }

        .card-stats .stat-value {
          font-size: 18px;
        }

        .accuracy-bar {
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .accuracy-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        /* Recommendations */
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 16px;
        }

        .rec-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .priority-badge {
          background: linear-gradient(135deg, #9b5de5, #ec4899);
          color: #fff;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .target-area {
          font-weight: 600;
          color: #fff;
        }

        .rec-description {
          color: #aaa;
          font-size: 13px;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .rec-suggestion {
          color: #22d3bf;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .practice-link {
          color: #9b5de5;
          font-size: 13px;
          text-decoration: none;
        }

        .practice-link:hover {
          text-decoration: underline;
        }

        /* Data Table */
        .data-section h3 {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .data-table {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          color: #888;
          border-bottom: 1px solid #333;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr;
          padding: 12px 16px;
          font-size: 13px;
          border-bottom: 1px solid #222;
          border-left: 3px solid transparent;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .name-cell {
          font-weight: 500;
        }

        .accuracy-cell {
          font-weight: 600;
        }

        /* Action Section */
        .action-section {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          background: linear-gradient(to top, #0d0d0d 80%, transparent);
        }

        .practice-btn {
          display: block;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          padding: 16px;
          background: linear-gradient(135deg, #22d3bf, #9b5de5);
          border: none;
          border-radius: 12px;
          color: #000;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .table-header, .table-row {
            grid-template-columns: 1.5fr 1fr 0.8fr 1fr 0.5fr;
            font-size: 12px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}
