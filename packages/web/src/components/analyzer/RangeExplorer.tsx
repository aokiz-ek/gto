'use client';

import { useState, useMemo, CSSProperties } from 'react';
import type { Card as CardType } from '@gto/core';

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

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

interface HandEV {
  hand: string;
  ev: number;
  frequency: number;
  actions: { action: string; freq: number; ev: number }[];
}

interface RangeExplorerProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  position?: string;
  analysisResult?: {
    rangeEV?: HandEV[];
  } | null;
}

// 模拟生成范围EV数据
function generateRangeEV(): HandEV[][] {
  const matrix: HandEV[][] = [];

  for (let i = 0; i < 13; i++) {
    const row: HandEV[] = [];
    for (let j = 0; j < 13; j++) {
      const r1 = RANKS[i];
      const r2 = RANKS[j];
      let hand: string;

      if (i === j) {
        hand = `${r1}${r2}`;
      } else if (i < j) {
        hand = `${r1}${r2}s`;
      } else {
        hand = `${r2}${r1}o`;
      }

      // 模拟EV计算
      const baseEV = (12 - i) * 0.5 + (12 - j) * 0.3;
      const pairBonus = i === j ? 3 : 0;
      const suitedBonus = i < j ? 1.5 : 0;
      const connectorBonus = Math.abs(i - j) <= 1 ? 1 : 0;
      const ev = baseEV + pairBonus + suitedBonus + connectorBonus - 5 + (Math.random() - 0.5) * 2;

      // 模拟频率
      const freq = Math.max(0, Math.min(100, 50 + ev * 5 + (Math.random() - 0.5) * 20));

      row.push({
        hand,
        ev: Math.round(ev * 100) / 100,
        frequency: Math.round(freq),
        actions: [
          { action: 'raise', freq: Math.round(freq * 0.6), ev: ev * 1.2 },
          { action: 'call', freq: Math.round(freq * 0.3), ev: ev * 0.8 },
          { action: 'fold', freq: 100 - Math.round(freq), ev: 0 },
        ],
      });
    }
    matrix.push(row);
  }

  return matrix;
}

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.15s',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    fontSize: '1.1rem',
    color: COLORS.primary,
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.textPrimary,
  },
  toggle: {
    color: COLORS.textMuted,
    transition: 'transform 0.2s',
    display: 'flex',
  },
  body: {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '8px',
  },
  viewBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  matrixContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    overflowX: 'auto' as const,
  },
  matrixRow: {
    display: 'flex',
    gap: '2px',
  },
  cell: {
    width: '36px',
    height: '36px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative' as const,
  },
  cellHand: {
    fontSize: '9px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    lineHeight: 1,
  },
  cellValue: {
    fontSize: '8px',
    fontWeight: 500,
    lineHeight: 1,
    marginTop: '2px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: COLORS.textMuted,
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
  },
  detailPanel: {
    marginTop: '12px',
    padding: '14px',
    background: COLORS.bgDark,
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  detailHand: {
    fontSize: '18px',
    fontWeight: 700,
    color: COLORS.textPrimary,
  },
  detailEV: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  detailActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBox: {
    flex: 1,
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  actionName: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginBottom: '4px',
  },
  actionFreq: {
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  actionEV: {
    fontSize: '9px',
    color: COLORS.textMuted,
    marginTop: '2px',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  statBox: {
    flex: 1,
    minWidth: '80px',
    padding: '10px',
    background: COLORS.bgDark,
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginTop: '2px',
  },
  emptyState: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  },
  emptyIcon: {
    color: COLORS.border,
    marginBottom: '10px',
  },
  emptyTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '11px',
    color: COLORS.textMuted,
  },
};

type ViewMode = 'ev' | 'frequency' | 'action';

const ACTION_COLORS: Record<string, string> = {
  raise: '#ef4444',
  call: '#00f5d4',
  fold: '#6b7280',
};

