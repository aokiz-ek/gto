'use client';

import { useMemo, CSSProperties } from 'react';
import type { Card as CardType } from '@gto/core';
import { analyzeBoardTexture } from '@gto/core';
import type { BoardTexture } from '@gto/core';

// Color system
const COLORS = {
  primary: '#00f5d4',
  secondary: '#9b5de5',
  success: '#06d6a0',
  warning: '#ffd166',
  danger: '#ef4444',
  info: '#118ab2',
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a24',
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#555555',
  border: 'rgba(255, 255, 255, 0.08)',
};

// Chinese translations for board textures
const TEXTURE_LABELS: Record<BoardTexture, string> = {
  dry: '干燥',
  wet: '湿润',
  monotone: '单色',
  paired: '对子',
  connected: '连接',
  high: '高牌',
  low: '低牌',
  ace_high: 'A高',
};

interface BoardTexturePanelProps {
  board: CardType[];
  heroHand: [CardType, CardType] | null;
  street: 'preflop' | 'flop' | 'turn' | 'river';
}

export function BoardTexturePanel({ board, heroHand, street }: BoardTexturePanelProps) {
  // Comprehensive board and hand analysis
  const analysis = useMemo(() => {
    if (street === 'preflop' || board.length < 3) {
      return null;
    }

    const rankOrder = '23456789TJQKA';
    const boardRanks = board.map(c => rankOrder.indexOf(c.rank));
    const boardSuits = board.map(c => c.suit);

    // Board texture analysis
    const primaryTexture = analyzeBoardTexture(board);

    // Suit analysis
    const suitCounts: Record<string, number> = {};
    boardSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    const dominantSuit = Object.entries(suitCounts).find(([, count]) => count === maxSuitCount)?.[0] || '';

    const isMonotone = maxSuitCount >= 3;
    const isTwoTone = maxSuitCount === 2 && Object.keys(suitCounts).length === 2;
    const isRainbow = Object.keys(suitCounts).length >= 3;
    const isFourFlush = maxSuitCount >= 4;

    // Connectivity analysis
    const sortedRanks = [...boardRanks].sort((a, b) => a - b);
    const spread = sortedRanks[sortedRanks.length - 1] - sortedRanks[0];
    const isConnected = spread <= 4;
    const hasGutshot = spread <= 5;

    // Pairing analysis
    const rankCounts: Record<number, number> = {};
    boardRanks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });
    const isPaired = Object.values(rankCounts).some(c => c >= 2);
    const isTrips = Object.values(rankCounts).some(c => c >= 3);
    const pairedRank = Object.entries(rankCounts).find(([, c]) => c >= 2)?.[0];

    // High card analysis
    const highCard = Math.max(...boardRanks);
    const hasAce = boardRanks.includes(12);
    const hasKing = boardRanks.includes(11);
    const hasBroadway = boardRanks.some(r => r >= 9);
    const isLowBoard = highCard <= 7;

    // Calculate draw possibilities
    const flushDrawPossible = maxSuitCount >= 2;
    const straightDrawPossible = hasGutshot;

    // Hero hand interaction with board
    let heroAnalysis = null;
    if (heroHand) {
      const heroRanks = heroHand.map(c => rankOrder.indexOf(c.rank));
      const heroSuits = heroHand.map(c => c.suit);
      const allRanks = [...boardRanks, ...heroRanks];
      const allSuits = [...boardSuits, ...heroSuits];

      // Check for made hands
      const allRankCounts: Record<number, number> = {};
      allRanks.forEach(r => { allRankCounts[r] = (allRankCounts[r] || 0) + 1; });

      const hasPair = Object.values(allRankCounts).some(c => c >= 2);
      const hasTwoPair = Object.values(allRankCounts).filter(c => c >= 2).length >= 2;
      const hasTrips = Object.values(allRankCounts).some(c => c >= 3);
      const hasFullHouse = hasTrips && Object.values(allRankCounts).filter(c => c >= 2).length >= 2;
      const hasQuads = Object.values(allRankCounts).some(c => c >= 4);

      // Check top pair, overpair
      const heroHighCard = Math.max(...heroRanks);
      const heroLowCard = Math.min(...heroRanks);
      const boardHighCard = Math.max(...boardRanks);
      const hasOverpair = heroRanks[0] === heroRanks[1] && heroRanks[0] > boardHighCard;
      const hasTopPair = boardRanks.includes(heroHighCard) && heroHighCard === boardHighCard;
      const hasMiddlePair = boardRanks.includes(heroHighCard) && heroHighCard < boardHighCard;
      const hasBottomPair = boardRanks.includes(heroLowCard) && heroLowCard === Math.min(...boardRanks);

      // Check for flush draws
      const heroSuitCounts: Record<string, number> = {};
      allSuits.forEach(s => { heroSuitCounts[s] = (heroSuitCounts[s] || 0) + 1; });
      const hasFlushDraw = Object.values(heroSuitCounts).some(c => c === 4);
      const hasFlush = Object.values(heroSuitCounts).some(c => c >= 5);
      const flushDrawSuit = Object.entries(heroSuitCounts).find(([, c]) => c === 4)?.[0];

      // Check for straight draws (simplified)
      const sortedAll = [...new Set(allRanks)].sort((a, b) => a - b);
      let maxConsecutive = 1;
      let current = 1;
      for (let i = 1; i < sortedAll.length; i++) {
        if (sortedAll[i] - sortedAll[i-1] === 1) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else if (sortedAll[i] - sortedAll[i-1] > 1) {
          current = 1;
        }
      }
      const hasStraight = maxConsecutive >= 5;
      const hasOESD = maxConsecutive === 4;
      const hasGutShotDraw = maxConsecutive === 3 && sortedAll.some((r, i) => i < sortedAll.length - 1 && sortedAll[i+1] - r === 2);

      // Determine hand strength
      let handStrength = '';
      let strengthLevel = 0; // 0-100
      let handCategory: 'strong' | 'medium' | 'draw' | 'weak' = 'weak';

      if (hasQuads) { handStrength = '四条'; strengthLevel = 95; handCategory = 'strong'; }
      else if (hasFullHouse) { handStrength = '葫芦'; strengthLevel = 90; handCategory = 'strong'; }
      else if (hasFlush) { handStrength = '同花'; strengthLevel = 85; handCategory = 'strong'; }
      else if (hasStraight) { handStrength = '顺子'; strengthLevel = 80; handCategory = 'strong'; }
      else if (hasTrips) { handStrength = '三条'; strengthLevel = 70; handCategory = 'strong'; }
      else if (hasTwoPair) { handStrength = '两对'; strengthLevel = 60; handCategory = 'medium'; }
      else if (hasOverpair) { handStrength = '超对'; strengthLevel = 55; handCategory = 'medium'; }
      else if (hasTopPair) { handStrength = '顶对'; strengthLevel = 50; handCategory = 'medium'; }
      else if (hasMiddlePair) { handStrength = '中对'; strengthLevel = 35; handCategory = 'medium'; }
      else if (hasBottomPair) { handStrength = '底对'; strengthLevel = 25; handCategory = 'weak'; }
      else if (hasPair) { handStrength = '一对'; strengthLevel = 30; handCategory = 'medium'; }
      else { handStrength = '高牌'; strengthLevel = 15; handCategory = 'weak'; }

      // Add draw info
      let drawInfo = '';
      if (hasFlushDraw && hasOESD) { drawInfo = '同花顺听牌'; strengthLevel += 25; handCategory = 'draw'; }
      else if (hasFlushDraw) { drawInfo = '同花听牌'; strengthLevel += 15; handCategory = 'draw'; }
      else if (hasOESD) { drawInfo = '两头顺听'; strengthLevel += 12; handCategory = 'draw'; }
      else if (hasGutShotDraw) { drawInfo = '卡顺听牌'; strengthLevel += 6; }

      // Generate tags based on hand strength
      const tags: string[] = [];
      if (strengthLevel >= 70) {
        tags.push('强成手牌');
        if (hasFullHouse || hasQuads || hasFlush || hasStraight) tags.push('坚果优势');
        tags.push('价值下注');
      } else if (strengthLevel >= 50) {
        tags.push('中等成牌');
        if (drawInfo) tags.push('攻守兼备');
        else tags.push('保护下注');
      } else if (drawInfo) {
        tags.push('强听牌');
        tags.push('半诈唬');
        tags.push('有潜力');
      } else if (strengthLevel >= 30) {
        tags.push('边缘牌');
        tags.push('过牌优先');
      } else {
        tags.push('弱牌');
        tags.push('放弃价值');
      }

      heroAnalysis = {
        handStrength,
        strengthLevel: Math.min(strengthLevel, 100),
        handCategory,
        drawInfo,
        tags,
        hasFlush,
        hasFlushDraw,
        flushDrawSuit,
        hasStraight,
        hasOESD,
        hasGutShotDraw,
        hasOverpair,
        hasTopPair,
        hasMiddlePair,
        hasBottomPair,
      };
    }

    // Generate dynamic recommendation based on board and hero hand
    let recommendation = '';
    let recommendedSizing = '';
    let sizingReason = '';

    if (heroAnalysis) {
      if (heroAnalysis.strengthLevel >= 70) {
        recommendation = '价值下注，建立底池';
        recommendedSizing = '66-100%';
        sizingReason = '强牌时要最大化价值';
      } else if (heroAnalysis.strengthLevel >= 50) {
        if (isMonotone || isConnected) {
          recommendation = '中等注保护，防止听牌';
          recommendedSizing = '50-75%';
          sizingReason = '湿润面需要保护成牌';
        } else {
          recommendation = '小注获取价值';
          recommendedSizing = '33-50%';
          sizingReason = '干燥面小注更有效';
        }
      } else if (heroAnalysis.drawInfo) {
        recommendation = '半诈唬或过牌';
        recommendedSizing = '50-66%';
        sizingReason = '有听牌时可以半诈唬';
      } else {
        recommendation = '过牌或弃牌';
        recommendedSizing = '0%';
        sizingReason = '弱牌避免扩大底池';
      }
    } else {
      // Default board-based recommendation
      if (isMonotone || isFourFlush) {
        recommendedSizing = '50-75%';
        sizingReason = '同花面需要中大注保护';
      } else if (primaryTexture === 'wet' || isConnected) {
        recommendedSizing = '66-100%';
        sizingReason = '湿润/连接面需要大注';
      } else if (isPaired) {
        recommendedSizing = '33-50%';
        sizingReason = '对子面可以混合下注尺寸';
      } else {
        recommendedSizing = '33%';
        sizingReason = '干燥牌面，小注有效';
      }
    }

    // Generate board analysis points
    const analysisPoints: { text: string; type: 'positive' | 'negative' | 'neutral' }[] = [];

    if (isMonotone) {
      analysisPoints.push({ text: '单一花色，同花可能性高', type: 'negative' });
      analysisPoints.push({ text: '无同花需谨慎', type: 'neutral' });
    } else if (isTwoTone) {
      analysisPoints.push({ text: '双色牌面，可能存在听牌', type: 'neutral' });
    } else {
      analysisPoints.push({ text: '彩虹牌面，同花威胁低', type: 'positive' });
    }

    if (isConnected) {
      analysisPoints.push({ text: '牌面连接紧密，顺子可能性高', type: 'negative' });
    } else if (hasGutshot) {
      analysisPoints.push({ text: '存在卡顺听牌可能', type: 'neutral' });
    } else {
      analysisPoints.push({ text: '牌面分散，顺子威胁低', type: 'positive' });
    }

    if (isPaired) {
      analysisPoints.push({ text: `牌面有对子${pairedRank ? rankOrder[parseInt(pairedRank)] : ''}，葫芦/四条可能`, type: 'neutral' });
    }

    if (hasAce) {
      analysisPoints.push({ text: 'A高牌面，顶对范围窄', type: 'positive' });
    } else if (hasBroadway) {
      analysisPoints.push({ text: '高牌面，高牌强度增加', type: 'neutral' });
    } else if (isLowBoard) {
      analysisPoints.push({ text: '低牌面，超对价值高', type: 'positive' });
    }

    return {
      primaryTexture,
      board: {
        isMonotone,
        isTwoTone,
        isRainbow,
        isFourFlush,
        isConnected,
        hasGutshot,
        isPaired,
        isTrips,
        pairedRank: pairedRank ? rankOrder[parseInt(pairedRank)] : null,
        hasAce,
        hasKing,
        hasBroadway,
        isLowBoard,
        highCard: rankOrder[highCard],
        dominantSuit,
        flushDrawPossible,
        straightDrawPossible,
      },
      heroAnalysis,
      recommendation,
      recommendedSizing,
      sizingReason,
      analysisPoints,
    };
  }, [board, heroHand, street]);

  // Styles
  const containerStyle: CSSProperties = {
    background: 'linear-gradient(180deg, #14141e 0%, #12121a 100%)',
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${COLORS.border}`,
  };

  const emptyContainerStyle: CSSProperties = {
    ...containerStyle,
    textAlign: 'center',
    padding: '24px 16px',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  };

  const headerIconStyle: CSSProperties = {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.info,
    fontSize: '14px',
  };

  const headerTitleStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.info,
  };

  const subHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px',
    paddingLeft: '4px',
  };

  const subHeaderIconStyle: CSSProperties = {
    fontSize: '12px',
    color: COLORS.textSecondary,
  };

  const subHeaderTextStyle: CSSProperties = {
    fontSize: '12px',
    color: COLORS.textSecondary,
  };

  const analysisListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  };

  const analysisItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: COLORS.textSecondary,
  };

  const getIconStyle = (type: 'positive' | 'negative' | 'neutral'): CSSProperties => ({
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: type === 'positive' ? COLORS.success : type === 'negative' ? COLORS.danger : COLORS.textMuted,
  });

  const dividerStyle: CSSProperties = {
    height: '1px',
    background: COLORS.border,
    margin: '16px 0',
  };

  const handStrengthSectionStyle: CSSProperties = {
    marginBottom: '12px',
  };

  const handStrengthHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    color: COLORS.textPrimary,
    fontSize: '14px',
    fontWeight: 600,
  };

  const handStrengthBoxStyle: CSSProperties = {
    background: 'rgba(255, 209, 102, 0.08)',
    borderLeft: `3px solid ${COLORS.warning}`,
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  };

  const handStrengthRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  };

  const handStrengthLabelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: COLORS.textSecondary,
  };

  const handStrengthBadgeStyle: CSSProperties = {
    background: 'rgba(255, 209, 102, 0.2)',
    color: COLORS.warning,
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
  };

  const tagsContainerStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  };

  const tagStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.06)',
    color: COLORS.textSecondary,
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  };

  const recommendationBoxStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(6, 214, 160, 0.08)',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '10px',
  };

  const recommendationIconStyle: CSSProperties = {
    color: COLORS.success,
    fontSize: '14px',
  };

  const recommendationTextStyle: CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.success,
  };

  const descriptionStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12px',
    color: COLORS.textMuted,
    lineHeight: 1.5,
    paddingLeft: '4px',
  };

  const descriptionIconStyle: CSSProperties = {
    color: COLORS.warning,
    fontSize: '12px',
    marginTop: '2px',
    flexShrink: 0,
  };

  const emptyTextStyle: CSSProperties = {
    fontSize: '12px',
    color: COLORS.textMuted,
    padding: '12px 0',
  };

  if (!analysis) {
    return (
      <div style={emptyContainerStyle}>
        <div style={headerStyle}>
          <span style={headerIconStyle}>📊</span>
          <span style={{ ...headerTitleStyle, color: COLORS.textPrimary }}>牌面分析</span>
        </div>
        <div style={emptyTextStyle}>选择公共牌后显示动态分析</div>
      </div>
    );
  }

  const { primaryTexture, heroAnalysis, recommendation, recommendedSizing, sizingReason, analysisPoints } = analysis;

  // Determine texture display name
  const textureLabel = TEXTURE_LABELS[primaryTexture];
  const suitLabel = analysis.board.isMonotone ? '花色单色' : analysis.board.isTwoTone ? '花色双色' : '花色彩虹';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={headerIconStyle}>🎨</span>
        <span style={headerTitleStyle}>{textureLabel}分析</span>
      </div>

      {/* Suit subheader */}
      <div style={subHeaderStyle}>
        <span style={subHeaderIconStyle}>🎭</span>
        <span style={subHeaderTextStyle}>{suitLabel}</span>
      </div>

      {/* Analysis points */}
      <div style={analysisListStyle}>
        {analysisPoints.map((point, index) => (
          <div key={index} style={analysisItemStyle}>
            <span style={getIconStyle(point.type)}>
              {point.type === 'positive' ? '✓' : point.type === 'negative' ? '✗' : '○'}
            </span>
            <span>{point.text}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={dividerStyle} />

      {/* Hero hand analysis */}
      {heroAnalysis && (
        <div style={handStrengthSectionStyle}>
          <div style={handStrengthHeaderStyle}>
            <span>👑</span>
            <span>你的牌力</span>
          </div>

          <div style={handStrengthBoxStyle}>
            <div style={handStrengthRowStyle}>
              <span style={handStrengthLabelStyle}>
                <span>🃏</span>
                <span>牌力分析:</span>
              </span>
              <span style={handStrengthBadgeStyle}>{heroAnalysis.handStrength}</span>
            </div>

            <div style={tagsContainerStyle}>
              {heroAnalysis.tags.map((tag, index) => (
                <span key={index} style={tagStyle}>{tag}</span>
              ))}
              {heroAnalysis.drawInfo && (
                <span style={{ ...tagStyle, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  {heroAnalysis.drawInfo}
                </span>
              )}
            </div>
          </div>

          {/* Recommendation */}
          {recommendedSizing && recommendedSizing !== '0%' && (
            <div style={recommendationBoxStyle}>
              <span style={recommendationIconStyle}>📊</span>
              <span style={recommendationTextStyle}>建议{recommendedSizing}底池</span>
            </div>
          )}

          {/* Description */}
          <div style={descriptionStyle}>
            <span style={descriptionIconStyle}>💡</span>
            <span>{recommendation || sizingReason}</span>
          </div>
        </div>
      )}

      {/* Board-only recommendation when no hero hand */}
      {!heroAnalysis && (
        <div>
          <div style={handStrengthHeaderStyle}>
            <span>💡</span>
            <span>下注建议</span>
          </div>

          {recommendedSizing && (
            <div style={recommendationBoxStyle}>
              <span style={recommendationIconStyle}>📊</span>
              <span style={recommendationTextStyle}>建议{recommendedSizing}底池</span>
            </div>
          )}

          <div style={descriptionStyle}>
            <span style={descriptionIconStyle}>🎯</span>
            <span>{sizingReason}</span>
          </div>
        </div>
      )}
    </div>
  );
}
