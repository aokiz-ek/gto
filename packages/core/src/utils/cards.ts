import type { Card, Hand, Rank, Suit } from '../types';
import { RANKS, SUITS } from '../constants';

/**
 * Parse a card string (e.g., "Ah", "Kd") to Card object
 */
export function parseCard(cardStr: string): Card {
  if (cardStr.length !== 2) {
    throw new Error(`Invalid card string: ${cardStr}`);
  }
  const rank = cardStr[0].toUpperCase() as Rank;
  const suit = cardStr[1].toLowerCase() as Suit;

  if (!RANKS.includes(rank)) {
    throw new Error(`Invalid rank: ${rank}`);
  }
  if (!SUITS.includes(suit)) {
    throw new Error(`Invalid suit: ${suit}`);
  }

  return { rank, suit };
}

/**
 * Convert Card object to string
 */
export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/**
 * Parse a hand string (e.g., "AhKd") to Hand
 */
export function parseHand(handStr: string): Hand {
  if (handStr.length !== 4) {
    throw new Error(`Invalid hand string: ${handStr}`);
  }
  return [
    parseCard(handStr.slice(0, 2)),
    parseCard(handStr.slice(2, 4)),
  ];
}

/**
 * Convert Hand to display string (e.g., "AKs", "QQ", "T9o")
 */
export function handToDisplayString(hand: Hand): string {
  const [card1, card2] = hand;
  const rankIndex1 = RANKS.indexOf(card1.rank);
  const rankIndex2 = RANKS.indexOf(card2.rank);

  // Ensure higher rank comes first
  const [high, low] = rankIndex1 <= rankIndex2
    ? [card1, card2]
    : [card2, card1];

  if (high.rank === low.rank) {
    return `${high.rank}${low.rank}`;
  }

  const suitedness = high.suit === low.suit ? 's' : 'o';
  return `${high.rank}${low.rank}${suitedness}`;
}

/**
 * Get rank value (A=14, K=13, ..., 2=2)
 */
export function getRankValue(rank: Rank): number {
  const values: Record<Rank, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };
  return values[rank];
}

/**
 * Compare two cards by rank
 */
export function compareCards(a: Card, b: Card): number {
  return getRankValue(b.rank) - getRankValue(a.rank);
}

/**
 * Generate a full deck of cards
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
