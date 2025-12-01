/**
 * GTO vs 3-Bet Range Data
 * Based on 6-max Cash Game, 200bb deep
 *
 * Scenario: Hero opens (RFI), Villain 3-bets, hero must decide to:
 * - fold: Surrender the pot
 * - call: Call the 3-bet (set mining, flat calling)
 * - raise (4-bet): Re-raise (usually small for value/bluff or large for all-in)
 *
 * Common 3-bet sizes assumed: 3x the open raise
 * Common 4-bet sizes: 2.2-2.5x the 3-bet
 */

import type { GTOHandStrategy, GTOStrategy, GTOScenario, Position } from '../types';
import { getComboCount } from './gto-ranges';

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
  const avgEV = actions.reduce((sum, a) => sum + a.frequency * a.ev, 0) / 100;
  return Math.min(100, Math.max(0, 50 + avgEV * 5));
}

// Helper to create vs 3bet scenario
function createVs3BetScenario(heroPosition: Position, threeBetPosition: Position): GTOScenario {
  return {
    id: `6max-cash-200bb-vs-3bet-${heroPosition.toLowerCase()}-vs-${threeBetPosition.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 200,
    tableSize: 6,
    position: heroPosition,
    actionLine: {
      type: 'vs_3bet',
      threeBetPosition: threeBetPosition,
    },
    vsPosition: threeBetPosition,
  };
}

// Helper to generate fold entries
function generateFolds(hands: string[]): Record<string, GTOHandStrategy> {
  const result: Record<string, GTOHandStrategy> = {};
  for (const hand of hands) {
    result[hand] = h(hand, [{ action: 'fold', frequency: 100, ev: 0 }]);
  }
  return result;
}

// ============================================
// BTN vs BB 3-Bet (Most common scenario)
// BTN opens, BB 3-bets
// ============================================
const BTN_VS_BB_3BET: Record<string, GTOHandStrategy> = {
  // Premium Pairs - 4-bet or call
  'AA': h('AA', [{ action: 'raise', frequency: 80, size: 2.3, ev: 8.5 }, { action: 'call', frequency: 20, ev: 6.2 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 75, size: 2.3, ev: 6.8 }, { action: 'call', frequency: 25, ev: 5.2 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 60, size: 2.3, ev: 4.5 }, { action: 'call', frequency: 40, ev: 3.8 }]),
  'JJ': h('JJ', [{ action: 'call', frequency: 70, ev: 2.8 }, { action: 'raise', frequency: 30, size: 2.3, ev: 2.5 }]),
  'TT': h('TT', [{ action: 'call', frequency: 85, ev: 1.8 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '99': h('99', [{ action: 'call', frequency: 75, ev: 1.2 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '88': h('88', [{ action: 'call', frequency: 65, ev: 0.8 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 50, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 35, ev: 0.2 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 25, ev: 0.1 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 85, size: 2.3, ev: 5.5 }, { action: 'call', frequency: 15, ev: 4.2 }]),
  'AQs': h('AQs', [{ action: 'call', frequency: 55, ev: 2.2 }, { action: 'raise', frequency: 35, size: 2.3, ev: 2.0 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 60, ev: 1.5 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 50, ev: 1.0 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 55, ev: 1.2 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 40, ev: 0.6 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 30, ev: 0.3 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 40, ev: 0.5 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 30, ev: 0.3 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 35, ev: 0.4 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 70, size: 2.3, ev: 3.5 }, { action: 'call', frequency: 20, ev: 2.5 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AQo': h('AQo', [{ action: 'call', frequency: 45, ev: 1.2 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'AJo': h('AJo', [{ action: 'fold', frequency: 80, ev: 0 }, { action: 'call', frequency: 20, ev: 0.3 }]),
  'ATo': h('ATo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'fold', frequency: 85, ev: 0 }, { action: 'call', frequency: 15, ev: 0.2 }]),
  'KJo': h('KJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Connectors (can call sometimes for implied odds)
  'T9s': h('T9s', [{ action: 'call', frequency: 25, ev: 0.2 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '98s': h('98s', [{ action: 'call', frequency: 20, ev: 0.1 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '87s': h('87s', [{ action: 'call', frequency: 15, ev: 0.1 }, { action: 'fold', frequency: 85, ev: 0 }]),
  '76s': h('76s', [{ action: 'call', frequency: 10, ev: 0.05 }, { action: 'fold', frequency: 90, ev: 0 }]),
  '65s': h('65s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '54s': h('54s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 4-bet bluff candidates (suited Ax)
  'A5s': h('A5s', [{ action: 'raise', frequency: 35, size: 2.3, ev: 0.8 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 30, size: 2.3, ev: 0.6 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 20, size: 2.3, ev: 0.4 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 15, size: 2.3, ev: 0.3 }, { action: 'fold', frequency: 85, ev: 0 }]),
  'A9s': h('A9s', [{ action: 'call', frequency: 35, ev: 0.5 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 25, ev: 0.3 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'call', frequency: 20, ev: 0.2 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'call', frequency: 15, ev: 0.1 }, { action: 'fold', frequency: 85, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
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
// CO vs BTN 3-Bet
// CO opens, BTN 3-bets
// ============================================
const CO_VS_BTN_3BET: Record<string, GTOHandStrategy> = {
  // Premium Pairs - tighter due to BTN being in position
  'AA': h('AA', [{ action: 'raise', frequency: 85, size: 2.3, ev: 9.0 }, { action: 'call', frequency: 15, ev: 6.5 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 80, size: 2.3, ev: 7.2 }, { action: 'call', frequency: 20, ev: 5.5 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 65, size: 2.3, ev: 5.0 }, { action: 'call', frequency: 35, ev: 4.0 }]),
  'JJ': h('JJ', [{ action: 'call', frequency: 65, ev: 3.0 }, { action: 'raise', frequency: 35, size: 2.3, ev: 2.8 }]),
  'TT': h('TT', [{ action: 'call', frequency: 80, ev: 2.0 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '99': h('99', [{ action: 'call', frequency: 70, ev: 1.3 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '88': h('88', [{ action: 'call', frequency: 55, ev: 0.7 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 40, ev: 0.3 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 25, ev: 0.1 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '55': h('55', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 90, size: 2.3, ev: 6.0 }, { action: 'call', frequency: 10, ev: 4.5 }]),
  'AQs': h('AQs', [{ action: 'call', frequency: 50, ev: 2.5 }, { action: 'raise', frequency: 40, size: 2.3, ev: 2.2 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 55, ev: 1.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 45, ev: 1.0 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 50, ev: 1.3 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 35, ev: 0.5 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 25, ev: 0.3 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 35, ev: 0.4 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 25, ev: 0.2 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 30, ev: 0.3 }, { action: 'fold', frequency: 70, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 75, size: 2.3, ev: 4.0 }, { action: 'call', frequency: 15, ev: 2.8 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AQo': h('AQo', [{ action: 'call', frequency: 40, ev: 1.3 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'AJo': h('AJo', [{ action: 'fold', frequency: 90, ev: 0 }, { action: 'call', frequency: 10, ev: 0.2 }]),
  'ATo': h('ATo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 4-bet bluff candidates
  'A5s': h('A5s', [{ action: 'raise', frequency: 40, size: 2.3, ev: 0.9 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 35, size: 2.3, ev: 0.7 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 25, size: 2.3, ev: 0.5 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 20, size: 2.3, ev: 0.4 }, { action: 'fold', frequency: 80, ev: 0 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 20, ev: 0.2 }, { action: 'fold', frequency: 80, ev: 0 }]),
  '98s': h('98s', [{ action: 'call', frequency: 15, ev: 0.1 }, { action: 'fold', frequency: 85, ev: 0 }]),
  '87s': h('87s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'call', frequency: 30, ev: 0.4 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 20, ev: 0.2 }, { action: 'fold', frequency: 80, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'call', frequency: 15, ev: 0.1 }, { action: 'fold', frequency: 85, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '97s', '96s', '95s', '94s', '93s', '92s',
    '86s', '85s', '84s', '83s', '82s',
    '76s', '75s', '74s', '73s', '72s',
    '65s', '64s', '63s', '62s',
    '54s', '53s', '52s',
    '43s', '42s',
    '32s',
    // Offsuit
    'KTo', 'QTo', 'JTo',
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
// HJ vs CO 3-Bet
// HJ opens, CO 3-bets
// ============================================
const HJ_VS_CO_3BET: Record<string, GTOHandStrategy> = {
  // Premium Pairs - very tight due to early position
  'AA': h('AA', [{ action: 'raise', frequency: 90, size: 2.3, ev: 9.5 }, { action: 'call', frequency: 10, ev: 7.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 85, size: 2.3, ev: 7.8 }, { action: 'call', frequency: 15, ev: 5.8 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 70, size: 2.3, ev: 5.5 }, { action: 'call', frequency: 30, ev: 4.2 }]),
  'JJ': h('JJ', [{ action: 'call', frequency: 60, ev: 3.2 }, { action: 'raise', frequency: 40, size: 2.3, ev: 3.0 }]),
  'TT': h('TT', [{ action: 'call', frequency: 70, ev: 2.0 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '99': h('99', [{ action: 'call', frequency: 60, ev: 1.2 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '88': h('88', [{ action: 'call', frequency: 45, ev: 0.6 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 30, ev: 0.2 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '66': h('66', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '55': h('55', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 95, size: 2.3, ev: 6.5 }, { action: 'call', frequency: 5, ev: 4.8 }]),
  'AQs': h('AQs', [{ action: 'call', frequency: 45, ev: 2.6 }, { action: 'raise', frequency: 45, size: 2.3, ev: 2.4 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 50, ev: 1.7 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 40, ev: 1.0 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 45, ev: 1.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 30, ev: 0.5 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'KTs': h('KTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 25, ev: 0.3 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'QTs': h('QTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 20, ev: 0.2 }, { action: 'fold', frequency: 80, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 80, size: 2.3, ev: 4.2 }, { action: 'call', frequency: 10, ev: 3.0 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AQo': h('AQo', [{ action: 'call', frequency: 35, ev: 1.3 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'AJo': h('AJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 4-bet bluff candidates (fewer from early position)
  'A5s': h('A5s', [{ action: 'raise', frequency: 45, size: 2.3, ev: 1.0 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 40, size: 2.3, ev: 0.8 }, { action: 'fold', frequency: 60, ev: 0 }]),

  // Suited connectors (rarely call from early position)
  'T9s': h('T9s', [{ action: 'call', frequency: 15, ev: 0.1 }, { action: 'fold', frequency: 85, ev: 0 }]),
  '98s': h('98s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'call', frequency: 25, ev: 0.3 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 30, size: 2.3, ev: 0.5 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 20, size: 2.3, ev: 0.3 }, { action: 'fold', frequency: 80, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '97s', '96s', '95s', '94s', '93s', '92s',
    '87s', '86s', '85s', '84s', '83s', '82s',
    '76s', '75s', '74s', '73s', '72s',
    '65s', '64s', '63s', '62s',
    '54s', '53s', '52s',
    '43s', '42s',
    '32s',
    // Offsuit
    'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
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
// UTG vs HJ 3-Bet
// UTG opens, HJ 3-bets (tightest scenario)
// ============================================
const UTG_VS_HJ_3BET: Record<string, GTOHandStrategy> = {
  // Premium Pairs - extremely tight
  'AA': h('AA', [{ action: 'raise', frequency: 95, size: 2.3, ev: 10.0 }, { action: 'call', frequency: 5, ev: 7.5 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 90, size: 2.3, ev: 8.2 }, { action: 'call', frequency: 10, ev: 6.0 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 75, size: 2.3, ev: 6.0 }, { action: 'call', frequency: 25, ev: 4.5 }]),
  'JJ': h('JJ', [{ action: 'call', frequency: 55, ev: 3.5 }, { action: 'raise', frequency: 45, size: 2.3, ev: 3.2 }]),
  'TT': h('TT', [{ action: 'call', frequency: 65, ev: 2.2 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '99': h('99', [{ action: 'call', frequency: 50, ev: 1.3 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '88': h('88', [{ action: 'call', frequency: 35, ev: 0.5 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '77': h('77', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '66': h('66', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '55': h('55', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.3, ev: 7.0 }]),
  'AQs': h('AQs', [{ action: 'call', frequency: 40, ev: 2.8 }, { action: 'raise', frequency: 50, size: 2.3, ev: 2.6 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 45, ev: 1.8 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 35, ev: 1.0 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 40, ev: 1.4 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 25, ev: 0.4 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'KTs': h('KTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'QTs': h('QTs', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 85, size: 2.3, ev: 4.5 }, { action: 'call', frequency: 5, ev: 3.2 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'AQo': h('AQo', [{ action: 'call', frequency: 30, ev: 1.4 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'AJo': h('AJo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 4-bet bluff candidates (very limited from UTG)
  'A5s': h('A5s', [{ action: 'raise', frequency: 50, size: 2.3, ev: 1.2 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 45, size: 2.3, ev: 1.0 }, { action: 'fold', frequency: 55, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 35, size: 2.3, ev: 0.6 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 25, size: 2.3, ev: 0.4 }, { action: 'fold', frequency: 75, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'T9s', '98s', '87s', '76s', '65s', '54s',
    'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
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
    'ATo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
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

// Calculate summary statistics
function calculateSummary(ranges: Record<string, GTOHandStrategy>) {
  let totalHands = 0;
  let playableHands = 0;
  let raiseFreq = 0;
  let callFreq = 0;
  let foldFreq = 0;
  let allinFreq = 0;
  let totalCombos = 0;
  let totalEV = 0;

  for (const hand of Object.values(ranges)) {
    const combos = hand.totalCombos;
    totalHands++;
    totalCombos += combos;

    const foldAction = hand.actions.find(a => a.action === 'fold');
    const raiseAction = hand.actions.find(a => a.action === 'raise');
    const allinAction = hand.actions.find(a => a.action === 'allin');
    const callAction = hand.actions.find(a => a.action === 'call');

    if (!foldAction || foldAction.frequency < 100) {
      playableHands++;
    }

    if (raiseAction) {
      raiseFreq += (raiseAction.frequency / 100) * combos;
      totalEV += raiseAction.ev * (raiseAction.frequency / 100) * combos;
    }
    if (allinAction) {
      allinFreq += (allinAction.frequency / 100) * combos;
      totalEV += allinAction.ev * (allinAction.frequency / 100) * combos;
    }
    if (callAction) {
      callFreq += (callAction.frequency / 100) * combos;
      totalEV += callAction.ev * (callAction.frequency / 100) * combos;
    }
    if (foldAction) {
      foldFreq += (foldAction.frequency / 100) * combos;
      totalEV += foldAction.ev * (foldAction.frequency / 100) * combos;
    }
  }

  return {
    totalHands,
    playableHands,
    raiseFreq: (raiseFreq / totalCombos) * 100,
    callFreq: (callFreq / totalCombos) * 100,
    foldFreq: (foldFreq / totalCombos) * 100,
    allinFreq: (allinFreq / totalCombos) * 100,
    avgEV: totalEV / totalCombos,
  };
}

// Export vs 3-Bet strategies
export const GTO_VS_3BET_RANGES: Record<string, GTOStrategy> = {
  'BTN_vs_BB': {
    scenario: createVs3BetScenario('BTN', 'BB'),
    ranges: BTN_VS_BB_3BET,
    summary: calculateSummary(BTN_VS_BB_3BET),
  },
  'CO_vs_BTN': {
    scenario: createVs3BetScenario('CO', 'BTN'),
    ranges: CO_VS_BTN_3BET,
    summary: calculateSummary(CO_VS_BTN_3BET),
  },
  'HJ_vs_CO': {
    scenario: createVs3BetScenario('HJ', 'CO'),
    ranges: HJ_VS_CO_3BET,
    summary: calculateSummary(HJ_VS_CO_3BET),
  },
  'UTG_vs_HJ': {
    scenario: createVs3BetScenario('UTG', 'HJ'),
    ranges: UTG_VS_HJ_3BET,
    summary: calculateSummary(UTG_VS_HJ_3BET),
  },
};

// Get vs 3-Bet strategy
export function getVs3BetStrategy(
  heroPosition: Position,
  threeBetPosition: Position
): GTOStrategy | undefined {
  const key = `${heroPosition}_vs_${threeBetPosition}`;
  return GTO_VS_3BET_RANGES[key];
}

// Get available vs 3-Bet scenarios for a given hero position
export function getAvailableVs3BetScenarios(heroPosition: Position): Position[] {
  const scenarios: Position[] = [];
  for (const key of Object.keys(GTO_VS_3BET_RANGES)) {
    if (key.startsWith(`${heroPosition}_vs_`)) {
      const vsPosition = key.replace(`${heroPosition}_vs_`, '') as Position;
      scenarios.push(vsPosition);
    }
  }
  return scenarios;
}