export function RangeExplorer({
  heroHand,
  board,
  position = 'BTN',
}: RangeExplorerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('ev');
  const [selectedCell, setSelectedCell] = useState<HandEV | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const rangeMatrix = useMemo(() => generateRangeEV(), []);

  const stats = useMemo(() => {
    const allHands = rangeMatrix.flat();
    const totalEV = allHands.reduce((sum, h) => sum + h.ev, 0) / allHands.length;
    const playableHands = allHands.filter(h => h.frequency > 0).length;
    const avgFreq = allHands.reduce((sum, h) => sum + h.frequency, 0) / allHands.length;

    return {
      avgEV: Math.round(totalEV * 100) / 100,
      playableHands,
      avgFreq: Math.round(avgFreq),
    };
  }, [rangeMatrix]);

  const getEVColor = (ev: number): string => {
    if (ev >= 3) return COLORS.success;
    if (ev >= 1) return '#22c55e';
    if (ev >= 0) return COLORS.warning;
    if (ev >= -2) return '#f97316';
    return COLORS.danger;
  };

  const getFreqColor = (freq: number): string => {
    if (freq >= 80) return COLORS.success;
    if (freq >= 60) return '#22c55e';
    if (freq >= 40) return COLORS.warning;
    if (freq >= 20) return '#f97316';
    return COLORS.danger;
  };

  const getCellBackground = (hand: HandEV): string => {
    switch (viewMode) {
      case 'ev':
        const evColor = getEVColor(hand.ev);
        return `${evColor}40`;
      case 'frequency':
        const freqColor = getFreqColor(hand.frequency);
        return `${freqColor}40`;
      case 'action':
        const mainAction = hand.actions.reduce((max, a) => a.freq > max.freq ? a : max);
        return `${ACTION_COLORS[mainAction.action]}40`;
      default:
        return COLORS.bgDark;
    }
  };

  const getCellValueColor = (hand: HandEV): string => {
    switch (viewMode) {
      case 'ev':
        return getEVColor(hand.ev);
      case 'frequency':
        return getFreqColor(hand.frequency);
      case 'action':
        const mainAction = hand.actions.reduce((max, a) => a.freq > max.freq ? a : max);
        return ACTION_COLORS[mainAction.action];
      default:
        return COLORS.textSecondary;
    }
  };

  const getCellValue = (hand: HandEV): string => {
    switch (viewMode) {
      case 'ev':
        return hand.ev >= 0 ? `+${hand.ev.toFixed(1)}` : hand.ev.toFixed(1);
      case 'frequency':
        return `${hand.frequency}%`;
      case 'action':
        const mainAction = hand.actions.reduce((max, a) => a.freq > max.freq ? a : max);
        return mainAction.action[0].toUpperCase();
      default:
        return '';
    }
  };

  // 找到当前手牌在矩阵中的位置
  const highlightedHand = useMemo(() => {
    if (!heroHand) return null;
    const r1 = heroHand[0].rank;
    const r2 = heroHand[1].rank;
    const suited = heroHand[0].suit === heroHand[1].suit;

    const i1 = RANKS.indexOf(r1);
    const i2 = RANKS.indexOf(r2);

    if (i1 === i2) {
      return `${r1}${r2}`;
    } else if (suited) {
      return i1 < i2 ? `${r1}${r2}s` : `${r2}${r1}s`;
    } else {
      return i1 < i2 ? `${r2}${r1}o` : `${r1}${r2}o`;
    }
  }, [heroHand]);

  // 判断是否在翻前阶段（没有公共牌）
  const isPreflop = !board || board.length === 0;

  return (
    <div style={styles.card}>
      {/* Header */}
      <button
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎯</span>
          <span style={styles.title}>范围浏览器 - {position}{isPreflop ? ' (翻前)' : ''}</span>
        </div>
        <span style={{
          ...styles.toggle,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </span>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={styles.body}>
          {/* Stats */}
          <div style={styles.stats}>
            <div style={styles.statBox}>
              <div style={{ ...styles.statValue, color: stats.avgEV >= 0 ? COLORS.success : COLORS.danger }}>
                {stats.avgEV >= 0 ? '+' : ''}{stats.avgEV}
              </div>
              <div style={styles.statLabel}>平均EV</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.playableHands}</div>
              <div style={styles.statLabel}>可玩手牌</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.avgFreq}%</div>
              <div style={styles.statLabel}>平均频率</div>
            </div>
          </div>

          {/* View Controls */}
          <div style={styles.controls}>
            {(['ev', 'frequency', 'action'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                style={{
                  ...styles.viewBtn,
                  background: viewMode === mode ? `${COLORS.primary}20` : 'transparent',
                  borderColor: viewMode === mode ? COLORS.primary : COLORS.border,
                  color: viewMode === mode ? COLORS.primary : COLORS.textSecondary,
                }}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'ev' ? 'EV值' : mode === 'frequency' ? '频率' : '行动'}
              </button>
            ))}
          </div>

          {/* Matrix */}
          <div style={styles.matrixContainer}>
            {rangeMatrix.map((row, i) => (
              <div key={i} style={styles.matrixRow}>
                {row.map((hand, j) => {
                  const isHighlighted = hand.hand === highlightedHand;
                  const isHovered = hand.hand === hoveredCell;
                  const isSelected = selectedCell?.hand === hand.hand;

                  return (
                    <div
                      key={j}
                      style={{
                        ...styles.cell,
                        background: getCellBackground(hand),
                        border: isHighlighted
                          ? `2px solid ${COLORS.primary}`
                          : isSelected
                          ? `2px solid ${COLORS.secondary}`
                          : '1px solid transparent',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        zIndex: isHovered ? 10 : 1,
                        boxShadow: isHovered ? `0 4px 12px ${getCellBackground(hand)}` : 'none',
                      }}
                      onClick={() => setSelectedCell(hand)}
                      onMouseEnter={() => setHoveredCell(hand.hand)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span style={styles.cellHand}>{hand.hand}</span>
                      <span style={{ ...styles.cellValue, color: getCellValueColor(hand) }}>
                        {getCellValue(hand)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            {viewMode === 'ev' && (
              <>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.success }} />
                  <span>高EV</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.warning }} />
                  <span>中性</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.danger }} />
                  <span>负EV</span>
                </div>
              </>
            )}
            {viewMode === 'frequency' && (
              <>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.success }} />
                  <span>高频</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.warning }} />
                  <span>中频</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS.danger }} />
                  <span>低频</span>
                </div>
              </>
            )}
            {viewMode === 'action' && (
              <>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: ACTION_COLORS.raise }} />
                  <span>加注</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: ACTION_COLORS.call }} />
                  <span>跟注</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: ACTION_COLORS.fold }} />
                  <span>弃牌</span>
                </div>
              </>
            )}
          </div>

          {/* Detail Panel */}
          {selectedCell && (
            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <span style={styles.detailHand}>{selectedCell.hand}</span>
                <span style={{
                  ...styles.detailEV,
                  color: selectedCell.ev >= 0 ? COLORS.success : COLORS.danger,
                }}>
                  EV: {selectedCell.ev >= 0 ? '+' : ''}{selectedCell.ev}
                </span>
              </div>
              <div style={styles.detailActions}>
                {selectedCell.actions.map(action => (
                  <div key={action.action} style={styles.actionBox}>
                    <div style={{ ...styles.actionName, color: ACTION_COLORS[action.action] }}>
                      {action.action === 'raise' ? '加注' : action.action === 'call' ? '跟注' : '弃牌'}
                    </div>
                    <div style={{ ...styles.actionFreq, color: ACTION_COLORS[action.action] }}>
                      {action.freq}%
                    </div>
                    <div style={styles.actionEV}>
                      EV: {action.ev >= 0 ? '+' : ''}{action.ev.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
