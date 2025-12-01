'use client';

import { useEffect, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  isLoading: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    error: null,
  });

  const { setUser, logout: storeLogout, practiceStats, settings, savedHands, achievements } = useUserStore();
  const supabase = createClient();

  // Sync local data to Supabase when user logs in
  const syncDataToSupabase = useCallback(async (userId: string) => {
    try {
      // Sync practice stats
      if (practiceStats.totalDecisions > 0) {
        const { error: statsError } = await supabase
          .from('practice_sessions')
          .upsert({
            user_id: userId,
            correct_decisions: practiceStats.correctDecisions,
            total_decisions: practiceStats.totalDecisions,
            duration_seconds: 0,
            created_at: practiceStats.lastPractice || new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (statsError) {
          console.warn('Failed to sync practice stats:', statsError);
        }
      }

      // Sync user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          theme: settings.theme,
          sound_enabled: settings.soundEnabled,
          show_frequencies: settings.showFrequencies,
          default_stack_size: settings.defaultStackSize,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.warn('Failed to sync settings:', settingsError);
      }

      // Sync saved hands (last 50)
      const handsToSync = savedHands.slice(0, 50);
      for (const hand of handsToSync) {
        const { error: handError } = await supabase
          .from('hand_histories')
          .upsert({
            id: hand.id,
            user_id: userId,
            hero_hand: hand.heroHand,
            board: hand.board.join(','),
            hero_position: hand.heroPosition,
            villain_position: hand.villainPosition,
            pot_size: 0,
            stack_size: settings.defaultStackSize,
            street: hand.results[hand.results.length - 1]?.street || 'preflop',
            analysis_result: JSON.stringify(hand.results),
            notes: hand.notes,
            created_at: hand.timestamp,
          }, { onConflict: 'id' });

        if (handError) {
          console.warn('Failed to sync hand:', hand.id, handError);
        }
      }
    } catch (err) {
      console.error('Data sync error:', err);
    }
  }, [practiceStats, settings, savedHands, supabase]);

  // Load data from Supabase when user logs in
  const loadDataFromSupabase = useCallback(async (userId: string) => {
    try {
      // Load user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        useUserStore.getState().updateSettings({
          theme: settingsData.theme as 'dark' | 'light',
          soundEnabled: settingsData.sound_enabled,
          showFrequencies: settingsData.show_frequencies,
          defaultStackSize: settingsData.default_stack_size,
        });
      }

      // Load user stats from view
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsData && statsData.total_decisions > useUserStore.getState().practiceStats.totalDecisions) {
        // Cloud has more data, update local store
        const currentStats = useUserStore.getState().practiceStats;
        useUserStore.setState({
          practiceStats: {
            ...currentStats,
            totalDecisions: statsData.total_decisions,
            correctDecisions: statsData.correct_decisions,
            streakDays: statsData.streak_days,
            lastPractice: statsData.last_practice,
          },
        });
      }
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    }
  }, [supabase]);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          await handleUserLogin(session.user);
        }
        setAuthState({ isLoading: false, error: null });
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setAuthState({ isLoading: false, error: 'Failed to initialize auth' });
        }
      }
    };

    const handleUserLogin = async (user: User) => {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUser({
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || 'User',
        avatar: profile?.avatar_url || undefined,
        subscription: profile?.subscription || 'free',
        createdAt: user.created_at,
      });

      // Load cloud data
      await loadDataFromSupabase(user.id);
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
          storeLogout();
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, storeLogout, loadDataFromSupabase]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Sync local data to cloud after login
        await syncDataToSupabase(data.user.id);
      }

      setAuthState({ isLoading: false, error: null });
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [supabase, syncDataToSupabase]);

  // Register function
  const register = useCallback(async (name: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          name,
        });

        // Sync local data to cloud
        await syncDataToSupabase(data.user.id);
      }

      setAuthState({ isLoading: false, error: null });
      return {
        success: true,
        message: 'Please check your email to confirm your account.',
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [supabase, syncDataToSupabase]);

  // Logout function
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      storeLogout();
      setAuthState({ isLoading: false, error: null });
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [supabase, storeLogout]);

  // OAuth login
  const loginWithOAuth = useCallback(async (provider: 'google' | 'github' | 'discord') => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth login failed';
      setAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [supabase]);

  // Sync current state to cloud
  const syncToCloud = useCallback(async () => {
    const state = useUserStore.getState();
    if (!state.user?.id) return { success: false, error: 'Not logged in' };

    try {
      await syncDataToSupabase(state.user.id);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      return { success: false, error: errorMessage };
    }
  }, [syncDataToSupabase]);

  return {
    ...authState,
    login,
    register,
    logout,
    loginWithOAuth,
    syncToCloud,
  };
}
