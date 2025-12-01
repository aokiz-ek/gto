import type { Card, Hand, Rank, Suit } from '../types';
import { getRankValue, createDeck, cardToString } from './cards';
import { RANKS, SUITS } from '../constants';

/**
 * Hand ranking categories
 */
export enum HandRank {
  HighCard = 1,
  Pair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
  RoyalFlush = 10,
}

/**
 * Hand rank names for display
 */
export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HighCard]: '高牌',
  [HandRank.Pair]: '一对',
  [HandRank.TwoPair]: '两对',
  [HandRank.ThreeOfAKind]: '三条',
  [HandRank.Straight]: '顺子',
  [HandRank.Flush]: '同花',
  [HandRank.FullHouse]: '葫芦',
  [HandRank.FourOfAKind]: '四条',
  [HandRank.StraightFlush]: '同花顺',
  [HandRank.RoyalFlush]: '皇家同花顺',
};

/**
 * Result of hand evaluation
 */
export interface HandEvaluation {
  rank: HandRank;
  rankName: string;
  score: number[];  // Array for comparison [rank, tiebreaker1, tiebreaker2, ...]
  bestCards: Card[];
}

/**
 * Result of equity calculation
 */
export interface EquityResult {
  equity: number;       // Win + tie percentage (0-1)
  winRate: number;      // Pure win percentage (0-1)
  tieRate: number;      // Tie percentage (0-1)
  lossRate: number;     // Loss percentage (0-1)
  samples: number;      // Number of simulations run
  handStrength: HandEvaluation | null;  // Current hand strength (if board exists)
}

/**
 * Opponent range definition
 */
export interface OpponentRange {
  hands: string[];      // Array of hand combos like ["AA", "KK", "AKs", "AKo"]
  weights?: number[];   // Optional weights for each hand (default: equal)
}

/**
 * Evaluate a 5-card hand
 * Returns [HandRank, ...tiebreakers]
 */
export function evaluate5CardHand(cards: Card[]): number[] {
  if (cards.length !== 5) {
    throw new Error('Must provide exactly 5 cards');
  }

  const ranks = cards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  // Check for flush
  const isFlush = suits.every(s => s === suits[0]);

  // Check for straight
  const isStraight = checkStraight(ranks);
  const straightHigh = isStraight ? getStraightHigh(ranks) : 0;

  // Count rank occurrences
  const rankCounts = new Map<number, number>();
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  }

  const counts = Array.from(rankCounts.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  // Determine hand rank
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return [HandRank.RoyalFlush];
    }
    return [HandRank.StraightFlush, straightHigh];
  }

  if (counts[0][1] === 4) {
    return [HandRank.FourOfAKind, counts[0][0], counts[1][0]];
  }

  if (counts[0][1] === 3 && counts[1][1] === 2) {
    return [HandRank.FullHouse, counts[0][0], counts[1][0]];
  }

  if (isFlush) {
    return [HandRank.Flush, ...ranks];
  }

  if (isStraight) {
    return [HandRank.Straight, straightHigh];
  }

  if (counts[0][1] === 3) {
    const kickers = counts.slice(1).map(c => c[0]);
    return [HandRank.ThreeOfAKind, counts[0][0], ...kickers];
  }

  if (counts[0][1] === 2 && counts[1][1] === 2) {
    const pairs = [counts[0][0], counts[1][0]].sort((a, b) => b - a);
    return [HandRank.TwoPair, ...pairs, counts[2][0]];
  }

  if (counts[0][1] === 2) {
    const kickers = counts.slice(1).map(c => c[0]);
    return [HandRank.Pair, counts[0][0], ...kickers];
  }

  return [HandRank.HighCard, ...ranks];
}

/**
 * Check if ranks form a straight
 */
function checkStraight(ranks: number[]): boolean {
  const sorted = [...new Set(ranks)].sort((a, b) => b - a);

  if (sorted.length < 5) return false;

  // Check for wheel (A-2-3-4-5)
  if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 &&
      sorted[3] === 3 && sorted[4] === 2) {
    return true;
  }

  // Check for regular straight
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] !== 1) {
      return false;
    }
  }

  return true;
}

/**
 * Get the high card of a straight
 */
