import { create } from 'zustand';
import type { Card, Hand, Position, Street, Action, RangeMatrix } from '@gto/core';
import { createEmptyMatrix, setMatrixValue, HAND_CATEGORIES } from '@gto/core';

interface GameState {
  // Current game state
  street: Street;
  pot: number;
  board: Card[];
  heroHand: Hand | null;
  heroPosition: Position;
  villainPosition: Position | null;

  // Range data
  heroRange: RangeMatrix;
  villainRange: RangeMatrix;

  // Analysis results
  recommendedAction: Action | null;
  ev: number;
  equity: number;

  // Actions
  setStreet: (street: Street) => void;
  setPot: (pot: number) => void;
  setBoard: (board: Card[]) => void;
  setHeroHand: (hand: Hand | null) => void;
  setHeroPosition: (position: Position) => void;
  setVillainPosition: (position: Position | null) => void;
  updateHeroRange: (combo: string, value: number) => void;
  updateVillainRange: (combo: string, value: number) => void;
  setRecommendedAction: (action: Action | null) => void;
  setEV: (ev: number) => void;
  setEquity: (equity: number) => void;
  resetGame: () => void;
}

// Create default opening range
const createDefaultRange = (): RangeMatrix => {
  const matrix = createEmptyMatrix();
  HAND_CATEGORIES.PREMIUM.forEach(hand => setMatrixValue(matrix, hand, 1));
  HAND_CATEGORIES.STRONG.forEach(hand => setMatrixValue(matrix, hand, 0.8));
  HAND_CATEGORIES.PLAYABLE.forEach(hand => setMatrixValue(matrix, hand, 0.6));
  HAND_CATEGORIES.SPECULATIVE.forEach(hand => setMatrixValue(matrix, hand, 0.3));
  return matrix;
};

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  street: 'preflop',
  pot: 0,
  board: [],
  heroHand: null,
  heroPosition: 'BTN',
  villainPosition: null,
  heroRange: createDefaultRange(),
  villainRange: createEmptyMatrix(),
  recommendedAction: null,
  ev: 0,
  equity: 0.5,

  // Actions
  setStreet: (street) => set({ street }),
  setPot: (pot) => set({ pot }),
  setBoard: (board) => set({ board }),
  setHeroHand: (hand) => set({ heroHand: hand }),
  setHeroPosition: (position) => set({ heroPosition: position }),
  setVillainPosition: (position) => set({ villainPosition: position }),

  updateHeroRange: (combo, value) => set((state) => {
    const newMatrix = { ...state.heroRange, matrix: [...state.heroRange.matrix.map(row => [...row])] };
    setMatrixValue(newMatrix, combo, value);
    return { heroRange: newMatrix };
  }),

  updateVillainRange: (combo, value) => set((state) => {
    const newMatrix = { ...state.villainRange, matrix: [...state.villainRange.matrix.map(row => [...row])] };
    setMatrixValue(newMatrix, combo, value);
    return { villainRange: newMatrix };
  }),

  setRecommendedAction: (action) => set({ recommendedAction: action }),
  setEV: (ev) => set({ ev }),
  setEquity: (equity) => set({ equity }),

  resetGame: () => set({
    street: 'preflop',
    pot: 0,
    board: [],
    heroHand: null,
    recommendedAction: null,
    ev: 0,
    equity: 0.5,
  }),
}));
