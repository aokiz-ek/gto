// GTO Postflop Ranges - Flop/Turn/River strategies
// Based on common GTO solutions for standard spots
// Expanded with comprehensive scenarios for all streets

import type { Position, Card } from '../types';

// Board texture types
export type BoardTexture = 'dry' | 'wet' | 'monotone' | 'paired' | 'connected' | 'high' | 'low' | 'ace_high';
export type DrawType = 'flush_draw' | 'straight_draw' | 'combo_draw' | 'gutshot' | 'oesd' | 'backdoor_flush' | 'backdoor_straight' | 'no_draw';

// Stack-to-Pot Ratio categories
export type SPRCategory = 'micro' | 'small' | 'medium' | 'large' | 'deep';
// micro: < 2 SPR (commit territory)
// small: 2-4 SPR (one street of betting)
// medium: 4-8 SPR (two streets)
// large: 8-13 SPR (standard)
// deep: > 13 SPR (multiple streets possible)

// Player count for multi-way pots
export type PlayerCount = 'heads_up' | 'three_way' | 'multi_way';

// Hand strength categories
export type HandStrength =
  | 'nuts'           // Best possible hand or near-nuts
  | 'strong'         // Two pair+, strong overpair
  | 'medium'         // Top pair good kicker, overpair
  | 'marginal'       // Top pair weak kicker, middle pair
  | 'weak'           // Bottom pair, weak holdings
  | 'draw'           // Drawing hands
  | 'air';           // No made hand, no draw

// Postflop action types
export interface PostflopAction {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  frequency: number;  // 0-100 percentage
  size?: number;      // As percentage of pot (33, 50, 75, 100, 150)
  ev: number;
}

export interface PostflopStrategy {
  handStrength: HandStrength;
  hasPosition: boolean;
  actions: PostflopAction[];
}

// Flop C-Bet scenarios (IP = In Position, OOP = Out of Position)
export interface FlopCBetScenario {
  position: 'IP' | 'OOP';
  boardTexture: BoardTexture;
  strategies: Record<HandStrength, PostflopAction[]>;
}

// Standard C-Bet frequencies based on board texture
export const FLOP_CBET_IP: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'bet', frequency: 85, size: 33, ev: 2.5 },
      { action: 'check', frequency: 15, ev: 1.8 },
    ],
    strong: [
      { action: 'bet', frequency: 90, size: 33, ev: 1.8 },
      { action: 'check', frequency: 10, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: 75, size: 33, ev: 0.8 },
      { action: 'check', frequency: 25, ev: 0.5 },
    ],
    marginal: [
      { action: 'bet', frequency: 55, size: 33, ev: 0.3 },
      { action: 'check', frequency: 45, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 70, ev: 0.1 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 33, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 65, ev: -0.1 },
      { action: 'bet', frequency: 35, size: 33, ev: -0.2 },
    ],
  },
  wet: {
    nuts: [
      { action: 'bet', frequency: 95, size: 75, ev: 3.0 },
      { action: 'check', frequency: 5, ev: 2.0 },
    ],
    strong: [
      { action: 'bet', frequency: 85, size: 75, ev: 2.0 },
      { action: 'check', frequency: 15, ev: 1.0 },
    ],
    medium: [
      { action: 'bet', frequency: 60, size: 50, ev: 0.6 },
      { action: 'check', frequency: 40, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'fold', frequency: 20, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 70, size: 75, ev: 0.5 },
      { action: 'check', frequency: 30, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 75, ev: -0.2 },
      { action: 'bet', frequency: 25, size: 50, ev: -0.3 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'bet', frequency: 90, size: 50, ev: 2.8 },
      { action: 'check', frequency: 10, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 50, ev: 1.5 },
      { action: 'check', frequency: 30, ev: 1.0 },
    ],
    medium: [
      { action: 'check', frequency: 55, ev: 0.4 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 70, ev: 0.1 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.0 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'fold', frequency: 15, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 80, size: 50, ev: 0.8 },
      { action: 'check', frequency: 20, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 80, ev: -0.3 },
      { action: 'bet', frequency: 20, size: 33, ev: -0.4 },
    ],
  },
  paired: {
    nuts: [
      { action: 'bet', frequency: 85, size: 33, ev: 2.2 },
      { action: 'check', frequency: 15, ev: 1.8 },
    ],
    strong: [
      { action: 'bet', frequency: 80, size: 33, ev: 1.5 },
      { action: 'check', frequency: 20, ev: 1.0 },
    ],
    medium: [
      { action: 'bet', frequency: 65, size: 33, ev: 0.6 },
      { action: 'check', frequency: 35, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 55, ev: 0.2 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 75, ev: 0.0 },
      { action: 'bet', frequency: 25, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 55, size: 33, ev: 0.3 },
      { action: 'check', frequency: 45, ev: 0.2 },
    ],
    air: [
      { action: 'bet', frequency: 50, size: 33, ev: 0.0 },
      { action: 'check', frequency: 50, ev: -0.1 },
    ],
  },
  connected: {
    nuts: [
      { action: 'bet', frequency: 90, size: 66, ev: 2.8 },
      { action: 'check', frequency: 10, ev: 2.0 },
    ],
    strong: [
      { action: 'bet', frequency: 80, size: 66, ev: 1.8 },
      { action: 'check', frequency: 20, ev: 1.0 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.5 },
      { action: 'check', frequency: 45, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'fold', frequency: 20, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 75, size: 66, ev: 0.6 },
      { action: 'check', frequency: 25, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 70, ev: -0.2 },
      { action: 'bet', frequency: 30, size: 50, ev: -0.3 },
    ],
  },
  high: {
    nuts: [
      { action: 'bet', frequency: 85, size: 50, ev: 2.6 },
      { action: 'check', frequency: 15, ev: 2.0 },
    ],
    strong: [
      { action: 'bet', frequency: 85, size: 50, ev: 1.7 },
      { action: 'check', frequency: 15, ev: 1.1 },
    ],
    medium: [
      { action: 'bet', frequency: 70, size: 33, ev: 0.7 },
      { action: 'check', frequency: 30, ev: 0.5 },
    ],
    marginal: [
      { action: 'bet', frequency: 55, size: 33, ev: 0.3 },
      { action: 'check', frequency: 45, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 70, ev: 0.1 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 50, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 65, ev: -0.1 },
      { action: 'bet', frequency: 35, size: 33, ev: -0.2 },
    ],
  },
  low: {
    nuts: [
      { action: 'bet', frequency: 80, size: 33, ev: 2.3 },
      { action: 'check', frequency: 20, ev: 1.8 },
    ],
    strong: [
      { action: 'bet', frequency: 75, size: 33, ev: 1.5 },
      { action: 'check', frequency: 25, ev: 1.1 },
    ],
    medium: [
      { action: 'bet', frequency: 60, size: 33, ev: 0.6 },
      { action: 'check', frequency: 40, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 50, ev: 0.3 },
      { action: 'bet', frequency: 50, size: 33, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 75, ev: 0.1 },
      { action: 'bet', frequency: 25, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 55, size: 33, ev: 0.4 },
      { action: 'check', frequency: 45, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 70, ev: -0.1 },
      { action: 'bet', frequency: 30, size: 33, ev: -0.2 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'bet', frequency: 90, size: 33, ev: 2.5 },
      { action: 'check', frequency: 10, ev: 1.9 },
    ],
    strong: [
      { action: 'bet', frequency: 90, size: 33, ev: 1.8 },
      { action: 'check', frequency: 10, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: 80, size: 33, ev: 0.9 },
      { action: 'check', frequency: 20, ev: 0.6 },
    ],
    marginal: [
      { action: 'bet', frequency: 65, size: 33, ev: 0.4 },
      { action: 'check', frequency: 35, ev: 0.3 },
    ],
    weak: [
      { action: 'check', frequency: 65, ev: 0.1 },
      { action: 'bet', frequency: 35, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 33, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 60, ev: -0.1 },
      { action: 'bet', frequency: 40, size: 33, ev: -0.1 },
    ],
  },
};