function getStraightHigh(ranks: number[]): number {
  const sorted = [...new Set(ranks)].sort((a, b) => b - a);

  // Wheel straight
  if (sorted[0] === 14 && sorted[1] === 5) {
    return 5;
  }

  return sorted[0];
}

/**
 * Compare two evaluated hands
 * Returns positive if hand1 wins, negative if hand2 wins, 0 for tie
 */
export function compareHands(eval1: number[], eval2: number[]): number {
  const maxLen = Math.max(eval1.length, eval2.length);

  for (let i = 0; i < maxLen; i++) {
    const v1 = eval1[i] ?? 0;
    const v2 = eval2[i] ?? 0;

    if (v1 !== v2) {
      return v1 - v2;
    }
  }

  return 0;
}

/**
 * Generate all 5-card combinations from 7 cards
 * Used to find the best 5-card hand from hole cards + board
 */
function* combinations5(cards: Card[]): Generator<Card[]> {
  const n = cards.length;
  if (n < 5) return;

  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            yield [cards[i], cards[j], cards[k], cards[l], cards[m]];
          }
        }
      }
    }
  }
}

/**
 * Evaluate the best 5-card hand from hole cards + board
 * Returns the evaluation with the best score
 */
export function evaluateBestHand(holeCards: Hand, board: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...board];

  // If we have fewer than 5 cards, can't evaluate
  if (allCards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate hand');
  }

  let bestScore: number[] = [0];
  let bestCards: Card[] = [];

  // Try all 5-card combinations
  for (const combo of combinations5(allCards)) {
    const score = evaluate5CardHand(combo);
    if (compareHands(score, bestScore) > 0) {
      bestScore = score;
      bestCards = combo;
    }
  }

  const rank = bestScore[0] as HandRank;

  return {
    rank,
    rankName: HAND_RANK_NAMES[rank],
    score: bestScore,
    bestCards,
  };
}

/**
 * Get a card key for Set operations
 */
function getCardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/**
 * Create a set of used cards for quick lookup
 */
function createCardSet(cards: Card[]): Set<string> {
  return new Set(cards.map(getCardKey));
}

/**
 * Get remaining deck after removing known cards
 */
function getRemainingDeck(usedCards: Card[]): Card[] {
  const used = createCardSet(usedCards);
  const deck = createDeck();
  return deck.filter(card => !used.has(getCardKey(card)));
}

/**
 * Fisher-Yates shuffle for an array (in place)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Parse a hand combo string (e.g., "AKs", "QQ", "T9o") to all possible specific hands
 */
export function expandHandCombo(combo: string): Hand[] {
  const hands: Hand[] = [];

  // Normalize input
  combo = combo.toUpperCase().replace('10', 'T');

  if (combo.length === 2) {
    // Pair like "AA", "KK"
    const rank = combo[0] as Rank;
    const suits: Suit[] = ['h', 'd', 'c', 's'];

    for (let i = 0; i < suits.length; i++) {
      for (let j = i + 1; j < suits.length; j++) {
        hands.push([
          { rank, suit: suits[i] },
          { rank, suit: suits[j] },
        ]);
      }
    }
  } else if (combo.length === 3) {
    const rank1 = combo[0] as Rank;
    const rank2 = combo[1] as Rank;
    const type = combo[2].toLowerCase();
    const suits: Suit[] = ['h', 'd', 'c', 's'];

    if (type === 's') {
      // Suited like "AKs"
      for (const suit of suits) {
        hands.push([
          { rank: rank1, suit },
          { rank: rank2, suit },
        ]);
      }
    } else if (type === 'o') {
      // Offsuit like "AKo"
      for (let i = 0; i < suits.length; i++) {
        for (let j = 0; j < suits.length; j++) {
          if (i !== j) {
            hands.push([
              { rank: rank1, suit: suits[i] },
              { rank: rank2, suit: suits[j] },
            ]);
          }
        }
      }
    }
  }

  return hands;
}

/**
 * Filter expanded hands to remove those using blocked cards
 */
function filterBlockedHands(hands: Hand[], blockedCards: Card[]): Hand[] {
  const blocked = createCardSet(blockedCards);

  return hands.filter(hand => {
    return !blocked.has(getCardKey(hand[0])) && !blocked.has(getCardKey(hand[1]));
  });
}

