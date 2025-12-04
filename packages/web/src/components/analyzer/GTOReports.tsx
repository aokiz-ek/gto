'use client';

import { useState, useMemo, CSSProperties } from 'react';
import type { Street } from '@gto/core';

// 项目统一色系
const COLORS = {
  primary: '#00f5d4',      // 主色 - 青色
  secondary: '#9b5de5',    // 次色 - 紫色
  accent: '#f15bb5',       // 强调色 - 粉色
  success: '#00f5d4',      // 成功 - 青色
  warning: '#fbbf24',      // 警告 - 黄色
  danger: '#ef4444',       // 危险 - 红色
  bgDark: '#0a0a0f',       // 深背景
  bgCard: '#12121a',       // 卡片背景
  bgSurface: '#1a1a24',    // 表面背景
  border: '#2a2a3a',       // 边框
  textPrimary: '#ffffff',  // 主文本
  textSecondary: '#9ca3af', // 次文本
  textMuted: '#6b7280',    // 弱化文本
};

interface ActionStats {
  action: string;
  gtoFreq: number;
  yourFreq: number;
  deviation: number;
}

interface StreetStats {
  street: Street;
  actions: ActionStats[];
  overallDeviation: number;
}

interface GTOReportsProps {
  analysisResult?: {
    actions: { action: string; frequency: number; ev: number }[];
    streetAnalysis?: { street: Street; actions: { action: string; frequency: number; ev: number }[] }[];
  } | null;
  userActions?: { street: Street; action: string }[];
  street: Street;
}

const STREET_LABELS: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

const ACTION_LABELS: Record<string, string> = {
  fold: '弃牌',
  check: '过牌',
  call: '跟注',
  bet: '下注',
  raise: '加注',
  allin: '全下',
};

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
  },
  cardTitleIcon: {
    marginRight: '10px',
    fontSize: '1.1rem',
    color: COLORS.primary,
  },
  cardTitleText: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: 0,
    flex: 1,
  },
  subtitle: {
    fontSize: '11px',
    color: COLORS.textSecondary,
    marginBottom: '14px',
  },
  adjustmentsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '16px',
  },
  adjustmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: COLORS.bgDark,
    borderRadius: '8px',
    transition: 'transform 0.2s, background-color 0.2s',
    cursor: 'pointer',
  },
  adjustmentLabel: {
    fontWeight: 600,
    fontSize: '13px',
    color: COLORS.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adjustmentAction: {
    fontSize: '10px',
    fontWeight: 500,
    color: COLORS.textMuted,
    padding: '2px 6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  adjustmentValue: {
    fontSize: '1.2rem',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  scoreSection: {
    marginBottom: '16px',
    padding: '14px',
    backgroundColor: COLORS.bgDark,
    borderRadius: '8px',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '12px',
  },
  scoreValue: {
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  scoreBar: {
    height: '8px',
    background: `linear-gradient(to right, ${COLORS.danger}, ${COLORS.warning}, ${COLORS.success})`,
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  scoreFill: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    height: '100%',
    background: 'rgba(0, 0, 0, 0.6)',
    transition: 'width 0.3s',
  },
  scoreLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    marginTop: '6px',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: COLORS.textSecondary,
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  streetBox: {
    backgroundColor: COLORS.bgDark,
    borderRadius: '8px',
    padding: '10px',
  },
  streetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  streetName: {
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.textPrimary,
  },
  streetStatus: {
    fontSize: '12px',
    fontWeight: 700,
  },
  streetActions: {
    display: 'flex',
    gap: '6px',
  },
  actionMini: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '6px 4px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
  },
  actionName: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginBottom: '2px',
  },
  actionDev: {
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: "'SF Mono', monospace",
  },
  emptyCard: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  },
  emptyContent: {
    padding: '16px',
    color: COLORS.textMuted,
    fontSize: '12px',
  },
};

