import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all_time';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServerSupabaseClient();

    // Get current user for highlighting
    const { data: { user } } = await supabase.auth.getUser();

    let query;
    let scoreField: string;

    switch (period) {
      case 'weekly':
        query = supabase
          .from('profiles')
          .select('id, username, weekly_score, games_played, rank_tier')
          .gt('weekly_score', 0)
          .order('weekly_score', { ascending: false })
          .limit(limit);
        scoreField = 'weekly_score';
        break;
      case 'monthly':
        query = supabase
          .from('profiles')
          .select('id, username, monthly_score, games_played, rank_tier')
          .gt('monthly_score', 0)
          .order('monthly_score', { ascending: false })
          .limit(limit);
        scoreField = 'monthly_score';
        break;
      default:
        query = supabase
          .from('profiles')
          .select('id, username, total_score, games_played, games_won, best_streak, rank_tier')
          .gt('total_score', 0)
          .order('total_score', { ascending: false })
          .limit(limit);
        scoreField = 'total_score';
    }

    const { data: leaderboard, error } = await query;

    if (error) {
      throw error;
    }

    // Add rank and format response
    const rankedLeaderboard = (leaderboard || []).map((player, index) => ({
      ...player,
      score: (player as Record<string, unknown>)[scoreField],
      rank: index + 1,
      isCurrentUser: user?.id === player.id,
    }));

    // Get current user's rank if not in top results
    let userRank = null;
    if (user && !rankedLeaderboard.some(p => p.isCurrentUser)) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, total_score, weekly_score, monthly_score, games_played, rank_tier')
        .eq('id', user.id)
        .single();

      if (userProfile) {
        const userScore = (userProfile as Record<string, unknown>)[scoreField] || 0;
        // Count users with higher score to get rank
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt(scoreField, userScore);

        userRank = {
          ...userProfile,
          score: userScore,
          rank: (count || 0) + 1,
          isCurrentUser: true,
        };
      }
    }

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      userRank,
      period,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// Update user score
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { points, won, streak } = await request.json();

    // Update scores
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('total_score, weekly_score, monthly_score, games_played, games_won, best_streak')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    const newTotalScore = (profile.total_score || 0) + points;
    const newBestStreak = Math.max(profile.best_streak || 0, streak || 0);

    // Determine rank tier
    let rankTier = 'bronze';
    if (newTotalScore >= 10000) rankTier = 'diamond';
    else if (newTotalScore >= 5000) rankTier = 'platinum';
    else if (newTotalScore >= 2000) rankTier = 'gold';
    else if (newTotalScore >= 500) rankTier = 'silver';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_score: newTotalScore,
        weekly_score: (profile.weekly_score || 0) + points,
        monthly_score: (profile.monthly_score || 0) + points,
        games_played: (profile.games_played || 0) + 1,
        games_won: won ? (profile.games_won || 0) + 1 : profile.games_won,
        best_streak: newBestStreak,
        rank_tier: rankTier,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      newScore: newTotalScore,
      rankTier,
    });
  } catch (error) {
    console.error('Score update error:', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    );
  }
}
