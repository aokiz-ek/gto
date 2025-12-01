/**
 * GTO Preflop Range Data
 * Based on 6-max Cash Game, 200bb deep
 *
 * Hand notation:
 * - Pairs: AA, KK, QQ, etc.
 * - Suited: AKs, AQs, etc. (higher card first)
 * - Offsuit: AKo, AQo, etc. (higher card first)
 *
 * Frequencies are 0-100 (percentage)
 * EV values are in BB (big blinds)
 */

import type { GTOHandStrategy, GTOStrategy, GTOScenario, GTOAction, Position } from '../types';

// All 169 starting hands in standard order
export const ALL_HANDS = [
  // Row 1: Ax
  'AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  // Row 2: Kx
  'AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  // Row 3: Qx
  'AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  // Row 4: Jx
  'AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  // Row 5: Tx
  'ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  // Row 6: 9x
  'A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s',
  // Row 7: 8x
  'A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s',
  // Row 8: 7x
  'A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s',
  // Row 9: 6x
  'A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s',
  // Row 10: 5x
  'A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s',
  // Row 11: 4x
  'A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s',
  // Row 12: 3x
  'A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s',
  // Row 13: 2x
  'A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22',
];

// Get combo count for a hand
export function getComboCount(hand: string): number {
  if (hand.length === 2) return 6; // Pairs: AA, KK, etc.
  if (hand.endsWith('s')) return 4; // Suited
  return 12; // Offsuit
}

// Helper to create hand strategy
function h(
  hand: string,
  actions: Array<{ action: 'fold' | 'call' | 'raise' | 'allin'; frequency: number; size?: number; ev: number }>
): GTOHandStrategy {
  return {
    hand,
    actions,
    totalCombos: getComboCount(hand),
    equity: calculateEquity(hand, actions),
  };
}

// Calculate equity based on actions (simplified)
function calculateEquity(hand: string, actions: Array<{ frequency: number; ev: number }>): number {
  // Higher EV generally means higher equity
  const avgEV = actions.reduce((sum, a) => sum + a.frequency * a.ev, 0) / 100;
  // Map EV to equity range (this is simplified, real equity depends on opponent ranges)
  return Math.min(100, Math.max(0, 50 + avgEV * 5));
}