// OOP C-Bet strategies (Out of Position - more polarized, less frequent)
export const FLOP_CBET_OOP: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'bet', frequency: 75, size: 33, ev: 2.2 },
      { action: 'check', frequency: 25, ev: 1.9 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 33, ev: 1.5 },
      { action: 'check', frequency: 30, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 55, ev: 0.6 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 70, ev: 0.3 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.1 },
      { action: 'bet', frequency: 15, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'check', frequency: 55, ev: 0.3 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 75, ev: -0.1 },
      { action: 'bet', frequency: 25, size: 33, ev: -0.2 },
    ],
  },
  wet: {
    nuts: [
      { action: 'bet', frequency: 85, size: 66, ev: 2.8 },
      { action: 'check', frequency: 15, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 66, ev: 1.8 },
      { action: 'check', frequency: 30, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 60, ev: 0.5 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 75, ev: 0.2 },
      { action: 'bet', frequency: 25, size: 50, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 90, ev: 0.0 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 66, ev: 0.5 },
      { action: 'check', frequency: 40, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 80, ev: -0.2 },
      { action: 'bet', frequency: 20, size: 50, ev: -0.3 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'bet', frequency: 80, size: 50, ev: 2.5 },
      { action: 'check', frequency: 20, ev: 2.0 },
    ],
    strong: [
      { action: 'check', frequency: 50, ev: 1.2 },
      { action: 'bet', frequency: 50, size: 50, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 70, ev: 0.4 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 85, ev: 0.1 },
      { action: 'bet', frequency: 15, size: 33, ev: 0.0 },
    ],
    weak: [
      { action: 'check', frequency: 95, ev: 0.0 },
      { action: 'fold', frequency: 5, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 70, size: 50, ev: 0.7 },
      { action: 'check', frequency: 30, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 90, ev: -0.2 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.4 },
    ],
  },
  paired: {
    nuts: [
      { action: 'bet', frequency: 70, size: 33, ev: 2.0 },
      { action: 'check', frequency: 30, ev: 1.7 },
    ],
    strong: [
      { action: 'bet', frequency: 65, size: 33, ev: 1.3 },
      { action: 'check', frequency: 35, ev: 1.0 },
    ],
    medium: [
      { action: 'check', frequency: 55, ev: 0.5 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 70, ev: 0.2 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'check', frequency: 55, ev: 0.2 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.2 },
    ],
    air: [
      { action: 'bet', frequency: 40, size: 33, ev: 0.0 },
      { action: 'check', frequency: 60, ev: -0.1 },
    ],
  },
  connected: {
    nuts: [
      { action: 'bet', frequency: 80, size: 66, ev: 2.5 },
      { action: 'check', frequency: 20, ev: 2.0 },
    ],
    strong: [
      { action: 'bet', frequency: 65, size: 66, ev: 1.6 },
      { action: 'check', frequency: 35, ev: 1.1 },
    ],
    medium: [
      { action: 'check', frequency: 60, ev: 0.4 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 75, ev: 0.2 },
      { action: 'bet', frequency: 25, size: 50, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 90, ev: 0.0 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 66, ev: 0.5 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 80, ev: -0.2 },
      { action: 'bet', frequency: 20, size: 50, ev: -0.3 },
    ],
  },
  high: {
    nuts: [
      { action: 'bet', frequency: 80, size: 50, ev: 2.4 },
      { action: 'check', frequency: 20, ev: 1.9 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 50, ev: 1.6 },
      { action: 'check', frequency: 30, ev: 1.1 },
    ],
    medium: [
      { action: 'check', frequency: 55, ev: 0.5 },
      { action: 'bet', frequency: 45, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 70, ev: 0.2 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.4 },
      { action: 'check', frequency: 45, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 80, ev: -0.2 },
      { action: 'bet', frequency: 20, size: 33, ev: -0.3 },
    ],
  },
  low: {
    nuts: [
      { action: 'bet', frequency: 70, size: 33, ev: 2.0 },
      { action: 'check', frequency: 30, ev: 1.7 },
    ],
    strong: [
      { action: 'bet', frequency: 60, size: 33, ev: 1.4 },
      { action: 'check', frequency: 40, ev: 1.1 },
    ],
    medium: [
      { action: 'check', frequency: 60, ev: 0.5 },
      { action: 'bet', frequency: 40, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 75, ev: 0.2 },
      { action: 'bet', frequency: 25, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 90, ev: 0.0 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'check', frequency: 50, ev: 0.3 },
      { action: 'bet', frequency: 50, size: 33, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 85, ev: -0.1 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.2 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'bet', frequency: 85, size: 33, ev: 2.3 },
      { action: 'check', frequency: 15, ev: 1.9 },
    ],
    strong: [
      { action: 'bet', frequency: 80, size: 33, ev: 1.6 },
      { action: 'check', frequency: 20, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: 65, size: 33, ev: 0.7 },
      { action: 'check', frequency: 35, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.3 },
      { action: 'bet', frequency: 40, size: 33, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.1 },
      { action: 'bet', frequency: 20, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 50, size: 33, ev: 0.3 },
      { action: 'check', frequency: 50, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 70, ev: -0.1 },
      { action: 'bet', frequency: 30, size: 33, ev: -0.2 },
    ],
  },
};

