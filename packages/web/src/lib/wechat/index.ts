/**
 * WeChat JSSDK Integration for Sharing
 *
 * This module provides WeChat sharing functionality for:
 * - 分享给朋友 (Share to Friends)
 * - 分享到朋友圈 (Share to Moments)
 * - 分享到QQ (Share to QQ)
 *
 * Usage:
 * 1. Call initWechat() on page load with signature from backend
 * 2. Call shareToFriend() or shareToMoments() with share content
 */

declare global {
  interface Window {
    wx?: WechatJSSDK;
  }
}

interface WechatJSSDK {
  config: (options: WxConfigOptions) => void;
  ready: (callback: () => void) => void;
  error: (callback: (res: { errMsg: string }) => void) => void;
  checkJsApi: (options: { jsApiList: string[]; success: (res: { checkResult: Record<string, boolean> }) => void }) => void;
  updateAppMessageShareData: (options: ShareData & { success?: () => void; fail?: (err: unknown) => void }) => void;
  updateTimelineShareData: (options: ShareData & { success?: () => void; fail?: (err: unknown) => void }) => void;
  onMenuShareAppMessage: (options: ShareData & { success?: () => void; cancel?: () => void }) => void;
  onMenuShareTimeline: (options: Omit<ShareData, 'desc'> & { success?: () => void; cancel?: () => void }) => void;
  onMenuShareQQ: (options: ShareData & { success?: () => void; cancel?: () => void }) => void;
}

interface WxConfigOptions {
  debug?: boolean;
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
  jsApiList: string[];
}

interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

interface WxSignature {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

// Check if running in WeChat browser
export function isWechatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

// Check if running in WeChat Mini Program WebView
export function isWechatMiniProgram(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('miniprogram') || (window as unknown as { __wxjs_environment?: string }).__wxjs_environment === 'miniprogram';
}

// Load WeChat JSSDK script
export function loadWechatSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is undefined'));
      return;
    }

    if (window.wx) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load WeChat JSSDK'));
    document.head.appendChild(script);
  });
}

// Initialize WeChat JSSDK with signature
export async function initWechat(signature: WxSignature): Promise<void> {
  if (!isWechatBrowser()) {
    console.log('Not in WeChat browser, skipping JSSDK init');
    return;
  }

  await loadWechatSDK();

  return new Promise((resolve, reject) => {
    if (!window.wx) {
      reject(new Error('WeChat SDK not loaded'));
      return;
    }

    window.wx.config({
      debug: process.env.NODE_ENV === 'development',
      appId: signature.appId,
      timestamp: signature.timestamp,
      nonceStr: signature.nonceStr,
      signature: signature.signature,
      jsApiList: [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareAppMessage',
        'onMenuShareTimeline',
        'onMenuShareQQ',
      ],
    });

    window.wx.ready(() => {
      console.log('WeChat JSSDK ready');
      resolve();
    });

    window.wx.error((res) => {
      console.error('WeChat JSSDK error:', res.errMsg);
      reject(new Error(res.errMsg));
    });
  });
}