/**
 * Monte Carlo equity calculation against a random opponent
 * @param hand Hero's hole cards
 * @param board Current board cards (can be 0-5 cards)
 * @param iterations Number of simulations to run
 * @returns EquityResult with win/tie/loss rates
 */
export function calculateEquity(
  hand: Hand,
  board: Card[],
  iterations: number = 10000
): EquityResult {
  const usedCards = [...hand, ...board];
  const remainingDeck = getRemainingDeck(usedCards);

  let wins = 0;
  let ties = 0;
  let losses = 0;

  const cardsNeeded = 5 - board.length;  // Cards needed to complete the board

  for (let i = 0; i < iterations; i++) {
    // Shuffle remaining deck
    const shuffled = shuffleArray(remainingDeck);

    // Deal opponent hand
    const oppHand: Hand = [shuffled[0], shuffled[1]];

    // Complete the board if necessary
    const runout = shuffled.slice(2, 2 + cardsNeeded);
    const finalBoard = [...board, ...runout];

    // Evaluate both hands
    const heroEval = evaluateBestHand(hand, finalBoard);
    const oppEval = evaluateBestHand(oppHand, finalBoard);

    // Compare
    const result = compareHands(heroEval.score, oppEval.score);

    if (result > 0) {
      wins++;
    } else if (result < 0) {
      losses++;
    } else {
      ties++;
    }
  }

  const winRate = wins / iterations;
  const tieRate = ties / iterations;
  const lossRate = losses / iterations;

  // Calculate current hand strength if board has cards
  let handStrength: HandEvaluation | null = null;
  if (board.length >= 3) {
    try {
      handStrength = evaluateBestHand(hand, board);
    } catch {
      // Not enough cards
    }
  }

  return {
    equity: winRate + (tieRate / 2),  // Ties count as half a win
    winRate,
    tieRate,
    lossRate,
    samples: iterations,
    handStrength,
  };
}

/**
 * Calculate equity against a specific opponent range
 * @param hand Hero's hole cards
 * @param board Current board cards
 * @param opponentRange Opponent's range of hands
 * @param iterations Iterations per opponent hand combo
 * @returns EquityResult
 */
export function calculateEquityVsRange(
  hand: Hand,
  board: Card[],
  opponentRange: OpponentRange,
  iterations: number = 1000
): EquityResult {
  const usedCards = [...hand, ...board];
  const remainingDeck = getRemainingDeck(usedCards);

  let totalWins = 0;
  let totalTies = 0;
  let totalLosses = 0;
  let totalSamples = 0;

  const cardsNeeded = 5 - board.length;

  // Process each hand in the range
  for (let h = 0; h < opponentRange.hands.length; h++) {
    const combo = opponentRange.hands[h];
    const weight = opponentRange.weights?.[h] ?? 1;

    // Expand combo to all possible specific hands
    const expandedHands = expandHandCombo(combo);

    // Filter out hands that conflict with hero's cards or board
    const validHands = filterBlockedHands(expandedHands, usedCards);

    if (validHands.length === 0) continue;

    // Calculate iterations per combo (weighted)
    const iterationsForCombo = Math.ceil(iterations * weight / validHands.length);

    for (const oppHand of validHands) {
      // Get deck without hero, opponent, and board cards
      const deckMinusAll = getRemainingDeck([...usedCards, ...oppHand]);

      for (let i = 0; i < iterationsForCombo; i++) {
        const shuffled = shuffleArray(deckMinusAll);

        // Complete board
        const runout = shuffled.slice(0, cardsNeeded);
        const finalBoard = [...board, ...runout];

        // Evaluate both hands
        const heroEval = evaluateBestHand(hand, finalBoard);
        const oppEval = evaluateBestHand(oppHand, finalBoard);

        // Compare
        const result = compareHands(heroEval.score, oppEval.score);

        if (result > 0) {
          totalWins += weight;
        } else if (result < 0) {
          totalLosses += weight;
        } else {
          totalTies += weight;
        }
        totalSamples++;
      }
    }
  }

  if (totalSamples === 0) {
    return {
      equity: 0.5,
      winRate: 0,
      tieRate: 0,
      lossRate: 0,
      samples: 0,
      handStrength: null,
    };
  }

  const totalWeight = totalWins + totalTies + totalLosses;
  const winRate = totalWins / totalWeight;
  const tieRate = totalTies / totalWeight;
  const lossRate = totalLosses / totalWeight;

  // Calculate current hand strength
  let handStrength: HandEvaluation | null = null;
  if (board.length >= 3) {
    try {
      handStrength = evaluateBestHand(hand, board);
    } catch {
      // Not enough cards
    }
  }

  return {
    equity: winRate + (tieRate / 2),
    winRate,
    tieRate,
    lossRate,
    samples: totalSamples,
    handStrength,
  };
}

