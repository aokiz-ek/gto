/**
 * GTO Deep Stack Ranges (150BB and 200BB)
 *
 * Deep stack play differs from 100BB:
 * - Wider RFI ranges due to better implied odds
 * - Small pairs and suited connectors gain value
 * - 3-bet ranges become more polarized
 * - More emphasis on playability post-flop
 */

import type { GTOHandStrategy, Position } from '../types';

// Helper to get combo count
function getComboCount(hand: string): number {
  if (hand.length === 2) return 6; // Pairs
  if (hand.endsWith('s')) return 4; // Suited
  return 12; // Offsuit
}

// Calculate equity based on actions
function calculateEquity(hand: string, actions: Array<{ frequency: number; ev: number }>): number {
  const avgEV = actions.reduce((sum, a) => sum + a.frequency * a.ev, 0) / 100;
  return Math.min(100, Math.max(0, 50 + avgEV * 5));
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

// ============================================
// 150BB RANGES - Slightly wider than 100BB
// ============================================

const UTG_150BB: Record<string, GTOHandStrategy> = {
  // Premium - Always raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.55 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.02 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.55 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.15 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.82 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '77': h('77', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '66': h('66', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '55': h('55', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '44': h('44', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '33': h('33', [{ action: 'fold', frequency: 100, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Broadway Suited
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.45 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.05 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 60, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 30, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 70, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 35, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 65, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 25, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 75, ev: 0 }]),
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 35, size: 2.5, ev: 0.10 }, { action: 'fold', frequency: 65, ev: 0 }]),
  // Broadway Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.12 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.45 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 60, ev: 0 }]),
};

const HJ_150BB: Record<string, GTOHandStrategy> = {
  // Premium
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.60 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.08 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.62 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.22 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '66': h('66', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '55': h('55', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '44': h('44', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 50, ev: 0 }]),
  '33': h('33', [{ action: 'raise', frequency: 30, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 70, ev: 0 }]),
  '22': h('22', [{ action: 'fold', frequency: 100, ev: 0 }]),
  // Suited Aces
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.52 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.12 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.85 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.42 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.35 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 55, ev: 0 }]),
  // Other suited
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 55, ev: 0 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 30, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 70, ev: 0 }]),
  // Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.18 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.35 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.42 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 60, ev: 0 }]),
};

const CO_150BB: Record<string, GTOHandStrategy> = {
  // All pairs raise
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.65 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.15 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.72 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.35 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.05 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  '44': h('44', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '33': h('33', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '22': h('22', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 45, ev: 0 }]),
  // All suited aces
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.58 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.22 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  // Suited broadways and connectors
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.82 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 55, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'T8s': h('T8s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '97s': h('97s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 45, ev: 0 }]),
  // Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.25 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A9o': h('A9o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.38 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 35, ev: 0 }]),
};