// Default share content
const defaultShareContent: ShareData = {
  title: 'Aokiz GTO - 专业德州扑克GTO训练',
  desc: '提升你的扑克技术，成为GTO高手！每日挑战、PK对战、30天训练计划',
  link: typeof window !== 'undefined' ? window.location.href : '',
  imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-icon.png` : '',
};

// Share to Friend
export function shareToFriend(data?: Partial<ShareData>): void {
  if (!window.wx) {
    console.warn('WeChat SDK not initialized');
    return;
  }

  const shareData: ShareData = {
    ...defaultShareContent,
    link: window.location.href,
    ...data,
  };

  // New API (wx 1.4.0+)
  window.wx.updateAppMessageShareData({
    ...shareData,
    success: () => console.log('Share to friend configured'),
  });

  // Legacy API fallback
  window.wx.onMenuShareAppMessage({
    ...shareData,
    success: () => console.log('Shared to friend'),
  });
}

// Share to Moments (Timeline)
export function shareToMoments(data?: Partial<Omit<ShareData, 'desc'>>): void {
  if (!window.wx) {
    console.warn('WeChat SDK not initialized');
    return;
  }

  const shareData = {
    title: data?.title || defaultShareContent.title,
    link: data?.link || window.location.href,
    imgUrl: data?.imgUrl || defaultShareContent.imgUrl,
  };

  // New API (wx 1.4.0+)
  window.wx.updateTimelineShareData({
    ...shareData,
    desc: '', // Timeline doesn't show desc
    success: () => console.log('Share to timeline configured'),
  });

  // Legacy API fallback
  window.wx.onMenuShareTimeline({
    ...shareData,
    success: () => console.log('Shared to timeline'),
  });
}

// Share to QQ
export function shareToQQ(data?: Partial<ShareData>): void {
  if (!window.wx) {
    console.warn('WeChat SDK not initialized');
    return;
  }

  const shareData: ShareData = {
    ...defaultShareContent,
    link: window.location.href,
    ...data,
  };

  window.wx.onMenuShareQQ({
    ...shareData,
    success: () => console.log('Shared to QQ'),
  });
}

// Configure all share channels at once
export function configureShare(data?: Partial<ShareData>): void {
  shareToFriend(data);
  shareToMoments(data);
  shareToQQ(data);
}

// Share content generators for different pages
export const shareContents = {
  // Home page share
  home: (): ShareData => ({
    title: 'Aokiz GTO - 专业德州扑克GTO训练',
    desc: '提升你的扑克技术，掌握GTO策略！',
    link: typeof window !== 'undefined' ? window.location.origin : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-icon.png` : '',
  }),

  // Daily challenge share
  dailyChallenge: (score: number, accuracy: number): ShareData => ({
    title: `我在Aokiz GTO完成了每日挑战！`,
    desc: `得分: ${score} | 正确率: ${accuracy}%，来挑战我吧！`,
    link: typeof window !== 'undefined' ? `${window.location.origin}/challenge` : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-challenge.png` : '',
  }),

  // 7-day challenge share
  sevenDayChallenge: (day: number, score: number): ShareData => ({
    title: `我完成了7天挑战第${day}天！`,
    desc: `得分: ${score}，连续挑战提升GTO水平！`,
    link: typeof window !== 'undefined' ? `${window.location.origin}/challenge/seven-day` : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-7day.png` : '',
  }),

  // 30-day training share
  trainingPlan: (day: number, weekTheme: string): ShareData => ({
    title: `我在进行30天GTO训练计划！`,
    desc: `第${day}天: ${weekTheme}，系统提升扑克技术！`,
    link: typeof window !== 'undefined' ? `${window.location.origin}/training` : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-training.png` : '',
  }),

  // PK battle result share
  pkResult: (won: boolean, score: number, opponentScore: number): ShareData => ({
    title: won ? `我在GTO对战中获胜！` : `GTO对战结束`,
    desc: `比分 ${score}:${opponentScore}，来和我PK吧！`,
    link: typeof window !== 'undefined' ? `${window.location.origin}/pk` : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-pk.png` : '',
  }),

  // Practice session share
  practiceResult: (correct: number, total: number): ShareData => ({
    title: `GTO练习完成！`,
    desc: `正确 ${correct}/${total} 题，持续练习提升水平！`,
    link: typeof window !== 'undefined' ? `${window.location.origin}/practice` : '',
    imgUrl: typeof window !== 'undefined' ? `${window.location.origin}/share-practice.png` : '',
  }),
};

// Web Share API fallback for non-WeChat browsers
export async function webShare(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }
  return false;
}

// Universal share function that works in both WeChat and regular browsers
export async function universalShare(data: Partial<ShareData>): Promise<void> {
  if (isWechatBrowser()) {
    configureShare(data);
  } else {
    // Try Web Share API
    const shared = await webShare({
      title: data.title || defaultShareContent.title,
      text: data.desc || defaultShareContent.desc,
      url: data.link || window.location.href,
    });

    if (!shared) {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(data.link || window.location.href);
        console.log('Link copied to clipboard');
      } catch {
        console.warn('Could not copy link');
      }
    }
  }
}
