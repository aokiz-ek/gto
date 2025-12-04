'use client';

import { useMemo } from 'react';
import type { Card as CardType, Street } from '@gto/core';
import { analyzeBoardTexture } from '@gto/core';

interface SizingAdvisorProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  street: Street;
  position: 'IP' | 'OOP' | null; // In Position or Out of Position
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

function analyzeSizing(
  heroHand: [CardType, CardType],
  board: CardType[],
  street: Street,
  position: 'IP' | 'OOP',
  potSize: number,
  effectiveStack: number
): {
  primary: SizingRecommendation;
  alternatives: SizingRecommendation[];
  spr: number;
  situation: string;
} {
  const rankOrder = '23456789TJQKA';
  const heroRanks = heroHand.map(c => rankOrder.indexOf(c.rank));
  const heroSuits = heroHand.map(c => c.suit);

  let primary: SizingRecommendation;
  let alternatives: SizingRecommendation[] = [];
  let situation = '';

  // Calculate SPR
  const spr = effectiveStack / potSize;

  // Board texture analysis
  let boardTexture = 'neutral';
  let isWet = false;
  let isDry = false;
  let isMonotone = false;

  if (board.length >= 3) {
    const texture = analyzeBoardTexture(board);
    boardTexture = texture;
    isWet = texture === 'wet' || texture === 'connected';
    isDry = texture === 'dry';
    isMonotone = texture === 'monotone';
  }

  // Hero hand strength estimation
  let handStrength = 'medium'; // weak, medium, strong, monster
  let hasDraws = false;

  if (board.length >= 3) {
    const boardRanks = board.map(c => rankOrder.indexOf(c.rank));
    const boardSuits = board.map(c => c.suit);
    const allRanks = [...boardRanks, ...heroRanks];
    const allSuits = [...boardSuits, ...heroSuits];

    // Check for flush draw
    const suitCounts: Record<string, number> = {};
    allSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const maxSuitCount = Math.max(...Object.values(suitCounts));

    if (maxSuitCount >= 5) handStrength = 'monster';
    else if (maxSuitCount === 4) hasDraws = true;

    // Check for straights
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

    // Check pairs/sets
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

  // Generate recommendations based on situation
  if (street === 'preflop') {
    // Preflop sizing
    const isPair = heroRanks[0] === heroRanks[1];
    const isSuited = heroSuits[0] === heroSuits[1];
    const highCard = Math.max(...heroRanks);

    if (isPair && highCard >= 10) {
      primary = { size: 3, label: '3BB', reason: '高对子标准开牌尺寸', confidence: 'high', frequency: 0.8 };
      alternatives = [
        { size: 4, label: '4BB', reason: '面对松散对手时可以加大', confidence: 'medium', frequency: 0.2 },
      ];
      situation = '强起手牌，标准开牌';
    } else if (highCard >= 12 && isSuited) {
      primary = { size: 2.5, label: '2.5BB', reason: 'A高同花标准尺寸', confidence: 'high', frequency: 0.7 };
      alternatives = [
        { size: 3, label: '3BB', reason: '按钮位或抢盲时可以加大', confidence: 'medium', frequency: 0.3 },
      ];
      situation = '同花大牌，灵活开牌';
    } else {
      primary = { size: 2.5, label: '2.5BB', reason: '标准开牌尺寸', confidence: 'medium', frequency: 0.6 };
      alternatives = [
        { size: 2, label: '2BB', reason: '后位小尺寸开牌', confidence: 'medium', frequency: 0.3 },
        { size: 3, label: '3BB', reason: '前位强势开牌', confidence: 'low', frequency: 0.1 },
      ];
      situation = '边缘牌，根据位置调整';
    }
  } else {
    // Postflop sizing
    if (handStrength === 'monster') {
      if (isWet) {
        primary = { size: 100, label: '100%', reason: '强牌在湿润面要保护，大注建立底池', confidence: 'high', frequency: 0.6 };
        alternatives = [
          { size: 75, label: '75%', reason: '如果担心被弃牌可以稍小', confidence: 'medium', frequency: 0.3 },
          { size: 150, label: '150%', reason: '超池下注施压听牌', confidence: 'low', frequency: 0.1 },
        ];
        situation = '坚果牌湿润面，价值下注';
      } else {
        primary = { size: 66, label: '66%', reason: '干燥面不需要太大尺寸诱导跟注', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 33, label: '33%', reason: '小注诱导诈唬加注', confidence: 'medium', frequency: 0.3 },
          { size: 100, label: '100%', reason: '面对跟注站大注获取价值', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '坚果牌干燥面，诱导跟注';
      }
    } else if (handStrength === 'strong') {
      if (isWet) {
        primary = { size: 75, label: '75%', reason: '强牌保护，拒绝听牌', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 66, label: '66%', reason: '保持范围平衡', confidence: 'medium', frequency: 0.3 },
          { size: 100, label: '100%', reason: '极湿润面可以更大', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '强牌湿润面，保护价值';
      } else {
        primary = { size: 50, label: '50%', reason: '干燥面中等尺寸即可', confidence: 'high', frequency: 0.5 };
        alternatives = [
          { size: 33, label: '33%', reason: '小注保持范围宽度', confidence: 'medium', frequency: 0.3 },
          { size: 66, label: '66%', reason: '面对弱对手加大', confidence: 'medium', frequency: 0.2 },
        ];
        situation = '强牌干燥面，效率下注';
      }
    } else if (handStrength === 'medium' || hasDraws) {
      if (hasDraws && isWet) {
        primary = { size: 66, label: '66%', reason: '半诈唬下注，构建底池和弃牌权益', confidence: 'medium', frequency: 0.4 };
        alternatives = [
          { size: 50, label: '50%', reason: '更保守的半诈唬', confidence: 'medium', frequency: 0.3 },
          { size: 0, label: '过牌', reason: '控制底池等待补牌', confidence: 'medium', frequency: 0.3 },
        ];
        situation = '听牌湿润面，半诈唬或控池';
      } else {
        primary = { size: 33, label: '33%', reason: '中等牌力小注探测', confidence: 'medium', frequency: 0.4 };
        alternatives = [
          { size: 0, label: '过牌', reason: '控制底池大小', confidence: 'high', frequency: 0.4 },
          { size: 50, label: '50%', reason: '有位置优势时可以稍大', confidence: 'low', frequency: 0.2 },
        ];
        situation = '中等牌力，控制底池';
      }
    } else {
      // Weak hand
      if (position === 'IP') {
        primary = { size: 0, label: '过牌', reason: '弱牌有位置时过牌控池', confidence: 'high', frequency: 0.6 };
        alternatives = [
          { size: 33, label: '33%', reason: '选择性诈唬下注', confidence: 'low', frequency: 0.2 },
          { size: 50, label: '50%', reason: '弃牌权益下注', confidence: 'low', frequency: 0.2 },
        ];
        situation = '弱牌有位置，过牌或选择性诈唬';
      } else {
        primary = { size: 0, label: '过牌', reason: '弱牌无位置过牌', confidence: 'high', frequency: 0.7 };
        alternatives = [
          { size: 33, label: '33%', reason: '阻挡下注防止被剥削', confidence: 'medium', frequency: 0.2 },
          { size: 66, label: '66%', reason: '强势诈唬', confidence: 'low', frequency: 0.1 },
        ];
        situation = '弱牌无位置，过牌为主';
      }
    }

    // SPR adjustments
    if (spr < 2) {
      situation += ' (低SPR，考虑全下)';
      if (handStrength !== 'weak') {
        alternatives.push({ size: 200, label: '全下', reason: 'SPR很低，直接全下', confidence: 'medium', frequency: 0.3 });
      }
    } else if (spr < 4) {
      situation += ' (中低SPR，考虑大注)';
    }
  }

  return {
    primary: primary!,
    alternatives,
    spr,
    situation,
  };
}

export function SizingAdvisor({
  heroHand,
  board,
  street,
  position,
  potSize = 10,
  effectiveStack = 100,
}: SizingAdvisorProps) {
  const advice = useMemo(() => {
    if (!heroHand || !position) return null;
    return analyzeSizing(heroHand, board, street, position, potSize, effectiveStack);
  }, [heroHand, board, street, position, potSize, effectiveStack]);

  if (!heroHand) {
    return (
      <div className="sizing-advisor-panel sizing-empty">
        <style jsx>{styles}</style>
        <div className="advisor-header">
          <span className="advisor-icon">💰</span>
          <span className="advisor-title">下注建议</span>
        </div>
        <div className="advisor-empty-text">选择手牌后显示下注建议</div>
      </div>
    );
  }

  if (!advice) return null;

  const { primary, alternatives, spr, situation } = advice;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#666';
    }
  };

  return (
    <div className="sizing-advisor-panel">
      <style jsx>{styles}</style>

      <div className="advisor-header">
        <div className="header-left">
          <span className="advisor-icon">💰</span>
          <span className="advisor-title">下注建议</span>
        </div>
        <div className="spr-badge">SPR: {spr.toFixed(1)}</div>
      </div>

      {/* Situation description */}
      <div className="situation-desc">{situation}</div>

      {/* Primary recommendation */}
      <div className="primary-recommendation">
        <div className="primary-header">
          <span className="primary-label">推荐尺寸</span>
          <span
            className="confidence-badge"
            style={{ color: getConfidenceColor(primary.confidence) }}
          >
            {primary.confidence === 'high' ? '高置信' :
             primary.confidence === 'medium' ? '中置信' : '低置信'}
          </span>
        </div>
        <div className="primary-size">
          <span className="size-value">{primary.label}</span>
          {primary.size > 0 && (
            <span className="size-amount">≈ {Math.round(potSize * primary.size / 100)} BB</span>
          )}
        </div>
        <div className="primary-reason">{primary.reason}</div>
        <div className="frequency-bar">
          <div className="frequency-track">
            <div
              className="frequency-fill"
              style={{ width: `${primary.frequency * 100}%` }}
            />
          </div>
          <span className="frequency-value">{Math.round(primary.frequency * 100)}% 频率</span>
        </div>
      </div>

      {/* Alternative recommendations */}
      {alternatives.length > 0 && (
        <div className="alternatives">
          <div className="alternatives-title">备选尺寸</div>
          <div className="alternatives-grid">
            {alternatives.map((alt, i) => (
              <div
                key={i}
                className="alternative-item"
                style={{
                  borderLeftColor: getConfidenceColor(alt.confidence),
                }}
              >
                <div className="alt-header">
                  <span className="alt-size">{alt.label}</span>
                  <span className="alt-freq">{Math.round(alt.frequency * 100)}%</span>
                </div>
                <div className="alt-reason">{alt.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick tips */}
      <div className="tips-section">
        <div className="tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            {spr < 3
              ? '低SPR时简化决策，倾向于大注或全下'
              : spr < 6
                ? '中等SPR时保持范围平衡，多使用中等尺寸'
                : '高SPR时有更多空间操作，可以灵活调整尺寸'}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .sizing-advisor-panel {
    background: linear-gradient(180deg, #14141e 0%, #12121a 100%);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .sizing-empty {
    text-align: center;
  }

  .advisor-empty-text {
    font-size: 12px;
    color: #555;
    padding: 12px 0;
  }

  .advisor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .advisor-icon {
    font-size: 16px;
  }

  .advisor-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .spr-badge {
    padding: 3px 8px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #3b82f6;
  }

  .situation-desc {
    font-size: 11px;
    color: #888;
    margin-bottom: 12px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
    border-left: 3px solid #8b5cf6;
  }

  .primary-recommendation {
    background: rgba(34, 211, 191, 0.06);
    border: 1px solid rgba(34, 211, 191, 0.15);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .primary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .primary-label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .confidence-badge {
    font-size: 10px;
    font-weight: 600;
  }

  .primary-size {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
  }

  .size-value {
    font-size: 24px;
    font-weight: 700;
    color: #22d3bf;
  }

  .size-amount {
    font-size: 12px;
    color: #666;
  }

  .primary-reason {
    font-size: 11px;
    color: #aaa;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .frequency-bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .frequency-track {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .frequency-fill {
    height: 100%;
    background: linear-gradient(90deg, #22d3bf, #3b82f6);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .frequency-value {
    font-size: 10px;
    color: #666;
    white-space: nowrap;
  }

  .alternatives {
    margin-bottom: 12px;
  }

  .alternatives-title {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
  }

  .alternatives-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .alternative-item {
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    border-left: 3px solid;
  }

  .alt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .alt-size {
    font-size: 12px;
    font-weight: 600;
    color: #ccc;
  }

  .alt-freq {
    font-size: 10px;
    color: #666;
  }

  .alt-reason {
    font-size: 10px;
    color: #888;
  }

  .tips-section {
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .tip {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .tip-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .tip-text {
    font-size: 10px;
    color: #888;
    line-height: 1.4;
  }
`;
