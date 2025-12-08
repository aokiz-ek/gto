/**
 * GTO Benchmark Frequencies
 *
 * This file contains GTO baseline frequencies for various actions
 * at different positions and scenarios. Used to compare user stats
 * and identify leaks in their game.
 *
 * All frequencies are percentages (0-100)
 */

import type { Position } from '../types';

// Action line categories
export type ActionLine =
  | 'rfi'           // Raise First In
  | '3bet'          // 3-bet when facing a raise
  | 'fold_to_3bet'  // Fold to 3-bet after raising
  | 'call_3bet'     // Call 3-bet
  | '4bet'          // 4-bet after being 3-bet
  | 'squeeze'       // 3-bet after raise and call
  | 'cbet_flop'     // Continuation bet on flop
  | 'cbet_turn'     // Continuation bet on turn (double barrel)
  | 'cbet_river'    // Continuation bet on river (triple barrel)
  | 'fold_to_cbet'  // Fold to continuation bet
  | 'raise_cbet'    // Raise continuation bet
  | 'donk_bet'      // Donk bet (bet into raiser)
  | 'probe_bet'     // Bet when checked to after checking flop
  | 'delayed_cbet'  // Bet turn after checking flop
  | 'check_raise'   // Check-raise
  | 'float'         // Call with intention to bluff later
  | 'overbet'       // Bet larger than pot
  | 'limp'          // Open limp (usually a leak)
  | 'cold_call'     // Call a raise without having money invested
  | 'blind_defense' // Defend big blind vs raise
  ;

// Street type
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Board texture categories
export type BoardTexture =
  | 'dry'           // Disconnected, rainbow (e.g., K72r)
  | 'wet'           // Connected, suited (e.g., JT9ss)
  | 'monotone'      // All same suit
  | 'paired'        // Paired board
  | 'high'          // High cards (Broadway heavy)
  | 'low'           // Low cards
  | 'dynamic'       // Draw-heavy, many turns change equity
  | 'static'        // Few cards change relative hand strength
  ;

// GTO Benchmark entry
export interface GTOBenchmark {
  action: ActionLine;
  position?: Position | 'all';
  vsPosition?: Position | 'all';
  street?: Street;
  boardTexture?: BoardTexture;
  frequency: number;      // GTO baseline frequency
  minRange: number;       // Lower bound of acceptable range
  maxRange: number;       // Upper bound of acceptable range
  description: string;    // Human readable description
  importance: 'critical' | 'high' | 'medium' | 'low'; // How important this stat is
  category: 'preflop' | 'postflop' | 'aggression' | 'defense';
}

// Preflop RFI (Raise First In) benchmarks by position
export const RFI_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'rfi',
    position: 'UTG',
    frequency: 14,
    minRange: 12,
    maxRange: 18,
    description: 'UTG RFI range should be tight (~14%)',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'rfi',
    position: 'HJ',
    frequency: 18,
    minRange: 15,
    maxRange: 22,
    description: 'HJ RFI range slightly wider (~18%)',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'rfi',
    position: 'CO',
    frequency: 27,
    minRange: 23,
    maxRange: 32,
    description: 'CO RFI range opens up (~27%)',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'rfi',
    position: 'BTN',
    frequency: 48,
    minRange: 42,
    maxRange: 55,
    description: 'BTN RFI should be wide (~48%)',
    importance: 'critical',
    category: 'preflop',
  },
  {
    action: 'rfi',
    position: 'SB',
    frequency: 52,
    minRange: 45,
    maxRange: 60,
    description: 'SB RFI vs BB (~52%)',
    importance: 'high',
    category: 'preflop',
  },
];

