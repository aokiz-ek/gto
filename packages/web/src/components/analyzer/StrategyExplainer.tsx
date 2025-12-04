'use client';

import { useMemo } from 'react';
import type { Card as CardType, Position } from '@gto/core';
import { analyzeBoardTexture } from '@gto/core';
import type { BoardTexture } from '@gto/core';

interface StrategyExplainerProps {
  heroHand: [CardType, CardType] | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  board: CardType[];
  street: 'preflop' | 'flop' | 'turn' | 'river';
  analysisResult?: {
    actions: { action: string; frequency: number; ev: number }[];
    equity: number;
  } | null;
}

// Position names in Chinese
const POSITION_NAMES: Record<Position, string> = {
  UTG: '枪口位',
  UTG1: '枪口+1',
  UTG2: '枪口+2',
  LJ: '劫位',
  HJ: '中位',
  CO: '关煞位',
  BTN: '按钮位',
  SB: '小盲',
  BB: '大盲',
};

// Position advantage icons
const POSITION_ICONS: Record<string, string> = {
  positive: '✅',
  negative: '⚠️',
  neutral: '➖',
};

export function StrategyExplainer({
  heroHand,
  heroPosition,
  villainPosition,
  board,
  street,
  analysisResult,
}: StrategyExplainerProps) {
  const explanation = useMemo(() => {
    if (!heroHand || !heroPosition || !villainPosition) {
      return null;
    }

    const rankOrder = '23456789TJQKA';
    const heroRanks = heroHand.map(c => rankOrder.indexOf(c.rank));
    const heroSuits = heroHand.map(c => c.suit);
    const isPocketPair = heroRanks[0] === heroRanks[1];
    const isSuited = heroSuits[0] === heroSuits[1];
    const highRank = Math.max(...heroRanks);
    const lowRank = Math.min(...heroRanks);
    const gap = Math.abs(heroRanks[0] - heroRanks[1]);
    const isConnected = gap <= 1;

    // Position analysis
    const positionOrder = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const heroIdx = positionOrder.indexOf(heroPosition);
    const villainIdx = positionOrder.indexOf(villainPosition);
    const hasPosition = heroIdx > villainIdx && !(heroPosition === 'SB' || heroPosition === 'BB');
    const isInPosition = hasPosition;

    // Preflop hand strength
    let preflopStrength = '';
    let preflopDescription = '';
    let strengthLevel = 0;

    if (isPocketPair) {
      if (highRank >= 10) { preflopStrength = '顶级对子'; preflopDescription = 'AA-JJ 是翻前最强的起手牌'; strengthLevel = 90; }
      else if (highRank >= 7) { preflopStrength = '中等对子'; preflopDescription = 'TT-77 需要谨慎游戏，注意超对'; strengthLevel = 65; }
      else { preflopStrength = '小对子'; preflopDescription = '66-22 主要价值是翻牌后中暗三条'; strengthLevel = 45; }
    } else if (highRank >= 12 && lowRank >= 10) {
      preflopStrength = isSuited ? '大牌同花' : '大牌组合';
      preflopDescription = isSuited ? 'AK/AQ/AJ同花有很强的翻后潜力' : '大牌组合通常可以在翻前加注';
      strengthLevel = isSuited ? 80 : 75;
    } else if (highRank >= 12) {
      preflopStrength = isSuited ? 'A高同花' : 'A高杂牌';
      preflopDescription = isSuited ? 'A高同花可以在有利位置游戏' : 'A高杂牌需要位置才能游戏';
      strengthLevel = isSuited ? 55 : 40;
    } else if (isSuited && isConnected) {
      preflopStrength = '同花连张';
      preflopDescription = '同花连张有双重成牌潜力，适合多人底池';
      strengthLevel = 50;
    } else if (isSuited) {
      preflopStrength = '同花牌';
      preflopDescription = '同花牌有约6%的几率成同花';
      strengthLevel = 40;
    } else if (isConnected) {
      preflopStrength = '连张牌';
      preflopDescription = '连张可以做成顺子，但缺少同花潜力';
      strengthLevel = 35;
    } else {
      preflopStrength = '普通牌';
      preflopDescription = '需要有利位置和好牌面才能继续';
      strengthLevel = 25;
    }

    // Postflop analysis
    let postflopStrength = '';
    let postflopDescription = '';
    let madeHand = '';
    let draws: string[] = [];
    let postflopLevel = 0;

    if (board.length >= 3) {
      const boardRanks = board.map(c => rankOrder.indexOf(c.rank));
      const boardSuits = board.map(c => c.suit);
      const allRanks = [...boardRanks, ...heroRanks];
      const allSuits = [...boardSuits, ...heroSuits];

      // Count ranks
      const rankCounts: Record<number, number> = {};
      allRanks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });

      // Count suits
      const suitCounts: Record<string, number> = {};
      allSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });

      // Check for made hands
      const maxRankCount = Math.max(...Object.values(rankCounts));
      const pairCount = Object.values(rankCounts).filter(c => c >= 2).length;
      const hasFlush = Object.values(suitCounts).some(c => c >= 5);
      const hasFlushDraw = Object.values(suitCounts).some(c => c === 4);

      // Check straight
      const uniqueRanks = [...new Set(allRanks)].sort((a, b) => a - b);
      let maxConsec = 1, curConsec = 1;
      for (let i = 1; i < uniqueRanks.length; i++) {
        if (uniqueRanks[i] - uniqueRanks[i-1] === 1) {
          curConsec++;
          maxConsec = Math.max(maxConsec, curConsec);
        } else {
          curConsec = 1;
        }
      }
      // Check for A-5 straight
      if (uniqueRanks.includes(12) && uniqueRanks.includes(0) && uniqueRanks.includes(1) && uniqueRanks.includes(2) && uniqueRanks.includes(3)) {
        maxConsec = 5;
      }
      const hasStraight = maxConsec >= 5;
      const hasOESD = maxConsec === 4;
      const hasGutshot = maxConsec === 3;

      const boardHighRank = Math.max(...boardRanks);

      // Determine hand strength
      if (maxRankCount >= 4) {
        madeHand = '四条';
        postflopLevel = 98;
      } else if (maxRankCount === 3 && pairCount >= 2) {
        madeHand = '葫芦';
        postflopLevel = 95;
      } else if (hasFlush) {
        madeHand = '同花';
        postflopLevel = 85;
      } else if (hasStraight) {
        madeHand = '顺子';
        postflopLevel = 80;
      } else if (maxRankCount === 3) {
        madeHand = '三条';
        postflopLevel = 70;
      } else if (pairCount >= 2) {
        madeHand = '两对';
        postflopLevel = 60;
      } else if (isPocketPair && heroRanks[0] > boardHighRank) {
        madeHand = '超对';
        postflopLevel = 55;
      } else if (boardRanks.includes(heroRanks[0]) || boardRanks.includes(heroRanks[1])) {
        const hitRank = boardRanks.includes(heroRanks[0]) ? heroRanks[0] : heroRanks[1];
        const kicker = boardRanks.includes(heroRanks[0]) ? heroRanks[1] : heroRanks[0];
        if (hitRank === boardHighRank) {
          madeHand = kicker >= 10 ? '顶对强踢' : '顶对';
          postflopLevel = kicker >= 10 ? 52 : 48;
        } else if (hitRank > Math.min(...boardRanks)) {
          madeHand = '中对';
          postflopLevel = 35;
        } else {
          madeHand = '底对';
          postflopLevel = 25;
        }
      } else if (isPocketPair) {
        madeHand = '低于顶牌的对子';
        postflopLevel = 30;
      } else {
        madeHand = '高牌';
        postflopLevel = highRank >= 12 ? 18 : 10;
      }

      // Add draws
      if (hasFlushDraw && !hasFlush) {
        draws.push('同花听牌');
        postflopLevel += 12;
      }
      if (hasOESD && !hasStraight) {
        draws.push('两头顺听');
        postflopLevel += 10;
      } else if (hasGutshot && !hasStraight) {
        draws.push('卡顺听牌');
        postflopLevel += 5;
      }

      // Description
      if (draws.length > 0 && postflopLevel < 60) {
        postflopDescription = `有${draws.join('和')}，可以考虑半诈唬`;
      } else if (postflopLevel >= 70) {
        postflopDescription = '强牌，应该下注获取价值';
      } else if (postflopLevel >= 50) {
        postflopDescription = '中等强牌，根据对手行动决定策略';
      } else if (postflopLevel >= 30) {
        postflopDescription = '弱牌，需要谨慎控制底池';
      } else {
        postflopDescription = '空气牌，考虑放弃或选择性诈唬';
      }

      postflopStrength = madeHand;
      postflopLevel = Math.min(postflopLevel, 100);
    }

    // Generate dynamic tips based on situation
    const tips: string[] = [];

    if (street === 'preflop') {
      if (isInPosition && strengthLevel >= 50) {
        tips.push('位置优势 + 强牌，可以主动加注');
      } else if (!isInPosition && strengthLevel >= 70) {
        tips.push('虽然没有位置，但牌力够强可以继续');
      } else if (!isInPosition && strengthLevel < 50) {
        tips.push('没有位置且牌力一般，考虑弃牌');
      }
    } else {
      const texture = board.length >= 3 ? analyzeBoardTexture(board) : null;

      if (postflopLevel >= 70) {
        if (texture === 'wet' || texture === 'connected') {
          tips.push('湿润牌面强牌要大注保护');
        } else {
          tips.push('干燥牌面可以用小注诱导跟注');
        }
      } else if (postflopLevel >= 45 && postflopLevel < 70) {
        tips.push('中等牌力要控制底池大小');
        if (isInPosition) {
          tips.push('有位置可以后手行动获取信息');
        }
      } else if (draws.length > 0) {
        tips.push('听牌时计算底池赔率决定是否继续');
      }
    }

    // Recommended action
    let recommendedAction = '';
    let actionIcon = '';
    let actionReason = '';

    if (analysisResult && analysisResult.actions.length > 0) {
      const topAction = analysisResult.actions[0];
      const actionLabels: Record<string, { label: string; icon: string }> = {
        raise: { label: '加注', icon: '🔺' },
        call: { label: '跟注', icon: '✋' },
        fold: { label: '弃牌', icon: '🚫' },
        bet: { label: '下注', icon: '💰' },
        check: { label: '过牌', icon: '✓' },
        allin: { label: '全下', icon: '🔥' },
      };
      const actionInfo = actionLabels[topAction.action] || { label: topAction.action, icon: '•' };
      recommendedAction = actionInfo.label;
      actionIcon = actionInfo.icon;
      actionReason = `GTO频率 ${Math.round(topAction.frequency * 100)}%，EV ${topAction.ev > 0 ? '+' : ''}${topAction.ev.toFixed(1)} BB`;
    } else {
      // Dynamic recommendation
      const currentLevel = street === 'preflop' ? strengthLevel : postflopLevel;
      if (currentLevel >= 70) {
        recommendedAction = '下注/加注';
        actionIcon = '🔺';
        actionReason = '强牌时要建立底池获取价值';
      } else if (currentLevel >= 45 && isInPosition) {
        recommendedAction = '下注/过牌';
        actionIcon = '💰';
        actionReason = '有位置时可以选择性下注';
      } else if (currentLevel >= 45) {
        recommendedAction = '跟注/过牌';
        actionIcon = '✋';
        actionReason = '无位置时保守一些';
      } else if (draws.length > 0) {
        recommendedAction = '过牌/跟注';
        actionIcon = '🎯';
        actionReason = '听牌时根据赔率决定';
      } else {
        recommendedAction = '过牌/弃牌';
        actionIcon = '✓';
        actionReason = '弱牌避免扩大底池';
      }
    }

    return {
      heroPosition,
      villainPosition,
      hasPosition: isInPosition,
      street,
      preflop: {
        strength: preflopStrength,
        description: preflopDescription,
        level: strengthLevel,
        isPocketPair,
        isSuited,
        isConnected,
      },
      postflop: board.length >= 3 ? {
        strength: postflopStrength,
        description: postflopDescription,
        level: postflopLevel,
        madeHand,
        draws,
      } : null,
      tips,
      recommendation: {
        action: recommendedAction,
        icon: actionIcon,
        reason: actionReason,
      },
      equity: analysisResult?.equity,
    };
  }, [heroHand, heroPosition, villainPosition, board, street, analysisResult]);

  if (!explanation) {
    return (
      <div className="explainer-panel explainer-empty">
        <style jsx>{styles}</style>
        <div className="explainer-header">
          <span className="explainer-icon">🧠</span>
          <span className="explainer-title">策略分析</span>
        </div>
        <div className="explainer-empty-text">选择手牌和位置后显示动态策略分析</div>
      </div>
    );
  }

  const currentStrength = explanation.postflop || explanation.preflop;
  const strengthColor = currentStrength.level >= 60 ? '#22c55e' :
                        currentStrength.level >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="explainer-panel">
      <style jsx>{styles}</style>

      {/* Header */}
      <div className="explainer-header">
        <div className="header-left">
          <span className="explainer-icon">🧠</span>
          <span className="explainer-title">策略分析</span>
        </div>
        {explanation.equity && (
          <div className="equity-badge">
            权益 {explanation.equity}%
          </div>
        )}
      </div>

      {/* Position matchup */}
      <div className="matchup">
        <div className="matchup-positions">
          <span className="position-tag hero">{POSITION_NAMES[explanation.heroPosition]}</span>
          <span className="vs">vs</span>
          <span className="position-tag villain">{POSITION_NAMES[explanation.villainPosition]}</span>
        </div>
        <div className={`position-advantage ${explanation.hasPosition ? 'positive' : 'negative'}`}>
          {explanation.hasPosition ? '✅ 有位置' : '⚠️ 无位置'}
        </div>
      </div>

      {/* Hand strength */}
      <div className="strength-section">
        <div className="strength-header">
          <span className="strength-label">{explanation.street === 'preflop' ? '翻前牌力' : '当前牌力'}</span>
          <span className="strength-value" style={{ color: strengthColor }}>
            {currentStrength.strength}
          </span>
        </div>
        <div className="strength-bar-container">
          <div
            className="strength-bar"
            style={{
              width: `${currentStrength.level}%`,
              background: `linear-gradient(90deg, ${strengthColor}, ${strengthColor}88)`
            }}
          />
        </div>
        <div className="strength-description">{currentStrength.description}</div>

        {/* Draw badges */}
        {explanation.postflop?.draws && explanation.postflop.draws.length > 0 && (
          <div className="draws">
            {explanation.postflop.draws.map((draw, i) => (
              <span key={i} className="draw-badge">🎯 {draw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Preflop hand characteristics */}
      {explanation.street === 'preflop' && (
        <div className="hand-chars">
          <span className={`char-tag ${explanation.preflop.isPocketPair ? 'active' : ''}`}>
            {explanation.preflop.isPocketPair ? '👯 对子' : '🃏 非对'}
          </span>
          <span className={`char-tag ${explanation.preflop.isSuited ? 'active' : ''}`}>
            {explanation.preflop.isSuited ? '🎨 同花' : '🌈 杂色'}
          </span>
          <span className={`char-tag ${explanation.preflop.isConnected ? 'active' : ''}`}>
            {explanation.preflop.isConnected ? '🔗 连张' : '📍 间隔'}
          </span>
        </div>
      )}

      {/* Recommendation */}
      <div className="recommendation">
        <div className="rec-main">
          <span className="rec-icon">{explanation.recommendation.icon}</span>
          <span className="rec-action">{explanation.recommendation.action}</span>
        </div>
        <div className="rec-reason">{explanation.recommendation.reason}</div>
      </div>

      {/* Tips */}
      {explanation.tips.length > 0 && (
        <div className="tips">
          {explanation.tips.map((tip, i) => (
            <div key={i} className="tip-item">
              <span className="tip-icon">💡</span>
              <span className="tip-text">{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = `
  .explainer-panel {
    background: linear-gradient(180deg, #14141e 0%, #12121a 100%);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .explainer-empty {
    text-align: center;
    padding: 20px 14px;
  }

  .explainer-empty-text {
    font-size: 12px;
    color: #555;
    padding: 12px 0;
  }

  .explainer-header {
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

  .explainer-icon {
    font-size: 16px;
  }

  .explainer-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .equity-badge {
    padding: 4px 10px;
    background: rgba(34, 211, 191, 0.12);
    border: 1px solid rgba(34, 211, 191, 0.25);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #22d3bf;
  }

  .matchup {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .matchup-positions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .position-tag {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  .position-tag.hero {
    background: rgba(34, 211, 191, 0.15);
    color: #22d3bf;
  }

  .position-tag.villain {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .vs {
    font-size: 10px;
    color: #666;
  }

  .position-advantage {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .position-advantage.positive {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .position-advantage.negative {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .strength-section {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .strength-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .strength-label {
    font-size: 11px;
    color: #888;
  }

  .strength-value {
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

  .strength-description {
    font-size: 11px;
    color: #888;
    line-height: 1.5;
  }

  .draws {
    display: flex;
    gap: 6px;
    margin-top: 8px;
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

  .hand-chars {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }

  .char-tag {
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 10px;
    color: #666;
  }

  .char-tag.active {
    background: rgba(139, 92, 246, 0.12);
    border-color: rgba(139, 92, 246, 0.25);
    color: #a78bfa;
  }

  .recommendation {
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .rec-main {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .rec-icon {
    font-size: 18px;
  }

  .rec-action {
    font-size: 16px;
    font-weight: 700;
    color: #a78bfa;
  }

  .rec-reason {
    font-size: 11px;
    color: #888;
    line-height: 1.5;
  }

  .tips {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
  }

  .tip-icon {
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .tip-text {
    font-size: 11px;
    color: #aaa;
    line-height: 1.4;
  }
`;
