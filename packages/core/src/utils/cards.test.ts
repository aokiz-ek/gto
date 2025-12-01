import { describe, it, expect } from 'vitest';
import {
  parseCard,
  cardToString,
  parseHand,
  handToDisplayString,
  getRankValue,
  compareCards,
  createDeck,
  shuffleDeck,
} from './cards';

describe('cards utility functions', () => {
  describe('parseCard', () => {
    it('should parse valid card strings', () => {
      expect(parseCard('Ah')).toEqual({ rank: 'A', suit: 'h' });
      expect(parseCard('Kd')).toEqual({ rank: 'K', suit: 'd' });
      expect(parseCard('Tc')).toEqual({ rank: 'T', suit: 'c' });
      expect(parseCard('2s')).toEqual({ rank: '2', suit: 's' });
    });

    it('should handle lowercase rank input', () => {
      expect(parseCard('ah')).toEqual({ rank: 'A', suit: 'h' });
      expect(parseCard('kd')).toEqual({ rank: 'K', suit: 'd' });
    });

    it('should throw for invalid card string length', () => {
      expect(() => parseCard('A')).toThrow('Invalid card string');
      expect(() => parseCard('Ahh')).toThrow('Invalid card string');
    });

    it('should throw for invalid rank', () => {
      expect(() => parseCard('Xh')).toThrow('Invalid rank');
      expect(() => parseCard('1h')).toThrow('Invalid rank');
    });

    it('should throw for invalid suit', () => {
      expect(() => parseCard('Ax')).toThrow('Invalid suit');
      expect(() => parseCard('A1')).toThrow('Invalid suit');
    });
  });

  describe('cardToString', () => {
    it('should convert card to string', () => {
      expect(cardToString({ rank: 'A', suit: 'h' })).toBe('Ah');
      expect(cardToString({ rank: 'K', suit: 'd' })).toBe('Kd');
      expect(cardToString({ rank: 'T', suit: 'c' })).toBe('Tc');
    });
  });

  describe('parseHand', () => {
    it('should parse valid hand strings', () => {
      const hand = parseHand('AhKd');
      expect(hand).toHaveLength(2);
      expect(hand[0]).toEqual({ rank: 'A', suit: 'h' });
      expect(hand[1]).toEqual({ rank: 'K', suit: 'd' });
    });

    it('should throw for invalid hand string length', () => {
      expect(() => parseHand('Ah')).toThrow('Invalid hand string');
      expect(() => parseHand('AhKdQc')).toThrow('Invalid hand string');
    });
  });

  describe('handToDisplayString', () => {
    it('should display pocket pairs correctly', () => {
      const hand = parseHand('AhAd');
      expect(handToDisplayString(hand)).toBe('AA');
    });

    it('should display suited hands correctly', () => {
      const hand = parseHand('AhKh');
      expect(handToDisplayString(hand)).toBe('AKs');
    });

    it('should display offsuit hands correctly', () => {
      const hand = parseHand('AhKd');
      expect(handToDisplayString(hand)).toBe('AKo');
    });

    it('should order ranks correctly (high first)', () => {
      const hand = parseHand('KhAh');
      expect(handToDisplayString(hand)).toBe('AKs');
    });
  });

  describe('getRankValue', () => {
    it('should return correct rank values', () => {
      expect(getRankValue('A')).toBe(14);
      expect(getRankValue('K')).toBe(13);
      expect(getRankValue('Q')).toBe(12);
      expect(getRankValue('J')).toBe(11);
      expect(getRankValue('T')).toBe(10);
      expect(getRankValue('9')).toBe(9);
      expect(getRankValue('2')).toBe(2);
    });
  });

  describe('compareCards', () => {
    it('should compare cards by rank', () => {
      const aceHearts = { rank: 'A' as const, suit: 'h' as const };
      const kingDiamonds = { rank: 'K' as const, suit: 'd' as const };
      const twoSpades = { rank: '2' as const, suit: 's' as const };

      expect(compareCards(aceHearts, kingDiamonds)).toBeLessThan(0); // A > K
      expect(compareCards(kingDiamonds, aceHearts)).toBeGreaterThan(0); // K < A
      expect(compareCards(aceHearts, aceHearts)).toBe(0); // A = A
      expect(compareCards(twoSpades, kingDiamonds)).toBeGreaterThan(0); // 2 < K
    });
  });

  describe('createDeck', () => {
    it('should create a 52 card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 4 cards of each rank', () => {
      const deck = createDeck();
      const aceCards = deck.filter(c => c.rank === 'A');
      expect(aceCards).toHaveLength(4);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();
      const hearts = deck.filter(c => c.suit === 'h');
      expect(hearts).toHaveLength(13);
    });

    it('should have no duplicate cards', () => {
      const deck = createDeck();
      const cardStrings = deck.map(c => `${c.rank}${c.suit}`);
      const uniqueCards = new Set(cardStrings);
      expect(uniqueCards.size).toBe(52);
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with same cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);

      expect(shuffled).toHaveLength(52);

      const originalSet = new Set(deck.map(c => `${c.rank}${c.suit}`));
      const shuffledSet = new Set(shuffled.map(c => `${c.rank}${c.suit}`));

      expect(shuffledSet).toEqual(originalSet);
    });

    it('should not modify original deck', () => {
      const deck = createDeck();
      const originalOrder = deck.map(c => `${c.rank}${c.suit}`);

      shuffleDeck(deck);

      const afterOrder = deck.map(c => `${c.rank}${c.suit}`);
      expect(afterOrder).toEqual(originalOrder);
    });

    it('should produce different order (with high probability)', () => {
      const deck = createDeck();
      const shuffled1 = shuffleDeck(deck);
      const shuffled2 = shuffleDeck(deck);

      // Not a deterministic test, but shuffle should produce different results
      // Check if at least some cards are in different positions
      let samePosition = 0;
      for (let i = 0; i < 52; i++) {
        if (shuffled1[i].rank === shuffled2[i].rank &&
            shuffled1[i].suit === shuffled2[i].suit) {
          samePosition++;
        }
      }

      // With a good shuffle, very unlikely to have more than 10 cards in same position
      expect(samePosition).toBeLessThan(30);
    });
  });
});
