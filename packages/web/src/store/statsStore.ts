import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActionLine, Position } from '@gto/core';

// Street type for postflop stats
type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Board texture for postflop analysis
type BoardTexture = 'dry' | 'wet' | 'monotone' | 'paired' | 'high' | 'low';

// Individual action record
interface ActionRecord {
  timestamp: string;
  action: ActionLine;
  position?: Position;
  vsPosition?: Position;
  street?: Street;
  boardTexture?: BoardTexture;
  isCorrect: boolean;
  userAction: string;
  gtoAction: string;
  frequency?: number;  // User's action frequency in GTO
}

// Aggregated stats for an action line
interface ActionLineStats {
  action: ActionLine;
  position?: Position;
  vsPosition?: Position;
  street?: Street;
  boardTexture?: BoardTexture;
  total: number;
  correct: number;
  userFrequencySum: number;  // Sum of frequencies chosen
  lastUpdated: string;
}

// Stats state
interface StatsState {
  // Raw action records (keep last 1000)
  actionHistory: ActionRecord[];

  // Aggregated stats by action line
  actionLineStats: ActionLineStats[];

  // Actions
  recordAction: (record: Omit<ActionRecord, 'timestamp'>) => void;
  getActionLineStats: (
    action: ActionLine,
    position?: Position,
    vsPosition?: Position,
    street?: Street,
    boardTexture?: BoardTexture
  ) => ActionLineStats | undefined;
  getFrequency: (
    action: ActionLine,
    position?: Position,
    vsPosition?: Position,
    street?: Street,
    boardTexture?: BoardTexture
  ) => number;
  getAllStats: () => ActionLineStats[];
  getStatsByCategory: (category: 'preflop' | 'postflop' | 'aggression' | 'defense') => ActionLineStats[];
  clearStats: () => void;
  getRecentHistory: (limit?: number) => ActionRecord[];
}

// Map action lines to categories
const actionCategories: Record<ActionLine, 'preflop' | 'postflop' | 'aggression' | 'defense'> = {
  rfi: 'preflop',
  '3bet': 'preflop',
  fold_to_3bet: 'preflop',
  call_3bet: 'preflop',
  '4bet': 'preflop',
  squeeze: 'preflop',
  cbet_flop: 'postflop',
  cbet_turn: 'postflop',
  cbet_river: 'postflop',
  fold_to_cbet: 'defense',
  raise_cbet: 'aggression',
  donk_bet: 'aggression',
  probe_bet: 'aggression',
  delayed_cbet: 'postflop',
  check_raise: 'aggression',
  float: 'defense',
  overbet: 'aggression',
  limp: 'preflop',
  cold_call: 'preflop',
  blind_defense: 'defense',
};

// Create a unique key for action line stats
function createStatsKey(
  action: ActionLine,
  position?: Position,
  vsPosition?: Position,
  street?: Street,
  boardTexture?: BoardTexture
): string {
  return `${action}|${position || ''}|${vsPosition || ''}|${street || ''}|${boardTexture || ''}`;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      actionHistory: [],
      actionLineStats: [],

      recordAction: (record) => set((state) => {
        const timestamp = new Date().toISOString();
        const fullRecord: ActionRecord = { ...record, timestamp };

        // Update action history (keep last 1000)
        const actionHistory = [fullRecord, ...state.actionHistory].slice(0, 1000);

        // Find or create aggregated stats
        const actionLineStats = [...state.actionLineStats];
        const key = createStatsKey(
          record.action,
          record.position,
          record.vsPosition,
          record.street,
          record.boardTexture
        );

        const existingIndex = actionLineStats.findIndex(s =>
          createStatsKey(s.action, s.position, s.vsPosition, s.street, s.boardTexture) === key
        );

        if (existingIndex >= 0) {
          const existing = actionLineStats[existingIndex];
          actionLineStats[existingIndex] = {
            ...existing,
            total: existing.total + 1,
            correct: existing.correct + (record.isCorrect ? 1 : 0),
            userFrequencySum: existing.userFrequencySum + (record.frequency || 0),
            lastUpdated: timestamp,
          };
        } else {
          actionLineStats.push({
            action: record.action,
            position: record.position,
            vsPosition: record.vsPosition,
            street: record.street,
            boardTexture: record.boardTexture,
            total: 1,
            correct: record.isCorrect ? 1 : 0,
            userFrequencySum: record.frequency || 0,
            lastUpdated: timestamp,
          });
        }

        return { actionHistory, actionLineStats };
      }),

      getActionLineStats: (action, position, vsPosition, street, boardTexture) => {
        const state = get();
        const key = createStatsKey(action, position, vsPosition, street, boardTexture);
        return state.actionLineStats.find(s =>
          createStatsKey(s.action, s.position, s.vsPosition, s.street, s.boardTexture) === key
        );
      },

      getFrequency: (action, position, vsPosition, street, boardTexture) => {
        const stats = get().getActionLineStats(action, position, vsPosition, street, boardTexture);
        if (!stats || stats.total === 0) return 0;
        // Return the accuracy as a proxy for frequency (correct decisions / total)
        return (stats.correct / stats.total) * 100;
      },

      getAllStats: () => get().actionLineStats,

      getStatsByCategory: (category) => {
        const state = get();
        return state.actionLineStats.filter(s => actionCategories[s.action] === category);
      },

      clearStats: () => set({ actionHistory: [], actionLineStats: [] }),

      getRecentHistory: (limit = 50) => {
        return get().actionHistory.slice(0, limit);
      },
    }),
    {
      name: 'gto-stats-store',
      partialize: (state) => ({
        actionHistory: state.actionHistory,
        actionLineStats: state.actionLineStats,
      }),
    }
  )
);

// Export types
export type { ActionRecord, ActionLineStats, Street, BoardTexture };