// Check-Raise scenarios (as OOP defender)
export const CHECK_RAISE_FLOP: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'raise', frequency: 65, size: 300, ev: 3.5 },
      { action: 'call', frequency: 35, ev: 2.8 },
    ],
    strong: [
      { action: 'call', frequency: 75, ev: 1.6 },
      { action: 'raise', frequency: 25, size: 300, ev: 1.4 },
    ],
    medium: [
      { action: 'call', frequency: 85, ev: 0.5 },
      { action: 'raise', frequency: 10, size: 300, ev: 0.3 },
      { action: 'fold', frequency: 5, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 65, ev: 0.2 },
      { action: 'fold', frequency: 35, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'call', frequency: 25, ev: -0.1 },
    ],
    draw: [
      { action: 'raise', frequency: 35, size: 300, ev: 0.4 },
      { action: 'call', frequency: 55, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 70, ev: 0.0 },
      { action: 'raise', frequency: 30, size: 300, ev: -0.1 },
    ],
  },
  wet: {
    nuts: [
      { action: 'raise', frequency: 75, size: 280, ev: 4.0 },
      { action: 'call', frequency: 25, ev: 3.2 },
    ],
    strong: [
      { action: 'raise', frequency: 40, size: 280, ev: 2.0 },
      { action: 'call', frequency: 60, ev: 1.8 },
    ],
    medium: [
      { action: 'call', frequency: 70, ev: 0.5 },
      { action: 'raise', frequency: 15, size: 280, ev: 0.3 },
      { action: 'fold', frequency: 15, ev: 0.0 },
    ],
    marginal: [
      { action: 'fold', frequency: 50, ev: 0.0 },
      { action: 'call', frequency: 50, ev: 0.1 },
    ],
    weak: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'call', frequency: 15, ev: -0.2 },
    ],
    draw: [
      { action: 'raise', frequency: 50, size: 280, ev: 0.6 },
      { action: 'call', frequency: 40, ev: 0.4 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'raise', frequency: 20, size: 280, ev: -0.2 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'raise', frequency: 70, size: 280, ev: 3.8 },
      { action: 'call', frequency: 30, ev: 3.0 },
    ],
    strong: [
      { action: 'call', frequency: 65, ev: 1.6 },
      { action: 'raise', frequency: 35, size: 280, ev: 1.5 },
    ],
    medium: [
      { action: 'call', frequency: 70, ev: 0.4 },
      { action: 'fold', frequency: 25, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 280, ev: 0.2 },
    ],
    marginal: [
      { action: 'fold', frequency: 60, ev: 0.0 },
      { action: 'call', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 95, ev: 0.0 },
      { action: 'call', frequency: 5, ev: -0.4 },
    ],
    draw: [
      { action: 'raise', frequency: 55, size: 280, ev: 0.8 },
      { action: 'call', frequency: 35, ev: 0.5 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 90, ev: 0.0 },
      { action: 'raise', frequency: 10, size: 280, ev: -0.3 },
    ],
  },
  paired: {
    nuts: [
      { action: 'raise', frequency: 55, size: 300, ev: 3.2 },
      { action: 'call', frequency: 45, ev: 2.6 },
    ],
    strong: [
      { action: 'call', frequency: 80, ev: 1.4 },
      { action: 'raise', frequency: 20, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 80, ev: 0.5 },
      { action: 'fold', frequency: 15, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 300, ev: 0.2 },
    ],
    marginal: [
      { action: 'call', frequency: 60, ev: 0.2 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.1 },
    ],
    draw: [
      { action: 'call', frequency: 60, ev: 0.3 },
      { action: 'raise', frequency: 25, size: 300, ev: 0.2 },
      { action: 'fold', frequency: 15, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 65, ev: 0.0 },
      { action: 'raise', frequency: 35, size: 300, ev: 0.0 },
    ],
  },
  connected: {
    nuts: [
      { action: 'raise', frequency: 70, size: 280, ev: 3.8 },
      { action: 'call', frequency: 30, ev: 3.0 },
    ],
    strong: [
      { action: 'call', frequency: 60, ev: 1.7 },
      { action: 'raise', frequency: 40, size: 280, ev: 1.6 },
    ],
    medium: [
      { action: 'call', frequency: 70, ev: 0.5 },
      { action: 'fold', frequency: 20, ev: 0.0 },
      { action: 'raise', frequency: 10, size: 280, ev: 0.3 },
    ],
    marginal: [
      { action: 'fold', frequency: 55, ev: 0.0 },
      { action: 'call', frequency: 45, ev: 0.1 },
    ],
    weak: [
      { action: 'fold', frequency: 90, ev: 0.0 },
      { action: 'call', frequency: 10, ev: -0.2 },
    ],
    draw: [
      { action: 'raise', frequency: 45, size: 280, ev: 0.6 },
      { action: 'call', frequency: 45, ev: 0.4 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'raise', frequency: 25, size: 280, ev: -0.2 },
    ],
  },
  high: {
    nuts: [
      { action: 'raise', frequency: 60, size: 300, ev: 3.4 },
      { action: 'call', frequency: 40, ev: 2.7 },
    ],
    strong: [
      { action: 'call', frequency: 75, ev: 1.5 },
      { action: 'raise', frequency: 25, size: 300, ev: 1.3 },
    ],
    medium: [
      { action: 'call', frequency: 80, ev: 0.5 },
      { action: 'fold', frequency: 15, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 300, ev: 0.2 },
    ],
    marginal: [
      { action: 'call', frequency: 55, ev: 0.2 },
      { action: 'fold', frequency: 45, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.1 },
    ],
    draw: [
      { action: 'raise', frequency: 30, size: 300, ev: 0.4 },
      { action: 'call', frequency: 60, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'raise', frequency: 25, size: 300, ev: -0.1 },
    ],
  },
  low: {
    nuts: [
      { action: 'raise', frequency: 55, size: 300, ev: 3.0 },
      { action: 'call', frequency: 45, ev: 2.5 },
    ],
    strong: [
      { action: 'call', frequency: 70, ev: 1.4 },
      { action: 'raise', frequency: 30, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 75, ev: 0.5 },
      { action: 'fold', frequency: 20, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 300, ev: 0.2 },
    ],
    marginal: [
      { action: 'call', frequency: 60, ev: 0.2 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'call', frequency: 25, ev: -0.1 },
    ],
    draw: [
      { action: 'raise', frequency: 35, size: 300, ev: 0.4 },
      { action: 'call', frequency: 55, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 70, ev: 0.0 },
      { action: 'raise', frequency: 30, size: 300, ev: -0.1 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'raise', frequency: 60, size: 300, ev: 3.3 },
      { action: 'call', frequency: 40, ev: 2.6 },
    ],
    strong: [
      { action: 'call', frequency: 80, ev: 1.5 },
      { action: 'raise', frequency: 20, size: 300, ev: 1.3 },
    ],
    medium: [
      { action: 'call', frequency: 85, ev: 0.5 },
      { action: 'fold', frequency: 10, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 300, ev: 0.2 },
    ],
    marginal: [
      { action: 'call', frequency: 60, ev: 0.2 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.1 },
    ],
    draw: [
      { action: 'call', frequency: 65, ev: 0.3 },
      { action: 'raise', frequency: 25, size: 300, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'raise', frequency: 25, size: 300, ev: -0.1 },
    ],
  },
};

