/**
 * 用户行为分析系统
 * 事件追踪、转化漏斗、用户留存分析
 */

// ============ 类型定义 ============

export type EventCategory =
  | 'page_view'       // 页面浏览
  | 'user'            // 用户相关
  | 'practice'        // 练习模式
  | 'challenge'       // 挑战模式
  | 'pk'              // PK对战
  | 'learning'        // 学习课程
  | 'community'       // 社区互动
  | 'subscription'    // 订阅付费
  | 'feature'         // 功能使用
  | 'engagement';     // 用户参与

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  pageUrl: string;
  referrer?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'web' | 'h5' | 'miniprogram';
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  entryPage: string;
  referrer?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'web' | 'h5' | 'miniprogram';
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: {
    name: string;
    event: { category: EventCategory; action: string };
  }[];
}

export interface UserMetrics {
  totalSessions: number;
  totalPageViews: number;
  totalEvents: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  retentionDays: number[];
}

// ============ 会话管理 ============

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = 'gto_analytics_session';
const EVENTS_KEY = 'gto_analytics_events';
const MAX_STORED_EVENTS = 100;

let currentSession: UserSession | null = null;

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getPlatform(): 'web' | 'h5' | 'miniprogram' {
  if (typeof window === 'undefined') return 'web';

  // Check for miniprogram environment
  if (typeof (window as unknown as { wx?: unknown }).wx !== 'undefined') {
    return 'miniprogram';
  }

  // Check for mobile user agent
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    return 'h5';
  }

  return 'web';
}

function getOrCreateSession(userId?: string): UserSession {
  if (typeof window === 'undefined') {
    return {
      id: generateSessionId(),
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      entryPage: '',
      deviceType: 'desktop',
      platform: 'web',
    };
  }

  // Try to restore existing session
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const session = JSON.parse(stored) as UserSession;
      const now = Date.now();

      // Check if session is still valid
      if (now - session.lastActivity < SESSION_TIMEOUT) {
        session.lastActivity = now;
        session.userId = userId || session.userId;
        currentSession = session;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Create new session
  const newSession: UserSession = {
    id: generateSessionId(),
    userId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    pageViews: 0,
    events: 0,
    entryPage: window.location.pathname,
    referrer: document.referrer || undefined,
    deviceType: getDeviceType(),
    platform: getPlatform(),
  };

  currentSession = newSession;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession;
}

// ============ 事件存储 ============

function storeEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    let events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    events.push(event);

    // Keep only the most recent events
    if (events.length > MAX_STORED_EVENTS) {
      events = events.slice(-MAX_STORED_EVENTS);
    }

    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Storage might be full or unavailable
  }
}

function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============ 核心追踪函数 ============

/**
 * 初始化分析系统
 */
export function initAnalytics(userId?: string): void {
  getOrCreateSession(userId);

  // Track initial page view
  trackPageView();
}

/**
 * 设置用户ID
 */
export function setUserId(userId: string): void {
  const session = getOrCreateSession(userId);
  session.userId = userId;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * 追踪页面浏览
 */
export function trackPageView(pageName?: string): void {
  const session = getOrCreateSession();
  session.pageViews++;

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  trackEvent('page_view', 'view', pageName || (typeof window !== 'undefined' ? window.location.pathname : ''));
}

/**
 * 追踪事件
 */
export function trackEvent(
  category: EventCategory,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>
): void {
  const session = getOrCreateSession();
  session.events++;
  session.lastActivity = Date.now();

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  const event: AnalyticsEvent = {
    category,
    action,
    label,
    value,
    metadata,
    timestamp: Date.now(),
    sessionId: session.id,
    userId: session.userId,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    referrer: session.referrer,
    deviceType: session.deviceType,
    platform: session.platform,
  };

  storeEvent(event);

  // In production, send to analytics backend
  if (process.env.NODE_ENV === 'production') {
    sendToBackend(event);
  } else {
    // Log in development
    console.debug('[Analytics]', category, action, label, value);
  }
}

/**
 * 发送到后端（生产环境）
 */
async function sendToBackend(event: AnalyticsEvent): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail - analytics should not break the app
  }
}

// ============ 预定义事件 ============

