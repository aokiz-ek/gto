// Card and Hand Types
export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Hand = [Card, Card];

// Position Types
export type Position = 'UTG' | 'UTG1' | 'UTG2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

// Action Types
export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface Action {
  type: ActionType;
  amount?: number;
  frequency?: number; // For mixed strategies (0-1)
}

// Range Types
export interface HandCombo {
  hand: string; // e.g., "AKs", "QQ", "T9o"
  actions: Action[];
}

export interface Range {
  position: Position;
  situation: string;
  combos: HandCombo[];
}

// Game State Types
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export interface GameState {
  street: Street;
  pot: number;
  board: Card[];
  players: PlayerState[];
  currentPlayer: number;
  history: Action[];
}

export interface PlayerState {
  position: Position;
  stack: number;
  hand?: Hand;
  isActive: boolean;
}

// Strategy Types
export interface Strategy {
  ev: number; // Expected value
  actions: Action[];
}

export interface RangeMatrix {
  // 13x13 matrix for hand combinations
  // Rows: first card rank (A-2)
  // Cols: second card rank (A-2)
  // Upper triangle: suited, Lower triangle: offsuit, Diagonal: pairs
  matrix: number[][];
}

// Analysis Types
export interface HandAnalysis {
  hand: Hand;
  board: Card[];
  equity: number;
  bestAction: Action;
  evByAction: Record<ActionType, number>;
}

// GTO Strategy Types
export type GameType = 'cash' | 'mtt' | 'sng' | 'spin';
export type StackDepth = 20 | 50 | 100 | 200;
export type TableSize = 6 | 9;

// Action Line Types
export type ActionLineType = 'rfi' | 'vs_rfi' | 'vs_3bet' | 'vs_4bet' | '3bet' | 'squeeze' | '3way';

export interface ActionLine {
  type: ActionLineType;
  raiserPosition?: Position;    // For vs_rfi: who raised
  threeBetPosition?: Position;  // For vs_3bet: who 3-bet
  openerPosition?: Position;    // For 3bet/squeeze: who opened
  callerPosition?: Position;    // For squeeze: who called the open
  positions?: Position[];       // For 3way scenarios
}

// GTO Hand Strategy
export interface GTOAction {
  action: 'fold' | 'call' | 'raise' | 'allin';
  frequency: number;      // 0-100 percentage
  size?: number;          // Raise size in BB or multiplier (e.g., 2.5, 3)
  ev: number;            // Expected value in BB
}

export interface GTOHandStrategy {
  hand: string;           // e.g., "AKs", "QQ", "T9o"
  actions: GTOAction[];
  totalCombos: number;    // 4 for suited, 12 for offsuit, 6 for pairs
  equity: number;         // Equity vs opponent range (0-100)
}

// Scenario Definition
export interface GTOScenario {
  id: string;
  gameType: GameType;
  stackDepth: StackDepth;
  tableSize: TableSize;
  position: Position;
  actionLine: ActionLine;
  vsPosition?: Position;  // Opponent position if applicable
}

// Complete GTO Strategy for a scenario
export interface GTOStrategy {
  scenario: GTOScenario;
  ranges: Map<string, GTOHandStrategy> | Record<string, GTOHandStrategy>;
  summary: {
    totalHands: number;
    playableHands: number;
    raiseFreq: number;
    callFreq: number;
    foldFreq: number;
    allinFreq: number;
    avgEV: number;
  };
}

// Position info for display
export interface PositionInfo {
  position: Position;
  stack: number;
  action?: string;
  isHero?: boolean;
  isActive?: boolean;
}