// 3-bet benchmarks by position matchup
export const THREE_BET_BENCHMARKS: GTOBenchmark[] = [
  // vs UTG
  {
    action: '3bet',
    position: 'HJ',
    vsPosition: 'UTG',
    frequency: 6,
    minRange: 4,
    maxRange: 8,
    description: 'HJ 3-bet vs UTG should be tight',
    importance: 'medium',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'CO',
    vsPosition: 'UTG',
    frequency: 5,
    minRange: 4,
    maxRange: 7,
    description: 'CO 3-bet vs UTG',
    importance: 'medium',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'BTN',
    vsPosition: 'UTG',
    frequency: 6,
    minRange: 4,
    maxRange: 9,
    description: 'BTN 3-bet vs UTG',
    importance: 'medium',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'SB',
    vsPosition: 'UTG',
    frequency: 7,
    minRange: 5,
    maxRange: 10,
    description: 'SB 3-bet vs UTG',
    importance: 'medium',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'BB',
    vsPosition: 'UTG',
    frequency: 8,
    minRange: 6,
    maxRange: 11,
    description: 'BB 3-bet vs UTG',
    importance: 'medium',
    category: 'preflop',
  },
  // vs CO
  {
    action: '3bet',
    position: 'BTN',
    vsPosition: 'CO',
    frequency: 10,
    minRange: 8,
    maxRange: 14,
    description: 'BTN 3-bet vs CO opens up',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'SB',
    vsPosition: 'CO',
    frequency: 11,
    minRange: 8,
    maxRange: 15,
    description: 'SB 3-bet vs CO',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'BB',
    vsPosition: 'CO',
    frequency: 12,
    minRange: 9,
    maxRange: 16,
    description: 'BB 3-bet vs CO',
    importance: 'high',
    category: 'preflop',
  },
  // vs BTN
  {
    action: '3bet',
    position: 'SB',
    vsPosition: 'BTN',
    frequency: 13,
    minRange: 10,
    maxRange: 18,
    description: 'SB 3-bet vs BTN should be frequent',
    importance: 'critical',
    category: 'preflop',
  },
  {
    action: '3bet',
    position: 'BB',
    vsPosition: 'BTN',
    frequency: 14,
    minRange: 11,
    maxRange: 19,
    description: 'BB 3-bet vs BTN should be frequent',
    importance: 'critical',
    category: 'preflop',
  },
  // vs SB
  {
    action: '3bet',
    position: 'BB',
    vsPosition: 'SB',
    frequency: 18,
    minRange: 14,
    maxRange: 24,
    description: 'BB 3-bet vs SB should be wide',
    importance: 'critical',
    category: 'preflop',
  },
];

// Fold to 3-bet benchmarks
export const FOLD_TO_3BET_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'fold_to_3bet',
    position: 'UTG',
    frequency: 55,
    minRange: 48,
    maxRange: 62,
    description: 'UTG fold to 3-bet (tight range folds less)',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'fold_to_3bet',
    position: 'HJ',
    frequency: 57,
    minRange: 50,
    maxRange: 65,
    description: 'HJ fold to 3-bet',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'fold_to_3bet',
    position: 'CO',
    frequency: 58,
    minRange: 52,
    maxRange: 66,
    description: 'CO fold to 3-bet',
    importance: 'high',
    category: 'preflop',
  },
  {
    action: 'fold_to_3bet',
    position: 'BTN',
    frequency: 60,
    minRange: 54,
    maxRange: 68,
    description: 'BTN fold to 3-bet (wide range folds more)',
    importance: 'critical',
    category: 'preflop',
  },
  {
    action: 'fold_to_3bet',
    position: 'SB',
    frequency: 58,
    minRange: 50,
    maxRange: 65,
    description: 'SB fold to 3-bet',
    importance: 'high',
    category: 'preflop',
  },
];

