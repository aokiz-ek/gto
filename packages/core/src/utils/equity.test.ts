import { describe, it, expect } from 'vitest';
import {
  HandRank,
  HAND_RANK_NAMES,
  evaluate5CardHand,
  compareHands,
  evaluateBestHand,
  expandHandCombo,
  calculateEquity,
  calculateEquityVsRange,
  getApproxPreflopEquity,
  calculateOuts,
  calculatePotOdds,
} from './equity';
import { parseHand, parseCard } from './cards';
import type { Card, Hand } from '../types';

describe('equity utility functions', () => {
  describe('HAND_RANK_NAMES', () => {
    it('should have Chinese names for all hand ranks', () => {
      expect(HAND_RANK_NAMES[HandRank.HighCard]).toBe('高牌');
      expect(HAND_RANK_NAMES[HandRank.Pair]).toBe('一对');
      expect(HAND_RANK_NAMES[HandRank.TwoPair]).toBe('两对');
      expect(HAND_RANK_NAMES[HandRank.ThreeOfAKind]).toBe('三条');
      expect(HAND_RANK_NAMES[HandRank.Straight]).toBe('顺子');
      expect(HAND_RANK_NAMES[HandRank.Flush]).toBe('同花');
      expect(HAND_RANK_NAMES[HandRank.FullHouse]).toBe('葫芦');
      expect(HAND_RANK_NAMES[HandRank.FourOfAKind]).toBe('四条');
      expect(HAND_RANK_NAMES[HandRank.StraightFlush]).toBe('同花顺');
      expect(HAND_RANK_NAMES[HandRank.RoyalFlush]).toBe('皇家同花顺');
    });
  });

  describe('evaluate5CardHand', () => {
    it('should throw for non-5-card input', () => {
      expect(() => evaluate5CardHand([])).toThrow('Must provide exactly 5 cards');
      expect(() => evaluate5CardHand([parseCard('Ah')])).toThrow('Must provide exactly 5 cards');
    });

    it('should identify high card', () => {
      const cards = ['Ah', 'Kd', 'Qc', 'Js', '9h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.HighCard);
    });

    it('should identify pair', () => {
      const cards = ['Ah', 'Ad', 'Kc', 'Qs', '9h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.Pair);
      expect(result[1]).toBe(14); // Pair of aces
    });

    it('should identify two pair', () => {
      const cards = ['Ah', 'Ad', 'Kc', 'Ks', '9h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.TwoPair);
      expect(result[1]).toBe(14); // Higher pair is aces
      expect(result[2]).toBe(13); // Lower pair is kings
    });

    it('should identify three of a kind', () => {
      const cards = ['Ah', 'Ad', 'Ac', 'Ks', '9h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.ThreeOfAKind);
      expect(result[1]).toBe(14); // Trip aces
    });

    it('should identify straight', () => {
      const cards = ['Ah', 'Kd', 'Qc', 'Js', 'Th'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.Straight);
      expect(result[1]).toBe(14); // Ace-high straight
    });

    it('should identify wheel straight (A-2-3-4-5)', () => {
      const cards = ['Ah', '2d', '3c', '4s', '5h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.Straight);
      expect(result[1]).toBe(5); // 5-high straight (wheel)
    });

    it('should identify flush', () => {
      const cards = ['Ah', 'Kh', 'Qh', 'Jh', '9h'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.Flush);
    });

    it('should identify full house', () => {
      const cards = ['Ah', 'Ad', 'Ac', 'Ks', 'Kh'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.FullHouse);
      expect(result[1]).toBe(14); // Trips
      expect(result[2]).toBe(13); // Pair
    });

    it('should identify four of a kind', () => {
      const cards = ['Ah', 'Ad', 'Ac', 'As', 'Kh'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.FourOfAKind);
      expect(result[1]).toBe(14); // Quad aces
    });

    it('should identify straight flush', () => {
      const cards = ['9h', 'Th', 'Jh', 'Qh', 'Kh'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.StraightFlush);
      expect(result[1]).toBe(13); // King-high
    });

    it('should identify royal flush', () => {
      const cards = ['Ah', 'Kh', 'Qh', 'Jh', 'Th'].map(parseCard);
      const result = evaluate5CardHand(cards);
      expect(result[0]).toBe(HandRank.RoyalFlush);
    });
  });

  describe('compareHands', () => {
    it('should compare different hand ranks', () => {
      const pair = [HandRank.Pair, 14, 13, 12, 11];
      const twoPair = [HandRank.TwoPair, 14, 13, 12];

      expect(compareHands(twoPair, pair)).toBeGreaterThan(0);
      expect(compareHands(pair, twoPair)).toBeLessThan(0);
    });

    it('should compare same hand ranks by kickers', () => {
      const pairAces = [HandRank.Pair, 14, 13, 12, 11];
      const pairKings = [HandRank.Pair, 13, 14, 12, 11];

      expect(compareHands(pairAces, pairKings)).toBeGreaterThan(0);
    });

    it('should return 0 for tied hands', () => {
      const hand1 = [HandRank.Pair, 14, 13, 12, 11];
      const hand2 = [HandRank.Pair, 14, 13, 12, 11];

      expect(compareHands(hand1, hand2)).toBe(0);
    });
  });

  describe('evaluateBestHand', () => {
    it('should throw for fewer than 5 cards total', () => {
      const hand = parseHand('AhKh');
      const board = [parseCard('Qd')]; // Only 3 cards total

      expect(() => evaluateBestHand(hand, board)).toThrow('Need at least 5 cards');
    });

    it('should find best 5-card hand from 7 cards', () => {
      const hand = parseHand('AhKh');
      const board = ['Qh', 'Jh', 'Th', '2d', '3c'].map(parseCard);

      const result = evaluateBestHand(hand, board);

      expect(result.rank).toBe(HandRank.RoyalFlush);
      expect(result.rankName).toBe('皇家同花顺');
    });

    it('should identify flush from 7 cards', () => {
      const hand = parseHand('AhKh');
      const board = ['9h', '5h', '2h', 'Qd', 'Jc'].map(parseCard);

      const result = evaluateBestHand(hand, board);

      expect(result.rank).toBe(HandRank.Flush);
    });

    it('should identify straight from 7 cards', () => {
      const hand = parseHand('AhKd');
      const board = ['Qc', 'Js', 'Th', '2d', '3c'].map(parseCard);

      const result = evaluateBestHand(hand, board);

      expect(result.rank).toBe(HandRank.Straight);
    });
  });

  describe('expandHandCombo', () => {
    it('should expand pair to 6 combinations', () => {
      const hands = expandHandCombo('AA');
      expect(hands).toHaveLength(6);

      // Check all 4 suits are used in the 6 combinations
      const suits = hands.flatMap(h => [h[0].suit, h[1].suit]);
      const uniqueSuits = new Set(suits);
      expect(uniqueSuits.size).toBe(4); // h, d, c, s
    });

    it('should expand suited hand to 4 combinations', () => {
      const hands = expandHandCombo('AKs');
      expect(hands).toHaveLength(4);

      // All cards in each hand should have same suit
      for (const hand of hands) {
        expect(hand[0].suit).toBe(hand[1].suit);
      }
    });

    it('should expand offsuit hand to 12 combinations', () => {
      const hands = expandHandCombo('AKo');
      expect(hands).toHaveLength(12);

      // All cards in each hand should have different suits
      for (const hand of hands) {
        expect(hand[0].suit).not.toBe(hand[1].suit);
      }
    });

    it('should handle lowercase input', () => {
      const hands = expandHandCombo('aks');
      expect(hands).toHaveLength(4);
    });

    it('should handle 10 as T', () => {
      const hands = expandHandCombo('A10s');
      expect(hands).toHaveLength(4);
      expect(hands[0][1].rank).toBe('T');
    });
  });

  describe('calculateEquity', () => {
    it('should return equity between 0 and 1', () => {
      const hand = parseHand('AhKh');
      const board: Card[] = [];

      const result = calculateEquity(hand, board, 100);

      expect(result.equity).toBeGreaterThanOrEqual(0);
      expect(result.equity).toBeLessThanOrEqual(1);
      expect(result.winRate + result.tieRate + result.lossRate).toBeCloseTo(1, 2);
    });

    it('should have higher equity with made hand on flop', () => {
      const hand = parseHand('AhAd');
      const board = ['As', '7c', '2d'].map(parseCard); // Set of aces

      const result = calculateEquity(hand, board, 500);

      expect(result.equity).toBeGreaterThan(0.9);
      expect(result.handStrength).not.toBeNull();
      expect(result.handStrength?.rank).toBe(HandRank.ThreeOfAKind);
    });

    it('should calculate equity with partial board', () => {
      const hand = parseHand('AhKh');
      const board = ['Qh', 'Jh', '2d'].map(parseCard); // Flush draw

      const result = calculateEquity(hand, board, 500);

      expect(result.samples).toBe(500);
      expect(result.handStrength).not.toBeNull();
    });

    it('should handle complete board', () => {
      const hand = parseHand('AhAd');
      const board = ['As', '7c', '2d', 'Kh', 'Qs'].map(parseCard);

      const result = calculateEquity(hand, board, 500);

      expect(result.samples).toBe(500);
      expect(result.handStrength?.rank).toBe(HandRank.ThreeOfAKind);
    });
  });

  describe('calculateEquityVsRange', () => {
    it('should calculate equity vs specific range', () => {
      const hand = parseHand('AhAd');
      const board: Card[] = [];
      const range = { hands: ['KK', 'QQ', 'JJ'] };

      const result = calculateEquityVsRange(hand, board, range, 100);

      // AA is favorite vs KK-JJ
      expect(result.equity).toBeGreaterThan(0.7);
    });

    it('should handle conflicting hands in range', () => {
      const hand = parseHand('AhAd');
      const board: Card[] = [];
      // All AA combos conflict with hero's hand - only 6 combos and we hold 2 cards
      // But not all combos conflict - some AA combos don't use Ah or Ad
      const range = { hands: ['AA'] };

      const result = calculateEquityVsRange(hand, board, range, 100);

      // Some AA combos remain (AcAs for example)
      // The equity should be around 50% vs remaining AA combos (coin flip)
      // If all hands conflict, samples would be 0
      if (result.samples === 0) {
        expect(result.equity).toBe(0.5);
      } else {
        // AA vs AA is roughly a coin flip
        expect(result.equity).toBeGreaterThan(0.3);
        expect(result.equity).toBeLessThan(0.7);
      }
    });

    it('should handle weighted range', () => {
      const hand = parseHand('QhQd');
      const board: Card[] = [];
      const range = {
        hands: ['AA', 'KK'],
        weights: [1, 0.5], // AA is twice as likely as KK
      };

      const result = calculateEquityVsRange(hand, board, range, 100);

      expect(result.samples).toBeGreaterThan(0);
      expect(result.equity).toBeLessThan(0.3); // QQ is underdog to AA/KK
    });
  });

  describe('getApproxPreflopEquity', () => {
    it('should return higher equity for better hands', () => {
      const aces = parseHand('AhAd');
      const deuces = parseHand('2h2d');
      const akSuited = parseHand('AhKh');
      const trash = parseHand('7h2d');

      const eqAces = getApproxPreflopEquity(aces);
      const eqDeuces = getApproxPreflopEquity(deuces);
      const eqAK = getApproxPreflopEquity(akSuited);
      const eqTrash = getApproxPreflopEquity(trash);

      expect(eqAces).toBeGreaterThan(eqDeuces);
      expect(eqAces).toBeGreaterThan(eqAK);
      expect(eqAK).toBeGreaterThan(eqTrash);
    });

    it('should give suited bonus', () => {
      const akSuited = parseHand('AhKh');
      const akOffsuit = parseHand('AhKd');

      const eqSuited = getApproxPreflopEquity(akSuited);
      const eqOffsuit = getApproxPreflopEquity(akOffsuit);

      expect(eqSuited).toBeGreaterThan(eqOffsuit);
    });

    it('should return value between 0.3 and 0.9', () => {
      const hands = [
        parseHand('AhAd'),
        parseHand('2h2d'),
        parseHand('AhKh'),
        parseHand('7h2d'),
      ];

      for (const hand of hands) {
        const equity = getApproxPreflopEquity(hand);
        expect(equity).toBeGreaterThanOrEqual(0.3);
        expect(equity).toBeLessThanOrEqual(0.9);
      }
    });
  });

  describe('calculateOuts', () => {
    it('should return empty array for preflop', () => {
      const hand = parseHand('AhKh');
      const board: Card[] = [];

      const outs = calculateOuts(hand, board);

      expect(outs).toHaveLength(0);
    });

    it('should find flush draw outs', () => {
      const hand = parseHand('AhKh');
      const board = ['9h', '5h', '2d'].map(parseCard); // 4 flush draw outs

      const outs = calculateOuts(hand, board);

      // Should find hearts that complete the flush
      const heartOuts = outs.filter(c => c.suit === 'h');
      expect(heartOuts.length).toBeGreaterThan(0);
    });

    it('should find straight draw outs', () => {
      const hand = parseHand('JhTd');
      const board = ['9c', '8s', '2h'].map(parseCard); // Open-ended straight draw

      const outs = calculateOuts(hand, board);

      // Should find Q and 7 for straight
      const qOuts = outs.filter(c => c.rank === 'Q');
      const sevenOuts = outs.filter(c => c.rank === '7');
      expect(qOuts.length + sevenOuts.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePotOdds', () => {
    it('should calculate pot odds correctly', () => {
      const result = calculatePotOdds(100, 50, 0.4);

      // Pot odds = 50 / (100 + 50) = 0.333
      expect(result.potOdds).toBeCloseTo(0.333, 2);
    });

    it('should recommend call when equity > pot odds', () => {
      const result = calculatePotOdds(100, 50, 0.4);

      // 40% equity > 33% pot odds = call
      expect(result.isCall).toBe(true);
      expect(result.evDiff).toBeCloseTo(0.067, 2); // 0.4 - 0.333
    });

    it('should recommend fold when equity < pot odds', () => {
      const result = calculatePotOdds(100, 50, 0.25);

      // 25% equity < 33% pot odds = fold
      expect(result.isCall).toBe(false);
      expect(result.evDiff).toBeLessThan(0);
    });

    it('should handle edge cases', () => {
      // Small bet into big pot
      const smallBet = calculatePotOdds(1000, 10, 0.05);
      expect(smallBet.potOdds).toBeCloseTo(0.0099, 2);
      expect(smallBet.isCall).toBe(true); // 5% > 0.99%

      // Large bet into small pot
      const largeBet = calculatePotOdds(10, 100, 0.5);
      expect(largeBet.potOdds).toBeCloseTo(0.909, 2);
      expect(largeBet.isCall).toBe(false); // 50% < 90.9%
    });
  });
});