// Probe Bet scenarios (when IP checks back flop, OOP leads turn)
export const PROBE_BET_TURN: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'bet', frequency: 85, size: 66, ev: 3.0 },
      { action: 'check', frequency: 15, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 75, size: 66, ev: 2.0 },
      { action: 'check', frequency: 25, ev: 1.4 },
    ],
    medium: [
      { action: 'bet', frequency: 60, size: 50, ev: 0.8 },
      { action: 'check', frequency: 40, ev: 0.6 },
    ],
    marginal: [
      { action: 'check', frequency: 55, ev: 0.3 },
      { action: 'bet', frequency: 45, size: 50, ev: 0.3 },
    ],
    weak: [
      { action: 'check', frequency: 75, ev: 0.1 },
      { action: 'bet', frequency: 25, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 70, size: 66, ev: 0.5 },
      { action: 'check', frequency: 30, ev: 0.3 },
    ],
    air: [
      { action: 'bet', frequency: 45, size: 66, ev: 0.0 },
      { action: 'check', frequency: 55, ev: -0.1 },
    ],
  },
  wet: {
    nuts: [
      { action: 'bet', frequency: 90, size: 75, ev: 3.5 },
      { action: 'check', frequency: 10, ev: 2.5 },
    ],
    strong: [
      { action: 'bet', frequency: 80, size: 75, ev: 2.3 },
      { action: 'check', frequency: 20, ev: 1.5 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.7 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 65, ev: 0.2 },
      { action: 'bet', frequency: 35, size: 50, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 75, size: 75, ev: 0.6 },
      { action: 'check', frequency: 25, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 60, ev: -0.1 },
      { action: 'bet', frequency: 40, size: 66, ev: -0.2 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'bet', frequency: 85, size: 66, ev: 3.2 },
      { action: 'check', frequency: 15, ev: 2.4 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 66, ev: 2.0 },
      { action: 'check', frequency: 30, ev: 1.4 },
    ],
    medium: [
      { action: 'check', frequency: 55, ev: 0.5 },
      { action: 'bet', frequency: 45, size: 50, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 75, ev: 0.2 },
      { action: 'bet', frequency: 25, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 90, ev: 0.0 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.2 },
    ],
    draw: [
      { action: 'bet', frequency: 80, size: 66, ev: 0.8 },
      { action: 'check', frequency: 20, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 70, ev: -0.2 },
      { action: 'bet', frequency: 30, size: 50, ev: -0.3 },
    ],
  },
  paired: {
    nuts: [
      { action: 'bet', frequency: 80, size: 66, ev: 2.8 },
      { action: 'check', frequency: 20, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 66, ev: 1.8 },
      { action: 'check', frequency: 30, ev: 1.3 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.7 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'bet', frequency: 20, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 66, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'bet', frequency: 50, size: 66, ev: 0.1 },
      { action: 'check', frequency: 50, ev: 0.0 },
    ],
  },
  connected: {
    nuts: [
      { action: 'bet', frequency: 85, size: 75, ev: 3.2 },
      { action: 'check', frequency: 15, ev: 2.4 },
    ],
    strong: [
      { action: 'bet', frequency: 75, size: 75, ev: 2.2 },
      { action: 'check', frequency: 25, ev: 1.5 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.6 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 65, ev: 0.2 },
      { action: 'bet', frequency: 35, size: 50, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 70, size: 75, ev: 0.6 },
      { action: 'check', frequency: 30, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 60, ev: -0.1 },
      { action: 'bet', frequency: 40, size: 66, ev: -0.2 },
    ],
  },
  high: {
    nuts: [
      { action: 'bet', frequency: 80, size: 66, ev: 2.9 },
      { action: 'check', frequency: 20, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 66, ev: 1.9 },
      { action: 'check', frequency: 30, ev: 1.3 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.7 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size: 50, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'bet', frequency: 20, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 65, size: 66, ev: 0.5 },
      { action: 'check', frequency: 35, ev: 0.3 },
    ],
    air: [
      { action: 'bet', frequency: 40, size: 66, ev: 0.0 },
      { action: 'check', frequency: 60, ev: -0.1 },
    ],
  },
  low: {
    nuts: [
      { action: 'bet', frequency: 75, size: 66, ev: 2.7 },
      { action: 'check', frequency: 25, ev: 2.1 },
    ],
    strong: [
      { action: 'bet', frequency: 65, size: 66, ev: 1.7 },
      { action: 'check', frequency: 35, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: 50, size: 50, ev: 0.6 },
      { action: 'check', frequency: 50, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 65, ev: 0.2 },
      { action: 'bet', frequency: 35, size: 50, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 66, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'bet', frequency: 40, size: 66, ev: 0.0 },
      { action: 'check', frequency: 60, ev: -0.1 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'bet', frequency: 80, size: 66, ev: 2.9 },
      { action: 'check', frequency: 20, ev: 2.2 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 66, ev: 1.8 },
      { action: 'check', frequency: 30, ev: 1.3 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.7 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 55, ev: 0.3 },
      { action: 'bet', frequency: 45, size: 50, ev: 0.3 },
    ],
    weak: [
      { action: 'check', frequency: 75, ev: 0.1 },
      { action: 'bet', frequency: 25, size: 33, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 66, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'bet', frequency: 35, size: 66, ev: -0.1 },
      { action: 'check', frequency: 65, ev: -0.1 },
    ],
  },
};

