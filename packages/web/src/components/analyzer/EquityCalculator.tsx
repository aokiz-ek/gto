'use client';

import { useState, useMemo, CSSProperties } from 'react';
import type { Card as CardType } from '@gto/core';

// 项目统一色系
const COLORS = {
  primary: '#00f5d4',      // 主色 - 青色
  secondary: '#9b5de5',    // 次色 - 紫色
  accent: '#f15bb5',       // 强调色 - 粉色
  success: '#00f5d4',      // 成功/赢 - 青色
  warning: '#fbbf24',      // 警告/平 - 黄色
  danger: '#ef4444',       // 危险/输 - 红色
  bgDark: '#0a0a0f',       // 深背景
  bgCard: '#12121a',       // 卡片背景
  bgSurface: '#1a1a24',    // 表面背景
  border: '#2a2a3a',       // 边框
  textPrimary: '#ffffff',  // 主文本
  textSecondary: '#9ca3af', // 次文本
  textMuted: '#6b7280',    // 弱化文本
};

interface EquityCalculatorProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  villainRangePercent?: number;
}

function estimateEquity(
  heroHand: [CardType, CardType],
  board: CardType[],
  villainRangePercent: number
): { equity: number; win: number; tie: number; lose: number; outs: number } {
  const rankOrder = '23456789TJQKA';
  const heroRanks = heroHand.map(c => rankOrder.indexOf(c.rank));
  const heroSuits = heroHand.map(c => c.suit);
  const boardRanks = board.map(c => rankOrder.indexOf(c.rank));
  const boardSuits = board.map(c => c.suit);

  const isPair = heroRanks[0] === heroRanks[1];
  const isSuited = heroSuits[0] === heroSuits[1];
  const highCard = Math.max(...heroRanks);
  const gap = Math.abs(heroRanks[0] - heroRanks[1]);
  const isConnected = gap <= 1;

  let baseEquity = 50;
  let outs = 0;

  if (isPair) baseEquity += (highCard - 6) * 2;
  else {
    baseEquity += (highCard - 6) * 0.8;
    if (isSuited) baseEquity += 4;
    if (isConnected) baseEquity += 2;
  }

  if (board.length >= 3) {
    const allRanks = [...boardRanks, ...heroRanks];
    const allSuits = [...boardSuits, ...heroSuits];
    const suitCounts: Record<string, number> = {};
    allSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount >= 5) baseEquity += 25;
    else if (maxSuitCount === 4) { baseEquity += 8; outs += 9; }

    const uniqueRanks = [...new Set(allRanks)].sort((a, b) => a - b);
    let maxConsec = 1, curConsec = 1;
    for (let i = 1; i < uniqueRanks.length; i++) {
      if (uniqueRanks[i] - uniqueRanks[i - 1] === 1) { curConsec++; maxConsec = Math.max(maxConsec, curConsec); }
      else curConsec = 1;
    }
    if (maxConsec >= 5) baseEquity += 20;
    else if (maxConsec === 4) { baseEquity += 6; outs += 8; }
    else if (maxConsec === 3) outs += 4;

    const rankCounts: Record<number, number> = {};
    allRanks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });
    const maxRankCount = Math.max(...Object.values(rankCounts));
    if (maxRankCount >= 4) baseEquity += 35;
    else if (maxRankCount === 3) baseEquity += Object.values(rankCounts).filter(c => c >= 2).length >= 2 ? 30 : 15;
    else if (maxRankCount === 2) {
      const pairs = Object.values(rankCounts).filter(c => c === 2).length;
      if (pairs >= 2) baseEquity += 10;
      else {
        const pairedRank = parseInt(Object.entries(rankCounts).find(([, c]) => c === 2)?.[0] || '0');
        const boardMax = Math.max(...boardRanks);
        if (pairedRank === boardMax) baseEquity += 6;
        else if (pairedRank > Math.min(...boardRanks)) baseEquity += 3;
        else baseEquity += 1;
      }
    }
    if (boardRanks.length > 0) {
      const boardMax = Math.max(...boardRanks);
      heroRanks.forEach(r => { if (r > boardMax) outs += 3; });
    }
  }

  const rangeAdjustment = (villainRangePercent - 25) * 0.3;
  baseEquity += rangeAdjustment;
  const equity = Math.max(5, Math.min(95, baseEquity));
  const tie = Math.random() * 5 + 2;
  const win = equity - tie / 2;
  const lose = 100 - win - tie;

  return {
    equity: Math.round(equity * 10) / 10,
    win: Math.round(win * 10) / 10,
    tie: Math.round(tie * 10) / 10,
    lose: Math.round(lose * 10) / 10,
    outs,
  };
}

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
  mainWinRate: {
    fontSize: '3.5rem',
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: '8px',
    textShadow: `0 0 20px ${COLORS.primary}40`,
    textAlign: 'center' as const,
    fontFamily: "'SF Mono', monospace",
  },
  subtitle: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  winDetails: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '16px',
    gap: '12px',
  },
  detailBox: {
    backgroundColor: COLORS.bgDark,
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    flex: 1,
  },
  detailValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  detailLabel: {
    fontSize: '11px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  strategyScores: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  scoreBox: {
    backgroundColor: COLORS.bgDark,
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center' as const,
    flex: 1,
    minWidth: '55px',
  },
  scoreValue: {
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  scoreLabel: {
    fontSize: '9px',
    color: COLORS.textMuted,
    marginTop: '3px',
  },
  sliderContainer: {
    marginTop: '16px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '11px',
  },
  sliderTrack: {
    height: '8px',
    background: `linear-gradient(to right, ${COLORS.danger}, ${COLORS.warning}, ${COLORS.success})`,
    borderRadius: '4px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    height: '100%',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRight: '2px solid #fff',
    boxShadow: '0 0 6px rgba(255, 255, 255, 0.5)',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: COLORS.textMuted,
    marginTop: '6px',
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

export function EquityCalculator({ heroHand, board, villainRangePercent = 25 }: EquityCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const calculation = useMemo(() => {
    if (!heroHand) return null;
    return estimateEquity(heroHand, board, villainRangePercent);
  }, [heroHand, board, villainRangePercent]);

  if (!heroHand) {
    return (
      <div style={styles.emptyCard}>
        <div style={styles.cardTitle}>
          <span style={styles.cardTitleIcon}>📊</span>
          <h3 style={styles.cardTitleText}>整体胜率分析</h3>
        </div>
        <div style={styles.emptyContent}>
          <span>选择手牌后显示胜率</span>
        </div>
      </div>
    );
  }

  if (!calculation) return null;

  const { equity, win, tie, lose, outs } = calculation;
  const potOdds = [
    { label: '1/3', sublabel: '小注', need: 25 },
    { label: '1/2', sublabel: '半池', need: 33 },
    { label: '2/3', sublabel: '2/3池', need: 40 },
    { label: 'Pot', sublabel: '满池', need: 50 },
  ];

  return (
    <div style={styles.card}>
      {/* Card Title */}
      <div
        style={{ ...styles.cardTitle, cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.cardTitleIcon}>📊</span>
        <h3 style={{ ...styles.cardTitleText, flex: 1 }}>整体胜率分析</h3>
        <span style={{
          color: COLORS.textMuted,
          fontSize: '10px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </div>

      {isExpanded && (
        <div>
          {/* Main Win Rate */}
          <div style={styles.mainWinRate}>{equity}%</div>
          <p style={styles.subtitle}>综合胜率（赢+平）</p>

          {/* Win Details */}
          <div style={styles.winDetails}>
            <div style={{ ...styles.detailBox, borderLeft: `3px solid ${COLORS.success}` }}>
              <div style={{ ...styles.detailValue, color: COLORS.success }}>{win}%</div>
              <div style={styles.detailLabel}>赢</div>
            </div>
            <div style={{ ...styles.detailBox, borderLeft: `3px solid ${COLORS.warning}` }}>
              <div style={{ ...styles.detailValue, color: COLORS.warning }}>{tie}%</div>
              <div style={styles.detailLabel}>平</div>
            </div>
            <div style={{ ...styles.detailBox, borderLeft: `3px solid ${COLORS.danger}` }}>
              <div style={{ ...styles.detailValue, color: COLORS.danger }}>{lose}%</div>
              <div style={styles.detailLabel}>输</div>
            </div>
          </div>

          {/* Strategy Scores */}
          <div style={{ marginTop: '20px' }}>
            <div style={styles.sectionTitle}>
              <span>⭐</span>
              <span>底池赔率策略</span>
            </div>
            <div style={styles.strategyScores}>
              {potOdds.map(po => {
                const canCall = equity >= po.need;
                return (
                  <div key={po.label} style={styles.scoreBox}>
                    <div style={{
                      ...styles.scoreValue,
                      color: canCall ? COLORS.success : COLORS.danger
                    }}>
                      {po.label}{canCall ? '√' : '✗'}
                    </div>
                    <div style={styles.scoreLabel}>{po.sublabel}</div>
                  </div>
                );
              })}
              {outs > 0 && (
                <div style={{ ...styles.scoreBox, background: `${COLORS.secondary}20`, border: `1px solid ${COLORS.secondary}40` }}>
                  <div style={{ ...styles.scoreValue, color: COLORS.secondary }}>{outs}</div>
                  <div style={styles.scoreLabel}>补牌</div>
                </div>
              )}
            </div>
          </div>

          {/* Opponent Range Slider */}
          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={{ color: COLORS.textSecondary }}>对手范围</span>
              <span style={{ color: COLORS.primary, fontWeight: 700, fontFamily: "'SF Mono', monospace" }}>
                {villainRangePercent}%
              </span>
            </div>
            <div style={styles.sliderTrack}>
              <div style={{ ...styles.sliderFill, width: `${villainRangePercent}%` }} />
            </div>
            <div style={styles.sliderLabels}>
              <span style={{ color: COLORS.danger }}>紧 10%</span>
              <span style={{ color: COLORS.warning }}>标准</span>
              <span style={{ color: COLORS.success }}>松 50%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
