'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input } from '@gto/ui';
import { useSupabaseAuth } from '@/hooks';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithOAuth, isLoading: authLoading, error: authError } = useSupabaseAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // OAuth login
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('');
    try {
      const result = await loginWithOAuth(provider);
      if (!result.success) {
        setError(result.error || 'OAuth login failed');
      }
    } catch (err) {
      setError('OAuth login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password);

      if (result.success) {
        setSuccess(result.message || 'Registration successful! Please check your email to confirm your account.');
        // Don't redirect immediately - let user see the confirmation message
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;
  const isProcessing = loading || authLoading;

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <Card variant="outlined" padding="lg" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
          }}>
            Create Account
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
            Start your journey to GTO mastery
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              fullWidth
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              fullWidth
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              fullWidth
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              fullWidth
            />

            {displayError && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid #ff6b6b',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
              }}>
                {displayError}
              </div>
            )}

            {success && (
              <div style={{
                padding: '12px',
                background: 'rgba(78, 205, 196, 0.1)',
                border: '1px solid #4ecdc4',
                borderRadius: '8px',
                color: '#4ecdc4',
                fontSize: '14px',
              }}>
                {success}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isProcessing}
            >
              Create Account
            </Button>

            <div style={{
              textAlign: 'center',
              color: '#6b6b7b',
              fontSize: '14px',
            }}>
              or continue with
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => handleOAuthLogin('google')}
                disabled={isProcessing}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => handleOAuthLogin('github')}
                disabled={isProcessing}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#a0a0b0',
        }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#00f5d4', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#1a1a24',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6b6b7b',
          textAlign: 'center',
        }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </Card>
    </div>
  );
}
