'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store';

export function useAuthListener() {
  const { setUser, logout } = useUserStore();

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const username = session.user.user_metadata?.name ||
                        session.user.user_metadata?.full_name ||
                        session.user.user_metadata?.preferred_username ||
                        session.user.user_metadata?.user_name ||
                        session.user.email?.split('@')[0] ||
                        session.user.email ||
                        'User';

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: username,
          avatar: session.user.user_metadata?.avatar_url,
          subscription: 'free',
          createdAt: session.user.created_at,
        });
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          const username = session.user.user_metadata?.name ||
                          session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.preferred_username ||
                          session.user.user_metadata?.user_name ||
                          session.user.email?.split('@')[0] ||
                          session.user.email ||
                          'User';

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: username,
            avatar: session.user.user_metadata?.avatar_url,
            subscription: 'free',
            createdAt: session.user.created_at,
          });
        } else if (event === 'SIGNED_OUT') {
          logout();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data on token refresh
          const username = session.user.user_metadata?.name ||
                          session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.preferred_username ||
                          session.user.user_metadata?.user_name ||
                          session.user.email?.split('@')[0] ||
                          session.user.email ||
                          'User';

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: username,
            avatar: session.user.user_metadata?.avatar_url,
            subscription: 'free',
            createdAt: session.user.created_at,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, logout]);
}