const BTN_150BB: Record<string, GTOHandStrategy> = {
  // All pairs
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.75 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.25 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.85 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.48 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.18 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '44': h('44', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  '33': h('33', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.22 }]),
  '22': h('22', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.18 }]),
  // All suited aces
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.68 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.32 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.08 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  // All suited kings
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.95 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  // Queens and suited connectors
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'Q7s': h('Q7s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'J7s': h('J7s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'T8s': h('T8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'T7s': h('T7s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '97s': h('97s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '96s': h('96s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '86s': h('86s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  '53s': h('53s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 35, ev: 0 }]),
  '43s': h('43s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 30, ev: 0 }]),
  // Offsuit hands
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.35 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.98 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'A9o': h('A9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'K9o': h('K9o', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'K8o': h('K8o', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'J9o': h('J9o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'T9o': h('T9o', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '98o': h('98o', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
};

const SB_150BB: Record<string, GTOHandStrategy> = {
  // Premium - raise or 3bet depending on action
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 3, ev: 2.45 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 3, ev: 1.95 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 3, ev: 1.55 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 3, ev: 1.18 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 3, ev: 0.88 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 3, ev: 0.65 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  '66': h('66', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  '55': h('55', [{ action: 'raise', frequency: 100, size: 3, ev: 0.22 }]),
  '44': h('44', [{ action: 'raise', frequency: 100, size: 3, ev: 0.18 }]),
  '33': h('33', [{ action: 'raise', frequency: 100, size: 3, ev: 0.15 }]),
  '22': h('22', [{ action: 'raise', frequency: 100, size: 3, ev: 0.12 }]),
  // Suited Aces
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.42 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 3, ev: 1.05 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.82 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.65 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.25 }]),
  // Suited broadway
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.72 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.58 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 90, size: 3, ev: 0.25 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 80, size: 3, ev: 0.20 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 75, size: 3, ev: 0.18 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 70, size: 3, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.52 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.45 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 90, size: 3, ev: 0.25 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'T8s': h('T8s', [{ action: 'raise', frequency: 95, size: 3, ev: 0.30 }, { action: 'fold', frequency: 5, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.35 }]),
  '97s': h('97s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 95, size: 3, ev: 0.28 }, { action: 'fold', frequency: 5, ev: 0 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 90, size: 3, ev: 0.25 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 85, size: 3, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  // Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 3, ev: 1.08 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.72 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.55 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.42 }]),
  'A9o': h('A9o', [{ action: 'raise', frequency: 95, size: 3, ev: 0.28 }, { action: 'fold', frequency: 5, ev: 0 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 90, size: 3, ev: 0.22 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 80, size: 3, ev: 0.18 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 70, size: 3, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.22 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.18 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 65, size: 3, ev: 0.15 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 55, size: 3, ev: 0.12 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.48 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.38 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'K9o': h('K9o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.18 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.32 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 95, size: 3, ev: 0.25 }, { action: 'fold', frequency: 5, ev: 0 }]),
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 70, size: 3, ev: 0.15 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 100, size: 3, ev: 0.28 }]),
  'J9o': h('J9o', [{ action: 'raise', frequency: 75, size: 3, ev: 0.18 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'T9o': h('T9o', [{ action: 'raise', frequency: 85, size: 3, ev: 0.20 }, { action: 'fold', frequency: 15, ev: 0 }]),
};

// ============================================
// 200BB RANGES - Even wider, more speculative hands
// ============================================

const UTG_200BB: Record<string, GTOHandStrategy> = {
  // All pairs open - deeper stacks = better set mining
  'AA': h('AA', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.65 }]),
  'KK': h('KK', [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.12 }]),
  'QQ': h('QQ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.65 }]),
  'JJ': h('JJ', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.25 }]),
  'TT': h('TT', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.92 }]),
  '99': h('99', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  '88': h('88', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '77': h('77', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '66': h('66', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '55': h('55', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.18 }, { action: 'fold', frequency: 30, ev: 0 }]),
  '44': h('44', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.12 }, { action: 'fold', frequency: 45, ev: 0 }]),
  '33': h('33', [{ action: 'raise', frequency: 40, size: 2.5, ev: 0.08 }, { action: 'fold', frequency: 60, ev: 0 }]),
  '22': h('22', [{ action: 'raise', frequency: 30, size: 2.5, ev: 0.05 }, { action: 'fold', frequency: 70, ev: 0 }]),
  // Suited aces - all open
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.55 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.15 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.45 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.35 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 40, ev: 0 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 50, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 50, ev: 0 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.38 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 65, size: 2.5, ev: 0.30 }, { action: 'fold', frequency: 35, ev: 0 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 55, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 45, ev: 0 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.20 }, { action: 'fold', frequency: 55, ev: 0 }]),
  // Broadway suited
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 70, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 30, ev: 0 }]),
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.30 }, { action: 'fold', frequency: 20, ev: 0 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 40, ev: 0 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 45, size: 2.5, ev: 0.15 }, { action: 'fold', frequency: 55, ev: 0 }]),
  // Offsuit
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.22 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.82 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.38 }, { action: 'fold', frequency: 25, ev: 0 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.42 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 60, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 40, ev: 0 }]),
};