// ============================================
// UTG (Under The Gun) - Tightest position
// ============================================
const UTG_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs - Always raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.45 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.92 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.45 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.05 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  '77': h('77', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '66': h('66', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '55': h('55', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.35 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 20, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Connectors (limited at UTG)
  'T9s': h('T9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '98s': h('98s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '87s': h('87s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76s': h('76s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65s': h('65s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54s': h('54s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Aces (wheel)
  'A9s': h('A9s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K8s': h('K8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Rest are folds - generate them
  ...generateFolds([
    'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '97s', '96s', '95s', '94s', '93s', '92s',
    '86s', '85s', '84s', '83s', '82s',
    '75s', '74s', '73s', '72s',
    '64s', '63s', '62s',
    '53s', '52s',
    '43s', '42s',
    '32s',
    // Offsuit hands
    'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
    'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
    'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
    'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
    'T9o', 'T8o', 'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
    '98o', '97o', '96o', '95o', '94o', '93o', '92o',
    '87o', '86o', '85o', '84o', '83o', '82o',
    '76o', '75o', '74o', '73o', '72o',
    '65o', '64o', '63o', '62o',
    '54o', '53o', '52o',
    '43o', '42o',
    '32o',
  ]),
};

// ============================================
// HJ (Hijack) - Second tightest
// ============================================
const HJ_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs - Always raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.52 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.98 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.52 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.12 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  '66': h('66', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '55': h('55', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.42 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.02 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.02 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Connectors
  'T9s': h('T9s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '87s': h('87s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76s': h('76s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65s': h('65s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54s': h('54s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Aces
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K8s': h('K8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Rest folded
  ...generateFolds([
    'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '97s', '96s', '95s', '94s', '93s', '92s',
    '86s', '85s', '84s', '83s', '82s',
    '75s', '74s', '73s', '72s',
    '64s', '63s', '62s',
    '53s', '52s',
    '43s', '42s',
    '32s',
    // Offsuit
    'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
    'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
    'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
    'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
    'T9o', 'T8o', 'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
    '98o', '97o', '96o', '95o', '94o', '93o', '92o',
    '87o', '86o', '85o', '84o', '83o', '82o',
    '76o', '75o', '74o', '73o', '72o',
    '65o', '64o', '63o', '62o',
    '54o', '53o', '52o',
    '43o', '42o',
    '32o',
  ]),
};

// ============================================
// CO (Cutoff) - Looser position
// ============================================
const CO_RFI: Record<string, GTOHandStrategy> = {
  // Pairs - All raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.65 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.12 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.65 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.25 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  '44': h('44', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '33': h('33', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '22': h('22', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.55 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.15 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.15 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),

  // Suited Connectors
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.12 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.10 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),

  // Suited Aces - All raise
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Tens
  'T8s': h('T8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited 9s
  '97s': h('97s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '96s': h('96s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited 8s and below
  '86s': h('86s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '85s': h('85s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '74s': h('74s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '63s': h('63s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53s': h('53s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '43s': h('43s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit Aces
  'A9o': h('A9o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Other offsuit folds
  ...generateFolds([
    'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
    'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
    'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
    'T9o', 'T8o', 'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
    '98o', '97o', '96o', '95o', '94o', '93o', '92o',
    '87o', '86o', '85o', '84o', '83o', '82o',
    '76o', '75o', '74o', '73o', '72o',
    '65o', '64o', '63o', '62o',
    '54o', '53o', '52o',
    '43o', '42o',
    '32o',
  ]),
};

// ============================================
// BTN (Button) - Loosest position
// ============================================
const BTN_RFI: Record<string, GTOHandStrategy> = {
  // Pairs - All raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.85 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.32 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.85 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.45 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.12 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.82 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '44': h('44', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  '33': h('33', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  '22': h('22', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.72 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.32 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.05 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.32 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),

  // Suited Connectors - All raise
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.20 }]),

  // Suited Aces - All raise
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),

  // Suited Kings - All raise
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.20 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'Q7s': h('Q7s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.20 }]),
  'J7s': h('J7s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Tens
  'T8s': h('T8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'T7s': h('T7s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited 9s
  '97s': h('97s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  '96s': h('96s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '95s': h('95s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited 8s and below
  '86s': h('86s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  '85s': h('85s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.12 }]),
  '74s': h('74s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.10 }]),
  '63s': h('63s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53s': h('53s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.08 }]),
  '52s': h('52s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '43s': h('43s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '42s': h('42s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '32s': h('32s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Offsuit Aces
  'A9o': h('A9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.20 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),

  // Offsuit Kings
  'K9o': h('K9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'K8o': h('K8o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit Queens
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  'Q8o': h('Q8o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit Jacks
  'J9o': h('J9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.12 }]),
  'J8o': h('J8o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit Tens
  'T9o': h('T9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  'T8o': h('T8o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Rest offsuit folds
  ...generateFolds([
    '98o', '97o', '96o', '95o', '94o', '93o', '92o',
    '87o', '86o', '85o', '84o', '83o', '82o',
    '76o', '75o', '74o', '73o', '72o',
    '65o', '64o', '63o', '62o',
    '54o', '53o', '52o',
    '43o', '42o',
    '32o',
  ]),
};

// ============================================
// SB (Small Blind) - Special position
// ============================================
const SB_RFI: Record<string, GTOHandStrategy> = {
  // Pairs - Mix of raise and limp at deep stacks
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3, ev: 2.95 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3, ev: 2.42 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3, ev: 1.95 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 3, ev: 1.55 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 3, ev: 1.22 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 3, ev: 0.92 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 3, ev: 0.72 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 3, ev: 0.58 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  '44': h('44', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  '33': h('33', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  '22': h('22', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.82 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.42 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.15 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.98 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.02 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.85 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.72 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.75 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.62 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.58 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3, ev: 1.42 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 3, ev: 1.02 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.78 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.62 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.68 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.52 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),

  // Suited Connectors - All raise in SB
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.30 }]),

  // Suited Aces - All raise
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.62 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.55 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.52 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.55 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.52 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.45 }]),

  // Suited Kings - All raise
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.30 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'Q7s': h('Q7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  'Q4s': h('Q4s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  'Q3s': h('Q3s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  'Q2s': h('Q2s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.30 }]),
  'J7s': h('J7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  'J6s': h('J6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  'J5s': h('J5s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  'J4s': h('J4s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  'J3s': h('J3s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.08 }]),
  'J2s': h('J2s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),

  // Suited Tens
  'T8s': h('T8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'T7s': h('T7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  'T6s': h('T6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  'T5s': h('T5s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'raise', frequency: 75, size: 3, ev: 0.05 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'raise', frequency: 65, size: 3, ev: 0.03 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited 9s
  '97s': h('97s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  '96s': h('96s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.20 }]),
  '95s': h('95s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  '94s': h('94s', [{ action: 'raise', frequency: 75, size: 3, ev: 0.05 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '93s': h('93s', [{ action: 'raise', frequency: 65, size: 3, ev: 0.03 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '92s': h('92s', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited 8s and below
  '86s': h('86s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.25 }]),
  '85s': h('85s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  '84s': h('84s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '83s': h('83s', [{ action: 'raise', frequency: 65, size: 3, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '82s': h('82s', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  '74s': h('74s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  '73s': h('73s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '72s': h('72s', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.20 }]),
  '63s': h('63s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  '62s': h('62s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '53s': h('53s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  '52s': h('52s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  '43s': h('43s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  '42s': h('42s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  '32s': h('32s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.10 }]),

  // Offsuit Aces
  'A9o': h('A9o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.30 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.25 }]),

  // Offsuit Kings
  'K9o': h('K9o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'K8o': h('K8o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.20 }]),
  'K7o': h('K7o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  'K6o': h('K6o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  'K5o': h('K5o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  'K4o': h('K4o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.10 }]),
  'K3o': h('K3o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.08 }]),
  'K2o': h('K2o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.05 }]),

  // Offsuit Queens
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.25 }]),
  'Q8o': h('Q8o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  'Q7o': h('Q7o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  'Q6o': h('Q6o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.08 }]),
  'Q5o': h('Q5o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.05 }]),
  'Q4o': h('Q4o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.03 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.02 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.01 }, { action: 'fold', frequency: 35, ev: 0 }]),

  // Offsuit Jacks
  'J9o': h('J9o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  'J8o': h('J8o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  'J7o': h('J7o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.10 }]),
  'J6o': h('J6o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.03 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.02 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.01 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit Tens
  'T9o': h('T9o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.25 }]),
  'T8o': h('T8o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  'T7o': h('T7o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  'T6o': h('T6o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.02 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.01 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit 9s
  '98o': h('98o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  '97o': h('97o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  '96o': h('96o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '95o': h('95o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.02 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit 8s
  '87o': h('87o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  '86o': h('86o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.10 }]),
  '85o': h('85o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.05 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '84o': h('84o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit 7s
  '76o': h('76o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  '75o': h('75o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '74o': h('74o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.03 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Offsuit 6s and below
  '65o': h('65o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.10 }]),
  '64o': h('64o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '63o': h('63o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54o': h('54o', [{ action: 'raise', frequency: 100, size: 3, ev: 0.08 }]),
  '53o': h('53o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.03 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '52o': h('52o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.01 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '43o': h('43o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '42o': h('42o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '32o': h('32o', [{ action: 'raise', frequency: 50, size: 3, ev: 0.01 }, { action: 'fold', frequency: 50, ev: 0 }]),
};

// Helper to generate fold strategies
function generateFolds(hands: string[]): Record<string, GTOHandStrategy> {
  const result: Record<string, GTOHandStrategy> = {};
  for (const hand of hands) {
    result[hand] = h(hand, [{ action: 'fold', frequency: 100, ev: 0 }]);
  }
  return result;
}

// Calculate summary stats for a range
function calculateSummary(ranges: Record<string, GTOHandStrategy>) {
  let totalHands = 0;
  let playableHands = 0;
  let totalRaiseFreq = 0;
  let totalCallFreq = 0;
  let totalFoldFreq = 0;
  let totalAllinFreq = 0;
  let totalEV = 0;
  let totalCombos = 0;

  for (const strategy of Object.values(ranges)) {
    const combos = strategy.totalCombos;
    totalCombos += combos;
    totalHands++;

    const raiseAction = strategy.actions.find(a => a.action === 'raise');
    const callAction = strategy.actions.find(a => a.action === 'call');
    const foldAction = strategy.actions.find(a => a.action === 'fold');
    const allinAction = strategy.actions.find(a => a.action === 'allin');

    const raiseFreq = raiseAction?.frequency || 0;
    const callFreq = callAction?.frequency || 0;
    const foldFreq = foldAction?.frequency || 0;
    const allinFreq = allinAction?.frequency || 0;

    if (raiseFreq > 0 || callFreq > 0 || allinFreq > 0) {
      playableHands++;
    }

    totalRaiseFreq += raiseFreq * combos;
    totalCallFreq += callFreq * combos;
    totalFoldFreq += foldFreq * combos;
    totalAllinFreq += allinFreq * combos;

    // Calculate weighted EV
    const ev = strategy.actions.reduce((sum, a) => sum + (a.frequency / 100) * a.ev, 0);
    totalEV += ev * combos;
  }

  return {
    totalHands,
    playableHands,
    raiseFreq: Math.round(totalRaiseFreq / totalCombos),
    callFreq: Math.round(totalCallFreq / totalCombos),
    foldFreq: Math.round(totalFoldFreq / totalCombos),
    allinFreq: Math.round(totalAllinFreq / totalCombos),
    avgEV: Math.round((totalEV / totalCombos) * 100) / 100,
  };
}

// Create scenarios
function createScenario(position: Position): GTOScenario {
  return {
    id: `6max-cash-200bb-rfi-${position.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 200,
    tableSize: 6,
    position,
    actionLine: { type: 'rfi' },
  };
}

// ============================================
// VS RFI Scenarios - Facing a raise
// ============================================

// BB vs BTN RFI (most common scenario)
const BB_VS_BTN_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs - 3-bet for value
  'AA': h('AA', [{ action: 'raise', frequency: 85, size: 11, ev: 3.2 }, { action: 'call', frequency: 15, ev: 2.8 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 80, size: 11, ev: 2.6 }, { action: 'call', frequency: 20, ev: 2.2 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 65, size: 11, ev: 1.8 }, { action: 'call', frequency: 35, ev: 1.5 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 50, size: 11, ev: 1.2 }, { action: 'call', frequency: 50, ev: 1.0 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 35, size: 11, ev: 0.8 }, { action: 'call', frequency: 65, ev: 0.7 }]),
  '99': h('99', [{ action: 'raise', frequency: 25, size: 11, ev: 0.5 }, { action: 'call', frequency: 75, ev: 0.45 }]),
  '88': h('88', [{ action: 'call', frequency: 100, ev: 0.35 }]),
  '77': h('77', [{ action: 'call', frequency: 100, ev: 0.28 }]),
  '66': h('66', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  '55': h('55', [{ action: 'call', frequency: 100, ev: 0.18 }]),
  '44': h('44', [{ action: 'call', frequency: 100, ev: 0.15 }]),
  '33': h('33', [{ action: 'call', frequency: 85, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),

  // Broadway Suited - Mix of 3-bet and call
  'AKs': h('AKs', [{ action: 'raise', frequency: 75, size: 11, ev: 1.8 }, { action: 'call', frequency: 25, ev: 1.5 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 55, size: 11, ev: 1.2 }, { action: 'call', frequency: 45, ev: 1.0 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 45, size: 11, ev: 0.85 }, { action: 'call', frequency: 55, ev: 0.75 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 35, size: 11, ev: 0.6 }, { action: 'call', frequency: 65, ev: 0.55 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.45 }, { action: 'call', frequency: 70, ev: 0.42 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 25, size: 11, ev: 0.38 }, { action: 'call', frequency: 75, ev: 0.35 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.32 }, { action: 'call', frequency: 70, ev: 0.30 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.28 }, { action: 'call', frequency: 65, ev: 0.25 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 45, size: 11, ev: 0.35 }, { action: 'call', frequency: 55, ev: 0.32 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 40, size: 11, ev: 0.30 }, { action: 'call', frequency: 60, ev: 0.28 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.25 }, { action: 'call', frequency: 65, ev: 0.22 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.20 }, { action: 'call', frequency: 70, ev: 0.18 }]),

  'KQs': h('KQs', [{ action: 'raise', frequency: 50, size: 11, ev: 0.75 }, { action: 'call', frequency: 50, ev: 0.68 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 40, size: 11, ev: 0.55 }, { action: 'call', frequency: 60, ev: 0.50 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 30, size: 11, ev: 0.42 }, { action: 'call', frequency: 70, ev: 0.38 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.30 }, { action: 'call', frequency: 80, ev: 0.28 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 100, ev: 0.18 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 100, ev: 0.15 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.15 }, { action: 'call', frequency: 80, ev: 0.12 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.12 }, { action: 'call', frequency: 85, ev: 0.10 }]),
  'K3s': h('K3s', [{ action: 'call', frequency: 90, ev: 0.08 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'call', frequency: 85, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),

  'QJs': h('QJs', [{ action: 'raise', frequency: 35, size: 11, ev: 0.48 }, { action: 'call', frequency: 65, ev: 0.42 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 25, size: 11, ev: 0.38 }, { action: 'call', frequency: 75, ev: 0.35 }]),
  'Q9s': h('Q9s', [{ action: 'call', frequency: 100, ev: 0.28 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  'Q7s': h('Q7s', [{ action: 'call', frequency: 90, ev: 0.15 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'call', frequency: 85, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'call', frequency: 80, ev: 0.10 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'call', frequency: 70, ev: 0.05 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'call', frequency: 65, ev: 0.03 }, { action: 'fold', frequency: 35, ev: 0 }]),

  'JTs': h('JTs', [{ action: 'raise', frequency: 30, size: 11, ev: 0.42 }, { action: 'call', frequency: 70, ev: 0.38 }]),
  'J9s': h('J9s', [{ action: 'call', frequency: 100, ev: 0.30 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  'J7s': h('J7s', [{ action: 'call', frequency: 90, ev: 0.15 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'call', frequency: 80, ev: 0.10 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'call', frequency: 70, ev: 0.08 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'call', frequency: 60, ev: 0.05 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'call', frequency: 50, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9s': h('T9s', [{ action: 'raise', frequency: 25, size: 11, ev: 0.35 }, { action: 'call', frequency: 75, ev: 0.32 }]),
  'T8s': h('T8s', [{ action: 'call', frequency: 100, ev: 0.25 }]),
  'T7s': h('T7s', [{ action: 'call', frequency: 85, ev: 0.18 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'call', frequency: 70, ev: 0.12 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98s': h('98s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.30 }, { action: 'call', frequency: 80, ev: 0.28 }]),
  '97s': h('97s', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  '96s': h('96s', [{ action: 'call', frequency: 85, ev: 0.15 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '95s': h('95s', [{ action: 'call', frequency: 65, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87s': h('87s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.25 }, { action: 'call', frequency: 85, ev: 0.22 }]),
  '86s': h('86s', [{ action: 'call', frequency: 100, ev: 0.18 }]),
  '85s': h('85s', [{ action: 'call', frequency: 80, ev: 0.12 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '84s': h('84s', [{ action: 'call', frequency: 60, ev: 0.05 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76s': h('76s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.22 }, { action: 'call', frequency: 85, ev: 0.20 }]),
  '75s': h('75s', [{ action: 'call', frequency: 100, ev: 0.15 }]),
  '74s': h('74s', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65s': h('65s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.20 }, { action: 'call', frequency: 85, ev: 0.18 }]),
  '64s': h('64s', [{ action: 'call', frequency: 100, ev: 0.12 }]),
  '63s': h('63s', [{ action: 'call', frequency: 70, ev: 0.05 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54s': h('54s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.18 }, { action: 'call', frequency: 85, ev: 0.15 }]),
  '53s': h('53s', [{ action: 'call', frequency: 85, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '52s': h('52s', [{ action: 'call', frequency: 65, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),

  '43s': h('43s', [{ action: 'call', frequency: 80, ev: 0.08 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '42s': h('42s', [{ action: 'call', frequency: 60, ev: 0.03 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '32s': h('32s', [{ action: 'call', frequency: 55, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 70, size: 11, ev: 1.5 }, { action: 'call', frequency: 30, ev: 1.2 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 45, size: 11, ev: 0.9 }, { action: 'call', frequency: 55, ev: 0.75 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 30, size: 11, ev: 0.55 }, { action: 'call', frequency: 70, ev: 0.48 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 100, ev: 0.35 }]),
  'A9o': h('A9o', [{ action: 'call', frequency: 100, ev: 0.25 }]),
  'A8o': h('A8o', [{ action: 'call', frequency: 100, ev: 0.20 }]),
  'A7o': h('A7o', [{ action: 'call', frequency: 90, ev: 0.15 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'call', frequency: 85, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'call', frequency: 90, ev: 0.15 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'call', frequency: 85, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'call', frequency: 80, ev: 0.10 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),

  'KQo': h('KQo', [{ action: 'raise', frequency: 35, size: 11, ev: 0.50 }, { action: 'call', frequency: 65, ev: 0.42 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 20, size: 11, ev: 0.32 }, { action: 'call', frequency: 80, ev: 0.28 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 100, ev: 0.22 }]),
  'K9o': h('K9o', [{ action: 'call', frequency: 90, ev: 0.15 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'call', frequency: 60, ev: 0.05 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'call', frequency: 50, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJo': h('QJo', [{ action: 'raise', frequency: 20, size: 11, ev: 0.28 }, { action: 'call', frequency: 80, ev: 0.25 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 100, ev: 0.20 }]),
  'Q9o': h('Q9o', [{ action: 'call', frequency: 85, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'call', frequency: 65, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTo': h('JTo', [{ action: 'call', frequency: 100, ev: 0.18 }]),
  'J9o': h('J9o', [{ action: 'call', frequency: 80, ev: 0.10 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'call', frequency: 60, ev: 0.05 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9o': h('T9o', [{ action: 'call', frequency: 90, ev: 0.12 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'call', frequency: 70, ev: 0.05 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98o': h('98o', [{ action: 'call', frequency: 75, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '97o': h('97o', [{ action: 'call', frequency: 55, ev: 0.03 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87o': h('87o', [{ action: 'call', frequency: 65, ev: 0.05 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '86o': h('86o', [{ action: 'call', frequency: 45, ev: 0.02 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76o': h('76o', [{ action: 'call', frequency: 55, ev: 0.03 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65o': h('65o', [{ action: 'call', frequency: 45, ev: 0.02 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54o': h('54o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// Create scenario for vs RFI
function createVsRFIScenario(position: Position, vsPosition: Position): GTOScenario {
  return {
    id: `6max-cash-200bb-vs-rfi-${position.toLowerCase()}-vs-${vsPosition.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 200,
    tableSize: 6,
    position,
    actionLine: { type: 'vs_rfi', raiserPosition: vsPosition },
    vsPosition,
  };
}

// Export all RFI strategies
export const GTO_RANGES: Record<string, GTOStrategy> = {
  'UTG': {
    scenario: createScenario('UTG'),
    ranges: UTG_RFI,
    summary: calculateSummary(UTG_RFI),
  },
  'HJ': {
    scenario: createScenario('HJ'),
    ranges: HJ_RFI,
    summary: calculateSummary(HJ_RFI),
  },
  'CO': {
    scenario: createScenario('CO'),
    ranges: CO_RFI,
    summary: calculateSummary(CO_RFI),
  },
  'BTN': {
    scenario: createScenario('BTN'),
    ranges: BTN_RFI,
    summary: calculateSummary(BTN_RFI),
  },
  'SB': {
    scenario: createScenario('SB'),
    ranges: SB_RFI,
    summary: calculateSummary(SB_RFI),
  },
};

// BB vs CO RFI - Tighter defense range, more 3-bet bluffs needed
const BB_VS_CO_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs - More 3-betting vs CO's wider range
  'AA': h('AA', [{ action: 'raise', frequency: 88, size: 11, ev: 3.3 }, { action: 'call', frequency: 12, ev: 2.9 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 85, size: 11, ev: 2.7 }, { action: 'call', frequency: 15, ev: 2.3 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 70, size: 11, ev: 1.9 }, { action: 'call', frequency: 30, ev: 1.6 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 55, size: 11, ev: 1.3 }, { action: 'call', frequency: 45, ev: 1.1 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 40, size: 11, ev: 0.9 }, { action: 'call', frequency: 60, ev: 0.75 }]),
  '99': h('99', [{ action: 'raise', frequency: 30, size: 11, ev: 0.55 }, { action: 'call', frequency: 70, ev: 0.48 }]),
  '88': h('88', [{ action: 'call', frequency: 95, ev: 0.38 }, { action: 'fold', frequency: 5, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 90, ev: 0.30 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 85, ev: 0.24 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 80, ev: 0.18 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 70, ev: 0.14 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '33': h('33', [{ action: 'call', frequency: 60, ev: 0.08 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 50, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 80, size: 11, ev: 1.9 }, { action: 'call', frequency: 20, ev: 1.6 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 60, size: 11, ev: 1.3 }, { action: 'call', frequency: 40, ev: 1.1 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 50, size: 11, ev: 0.9 }, { action: 'call', frequency: 50, ev: 0.8 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 40, size: 11, ev: 0.65 }, { action: 'call', frequency: 60, ev: 0.58 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.48 }, { action: 'call', frequency: 65, ev: 0.44 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.40 }, { action: 'call', frequency: 70, ev: 0.36 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.35 }, { action: 'call', frequency: 65, ev: 0.32 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 38, size: 11, ev: 0.30 }, { action: 'call', frequency: 62, ev: 0.26 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 50, size: 11, ev: 0.38 }, { action: 'call', frequency: 50, ev: 0.34 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 45, size: 11, ev: 0.32 }, { action: 'call', frequency: 55, ev: 0.29 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 38, size: 11, ev: 0.26 }, { action: 'call', frequency: 62, ev: 0.23 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 32, size: 11, ev: 0.21 }, { action: 'call', frequency: 68, ev: 0.18 }]),

  'KQs': h('KQs', [{ action: 'raise', frequency: 55, size: 11, ev: 0.78 }, { action: 'call', frequency: 45, ev: 0.70 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 45, size: 11, ev: 0.55 }, { action: 'call', frequency: 55, ev: 0.48 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 38, size: 11, ev: 0.42 }, { action: 'call', frequency: 62, ev: 0.38 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.28 }, { action: 'call', frequency: 70, ev: 0.25 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 70, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 60, ev: 0.10 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 55, ev: 0.08 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'call', frequency: 50, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'call', frequency: 30, ev: -0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'call', frequency: 20, ev: -0.05 }, { action: 'fold', frequency: 80, ev: 0 }]),

  'QJs': h('QJs', [{ action: 'raise', frequency: 40, size: 11, ev: 0.48 }, { action: 'call', frequency: 60, ev: 0.42 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 35, size: 11, ev: 0.38 }, { action: 'call', frequency: 65, ev: 0.34 }]),
  'Q9s': h('Q9s', [{ action: 'call', frequency: 85, ev: 0.20 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 65, ev: 0.10 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'call', frequency: 35, ev: -0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'call', frequency: 30, ev: -0.05 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTs': h('JTs', [{ action: 'raise', frequency: 35, size: 11, ev: 0.40 }, { action: 'call', frequency: 65, ev: 0.36 }]),
  'J9s': h('J9s', [{ action: 'call', frequency: 90, ev: 0.22 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 65, ev: 0.10 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9s': h('T9s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.32 }, { action: 'call', frequency: 70, ev: 0.28 }]),
  'T8s': h('T8s', [{ action: 'call', frequency: 80, ev: 0.15 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'call', frequency: 45, ev: 0.05 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98s': h('98s', [{ action: 'raise', frequency: 25, size: 11, ev: 0.25 }, { action: 'call', frequency: 75, ev: 0.22 }]),
  '97s': h('97s', [{ action: 'call', frequency: 70, ev: 0.12 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '96s': h('96s', [{ action: 'call', frequency: 40, ev: 0.04 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87s': h('87s', [{ action: 'raise', frequency: 22, size: 11, ev: 0.20 }, { action: 'call', frequency: 78, ev: 0.18 }]),
  '86s': h('86s', [{ action: 'call', frequency: 65, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '85s': h('85s', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76s': h('76s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.15 }, { action: 'call', frequency: 80, ev: 0.14 }]),
  '75s': h('75s', [{ action: 'call', frequency: 55, ev: 0.06 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '74s': h('74s', [{ action: 'call', frequency: 25, ev: -0.02 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65s': h('65s', [{ action: 'raise', frequency: 18, size: 11, ev: 0.12 }, { action: 'call', frequency: 82, ev: 0.10 }]),
  '64s': h('64s', [{ action: 'call', frequency: 50, ev: 0.03 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '63s': h('63s', [{ action: 'call', frequency: 20, ev: -0.04 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54s': h('54s', [{ action: 'raise', frequency: 15, size: 11, ev: 0.10 }, { action: 'call', frequency: 85, ev: 0.08 }]),
  '53s': h('53s', [{ action: 'call', frequency: 45, ev: 0.02 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43s': h('43s', [{ action: 'call', frequency: 40, ev: 0.01 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 70, size: 11, ev: 1.4 }, { action: 'call', frequency: 30, ev: 1.2 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 50, size: 11, ev: 0.95 }, { action: 'call', frequency: 50, ev: 0.82 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 38, size: 11, ev: 0.60 }, { action: 'call', frequency: 62, ev: 0.52 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 28, size: 11, ev: 0.38 }, { action: 'call', frequency: 72, ev: 0.32 }]),
  'A9o': h('A9o', [{ action: 'call', frequency: 75, ev: 0.18 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'call', frequency: 60, ev: 0.10 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'call', frequency: 45, ev: 0.04 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'call', frequency: 30, ev: -0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'call', frequency: 30, ev: -0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'call', frequency: 20, ev: -0.05 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'KQo': h('KQo', [{ action: 'raise', frequency: 40, size: 11, ev: 0.52 }, { action: 'call', frequency: 60, ev: 0.45 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 30, size: 11, ev: 0.32 }, { action: 'call', frequency: 70, ev: 0.28 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 80, ev: 0.18 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'K9o': h('K9o', [{ action: 'call', frequency: 50, ev: 0.05 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJo': h('QJo', [{ action: 'raise', frequency: 28, size: 11, ev: 0.25 }, { action: 'call', frequency: 72, ev: 0.22 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 70, ev: 0.12 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTo': h('JTo', [{ action: 'raise', frequency: 22, size: 11, ev: 0.18 }, { action: 'call', frequency: 78, ev: 0.15 }]),
  'J9o': h('J9o', [{ action: 'call', frequency: 55, ev: 0.05 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9o': h('T9o', [{ action: 'call', frequency: 65, ev: 0.08 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'call', frequency: 30, ev: -0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98o': h('98o', [{ action: 'call', frequency: 50, ev: 0.04 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '97o': h('97o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87o': h('87o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '86o': h('86o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76o': h('76o', [{ action: 'call', frequency: 30, ev: -0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65o': h('65o', [{ action: 'call', frequency: 20, ev: -0.05 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54o': h('54o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// BB vs HJ RFI - Even tighter, HJ has stronger range
const BB_VS_HJ_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs
  'AA': h('AA', [{ action: 'raise', frequency: 90, size: 11, ev: 3.4 }, { action: 'call', frequency: 10, ev: 3.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 88, size: 11, ev: 2.8 }, { action: 'call', frequency: 12, ev: 2.4 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 75, size: 11, ev: 2.0 }, { action: 'call', frequency: 25, ev: 1.7 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 60, size: 11, ev: 1.4 }, { action: 'call', frequency: 40, ev: 1.15 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 45, size: 11, ev: 0.95 }, { action: 'call', frequency: 55, ev: 0.8 }]),
  '99': h('99', [{ action: 'raise', frequency: 35, size: 11, ev: 0.6 }, { action: 'call', frequency: 65, ev: 0.5 }]),
  '88': h('88', [{ action: 'call', frequency: 90, ev: 0.35 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 85, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 75, ev: 0.20 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 65, ev: 0.14 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 55, ev: 0.10 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '33': h('33', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 30, ev: 0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 82, size: 11, ev: 2.0 }, { action: 'call', frequency: 18, ev: 1.65 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 65, size: 11, ev: 1.35 }, { action: 'call', frequency: 35, ev: 1.12 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 52, size: 11, ev: 0.92 }, { action: 'call', frequency: 48, ev: 0.82 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 42, size: 11, ev: 0.68 }, { action: 'call', frequency: 58, ev: 0.60 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 38, size: 11, ev: 0.50 }, { action: 'call', frequency: 62, ev: 0.45 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 32, size: 11, ev: 0.42 }, { action: 'call', frequency: 68, ev: 0.38 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 38, size: 11, ev: 0.36 }, { action: 'call', frequency: 62, ev: 0.32 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 40, size: 11, ev: 0.32 }, { action: 'call', frequency: 60, ev: 0.28 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 52, size: 11, ev: 0.40 }, { action: 'call', frequency: 48, ev: 0.35 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 48, size: 11, ev: 0.34 }, { action: 'call', frequency: 52, ev: 0.30 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 40, size: 11, ev: 0.28 }, { action: 'call', frequency: 60, ev: 0.24 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.22 }, { action: 'call', frequency: 65, ev: 0.19 }]),

  'KQs': h('KQs', [{ action: 'raise', frequency: 58, size: 11, ev: 0.80 }, { action: 'call', frequency: 42, ev: 0.72 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 48, size: 11, ev: 0.58 }, { action: 'call', frequency: 52, ev: 0.50 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 40, size: 11, ev: 0.44 }, { action: 'call', frequency: 60, ev: 0.40 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 32, size: 11, ev: 0.30 }, { action: 'call', frequency: 68, ev: 0.26 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 60, ev: 0.12 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'call', frequency: 30, ev: 0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJs': h('QJs', [{ action: 'raise', frequency: 42, size: 11, ev: 0.50 }, { action: 'call', frequency: 58, ev: 0.44 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 38, size: 11, ev: 0.40 }, { action: 'call', frequency: 62, ev: 0.35 }]),
  'Q9s': h('Q9s', [{ action: 'call', frequency: 75, ev: 0.18 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'call', frequency: 25, ev: 0 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTs': h('JTs', [{ action: 'raise', frequency: 38, size: 11, ev: 0.42 }, { action: 'call', frequency: 62, ev: 0.38 }]),
  'J9s': h('J9s', [{ action: 'call', frequency: 80, ev: 0.20 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'call', frequency: 20, ev: 0 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9s': h('T9s', [{ action: 'raise', frequency: 32, size: 11, ev: 0.34 }, { action: 'call', frequency: 68, ev: 0.30 }]),
  'T8s': h('T8s', [{ action: 'call', frequency: 70, ev: 0.12 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98s': h('98s', [{ action: 'raise', frequency: 28, size: 11, ev: 0.28 }, { action: 'call', frequency: 72, ev: 0.24 }]),
  '97s': h('97s', [{ action: 'call', frequency: 60, ev: 0.10 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '96s': h('96s', [{ action: 'call', frequency: 30, ev: 0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87s': h('87s', [{ action: 'raise', frequency: 25, size: 11, ev: 0.22 }, { action: 'call', frequency: 75, ev: 0.18 }]),
  '86s': h('86s', [{ action: 'call', frequency: 55, ev: 0.06 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '85s': h('85s', [{ action: 'call', frequency: 25, ev: 0 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76s': h('76s', [{ action: 'raise', frequency: 22, size: 11, ev: 0.16 }, { action: 'call', frequency: 78, ev: 0.14 }]),
  '75s': h('75s', [{ action: 'call', frequency: 45, ev: 0.04 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '74s': h('74s', [{ action: 'call', frequency: 15, ev: -0.04 }, { action: 'fold', frequency: 85, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65s': h('65s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.14 }, { action: 'call', frequency: 80, ev: 0.11 }]),
  '64s': h('64s', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '63s': h('63s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54s': h('54s', [{ action: 'raise', frequency: 18, size: 11, ev: 0.12 }, { action: 'call', frequency: 82, ev: 0.09 }]),
  '53s': h('53s', [{ action: 'call', frequency: 35, ev: 0.01 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43s': h('43s', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 75, size: 11, ev: 1.5 }, { action: 'call', frequency: 25, ev: 1.25 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 55, size: 11, ev: 1.0 }, { action: 'call', frequency: 45, ev: 0.85 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 42, size: 11, ev: 0.65 }, { action: 'call', frequency: 58, ev: 0.55 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 32, size: 11, ev: 0.42 }, { action: 'call', frequency: 68, ev: 0.35 }]),
  'A9o': h('A9o', [{ action: 'call', frequency: 65, ev: 0.15 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'call', frequency: 20, ev: -0.04 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'call', frequency: 20, ev: -0.04 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'KQo': h('KQo', [{ action: 'raise', frequency: 45, size: 11, ev: 0.55 }, { action: 'call', frequency: 55, ev: 0.48 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 35, size: 11, ev: 0.35 }, { action: 'call', frequency: 65, ev: 0.30 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 70, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'K9o': h('K9o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJo': h('QJo', [{ action: 'raise', frequency: 32, size: 11, ev: 0.28 }, { action: 'call', frequency: 68, ev: 0.24 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 60, ev: 0.10 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTo': h('JTo', [{ action: 'raise', frequency: 25, size: 11, ev: 0.20 }, { action: 'call', frequency: 75, ev: 0.16 }]),
  'J9o': h('J9o', [{ action: 'call', frequency: 45, ev: 0.03 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9o': h('T9o', [{ action: 'call', frequency: 55, ev: 0.05 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'call', frequency: 20, ev: -0.04 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98o': h('98o', [{ action: 'call', frequency: 40, ev: 0.02 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '97o': h('97o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87o': h('87o', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '86o': h('86o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76o': h('76o', [{ action: 'call', frequency: 20, ev: -0.04 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65o': h('65o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54o': h('54o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// BB vs UTG RFI - Tightest defense, UTG has strongest range
const BB_VS_UTG_RFI: Record<string, GTOHandStrategy> = {
  // Premium Pairs
  'AA': h('AA', [{ action: 'raise', frequency: 92, size: 11, ev: 3.5 }, { action: 'call', frequency: 8, ev: 3.1 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 90, size: 11, ev: 2.9 }, { action: 'call', frequency: 10, ev: 2.5 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 80, size: 11, ev: 2.1 }, { action: 'call', frequency: 20, ev: 1.8 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 65, size: 11, ev: 1.5 }, { action: 'call', frequency: 35, ev: 1.2 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 50, size: 11, ev: 1.0 }, { action: 'call', frequency: 50, ev: 0.85 }]),
  '99': h('99', [{ action: 'raise', frequency: 40, size: 11, ev: 0.65 }, { action: 'call', frequency: 60, ev: 0.55 }]),
  '88': h('88', [{ action: 'call', frequency: 85, ev: 0.32 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 75, ev: 0.25 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 65, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 55, ev: 0.12 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 45, ev: 0.08 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '33': h('33', [{ action: 'call', frequency: 30, ev: 0.03 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 20, ev: 0 }, { action: 'fold', frequency: 80, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 85, size: 11, ev: 2.1 }, { action: 'call', frequency: 15, ev: 1.7 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 70, size: 11, ev: 1.4 }, { action: 'call', frequency: 30, ev: 1.15 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 55, size: 11, ev: 0.95 }, { action: 'call', frequency: 45, ev: 0.85 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 45, size: 11, ev: 0.72 }, { action: 'call', frequency: 55, ev: 0.62 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 40, size: 11, ev: 0.52 }, { action: 'call', frequency: 60, ev: 0.48 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.45 }, { action: 'call', frequency: 65, ev: 0.40 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 40, size: 11, ev: 0.38 }, { action: 'call', frequency: 60, ev: 0.34 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 42, size: 11, ev: 0.34 }, { action: 'call', frequency: 58, ev: 0.30 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 55, size: 11, ev: 0.42 }, { action: 'call', frequency: 45, ev: 0.38 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 50, size: 11, ev: 0.36 }, { action: 'call', frequency: 50, ev: 0.32 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 42, size: 11, ev: 0.30 }, { action: 'call', frequency: 58, ev: 0.26 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 38, size: 11, ev: 0.24 }, { action: 'call', frequency: 62, ev: 0.20 }]),

  'KQs': h('KQs', [{ action: 'raise', frequency: 62, size: 11, ev: 0.85 }, { action: 'call', frequency: 38, ev: 0.75 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 52, size: 11, ev: 0.62 }, { action: 'call', frequency: 48, ev: 0.54 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 44, size: 11, ev: 0.48 }, { action: 'call', frequency: 56, ev: 0.42 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.32 }, { action: 'call', frequency: 65, ev: 0.28 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 50, ev: 0.10 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 30, ev: 0.02 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJs': h('QJs', [{ action: 'raise', frequency: 45, size: 11, ev: 0.55 }, { action: 'call', frequency: 55, ev: 0.48 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 40, size: 11, ev: 0.44 }, { action: 'call', frequency: 60, ev: 0.38 }]),
  'Q9s': h('Q9s', [{ action: 'call', frequency: 65, ev: 0.15 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTs': h('JTs', [{ action: 'raise', frequency: 42, size: 11, ev: 0.46 }, { action: 'call', frequency: 58, ev: 0.40 }]),
  'J9s': h('J9s', [{ action: 'call', frequency: 70, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9s': h('T9s', [{ action: 'raise', frequency: 35, size: 11, ev: 0.38 }, { action: 'call', frequency: 65, ev: 0.32 }]),
  'T8s': h('T8s', [{ action: 'call', frequency: 60, ev: 0.10 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'call', frequency: 25, ev: 0 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98s': h('98s', [{ action: 'raise', frequency: 30, size: 11, ev: 0.30 }, { action: 'call', frequency: 70, ev: 0.26 }]),
  '97s': h('97s', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '96s': h('96s', [{ action: 'call', frequency: 20, ev: 0 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87s': h('87s', [{ action: 'raise', frequency: 28, size: 11, ev: 0.24 }, { action: 'call', frequency: 72, ev: 0.20 }]),
  '86s': h('86s', [{ action: 'call', frequency: 45, ev: 0.04 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '85s': h('85s', [{ action: 'call', frequency: 15, ev: -0.02 }, { action: 'fold', frequency: 85, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76s': h('76s', [{ action: 'raise', frequency: 25, size: 11, ev: 0.18 }, { action: 'call', frequency: 75, ev: 0.15 }]),
  '75s': h('75s', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '74s': h('74s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65s': h('65s', [{ action: 'raise', frequency: 22, size: 11, ev: 0.15 }, { action: 'call', frequency: 78, ev: 0.12 }]),
  '64s': h('64s', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '63s': h('63s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54s': h('54s', [{ action: 'raise', frequency: 20, size: 11, ev: 0.12 }, { action: 'call', frequency: 80, ev: 0.10 }]),
  '53s': h('53s', [{ action: 'call', frequency: 25, ev: -0.02 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43s': h('43s', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 78, size: 11, ev: 1.55 }, { action: 'call', frequency: 22, ev: 1.3 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 60, size: 11, ev: 1.05 }, { action: 'call', frequency: 40, ev: 0.88 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 48, size: 11, ev: 0.70 }, { action: 'call', frequency: 52, ev: 0.58 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 38, size: 11, ev: 0.48 }, { action: 'call', frequency: 62, ev: 0.40 }]),
  'A9o': h('A9o', [{ action: 'call', frequency: 55, ev: 0.12 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'call', frequency: 25, ev: 0 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'KQo': h('KQo', [{ action: 'raise', frequency: 50, size: 11, ev: 0.60 }, { action: 'call', frequency: 50, ev: 0.52 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 40, size: 11, ev: 0.40 }, { action: 'call', frequency: 60, ev: 0.34 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 60, ev: 0.12 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K9o': h('K9o', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'QJo': h('QJo', [{ action: 'raise', frequency: 38, size: 11, ev: 0.32 }, { action: 'call', frequency: 62, ev: 0.28 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 50, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'JTo': h('JTo', [{ action: 'raise', frequency: 30, size: 11, ev: 0.25 }, { action: 'call', frequency: 70, ev: 0.20 }]),
  'J9o': h('J9o', [{ action: 'call', frequency: 35, ev: 0.02 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  'T9o': h('T9o', [{ action: 'call', frequency: 45, ev: 0.04 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '98o': h('98o', [{ action: 'call', frequency: 30, ev: 0 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '97o': h('97o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '87o': h('87o', [{ action: 'call', frequency: 20, ev: -0.02 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '86o': h('86o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '76o': h('76o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '65o': h('65o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '54o': h('54o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),

  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// VS RFI strategies
export const GTO_VS_RFI_RANGES: Record<string, GTOStrategy> = {
  'BB_vs_BTN': {
    scenario: createVsRFIScenario('BB', 'BTN'),
    ranges: BB_VS_BTN_RFI,
    summary: calculateSummary(BB_VS_BTN_RFI),
  },
  'BB_vs_CO': {
    scenario: createVsRFIScenario('BB', 'CO'),
    ranges: BB_VS_CO_RFI,
    summary: calculateSummary(BB_VS_CO_RFI),
  },
  'BB_vs_HJ': {
    scenario: createVsRFIScenario('BB', 'HJ'),
    ranges: BB_VS_HJ_RFI,
    summary: calculateSummary(BB_VS_HJ_RFI),
  },
  'BB_vs_UTG': {
    scenario: createVsRFIScenario('BB', 'UTG'),
    ranges: BB_VS_UTG_RFI,
    summary: calculateSummary(BB_VS_UTG_RFI),
  },
};

// Action line type
export type ActionLineKey = 'rfi' | 'vs_rfi';

// Get strategy by action line
export function getStrategyByActionLine(
  actionLine: ActionLineKey,
  position: Position,
  vsPosition?: Position
): GTOStrategy | undefined {
  if (actionLine === 'rfi') {
    return GTO_RANGES[position];
  }
  if (actionLine === 'vs_rfi' && vsPosition) {
    const key = `${position}_vs_${vsPosition}`;
    return GTO_VS_RFI_RANGES[key];
  }
  return undefined;
}

// Get GTO strategy for a specific scenario
export function getGTOStrategy(position: Position): GTOStrategy | undefined {
  return GTO_RANGES[position];
}

// Get hand strategy for a specific hand in a position
export function getHandStrategy(position: Position, hand: string): GTOHandStrategy | undefined {
  const strategy = GTO_RANGES[position];
  if (!strategy) return undefined;
  const ranges = strategy.ranges;
  if (ranges instanceof Map) {
    return ranges.get(hand);
  }
  return ranges[hand];
}

// Get all hands sorted by EV
export function getHandsByEV(position: Position): GTOHandStrategy[] {
  const strategy = GTO_RANGES[position];
  if (!strategy) return [];

  const ranges = strategy.ranges;
  const values: GTOHandStrategy[] = ranges instanceof Map
    ? Array.from(ranges.values())
    : Object.values(ranges);

  return values.sort((a: GTOHandStrategy, b: GTOHandStrategy) => {
    const evA = a.actions.reduce((sum: number, act: GTOAction) => sum + (act.frequency / 100) * act.ev, 0);
    const evB = b.actions.reduce((sum: number, act: GTOAction) => sum + (act.frequency / 100) * act.ev, 0);
    return evB - evA;
  });
}

// Get playable hands (not 100% fold)
export function getPlayableHands(position: Position): GTOHandStrategy[] {
  const strategy = GTO_RANGES[position];
  if (!strategy) return [];

  const ranges = strategy.ranges;
  const values: GTOHandStrategy[] = ranges instanceof Map
    ? Array.from(ranges.values())
    : Object.values(ranges);

  return values.filter((h: GTOHandStrategy) => {
    const foldAction = h.actions.find((a: GTOAction) => a.action === 'fold');
    return !foldAction || foldAction.frequency < 100;
  });
}

// ============================================
// 100BB Stack Depth RFI Data
// At 100bb, ranges are tighter due to higher SPR risk
// ============================================

function createScenario100bb(position: Position): GTOScenario {
  return {
    id: `6max-cash-100bb-rfi-${position.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 100,
    tableSize: 6,
    position,
    actionLine: { type: 'rfi' },
  };
}

// UTG 100bb - Much tighter than 200bb
const UTG_RFI_100BB: Record<string, GTOHandStrategy> = {
  // Premium Pairs
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.35 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.82 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.35 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  '99': h('99', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.35 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '88': h('88', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '77': h('77', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '66': h('66', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '55': h('55', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.25 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.85 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.42 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QTs': h('QTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Other Suited
  'A9s': h('A9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K9s': h('K9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K8s': h('K8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q9s': h('Q9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J9s': h('J9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T8s': h('T8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '98s': h('98s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '97s': h('97s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96s': h('96s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '87s': h('87s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '86s': h('86s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85s': h('85s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76s': h('76s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75s': h('75s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74s': h('74s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65s': h('65s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64s': h('64s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63s': h('63s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54s': h('54s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53s': h('53s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '43s': h('43s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // All offsuit non-broadway - fold
  'QJo': h('QJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A9o': h('A9o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K9o': h('K9o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J9o': h('J9o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T9o': h('T9o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '98o': h('98o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '97o': h('97o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '87o': h('87o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '86o': h('86o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76o': h('76o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65o': h('65o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54o': h('54o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// BTN 100bb - Still wide but slightly tighter than 200bb
const BTN_RFI_100BB: Record<string, GTOHandStrategy> = {
  // All pairs
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.25 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.72 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.25 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.10 }]),
  '44': h('44', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '33': h('33', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '22': h('22', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 40, ev: 0 }]),
  // Broadway Suited - all raise
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.18 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.82 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.30 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.12 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.10 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.08 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.08 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'J6s': h('J6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5s': h('J5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4s': h('J4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3s': h('J3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2s': h('J2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'T8s': h('T8s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'T7s': h('T7s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'T6s': h('T6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5s': h('T5s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4s': h('T4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3s': h('T3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2s': h('T2s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  '97s': h('97s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '96s': h('96s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '95s': h('95s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94s': h('94s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93s': h('93s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92s': h('92s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.15 }]),
  '86s': h('86s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '85s': h('85s', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '84s': h('84s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83s': h('83s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82s': h('82s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 95, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 5, ev: 0 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '74s': h('74s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73s': h('73s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72s': h('72s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '63s': h('63s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62s': h('62s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '53s': h('53s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '52s': h('52s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '43s': h('43s', [{ action: 'raise', frequency: 35, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '42s': h('42s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32s': h('32s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  'A9o': h('A9o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 35, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.12 }]),
  'K9o': h('K9o', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.03 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K7o': h('K7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6o': h('K6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5o': h('K5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K4o': h('K4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3o': h('K3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2o': h('K2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'Q8o': h('Q8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q7o': h('Q7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6o': h('Q6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5o': h('Q5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q4o': h('Q4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3o': h('Q3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2o': h('Q2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'J9o': h('J9o', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.01 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'J8o': h('J8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J7o': h('J7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J6o': h('J6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J5o': h('J5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J4o': h('J4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J3o': h('J3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'J2o': h('J2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T9o': h('T9o', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.02 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'T8o': h('T8o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T7o': h('T7o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T6o': h('T6o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T5o': h('T5o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T4o': h('T4o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T3o': h('T3o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'T2o': h('T2o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '98o': h('98o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '97o': h('97o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '96o': h('96o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '95o': h('95o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '94o': h('94o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '93o': h('93o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '92o': h('92o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '87o': h('87o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '86o': h('86o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '85o': h('85o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '84o': h('84o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '83o': h('83o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '82o': h('82o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '76o': h('76o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '75o': h('75o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '74o': h('74o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '73o': h('73o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '72o': h('72o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '65o': h('65o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '64o': h('64o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '63o': h('63o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '62o': h('62o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54o': h('54o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '53o': h('53o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '52o': h('52o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '43o': h('43o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '42o': h('42o', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '32o': h('32o', [{ action: 'fold', frequency: 100, ev: 0 }]),
};

// Export 100bb RFI strategies
export const GTO_RANGES_100BB: Record<string, GTOStrategy> = {
  'UTG': {
    scenario: createScenario100bb('UTG'),
    ranges: UTG_RFI_100BB,
    summary: calculateSummary(UTG_RFI_100BB),
  },
  'BTN': {
    scenario: createScenario100bb('BTN'),
    ranges: BTN_RFI_100BB,
    summary: calculateSummary(BTN_RFI_100BB),
  },
};

// Get strategy by stack depth
export function getStrategyByStackDepth(
  stackDepth: 100 | 200,
  position: Position
): GTOStrategy | undefined {
  if (stackDepth === 100) {
    return GTO_RANGES_100BB[position];
  }
  return GTO_RANGES[position];
}

// Default export
export default GTO_RANGES;