// Donk Bet scenarios (OOP betting into preflop aggressor)
export const DONK_BET_FLOP: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'check', frequency: 80, ev: 2.5 },
      { action: 'bet', frequency: 20, size: 33, ev: 2.2 },
    ],
    strong: [
      { action: 'check', frequency: 90, ev: 1.5 },
      { action: 'bet', frequency: 10, size: 33, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 95, ev: 0.6 },
      { action: 'bet', frequency: 5, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 98, ev: 0.3 },
      { action: 'bet', frequency: 2, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.1 },
    ],
    draw: [
      { action: 'check', frequency: 85, ev: 0.4 },
      { action: 'bet', frequency: 15, size: 33, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 95, ev: 0.0 },
      { action: 'bet', frequency: 5, size: 33, ev: -0.2 },
    ],
  },
  wet: {
    nuts: [
      { action: 'check', frequency: 70, ev: 3.0 },
      { action: 'bet', frequency: 30, size: 50, ev: 2.8 },
    ],
    strong: [
      { action: 'check', frequency: 80, ev: 1.8 },
      { action: 'bet', frequency: 20, size: 50, ev: 1.5 },
    ],
    medium: [
      { action: 'check', frequency: 90, ev: 0.6 },
      { action: 'bet', frequency: 10, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 95, ev: 0.2 },
      { action: 'bet', frequency: 5, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.0 },
    ],
    draw: [
      { action: 'check', frequency: 75, ev: 0.5 },
      { action: 'bet', frequency: 25, size: 50, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 90, ev: -0.1 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.2 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'check', frequency: 65, ev: 2.8 },
      { action: 'bet', frequency: 35, size: 50, ev: 2.6 },
    ],
    strong: [
      { action: 'check', frequency: 75, ev: 1.5 },
      { action: 'bet', frequency: 25, size: 50, ev: 1.3 },
    ],
    medium: [
      { action: 'check', frequency: 90, ev: 0.5 },
      { action: 'bet', frequency: 10, size: 33, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 95, ev: 0.2 },
      { action: 'bet', frequency: 5, size: 33, ev: 0.0 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 35, size: 50, ev: 0.6 },
      { action: 'check', frequency: 65, ev: 0.5 },
    ],
    air: [
      { action: 'check', frequency: 95, ev: -0.1 },
      { action: 'bet', frequency: 5, size: 33, ev: -0.3 },
    ],
  },
  paired: {
    nuts: [
      { action: 'check', frequency: 85, ev: 2.5 },
      { action: 'bet', frequency: 15, size: 33, ev: 2.2 },
    ],
    strong: [
      { action: 'check', frequency: 90, ev: 1.4 },
      { action: 'bet', frequency: 10, size: 33, ev: 1.1 },
    ],
    medium: [
      { action: 'check', frequency: 95, ev: 0.5 },
      { action: 'bet', frequency: 5, size: 33, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 98, ev: 0.2 },
      { action: 'bet', frequency: 2, size: 33, ev: 0.0 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.0 },
    ],
    draw: [
      { action: 'check', frequency: 90, ev: 0.3 },
      { action: 'bet', frequency: 10, size: 33, ev: 0.2 },
    ],
    air: [
      { action: 'check', frequency: 90, ev: 0.0 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.1 },
    ],
  },
  connected: {
    nuts: [
      { action: 'check', frequency: 70, ev: 2.8 },
      { action: 'bet', frequency: 30, size: 50, ev: 2.6 },
    ],
    strong: [
      { action: 'check', frequency: 80, ev: 1.7 },
      { action: 'bet', frequency: 20, size: 50, ev: 1.4 },
    ],
    medium: [
      { action: 'check', frequency: 90, ev: 0.5 },
      { action: 'bet', frequency: 10, size: 33, ev: 0.3 },
    ],
    marginal: [
      { action: 'check', frequency: 95, ev: 0.2 },
      { action: 'bet', frequency: 5, size: 33, ev: 0.0 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: 30, size: 50, ev: 0.5 },
      { action: 'check', frequency: 70, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 90, ev: -0.1 },
      { action: 'bet', frequency: 10, size: 33, ev: -0.2 },
    ],
  },
  high: {
    nuts: [
      { action: 'check', frequency: 80, ev: 2.6 },
      { action: 'bet', frequency: 20, size: 33, ev: 2.3 },
    ],
    strong: [
      { action: 'check', frequency: 85, ev: 1.5 },
      { action: 'bet', frequency: 15, size: 33, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 92, ev: 0.6 },
      { action: 'bet', frequency: 8, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 97, ev: 0.2 },
      { action: 'bet', frequency: 3, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.1 },
    ],
    draw: [
      { action: 'check', frequency: 85, ev: 0.4 },
      { action: 'bet', frequency: 15, size: 33, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 92, ev: 0.0 },
      { action: 'bet', frequency: 8, size: 33, ev: -0.1 },
    ],
  },
  low: {
    nuts: [
      { action: 'check', frequency: 75, ev: 2.4 },
      { action: 'bet', frequency: 25, size: 33, ev: 2.2 },
    ],
    strong: [
      { action: 'check', frequency: 85, ev: 1.4 },
      { action: 'bet', frequency: 15, size: 33, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 92, ev: 0.5 },
      { action: 'bet', frequency: 8, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 96, ev: 0.2 },
      { action: 'bet', frequency: 4, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.0 },
    ],
    draw: [
      { action: 'check', frequency: 82, ev: 0.4 },
      { action: 'bet', frequency: 18, size: 33, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 92, ev: 0.0 },
      { action: 'bet', frequency: 8, size: 33, ev: -0.1 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'check', frequency: 80, ev: 2.5 },
      { action: 'bet', frequency: 20, size: 33, ev: 2.2 },
    ],
    strong: [
      { action: 'check', frequency: 88, ev: 1.5 },
      { action: 'bet', frequency: 12, size: 33, ev: 1.2 },
    ],
    medium: [
      { action: 'check', frequency: 94, ev: 0.6 },
      { action: 'bet', frequency: 6, size: 33, ev: 0.4 },
    ],
    marginal: [
      { action: 'check', frequency: 98, ev: 0.3 },
      { action: 'bet', frequency: 2, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 100, ev: 0.1 },
    ],
    draw: [
      { action: 'check', frequency: 88, ev: 0.3 },
      { action: 'bet', frequency: 12, size: 33, ev: 0.2 },
    ],
    air: [
      { action: 'check', frequency: 95, ev: 0.0 },
      { action: 'bet', frequency: 5, size: 33, ev: -0.2 },
    ],
  },
};

