'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useUserStore, useStatsStore } from '@/store';
import {
  ALL_BENCHMARKS,
  analyzeUserStats,
  summarizeLeaks,
  generateTrainingRecommendations,
  type UserStats,
  type LeakAnalysis,
  type LeakSummary,
  type TrainingRecommendation,
  type GTOBenchmark,
} from '@gto/core';
import './reports.css';

type FilterCategory = 'all' | 'preflop' | 'postflop' | 'aggression' | 'defense';

const CATEGORY_ICONS: Record<string, string> = {
  preflop: '🃏',
  postflop: '🎲',
  aggression: '⚡',
  defense: '🛡️',
};

const CATEGORY_NAMES: Record<string, string> = {
  preflop: '翻前',
  postflop: '翻后',
  aggression: '进攻',
  defense: '防守',
};

function getGradeClass(grade: string): string {
  return `grade-${grade.toLowerCase()}`;
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'major_leak': return '❌';
    case 'minor_leak': return '⚠️';
    case 'acceptable': return '✓';
    case 'optimal': return '✨';
    default: return '•';
  }
}

function getSeverityClass(severity: string): string {
  switch (severity) {
    case 'major_leak': return 'major';
    case 'minor_leak': return 'minor';
    case 'acceptable': return 'acceptable';
    case 'optimal': return 'optimal';
    default: return '';
  }
}

