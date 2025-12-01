import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { parseCard, parseHand } from '@gto/core';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().resetGame();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useGameStore.getState();

      expect(state.street).toBe('preflop');
      expect(state.pot).toBe(0);
      expect(state.board).toEqual([]);
      expect(state.heroHand).toBeNull();
      expect(state.heroPosition).toBe('BTN');
      expect(state.villainPosition).toBeNull();
      expect(state.recommendedAction).toBeNull();
      expect(state.ev).toBe(0);
      expect(state.equity).toBe(0.5);
    });

    it('should have a default hero range', () => {
      const state = useGameStore.getState();

      expect(state.heroRange).toBeDefined();
      expect(state.heroRange.matrix).toBeDefined();
      expect(state.heroRange.matrix.length).toBe(13);
    });
  });

  describe('setStreet', () => {
    it('should update street', () => {
      useGameStore.getState().setStreet('flop');
      expect(useGameStore.getState().street).toBe('flop');

      useGameStore.getState().setStreet('turn');
      expect(useGameStore.getState().street).toBe('turn');

      useGameStore.getState().setStreet('river');
      expect(useGameStore.getState().street).toBe('river');
    });
  });

  describe('setPot', () => {
    it('should update pot size', () => {
      useGameStore.getState().setPot(100);
      expect(useGameStore.getState().pot).toBe(100);

      useGameStore.getState().setPot(500);
      expect(useGameStore.getState().pot).toBe(500);
    });
  });

  describe('setBoard', () => {
    it('should update board cards', () => {
      const flop = [
        parseCard('Ah'),
        parseCard('Kd'),
        parseCard('Qc'),
      ];

      useGameStore.getState().setBoard(flop);
      const board = useGameStore.getState().board;

      expect(board.length).toBe(3);
      expect(board[0].rank).toBe('A');
      expect(board[0].suit).toBe('h');
    });

    it('should handle empty board', () => {
      useGameStore.getState().setBoard([]);
      expect(useGameStore.getState().board).toEqual([]);
    });
  });

  describe('setHeroHand', () => {
    it('should update hero hand', () => {
      const hand = parseHand('AhKh');
      useGameStore.getState().setHeroHand(hand);

      const heroHand = useGameStore.getState().heroHand;
      expect(heroHand).not.toBeNull();
      expect(heroHand![0].rank).toBe('A');
      expect(heroHand![1].rank).toBe('K');
    });

    it('should allow null hand', () => {
      useGameStore.getState().setHeroHand(null);
      expect(useGameStore.getState().heroHand).toBeNull();
    });
  });

  describe('setHeroPosition', () => {
    it('should update hero position', () => {
      useGameStore.getState().setHeroPosition('UTG');
      expect(useGameStore.getState().heroPosition).toBe('UTG');

      useGameStore.getState().setHeroPosition('BB');
      expect(useGameStore.getState().heroPosition).toBe('BB');
    });
  });

  describe('setVillainPosition', () => {
    it('should update villain position', () => {
      useGameStore.getState().setVillainPosition('CO');
      expect(useGameStore.getState().villainPosition).toBe('CO');
    });

    it('should allow null villain position', () => {
      useGameStore.getState().setVillainPosition(null);
      expect(useGameStore.getState().villainPosition).toBeNull();
    });
  });

  describe('updateHeroRange', () => {
    it('should update specific combo in range', () => {
      const state = useGameStore.getState();
      const initialValue = state.heroRange.matrix[0][0]; // AA

      useGameStore.getState().updateHeroRange('AA', 0.5);

      const newValue = useGameStore.getState().heroRange.matrix[0][0];
      expect(newValue).toBe(0.5);
    });
  });

  describe('updateVillainRange', () => {
    it('should update specific combo in villain range', () => {
      useGameStore.getState().updateVillainRange('AA', 1.0);

      const newValue = useGameStore.getState().villainRange.matrix[0][0];
      expect(newValue).toBe(1.0);
    });
  });

  describe('setRecommendedAction', () => {
    it('should update recommended action', () => {
      const action = { type: 'raise' as const, amount: 100 };
      useGameStore.getState().setRecommendedAction(action);

      const result = useGameStore.getState().recommendedAction;
      expect(result).toEqual(action);
    });

    it('should allow null action', () => {
      useGameStore.getState().setRecommendedAction(null);
      expect(useGameStore.getState().recommendedAction).toBeNull();
    });
  });

  describe('setEV', () => {
    it('should update EV', () => {
      useGameStore.getState().setEV(25.5);
      expect(useGameStore.getState().ev).toBe(25.5);
    });

    it('should handle negative EV', () => {
      useGameStore.getState().setEV(-10);
      expect(useGameStore.getState().ev).toBe(-10);
    });
  });

  describe('setEquity', () => {
    it('should update equity', () => {
      useGameStore.getState().setEquity(0.65);
      expect(useGameStore.getState().equity).toBe(0.65);
    });
  });

  describe('resetGame', () => {
    it('should reset to initial state', () => {
      // Change some values
      useGameStore.getState().setStreet('flop');
      useGameStore.getState().setPot(100);
      useGameStore.getState().setHeroHand(parseHand('AhKh'));
      useGameStore.getState().setEV(50);

      // Reset
      useGameStore.getState().resetGame();

      // Verify reset
      const state = useGameStore.getState();
      expect(state.street).toBe('preflop');
      expect(state.pot).toBe(0);
      expect(state.board).toEqual([]);
      expect(state.heroHand).toBeNull();
      expect(state.recommendedAction).toBeNull();
      expect(state.ev).toBe(0);
      expect(state.equity).toBe(0.5);
    });

    it('should preserve ranges after reset', () => {
      useGameStore.getState().resetGame();

      const state = useGameStore.getState();
      expect(state.heroRange).toBeDefined();
      expect(state.villainRange).toBeDefined();
    });
  });
});
