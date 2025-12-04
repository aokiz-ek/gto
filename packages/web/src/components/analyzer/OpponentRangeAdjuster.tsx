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

// 预设范围类型
interface RangePreset {
  id: string;
  name: string;
  description: string;
  percentage: number;
  color: string;
}

const RANGE_PRESETS: RangePreset[] = [
  { id: 'tight', name: '紧凶', description: '只玩优质手牌', percentage: 12, color: COLORS.danger },
  { id: 'tag', name: '紧凶平衡', description: 'TAG风格玩家', percentage: 18, color: '#f97316' },
  { id: 'standard', name: '标准', description: '普通玩家范围', percentage: 25, color: COLORS.warning },
  { id: 'lag', name: '松凶', description: 'LAG风格玩家', percentage: 35, color: '#22c55e' },
  { id: 'fish', name: '松被动', description: '休闲玩家', percentage: 50, color: COLORS.success },
];

// 行动调整类型
interface ActionAdjustment {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  icon: string;
}

const ACTION_ADJUSTMENTS: ActionAdjustment[] = [
  { id: 'limp', name: '开池溜入', description: '范围更弱', multiplier: 1.5, icon: '😴' },
  { id: 'minraise', name: '最小加注', description: '可能较弱或试探', multiplier: 1.2, icon: '🤔' },
  { id: 'standard_raise', name: '标准加注', description: '正常范围', multiplier: 1.0, icon: '✋' },
  { id: 'big_raise', name: '大额加注', description: '范围更强', multiplier: 0.7, icon: '💪' },
  { id: '3bet', name: '3-Bet', description: '强牌或诈唬', multiplier: 0.4, icon: '🔥' },
  { id: '4bet', name: '4-Bet', description: '顶级强牌', multiplier: 0.15, icon: '💎' },
];

// 对手类型
interface OpponentType {
  id: string;
  name: string;
  vpip: number;
  pfr: number;
  aggression: number;
}

const OPPONENT_TYPES: OpponentType[] = [
  { id: 'rock', name: '石头', vpip: 10, pfr: 8, aggression: 1.5 },
  { id: 'nit', name: '紧手', vpip: 15, pfr: 12, aggression: 2 },
  { id: 'tag', name: 'TAG', vpip: 22, pfr: 18, aggression: 3 },
  { id: 'lag', name: 'LAG', vpip: 30, pfr: 25, aggression: 4 },
  { id: 'maniac', name: '疯狂', vpip: 45, pfr: 35, aggression: 5 },
  { id: 'fish', name: '鱼', vpip: 50, pfr: 10, aggression: 1 },
  { id: 'station', name: '跟注站', vpip: 40, pfr: 8, aggression: 0.5 },
];

