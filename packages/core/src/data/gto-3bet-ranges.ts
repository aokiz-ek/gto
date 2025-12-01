/**
 * GTO 3-Bet Range Data
 * Based on 6-max Cash Game, 200bb deep
 *
 * Scenario: Villain opens (RFI), Hero 3-bets
 * These ranges represent how to construct your 3-betting range
 * from different positions against different openers.
 *
 * Common 3-bet sizes assumed: 3x IP, 3.5x OOP
 */

import type { GTOHandStrategy, GTOStrategy, GTOScenario, Position } from '../types';
import { getComboCount } from './gto-ranges';

// Helper to create hand strategy for 3-betting
function h(
  hand: string,
  actions: Array<{ action: 'fold' | 'call' | 'raise'; frequency: number; size?: number; ev: number }>
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

// Helper to create 3bet scenario
function create3BetScenario(heroPosition: Position, openerPosition: Position): GTOScenario {
  return {
    id: `6max-cash-200bb-3bet-${heroPosition.toLowerCase()}-vs-${openerPosition.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 200,
    tableSize: 6,
    position: heroPosition,
    actionLine: {
      type: '3bet',
      openerPosition: openerPosition,
    },
    vsPosition: openerPosition,
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
// BB vs BTN Open (Most common 3-bet spot)
// BTN opens, BB 3-bets
// ============================================
const BB_3BET_VS_BTN: Record<string, GTOHandStrategy> = {
  // Value 3-bets - Premium hands
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3.5, ev: 8.5 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3.5, ev: 7.2 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3.5, ev: 5.8 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 85, size: 3.5, ev: 4.2 }, { action: 'call', frequency: 15, ev: 3.5 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 55, size: 3.5, ev: 2.8 }, { action: 'call', frequency: 45, ev: 2.5 }]),
  '99': h('99', [{ action: 'call', frequency: 65, ev: 1.8 }, { action: 'raise', frequency: 35, size: 3.5, ev: 1.5 }]),
  '88': h('88', [{ action: 'call', frequency: 75, ev: 1.2 }, { action: 'raise', frequency: 25, size: 3.5, ev: 0.8 }]),
  '77': h('77', [{ action: 'call', frequency: 80, ev: 0.8 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 70, ev: 0.5 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 60, ev: 0.3 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 50, ev: 0.2 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '33': h('33', [{ action: 'call', frequency: 40, ev: 0.1 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 35, ev: 0.05 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // Broadway Suited - Value and bluff 3-bets
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3.5, ev: 6.5 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 85, size: 3.5, ev: 4.5 }, { action: 'call', frequency: 15, ev: 3.8 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 65, size: 3.5, ev: 3.2 }, { action: 'call', frequency: 35, ev: 2.8 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 55, ev: 2.2 }, { action: 'raise', frequency: 45, size: 3.5, ev: 2.0 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 55, size: 3.5, ev: 2.5 }, { action: 'call', frequency: 45, ev: 2.2 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 60, ev: 1.8 }, { action: 'raise', frequency: 40, size: 3.5, ev: 1.5 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 70, ev: 1.4 }, { action: 'raise', frequency: 30, size: 3.5, ev: 1.0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 65, ev: 1.5 }, { action: 'raise', frequency: 35, size: 3.5, ev: 1.2 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 70, ev: 1.2 }, { action: 'raise', frequency: 30, size: 3.5, ev: 0.8 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 70, ev: 1.3 }, { action: 'raise', frequency: 30, size: 3.5, ev: 0.9 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3.5, ev: 5.0 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 70, size: 3.5, ev: 2.8 }, { action: 'call', frequency: 30, ev: 2.2 }]),
  'AJo': h('AJo', [{ action: 'call', frequency: 55, ev: 1.5 }, { action: 'raise', frequency: 35, size: 3.5, ev: 1.2 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 55, ev: 1.0 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'call', frequency: 55, ev: 1.2 }, { action: 'raise', frequency: 30, size: 3.5, ev: 0.8 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 50, ev: 0.8 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 40, ev: 0.5 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'call', frequency: 45, ev: 0.6 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 35, ev: 0.4 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'call', frequency: 40, ev: 0.5 }, { action: 'fold', frequency: 60, ev: 0 }]),

  // Suited Connectors - Call or 3-bet bluff
  'T9s': h('T9s', [{ action: 'call', frequency: 65, ev: 1.0 }, { action: 'raise', frequency: 35, size: 3.5, ev: 0.6 }]),
  '98s': h('98s', [{ action: 'call', frequency: 65, ev: 0.8 }, { action: 'raise', frequency: 35, size: 3.5, ev: 0.5 }]),
  '87s': h('87s', [{ action: 'call', frequency: 60, ev: 0.7 }, { action: 'raise', frequency: 40, size: 3.5, ev: 0.4 }]),
  '76s': h('76s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'raise', frequency: 45, size: 3.5, ev: 0.3 }]),
  '65s': h('65s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'raise', frequency: 50, size: 3.5, ev: 0.3 }]),
  '54s': h('54s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'raise', frequency: 55, size: 3.5, ev: 0.3 }]),

  // 3-bet bluff candidates (suited Ax)
  'A9s': h('A9s', [{ action: 'call', frequency: 50, ev: 1.0 }, { action: 'raise', frequency: 50, size: 3.5, ev: 0.8 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 45, ev: 0.8 }, { action: 'raise', frequency: 55, size: 3.5, ev: 0.6 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 60, size: 3.5, ev: 0.7 }, { action: 'call', frequency: 40, ev: 0.5 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 65, size: 3.5, ev: 0.6 }, { action: 'call', frequency: 35, ev: 0.4 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 70, size: 3.5, ev: 0.8 }, { action: 'call', frequency: 30, ev: 0.5 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 65, size: 3.5, ev: 0.7 }, { action: 'call', frequency: 35, ev: 0.4 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 60, size: 3.5, ev: 0.6 }, { action: 'call', frequency: 40, ev: 0.3 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 55, size: 3.5, ev: 0.5 }, { action: 'call', frequency: 45, ev: 0.3 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 60, ev: 0.8 }, { action: 'raise', frequency: 40, size: 3.5, ev: 0.5 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 55, ev: 0.5 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 50, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 45, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 50, size: 3.5, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 45, size: 3.5, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 40, size: 3.5, ev: 0.2 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q3s': h('Q3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q2s': h('Q2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'call', frequency: 55, ev: 0.5 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 45, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'J7s': h('J7s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // One-gappers suited
  'T8s': h('T8s', [{ action: 'call', frequency: 50, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '97s': h('97s', [{ action: 'call', frequency: 45, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '86s': h('86s', [{ action: 'call', frequency: 40, ev: 0.2 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '75s': h('75s', [{ action: 'call', frequency: 35, ev: 0.2 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '64s': h('64s', [{ action: 'call', frequency: 30, ev: 0.1 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '53s': h('53s', [{ action: 'call', frequency: 25, ev: 0.1 }, { action: 'fold', frequency: 75, ev: 0 }]),
  '43s': h('43s', [{ action: 'call', frequency: 30, ev: 0.1 }, { action: 'fold', frequency: 70, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '96s', '95s', '94s', '93s', '92s',
    '85s', '84s', '83s', '82s',
    '74s', '73s', '72s',
    '63s', '62s',
    '52s',
    '42s',
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
// SB vs BTN Open
// BTN opens, SB 3-bets
// ============================================
const SB_3BET_VS_BTN: Record<string, GTOHandStrategy> = {
  // Value 3-bets - Premium hands (tighter from SB as OOP)
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3.5, ev: 8.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3.5, ev: 6.8 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3.5, ev: 5.5 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 90, size: 3.5, ev: 4.0 }, { action: 'call', frequency: 10, ev: 3.2 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 70, size: 3.5, ev: 2.8 }, { action: 'call', frequency: 30, ev: 2.2 }]),
  '99': h('99', [{ action: 'raise', frequency: 50, size: 3.5, ev: 1.8 }, { action: 'call', frequency: 50, ev: 1.5 }]),
  '88': h('88', [{ action: 'call', frequency: 65, ev: 1.0 }, { action: 'raise', frequency: 35, size: 3.5, ev: 0.8 }]),
  '77': h('77', [{ action: 'call', frequency: 70, ev: 0.6 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 55, ev: 0.4 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 45, ev: 0.2 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.1 }]),
  '33': h('33', [{ action: 'fold', frequency: 80, ev: 0 }, { action: 'call', frequency: 20, ev: 0.05 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3.5, ev: 6.0 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 90, size: 3.5, ev: 4.2 }, { action: 'call', frequency: 10, ev: 3.5 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 75, size: 3.5, ev: 3.0 }, { action: 'call', frequency: 25, ev: 2.5 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 55, size: 3.5, ev: 2.0 }, { action: 'call', frequency: 45, ev: 1.8 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 65, size: 3.5, ev: 2.3 }, { action: 'call', frequency: 35, ev: 2.0 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 55, ev: 1.5 }, { action: 'raise', frequency: 45, size: 3.5, ev: 1.3 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 60, ev: 1.2 }, { action: 'raise', frequency: 40, size: 3.5, ev: 0.9 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 55, ev: 1.3 }, { action: 'raise', frequency: 45, size: 3.5, ev: 1.0 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 60, ev: 1.0 }, { action: 'raise', frequency: 40, size: 3.5, ev: 0.7 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 60, ev: 1.1 }, { action: 'raise', frequency: 40, size: 3.5, ev: 0.8 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3.5, ev: 4.5 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 80, size: 3.5, ev: 2.5 }, { action: 'call', frequency: 20, ev: 1.8 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 55, size: 3.5, ev: 1.5 }, { action: 'call', frequency: 35, ev: 1.0 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 50, ev: 0.8 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 50, size: 3.5, ev: 1.0 }, { action: 'call', frequency: 40, ev: 0.8 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 45, ev: 0.5 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 65, ev: 0 }, { action: 'call', frequency: 35, ev: 0.3 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 60, ev: 0 }, { action: 'call', frequency: 40, ev: 0.4 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 3-bet bluff candidates
  'A5s': h('A5s', [{ action: 'raise', frequency: 75, size: 3.5, ev: 0.8 }, { action: 'call', frequency: 25, ev: 0.4 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 70, size: 3.5, ev: 0.7 }, { action: 'call', frequency: 30, ev: 0.3 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 65, size: 3.5, ev: 0.6 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 60, size: 3.5, ev: 0.5 }, { action: 'fold', frequency: 40, ev: 0 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 55, ev: 0.7 }, { action: 'raise', frequency: 45, size: 3.5, ev: 0.5 }]),
  '98s': h('98s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'raise', frequency: 45, size: 3.5, ev: 0.4 }]),
  '87s': h('87s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'raise', frequency: 50, size: 3.5, ev: 0.3 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 55, size: 3.5, ev: 0.3 }, { action: 'call', frequency: 45, ev: 0.3 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 60, size: 3.5, ev: 0.3 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 65, size: 3.5, ev: 0.3 }, { action: 'fold', frequency: 35, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'raise', frequency: 55, size: 3.5, ev: 1.0 }, { action: 'call', frequency: 45, ev: 0.7 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 60, size: 3.5, ev: 0.8 }, { action: 'call', frequency: 40, ev: 0.5 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 65, size: 3.5, ev: 0.7 }, { action: 'call', frequency: 35, ev: 0.4 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 70, size: 3.5, ev: 0.6 }, { action: 'fold', frequency: 30, ev: 0 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 50, ev: 0.6 }, { action: 'raise', frequency: 50, size: 3.5, ev: 0.4 }]),
  'K8s': h('K8s', [{ action: 'fold', frequency: 60, ev: 0 }, { action: 'call', frequency: 40, ev: 0.3 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 55, size: 3.5, ev: 0.3 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 50, size: 3.5, ev: 0.3 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Rest are folds
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
// BTN vs CO Open
// CO opens, BTN 3-bets (IP)
// ============================================
const BTN_3BET_VS_CO: Record<string, GTOHandStrategy> = {
  // Value 3-bets
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3.0, ev: 9.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3.0, ev: 7.5 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3.0, ev: 6.0 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 80, size: 3.0, ev: 4.5 }, { action: 'call', frequency: 20, ev: 3.8 }]),
  'TT': h('TT', [{ action: 'call', frequency: 55, ev: 3.0 }, { action: 'raise', frequency: 45, size: 3.0, ev: 2.8 }]),
  '99': h('99', [{ action: 'call', frequency: 70, ev: 2.0 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.5 }]),
  '88': h('88', [{ action: 'call', frequency: 80, ev: 1.3 }, { action: 'raise', frequency: 20, size: 3.0, ev: 0.8 }]),
  '77': h('77', [{ action: 'call', frequency: 85, ev: 0.9 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 75, ev: 0.6 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 65, ev: 0.4 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 55, ev: 0.2 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '33': h('33', [{ action: 'call', frequency: 45, ev: 0.1 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '22': h('22', [{ action: 'call', frequency: 40, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3.0, ev: 7.0 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 80, size: 3.0, ev: 5.0 }, { action: 'call', frequency: 20, ev: 4.2 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 55, size: 3.0, ev: 3.5 }, { action: 'call', frequency: 45, ev: 3.2 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 60, ev: 2.5 }, { action: 'raise', frequency: 40, size: 3.0, ev: 2.2 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 50, size: 3.0, ev: 2.8 }, { action: 'call', frequency: 50, ev: 2.5 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 60, ev: 2.0 }, { action: 'raise', frequency: 40, size: 3.0, ev: 1.6 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 70, ev: 1.6 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.2 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 65, ev: 1.8 }, { action: 'raise', frequency: 35, size: 3.0, ev: 1.4 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 75, ev: 1.4 }, { action: 'raise', frequency: 25, size: 3.0, ev: 1.0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 70, ev: 1.5 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.1 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3.0, ev: 5.5 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 65, size: 3.0, ev: 3.0 }, { action: 'call', frequency: 35, ev: 2.5 }]),
  'AJo': h('AJo', [{ action: 'call', frequency: 60, ev: 1.8 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.4 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 60, ev: 1.2 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'call', frequency: 60, ev: 1.5 }, { action: 'raise', frequency: 25, size: 3.0, ev: 1.0 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 55, ev: 1.0 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 45, ev: 0.6 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'call', frequency: 50, ev: 0.8 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'call', frequency: 40, ev: 0.5 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'call', frequency: 45, ev: 0.6 }, { action: 'fold', frequency: 55, ev: 0 }]),

  // 3-bet bluffs (suited Ax)
  'A5s': h('A5s', [{ action: 'raise', frequency: 60, size: 3.0, ev: 1.0 }, { action: 'call', frequency: 40, ev: 0.7 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 55, size: 3.0, ev: 0.9 }, { action: 'call', frequency: 45, ev: 0.6 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 50, size: 3.0, ev: 0.7 }, { action: 'call', frequency: 50, ev: 0.5 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 45, size: 3.0, ev: 0.6 }, { action: 'call', frequency: 55, ev: 0.5 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 70, ev: 1.1 }, { action: 'raise', frequency: 30, size: 3.0, ev: 0.7 }]),
  '98s': h('98s', [{ action: 'call', frequency: 70, ev: 0.9 }, { action: 'raise', frequency: 30, size: 3.0, ev: 0.5 }]),
  '87s': h('87s', [{ action: 'call', frequency: 65, ev: 0.8 }, { action: 'raise', frequency: 35, size: 3.0, ev: 0.4 }]),
  '76s': h('76s', [{ action: 'call', frequency: 60, ev: 0.7 }, { action: 'raise', frequency: 40, size: 3.0, ev: 0.3 }]),
  '65s': h('65s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'raise', frequency: 45, size: 3.0, ev: 0.3 }]),
  '54s': h('54s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'raise', frequency: 50, size: 3.0, ev: 0.3 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'call', frequency: 55, ev: 1.2 }, { action: 'raise', frequency: 45, size: 3.0, ev: 0.9 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 50, ev: 1.0 }, { action: 'raise', frequency: 50, size: 3.0, ev: 0.7 }]),
  'A7s': h('A7s', [{ action: 'call', frequency: 45, ev: 0.8 }, { action: 'raise', frequency: 55, size: 3.0, ev: 0.6 }]),
  'A6s': h('A6s', [{ action: 'call', frequency: 45, ev: 0.7 }, { action: 'raise', frequency: 55, size: 3.0, ev: 0.5 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 65, ev: 0.9 }, { action: 'raise', frequency: 35, size: 3.0, ev: 0.5 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 60, ev: 0.6 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 45, size: 3.0, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 40, size: 3.0, ev: 0.3 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'call', frequency: 60, ev: 0.7 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'Q7s': h('Q7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 35, size: 3.0, ev: 0.2 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // One-gappers
  'T8s': h('T8s', [{ action: 'call', frequency: 55, ev: 0.5 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '97s': h('97s', [{ action: 'call', frequency: 50, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '86s': h('86s', [{ action: 'call', frequency: 45, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '75s': h('75s', [{ action: 'call', frequency: 40, ev: 0.2 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '64s': h('64s', [{ action: 'call', frequency: 35, ev: 0.2 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'Q4s', 'Q3s', 'Q2s',
    'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '96s', '95s', '94s', '93s', '92s',
    '85s', '84s', '83s', '82s',
    '74s', '73s', '72s',
    '63s', '62s',
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
// CO vs HJ Open
// HJ opens, CO 3-bets (IP)
// ============================================
const CO_3BET_VS_HJ: Record<string, GTOHandStrategy> = {
  // Tighter 3-betting range against EP opener
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3.0, ev: 9.5 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3.0, ev: 8.0 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3.0, ev: 6.5 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 70, size: 3.0, ev: 5.0 }, { action: 'call', frequency: 30, ev: 4.2 }]),
  'TT': h('TT', [{ action: 'call', frequency: 60, ev: 3.2 }, { action: 'raise', frequency: 40, size: 3.0, ev: 2.8 }]),
  '99': h('99', [{ action: 'call', frequency: 75, ev: 2.0 }, { action: 'raise', frequency: 25, size: 3.0, ev: 1.5 }]),
  '88': h('88', [{ action: 'call', frequency: 80, ev: 1.4 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 75, ev: 1.0 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 65, ev: 0.6 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 55, ev: 0.4 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 45, ev: 0.2 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.1 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3.0, ev: 7.5 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 70, size: 3.0, ev: 5.2 }, { action: 'call', frequency: 30, ev: 4.5 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 55, ev: 3.5 }, { action: 'raise', frequency: 45, size: 3.0, ev: 3.0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 65, ev: 2.6 }, { action: 'raise', frequency: 35, size: 3.0, ev: 2.0 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 60, ev: 2.8 }, { action: 'raise', frequency: 40, size: 3.0, ev: 2.3 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 70, ev: 2.0 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.5 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 75, ev: 1.6 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 70, ev: 1.8 }, { action: 'raise', frequency: 30, size: 3.0, ev: 1.3 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 75, ev: 1.4 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 75, ev: 1.5 }, { action: 'raise', frequency: 25, size: 3.0, ev: 1.0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3.0, ev: 5.8 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 55, size: 3.0, ev: 3.2 }, { action: 'call', frequency: 45, ev: 2.6 }]),
  'AJo': h('AJo', [{ action: 'call', frequency: 65, ev: 1.8 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 55, ev: 1.2 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'call', frequency: 60, ev: 1.5 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 45, ev: 0.9 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 65, ev: 0 }, { action: 'call', frequency: 35, ev: 0.5 }]),
  'QJo': h('QJo', [{ action: 'call', frequency: 40, ev: 0.7 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // 3-bet bluffs (limited vs EP)
  'A5s': h('A5s', [{ action: 'raise', frequency: 50, size: 3.0, ev: 0.8 }, { action: 'call', frequency: 50, ev: 0.6 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 45, size: 3.0, ev: 0.7 }, { action: 'call', frequency: 55, ev: 0.5 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 75, ev: 1.1 }, { action: 'raise', frequency: 25, size: 3.0, ev: 0.6 }]),
  '98s': h('98s', [{ action: 'call', frequency: 75, ev: 0.9 }, { action: 'raise', frequency: 25, size: 3.0, ev: 0.5 }]),
  '87s': h('87s', [{ action: 'call', frequency: 70, ev: 0.7 }, { action: 'raise', frequency: 30, size: 3.0, ev: 0.4 }]),
  '76s': h('76s', [{ action: 'call', frequency: 65, ev: 0.6 }, { action: 'raise', frequency: 35, size: 3.0, ev: 0.3 }]),
  '65s': h('65s', [{ action: 'call', frequency: 60, ev: 0.5 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '54s': h('54s', [{ action: 'call', frequency: 55, ev: 0.5 }, { action: 'fold', frequency: 45, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'call', frequency: 60, ev: 1.1 }, { action: 'raise', frequency: 40, size: 3.0, ev: 0.8 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 55, ev: 0.9 }, { action: 'raise', frequency: 45, size: 3.0, ev: 0.6 }]),
  'A7s': h('A7s', [{ action: 'call', frequency: 50, ev: 0.7 }, { action: 'raise', frequency: 50, size: 3.0, ev: 0.5 }]),
  'A6s': h('A6s', [{ action: 'call', frequency: 50, ev: 0.6 }, { action: 'raise', frequency: 50, size: 3.0, ev: 0.4 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 40, size: 3.0, ev: 0.5 }, { action: 'call', frequency: 60, ev: 0.4 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 35, size: 3.0, ev: 0.4 }, { action: 'call', frequency: 65, ev: 0.3 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 60, ev: 0.8 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 35, size: 3.0, ev: 0.3 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),

  // One-gappers
  'T8s': h('T8s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '97s': h('97s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '86s': h('86s', [{ action: 'call', frequency: 40, ev: 0.3 }, { action: 'fold', frequency: 60, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K4s', 'K3s', 'K2s',
    'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '96s', '95s', '94s', '93s', '92s',
    '85s', '84s', '83s', '82s',
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

// Calculate summary statistics
function calculateSummary(ranges: Record<string, GTOHandStrategy>) {
  let totalHands = 0;
  let playableHands = 0;
  let raiseFreq = 0;
  let callFreq = 0;
  let foldFreq = 0;
  let totalCombos = 0;
  let totalEV = 0;

  for (const hand of Object.values(ranges)) {
    const combos = hand.totalCombos;
    totalHands++;
    totalCombos += combos;

    const foldAction = hand.actions.find(a => a.action === 'fold');
    const raiseAction = hand.actions.find(a => a.action === 'raise');
    const callAction = hand.actions.find(a => a.action === 'call');

    if (!foldAction || foldAction.frequency < 100) {
      playableHands++;
    }

    if (raiseAction) {
      raiseFreq += (raiseAction.frequency / 100) * combos;
      totalEV += raiseAction.ev * (raiseAction.frequency / 100) * combos;
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
    allinFreq: 0, // 3-bet scenarios don't have allin as a separate action
    avgEV: totalEV / totalCombos,
  };
}

// Export 3-Bet strategies
export const GTO_3BET_RANGES: Record<string, GTOStrategy> = {
  'BB_vs_BTN': {
    scenario: create3BetScenario('BB', 'BTN'),
    ranges: BB_3BET_VS_BTN,
    summary: calculateSummary(BB_3BET_VS_BTN),
  },
  'SB_vs_BTN': {
    scenario: create3BetScenario('SB', 'BTN'),
    ranges: SB_3BET_VS_BTN,
    summary: calculateSummary(SB_3BET_VS_BTN),
  },
  'BTN_vs_CO': {
    scenario: create3BetScenario('BTN', 'CO'),
    ranges: BTN_3BET_VS_CO,
    summary: calculateSummary(BTN_3BET_VS_CO),
  },
  'CO_vs_HJ': {
    scenario: create3BetScenario('CO', 'HJ'),
    ranges: CO_3BET_VS_HJ,
    summary: calculateSummary(CO_3BET_VS_HJ),
  },
};

// Get 3-Bet strategy
export function get3BetStrategy(
  heroPosition: Position,
  openerPosition: Position
): GTOStrategy | undefined {
  const key = `${heroPosition}_vs_${openerPosition}`;
  return GTO_3BET_RANGES[key];
}

// Get available 3-Bet scenarios for a given hero position
export function getAvailable3BetScenarios(heroPosition: Position): Position[] {
  const scenarios: Position[] = [];
  for (const key of Object.keys(GTO_3BET_RANGES)) {
    if (key.startsWith(`${heroPosition}_vs_`)) {
      const vsPosition = key.replace(`${heroPosition}_vs_`, '') as Position;
      scenarios.push(vsPosition);
    }
  }
  return scenarios;
}
