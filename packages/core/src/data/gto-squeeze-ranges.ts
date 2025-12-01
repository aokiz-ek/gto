/**
 * GTO Squeeze Range Data
 * Based on 6-max Cash Game, 200bb deep
 *
 * Scenario: Player opens (RFI), another player calls, Hero "squeezes" (3-bets)
 *
 * Squeezing is a powerful move because:
 * 1. We have fold equity against both players
 * 2. The caller has shown weakness (didn't 3-bet)
 * 3. The opener is now sandwiched between two players
 *
 * Common squeeze sizes: 4x-5x the original raise (larger than standard 3-bet)
 */

import type { GTOHandStrategy, GTOStrategy, GTOScenario, Position } from '../types';
import { getComboCount } from './gto-ranges';

// Helper to create hand strategy for squeezing
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

// Calculate equity based on actions
function calculateEquity(hand: string, actions: Array<{ frequency: number; ev: number }>): number {
  const avgEV = actions.reduce((sum, a) => sum + a.frequency * a.ev, 0) / 100;
  return Math.min(100, Math.max(0, 50 + avgEV * 5));
}

// Helper to create squeeze scenario
function createSqueezeScenario(
  heroPosition: Position,
  openerPosition: Position,
  callerPosition: Position
): GTOScenario {
  return {
    id: `6max-cash-200bb-squeeze-${heroPosition.toLowerCase()}-vs-${openerPosition.toLowerCase()}-${callerPosition.toLowerCase()}`,
    gameType: 'cash',
    stackDepth: 200,
    tableSize: 6,
    position: heroPosition,
    actionLine: {
      type: 'squeeze',
      openerPosition: openerPosition,
      callerPosition: callerPosition,
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
// BB Squeeze vs CO Open + BTN Call
// CO opens, BTN calls, BB squeezes
// ============================================
const BB_SQUEEZE_VS_CO_BTN: Record<string, GTOHandStrategy> = {
  // Premium hands - high frequency squeeze
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 4.5, ev: 10.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 4.5, ev: 8.5 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 4.5, ev: 6.8 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 90, size: 4.5, ev: 5.2 }, { action: 'call', frequency: 10, ev: 3.8 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 70, size: 4.5, ev: 3.5 }, { action: 'call', frequency: 30, ev: 2.8 }]),
  '99': h('99', [{ action: 'call', frequency: 55, ev: 2.0 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.8 }]),
  '88': h('88', [{ action: 'call', frequency: 65, ev: 1.4 }, { action: 'raise', frequency: 35, size: 4.5, ev: 1.0 }]),
  '77': h('77', [{ action: 'call', frequency: 70, ev: 1.0 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 60, ev: 0.6 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 50, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 40, ev: 0.2 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.1 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 4.5, ev: 7.5 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 90, size: 4.5, ev: 5.2 }, { action: 'call', frequency: 10, ev: 4.0 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 75, size: 4.5, ev: 3.8 }, { action: 'call', frequency: 25, ev: 3.0 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 50, ev: 2.5 }, { action: 'raise', frequency: 50, size: 4.5, ev: 2.2 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 65, size: 4.5, ev: 3.0 }, { action: 'call', frequency: 35, ev: 2.5 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 55, ev: 2.0 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.6 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 60, ev: 1.6 }, { action: 'raise', frequency: 40, size: 4.5, ev: 1.2 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 55, ev: 1.6 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.2 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 60, ev: 1.3 }, { action: 'raise', frequency: 40, size: 4.5, ev: 0.9 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 60, ev: 1.4 }, { action: 'raise', frequency: 40, size: 4.5, ev: 1.0 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 4.5, ev: 6.0 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 80, size: 4.5, ev: 3.5 }, { action: 'call', frequency: 20, ev: 2.5 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 55, size: 4.5, ev: 2.0 }, { action: 'call', frequency: 35, ev: 1.4 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 50, ev: 1.0 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 45, size: 4.5, ev: 1.5 }, { action: 'call', frequency: 40, ev: 1.2 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 45, ev: 0.8 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'call', frequency: 35, ev: 0.5 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'call', frequency: 40, ev: 0.6 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Squeeze bluff candidates (suited Ax with blockers)
  'A5s': h('A5s', [{ action: 'raise', frequency: 70, size: 4.5, ev: 1.0 }, { action: 'call', frequency: 30, ev: 0.5 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 65, size: 4.5, ev: 0.9 }, { action: 'call', frequency: 35, ev: 0.4 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 0.7 }, { action: 'call', frequency: 45, ev: 0.4 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 50, size: 4.5, ev: 0.6 }, { action: 'call', frequency: 50, ev: 0.3 }]),
  'A9s': h('A9s', [{ action: 'call', frequency: 50, ev: 1.0 }, { action: 'raise', frequency: 50, size: 4.5, ev: 0.8 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 45, ev: 0.8 }, { action: 'raise', frequency: 55, size: 4.5, ev: 0.7 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.7 }, { action: 'call', frequency: 40, ev: 0.5 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 65, size: 4.5, ev: 0.6 }, { action: 'call', frequency: 35, ev: 0.4 }]),

  // Suited connectors (good for squeezing with playability)
  'T9s': h('T9s', [{ action: 'call', frequency: 55, ev: 1.0 }, { action: 'raise', frequency: 45, size: 4.5, ev: 0.6 }]),
  '98s': h('98s', [{ action: 'call', frequency: 55, ev: 0.8 }, { action: 'raise', frequency: 45, size: 4.5, ev: 0.5 }]),
  '87s': h('87s', [{ action: 'call', frequency: 50, ev: 0.7 }, { action: 'raise', frequency: 50, size: 4.5, ev: 0.4 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 0.4 }, { action: 'call', frequency: 45, ev: 0.4 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.4 }, { action: 'call', frequency: 40, ev: 0.3 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.4 }, { action: 'call', frequency: 40, ev: 0.2 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 50, ev: 0.7 }, { action: 'raise', frequency: 50, size: 4.5, ev: 0.5 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 60, ev: 0 }, { action: 'call', frequency: 40, ev: 0.3 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 50, size: 4.5, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 45, size: 4.5, ev: 0.3 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'K4s': h('K4s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Suited Queens
  'Q9s': h('Q9s', [{ action: 'call', frequency: 45, ev: 0.5 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // One-gappers
  'T8s': h('T8s', [{ action: 'call', frequency: 45, ev: 0.5 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '97s': h('97s', [{ action: 'call', frequency: 40, ev: 0.4 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '86s': h('86s', [{ action: 'call', frequency: 35, ev: 0.3 }, { action: 'fold', frequency: 65, ev: 0 }]),
  '75s': h('75s', [{ action: 'call', frequency: 30, ev: 0.2 }, { action: 'fold', frequency: 70, ev: 0 }]),

  // Suited Jacks
  'J9s': h('J9s', [{ action: 'call', frequency: 45, ev: 0.5 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'J8s': h('J8s', [{ action: 'call', frequency: 35, ev: 0.3 }, { action: 'fold', frequency: 65, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
    'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
    '96s', '95s', '94s', '93s', '92s',
    '85s', '84s', '83s', '82s',
    '74s', '73s', '72s',
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
// SB Squeeze vs HJ Open + CO Call
// HJ opens, CO calls, SB squeezes
// ============================================
const SB_SQUEEZE_VS_HJ_CO: Record<string, GTOHandStrategy> = {
  // Tighter squeeze range vs EP opener
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 4.5, ev: 10.5 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 4.5, ev: 9.0 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 4.5, ev: 7.2 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 95, size: 4.5, ev: 5.5 }, { action: 'call', frequency: 5, ev: 4.0 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 80, size: 4.5, ev: 4.0 }, { action: 'call', frequency: 20, ev: 3.0 }]),
  '99': h('99', [{ action: 'raise', frequency: 60, size: 4.5, ev: 2.5 }, { action: 'call', frequency: 40, ev: 2.0 }]),
  '88': h('88', [{ action: 'call', frequency: 60, ev: 1.5 }, { action: 'raise', frequency: 40, size: 4.5, ev: 1.2 }]),
  '77': h('77', [{ action: 'call', frequency: 65, ev: 1.0 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.2 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 4.5, ev: 8.0 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 95, size: 4.5, ev: 5.5 }, { action: 'call', frequency: 5, ev: 4.2 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 80, size: 4.5, ev: 4.0 }, { action: 'call', frequency: 20, ev: 3.2 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 60, size: 4.5, ev: 2.8 }, { action: 'call', frequency: 40, ev: 2.5 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 70, size: 4.5, ev: 3.2 }, { action: 'call', frequency: 30, ev: 2.6 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 50, ev: 2.0 }, { action: 'raise', frequency: 50, size: 4.5, ev: 1.8 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 55, ev: 1.6 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.3 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 50, ev: 1.6 }, { action: 'raise', frequency: 50, size: 4.5, ev: 1.4 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 55, ev: 1.3 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 55, ev: 1.4 }, { action: 'raise', frequency: 45, size: 4.5, ev: 1.1 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 4.5, ev: 6.5 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 85, size: 4.5, ev: 3.8 }, { action: 'call', frequency: 15, ev: 2.8 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 60, size: 4.5, ev: 2.2 }, { action: 'call', frequency: 30, ev: 1.5 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 45, ev: 1.0 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 50, size: 4.5, ev: 1.6 }, { action: 'call', frequency: 35, ev: 1.2 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 40, ev: 0.8 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.4 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.5 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Squeeze bluff candidates
  'A5s': h('A5s', [{ action: 'raise', frequency: 75, size: 4.5, ev: 1.2 }, { action: 'call', frequency: 25, ev: 0.6 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 70, size: 4.5, ev: 1.0 }, { action: 'call', frequency: 30, ev: 0.5 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.8 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 0.7 }, { action: 'fold', frequency: 45, ev: 0 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 1.0 }, { action: 'call', frequency: 45, ev: 0.8 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.8 }, { action: 'call', frequency: 40, ev: 0.6 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 65, size: 4.5, ev: 0.8 }, { action: 'call', frequency: 35, ev: 0.5 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 70, size: 4.5, ev: 0.7 }, { action: 'fold', frequency: 30, ev: 0 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 50, ev: 0.9 }, { action: 'raise', frequency: 50, size: 4.5, ev: 0.6 }]),
  '98s': h('98s', [{ action: 'call', frequency: 50, ev: 0.7 }, { action: 'raise', frequency: 50, size: 4.5, ev: 0.5 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 0.5 }, { action: 'call', frequency: 45, ev: 0.4 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 60, size: 4.5, ev: 0.4 }, { action: 'call', frequency: 40, ev: 0.3 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 65, size: 4.5, ev: 0.4 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 65, size: 4.5, ev: 0.4 }, { action: 'fold', frequency: 35, ev: 0 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'raise', frequency: 50, size: 4.5, ev: 0.6 }, { action: 'call', frequency: 50, ev: 0.5 }]),
  'K8s': h('K8s', [{ action: 'fold', frequency: 60, ev: 0 }, { action: 'call', frequency: 40, ev: 0.4 }]),
  'K7s': h('K7s', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 55, size: 4.5, ev: 0.4 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 50, size: 4.5, ev: 0.4 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K4s', 'K3s', 'K2s',
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
// BTN Squeeze vs UTG Open + HJ Call
// UTG opens, HJ calls, BTN squeezes (IP)
// ============================================
const BTN_SQUEEZE_VS_UTG_HJ: Record<string, GTOHandStrategy> = {
  // Very tight squeeze range vs UTG (strongest openers)
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 4.0, ev: 11.0 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 4.0, ev: 9.5 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 4.0, ev: 7.8 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 85, size: 4.0, ev: 6.0 }, { action: 'call', frequency: 15, ev: 4.5 }]),
  'TT': h('TT', [{ action: 'call', frequency: 55, ev: 3.5 }, { action: 'raise', frequency: 45, size: 4.0, ev: 3.2 }]),
  '99': h('99', [{ action: 'call', frequency: 70, ev: 2.2 }, { action: 'raise', frequency: 30, size: 4.0, ev: 1.8 }]),
  '88': h('88', [{ action: 'call', frequency: 75, ev: 1.6 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '77': h('77', [{ action: 'call', frequency: 70, ev: 1.2 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '66': h('66', [{ action: 'call', frequency: 60, ev: 0.8 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '55': h('55', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '44': h('44', [{ action: 'call', frequency: 40, ev: 0.3 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.1 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 4.0, ev: 8.5 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 80, size: 4.0, ev: 5.8 }, { action: 'call', frequency: 20, ev: 4.5 }]),
  'AJs': h('AJs', [{ action: 'call', frequency: 55, ev: 3.8 }, { action: 'raise', frequency: 45, size: 4.0, ev: 3.3 }]),
  'ATs': h('ATs', [{ action: 'call', frequency: 65, ev: 2.8 }, { action: 'raise', frequency: 35, size: 4.0, ev: 2.3 }]),
  'KQs': h('KQs', [{ action: 'call', frequency: 55, ev: 2.8 }, { action: 'raise', frequency: 45, size: 4.0, ev: 2.4 }]),
  'KJs': h('KJs', [{ action: 'call', frequency: 65, ev: 2.2 }, { action: 'raise', frequency: 35, size: 4.0, ev: 1.7 }]),
  'KTs': h('KTs', [{ action: 'call', frequency: 70, ev: 1.8 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'call', frequency: 65, ev: 1.8 }, { action: 'raise', frequency: 35, size: 4.0, ev: 1.4 }]),
  'QTs': h('QTs', [{ action: 'call', frequency: 70, ev: 1.5 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'call', frequency: 70, ev: 1.6 }, { action: 'raise', frequency: 30, size: 4.0, ev: 1.2 }]),

  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 4.0, ev: 7.0 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 65, size: 4.0, ev: 4.0 }, { action: 'call', frequency: 35, ev: 3.0 }]),
  'AJo': h('AJo', [{ action: 'call', frequency: 60, ev: 2.0 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'call', frequency: 50, ev: 1.3 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'call', frequency: 55, ev: 1.5 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'call', frequency: 45, ev: 1.0 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'fold', frequency: 70, ev: 0 }, { action: 'call', frequency: 30, ev: 0.5 }]),
  'QJo': h('QJo', [{ action: 'fold', frequency: 65, ev: 0 }, { action: 'call', frequency: 35, ev: 0.6 }]),
  'QTo': h('QTo', [{ action: 'fold', frequency: 100, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'fold', frequency: 100, ev: 0 }]),

  // Squeeze bluffs (limited vs UTG)
  'A5s': h('A5s', [{ action: 'raise', frequency: 55, size: 4.0, ev: 1.0 }, { action: 'call', frequency: 45, ev: 0.7 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 50, size: 4.0, ev: 0.9 }, { action: 'call', frequency: 50, ev: 0.6 }]),

  // Other suited Ax
  'A9s': h('A9s', [{ action: 'call', frequency: 60, ev: 1.2 }, { action: 'raise', frequency: 40, size: 4.0, ev: 0.8 }]),
  'A8s': h('A8s', [{ action: 'call', frequency: 55, ev: 1.0 }, { action: 'raise', frequency: 45, size: 4.0, ev: 0.7 }]),
  'A7s': h('A7s', [{ action: 'call', frequency: 50, ev: 0.8 }, { action: 'raise', frequency: 50, size: 4.0, ev: 0.6 }]),
  'A6s': h('A6s', [{ action: 'call', frequency: 50, ev: 0.7 }, { action: 'raise', frequency: 50, size: 4.0, ev: 0.5 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 45, size: 4.0, ev: 0.6 }, { action: 'call', frequency: 55, ev: 0.5 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 40, size: 4.0, ev: 0.5 }, { action: 'call', frequency: 60, ev: 0.4 }]),

  // Suited connectors
  'T9s': h('T9s', [{ action: 'call', frequency: 70, ev: 1.2 }, { action: 'raise', frequency: 30, size: 4.0, ev: 0.7 }]),
  '98s': h('98s', [{ action: 'call', frequency: 70, ev: 1.0 }, { action: 'raise', frequency: 30, size: 4.0, ev: 0.6 }]),
  '87s': h('87s', [{ action: 'call', frequency: 65, ev: 0.9 }, { action: 'raise', frequency: 35, size: 4.0, ev: 0.5 }]),
  '76s': h('76s', [{ action: 'call', frequency: 60, ev: 0.7 }, { action: 'raise', frequency: 40, size: 4.0, ev: 0.4 }]),
  '65s': h('65s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '54s': h('54s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // Suited Kings
  'K9s': h('K9s', [{ action: 'call', frequency: 60, ev: 0.8 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'K8s': h('K8s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),

  // One-gappers
  'T8s': h('T8s', [{ action: 'call', frequency: 55, ev: 0.6 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '97s': h('97s', [{ action: 'call', frequency: 50, ev: 0.5 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '86s': h('86s', [{ action: 'call', frequency: 45, ev: 0.4 }, { action: 'fold', frequency: 55, ev: 0 }]),

  // Rest are folds
  ...generateFolds([
    'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
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
    allinFreq: 0, // Squeeze scenarios don't have allin as a separate action
    avgEV: totalEV / totalCombos,
  };
}

// Export Squeeze strategies
export const GTO_SQUEEZE_RANGES: Record<string, GTOStrategy> = {
  'BB_vs_CO_BTN': {
    scenario: createSqueezeScenario('BB', 'CO', 'BTN'),
    ranges: BB_SQUEEZE_VS_CO_BTN,
    summary: calculateSummary(BB_SQUEEZE_VS_CO_BTN),
  },
  'SB_vs_HJ_CO': {
    scenario: createSqueezeScenario('SB', 'HJ', 'CO'),
    ranges: SB_SQUEEZE_VS_HJ_CO,
    summary: calculateSummary(SB_SQUEEZE_VS_HJ_CO),
  },
  'BTN_vs_UTG_HJ': {
    scenario: createSqueezeScenario('BTN', 'UTG', 'HJ'),
    ranges: BTN_SQUEEZE_VS_UTG_HJ,
    summary: calculateSummary(BTN_SQUEEZE_VS_UTG_HJ),
  },
};

// Get Squeeze strategy
export function getSqueezeStrategy(
  heroPosition: Position,
  openerPosition: Position,
  callerPosition: Position
): GTOStrategy | undefined {
  const key = `${heroPosition}_vs_${openerPosition}_${callerPosition}`;
  return GTO_SQUEEZE_RANGES[key];
}

// Get available squeeze scenarios for a given hero position
export function getAvailableSqueezeScenarios(heroPosition: Position): Array<{ opener: Position; caller: Position }> {
  const scenarios: Array<{ opener: Position; caller: Position }> = [];
  for (const key of Object.keys(GTO_SQUEEZE_RANGES)) {
    if (key.startsWith(`${heroPosition}_vs_`)) {
      const rest = key.replace(`${heroPosition}_vs_`, '');
      const [opener, caller] = rest.split('_') as [Position, Position];
      scenarios.push({ opener, caller });
    }
  }
  return scenarios;
}