// Big Blind defense benchmarks
export const BB_DEFENSE_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'blind_defense',
    position: 'BB',
    vsPosition: 'UTG',
    frequency: 25,
    minRange: 20,
    maxRange: 32,
    description: 'BB defense vs UTG (tight)',
    importance: 'high',
    category: 'defense',
  },
  {
    action: 'blind_defense',
    position: 'BB',
    vsPosition: 'HJ',
    frequency: 30,
    minRange: 25,
    maxRange: 38,
    description: 'BB defense vs HJ',
    importance: 'high',
    category: 'defense',
  },
  {
    action: 'blind_defense',
    position: 'BB',
    vsPosition: 'CO',
    frequency: 38,
    minRange: 32,
    maxRange: 46,
    description: 'BB defense vs CO',
    importance: 'high',
    category: 'defense',
  },
  {
    action: 'blind_defense',
    position: 'BB',
    vsPosition: 'BTN',
    frequency: 48,
    minRange: 42,
    maxRange: 56,
    description: 'BB defense vs BTN (wide)',
    importance: 'critical',
    category: 'defense',
  },
  {
    action: 'blind_defense',
    position: 'BB',
    vsPosition: 'SB',
    frequency: 62,
    minRange: 55,
    maxRange: 72,
    description: 'BB defense vs SB (very wide)',
    importance: 'critical',
    category: 'defense',
  },
];

// C-bet benchmarks
export const CBET_BENCHMARKS: GTOBenchmark[] = [
  // Flop c-bet by board texture
  {
    action: 'cbet_flop',
    street: 'flop',
    boardTexture: 'dry',
    frequency: 65,
    minRange: 55,
    maxRange: 80,
    description: 'C-bet on dry flops should be frequent',
    importance: 'critical',
    category: 'postflop',
  },
  {
    action: 'cbet_flop',
    street: 'flop',
    boardTexture: 'wet',
    frequency: 40,
    minRange: 30,
    maxRange: 55,
    description: 'C-bet on wet boards more selectively',
    importance: 'critical',
    category: 'postflop',
  },
  {
    action: 'cbet_flop',
    street: 'flop',
    boardTexture: 'monotone',
    frequency: 35,
    minRange: 25,
    maxRange: 50,
    description: 'C-bet on monotone boards carefully',
    importance: 'high',
    category: 'postflop',
  },
  {
    action: 'cbet_flop',
    street: 'flop',
    boardTexture: 'paired',
    frequency: 55,
    minRange: 45,
    maxRange: 70,
    description: 'C-bet on paired boards moderately',
    importance: 'high',
    category: 'postflop',
  },
  // Turn c-bet (double barrel)
  {
    action: 'cbet_turn',
    street: 'turn',
    frequency: 50,
    minRange: 40,
    maxRange: 65,
    description: 'Turn c-bet (double barrel) after flop c-bet',
    importance: 'high',
    category: 'postflop',
  },
  // River c-bet (triple barrel)
  {
    action: 'cbet_river',
    street: 'river',
    frequency: 40,
    minRange: 30,
    maxRange: 55,
    description: 'River c-bet (triple barrel) frequency',
    importance: 'high',
    category: 'postflop',
  },
];

// Fold to c-bet benchmarks
export const FOLD_TO_CBET_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'fold_to_cbet',
    street: 'flop',
    frequency: 45,
    minRange: 35,
    maxRange: 55,
    description: 'Fold to flop c-bet (not too much)',
    importance: 'critical',
    category: 'defense',
  },
  {
    action: 'fold_to_cbet',
    street: 'turn',
    frequency: 40,
    minRange: 30,
    maxRange: 52,
    description: 'Fold to turn c-bet',
    importance: 'high',
    category: 'defense',
  },
  {
    action: 'fold_to_cbet',
    street: 'river',
    frequency: 50,
    minRange: 38,
    maxRange: 62,
    description: 'Fold to river c-bet',
    importance: 'high',
    category: 'defense',
  },
];

// Check-raise benchmarks
export const CHECK_RAISE_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'check_raise',
    street: 'flop',
    frequency: 8,
    minRange: 5,
    maxRange: 14,
    description: 'Flop check-raise frequency',
    importance: 'medium',
    category: 'aggression',
  },
  {
    action: 'check_raise',
    street: 'turn',
    frequency: 6,
    minRange: 3,
    maxRange: 12,
    description: 'Turn check-raise frequency',
    importance: 'medium',
    category: 'aggression',
  },
];