/**
 * Quick preflop equity approximation table
 * Based on common matchup equities
 */
const PREFLOP_EQUITY_TABLE: Record<string, number> = {
  // Pair vs pair
  'AA_vs_KK': 0.82,
  'KK_vs_QQ': 0.82,
  // Pair vs overcards
  'AA_vs_AKs': 0.87,
  'AA_vs_AKo': 0.93,
  'QQ_vs_AKs': 0.54,
  'QQ_vs_AKo': 0.57,
  // Pair vs undercards
  'AA_vs_KQs': 0.83,
  'KK_vs_QJs': 0.82,
  // Dominated hands
  'AKs_vs_AQs': 0.71,
  'AKo_vs_AQo': 0.74,
  // Coin flips
  'AKs_vs_QQ': 0.46,
  'AKo_vs_JJ': 0.43,
};

/**
 * Get approximate preflop equity (much faster than Monte Carlo)
 * Uses lookup table + heuristics
 */
export function getApproxPreflopEquity(hand: Hand): number {
  const ranks = [getRankValue(hand[0].rank), getRankValue(hand[1].rank)].sort((a, b) => b - a);
  const isPair = ranks[0] === ranks[1];
  const isSuited = hand[0].suit === hand[1].suit;

  if (isPair) {
    // Pair equity approximation (based on pair value)
    // AA ≈ 85%, 22 ≈ 50% vs random
    return 0.50 + (ranks[0] - 2) * 0.029;
  }

  // Non-pair equity approximation
  const highRank = ranks[0];
  const lowRank = ranks[1];
  const gap = highRank - lowRank;
  const connectivity = gap <= 4 ? (5 - gap) * 0.01 : 0;

  // Base equity from high card
  let equity = 0.30 + (highRank - 2) * 0.02;

  // Adjust for low card (kicker)
  equity += (lowRank - 2) * 0.008;

  // Suited bonus
  if (isSuited) {
    equity += 0.03;
  }

  // Connectivity bonus
  equity += connectivity;

  return Math.min(0.70, Math.max(0.30, equity));
}

/**
 * Calculate outs (cards that improve our hand)
 * @param hand Hero's hole cards
 * @param board Current board
 * @returns Array of cards that would improve our hand
 */
export function calculateOuts(hand: Hand, board: Card[]): Card[] {
  if (board.length < 3) {
    return [];
  }

  const currentEval = evaluateBestHand(hand, board);
  const usedCards = [...hand, ...board];
  const remainingDeck = getRemainingDeck(usedCards);

  const outs: Card[] = [];

  for (const card of remainingDeck) {
    // Simulate adding this card to the board
    const newBoard = [...board, card];
    if (newBoard.length > 5) {
      // If we already have 5 board cards, replace the last one
      newBoard.pop();
      newBoard.push(card);
    }

    const newEval = evaluateBestHand(hand, newBoard.slice(0, 5));

    // If our hand improved
    if (compareHands(newEval.score, currentEval.score) > 0) {
      outs.push(card);
    }
  }

  return outs;
}

/**
 * Calculate pot odds and compare to equity
 * @param potSize Current pot size
 * @param betSize Bet we need to call
 * @param equity Our estimated equity (0-1)
 * @returns Object with pot odds and whether calling is +EV
 */
export function calculatePotOdds(
  potSize: number,
  betSize: number,
  equity: number
): { potOdds: number; isCall: boolean; evDiff: number } {
  const potOdds = betSize / (potSize + betSize);
  const isCall = equity > potOdds;
  const evDiff = equity - potOdds;

  return { potOdds, isCall, evDiff };
}