// Facing C-Bet scenarios (as defender)
export const FACING_CBET: Record<BoardTexture, Record<HandStrength, PostflopAction[]>> = {
  dry: {
    nuts: [
      { action: 'raise', frequency: 70, size: 300, ev: 3.0 },
      { action: 'call', frequency: 30, ev: 2.5 },
    ],
    strong: [
      { action: 'call', frequency: 85, ev: 1.5 },
      { action: 'raise', frequency: 15, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 75, ev: 0.5 },
      { action: 'fold', frequency: 25, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 55, ev: 0.2 },
      { action: 'fold', frequency: 45, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.2 },
    ],
    draw: [
      { action: 'call', frequency: 70, ev: 0.3 },
      { action: 'raise', frequency: 20, size: 300, ev: 0.2 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'raise', frequency: 15, size: 300, ev: -0.2 },
    ],
  },
  wet: {
    nuts: [
      { action: 'raise', frequency: 80, size: 250, ev: 3.5 },
      { action: 'call', frequency: 20, ev: 2.8 },
    ],
    strong: [
      { action: 'call', frequency: 70, ev: 1.8 },
      { action: 'raise', frequency: 30, size: 250, ev: 1.5 },
    ],
    medium: [
      { action: 'call', frequency: 65, ev: 0.4 },
      { action: 'fold', frequency: 35, ev: 0.0 },
    ],
    marginal: [
      { action: 'fold', frequency: 55, ev: 0.0 },
      { action: 'call', frequency: 45, ev: 0.1 },
    ],
    weak: [
      { action: 'fold', frequency: 90, ev: 0.0 },
      { action: 'call', frequency: 10, ev: -0.3 },
    ],
    draw: [
      { action: 'call', frequency: 60, ev: 0.4 },
      { action: 'raise', frequency: 30, size: 250, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 90, ev: 0.0 },
      { action: 'raise', frequency: 10, size: 250, ev: -0.3 },
    ],
  },
  monotone: {
    nuts: [
      { action: 'raise', frequency: 75, size: 250, ev: 3.2 },
      { action: 'call', frequency: 25, ev: 2.6 },
    ],
    strong: [
      { action: 'call', frequency: 75, ev: 1.5 },
      { action: 'raise', frequency: 25, size: 250, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 60, ev: 0.3 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    marginal: [
      { action: 'fold', frequency: 60, ev: 0.0 },
      { action: 'call', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 95, ev: 0.0 },
      { action: 'call', frequency: 5, ev: -0.4 },
    ],
    draw: [
      { action: 'call', frequency: 75, ev: 0.6 },
      { action: 'raise', frequency: 15, size: 250, ev: 0.4 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 95, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 250, ev: -0.5 },
    ],
  },
  paired: {
    nuts: [
      { action: 'raise', frequency: 65, size: 300, ev: 2.8 },
      { action: 'call', frequency: 35, ev: 2.2 },
    ],
    strong: [
      { action: 'call', frequency: 80, ev: 1.3 },
      { action: 'raise', frequency: 20, size: 300, ev: 1.0 },
    ],
    medium: [
      { action: 'call', frequency: 70, ev: 0.4 },
      { action: 'fold', frequency: 30, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 50, ev: 0.1 },
      { action: 'fold', frequency: 50, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'call', frequency: 15, ev: -0.2 },
    ],
    draw: [
      { action: 'call', frequency: 65, ev: 0.3 },
      { action: 'fold', frequency: 25, ev: 0.0 },
      { action: 'raise', frequency: 10, size: 300, ev: 0.1 },
    ],
    air: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'raise', frequency: 20, size: 300, ev: -0.1 },
    ],
  },
  connected: {
    nuts: [
      { action: 'raise', frequency: 75, size: 250, ev: 3.2 },
      { action: 'call', frequency: 25, ev: 2.5 },
    ],
    strong: [
      { action: 'call', frequency: 70, ev: 1.6 },
      { action: 'raise', frequency: 30, size: 250, ev: 1.3 },
    ],
    medium: [
      { action: 'call', frequency: 60, ev: 0.4 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    marginal: [
      { action: 'fold', frequency: 55, ev: 0.0 },
      { action: 'call', frequency: 45, ev: 0.1 },
    ],
    weak: [
      { action: 'fold', frequency: 90, ev: 0.0 },
      { action: 'call', frequency: 10, ev: -0.3 },
    ],
    draw: [
      { action: 'call', frequency: 55, ev: 0.4 },
      { action: 'raise', frequency: 35, size: 250, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'raise', frequency: 15, size: 250, ev: -0.2 },
    ],
  },
  high: {
    nuts: [
      { action: 'raise', frequency: 65, size: 300, ev: 3.0 },
      { action: 'call', frequency: 35, ev: 2.4 },
    ],
    strong: [
      { action: 'call', frequency: 80, ev: 1.5 },
      { action: 'raise', frequency: 20, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 70, ev: 0.5 },
      { action: 'fold', frequency: 30, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 55, ev: 0.2 },
      { action: 'fold', frequency: 45, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 82, ev: 0.0 },
      { action: 'call', frequency: 18, ev: -0.2 },
    ],
    draw: [
      { action: 'call', frequency: 68, ev: 0.3 },
      { action: 'raise', frequency: 22, size: 300, ev: 0.2 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'raise', frequency: 15, size: 300, ev: -0.2 },
    ],
  },
  low: {
    nuts: [
      { action: 'raise', frequency: 60, size: 300, ev: 2.8 },
      { action: 'call', frequency: 40, ev: 2.3 },
    ],
    strong: [
      { action: 'call', frequency: 75, ev: 1.4 },
      { action: 'raise', frequency: 25, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 72, ev: 0.5 },
      { action: 'fold', frequency: 28, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 58, ev: 0.2 },
      { action: 'fold', frequency: 42, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 78, ev: 0.0 },
      { action: 'call', frequency: 22, ev: -0.1 },
    ],
    draw: [
      { action: 'call', frequency: 70, ev: 0.3 },
      { action: 'raise', frequency: 20, size: 300, ev: 0.2 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 82, ev: 0.0 },
      { action: 'raise', frequency: 18, size: 300, ev: -0.1 },
    ],
  },
  ace_high: {
    nuts: [
      { action: 'raise', frequency: 65, size: 300, ev: 2.9 },
      { action: 'call', frequency: 35, ev: 2.4 },
    ],
    strong: [
      { action: 'call', frequency: 82, ev: 1.5 },
      { action: 'raise', frequency: 18, size: 300, ev: 1.2 },
    ],
    medium: [
      { action: 'call', frequency: 75, ev: 0.5 },
      { action: 'fold', frequency: 25, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 60, ev: 0.2 },
      { action: 'fold', frequency: 40, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.2 },
    ],
    draw: [
      { action: 'call', frequency: 70, ev: 0.3 },
      { action: 'raise', frequency: 20, size: 300, ev: 0.2 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'raise', frequency: 15, size: 300, ev: -0.2 },
    ],
  },
};

// Turn and River betting patterns
export const TURN_BARREL: Record<HandStrength, PostflopAction[]> = {
  nuts: [
    { action: 'bet', frequency: 90, size: 75, ev: 4.0 },
    { action: 'check', frequency: 10, ev: 3.0 },
  ],
  strong: [
    { action: 'bet', frequency: 80, size: 66, ev: 2.5 },
    { action: 'check', frequency: 20, ev: 1.5 },
  ],
  medium: [
    { action: 'bet', frequency: 50, size: 50, ev: 0.8 },
    { action: 'check', frequency: 50, ev: 0.6 },
  ],
  marginal: [
    { action: 'check', frequency: 70, ev: 0.3 },
    { action: 'bet', frequency: 30, size: 50, ev: 0.2 },
  ],
  weak: [
    { action: 'check', frequency: 85, ev: 0.1 },
    { action: 'bet', frequency: 15, size: 50, ev: 0.0 },
  ],
  draw: [
    { action: 'bet', frequency: 65, size: 66, ev: 0.5 },
    { action: 'check', frequency: 35, ev: 0.3 },
  ],
  air: [
    { action: 'check', frequency: 60, ev: -0.2 },
    { action: 'bet', frequency: 40, size: 66, ev: -0.3 },
  ],
};

export const RIVER_VALUE: Record<HandStrength, PostflopAction[]> = {
  nuts: [
    { action: 'bet', frequency: 95, size: 100, ev: 5.0 },
    { action: 'check', frequency: 5, ev: 3.5 },
  ],
  strong: [
    { action: 'bet', frequency: 85, size: 75, ev: 3.0 },
    { action: 'check', frequency: 15, ev: 2.0 },
  ],
  medium: [
    { action: 'bet', frequency: 55, size: 50, ev: 1.0 },
    { action: 'check', frequency: 45, ev: 0.8 },
  ],
  marginal: [
    { action: 'check', frequency: 75, ev: 0.4 },
    { action: 'bet', frequency: 25, size: 33, ev: 0.3 },
  ],
  weak: [
    { action: 'check', frequency: 90, ev: 0.1 },
    { action: 'fold', frequency: 10, ev: 0.0 },
  ],
  draw: [
    { action: 'bet', frequency: 45, size: 75, ev: 0.0 },
    { action: 'check', frequency: 55, ev: -0.1 },
  ],
  air: [
    { action: 'bet', frequency: 35, size: 75, ev: -0.2 },
    { action: 'check', frequency: 65, ev: -0.3 },
  ],
};

// Helper functions
export function analyzeBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) return 'dry';

  const suits = board.map(c => c.suit);
  const rankOrder = '23456789TJQKA';
  const ranks = board.map(c => rankOrder.indexOf(c.rank));

  // Check for monotone (3+ same suit)
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.values(suitCounts).some(c => c >= 3)) {
    return 'monotone';
  }

  // Check for paired board
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (Object.values(rankCounts).some(c => c >= 2)) {
    return 'paired';
  }

  // Check for connected (cards within 4 ranks)
  const sortedRanks = [...ranks].sort((a, b) => a - b);
  const spread = sortedRanks[sortedRanks.length - 1] - sortedRanks[0];

  if (spread <= 4) {
    return 'connected';
  }

  // Check for wet (2 to a flush or straight possible)
  if (Object.values(suitCounts).some(c => c >= 2)) {
    return 'wet';
  }

  // Check for ace-high board (Ace present with high cards)
  const highestRank = Math.max(...ranks);
  if (highestRank === 12) { // Ace
    return 'ace_high';
  }

  // Check for high board (all cards T or above, avg rank >= 9)
  const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  if (avgRank >= 9) {
    return 'high';
  }

  // Check for low board (all cards 8 or below, avg rank <= 5)
  if (avgRank <= 5) {
    return 'low';
  }

  return 'dry';
}

