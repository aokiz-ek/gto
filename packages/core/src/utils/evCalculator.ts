/**
 * EV Loss Calculator
 *
 * Calculates Expected Value (EV) loss for poker decisions based on GTO frequencies.
 * Uses a BB (big blind) based model for standardized comparison across stakes.
 */

import type { GTOHandStrategy } from '../types';

// Action types for normalization
export type NormalizedAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

// Error categories based on EV loss severity (in BB)
export type ErrorSeverity = 'perfect' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

// Detailed EV analysis result
export interface EVAnalysis {
  // Player's action frequency in GTO strategy (0-100)
  actionFrequency: number;

  // Estimated EV loss in big blinds
  evLossBB: number;

  // Error severity category
  severity: ErrorSeverity;

  // Recommended action(s) with their frequencies
  recommendations: ActionRecommendation[];

  // Detailed breakdown of the analysis
  breakdown: EVBreakdown;

  // Human-readable analysis
  analysis: string;
  analysisEn: string;
}

export interface ActionRecommendation {
  action: NormalizedAction;
  frequency: number;
  evDifference: number; // EV difference from player's choice
}

export interface EVBreakdown {
  // Base EV factors
  potSize: number;
  effectiveStack: number;
  spr: number; // Stack-to-pot ratio

  // GTO frequencies
  gtoFoldFreq: number;
  gtoCallFreq: number;
  gtoRaiseFreq: number;

  // EV estimates for each action
  foldEV: number;
  callEV: number;
  raiseEV: number;

  // Player's action EV
  playerActionEV: number;

  // Optimal action EV
  optimalActionEV: number;
}

// Preflop scenario context
export interface PreflopContext {
  heroPosition: string;
  villainPosition?: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet' | 'vs_4bet';
  potSizeBB: number;
  effectiveStackBB: number;
  facingBetBB?: number;
}

// Postflop scenario context
export interface PostflopContext {
  street: 'flop' | 'turn' | 'river';
  potSizeBB: number;
  effectiveStackBB: number;
  facingBetBB?: number;
  isInPosition: boolean;
  isAggressor: boolean;
}

/**
 * Normalize action string to standard format
 */
export function normalizeAction(action: string): NormalizedAction {
  const actionLower = action.toLowerCase();

  if (actionLower === 'fold' || actionLower === 'folds') {
    return 'fold';
  }
  if (actionLower === 'check' || actionLower === 'checks') {
    return 'check';
  }
  if (actionLower === 'call' || actionLower === 'calls') {
    return 'call';
  }
  if (actionLower === 'bet' || actionLower === 'bets' ||
      actionLower === 'raise' || actionLower === 'raises') {
    return 'raise';
  }
  if (actionLower === 'all-in' || actionLower === 'allin' ||
      actionLower === 'all in' || actionLower.includes('all-in')) {
    return 'allin';
  }

  return 'fold'; // Default to fold for unknown actions
}

/**
 * Map severity level to EV loss thresholds (in BB)
 */
const SEVERITY_THRESHOLDS = {
  perfect: 0,      // 0 BB loss
  good: 0.1,       // 0-0.1 BB loss
  inaccuracy: 0.5, // 0.1-0.5 BB loss
  mistake: 1.5,    // 0.5-1.5 BB loss
  blunder: 3,      // >1.5 BB loss
};

/**
 * Calculate error severity based on EV loss
 */
