import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export type MatchMode = 'quick' | 'ranked' | 'friend';
export type BattleStatus = 'idle' | 'matching' | 'matched' | 'playing' | 'completed';
export type RoundStatus = 'pending' | 'active' | 'completed';

export interface BattleRound {
  roundNumber: number;
  questionSeed: number;
  heroPosition: string;
  villainPosition: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  heroHand: string;
  status: RoundStatus;
  player1Action?: string;
  player1TimeMs?: number;
  player1Score?: number;
  player2Action?: string;
  player2TimeMs?: number;
  player2Score?: number;
  startedAt?: string;
}

export interface Battle {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name?: string;
  player2Name?: string;
  mode: MatchMode;
  status: 'active' | 'completed' | 'abandoned';
  currentRound: number;
  totalRounds: number;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  rounds: BattleRound[];
}

export interface Opponent {
  id: string;
  username: string;
  rankTier: string;
  rating: number;
}

interface PKState {
  // State
  status: BattleStatus;
  mode: MatchMode | null;
  battle: Battle | null;
  opponent: Opponent | null;
  isPlayer1: boolean;
  currentRound: BattleRound | null;
  matchingStartTime: number | null;
  error: string | null;

  // Realtime channel
  channel: RealtimeChannel | null;

  // Actions
  startMatching: (mode: MatchMode, userId: string) => Promise<void>;
  loadBattle: (battleId: string, userId: string) => Promise<void>;
  generateRounds: (battleId: string, totalRounds: number) => Promise<void>;
  cancelMatching: (userId: string) => Promise<void>;
  submitAnswer: (action: string, timeMs: number, score: number) => Promise<void>;
  leaveBattle: () => void;
  reset: () => void;
}

