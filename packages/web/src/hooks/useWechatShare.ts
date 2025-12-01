'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  isWechatBrowser,
  initWechat,
  configureShare,
  universalShare,
  shareContents,
} from '@/lib/wechat';

interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

interface UseWechatShareOptions {
  // Auto-configure share when component mounts
  autoConfig?: boolean;
  // Default share data
  defaultData?: Partial<ShareData>;
}

interface UseWechatShareReturn {
  // Whether running in WeChat browser
  isWeChat: boolean;
  // Whether JSSDK is ready
  isReady: boolean;
  // Any error that occurred
  error: string | null;
  // Configure share content
  configureShareContent: (data: Partial<ShareData>) => void;
  // Trigger share (uses Web Share API on non-WeChat)
  share: (data: Partial<ShareData>) => Promise<void>;
  // Pre-built share content generators
  shareContents: typeof shareContents;
}

export function useWechatShare(options: UseWechatShareOptions = {}): UseWechatShareReturn {
  const { autoConfig = true, defaultData } = options;
  const [isWeChat, setIsWeChat] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if in WeChat browser
  useEffect(() => {
    setIsWeChat(isWechatBrowser());
  }, []);

  // Initialize WeChat JSSDK
  useEffect(() => {
    if (!isWeChat) return;

    const initSDK = async () => {
      try {
        // In production, you would fetch the signature from your backend
        // For now, we'll skip initialization if signature endpoint doesn't exist
        const response = await fetch('/api/wechat/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: window.location.href }),
        });

        if (!response.ok) {
          // Signature endpoint not available, but that's okay
          console.log('WeChat signature endpoint not available');
          return;
        }

        const signature = await response.json();
        await initWechat(signature);
        setIsReady(true);

        // Auto-configure share if option enabled
        if (autoConfig && defaultData) {
          configureShare(defaultData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to init WeChat SDK';
        setError(message);
        console.error('WeChat init error:', message);
      }
    };

    initSDK();
  }, [isWeChat, autoConfig, defaultData]);

  // Configure share content
  const configureShareContent = useCallback((data: Partial<ShareData>) => {
    if (isReady) {
      configureShare(data);
    }
  }, [isReady]);

  // Universal share function
  const share = useCallback(async (data: Partial<ShareData>) => {
    await universalShare(data);
  }, []);

  return {
    isWeChat,
    isReady,
    error,
    configureShareContent,
    share,
    shareContents,
  };
}

export default useWechatShare;
