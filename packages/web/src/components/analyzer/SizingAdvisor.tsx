'use client';

import { useState, useMemo, useEffect, CSSProperties } from 'react';
import type { Card as CardType, Street } from '@gto/core';
import { analyzeBoardTexture } from '@gto/core';

// 项目统一色系
const COLORS = {
  primary: '#00f5d4',      // 主色 - 青色
  secondary: '#9b5de5',    // 次色 - 紫色
  accent: '#f15bb5',       // 强调色 - 粉色
  success: '#06d6a0',      // 成功 - 绿青色
  warning: '#ffd166',      // 警告 - 黄色
  info: '#118ab2',         // 信息 - 蓝色
  danger: '#ef4444',       // 危险 - 红色
  bgDark: '#0a0a0f',       // 深背景
  bgCard: '#12121a',       // 卡片背景
  bgSurface: '#1a1a24',    // 表面背景
  bgOption: '#2a3c5a',     // 选项背景
  border: '#2a3a5a',       // 边框
  textPrimary: '#e0e1dd',  // 主文本
  textSecondary: '#adb5bd', // 次文本
  textMuted: '#6b7280',    // 弱化文本
};

interface SizingAdvisorProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  street: Street;
  position: 'IP' | 'OOP' | null;
  potSize?: number;
  effectiveStack?: number;
}

interface SizingRecommendation {
  size: number;
  label: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  frequency: number;
}

interface SizingAdvice {
  primary: SizingRecommendation;
  alternatives: SizingRecommendation[];
  spr: number;
  situation: string;
  tags: string[];
}

