import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Get user settings
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      settings: {
        theme: settings.theme,
        soundEnabled: settings.sound_enabled,
        showFrequencies: settings.show_frequencies,
        defaultStackSize: settings.default_stack_size,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const updates = await request.json();

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {};
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.soundEnabled !== undefined) dbUpdates.sound_enabled = updates.soundEnabled;
    if (updates.showFrequencies !== undefined) dbUpdates.show_frequencies = updates.showFrequencies;
    if (updates.defaultStackSize !== undefined) dbUpdates.default_stack_size = updates.defaultStackSize;

    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(dbUpdates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      settings: {
        theme: settings.theme,
        soundEnabled: settings.sound_enabled,
        showFrequencies: settings.show_frequencies,
        defaultStackSize: settings.default_stack_size,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