export default function ReportsPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { practiceStats } = useUserStore();
  const statsStore = useStatsStore();

  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  // Convert practice stats to UserStats format for analysis
  const userStats = useMemo((): UserStats[] => {
    const stats: UserStats[] = [];

    // Add preflop RFI stats by position
    const positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
    positions.forEach(pos => {
      const posStats = practiceStats.byPosition[pos];
      if (posStats && posStats.total >= 10) {
        stats.push({
          action: 'rfi',
          position: pos as any,
          frequency: (posStats.correct / posStats.total) * 100,
          sampleSize: posStats.total,
        });
      }
    });

    // Add scenario-based stats
    const scenarioStats = practiceStats.byScenario;
    if (scenarioStats.vs_rfi.total >= 10) {
      stats.push({
        action: '3bet',
        frequency: (scenarioStats.vs_rfi.correct / scenarioStats.vs_rfi.total) * 100,
        sampleSize: scenarioStats.vs_rfi.total,
      });
    }

    if (scenarioStats.vs_3bet.total >= 10) {
      stats.push({
        action: 'fold_to_3bet',
        frequency: (scenarioStats.vs_3bet.correct / scenarioStats.vs_3bet.total) * 100,
        sampleSize: scenarioStats.vs_3bet.total,
      });
    }

    // Add street-based stats for postflop
    const streetStats = practiceStats.byStreet;
    if (streetStats.flop.total >= 10) {
      stats.push({
        action: 'cbet_flop',
        street: 'flop',
        frequency: (streetStats.flop.correct / streetStats.flop.total) * 100,
        sampleSize: streetStats.flop.total,
      });
    }

    if (streetStats.turn.total >= 10) {
      stats.push({
        action: 'cbet_turn',
        street: 'turn',
        frequency: (streetStats.turn.correct / streetStats.turn.total) * 100,
        sampleSize: streetStats.turn.total,
      });
    }

    if (streetStats.river.total >= 10) {
      stats.push({
        action: 'cbet_river',
        street: 'river',
        frequency: (streetStats.river.correct / streetStats.river.total) * 100,
        sampleSize: streetStats.river.total,
      });
    }

    // Add BB defense stats
    const bbStats = practiceStats.byPosition['BB'];
    if (bbStats && bbStats.total >= 10) {
      stats.push({
        action: 'blind_defense',
        position: 'BB',
        frequency: (bbStats.correct / bbStats.total) * 100,
        sampleSize: bbStats.total,
      });
    }

    return stats;
  }, [practiceStats]);

  // Analyze leaks
  const leakAnalyses = useMemo(() => analyzeUserStats(userStats), [userStats]);

  // Get category summaries
  const categorySummaries = useMemo(() => summarizeLeaks(leakAnalyses), [leakAnalyses]);

  // Get training recommendations
  const recommendations = useMemo(
    () => generateTrainingRecommendations(leakAnalyses),
    [leakAnalyses]
  );

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (categorySummaries.length === 0) return 0;
    const validSummaries = categorySummaries.filter(s => s.totalStats > 0);
    if (validSummaries.length === 0) return 0;
    return Math.round(
      validSummaries.reduce((sum, s) => sum + s.score, 0) / validSummaries.length
    );
  }, [categorySummaries]);

  const overallGrade = useMemo(() => {
    if (overallScore >= 90) return 'A';
    if (overallScore >= 75) return 'B';
    if (overallScore >= 60) return 'C';
    if (overallScore >= 45) return 'D';
    return 'F';
  }, [overallScore]);

  // Filter leaks by category
  const filteredLeaks = useMemo(() => {
    if (filterCategory === 'all') return leakAnalyses;
    return leakAnalyses.filter(l => l.benchmark.category === filterCategory);
  }, [leakAnalyses, filterCategory]);

  const hasData = practiceStats.totalDecisions >= 20;

  // Circle progress calculation
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="reports-page">
      <header className="reports-header">
        <Link href="/" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </Link>
        <h1>GTO 分析报告</h1>
        <p className="subtitle">识别泄漏点，优化你的策略</p>
      </header>

      <div className="reports-content">
        {!hasData ? (
          <div className="overall-score-section">
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h3>数据不足</h3>
              <p>需要至少完成 20 道练习题才能生成分析报告</p>
              <p>当前进度: {practiceStats.totalDecisions} / 20</p>
              <Link href="/practice" className="start-practice-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                开始练习
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Score */}
            <div className="overall-score-section">
              <div className="score-circle">
                <svg className="score-ring" width="180" height="180" viewBox="0 0 180 180">
                  <circle className="score-bg" cx="90" cy="90" r="70" />
                  <circle
                    className={`score-fill ${getGradeClass(overallGrade)}`}
                    cx="90"
                    cy="90"
                    r="70"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="score-text">
                  <div className="score-value">{overallScore}</div>
                  <div className="score-label">综合评分</div>
                </div>
              </div>
              <div className={`grade-badge ${getGradeClass(overallGrade)}`}>
                {overallGrade}
              </div>
              <p className="overall-summary">
                {overallScore >= 90 && '你的策略已经接近 GTO！继续保持！'}
                {overallScore >= 75 && overallScore < 90 && '表现良好，但仍有一些小问题需要修正。'}
                {overallScore >= 60 && overallScore < 75 && '有进步空间。关注下方的泄漏点进行针对性练习。'}
                {overallScore >= 45 && overallScore < 60 && '需要更多练习。你的一些频率偏离 GTO 较大。'}
                {overallScore < 45 && '存在严重的策略问题。建议系统性地学习 GTO 基础。'}
              </p>
            </div>

            {/* Category Cards */}
            <div className="category-grid">
              {categorySummaries.map(summary => (
                <div key={summary.category} className="category-card">
                  <div className="category-icon">
                    {CATEGORY_ICONS[summary.category]}
                  </div>
                  <h3 className="category-name">{CATEGORY_NAMES[summary.category]}</h3>
                  <div className={`category-score ${getGradeClass(summary.grade)}`}>
                    {summary.totalStats > 0 ? summary.score : '-'}
                  </div>
                  <span className={`category-grade ${getGradeClass(summary.grade)}`}>
                    {summary.totalStats > 0 ? `${summary.grade} 级` : '无数据'}
                  </span>
                </div>
              ))}
            </div>

            {/* Leaks Section */}
            <div className="leaks-section">
              <div className="section-header">
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  泄漏点分析
                </h2>
                <div className="leak-tabs">
                  <button
                    className={`leak-tab ${filterCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterCategory('all')}
                  >
                    全部
                  </button>
                  <button
                    className={`leak-tab ${filterCategory === 'preflop' ? 'active' : ''}`}
                    onClick={() => setFilterCategory('preflop')}
                  >
                    翻前
                  </button>
                  <button
                    className={`leak-tab ${filterCategory === 'postflop' ? 'active' : ''}`}
                    onClick={() => setFilterCategory('postflop')}
                  >
                    翻后
                  </button>
                  <button
                    className={`leak-tab ${filterCategory === 'defense' ? 'active' : ''}`}
                    onClick={() => setFilterCategory('defense')}
                  >
                    防守
                  </button>
                </div>
              </div>

              {filteredLeaks.length === 0 ? (
                <div className="no-data">
                  <p>该类别暂无足够数据进行分析</p>
                </div>
              ) : (
                <div className="leaks-list">
                  {filteredLeaks.map((leak, idx) => {
                    const barWidth = Math.min(100, (leak.userFrequency / 100) * 100);
                    const targetPosition = (leak.benchmark.frequency / 100) * 100;
                    const barClass = leak.direction === 'over' ? 'over' : leak.direction === 'under' ? 'under' : 'optimal';

                    return (
                      <div key={idx} className={`leak-item ${getSeverityClass(leak.severity)}`}>
                        <div className="leak-severity">
                          {getSeverityIcon(leak.severity)}
                        </div>
                        <div className="leak-info">
                          <h4 className="leak-title">{leak.benchmark.description}</h4>
                          <p className="leak-description">{leak.recommendation}</p>
                        </div>
                        <div className="leak-stats">
                          <div className="leak-frequency">{leak.userFrequency.toFixed(0)}%</div>
                          <div className="leak-benchmark">GTO: {leak.benchmark.frequency}%</div>
                          <div className="leak-bar">
                            <div
                              className={`leak-bar-fill ${barClass}`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div
                              className="leak-bar-target"
                              style={{ left: `${targetPosition}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="recommendations-section">
                <div className="section-header">
                  <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                    训练建议
                  </h2>
                </div>
                <div className="recommendations-list">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <div className="recommendation-priority">{rec.priority}</div>
                      <div className="recommendation-content">
                        <h4 className="recommendation-title">{rec.title}</h4>
                        <p className="recommendation-description">{rec.description}</p>
                        {rec.suggestedScenarios.length > 0 && (
                          <div className="recommendation-scenarios">
                            {rec.suggestedScenarios.map((scenario, i) => (
                              <span key={i} className="scenario-tag">{scenario}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Links */}
        <div className="quick-links">
          <Link href="/practice" className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            继续练习
          </Link>
          <Link href="/practice/pushfold" className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 18a2 2 0 01-2-2V6a2 2 0 012-2h1a2 2 0 012 2v10a2 2 0 01-2 2h-1zM10 18a2 2 0 01-2-2V6a2 2 0 012-2h1a2 2 0 012 2v10a2 2 0 01-2 2h-1z"/>
            </svg>
            Push/Fold 训练
          </Link>
          <Link href="/analyzer" className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            手牌分析
          </Link>
        </div>
      </div>
    </div>
  );
}