// Aggression benchmarks
export const AGGRESSION_BENCHMARKS: GTOBenchmark[] = [
  {
    action: 'donk_bet',
    frequency: 5,
    minRange: 0,
    maxRange: 12,
    description: 'Donk betting (usually low is better)',
    importance: 'low',
    category: 'aggression',
  },
  {
    action: 'probe_bet',
    street: 'turn',
    frequency: 30,
    minRange: 22,
    maxRange: 42,
    description: 'Probe bet when checked to on turn',
    importance: 'medium',
    category: 'aggression',
  },
  {
    action: 'delayed_cbet',
    street: 'turn',
    frequency: 45,
    minRange: 35,
    maxRange: 60,
    description: 'Delayed c-bet after checking flop',
    importance: 'medium',
    category: 'aggression',
  },
  {
    action: 'overbet',
    frequency: 8,
    minRange: 4,
    maxRange: 15,
    description: 'Overbet frequency',
    importance: 'low',
    category: 'aggression',
  },
];

// Leak indicators (things to avoid)
export const LEAK_INDICATORS: GTOBenchmark[] = [
  {
    action: 'limp',
    frequency: 0,
    minRange: 0,
    maxRange: 3,
    description: 'Open limping (major leak if > 3%)',
    importance: 'critical',
    category: 'preflop',
  },
  {
    action: 'cold_call',
    position: 'BTN',
    frequency: 8,
    minRange: 5,
    maxRange: 15,
    description: 'BTN cold call (should mostly 3-bet or fold)',
    importance: 'high',
    category: 'preflop',
  },
];

// Aggregate all benchmarks
export const ALL_BENCHMARKS: GTOBenchmark[] = [
  ...RFI_BENCHMARKS,
  ...THREE_BET_BENCHMARKS,
  ...FOLD_TO_3BET_BENCHMARKS,
  ...BB_DEFENSE_BENCHMARKS,
  ...CBET_BENCHMARKS,
  ...FOLD_TO_CBET_BENCHMARKS,
  ...CHECK_RAISE_BENCHMARKS,
  ...AGGRESSION_BENCHMARKS,
  ...LEAK_INDICATORS,
];

// Helper functions

/**
 * Get benchmark for a specific action and position
 */
export function getBenchmark(
  action: ActionLine,
  position?: Position,
  vsPosition?: Position,
  street?: Street,
  boardTexture?: BoardTexture
): GTOBenchmark | undefined {
  return ALL_BENCHMARKS.find(b =>
    b.action === action &&
    (!position || b.position === position || b.position === 'all') &&
    (!vsPosition || b.vsPosition === vsPosition || b.vsPosition === 'all') &&
    (!street || b.street === street) &&
    (!boardTexture || b.boardTexture === boardTexture)
  );
}

/**
 * Get all benchmarks for a category
 */
export function getBenchmarksByCategory(category: GTOBenchmark['category']): GTOBenchmark[] {
  return ALL_BENCHMARKS.filter(b => b.category === category);
}

/**
 * Evaluate user frequency against GTO benchmark
 * Returns: 'optimal' | 'acceptable' | 'leak_under' | 'leak_over'
 */
export type LeakSeverity = 'optimal' | 'acceptable' | 'minor_leak' | 'major_leak';

export interface LeakAnalysis {
  benchmark: GTOBenchmark;
  userFrequency: number;
  deviation: number;           // How far from GTO (can be negative)
  deviationPercent: number;    // Percentage deviation
  severity: LeakSeverity;
  direction: 'under' | 'over' | 'optimal';
  recommendation: string;
}