export const Analytics = {
  // 用户事件
  user: {
    register: (method: string) => trackEvent('user', 'register', method),
    login: (method: string) => trackEvent('user', 'login', method),
    logout: () => trackEvent('user', 'logout'),
    updateProfile: () => trackEvent('user', 'update_profile'),
  },

  // 练习事件
  practice: {
    start: (mode: string) => trackEvent('practice', 'start', mode),
    complete: (mode: string, score: number) => trackEvent('practice', 'complete', mode, score),
    abandon: (mode: string, progress: number) => trackEvent('practice', 'abandon', mode, progress),
    decision: (isCorrect: boolean, handType: string) =>
      trackEvent('practice', 'decision', handType, isCorrect ? 1 : 0),
  },

  // 挑战事件
  challenge: {
    start: (type: string) => trackEvent('challenge', 'start', type),
    complete: (type: string, score: number) => trackEvent('challenge', 'complete', type, score),
    share: (type: string) => trackEvent('challenge', 'share', type),
  },

  // PK事件
  pk: {
    matchStart: () => trackEvent('pk', 'match_start'),
    matchFound: (waitTime: number) => trackEvent('pk', 'match_found', undefined, waitTime),
    gameComplete: (result: 'win' | 'lose' | 'draw', score: number) =>
      trackEvent('pk', 'game_complete', result, score),
    share: () => trackEvent('pk', 'share'),
  },

  // 学习事件
  learning: {
    courseView: (courseId: string) => trackEvent('learning', 'course_view', courseId),
    lessonStart: (lessonId: string) => trackEvent('learning', 'lesson_start', lessonId),
    lessonComplete: (lessonId: string, progress: number) =>
      trackEvent('learning', 'lesson_complete', lessonId, progress),
    quizAttempt: (quizId: string, score: number) =>
      trackEvent('learning', 'quiz_attempt', quizId, score),
  },

  // 社区事件
  community: {
    postView: (postId: string) => trackEvent('community', 'post_view', postId),
    postCreate: () => trackEvent('community', 'post_create'),
    comment: (postId: string) => trackEvent('community', 'comment', postId),
    like: (targetType: string, targetId: string) =>
      trackEvent('community', 'like', `${targetType}:${targetId}`),
    groupJoin: (groupId: string) => trackEvent('community', 'group_join', groupId),
  },

  // 订阅事件
  subscription: {
    viewPricing: () => trackEvent('subscription', 'view_pricing'),
    selectPlan: (plan: string, interval: string) =>
      trackEvent('subscription', 'select_plan', `${plan}_${interval}`),
    applyPromo: (code: string, success: boolean) =>
      trackEvent('subscription', 'apply_promo', code, success ? 1 : 0),
    checkoutStart: (plan: string, price: number) =>
      trackEvent('subscription', 'checkout_start', plan, price),
    checkoutComplete: (plan: string, price: number) =>
      trackEvent('subscription', 'checkout_complete', plan, price),
    checkoutAbandon: (plan: string, step: string) =>
      trackEvent('subscription', 'checkout_abandon', `${plan}:${step}`),
    cancel: (plan: string, reason?: string) =>
      trackEvent('subscription', 'cancel', plan, undefined, { reason }),
  },

  // 功能使用事件
  feature: {
    use: (featureName: string) => trackEvent('feature', 'use', featureName),
    upgrade_prompt: (featureName: string) => trackEvent('feature', 'upgrade_prompt', featureName),
    upgrade_click: (featureName: string) => trackEvent('feature', 'upgrade_click', featureName),
  },

  // 参与度事件
  engagement: {
    share: (contentType: string, method: string) =>
      trackEvent('engagement', 'share', `${contentType}:${method}`),
    invite: () => trackEvent('engagement', 'invite'),
    feedback: (type: string) => trackEvent('engagement', 'feedback', type),
    notification_click: (notificationType: string) =>
      trackEvent('engagement', 'notification_click', notificationType),
  },
};

// ============ 分析查询 ============

/**
 * 获取当前会话信息
 */
export function getCurrentSession(): UserSession | null {
  return currentSession;
}

/**
 * 获取存储的事件
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  return getStoredEvents();
}

/**
 * 获取事件统计
 */
export function getEventStats(): {
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  totalEvents: number;
} {
  const events = getStoredEvents();
  const byCategory: Record<string, number> = {};
  const byAction: Record<string, number> = {};

  events.forEach(event => {
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    const key = `${event.category}:${event.action}`;
    byAction[key] = (byAction[key] || 0) + 1;
  });

  return {
    byCategory,
    byAction,
    totalEvents: events.length,
  };
}

/**
 * 清除分析数据
 */
export function clearAnalyticsData(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(EVENTS_KEY);
  currentSession = null;
}

// ============ 转化漏斗 ============

export const CONVERSION_FUNNELS: ConversionFunnel[] = [
  {
    id: 'registration_to_subscription',
    name: '注册到订阅',
    steps: [
      { name: '注册', event: { category: 'user', action: 'register' } },
      { name: '完成首次练习', event: { category: 'practice', action: 'complete' } },
      { name: '查看定价', event: { category: 'subscription', action: 'view_pricing' } },
      { name: '选择套餐', event: { category: 'subscription', action: 'select_plan' } },
      { name: '完成支付', event: { category: 'subscription', action: 'checkout_complete' } },
    ],
  },
  {
    id: 'free_to_paid',
    name: '免费到付费',
    steps: [
      { name: '使用免费功能', event: { category: 'feature', action: 'use' } },
      { name: '触发升级提示', event: { category: 'feature', action: 'upgrade_prompt' } },
      { name: '点击升级', event: { category: 'feature', action: 'upgrade_click' } },
      { name: '完成支付', event: { category: 'subscription', action: 'checkout_complete' } },
    ],
  },
  {
    id: 'practice_engagement',
    name: '练习参与度',
    steps: [
      { name: '开始练习', event: { category: 'practice', action: 'start' } },
      { name: '完成练习', event: { category: 'practice', action: 'complete' } },
      { name: '分享成绩', event: { category: 'challenge', action: 'share' } },
    ],
  },
];

/**
 * 计算漏斗转化率
 */
export function calculateFunnelConversion(funnelId: string): {
  steps: { name: string; count: number; rate: number }[];
  overallRate: number;
} | null {
  const funnel = CONVERSION_FUNNELS.find(f => f.id === funnelId);
  if (!funnel) return null;

  const events = getStoredEvents();
  const steps: { name: string; count: number; rate: number }[] = [];
  let previousCount = 0;

  funnel.steps.forEach((step, index) => {
    const count = events.filter(
      e => e.category === step.event.category && e.action === step.event.action
    ).length;

    const rate = index === 0
      ? 100
      : previousCount > 0
        ? (count / previousCount) * 100
        : 0;

    steps.push({
      name: step.name,
      count,
      rate: Math.round(rate * 10) / 10,
    });

    previousCount = count;
  });

  const overallRate = steps.length > 0 && steps[0].count > 0
    ? (steps[steps.length - 1].count / steps[0].count) * 100
    : 0;

  return {
    steps,
    overallRate: Math.round(overallRate * 10) / 10,
  };
}
