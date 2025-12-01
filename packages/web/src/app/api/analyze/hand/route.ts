import { NextRequest, NextResponse } from 'next/server';
import {
  parseHandHistory,
  GTO_RANGES,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
  handToDisplayString,
  calculatePreflopEVLoss,
  calculatePostflopEVLoss,
  calculateAggregateStats,
  getSeverityColor,
  getSeverityLabel,
} from '@gto/core';
import type {
  ParsedHandHistory,
  ParsedAction,
  Position,
  GTOHandStrategy,
  EVAnalysis,
  PreflopContext,
  PostflopContext,
  AggregateEVStats,
} from '@gto/core';

interface AnalyzedAction {
  street: string;
  player: string;
  action: string;
  amount?: number;
  isHero: boolean;
  gtoStrategy?: GTOHandStrategy;
  gtoRecommendation?: string;
  accuracy?: number;
  evLoss?: number;
  evLossBB?: number;
  severity?: string;
  severityColor?: string;
  severityLabel?: { zh: string; en: string };
  analysis?: string;
  analysisEn?: string;
  recommendations?: Array<{
    action: string;
    frequency: number;
    evDifference: number;
  }>;
}

interface AnalysisResult {
  success: boolean;
  hand?: ParsedHandHistory;
  analyzedActions?: AnalyzedAction[];
  summary?: {
    totalEvLoss: number;
    totalEvLossBB: number;
    averageEvLossBB: number;
    heroActionCount: number;
    perfectActions: number;
    goodActions: number;
    inaccuracies: number;
    mistakes: number;
    blunders: number;
    overallRating: string;
    overallRatingEn: string;
  };
  error?: string;
}

// Get GTO strategy based on scenario
function getGTOStrategy(
  handString: string,
  heroPosition: string,
  villainPosition: string,
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet'
): GTOHandStrategy | null {
  if (scenario === 'rfi') {
    const positionData = GTO_RANGES[heroPosition as Position];
    const ranges = positionData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  } else if (scenario === 'vs_rfi') {
    const key = `BB_vs_${villainPosition}`;
    const rangeData = GTO_VS_RFI_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  } else {
    const key = `${heroPosition}_vs_${villainPosition}`;
    const rangeData = GTO_VS_3BET_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  }
  return null;
}

// Extract pot size from parsed hand
function extractPotSize(hand: ParsedHandHistory, street: string, actionIndex: number): number {
  let potSize = 0;

  // Add blinds (assumed 1.5 BB for standard SB + BB)
  potSize += 1.5;

  // Add preflop action amounts
  const preflopActions = hand.preflop.slice(0, street === 'preflop' ? actionIndex : hand.preflop.length);
  for (const action of preflopActions) {
    if (action.amount && (action.action === 'call' || action.action === 'raise' || action.action === 'bet')) {
      potSize += action.amount;
    }
  }

  // Add flop action amounts
  if (street !== 'preflop') {
    const flopActions = hand.flop.slice(0, street === 'flop' ? actionIndex : hand.flop.length);
    for (const action of flopActions) {
      if (action.amount && (action.action === 'call' || action.action === 'raise' || action.action === 'bet')) {
        potSize += action.amount;
      }
    }
  }

  // Add turn action amounts
  if (street !== 'preflop' && street !== 'flop') {
    const turnActions = hand.turn.slice(0, street === 'turn' ? actionIndex : hand.turn.length);
    for (const action of turnActions) {
      if (action.amount && (action.action === 'call' || action.action === 'raise' || action.action === 'bet')) {
        potSize += action.amount;
      }
    }
  }

  // Add river action amounts
  if (street === 'river') {
    const riverActions = hand.river.slice(0, actionIndex);
    for (const action of riverActions) {
      if (action.amount && (action.action === 'call' || action.action === 'raise' || action.action === 'bet')) {
        potSize += action.amount;
      }
    }
  }

  return potSize;
}

// Get effective stack size (simplified - use hero's stack)
function getEffectiveStack(hand: ParsedHandHistory): number {
  const heroPlayer = hand.players.find(p => p.isHero);
  if (heroPlayer && heroPlayer.stack) {
    // Convert to BB (assume 100 BB if no info available)
    return heroPlayer.stack;
  }
  return 100; // Default to 100 BB
}

// Find the villain position (first raiser before hero's action)
function findVillainPosition(hand: ParsedHandHistory, actionIndex: number): string {
  const prevActions = hand.preflop.slice(0, actionIndex);
  const lastRaise = [...prevActions].reverse().find(a => a.action === 'raise' || a.action === 'bet');

  if (lastRaise) {
    const villain = hand.players.find(p => p.name === lastRaise.player);
    return villain?.position || 'BTN';
  }

  return 'BTN';
}