export function analyzeFrequency(
  userFrequency: number,
  benchmark: GTOBenchmark
): LeakAnalysis {
  const { frequency: gtoFreq, minRange, maxRange } = benchmark;
  const deviation = userFrequency - gtoFreq;
  const deviationPercent = Math.abs(deviation) / gtoFreq * 100;

  let severity: LeakSeverity;
  let direction: 'under' | 'over' | 'optimal';
  let recommendation: string;

  if (userFrequency >= minRange && userFrequency <= maxRange) {
    severity = Math.abs(deviation) < 3 ? 'optimal' : 'acceptable';
    direction = 'optimal';
    recommendation = '频率在合理范围内，保持当前策略';
  } else if (userFrequency < minRange) {
    direction = 'under';
    const gap = minRange - userFrequency;
    if (gap > 15 || deviationPercent > 50) {
      severity = 'major_leak';
      recommendation = `频率过低! 建议提高到 ${minRange}% 以上`;
    } else {
      severity = 'minor_leak';
      recommendation = `频率偏低，建议适当提高到 ${minRange}% 左右`;
    }
  } else {
    direction = 'over';
    const gap = userFrequency - maxRange;
    if (gap > 15 || deviationPercent > 50) {
      severity = 'major_leak';
      recommendation = `频率过高! 建议降低到 ${maxRange}% 以下`;
    } else {
      severity = 'minor_leak';
      recommendation = `频率偏高，建议适当降低到 ${maxRange}% 左右`;
    }
  }

  return {
    benchmark,
    userFrequency,
    deviation,
    deviationPercent,
    severity,
    direction,
    recommendation,
  };
}

/**
 * Analyze multiple user stats against benchmarks
 */
export interface UserStats {
  action: ActionLine;
  position?: Position;
  vsPosition?: Position;
  street?: Street;
  boardTexture?: BoardTexture;
  frequency: number;
  sampleSize: number;
}

export function analyzeUserStats(stats: UserStats[]): LeakAnalysis[] {
  const analyses: LeakAnalysis[] = [];

  for (const stat of stats) {
    const benchmark = getBenchmark(
      stat.action,
      stat.position,
      stat.vsPosition,
      stat.street,
      stat.boardTexture
    );

    if (benchmark && stat.sampleSize >= 20) { // Minimum sample size for meaningful analysis
      analyses.push(analyzeFrequency(stat.frequency, benchmark));
    }
  }

  // Sort by severity (major_leak first) and then by importance
  const severityOrder: Record<LeakSeverity, number> = {
    major_leak: 0,
    minor_leak: 1,
    acceptable: 2,
    optimal: 3,
  };

  const importanceOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  analyses.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return importanceOrder[a.benchmark.importance] - importanceOrder[b.benchmark.importance];
  });

  return analyses;
}

/**
 * Get summary of leaks by category
 */
export interface LeakSummary {
  category: GTOBenchmark['category'];
  totalStats: number;
  optimalCount: number;
  acceptableCount: number;
  minorLeakCount: number;
  majorLeakCount: number;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export function summarizeLeaks(analyses: LeakAnalysis[]): LeakSummary[] {
  const categories: GTOBenchmark['category'][] = ['preflop', 'postflop', 'aggression', 'defense'];

  return categories.map(category => {
    const categoryAnalyses = analyses.filter(a => a.benchmark.category === category);
    const total = categoryAnalyses.length;

    if (total === 0) {
      return {
        category,
        totalStats: 0,
        optimalCount: 0,
        acceptableCount: 0,
        minorLeakCount: 0,
        majorLeakCount: 0,
        score: 0,
        grade: 'F' as const,
      };
    }

    const optimalCount = categoryAnalyses.filter(a => a.severity === 'optimal').length;
    const acceptableCount = categoryAnalyses.filter(a => a.severity === 'acceptable').length;
    const minorLeakCount = categoryAnalyses.filter(a => a.severity === 'minor_leak').length;
    const majorLeakCount = categoryAnalyses.filter(a => a.severity === 'major_leak').length;

    // Score calculation: optimal=100, acceptable=80, minor=50, major=20
    const score = Math.round(
      (optimalCount * 100 + acceptableCount * 80 + minorLeakCount * 50 + majorLeakCount * 20) / total
    );

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 45) grade = 'D';
    else grade = 'F';

    return {
      category,
      totalStats: total,
      optimalCount,
      acceptableCount,
      minorLeakCount,
      majorLeakCount,
      score,
      grade,
    };
  });
}

