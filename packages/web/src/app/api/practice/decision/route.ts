import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Record a practice decision
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      sessionId,
      heroHand,
      heroPosition,
      villainPosition,
      userAction,
      correctAction,
      isCorrect,
    } = await request.json();

    const { data: decision, error } = await supabase
      .from('practice_decisions')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        hero_hand: heroHand,
        hero_position: heroPosition,
        villain_position: villainPosition,
        user_action: userAction,
        correct_action: correctAction,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update session stats
    await supabase.rpc('increment_session_stats', {
      session_id: sessionId,
      is_correct: isCorrect,
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    console.error('Record decision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get decisions for a session
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const { data: decisions, error } = await supabase
      .from('practice_decisions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ decisions });
  } catch (error) {
    console.error('Get decisions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