// Analyze a single action with enhanced EV calculation
function analyzeAction(
  action: ParsedAction,
  street: string,
  hand: ParsedHandHistory,
  actionIndex: number
): { analyzedAction: AnalyzedAction; evAnalysis: EVAnalysis | null } {
  const isHero = action.player === hand.heroName;

  const analyzedAction: AnalyzedAction = {
    street,
    player: action.player,
    action: action.action,
    amount: action.amount,
    isHero,
  };

  if (!isHero || !hand.heroCards) {
    return { analyzedAction, evAnalysis: null };
  }

  const handString = handToDisplayString(hand.heroCards);
  const heroPlayer = hand.players.find(p => p.isHero);
  const heroPosition = heroPlayer?.position || 'BTN';

  // Determine scenario based on action history
  let scenario: 'rfi' | 'vs_rfi' | 'vs_3bet' = 'rfi';
  let villainPosition = 'BB';

  if (street === 'preflop') {
    // Check previous actions to determine scenario
    const prevActions = hand.preflop.slice(0, actionIndex);
    const raises = prevActions.filter(a => a.action === 'raise' || a.action === 'bet');

    if (raises.length === 0) {
      scenario = 'rfi';
    } else if (raises.length === 1) {
      scenario = 'vs_rfi';
      villainPosition = findVillainPosition(hand, actionIndex);
    } else {
      scenario = 'vs_3bet';
      villainPosition = findVillainPosition(hand, actionIndex);
    }

    // Get GTO strategy
    const gtoStrategy = getGTOStrategy(handString, heroPosition, villainPosition, scenario);

    if (gtoStrategy) {
      analyzedAction.gtoStrategy = gtoStrategy;

      // Calculate pot size and effective stack
      const potSizeBB = extractPotSize(hand, street, actionIndex);
      const effectiveStackBB = getEffectiveStack(hand);

      // Get facing bet amount
      const prevAction = hand.preflop[actionIndex - 1];
      const facingBetBB = prevAction?.amount || 0;

      // Create context for EV calculation
      const context: PreflopContext = {
        heroPosition,
        villainPosition,
        scenario,
        potSizeBB,
        effectiveStackBB,
        facingBetBB,
      };

      // Calculate EV loss using enhanced calculator
      const evAnalysis = calculatePreflopEVLoss(action.action, gtoStrategy, context);

      // Populate analyzed action with EV data
      analyzedAction.accuracy = evAnalysis.actionFrequency;
      analyzedAction.evLoss = evAnalysis.evLossBB; // Backward compatibility
      analyzedAction.evLossBB = evAnalysis.evLossBB;
      analyzedAction.severity = evAnalysis.severity;
      analyzedAction.severityColor = getSeverityColor(evAnalysis.severity);
      analyzedAction.severityLabel = getSeverityLabel(evAnalysis.severity);
      analyzedAction.analysis = evAnalysis.analysis;
      analyzedAction.analysisEn = evAnalysis.analysisEn;
      analyzedAction.recommendations = evAnalysis.recommendations.map(r => ({
        action: r.action,
        frequency: r.frequency,
        evDifference: r.evDifference,
      }));

      // Set GTO recommendation (highest frequency action)
      if (evAnalysis.recommendations.length > 0) {
        analyzedAction.gtoRecommendation = evAnalysis.recommendations[0].action;
      }

      return { analyzedAction, evAnalysis };
    }
  } else {
    // Postflop analysis
    const potSizeBB = extractPotSize(hand, street, actionIndex);
    const effectiveStackBB = getEffectiveStack(hand);

    const context: PostflopContext = {
      street: street as 'flop' | 'turn' | 'river',
      potSizeBB,
      effectiveStackBB,
      facingBetBB: 0,
      isInPosition: true, // Simplified
      isAggressor: true, // Simplified
    };

    const evAnalysis = calculatePostflopEVLoss(action.action, null, context);

    analyzedAction.evLossBB = evAnalysis.evLossBB;
    analyzedAction.severity = evAnalysis.severity;
    analyzedAction.severityColor = getSeverityColor(evAnalysis.severity);
    analyzedAction.severityLabel = getSeverityLabel(evAnalysis.severity);
    analyzedAction.analysis = evAnalysis.analysis;
    analyzedAction.analysisEn = evAnalysis.analysisEn;

    return { analyzedAction, evAnalysis };
  }

  return { analyzedAction, evAnalysis: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handHistory } = body;

    if (!handHistory) {
      return NextResponse.json(
        { success: false, error: '请提供手牌历史' },
        { status: 400 }
      );
    }

    // Parse the hand history
    const parsed = parseHandHistory(handHistory);

    if (!parsed) {
      return NextResponse.json(
        { success: false, error: '无法解析手牌历史' },
        { status: 400 }
      );
    }

    // Analyze all actions
    const analyzedActions: AnalyzedAction[] = [];
    const heroEvAnalyses: EVAnalysis[] = [];

    // Process each street
    const streets = [
      { name: 'preflop', actions: parsed.preflop },
      { name: 'flop', actions: parsed.flop },
      { name: 'turn', actions: parsed.turn },
      { name: 'river', actions: parsed.river },
    ];

    for (const street of streets) {
      street.actions.forEach((action, idx) => {
        const { analyzedAction, evAnalysis } = analyzeAction(action, street.name, parsed, idx);
        analyzedActions.push(analyzedAction);
        if (evAnalysis && analyzedAction.isHero) {
          heroEvAnalyses.push(evAnalysis);
        }
      });
    }

    // Calculate aggregate stats using enhanced calculator
    const aggregateStats = calculateAggregateStats(heroEvAnalyses);

    // Legacy compatibility: calculate from analyzed actions if no EV analyses
    const heroActions = analyzedActions.filter(a => a.isHero);
    const totalEvLoss = heroActions.reduce((sum, a) => sum + (a.evLoss || 0), 0);

    const result: AnalysisResult = {
      success: true,
      hand: parsed,
      analyzedActions,
      summary: {
        totalEvLoss, // Legacy
        totalEvLossBB: aggregateStats.totalEvLossBB,
        averageEvLossBB: aggregateStats.averageEvLossBB,
        heroActionCount: heroActions.length,
        perfectActions: aggregateStats.perfectCount,
        goodActions: aggregateStats.goodCount,
        inaccuracies: aggregateStats.inaccuracyCount,
        mistakes: aggregateStats.mistakeCount,
        blunders: aggregateStats.blunderCount,
        overallRating: aggregateStats.overallRating,
        overallRatingEn: aggregateStats.overallRatingEn,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请重试' },
      { status: 500 }
    );
  }
}