export function GTOReports({ analysisResult, userActions = [], street }: GTOReportsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const streetStats = useMemo((): StreetStats[] => {
    if (!analysisResult) return [];
    const streets: Street[] = ['preflop', 'flop', 'turn', 'river'];
    const stats: StreetStats[] = [];

    streets.forEach(s => {
      const streetData = s === street ? analysisResult : analysisResult.streetAnalysis?.find(sa => sa.street === s);
      if (!streetData) return;

      const userStreetActions = userActions.filter(ua => ua.street === s);
      const actionCounts: Record<string, number> = {};
      userStreetActions.forEach(ua => { actionCounts[ua.action] = (actionCounts[ua.action] || 0) + 1; });
      const totalUserActions = userStreetActions.length || 1;

      const actions: ActionStats[] = streetData.actions.map(a => {
        const yourFreq = (actionCounts[a.action] || 0) / totalUserActions * 100;
        const gtoFreq = a.frequency * 100;
        return { action: a.action, gtoFreq, yourFreq, deviation: yourFreq - gtoFreq };
      });

      const overallDeviation = actions.reduce((sum, a) => sum + Math.abs(a.deviation), 0) / actions.length;
      stats.push({ street: s, actions, overallDeviation });
    });
    return stats;
  }, [analysisResult, userActions, street]);

  const overallScore = useMemo(() => {
    if (streetStats.length === 0) return 100;
    const avgDeviation = streetStats.reduce((sum, s) => sum + s.overallDeviation, 0) / streetStats.length;
    return Math.max(0, Math.round(100 - avgDeviation * 2));
  }, [streetStats]);

  if (!analysisResult) {
    return (
      <div style={styles.emptyCard}>
        <div style={styles.cardTitle}>
          <span style={styles.cardTitleIcon}>⚙️</span>
          <h3 style={styles.cardTitleText}>策略偏差分析</h3>
        </div>
        <div style={styles.emptyContent}>
          <span>完成分析后显示GTO对比</span>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation < -10) return COLORS.danger;
    if (deviation > 10) return COLORS.success;
    return COLORS.warning;
  };

  return (
    <div style={styles.card}>
      {/* Card Title */}
      <div style={styles.cardTitle} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={styles.cardTitleIcon}>⚙️</span>
        <h3 style={styles.cardTitleText}>策略偏差分析</h3>
        <span style={{
          color: COLORS.textMuted,
          fontSize: '10px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </div>

      {isExpanded && (
        <div>
          <p style={styles.subtitle}>与GTO策略相比的偏差程度（负值表示不足）</p>

          {/* Adjustments List */}
          <div style={styles.adjustmentsList}>
            {streetStats.map(ss => {
              const biggestAction = ss.actions.reduce((max, a) =>
                Math.abs(a.deviation) > Math.abs(max.deviation) ? a : max,
                { action: '', gtoFreq: 0, yourFreq: 0, deviation: 0 }
              );

              const deviation = Math.round(biggestAction.deviation);
              const isHovered = hoveredItem === ss.street;

              return (
                <div
                  key={ss.street}
                  style={{
                    ...styles.adjustmentItem,
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    backgroundColor: isHovered ? '#1a1a24' : COLORS.bgDark,
                  }}
                  onMouseEnter={() => setHoveredItem(ss.street)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={styles.adjustmentLabel}>
                    {STREET_LABELS[ss.street]}
                    {biggestAction.action && (
                      <span style={styles.adjustmentAction}>
                        {ACTION_LABELS[biggestAction.action] || biggestAction.action}
                      </span>
                    )}
                  </span>
                  <span style={{
                    ...styles.adjustmentValue,
                    color: getDeviationColor(deviation)
                  }}>
                    {deviation > 0 ? '+' : ''}{deviation}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Strategy Score Summary */}
          <div style={styles.scoreSection}>
            <div style={styles.scoreHeader}>
              <span style={{ color: COLORS.textSecondary }}>策略执行分数</span>
              <span style={{
                ...styles.scoreValue,
                color: getScoreColor(overallScore)
              }}>
                {overallScore}分
              </span>
            </div>
            <div style={styles.scoreBar}>
              <div style={{
                ...styles.scoreFill,
                width: `${100 - overallScore}%`
              }} />
            </div>
            <div style={styles.scoreLabels}>
              <span style={{ color: COLORS.danger }}>偏差大</span>
              <span style={{ color: COLORS.warning }}>一般</span>
              <span style={{ color: COLORS.success }}>符合GTO</span>
            </div>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: COLORS.primary }} />
              <span>GTO策略</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: COLORS.secondary }} />
              <span>您的策略</span>
            </div>
          </div>

          {/* Action Details */}
          <div style={styles.sectionTitle}>各街行动详情</div>
          <div style={styles.actionsGrid}>
            {streetStats.map(ss => (
              <div key={ss.street} style={styles.streetBox}>
                <div style={styles.streetHeader}>
                  <span style={styles.streetName}>{STREET_LABELS[ss.street]}</span>
                  <span style={{
                    ...styles.streetStatus,
                    color: ss.overallDeviation <= 10 ? COLORS.success : ss.overallDeviation <= 25 ? COLORS.warning : COLORS.danger
                  }}>
                    {ss.overallDeviation <= 10 ? '✓' : ss.overallDeviation <= 25 ? '!' : '✗'}
                  </span>
                </div>
                <div style={styles.streetActions}>
                  {ss.actions.slice(0, 3).map(a => (
                    <div key={a.action} style={styles.actionMini}>
                      <span style={styles.actionName}>{ACTION_LABELS[a.action]?.[0] || a.action[0]}</span>
                      <span style={{
                        ...styles.actionDev,
                        color: a.deviation > 5 ? COLORS.success : a.deviation < -5 ? COLORS.danger : COLORS.warning
                      }}>
                        {a.deviation > 0 ? '+' : ''}{Math.round(a.deviation)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