/**
 * Generate personalized training recommendations based on leaks
 */
export interface TrainingRecommendation {
  priority: number;
  category: GTOBenchmark['category'];
  action: ActionLine;
  title: string;
  description: string;
  suggestedScenarios: string[];
}

export function generateTrainingRecommendations(
  analyses: LeakAnalysis[]
): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];

  // Focus on major leaks first
  const majorLeaks = analyses.filter(a => a.severity === 'major_leak');
  const minorLeaks = analyses.filter(a => a.severity === 'minor_leak');

  for (const leak of majorLeaks.slice(0, 3)) {
    const rec = createRecommendation(leak, 1);
    if (rec) recommendations.push(rec);
  }

  for (const leak of minorLeaks.slice(0, 2)) {
    const rec = createRecommendation(leak, 2);
    if (rec) recommendations.push(rec);
  }

  return recommendations;
}

function createRecommendation(
  leak: LeakAnalysis,
  priority: number
): TrainingRecommendation | null {
  const { benchmark, direction } = leak;
  const { action, category, position } = benchmark;

  const actionDescriptions: Record<ActionLine, string> = {
    rfi: 'RFI (Raise First In)',
    '3bet': '3-Bet',
    fold_to_3bet: 'Fold to 3-Bet',
    call_3bet: 'Call 3-Bet',
    '4bet': '4-Bet',
    squeeze: 'Squeeze',
    cbet_flop: 'Flop C-Bet',
    cbet_turn: 'Turn C-Bet',
    cbet_river: 'River C-Bet',
    fold_to_cbet: 'Fold to C-Bet',
    raise_cbet: 'Raise C-Bet',
    donk_bet: 'Donk Bet',
    probe_bet: 'Probe Bet',
    delayed_cbet: 'Delayed C-Bet',
    check_raise: 'Check-Raise',
    float: 'Float',
    overbet: 'Overbet',
    limp: 'Open Limp',
    cold_call: 'Cold Call',
    blind_defense: 'Blind Defense',
  };

  const scenarioSuggestions: Record<ActionLine, string[]> = {
    rfi: ['翻前 RFI 训练', '位置感知训练'],
    '3bet': ['3-Bet 范围训练', 'vs RFI 决策练习'],
    fold_to_3bet: ['面对 3-Bet 决策', '4-Bet/Fold/Call 平衡'],
    call_3bet: ['3-Bet Pot 翻后训练', 'IP vs OOP 3-Bet Pot'],
    '4bet': ['4-Bet 范围构建', '4-Bet Pot 翻后'],
    squeeze: ['Squeeze 机会识别', '多人底池 3-Bet'],
    cbet_flop: ['翻牌 C-Bet 频率', '牌面分析训练'],
    cbet_turn: ['双管策略训练', '转牌延续下注'],
    cbet_river: ['三管策略训练', '河牌价值下注'],
    fold_to_cbet: ['C-Bet 防守训练', '浮游策略'],
    raise_cbet: ['Check-Raise C-Bet', '反击策略'],
    donk_bet: ['领先下注场景', '主动权争夺'],
    probe_bet: ['探测下注', '位置利用'],
    delayed_cbet: ['延迟 C-Bet', '控制底池'],
    check_raise: ['Check-Raise 训练', '慢打策略'],
    float: ['浮游策略', 'IP 打法'],
    overbet: ['超池下注', '极化范围'],
    limp: ['避免翻前 Limp', '主动开池'],
    cold_call: ['冷跟注 vs 3-Bet', '位置选择'],
    blind_defense: ['大盲防守', 'vs BTN/SB 策略'],
  };

  const posStr = position ? ` (${position})` : '';
  const dirStr = direction === 'under' ? '频率过低' : direction === 'over' ? '频率过高' : '';

  return {
    priority,
    category,
    action,
    title: `${actionDescriptions[action]}${posStr} ${dirStr}`,
    description: leak.recommendation,
    suggestedScenarios: scenarioSuggestions[action] || [],
  };
}
