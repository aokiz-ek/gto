'use client';

import { useMemo } from 'react';
import type { Card as CardType } from '@gto/core';
import { analyzeBoardTexture } from '@gto/core';
import type { BoardTexture } from '@gto/core';

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

const TEXTURE_ICONS: Record<BoardTexture, string> = {
  dry: '🏜️',
  wet: '💧',
  monotone: '🎨',
  paired: '👯',
  connected: '🔗',
  high: '👑',
  low: '🃏',
  ace_high: '🅰️',
};

const TEXTURE_COLORS: Record<BoardTexture, string> = {
  dry: '#22c55e',
  wet: '#f97316',
  monotone: '#ef4444',
  paired: '#8b5cf6',
  connected: '#f59e0b',
  high: '#3b82f6',
  low: '#6b7280',
  ace_high: '#22d3bf',
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

      if (hasQuads) { handStrength = '四条'; strengthLevel = 95; }
      else if (hasFullHouse) { handStrength = '葫芦'; strengthLevel = 90; }
      else if (hasFlush) { handStrength = '同花'; strengthLevel = 85; }
      else if (hasStraight) { handStrength = '顺子'; strengthLevel = 80; }
      else if (hasTrips) { handStrength = '三条'; strengthLevel = 70; }
      else if (hasTwoPair) { handStrength = '两对'; strengthLevel = 60; }
      else if (hasOverpair) { handStrength = '超对'; strengthLevel = 55; }
      else if (hasTopPair) { handStrength = '顶对'; strengthLevel = 50; }
      else if (hasMiddlePair) { handStrength = '中对'; strengthLevel = 35; }
      else if (hasBottomPair) { handStrength = '底对'; strengthLevel = 25; }
      else if (hasPair) { handStrength = '一对'; strengthLevel = 30; }
      else { handStrength = '高牌'; strengthLevel = 15; }

      // Add draw info
      let drawInfo = '';
      if (hasFlushDraw && hasOESD) { drawInfo = '同花顺听牌'; strengthLevel += 25; }
      else if (hasFlushDraw) { drawInfo = '同花听牌'; strengthLevel += 15; }
      else if (hasOESD) { drawInfo = '两头顺听'; strengthLevel += 12; }
      else if (hasGutShotDraw) { drawInfo = '卡顺听牌'; strengthLevel += 6; }

      heroAnalysis = {
        handStrength,
        strengthLevel: Math.min(strengthLevel, 100),
        drawInfo,
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
    };
  }, [board, heroHand, street]);

  if (!analysis) {
    return (
      <div className="texture-panel texture-panel-empty">
        <style jsx>{styles}</style>
        <div className="texture-header">
          <span className="texture-icon">📊</span>
          <span className="texture-title">牌面分析</span>
        </div>
        <div className="texture-empty">选择公共牌后显示动态分析</div>
      </div>
    );
  }

  const { primaryTexture, board: boardInfo, heroAnalysis, recommendation, recommendedSizing, sizingReason } = analysis;
  const color = TEXTURE_COLORS[primaryTexture];

  return (
    <div className="texture-panel">
      <style jsx>{styles}</style>

      {/* Header with texture badge */}
      <div className="texture-header">
        <div className="header-left">
          <span className="texture-icon">{TEXTURE_ICONS[primaryTexture]}</span>
          <span className="texture-title">牌面分析</span>
        </div>
        <div className="texture-badge" style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}>
          {TEXTURE_LABELS[primaryTexture]}
        </div>
      </div>

      {/* Board characteristics */}
      <div className="characteristics">
        <div className="char-row">
          <div className="char-item">
            <span className="char-icon" style={{ color: boardInfo.isMonotone ? '#ef4444' : boardInfo.isTwoTone ? '#f59e0b' : '#22c55e' }}>
              {boardInfo.isMonotone ? '🔴' : boardInfo.isTwoTone ? '🟡' : '🟢'}
            </span>
            <span className="char-label">花色</span>
            <span className="char-value">
              {boardInfo.isMonotone ? '单色' : boardInfo.isTwoTone ? '双色' : '彩虹'}
            </span>
          </div>
          <div className="char-item">
            <span className="char-icon" style={{ color: boardInfo.isConnected ? '#ef4444' : boardInfo.hasGutshot ? '#f59e0b' : '#22c55e' }}>
              {boardInfo.isConnected ? '🔗' : boardInfo.hasGutshot ? '⛓️' : '📍'}
            </span>
            <span className="char-label">连接</span>
            <span className="char-value">
              {boardInfo.isConnected ? '紧密' : boardInfo.hasGutshot ? '有间隔' : '分散'}
            </span>
          </div>
        </div>
        <div className="char-row">
          <div className="char-item">
            <span className="char-icon" style={{ color: boardInfo.isPaired ? '#8b5cf6' : '#666' }}>
              {boardInfo.isPaired ? '👯' : '➖'}
            </span>
            <span className="char-label">对子</span>
            <span className="char-value">
              {boardInfo.isTrips ? `三条${boardInfo.pairedRank}` : boardInfo.isPaired ? `对${boardInfo.pairedRank}` : '无'}
            </span>
          </div>
          <div className="char-item">
            <span className="char-icon" style={{ color: boardInfo.hasAce ? '#22d3bf' : boardInfo.hasBroadway ? '#3b82f6' : '#666' }}>
              {boardInfo.hasAce ? '🅰️' : boardInfo.hasBroadway ? '👑' : '🃏'}
            </span>
            <span className="char-label">高牌</span>
            <span className="char-value">
              {boardInfo.hasAce ? 'A高' : boardInfo.hasBroadway ? boardInfo.highCard + '高' : '低牌面'}
            </span>
          </div>
        </div>
      </div>

      {/* Hero hand analysis - only show if hand selected */}
      {heroAnalysis && (
        <div className="hero-analysis">
          <div className="hero-header">
            <span>你的牌力</span>
            <span className="hero-strength" style={{
              color: heroAnalysis.strengthLevel >= 60 ? '#22c55e' :
                     heroAnalysis.strengthLevel >= 40 ? '#f59e0b' : '#ef4444'
            }}>
              {heroAnalysis.handStrength}
            </span>
          </div>

          {/* Strength bar */}
          <div className="strength-bar-container">
            <div
              className="strength-bar"
              style={{
                width: `${heroAnalysis.strengthLevel}%`,
                background: heroAnalysis.strengthLevel >= 60
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : heroAnalysis.strengthLevel >= 40
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)'
              }}
            />
          </div>

          {/* Draw info */}
          {heroAnalysis.drawInfo && (
            <div className="draw-badge">
              <span className="draw-icon">🎯</span>
              <span>{heroAnalysis.drawInfo}</span>
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      <div className="recommendation">
        <div className="rec-header">
          <span className="rec-label">💡 建议</span>
          {recommendedSizing && recommendedSizing !== '0%' && (
            <span className="rec-sizing">{recommendedSizing} 底池</span>
          )}
        </div>
        <div className="rec-content">
          {recommendation || sizingReason}
        </div>
      </div>
    </div>
  );
}

const styles = `
  .texture-panel {
    background: linear-gradient(180deg, #14141e 0%, #12121a 100%);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .texture-panel-empty {
    text-align: center;
    padding: 20px 14px;
  }

  .texture-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .texture-icon {
    font-size: 16px;
  }

  .texture-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .texture-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid;
    letter-spacing: 0.5px;
  }

  .texture-empty {
    font-size: 12px;
    color: #555;
    padding: 12px 0;
  }

  .characteristics {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .char-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .char-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .char-icon {
    font-size: 12px;
    width: 16px;
    text-align: center;
  }

  .char-label {
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }

  .char-value {
    font-size: 11px;
    font-weight: 600;
    color: #ccc;
    margin-left: auto;
  }

  .hero-analysis {
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 11px;
    color: #888;
  }

  .hero-strength {
    font-size: 14px;
    font-weight: 700;
  }

  .strength-bar-container {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .strength-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .draw-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #f59e0b;
  }

  .draw-icon {
    font-size: 10px;
  }

  .recommendation {
    background: rgba(34, 211, 191, 0.06);
    border: 1px solid rgba(34, 211, 191, 0.12);
    border-radius: 10px;
    padding: 12px;
  }

  .rec-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .rec-label {
    font-size: 11px;
    font-weight: 600;
    color: #22d3bf;
  }

  .rec-sizing {
    font-size: 12px;
    font-weight: 700;
    color: #22d3bf;
    padding: 2px 8px;
    background: rgba(34, 211, 191, 0.15);
    border-radius: 4px;
  }

  .rec-content {
    font-size: 12px;
    color: #aaa;
    line-height: 1.5;
  }
`;
