'use client';

import { useAuthListener } from '@/hooks';
import { ToastProvider } from './Toast';
import { BottomNav, BottomNavSpacer } from './BottomNav';
import { PWAProvider } from './pwa';
import { PageErrorBoundary } from './ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize auth state listener
  useAuthListener();

  return (
    <ToastProvider>
      <PWAProvider>
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
        <BottomNavSpacer />
        <BottomNav />
      </PWAProvider>
    </ToastProvider>
  );
}
