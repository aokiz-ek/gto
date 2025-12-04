import { NextRequest, NextResponse } from 'next/server';
import {
  GTO_RANGES,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
  GTO_RANGES_100BB,
  analyzeBoardTexture,
  gtoStrategyToMatrix,
  calculateRangeStats,
} from '@gto/core';
import type {
  Position,
  Street,
  GTOHandStrategy,
  GTOAction,
  GTOStrategy,
  BoardTexture,
  Card,
  Rank,
  Suit,
  RangeMatrix,
} from '@gto/core';

interface CardInput {
  rank: string;
  suit: string;
}

interface AnalyzeRequest {
  heroHand: string[] | [CardInput, CardInput];
  board: string[] | CardInput[];
  heroPosition: Position;
  villainPosition: Position;
  street: Street;
  potSize?: number;
  stackSize?: number;
  scenario?: 'rfi' | 'vs_rfi' | 'vs_3bet';
}

interface ActionResult {
  action: string;
  frequency: number;
  ev: number;
}

interface AnalysisResult {
  actions: ActionResult[];
  equity: number;
  potOdds: number;
  spr: number;
  villainRange: number;
  combos: number;
  avgEquity: number;
  handStrength: string;
  handStrengthZh: string;
  gtoSource: 'database' | 'heuristic';
  boardTexture?: string; // Board texture type: 'dry', 'wet', 'monotone', etc.
  villainRangeMatrix?: number[][]; // 13x13 range matrix for visualization
}

// Position-based opening ranges (% of hands) for fallback
const POSITION_RANGES: Record<string, number> = {
  'UTG': 12,
  'UTG1': 14,
  'UTG2': 15,
  'LJ': 17,
  'HJ': 20,
  'CO': 27,
  'BTN': 40,
  'SB': 35,
  'BB': 100,
};

