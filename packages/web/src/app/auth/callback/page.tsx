'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Get the code from URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
          // Exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setError(exchangeError.message);
            setTimeout(() => router.push('/auth/login?error=callback_failed'), 2000);
            return;
          }
        }

        // Now get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push('/auth/login?error=callback_failed'), 2000);
          return;
        }

        if (session?.user) {
          // Get username from various sources
          const username = session.user.user_metadata?.name ||
                          session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.preferred_username ||
                          session.user.user_metadata?.user_name ||
                          session.user.email?.split('@')[0] ||
                          session.user.email ||
                          'User';

          // Update user store
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: username,
            subscription: 'free',
            createdAt: session.user.created_at,
          });

          router.push('/');
        } else {
          // Try to get session from URL hash (for implicit grant)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');

          if (accessToken) {
            const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

            if (user && !userError) {
              const implicitUsername = user.user_metadata?.name ||
                                      user.user_metadata?.full_name ||
                                      user.user_metadata?.preferred_username ||
                                      user.user_metadata?.user_name ||
                                      user.email?.split('@')[0] ||
                                      user.email ||
                                      'User';

              setUser({
                id: user.id,
                email: user.email || '',
                name: implicitUsername,
                subscription: 'free',
                createdAt: user.created_at,
              });
              router.push('/');
              return;
            }
          }

          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An error occurred during login');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handleCallback();
  }, [router, setUser]);

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <p style={{ color: '#ff6b6b', marginBottom: '8px' }}>Login failed</p>
            <p style={{ color: '#a0a0b0', fontSize: '14px' }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #1a1a24',
              borderTopColor: '#00f5d4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#a0a0b0' }}>Completing login...</p>
          </>
        )}
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
