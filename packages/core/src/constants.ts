import type { Rank, Suit, Position } from './types';

export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: Suit[] = ['h', 'd', 'c', 's'];

export const POSITIONS: Position[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Position colors for UI
export const POSITION_COLORS: Record<Position, string> = {
  UTG: '#ef4444',
  UTG1: '#f97316',
  UTG2: '#f59e0b',
  LJ: '#eab308',
  HJ: '#84cc16',
  CO: '#22c55e',
  BTN: '#14b8a6',
  SB: '#06b6d4',
  BB: '#3b82f6',
};

// Suit symbols and colors
export const SUIT_SYMBOLS: Record<Suit, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  h: '#ef4444',
  d: '#3b82f6',
  c: '#22c55e',
  s: '#1f2937',
};

// Hand strength categories
export const HAND_CATEGORIES = {
  PREMIUM: ['AA', 'KK', 'QQ', 'AKs'],
  STRONG: ['JJ', 'TT', 'AKo', 'AQs', 'AJs', 'KQs'],
  PLAYABLE: ['99', '88', '77', 'ATs', 'KJs', 'QJs', 'JTs', 'AQo'],
  SPECULATIVE: ['66', '55', '44', '33', '22', 'A5s', 'A4s', 'A3s', 'A2s', 'KTs', 'QTs', 'T9s', '98s', '87s', '76s'],
};

// Default stack sizes (in big blinds)
export const DEFAULT_STACK_BB = 100;

// Standard bet sizes (as fraction of pot)
export const BET_SIZES = {
  SMALL: 0.33,
  MEDIUM: 0.5,
  LARGE: 0.75,
  POT: 1.0,
  OVERBET: 1.5,
};
