import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile with stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get streak
    const { data: streakData } = await supabase
      .rpc('get_user_streak', { uid: user.id });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name,
        avatar: profile?.avatar_url,
        subscription: profile?.subscription,
        createdAt: profile?.created_at,
      },
      settings: settings || {
        theme: 'dark',
        soundEnabled: true,
        showFrequencies: true,
        defaultStackSize: 100,
      },
      stats: {
        totalSessions: stats?.total_sessions || 0,
        totalDecisions: stats?.total_decisions || 0,
        correctDecisions: stats?.correct_decisions || 0,
        accuracy: stats?.accuracy || 0,
        streakDays: streakData || 0,
        lastPractice: stats?.last_practice,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