// Get SPR category from stack and pot size
export function getSPRCategory(stackSize: number, potSize: number): SPRCategory {
  if (potSize === 0) return 'deep';
  const spr = stackSize / potSize;
  if (spr < 2) return 'micro';
  if (spr < 4) return 'small';
  if (spr < 8) return 'medium';
  if (spr < 13) return 'large';
  return 'deep';
}

// Analyze draw type on the board
export function analyzeDrawType(hand: Card[], board: Card[]): DrawType {
  const allCards = [...hand, ...board];
  const suits = allCards.map(c => c.suit);
  const rankOrder = '23456789TJQKA';
  const ranks = allCards.map(c => rankOrder.indexOf(c.rank));

  // Check for flush draw
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hasFlushDraw = Object.values(suitCounts).some(c => c === 4);

  // Check for backdoor flush draw (3 to a suit)
  const hasBackdoorFlush = Object.values(suitCounts).some(c => c === 3);

  // Check for straight draw
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  let hasOESD = false;
  let hasGutshot = false;
  let hasBackdoorStraight = false;

  // Check for OESD (4 consecutive or 4 with one gap at ends)
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    const window = uniqueRanks.slice(i, i + 4);
    const windowSpread = window[3] - window[0];
    if (windowSpread === 3) {
      // 4 consecutive cards
      hasOESD = true;
    } else if (windowSpread === 4) {
      // 4 cards with one gap - could be OESD or gutshot
      const gaps = [];
      for (let j = 0; j < 3; j++) {
        if (window[j + 1] - window[j] === 2) {
          gaps.push(j);
        }
      }
      if (gaps.length === 1 && (gaps[0] === 0 || gaps[0] === 2)) {
        hasOESD = true;
      } else {
        hasGutshot = true;
      }
    }
  }

  // Check for backdoor straight (3 cards to a straight)
  for (let i = 0; i <= uniqueRanks.length - 3; i++) {
    const window = uniqueRanks.slice(i, i + 3);
    const windowSpread = window[2] - window[0];
    if (windowSpread <= 4) {
      hasBackdoorStraight = true;
    }
  }

  // Return draw type based on what we found
  if (hasFlushDraw && hasOESD) return 'combo_draw';
  if (hasFlushDraw) return 'flush_draw';
  if (hasOESD) return 'oesd';
  if (hasGutshot) return 'gutshot';
  if (hasFlushDraw && hasBackdoorStraight) return 'combo_draw';
  if (hasBackdoorFlush) return 'backdoor_flush';
  if (hasBackdoorStraight) return 'backdoor_straight';

  return 'no_draw';
}