interface OpponentRangeAdjusterProps {
  board: CardType[];
  onRangeChange?: (rangePercent: number) => void;
}

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  rangeValue: {
    padding: '4px 10px',
    background: `${COLORS.primary}20`,
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
    color: COLORS.primary,
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
    gap: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
  },
  presetBtn: {
    padding: '10px 6px',
    background: COLORS.bgDark,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  },
  presetName: {
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '4px',
  },
  presetPercent: {
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  opponentTypes: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  opponentBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  sliderSection: {
    padding: '14px',
    background: COLORS.bgDark,
    borderRadius: '8px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  sliderLabel: {
    fontSize: '12px',
    color: COLORS.textSecondary,
  },
  sliderValue: {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
    color: COLORS.primary,
  },
  sliderTrack: {
    position: 'relative' as const,
    height: '8px',
    background: `linear-gradient(to right, ${COLORS.danger}, ${COLORS.warning}, ${COLORS.success})`,
    borderRadius: '4px',
    cursor: 'pointer',
  },
  sliderThumb: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '18px',
    height: '18px',
    background: COLORS.textPrimary,
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
    cursor: 'grab',
  },
  sliderInput: {
    width: '100%',
    height: '8px',
    appearance: 'none' as const,
    WebkitAppearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    margin: 0,
    opacity: 0,
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    fontSize: '9px',
    color: COLORS.textMuted,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  actionBtn: {
    padding: '10px 8px',
    background: COLORS.bgDark,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  },
  actionIcon: {
    fontSize: '16px',
    marginBottom: '4px',
  },
  actionName: {
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '2px',
  },
  actionMultiplier: {
    fontSize: '9px',
    color: COLORS.textMuted,
  },
  summary: {
    padding: '14px',
    background: `${COLORS.primary}10`,
    borderRadius: '8px',
    border: `1px solid ${COLORS.primary}30`,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "'SF Mono', monospace",
    color: COLORS.primary,
  },
  summaryBar: {
    height: '6px',
    background: COLORS.bgDark,
    borderRadius: '3px',
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '10px',
  },
  statBox: {
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  statLabel: {
    fontSize: '9px',
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

export function OpponentRangeAdjuster({ board, onRangeChange }: OpponentRangeAdjusterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [baseRange, setBaseRange] = useState(25);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('standard');
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>('standard_raise');
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const adjustedRange = useMemo(() => {
    let range = baseRange;

    // 应用行动调整
    if (selectedAction) {
      const action = ACTION_ADJUSTMENTS.find(a => a.id === selectedAction);
      if (action) {
        range = Math.min(100, Math.max(1, Math.round(range * action.multiplier)));
      }
    }

    // 应用公共牌调整（牌面越湿，范围越窄）
    if (board.length >= 3) {
      const suits = new Set(board.map(c => c.suit)).size;
      const ranks = board.map(c => '23456789TJQKA'.indexOf(c.rank));
      const connected = ranks.sort((a, b) => a - b).some((r, i, arr) =>
        i > 0 && r - arr[i - 1] <= 2
      );

      if (suits === 1) range *= 0.9; // 同花面
      if (connected) range *= 0.95; // 连牌面
    }

    return Math.min(100, Math.max(1, Math.round(range)));
  }, [baseRange, selectedAction, board]);

  // 通知父组件范围变化
  useMemo(() => {
    onRangeChange?.(adjustedRange);
  }, [adjustedRange, onRangeChange]);

  const handlePresetClick = (preset: RangePreset) => {
    setSelectedPreset(preset.id);
    setBaseRange(preset.percentage);
  };

  const handleOpponentClick = (opponent: OpponentType) => {
    setSelectedOpponent(opponent.id);
    setBaseRange(opponent.vpip);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBaseRange(value);
    setSelectedPreset(null);
    setSelectedOpponent(null);
  };

  const currentOpponent = OPPONENT_TYPES.find(o => o.id === selectedOpponent);

  if (!board || board.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div style={styles.emptyTitle}>对手范围调整</div>
        <div style={styles.emptyHint}>添加公共牌后调整对手范围</div>
      </div>
    );
  }

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
          <span style={styles.title}>对手范围调整</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.rangeValue}>{adjustedRange}%</span>
          <span style={{
            ...styles.toggle,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={styles.body}>
          {/* Range Presets */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>快速选择范围</div>
            <div style={styles.presetGrid}>
              {RANGE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  style={{
                    ...styles.presetBtn,
                    background: selectedPreset === preset.id ? `${preset.color}20` : COLORS.bgDark,
                    borderColor: selectedPreset === preset.id ? preset.color : hoveredPreset === preset.id ? COLORS.textMuted : COLORS.border,
                    transform: hoveredPreset === preset.id ? 'translateY(-2px)' : 'none',
                  }}
                  onClick={() => handlePresetClick(preset)}
                  onMouseEnter={() => setHoveredPreset(preset.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                >
                  <div style={styles.presetName}>{preset.name}</div>
                  <div style={{ ...styles.presetPercent, color: preset.color }}>
                    {preset.percentage}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Opponent Types */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>对手类型</div>
            <div style={styles.opponentTypes}>
              {OPPONENT_TYPES.map(opponent => (
                <button
                  key={opponent.id}
                  style={{
                    ...styles.opponentBtn,
                    background: selectedOpponent === opponent.id ? `${COLORS.secondary}20` : 'transparent',
                    borderColor: selectedOpponent === opponent.id ? COLORS.secondary : COLORS.border,
                    color: selectedOpponent === opponent.id ? COLORS.secondary : COLORS.textSecondary,
                  }}
                  onClick={() => handleOpponentClick(opponent)}
                >
                  {opponent.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Slider */}
          <div style={styles.sliderSection}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>手动调整</span>
              <span style={styles.sliderValue}>{baseRange}%</span>
            </div>
            <div style={{ position: 'relative' as const }}>
              <div style={styles.sliderTrack}>
                <div style={{ ...styles.sliderThumb, left: `${baseRange}%` }} />
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={baseRange}
                onChange={handleSliderChange}
                style={{ ...styles.sliderInput, height: '24px', top: '-8px' }}
              />
            </div>
            <div style={styles.sliderLabels}>
              <span style={{ color: COLORS.danger }}>极紧 5%</span>
              <span>标准 25%</span>
              <span style={{ color: COLORS.success }}>极松 50%+</span>
            </div>
          </div>

          {/* Action Adjustments */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>对手行动</div>
            <div style={styles.actionGrid}>
              {ACTION_ADJUSTMENTS.map(action => (
                <button
                  key={action.id}
                  style={{
                    ...styles.actionBtn,
                    background: selectedAction === action.id ? `${COLORS.primary}15` : COLORS.bgDark,
                    borderColor: selectedAction === action.id ? COLORS.primary : hoveredAction === action.id ? COLORS.textMuted : COLORS.border,
                    transform: hoveredAction === action.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onClick={() => setSelectedAction(action.id)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <div style={styles.actionIcon}>{action.icon}</div>
                  <div style={{ ...styles.actionName, color: selectedAction === action.id ? COLORS.primary : COLORS.textPrimary }}>
                    {action.name}
                  </div>
                  <div style={styles.actionMultiplier}>
                    x{action.multiplier}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>调整后对手范围</span>
              <span style={styles.summaryValue}>{adjustedRange}% 手牌</span>
            </div>
            <div style={styles.summaryBar}>
              <div style={{ ...styles.summaryFill, width: `${adjustedRange}%` }} />
            </div>

            {currentOpponent && (
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statValue, color: COLORS.primary }}>{currentOpponent.vpip}%</div>
                  <div style={styles.statLabel}>VPIP</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statValue, color: COLORS.secondary }}>{currentOpponent.pfr}%</div>
                  <div style={styles.statLabel}>PFR</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statValue, color: COLORS.warning }}>{currentOpponent.aggression}</div>
                  <div style={styles.statLabel}>AF</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