// Valid ranks and suits for type casting
const VALID_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const VALID_SUITS = ['h', 'd', 'c', 's'];

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    const {
      heroHand,
      board,
      heroPosition,
      villainPosition,
      street,
      potSize = 6,
      stackSize = 100,
      scenario = 'rfi',
    } = body;

    // Parse hero hand
    let card1: CardInput, card2: CardInput;
    if (typeof heroHand[0] === 'string') {
      card1 = parseCardString(heroHand[0] as string);
      card2 = parseCardString(heroHand[1] as string);
    } else {
      card1 = heroHand[0] as CardInput;
      card2 = heroHand[1] as CardInput;
    }

    // Validate input
    if (!card1 || !card2 || !card1.rank || !card2.rank) {
      return NextResponse.json(
        { success: false, error: 'Invalid hero hand' },
        { status: 400 }
      );
    }

    // Get hand notation (e.g., "AKs", "QQ", "T9o")
    const handNotation = getHandNotation(card1.rank, card2.rank, card1.suit === card2.suit);

    // Calculate SPR
    const spr = stackSize / potSize;

    // Choose GTO data based on stack depth
    const gtoData = stackSize <= 100 ? GTO_RANGES_100BB : GTO_RANGES;

    // Get GTO strategy based on scenario
    let gtoStrategy: GTOHandStrategy | null = null;

    if (street === 'preflop') {
      gtoStrategy = getPreflopGTOStrategy(
        handNotation,
        heroPosition,
        villainPosition,
        scenario,
        gtoData
      );
    }

    // Parse board for postflop analysis
    let boardTexture: BoardTexture | null = null;
    if (street !== 'preflop' && board && board.length > 0) {
      const boardCards = parseBoardToCards(board);
      if (boardCards && boardCards.length >= 3) {
        try {
          boardTexture = analyzeBoardTexture(boardCards);
        } catch {
          // Board texture analysis failed, continue without it
        }
      }
    }

    // Get villain's GTO opening range based on position
    const villainGTOData = stackSize <= 100 ? GTO_RANGES_100BB : GTO_RANGES;
    const villainStrategy = villainGTOData[villainPosition];

    // Generate villain range matrix from GTO data
    let villainRangeMatrix: RangeMatrix | null = null;
    let rangeStats = { rangePercent: POSITION_RANGES[villainPosition] || 20, combos: 248, avgEquity: 54.2 };

    if (villainStrategy) {
      villainRangeMatrix = gtoStrategyToMatrix(villainStrategy.ranges);
      rangeStats = calculateRangeStats(villainRangeMatrix);
    }

    // Build analysis result
    let analysis: AnalysisResult;

    if (gtoStrategy) {
      // Use real GTO data
      const actions = convertGTOActions(gtoStrategy.actions);

      analysis = {
        actions,
        equity: gtoStrategy.equity,
        potOdds: calculatePotOdds(potSize),
        spr: parseFloat(spr.toFixed(1)),
        villainRange: rangeStats.rangePercent,
        combos: rangeStats.combos,
        avgEquity: rangeStats.avgEquity,
        handStrength: getHandStrengthFromEquity(gtoStrategy.equity),
        handStrengthZh: getHandStrengthZhFromEquity(gtoStrategy.equity),
        gtoSource: 'database',
      };

      if (villainRangeMatrix) {
        analysis.villainRangeMatrix = villainRangeMatrix.matrix;
      }

      if (boardTexture) {
        analysis.boardTexture = boardTexture;
      }
    } else {
      // Fallback to heuristic-based analysis
      const heuristicResult = calculateHeuristicStrategy(
        card1,
        card2,
        handNotation,
        heroPosition,
        villainPosition,
        potSize,
        stackSize
      );

      analysis = {
        ...heuristicResult,
        avgEquity: rangeStats.avgEquity,
        gtoSource: 'heuristic',
      };

      if (villainRangeMatrix) {
        analysis.villainRangeMatrix = villainRangeMatrix.matrix;
      }

      if (boardTexture) {
        analysis.boardTexture = boardTexture;
      }
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get GTO strategy from database
function getPreflopGTOStrategy(
  handNotation: string,
  heroPosition: Position,
  villainPosition: Position,
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet',
  gtoData: Record<string, GTOStrategy>
): GTOHandStrategy | null {
  let strategy: GTOStrategy | undefined;

  if (scenario === 'rfi') {
    // RFI (Raise First In) - hero opens
    strategy = gtoData[heroPosition];
  } else if (scenario === 'vs_rfi') {
    // vs RFI - hero faces open raise
    const key = `BB_vs_${villainPosition}`;
    strategy = GTO_VS_RFI_RANGES[key];

    // If not BB, try other position combos
    if (!strategy) {
      const altKey = `${heroPosition}_vs_${villainPosition}`;
      strategy = GTO_VS_RFI_RANGES[altKey];
    }
  } else if (scenario === 'vs_3bet') {
    // vs 3-bet - hero faces 3-bet
    const key = `${heroPosition}_vs_${villainPosition}`;
    strategy = GTO_VS_3BET_RANGES[key];
  }

  if (!strategy) return null;

  // Get hand strategy from ranges
  const ranges = strategy.ranges;
  if (ranges instanceof Map) {
    return ranges.get(handNotation) || null;
  }
  return ranges[handNotation] || null;
}

// Convert GTO actions to result format
function convertGTOActions(actions: GTOAction[]): ActionResult[] {
  return actions
    .filter(a => a.frequency > 0)
    .map(a => ({
      action: a.action,
      frequency: a.frequency / 100, // Convert to 0-1 range
      ev: parseFloat(a.ev.toFixed(2)),
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// Parse card string to CardInput
function parseCardString(cardStr: string): CardInput {
  if (!cardStr || cardStr.length < 2) {
    return { rank: '', suit: '' };
  }
  return {
    rank: cardStr[0].toUpperCase(),
    suit: cardStr[1].toLowerCase(),
  };
}

// Parse board cards to Card[] type for analyzeBoardTexture
function parseBoardToCards(board: (string | CardInput)[]): Card[] | null {
  const cards: Card[] = [];

  for (const card of board) {
    let rank: string;
    let suit: string;

    if (typeof card === 'string') {
      if (card.length < 2) continue;
      rank = card[0].toUpperCase();
      suit = card[1].toLowerCase();
    } else {
      rank = card.rank.toUpperCase();
      suit = card.suit.toLowerCase();
    }

    // Validate and cast to proper types
    if (!VALID_RANKS.includes(rank) || !VALID_SUITS.includes(suit)) {
      continue;
    }

    cards.push({
      rank: rank as Rank,
      suit: suit as Suit,
    });
  }

  return cards.length > 0 ? cards : null;
}

// Get hand notation
function getHandNotation(rank1: string, rank2: string, isSuited: boolean): string {
  const r1 = getRankValue(rank1);
  const r2 = getRankValue(rank2);
  const high = r1 >= r2 ? rank1.toUpperCase() : rank2.toUpperCase();
  const low = r1 < r2 ? rank1.toUpperCase() : rank2.toUpperCase();

  if (high === low) return high + low;
  return high + low + (isSuited ? 's' : 'o');
}

// Get rank value for comparison
function getRankValue(rank: string): number {
  const values: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };
  return values[rank.toUpperCase()] || 0;
}

// Calculate pot odds
function calculatePotOdds(potSize: number): number {
  // Pot odds for a half-pot bet
  return parseFloat(((1 / (1 + (potSize / 2))) * 100).toFixed(1));
}

// Get hand strength label from equity
function getHandStrengthFromEquity(equity: number): string {
  if (equity >= 70) return 'Premium';
  if (equity >= 55) return 'Strong';
  if (equity >= 45) return 'Playable';
  if (equity >= 35) return 'Marginal';
  return 'Weak';
}

// Get hand strength label (Chinese) from equity
function getHandStrengthZhFromEquity(equity: number): string {
  if (equity >= 70) return '顶级';
  if (equity >= 55) return '强牌';
  if (equity >= 45) return '可玩';
  if (equity >= 35) return '边缘';
  return '弱牌';
}

// Heuristic-based strategy calculation (fallback)
function calculateHeuristicStrategy(
  card1: CardInput,
  card2: CardInput,
  handNotation: string,
  heroPosition: Position,
  villainPosition: Position,
  potSize: number,
  stackSize: number
): Omit<AnalysisResult, 'gtoSource' | 'boardTexture'> {
  const rank1Value = getRankValue(card1.rank);
  const rank2Value = getRankValue(card2.rank);
  const isPair = card1.rank === card2.rank;
  const isSuited = card1.suit === card2.suit;
  const gap = Math.abs(rank1Value - rank2Value);

  // Calculate base equity using heuristics
  let baseEquity = calculateBaseEquity(rank1Value, rank2Value, isPair, isSuited, gap);

  // Position adjustments
  const heroPositionValue = getPositionValue(heroPosition);
  const villainPositionValue = getPositionValue(villainPosition);
  const positionAdvantage = heroPositionValue - villainPositionValue;

  baseEquity += positionAdvantage * 0.02;
  baseEquity = Math.max(0.15, Math.min(0.85, baseEquity));

  // Calculate action frequencies
  const { raiseFreq, callFreq, foldFreq } = calculateActionFrequencies(
    handNotation,
    baseEquity,
    heroPosition,
    villainPosition
  );

  // Calculate EVs
  const raiseEV = raiseFreq > 0 ? calculateRaiseEV(baseEquity, potSize, stackSize) : 0;
  const callEV = callFreq > 0 ? calculateCallEV(baseEquity, potSize) : 0;

  const villainRangePercent = POSITION_RANGES[villainPosition] || 20;
  const totalCombos = Math.round(villainRangePercent * 12.69);
  const spr = stackSize / potSize;

  return {
    actions: [
      { action: 'raise', frequency: raiseFreq, ev: parseFloat(raiseEV.toFixed(2)) },
      { action: 'call', frequency: callFreq, ev: parseFloat(callEV.toFixed(2)) },
      { action: 'fold', frequency: foldFreq, ev: 0 },
    ].filter(a => a.frequency > 0).sort((a, b) => b.frequency - a.frequency),
    equity: parseFloat((baseEquity * 100).toFixed(1)),
    potOdds: calculatePotOdds(potSize),
    spr: parseFloat(spr.toFixed(1)),
    villainRange: villainRangePercent,
    combos: totalCombos,
    avgEquity: parseFloat((baseEquity * 100).toFixed(1)),
    handStrength: getHandStrengthFromEquity(baseEquity * 100),
    handStrengthZh: getHandStrengthZhFromEquity(baseEquity * 100),
  };
}

// Position value for comparison
function getPositionValue(position: Position): number {
  const values: Record<string, number> = {
    'BTN': 6, 'CO': 5, 'HJ': 4, 'LJ': 3, 'UTG2': 2, 'UTG1': 1, 'UTG': 0,
    'SB': 2, 'BB': 3,
  };
  return values[position] || 3;
}

// Base equity calculation
function calculateBaseEquity(
  rank1: number,
  rank2: number,
  isPair: boolean,
  isSuited: boolean,
  gap: number
): number {
  let equity = 0.35;

  if (isPair) {
    equity = 0.50 + (rank1 / 14) * 0.25;
  } else {
    const highCard = Math.max(rank1, rank2);
    const lowCard = Math.min(rank1, rank2);
    equity = 0.30 + (highCard / 14) * 0.15 + (lowCard / 14) * 0.10;

    if (isSuited) equity += 0.04;
    if (gap <= 1) equity += 0.03;
    else if (gap <= 3) equity += 0.01;
    if (highCard >= 10 && lowCard >= 10) equity += 0.05;
    if (highCard === 14) equity += 0.05;
  }

  return Math.min(0.85, Math.max(0.20, equity));
}

// Hand categories
const PREMIUM_PAIRS = ['AA', 'KK', 'QQ', 'JJ', 'TT'];
const STRONG_PAIRS = ['99', '88', '77', '66'];
const SMALL_PAIRS = ['55', '44', '33', '22'];
const BROADWAY_SUITED = ['AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs'];
const BROADWAY_OFFSUIT = ['AKo', 'AQo', 'AJo', 'KQo'];
const SUITED_CONNECTORS = ['T9s', '98s', '87s', '76s', '65s', '54s'];
const SUITED_ACES = ['A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'];

// Calculate action frequencies
function calculateActionFrequencies(
  handNotation: string,
  equity: number,
  heroPosition: Position,
  villainPosition: Position
): { raiseFreq: number; callFreq: number; foldFreq: number } {
  let raiseFreq = 0;
  let callFreq = 0;
  let foldFreq = 0;

  if (PREMIUM_PAIRS.includes(handNotation)) {
    raiseFreq = 1.0;
  } else if (STRONG_PAIRS.includes(handNotation) || BROADWAY_SUITED.includes(handNotation)) {
    raiseFreq = 0.85;
    callFreq = 0.15;
  } else if (BROADWAY_OFFSUIT.includes(handNotation)) {
    raiseFreq = 0.70;
    callFreq = 0.25;
    foldFreq = 0.05;
  } else if (SMALL_PAIRS.includes(handNotation) || SUITED_ACES.includes(handNotation)) {
    raiseFreq = 0.40;
    callFreq = 0.45;
    foldFreq = 0.15;
  } else if (SUITED_CONNECTORS.includes(handNotation)) {
    raiseFreq = 0.35;
    callFreq = 0.40;
    foldFreq = 0.25;
  } else if (equity >= 0.55) {
    raiseFreq = 0.60;
    callFreq = 0.30;
    foldFreq = 0.10;
  } else if (equity >= 0.45) {
    raiseFreq = 0.35;
    callFreq = 0.40;
    foldFreq = 0.25;
  } else if (equity >= 0.35) {
    raiseFreq = 0.15;
    callFreq = 0.35;
    foldFreq = 0.50;
  } else {
    raiseFreq = 0.05;
    callFreq = 0.20;
    foldFreq = 0.75;
  }

  // Position adjustments
  const isInPosition = getPositionValue(heroPosition) > getPositionValue(villainPosition);
  if (isInPosition) {
    raiseFreq *= 1.15;
    foldFreq *= 0.85;
  } else {
    raiseFreq *= 0.90;
    foldFreq *= 1.10;
  }

  // Normalize
  const total = raiseFreq + callFreq + foldFreq;
  raiseFreq = parseFloat((raiseFreq / total).toFixed(2));
  callFreq = parseFloat((callFreq / total).toFixed(2));
  foldFreq = parseFloat((1 - raiseFreq - callFreq).toFixed(2));

  return { raiseFreq, callFreq, foldFreq };
}

// EV calculations
function calculateRaiseEV(equity: number, potSize: number, stackSize: number): number {
  const betSize = Math.min(potSize * 0.75, stackSize * 0.3);
  return equity * (potSize + betSize) - (1 - equity) * betSize;
}

function calculateCallEV(equity: number, potSize: number): number {
  const callAmount = potSize * 0.3;
  return equity * (potSize + callAmount) - (1 - equity) * callAmount;
}