function analyzeSizing(
  heroHand: [CardType, CardType],
  board: CardType[],
  street: Street,
  position: 'IP' | 'OOP',
  potSize: number,
  effectiveStack: number
): SizingAdvice {
  const rankOrder = '23456789TJQKA';
  const heroRanks = heroHand.map(c => rankOrder.indexOf(c.rank));
  const heroSuits = heroHand.map(c => c.suit);

  let primary: SizingRecommendation;
  let alternatives: SizingRecommendation[] = [];
  let situation = '';
  let tags: string[] = [];

  const spr = effectiveStack / potSize;

  // Board texture analysis
  let boardTexture = 'neutral';
  let isWet = false;
  let isDry = false;

  if (board.length >= 3) {
    const texture = analyzeBoardTexture(board);
    boardTexture = texture;
    isWet = texture === 'wet' || texture === 'connected';
    isDry = texture === 'dry';

    if (isDry) tags.push('干燥面');
    if (isWet) tags.push('湿润面');
  }

  // Hero hand strength
  let handStrength = 'medium';
  let hasDraws = false;

  if (board.length >= 3) {
    const boardRanks = board.map(c => rankOrder.indexOf(c.rank));
    const boardSuits = board.map(c => c.suit);
    const allRanks = [...boardRanks, ...heroRanks];
    const allSuits = [...boardSuits, ...heroSuits];

    const suitCounts: Record<string, number> = {};
    allSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const maxSuitCount = Math.max(...Object.values(suitCounts));

    if (maxSuitCount >= 5) handStrength = 'monster';
    else if (maxSuitCount === 4) hasDraws = true;

    const uniqueRanks = [...new Set(allRanks)].sort((a, b) => a - b);
    let maxConsec = 1, curConsec = 1;
    for (let i = 1; i < uniqueRanks.length; i++) {
      if (uniqueRanks[i] - uniqueRanks[i - 1] === 1) {
        curConsec++;
        maxConsec = Math.max(maxConsec, curConsec);
      } else curConsec = 1;
    }

    if (maxConsec >= 5) handStrength = 'monster';
    else if (maxConsec === 4) hasDraws = true;

    const rankCounts: Record<number, number> = {};
    allRanks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });
    const maxRankCount = Math.max(...Object.values(rankCounts));

    if (maxRankCount >= 3) handStrength = 'strong';
    else if (maxRankCount === 2) {
      const pairedRank = parseInt(Object.entries(rankCounts).find(([, c]) => c === 2)?.[0] || '0');
      const boardMax = Math.max(...boardRanks);
      if (pairedRank === boardMax) handStrength = 'medium';
      else handStrength = 'weak';
    } else {
      handStrength = 'weak';
    }
  }

  // Generate recommendations
  if (street === 'preflop') {
    const isPair = heroRanks[0] === heroRanks[1];
    const isSuited = heroSuits[0] === heroSuits[1];
    const highCard = Math.max(...heroRanks);

    if (isPair && highCard >= 10) {
      primary = { size: 3, label: '3BB', reason: '高对子标准开牌', confidence: 'high', frequency: 0.8 };
      alternatives = [
        { size: 4, label: '4BB', reason: '面对松散对手加大', confidence: 'medium', frequency: 0.2 },
      ];
      situation = '强起手牌，标准开牌';
      tags = ['强牌', '标准尺寸'];
    } else if (highCard >= 12 && isSuited) {
      primary = { size: 2.5, label: '2.5BB', reason: 'A高同花标准尺寸', confidence: 'high', frequency: 0.7 };
      alternatives = [
        { size: 3, label: '3BB', reason: '按钮位可加大', confidence: 'medium', frequency: 0.3 },
      ];
      situation = '同花大牌，灵活开牌';
      tags = ['同花', '灵活调整'];
    } else {
      primary = { size: 2.5, label: '2.5BB', reason: '标准开牌尺寸', confidence: 'medium', frequency: 0.6 };
      alternatives = [
        { size: 2, label: '2BB', reason: '后位小尺寸开牌', confidence: 'medium', frequency: 0.3 },
        { size: 3, label: '3BB', reason: '前位强势开牌', confidence: 'low', frequency: 0.1 },
      ];
      situation = '边缘牌，根据位置调整';
      tags = ['边缘牌', '位置调整'];
    }
  } else {
    if (handStrength === 'monster') {
      if (isWet) {
        primary = { size: 100, label: '100%', reason: '湿润面大注建立底池', confidence: 'high', frequency: 0.6 };
        alternatives = [
          { size: 75, label: '75%', reason: '稍小诱导跟注', confidence: 'medium', frequency: 0.3 },
          { size: 150, label: '150%', reason: '超池施压听牌', confidence: 'low', frequency: 0.1 },
        ];
        situation = '坚果牌湿润面，价值下注';
        tags.push('价值下注', '大注');
      } else {
        primary = { size: 66, label: '66%', reason: '干燥面诱导跟注', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 33, label: '33%', reason: '小注诱导加注', confidence: 'medium', frequency: 0.3 },
          { size: 100, label: '100%', reason: '跟注站大注取值', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '坚果牌干燥面，诱导跟注';
        tags.push('价值下注', '诱导');
      }
    } else if (handStrength === 'strong') {
      if (isWet) {
        primary = { size: 75, label: '75%', reason: '强牌保护拒绝听牌', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 66, label: '66%', reason: '平衡范围', confidence: 'medium', frequency: 0.3 },
          { size: 100, label: '100%', reason: '极湿面加大', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '强牌湿润面，保护价值';
        tags.push('保护', '拒绝听牌');
      } else {
        primary = { size: 50, label: '50%', reason: '干燥面中等尺寸', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 33, label: '33%', reason: '小注保持范围宽度', confidence: 'medium', frequency: 0.3 },
          { size: 66, label: '66%', reason: '面对弱对手加大', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '强牌干燥面，效率下注';
        tags.push('效率下注', '中等尺寸');
      }
    } else if (handStrength === 'medium' || hasDraws) {
      if (hasDraws && isWet) {
        primary = { size: 66, label: '66%', reason: '半诈唬构建底池', confidence: 'medium', frequency: 0.4 };
        alternatives = [
          { size: 50, label: '50%', reason: '保守半诈唬', confidence: 'medium', frequency: 0.3 },
          { size: 0, label: '过牌', reason: '控池等补牌', confidence: 'medium', frequency: 0.3 },
        ];
        situation = '听牌湿润面，半诈唬或控池';
        tags.push('半诈唬', '听牌');
      } else {
        primary = { size: 33, label: '33%', reason: '中等牌力小注探测', confidence: 'medium', frequency: 0.4 };
        alternatives = [
          { size: 0, label: '过牌', reason: '控制底池', confidence: 'high', frequency: 0.4 },
          { size: 50, label: '50%', reason: '有位置时稍大', confidence: 'low', frequency: 0.2 },
        ];
        situation = '中等牌力，控制底池';
        tags.push('控池', '小注');
      }
    } else {
      if (position === 'IP') {
        primary = { size: 0, label: '过牌', reason: '弱牌有位置过牌控池', confidence: 'high', frequency: 0.6 };
        alternatives = [
          { size: 33, label: '33%', reason: '选择性诈唬', confidence: 'low', frequency: 0.2 },
          { size: 50, label: '50%', reason: '弃牌权益下注', confidence: 'low', frequency: 0.2 },
        ];
        situation = '弱牌有位置，过牌为主';
        tags.push('控池', '过牌');
      } else {
        primary = { size: 0, label: '过牌', reason: '弱牌无位置过牌', confidence: 'high', frequency: 0.7 };
        alternatives = [
          { size: 33, label: '33%', reason: '阻挡下注', confidence: 'medium', frequency: 0.2 },
          { size: 66, label: '66%', reason: '强势诈唬', confidence: 'low', frequency: 0.1 },
        ];
        situation = '弱牌无位置，过牌为主';
        tags.push('控池', '过牌');
      }
    }

    // SPR adjustments
    if (spr < 3) {
      tags.push('低SPR');
      if (handStrength !== 'weak') {
        alternatives.push({ size: 200, label: '全下', reason: 'SPR很低直接全下', confidence: 'medium', frequency: 0.3 });
      }
    } else if (spr >= 8) {
      tags.push('高SPR');
    }
  }

  // Add灵活调整 tag for high SPR
  if (spr >= 8) {
    tags.push('灵活调整');
  }

  return {
    primary: primary!,
    alternatives,
    spr,
    situation,
    tags,
  };
}

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  headerTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: COLORS.warning,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    fontSize: '1.1rem',
  },
  sprDisplay: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    borderRadius: '8px',
    padding: '6px 12px',
  },
  sprLabel: {
    fontSize: '0.8rem',
    color: COLORS.textSecondary,
    marginRight: '5px',
  },
  sprValue: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: COLORS.success,
    fontFamily: "'SF Mono', monospace",
  },
  mainRecommendation: {
    backgroundColor: `rgba(255, 209, 102, 0.1)`,
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    borderLeft: `4px solid ${COLORS.warning}`,
  },
  recommendationTitle: {
    fontSize: '0.9rem',
    color: COLORS.textSecondary,
    marginBottom: '5px',
  },
  recommendationContent: {
    fontSize: '1rem',
    lineHeight: 1.4,
    color: COLORS.textPrimary,
  },
  highlight: {
    color: COLORS.warning,
    fontWeight: 600,
  },
  bettingOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '18px',
  },
  betOption: {
    backgroundColor: COLORS.bgOption,
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  betSize: {
    fontSize: '1.4rem',
    fontWeight: 800,
    marginBottom: '5px',
    fontFamily: "'SF Mono', monospace",
  },
  betFrequency: {
    fontSize: '0.75rem',
    color: COLORS.textSecondary,
    backgroundColor: '#415a77',
    padding: '2px 6px',
    borderRadius: '10px',
    display: 'inline-block',
  },
  betDescription: {
    fontSize: '0.7rem',
    color: COLORS.textSecondary,
    marginTop: '4px',
    lineHeight: 1.2,
    minHeight: '32px',
  },
  footer: {
    backgroundColor: `rgba(157, 78, 221, 0.1)`,
    borderRadius: '8px',
    padding: '12px',
    borderLeft: `4px solid ${COLORS.secondary}`,
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  footerTitle: {
    fontSize: '0.8rem',
    color: COLORS.secondary,
    fontWeight: 600,
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  chipIcon: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: COLORS.warning,
    borderRadius: '50%',
    margin: '0 4px',
    verticalAlign: 'middle',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginTop: '12px',
  },
  tag: {
    fontSize: '0.7rem',
    backgroundColor: `rgba(255, 209, 102, 0.15)`,
    color: COLORS.warning,
    padding: '3px 8px',
    borderRadius: '4px',
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

export function SizingAdvisor({
  heroHand,
  board,
  street,
  position,
  potSize = 10,
  effectiveStack = 100,
}: SizingAdvisorProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [animatedSPR, setAnimatedSPR] = useState(0);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const advice = useMemo(() => {
    if (!heroHand || !position) return null;
    return analyzeSizing(heroHand, board, street, position, potSize, effectiveStack);
  }, [heroHand, board, street, position, potSize, effectiveStack]);

  // SPR animation
  useEffect(() => {
    if (!advice) return;

    const targetSPR = advice.spr;
    let current = 0;
    const increment = targetSPR / 20;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetSPR) {
        setAnimatedSPR(targetSPR);
        clearInterval(timer);
      } else {
        setAnimatedSPR(current);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [advice]);

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
    setTimeout(() => setSelectedOption(null), 1500);
  };

  if (!heroHand) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div style={styles.emptyTitle}>下注建议</div>
        <div style={styles.emptyHint}>选择手牌后显示下注建议</div>
      </div>
    );
  }

  if (!advice) return null;

  const { primary, alternatives, spr, situation, tags } = advice;

  // Combine primary and alternatives for display
  const allOptions = [primary, ...alternatives.slice(0, 2)];

  const getOptionStyle = (index: number, opt: SizingRecommendation): CSSProperties => {
    const isHovered = hoveredOption === index;
    const isSelected = selectedOption === index;

    let borderColor = COLORS.border;
    let sizeColor = COLORS.textPrimary;

    if (index === 0) {
      borderColor = COLORS.success;
      sizeColor = COLORS.success;
    } else if (index === 1) {
      borderColor = COLORS.info;
      sizeColor = COLORS.info;
    } else {
      borderColor = COLORS.warning;
      sizeColor = COLORS.warning;
    }

    return {
      ...styles.betOption,
      border: `${index === 0 ? '2px' : '1px'} solid ${borderColor}`,
      transform: isHovered ? 'translateY(-2px)' : 'none',
      boxShadow: isSelected
        ? `0 0 0 2px rgba(255, 209, 102, 0.5)`
        : isHovered
          ? `0 4px 12px rgba(0, 0, 0, 0.3)`
          : 'none',
    };
  };

  const getSizeColor = (index: number): string => {
    if (index === 0) return COLORS.success;
    if (index === 1) return COLORS.info;
    return COLORS.warning;
  };

  const getInsightText = (): string => {
    if (spr < 3) return '低SPR时简化决策，倾向于大注或全下。';
    if (spr < 6) return '中等SPR时保持范围平衡，多使用中等尺寸。';
    return '高SPR时有更多空间操作，可以灵活调整尺寸。';
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={styles.headerIcon}>📊</span>
          下注建议
        </div>
        <div style={styles.sprDisplay}>
          <span style={styles.sprLabel}>SPR:</span>
          <span style={styles.sprValue}>{animatedSPR.toFixed(1)}</span>
        </div>
      </div>

      {/* Main Recommendation */}
      <div style={styles.mainRecommendation}>
        <div style={styles.recommendationTitle}>策略分析</div>
        <div style={styles.recommendationContent}>
          <span style={styles.highlight}>{situation.split('，')[0]}</span>
          {situation.includes('，') && `。${situation.split('，').slice(1).join('，')}`}
          {!situation.includes('，') && '。'}推荐尺寸高置信。
        </div>
      </div>

      {/* Betting Options */}
      <div style={styles.bettingOptions}>
        {allOptions.map((opt, i) => (
          <div
            key={i}
            style={getOptionStyle(i, opt)}
            onClick={() => handleOptionClick(i)}
            onMouseEnter={() => setHoveredOption(i)}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div style={{ ...styles.betSize, color: getSizeColor(i) }}>
              {opt.label}
            </div>
            <div style={styles.betFrequency}>
              {Math.round(opt.frequency * 100)}% 频率
            </div>
            <div style={styles.betDescription}>
              {opt.size > 0 && opt.size <= 100
                ? `≈${Math.round(potSize * opt.size / 100)} BB，${opt.reason}`
                : opt.reason}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with Insight */}
      <div style={styles.footer}>
        <div style={styles.footerTitle}>
          <span>💡</span>
          策略洞察
        </div>
        <div style={styles.footerText}>
          {getInsightText()}
          <span style={styles.chipIcon} />
        </div>

        {/* Tags */}
        <div style={styles.tags}>
          {tags.map((tag, i) => (
            <span key={i} style={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