export function getErrorSeverity(evLossBB: number): ErrorSeverity {
  if (evLossBB <= 0) return 'perfect';
  if (evLossBB <= SEVERITY_THRESHOLDS.good) return 'good';
  if (evLossBB <= SEVERITY_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (evLossBB <= SEVERITY_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: ErrorSeverity): string {
  const colors: Record<ErrorSeverity, string> = {
    perfect: '#00f5d4',   // Cyan - perfect play
    good: '#4ecdc4',      // Teal - good play
    inaccuracy: '#f5d000', // Yellow - small error
    mistake: '#ff9500',   // Orange - notable error
    blunder: '#ff4444',   // Red - major error
  };
  return colors[severity];
}

/**
 * Get severity display label
 */
export function getSeverityLabel(severity: ErrorSeverity): { zh: string; en: string } {
  const labels: Record<ErrorSeverity, { zh: string; en: string }> = {
    perfect: { zh: '完美', en: 'Perfect' },
    good: { zh: '良好', en: 'Good' },
    inaccuracy: { zh: '不精确', en: 'Inaccuracy' },
    mistake: { zh: '错误', en: 'Mistake' },
    blunder: { zh: '严重失误', en: 'Blunder' },
  };
  return labels[severity];
}

/**
 * Estimate EV for each action based on GTO frequencies
 *
 * Model: EV = sum(frequency * action_value) for each action
 *
 * For preflop:
 * - Fold EV = 0 (baseline)
 * - Call EV depends on pot odds and equity realization
 * - Raise EV depends on fold equity and value
 */
function estimateActionEVs(
  gtoStrategy: GTOHandStrategy,
  context: PreflopContext | PostflopContext,
  isPreflopContext: boolean
): { fold: number; call: number; raise: number } {
  const { potSizeBB, effectiveStackBB, facingBetBB = 0 } = context;

  // Simplified EV model based on frequencies and pot geometry
  const foldFreq = gtoStrategy.fold || 0;
  const callFreq = gtoStrategy.call || 0;
  const raiseFreq = gtoStrategy.raise || 0;

  // Fold EV is always 0 (baseline)
  const foldEV = 0;

  // Calculate pot odds
  const potOdds = facingBetBB > 0 ? facingBetBB / (potSizeBB + facingBetBB) : 0;

  // Estimate call EV based on call frequency
  // Higher call frequency = better calling hand = positive EV
  // This is a simplified model; real EV would require equity calculation
  let callEV = 0;
  if (callFreq > 0) {
    // Estimate equity realization factor (hands that call realize ~60-80% of equity)
    const equityRealization = 0.7;
    // Implied equity from call frequency (higher freq = stronger hand)
    const impliedEquity = 0.3 + (callFreq / 100) * 0.4; // 30-70% equity estimate
    const potAfterCall = potSizeBB + facingBetBB + facingBetBB;
    callEV = (impliedEquity * equityRealization * potAfterCall) - facingBetBB;
  }

  // Estimate raise EV based on raise frequency
  let raiseEV = 0;
  if (raiseFreq > 0) {
    // Fold equity component
    const foldEquity = 0.3 + (raiseFreq / 100) * 0.2; // 30-50% fold equity
    const potWhenFold = potSizeBB + facingBetBB;

    // Value component (when called)
    const impliedEquity = 0.35 + (raiseFreq / 100) * 0.35; // 35-70% equity
    const raiseSizeBB = isPreflopContext ? 3 : potSizeBB * 0.75;
    const potWhenCalled = potSizeBB + facingBetBB + raiseSizeBB * 2;

    raiseEV = (foldEquity * potWhenFold) +
              ((1 - foldEquity) * (impliedEquity * potWhenCalled - raiseSizeBB));
  }

  return { fold: foldEV, call: callEV, raise: raiseEV };
}

/**
 * Calculate EV loss for a preflop decision
 */
export function calculatePreflopEVLoss(
  playerAction: string,
  gtoStrategy: GTOHandStrategy,
  context: PreflopContext
): EVAnalysis {
  const normalizedAction = normalizeAction(playerAction);

  // Get frequency for player's action
  let actionFrequency = 0;
  if (normalizedAction === 'fold' || normalizedAction === 'check') {
    actionFrequency = gtoStrategy.fold || 0;
  } else if (normalizedAction === 'call') {
    actionFrequency = gtoStrategy.call || 0;
  } else if (normalizedAction === 'raise') {
    actionFrequency = gtoStrategy.raise || 0;
  } else if (normalizedAction === 'allin') {
    // All-in is typically part of the raise range at certain frequencies
    actionFrequency = (gtoStrategy.raise || 0) * 0.3;
  }

  // Estimate EVs for each action
  const actionEVs = estimateActionEVs(gtoStrategy, context, true);

  // Get player's action EV
  let playerActionEV = 0;
  if (normalizedAction === 'fold' || normalizedAction === 'check') {
    playerActionEV = actionEVs.fold;
  } else if (normalizedAction === 'call') {
    playerActionEV = actionEVs.call;
  } else if (normalizedAction === 'raise' || normalizedAction === 'allin') {
    playerActionEV = actionEVs.raise;
  }

  // Find optimal action and its EV
  const actions = [
    { action: 'fold' as NormalizedAction, freq: gtoStrategy.fold || 0, ev: actionEVs.fold },
    { action: 'call' as NormalizedAction, freq: gtoStrategy.call || 0, ev: actionEVs.call },
    { action: 'raise' as NormalizedAction, freq: gtoStrategy.raise || 0, ev: actionEVs.raise },
  ].sort((a, b) => b.freq - a.freq);

  const optimalAction = actions[0];
  const optimalActionEV = optimalAction.ev;

  // Calculate EV loss based on frequency-weighted model
  // When player takes a 0-frequency action, the EV loss is higher
  // When player takes a low-frequency action, there's still some loss
  let evLossBB: number;

  if (actionFrequency >= 80) {
    // Perfect or nearly perfect play
    evLossBB = 0;
  } else if (actionFrequency >= 50) {
    // Acceptable play, minor EV loss
    evLossBB = (100 - actionFrequency) / 1000 * context.potSizeBB;
  } else if (actionFrequency >= 20) {
    // Marginal play, moderate EV loss
    evLossBB = 0.1 + (50 - actionFrequency) / 100 * context.potSizeBB * 0.3;
  } else if (actionFrequency >= 5) {
    // Poor play, significant EV loss
    evLossBB = 0.5 + (20 - actionFrequency) / 30 * context.potSizeBB * 0.5;
  } else {
    // Very poor play, major EV loss
    evLossBB = 1.5 + (context.potSizeBB * 0.3);
  }

  // Cap EV loss at reasonable levels
  evLossBB = Math.min(evLossBB, context.potSizeBB);

  const severity = getErrorSeverity(evLossBB);

  // Build recommendations
  const recommendations: ActionRecommendation[] = actions
    .filter(a => a.freq > 0)
    .map(a => ({
      action: a.action,
      frequency: a.freq,
      evDifference: a.ev - playerActionEV,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  // Generate analysis text
  const { analysis, analysisEn } = generateAnalysisText(
    normalizedAction,
    actionFrequency,
    severity,
    recommendations,
    context
  );

  return {
    actionFrequency,
    evLossBB: Math.round(evLossBB * 100) / 100, // Round to 2 decimal places
    severity,
    recommendations,
    breakdown: {
      potSize: context.potSizeBB,
      effectiveStack: context.effectiveStackBB,
      spr: context.effectiveStackBB / context.potSizeBB,
      gtoFoldFreq: gtoStrategy.fold || 0,
      gtoCallFreq: gtoStrategy.call || 0,
      gtoRaiseFreq: gtoStrategy.raise || 0,
      foldEV: actionEVs.fold,
      callEV: actionEVs.call,
      raiseEV: actionEVs.raise,
      playerActionEV,
      optimalActionEV,
    },
    analysis,
    analysisEn,
  };
}

/**
 * Calculate EV loss for a postflop decision (simplified)
 */
export function calculatePostflopEVLoss(
  playerAction: string,
  gtoStrategy: GTOHandStrategy | null,
  context: PostflopContext
): EVAnalysis {
  // Postflop analysis is more complex and would require board texture analysis
  // For now, return a placeholder with basic frequency analysis if GTO data available

  if (!gtoStrategy) {
    return {
      actionFrequency: 0,
      evLossBB: 0,
      severity: 'good',
      recommendations: [],
      breakdown: {
        potSize: context.potSizeBB,
        effectiveStack: context.effectiveStackBB,
        spr: context.effectiveStackBB / context.potSizeBB,
        gtoFoldFreq: 0,
        gtoCallFreq: 0,
        gtoRaiseFreq: 0,
        foldEV: 0,
        callEV: 0,
        raiseEV: 0,
        playerActionEV: 0,
        optimalActionEV: 0,
      },
      analysis: '翻后分析需要更复杂的计算',
      analysisEn: 'Postflop analysis requires more complex calculation',
    };
  }

  // If GTO data is available, use similar logic to preflop
  const normalizedAction = normalizeAction(playerAction);

  let actionFrequency = 0;
  if (normalizedAction === 'fold' || normalizedAction === 'check') {
    actionFrequency = gtoStrategy.fold || gtoStrategy.check || 0;
  } else if (normalizedAction === 'call') {
    actionFrequency = gtoStrategy.call || 0;
  } else if (normalizedAction === 'raise') {
    actionFrequency = gtoStrategy.raise || gtoStrategy.bet || 0;
  }

  const actionEVs = estimateActionEVs(gtoStrategy, context, false);

  // Calculate EV loss with postflop adjustments
  let evLossBB: number;

  if (actionFrequency >= 70) {
    evLossBB = 0;
  } else if (actionFrequency >= 40) {
    evLossBB = (70 - actionFrequency) / 200 * context.potSizeBB;
  } else if (actionFrequency >= 15) {
    evLossBB = 0.2 + (40 - actionFrequency) / 50 * context.potSizeBB * 0.4;
  } else {
    evLossBB = 0.8 + (context.potSizeBB * 0.4);
  }

  evLossBB = Math.min(evLossBB, context.potSizeBB * 0.8);

  const severity = getErrorSeverity(evLossBB);

  return {
    actionFrequency,
    evLossBB: Math.round(evLossBB * 100) / 100,
    severity,
    recommendations: [],
    breakdown: {
      potSize: context.potSizeBB,
      effectiveStack: context.effectiveStackBB,
      spr: context.effectiveStackBB / context.potSizeBB,
      gtoFoldFreq: gtoStrategy.fold || 0,
      gtoCallFreq: gtoStrategy.call || 0,
      gtoRaiseFreq: gtoStrategy.raise || 0,
      foldEV: actionEVs.fold,
      callEV: actionEVs.call,
      raiseEV: actionEVs.raise,
      playerActionEV: 0,
      optimalActionEV: 0,
    },
    analysis: '翻后分析',
    analysisEn: 'Postflop analysis',
  };
}

/**
 * Generate human-readable analysis text
 */
function generateAnalysisText(
  playerAction: NormalizedAction,
  frequency: number,
  severity: ErrorSeverity,
  recommendations: ActionRecommendation[],
  context: PreflopContext | PostflopContext
): { analysis: string; analysisEn: string } {
  const actionNameZh: Record<NormalizedAction, string> = {
    fold: '弃牌',
    check: '过牌',
    call: '跟注',
    raise: '加注',
    allin: '全下',
  };

  const actionNameEn: Record<NormalizedAction, string> = {
    fold: 'fold',
    check: 'check',
    call: 'call',
    raise: 'raise',
    allin: 'all-in',
  };

  const topRec = recommendations[0];
  const playerActionZh = actionNameZh[playerAction];
  const playerActionEn = actionNameEn[playerAction];

  let analysis: string;
  let analysisEn: string;

  switch (severity) {
    case 'perfect':
      analysis = `完美！${playerActionZh}在GTO策略中频率为${frequency.toFixed(0)}%，是最优选择。`;
      analysisEn = `Perfect! ${playerActionEn} has ${frequency.toFixed(0)}% frequency in GTO strategy, optimal choice.`;
      break;

    case 'good':
      analysis = `良好选择。${playerActionZh}频率${frequency.toFixed(0)}%，在GTO范围内。`;
      analysisEn = `Good choice. ${playerActionEn} has ${frequency.toFixed(0)}% frequency, within GTO range.`;
      break;

    case 'inaccuracy':
      if (topRec && topRec.action !== playerAction) {
        const recActionZh = actionNameZh[topRec.action];
        const recActionEn = actionNameEn[topRec.action];
        analysis = `边缘选择。${playerActionZh}频率仅${frequency.toFixed(0)}%。考虑${recActionZh}(${topRec.frequency.toFixed(0)}%)。`;
        analysisEn = `Marginal choice. ${playerActionEn} has only ${frequency.toFixed(0)}% frequency. Consider ${recActionEn} (${topRec.frequency.toFixed(0)}%).`;
      } else {
        analysis = `边缘选择。${playerActionZh}频率${frequency.toFixed(0)}%，可以改进。`;
        analysisEn = `Marginal choice. ${playerActionEn} has ${frequency.toFixed(0)}% frequency, room for improvement.`;
      }
      break;

    case 'mistake':
      if (topRec) {
        const recActionZh = actionNameZh[topRec.action];
        const recActionEn = actionNameEn[topRec.action];
        analysis = `较大偏离。${playerActionZh}频率仅${frequency.toFixed(0)}%。GTO建议${recActionZh}(${topRec.frequency.toFixed(0)}%)。`;
        analysisEn = `Significant deviation. ${playerActionEn} has only ${frequency.toFixed(0)}% frequency. GTO suggests ${recActionEn} (${topRec.frequency.toFixed(0)}%).`;
      } else {
        analysis = `较大偏离GTO。${playerActionZh}频率${frequency.toFixed(0)}%，需要改进。`;
        analysisEn = `Significant GTO deviation. ${playerActionEn} has ${frequency.toFixed(0)}% frequency, needs improvement.`;
      }
      break;

    case 'blunder':
      if (topRec) {
        const recActionZh = actionNameZh[topRec.action];
        const recActionEn = actionNameEn[topRec.action];
        analysis = `严重失误！${playerActionZh}不在GTO策略中(${frequency.toFixed(0)}%)。应该${recActionZh}(${topRec.frequency.toFixed(0)}%)。`;
        analysisEn = `Blunder! ${playerActionEn} not in GTO strategy (${frequency.toFixed(0)}%). Should ${recActionEn} (${topRec.frequency.toFixed(0)}%).`;
      } else {
        analysis = `严重失误！${playerActionZh}完全偏离GTO策略。`;
        analysisEn = `Blunder! ${playerActionEn} completely deviates from GTO strategy.`;
      }
      break;
  }

  return { analysis, analysisEn };
}

/**
 * Calculate aggregate stats from multiple EV analyses
 */
export interface AggregateEVStats {
  totalEvLossBB: number;
  averageEvLossBB: number;
  actionCount: number;
  perfectCount: number;
  goodCount: number;
  inaccuracyCount: number;
  mistakeCount: number;
  blunderCount: number;
  overallRating: string;
  overallRatingEn: string;
}

export function calculateAggregateStats(analyses: EVAnalysis[]): AggregateEVStats {
  const totalEvLossBB = analyses.reduce((sum, a) => sum + a.evLossBB, 0);
  const averageEvLossBB = analyses.length > 0 ? totalEvLossBB / analyses.length : 0;

  const perfectCount = analyses.filter(a => a.severity === 'perfect').length;
  const goodCount = analyses.filter(a => a.severity === 'good').length;
  const inaccuracyCount = analyses.filter(a => a.severity === 'inaccuracy').length;
  const mistakeCount = analyses.filter(a => a.severity === 'mistake').length;
  const blunderCount = analyses.filter(a => a.severity === 'blunder').length;

  // Calculate overall rating based on total EV loss
  let overallRating: string;
  let overallRatingEn: string;

  if (totalEvLossBB <= 0.1) {
    overallRating = 'GTO大师';
    overallRatingEn = 'GTO Master';
  } else if (totalEvLossBB <= 0.5) {
    overallRating = '优秀';
    overallRatingEn = 'Excellent';
  } else if (totalEvLossBB <= 2) {
    overallRating = '良好';
    overallRatingEn = 'Good';
  } else if (totalEvLossBB <= 5) {
    overallRating = '需要改进';
    overallRatingEn = 'Needs Improvement';
  } else {
    overallRating = '多加练习';
    overallRatingEn = 'Keep Practicing';
  }

  return {
    totalEvLossBB: Math.round(totalEvLossBB * 100) / 100,
    averageEvLossBB: Math.round(averageEvLossBB * 100) / 100,
    actionCount: analyses.length,
    perfectCount,
    goodCount,
    inaccuracyCount,
    mistakeCount,
    blunderCount,
    overallRating,
    overallRatingEn,
  };
}
