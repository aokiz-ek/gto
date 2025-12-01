'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks';
import InstallPrompt from './InstallPrompt';
import './UpdateBanner.css';

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const { isOffline, updateAvailable, updateServiceWorker } = useServiceWorker();

  // Show offline indicator
  useEffect(() => {
    if (isOffline) {
      console.log('[PWA] App is offline');
    }
  }, [isOffline]);

  return (
    <>
      {children}

      {/* Update available banner */}
      {updateAvailable && (
        <div className="update-banner">
          <div className="update-banner-content">
            <span>有新版本可用</span>
            <button onClick={updateServiceWorker}>更新</button>
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {isOffline && (
        <div className="offline-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span>离线模式</span>
        </div>
      )}

      {/* Install prompt */}
      <InstallPrompt />
    </>
  );
}