// Simplified hand strength evaluation for practice
export function evaluateHandStrength(
  hand: Card[],
  board: Card[]
): HandStrength {
  // This is a simplified evaluation - in production you'd want a proper hand evaluator
  const allCards = [...hand, ...board];
  const ranks = allCards.map(c => c.rank);
  const suits = allCards.map(c => c.suit);

  // Check for flush
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hasFlush = Object.values(suitCounts).some(c => c >= 5);

  // Check for pairs/trips/quads
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  if (hasFlush || counts[0] >= 4 || (counts[0] >= 3 && counts[1] >= 2)) {
    return 'nuts';
  }

  if (counts[0] >= 3 || (counts[0] >= 2 && counts[1] >= 2)) {
    return 'strong';
  }

  // Check if we have top pair
  if (board.length >= 3) {
    const boardRanks = board.map(c => c.rank);
    const handRanks = hand.map(c => c.rank);
    const topBoardRank = boardRanks.sort((a, b) => {
      const order = '23456789TJQKA';
      return order.indexOf(b) - order.indexOf(a);
    })[0];

    if (handRanks.includes(topBoardRank)) {
      const kicker = handRanks.find(r => r !== topBoardRank) || handRanks[0];
      const kickerStrength = '23456789TJQKA'.indexOf(kicker);
      if (kickerStrength >= 10) return 'medium'; // Top pair good kicker
      if (kickerStrength >= 7) return 'marginal'; // Top pair weak kicker
    }

    // Middle/bottom pair
    if (counts[0] >= 2) {
      return 'weak';
    }
  }

  // Check for draws
  if (Object.values(suitCounts).some(c => c >= 4)) {
    return 'draw'; // Flush draw
  }

  // Simplified straight draw check
  const rankOrder = '23456789TJQKA';
  const rankIndices = [...new Set(ranks.map(r => rankOrder.indexOf(r)))].sort((a, b) => a - b);
  for (let i = 0; i < rankIndices.length - 3; i++) {
    if (rankIndices[i + 3] - rankIndices[i] <= 4) {
      return 'draw'; // Potential straight draw
    }
  }

  return 'air';
}

// Extended scenario types for comprehensive postflop strategy
export type PostflopScenario =
  | 'cbet_ip'           // C-bet in position
  | 'cbet_oop'          // C-bet out of position
  | 'facing_cbet'       // Defending vs c-bet
  | 'check_raise'       // Check-raising on flop
  | 'probe_bet'         // Probe betting turn
  | 'donk_bet'          // Donk betting flop
  | 'turn_barrel'       // Barreling turn
  | 'river_value'       // River value betting
  | 'facing_turn_bet'   // Facing turn bet
  | 'facing_river_bet'; // Facing river bet

export function getPostflopStrategy(
  street: 'flop' | 'turn' | 'river',
  scenario: PostflopScenario | 'cbet' | 'facing_cbet' | 'barrel' | 'value',
  boardTexture: BoardTexture,
  handStrength: HandStrength
): PostflopAction[] {
  // Handle legacy scenario names for backward compatibility
  const normalizedScenario = scenario === 'cbet' ? 'cbet_ip'
    : scenario === 'barrel' ? 'turn_barrel'
    : scenario === 'value' ? 'river_value'
    : scenario;

  switch (normalizedScenario) {
    case 'cbet_ip':
      return FLOP_CBET_IP[boardTexture]?.[handStrength] || [];
    case 'cbet_oop':
      return FLOP_CBET_OOP[boardTexture]?.[handStrength] || [];
    case 'facing_cbet':
      return FACING_CBET[boardTexture]?.[handStrength] || [];
    case 'check_raise':
      return CHECK_RAISE_FLOP[boardTexture]?.[handStrength] || [];
    case 'probe_bet':
      return PROBE_BET_TURN[boardTexture]?.[handStrength] || [];
    case 'donk_bet':
      return DONK_BET_FLOP[boardTexture]?.[handStrength] || [];
    case 'turn_barrel':
      return TURN_BARREL[handStrength] || [];
    case 'river_value':
      return RIVER_VALUE[handStrength] || [];
    default:
      return [];
  }
}

// Get recommended action based on scenario and hand
export function getRecommendedAction(
  street: 'flop' | 'turn' | 'river',
  scenario: PostflopScenario,
  boardTexture: BoardTexture,
  handStrength: HandStrength
): { action: PostflopAction; alternatives: PostflopAction[] } | null {
  const strategies = getPostflopStrategy(street, scenario, boardTexture, handStrength);
  if (strategies.length === 0) return null;

  // Sort by frequency (descending) and return top action with alternatives
  const sorted = [...strategies].sort((a, b) => b.frequency - a.frequency);
  return {
    action: sorted[0],
    alternatives: sorted.slice(1),
  };
}

// Multi-way pot adjustments
export function adjustForMultiway(
  strategies: PostflopAction[],
  playerCount: PlayerCount
): PostflopAction[] {
  if (playerCount === 'heads_up') return strategies;

  // In multi-way pots, tighten up bluffing and value ranges
  const multiplier = playerCount === 'three_way' ? 0.7 : 0.5;

  return strategies.map(s => {
    if (s.action === 'bet' || s.action === 'raise') {
      // Reduce bluff frequency, increase value threshold
      return {
        ...s,
        frequency: Math.round(s.frequency * multiplier),
        ev: s.ev * multiplier,
      };
    }
    if (s.action === 'fold') {
      // Increase fold frequency in multi-way
      return {
        ...s,
        frequency: Math.min(100, Math.round(s.frequency * (1 + (1 - multiplier)))),
      };
    }
    return s;
  });
}

// SPR-based adjustments
export function adjustForSPR(
  strategies: PostflopAction[],
  spr: SPRCategory
): PostflopAction[] {
  switch (spr) {
    case 'micro':
      // Low SPR: commit or fold, less checking
      return strategies.map(s => {
        if (s.action === 'check') {
          return { ...s, frequency: Math.round(s.frequency * 0.5) };
        }
        if (s.action === 'allin') {
          return { ...s, frequency: Math.round(s.frequency * 1.5) };
        }
        return s;
      });
    case 'small':
      // Small SPR: more all-in considerations
      return strategies.map(s => {
        if (s.action === 'bet' && s.size && s.size >= 75) {
          return { ...s, action: 'allin' as const, size: undefined };
        }
        return s;
      });
    case 'deep':
      // Deep SPR: more pot control, smaller bet sizes
      return strategies.map(s => {
        if (s.action === 'bet' && s.size) {
          return { ...s, size: Math.max(25, s.size - 15) };
        }
        return s;
      });
    default:
      return strategies;
  }
}