export const usePKStore = create<PKState>((set, get) => ({
  // Initial state
  status: 'idle',
  mode: null,
  battle: null,
  opponent: null,
  isPlayer1: false,
  currentRound: null,
  matchingStartTime: null,
  error: null,
  channel: null,

  // Start matchmaking
  startMatching: async (mode: MatchMode, userId: string) => {
    const supabase = createClient();

    set({ status: 'matching', mode, matchingStartTime: Date.now(), error: null });

    try {
      // Call the matchmaking function
      const { data, error } = await supabase.rpc('find_pk_match', {
        p_user_id: userId,
        p_mode: mode,
        p_rating: 1000, // TODO: Get actual rating
      });

      if (error) {
        console.error('Matchmaking error:', error);
        set({ error: error.message, status: 'idle' });
        return;
      }

      if (data) {
        // Match found! data is the battle_id
        await get().loadBattle(data, userId);
      } else {
        // No match yet, subscribe to queue updates
        const channel = supabase
          .channel(`pk_queue_${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'pk_matchmaking_queue',
              filter: `user_id=eq.${userId}`,
            },
            async (payload) => {
              const queueEntry = payload.new as {
                status: string;
                battle_id: string;
              };
              if (queueEntry.status === 'matched' && queueEntry.battle_id) {
                // Found a match!
                await get().loadBattle(queueEntry.battle_id, userId);
              }
            }
          )
          .subscribe();

        set({ channel });

        // Set timeout for matchmaking
        setTimeout(() => {
          const state = get();
          if (state.status === 'matching') {
            state.cancelMatching(userId);
            set({ error: '匹配超时，请重试' });
          }
        }, 120000); // 2 minutes timeout
      }
    } catch (err) {
      console.error('Start matching error:', err);
      set({ error: '匹配失败，请重试', status: 'idle' });
    }
  },

  // Load battle data
  loadBattle: async (battleId: string, userId: string) => {
    const supabase = createClient();

    try {
      // Get battle info
      const { data: battle, error: battleError } = await supabase
        .from('pk_battles')
        .select('*')
        .eq('id', battleId)
        .single();

      if (battleError || !battle) {
        set({ error: '加载对战失败', status: 'idle' });
        return;
      }

      const isPlayer1 = battle.player1_id === userId;
      const opponentId = isPlayer1 ? battle.player2_id : battle.player1_id;

      // Get opponent info
      const { data: opponentData } = await supabase
        .from('profiles')
        .select('id, username, rank_tier, total_score')
        .eq('id', opponentId)
        .single();

      // Get rounds
      const { data: rounds } = await supabase
        .from('pk_battle_rounds')
        .select('*')
        .eq('battle_id', battleId)
        .order('round_number');

      // If no rounds exist yet, generate them
      if (!rounds || rounds.length === 0) {
        await get().generateRounds(battleId, battle.total_rounds);
      }

      const battleData: Battle = {
        id: battle.id,
        player1Id: battle.player1_id,
        player2Id: battle.player2_id,
        mode: battle.mode,
        status: battle.status,
        currentRound: battle.current_round,
        totalRounds: battle.total_rounds,
        player1Score: battle.player1_score,
        player2Score: battle.player2_score,
        winnerId: battle.winner_id,
        rounds: (rounds || []).map((r: Record<string, unknown>) => ({
          roundNumber: r.round_number as number,
          questionSeed: r.question_seed as number,
          heroPosition: r.hero_position as string,
          villainPosition: r.villain_position as string,
          scenario: r.scenario as 'rfi' | 'vs_rfi' | 'vs_3bet',
          heroHand: r.hero_hand as string,
          status: r.status as RoundStatus,
          player1Action: r.player1_action as string | undefined,
          player1TimeMs: r.player1_time_ms as number | undefined,
          player1Score: r.player1_score as number | undefined,
          player2Action: r.player2_action as string | undefined,
          player2TimeMs: r.player2_time_ms as number | undefined,
          player2Score: r.player2_score as number | undefined,
          startedAt: r.started_at as string | undefined,
        })),
      };

      const opponent: Opponent | null = opponentData
        ? {
            id: opponentData.id,
            username: opponentData.username || '未知玩家',
            rankTier: opponentData.rank_tier || 'bronze',
            rating: opponentData.total_score || 1000,
          }
        : null;

      // Unsubscribe from queue channel
      const currentChannel = get().channel;
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }

      // Subscribe to battle updates
      const battleChannel = supabase
        .channel(`pk_battle_${battleId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pk_battles',
            filter: `id=eq.${battleId}`,
          },
          (payload) => {
            const updated = payload.new as Record<string, unknown>;
            set((state) => ({
              battle: state.battle
                ? {
                    ...state.battle,
                    currentRound: updated.current_round as number,
                    player1Score: updated.player1_score as number,
                    player2Score: updated.player2_score as number,
                    status: updated.status as 'active' | 'completed' | 'abandoned',
                    winnerId: updated.winner_id as string | undefined,
                  }
                : null,
              status: updated.status === 'completed' ? 'completed' : state.status,
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pk_battle_rounds',
            filter: `battle_id=eq.${battleId}`,
          },
          async () => {
            // Reload rounds when updated
            const { data: updatedRounds } = await supabase
              .from('pk_battle_rounds')
              .select('*')
              .eq('battle_id', battleId)
              .order('round_number');

            if (updatedRounds) {
              set((state) => ({
                battle: state.battle
                  ? {
                      ...state.battle,
                      rounds: updatedRounds.map((r) => ({
                        roundNumber: r.round_number,
                        questionSeed: r.question_seed,
                        heroPosition: r.hero_position,
                        villainPosition: r.villain_position,
                        scenario: r.scenario,
                        heroHand: r.hero_hand,
                        status: r.status,
                        player1Action: r.player1_action,
                        player1TimeMs: r.player1_time_ms,
                        player1Score: r.player1_score,
                        player2Action: r.player2_action,
                        player2TimeMs: r.player2_time_ms,
                        player2Score: r.player2_score,
                        startedAt: r.started_at,
                      })),
                    }
                  : null,
              }));
            }
          }
        )
        .subscribe();

      set({
        status: 'matched',
        battle: battleData,
        opponent,
        isPlayer1,
        channel: battleChannel,
        currentRound: battleData.rounds[0] || null,
      });
    } catch (err) {
      console.error('Load battle error:', err);
      set({ error: '加载对战失败', status: 'idle' });
    }
  },

  // Generate rounds for a battle
  generateRounds: async (battleId: string, totalRounds: number) => {
    const supabase = createClient();

    const positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
    const scenarios = ['rfi', 'vs_rfi', 'vs_3bet'] as const;
    const hands = [
      'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'KQs',
      'AKo', 'AQo', '99', '88', '77', 'ATs', 'KJs', 'QJs',
    ];

    const rounds = [];
    for (let i = 1; i <= totalRounds; i++) {
      const seed = Date.now() + i;
      const heroPos = positions[Math.floor(Math.random() * positions.length)];
      const villainPos = positions[Math.floor(Math.random() * positions.length)];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const heroHand = hands[Math.floor(Math.random() * hands.length)];

      rounds.push({
        battle_id: battleId,
        round_number: i,
        question_seed: seed,
        hero_position: heroPos,
        villain_position: villainPos !== heroPos ? villainPos : 'BB',
        scenario,
        hero_hand: heroHand,
        status: i === 1 ? 'active' : 'pending',
        started_at: i === 1 ? new Date().toISOString() : null,
      });
    }

    await supabase.from('pk_battle_rounds').insert(rounds);
  },

  // Cancel matchmaking
  cancelMatching: async (userId: string) => {
    const supabase = createClient();
    const { channel } = get();

    try {
      await supabase.rpc('cancel_pk_matchmaking', { p_user_id: userId });

      if (channel) {
        supabase.removeChannel(channel);
      }

      set({ status: 'idle', mode: null, matchingStartTime: null, channel: null });
    } catch (err) {
      console.error('Cancel matching error:', err);
    }
  },

  // Submit answer for current round
  submitAnswer: async (action: string, timeMs: number, score: number) => {
    const supabase = createClient();
    const { battle, currentRound, isPlayer1 } = get();

    if (!battle || !currentRound) return;

    const userId = isPlayer1 ? battle.player1Id : battle.player2Id;

    try {
      await supabase.rpc('submit_pk_answer', {
        p_battle_id: battle.id,
        p_user_id: userId,
        p_round_number: currentRound.roundNumber,
        p_action: action,
        p_time_ms: timeMs,
        p_score: score,
      });

      // Update local state
      set({ status: 'playing' });
    } catch (err) {
      console.error('Submit answer error:', err);
    }
  },

  // Leave battle
  leaveBattle: () => {
    const supabase = createClient();
    const { channel } = get();

    if (channel) {
      supabase.removeChannel(channel);
    }

    set({
      status: 'idle',
      battle: null,
      opponent: null,
      currentRound: null,
      channel: null,
    });
  },

  // Reset state
  reset: () => {
    const supabase = createClient();
    const { channel } = get();

    if (channel) {
      supabase.removeChannel(channel);
    }

    set({
      status: 'idle',
      mode: null,
      battle: null,
      opponent: null,
      isPlayer1: false,
      currentRound: null,
      matchingStartTime: null,
      error: null,
      channel: null,
    });
  },
}));