// 200BB ranges for other positions follow similar patterns with wider ranges
const BTN_200BB: Record<string, GTOHandStrategy> = {
  // All pairs
  ...Object.fromEntries(
    ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'].map((hand, i) => [
      hand,
      h(hand, [{ action: 'raise', frequency: 100, size: 2.5, ev: 2.85 - i * 0.22 }])
    ])
  ),
  // All suited aces
  'AKs': h('AKs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.78 }]),
  'AQs': h('AQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.42 }]),
  'AJs': h('AJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.18 }]),
  'ATs': h('ATs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.98 }]),
  'A9s': h('A9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'A8s': h('A8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'A7s': h('A7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  'A6s': h('A6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'A5s': h('A5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'A4s': h('A4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'A3s': h('A3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'A2s': h('A2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  // All suited kings
  'KQs': h('KQs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.05 }]),
  'KJs': h('KJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'KTs': h('KTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'K9s': h('K9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'K8s': h('K8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'K7s': h('K7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'K6s': h('K6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'K5s': h('K5s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'K4s': h('K4s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'K3s': h('K3s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'K2s': h('K2s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.25 }]),
  // Suited queens
  'QJs': h('QJs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.78 }]),
  'QTs': h('QTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.68 }]),
  'Q9s': h('Q9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'Q8s': h('Q8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'Q7s': h('Q7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'Q6s': h('Q6s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'Q5s': h('Q5s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  'Q4s': h('Q4s', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 20, ev: 0 }]),
  // Suited connectors - all open at 200BB
  'JTs': h('JTs', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'J9s': h('J9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'J8s': h('J8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'J7s': h('J7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'T9s': h('T9s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.65 }]),
  'T8s': h('T8s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'T7s': h('T7s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '98s': h('98s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.58 }]),
  '97s': h('97s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '96s': h('96s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '87s': h('87s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  '86s': h('86s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '85s': h('85s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '76s': h('76s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  '75s': h('75s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  '74s': h('74s', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '65s': h('65s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  '64s': h('64s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '54s': h('54s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  '53s': h('53s', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.32 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '43s': h('43s', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '32s': h('32s', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 25, ev: 0 }]),
  // Offsuit - very wide from BTN at 200BB
  'AKo': h('AKo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.45 }]),
  'AQo': h('AQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 1.08 }]),
  'AJo': h('AJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.88 }]),
  'ATo': h('ATo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.72 }]),
  'A9o': h('A9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'A8o': h('A8o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A7o': h('A7o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A6o': h('A6o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'A5o': h('A5o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'A4o': h('A4o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'A3o': h('A3o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'A2o': h('A2o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.28 }]),
  'KQo': h('KQo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.75 }]),
  'KJo': h('KJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.62 }]),
  'KTo': h('KTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.52 }]),
  'K9o': h('K9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'K8o': h('K8o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.32 }]),
  'K7o': h('K7o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 15, ev: 0 }]),
  'QJo': h('QJo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.55 }]),
  'QTo': h('QTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.45 }]),
  'Q9o': h('Q9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  'Q8o': h('Q8o', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'JTo': h('JTo', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.48 }]),
  'J9o': h('J9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.38 }]),
  'J8o': h('J8o', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.25 }, { action: 'fold', frequency: 20, ev: 0 }]),
  'T9o': h('T9o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.42 }]),
  'T8o': h('T8o', [{ action: 'raise', frequency: 85, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 15, ev: 0 }]),
  '98o': h('98o', [{ action: 'raise', frequency: 100, size: 2.5, ev: 0.35 }]),
  '97o': h('97o', [{ action: 'raise', frequency: 75, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 25, ev: 0 }]),
  '87o': h('87o', [{ action: 'raise', frequency: 90, size: 2.5, ev: 0.28 }, { action: 'fold', frequency: 10, ev: 0 }]),
  '76o': h('76o', [{ action: 'raise', frequency: 80, size: 2.5, ev: 0.22 }, { action: 'fold', frequency: 20, ev: 0 }]),
};

// ============================================
// EXPORTS
// ============================================

export const GTO_RANGES_150BB: Record<Position, Record<string, GTOHandStrategy>> = {
  'UTG': UTG_150BB,
  'UTG1': UTG_150BB,
  'UTG2': UTG_150BB,
  'LJ': HJ_150BB,
  'HJ': HJ_150BB,
  'CO': CO_150BB,
  'BTN': BTN_150BB,
  'SB': SB_150BB,
  'BB': {}, // BB doesn't RFI
};

export const GTO_RANGES_200BB: Record<Position, Record<string, GTOHandStrategy>> = {
  'UTG': UTG_200BB,
  'UTG1': UTG_200BB,
  'UTG2': UTG_200BB,
  'LJ': UTG_200BB, // Slightly wider than UTG
  'HJ': { ...HJ_150BB }, // Similar to 150BB HJ
  'CO': { ...CO_150BB }, // Wider than 150BB
  'BTN': BTN_200BB,
  'SB': { ...SB_150BB },
  'BB': {},
};

/**
 * Get deep stack strategy for a position
 */
export function getDeepStackStrategy(
  position: Position,
  stackDepth: 150 | 200
): Record<string, GTOHandStrategy> {
  const ranges = stackDepth === 150 ? GTO_RANGES_150BB : GTO_RANGES_200BB;
  return ranges[position] || {};
}

/**
 * Get deep stack 3-bet strategy (placeholder - use GTO_3BET_RANGES from main file)
 * Deep 3-bet ranges are more polarized with stronger value and playable bluffs
 */
export function getDeep3BetStrategy(
  _heroPosition: Position,
  _vsPosition: Position,
  _stackDepth: 150 | 200
): Record<string, GTOHandStrategy> {
  // For deep stacks, 3-bet ranges become:
  // - Tighter for value (AA-QQ, AK mandatory)
  // - More suited connectors as bluffs (playability > blockers)
  // - Fewer offsuit broadway bluffs
  // This is a simplified placeholder - real data would be more comprehensive
  return {};
}

/**
 * Check if we have deep stack data for a position/depth
 */
export function hasDeepStackData(position: Position, stackDepth: 150 | 200): boolean {
  const ranges = stackDepth === 150 ? GTO_RANGES_150BB : GTO_RANGES_200BB;
  return Object.keys(ranges[position] || {}).length > 0;
}

/**
 * Get available stack depths
 */
export function getAvailableStackDepths(): number[] {
  return [100, 150, 200];
}
