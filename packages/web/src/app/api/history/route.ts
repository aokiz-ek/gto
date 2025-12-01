import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Save hand history
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      heroHand,
      board,
      heroPosition,
      villainPosition,
      potSize,
      stackSize,
      street,
      analysisResult,
      notes,
    } = await request.json();

    const { data: history, error } = await supabase
      .from('hand_histories')
      .insert({
        user_id: user.id,
        hero_hand: heroHand,
        board: board || '',
        hero_position: heroPosition,
        villain_position: villainPosition,
        pot_size: potSize,
        stack_size: stackSize,
        street,
        analysis_result: analysisResult,
        notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ history }, { status: 201 });
  } catch (error) {
    console.error('Save history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get hand histories
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: histories, error, count } = await supabase
      .from('hand_histories')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ histories, total: count });
  } catch (error) {
    console.error('Get histories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete hand history
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'History ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('hand_histories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
