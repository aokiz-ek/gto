// 会员等级配置

export type MembershipTier = 'free' | 'pro' | 'premium';

export interface MembershipFeature {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  free: boolean | number | string;
  pro: boolean | number | string;
  premium: boolean | number | string;
}

export interface MembershipPlan {
  id: MembershipTier;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  price: {
    monthly: number;
    yearly: number;
    monthlyOriginal?: number;
    yearlyOriginal?: number;
  };
  badge?: string;
  popular?: boolean;
}

// 会员等级定义
export const MEMBERSHIP_PLANS: Record<MembershipTier, MembershipPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    nameCn: '免费版',
    description: 'Basic features for casual players',
    descriptionCn: '适合休闲玩家的基础功能',
    price: {
      monthly: 0,
      yearly: 0,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameCn: '专业版',
    description: 'Advanced features for serious players',
    descriptionCn: '适合认真学习的进阶玩家',
    price: {
      monthly: 68,
      yearly: 648,
      monthlyOriginal: 88,
      yearlyOriginal: 816,
    },
    badge: '最受欢迎',
    popular: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameCn: '旗舰版',
    description: 'Full access for professional players',
    descriptionCn: '适合职业玩家的完整功能',
    price: {
      monthly: 168,
      yearly: 1588,
      monthlyOriginal: 198,
      yearlyOriginal: 1980,
    },
    badge: '最超值',
  },
};

// 功能权益列表
export const MEMBERSHIP_FEATURES: MembershipFeature[] = [
  // 范围查看
  {
    id: 'preflop_ranges',
    name: 'Preflop Ranges',
    nameCn: '翻牌前范围',
    description: 'View preflop opening ranges',
    descriptionCn: '查看翻牌前开牌范围',
    free: true,
    pro: true,
    premium: true,
  },
  {
    id: 'advanced_ranges',
    name: 'Advanced Ranges',
    nameCn: '高级范围',
    description: '3-bet, 4-bet, squeeze ranges',
    descriptionCn: '3-bet、4-bet、挤压范围',
    free: false,
    pro: true,
    premium: true,
  },
  {
    id: 'postflop_ranges',
    name: 'Postflop Ranges',
    nameCn: '翻牌后范围',
    description: 'Flop, turn, river strategies',
    descriptionCn: '翻牌、转牌、河牌策略',
    free: false,
    pro: true,
    premium: true,
  },
  // 练习功能
  {
    id: 'daily_practice',
    name: 'Daily Practice',
    nameCn: '每日练习',
    description: 'Practice sessions per day',
    descriptionCn: '每日练习次数',
    free: 10,
    pro: '无限',
    premium: '无限',
  },
  {
    id: 'challenge_mode',
    name: 'Challenge Mode',
    nameCn: '挑战模式',
    description: '7-day and 30-day challenges',
    descriptionCn: '7天和30天挑战',
    free: '7天挑战',
    pro: '全部挑战',
    premium: '全部挑战',
  },
  {
    id: 'pk_battles',
    name: 'PK Battles',
    nameCn: 'PK对战',
    description: 'Real-time battles with other players',
    descriptionCn: '与其他玩家实时对战',
    free: '3次/天',
    pro: '无限',
    premium: '无限',
  },
  // AI功能
  {
    id: 'hand_analysis',
    name: 'Hand Analysis',
    nameCn: '手牌分析',
    description: 'AI-powered hand analysis per day',
    descriptionCn: 'AI手牌分析次数',
    free: 3,
    pro: 50,
    premium: '无限',
  },
  {
    id: 'ev_calculator',
    name: 'EV Calculator',
    nameCn: 'EV计算器',
    description: 'Expected value calculations',
    descriptionCn: '期望值计算',
    free: false,
    pro: true,
    premium: true,
  },
  {
    id: 'weakness_report',
    name: 'Weakness Report',
    nameCn: '弱点报告',
    description: 'Personalized weakness analysis',
    descriptionCn: '个性化弱点分析',
    free: false,
    pro: true,
    premium: true,
  },
  {
    id: 'ai_coaching',
    name: 'AI Coaching',
    nameCn: 'AI教练',
    description: 'Real-time AI coaching tips',
    descriptionCn: '实时AI教练建议',
    free: false,
    pro: '基础',
    premium: '高级',
  },
  // 学习内容
  {
    id: 'courses',
    name: 'Courses',
    nameCn: '课程',
    description: 'Access to GTO courses',
    descriptionCn: '访问GTO课程',
    free: '入门课程',
    pro: '全部课程',
    premium: '全部课程',
  },
  {
    id: 'community',
    name: 'Community',
    nameCn: '社区',
    description: 'Access to community features',
    descriptionCn: '访问社区功能',
    free: '只读',
    pro: '完整访问',
    premium: '完整访问',
  },
  {
    id: 'study_groups',
    name: 'Study Groups',
    nameCn: '学习小组',
    description: 'Join and create study groups',
    descriptionCn: '加入和创建学习小组',
    free: '加入',
    pro: '加入+创建',
    premium: '加入+创建+管理',
  },
  // 高级功能
  {
    id: 'custom_ranges',
    name: 'Custom Ranges',
    nameCn: '自定义范围',
    description: 'Create and save custom ranges',
    descriptionCn: '创建并保存自定义范围',
    free: false,
    pro: 5,
    premium: '无限',
  },
  {
    id: 'solver_access',
    name: 'Solver Access',
    nameCn: '求解器',
    description: 'Access to GTO solver',
    descriptionCn: '访问GTO求解器',
    free: false,
    pro: false,
    premium: true,
  },
  {
    id: 'api_access',
    name: 'API Access',
    nameCn: 'API访问',
    description: 'Developer API access',
    descriptionCn: '开发者API访问',
    free: false,
    pro: false,
    premium: true,
  },
  // 支持
  {
    id: 'support',
    name: 'Support',
    nameCn: '客服支持',
    description: 'Customer support level',
    descriptionCn: '客服支持级别',
    free: '社区',
    pro: '优先',
    premium: '专属1对1',
  },
];

// 功能分类
export const FEATURE_CATEGORIES = [
  {
    id: 'ranges',
    name: 'Range Viewer',
    nameCn: '范围查看',
    features: ['preflop_ranges', 'advanced_ranges', 'postflop_ranges'],
  },
  {
    id: 'practice',
    name: 'Practice',
    nameCn: '练习',
    features: ['daily_practice', 'challenge_mode', 'pk_battles'],
  },
  {
    id: 'ai',
    name: 'AI Features',
    nameCn: 'AI功能',
    features: ['hand_analysis', 'ev_calculator', 'weakness_report', 'ai_coaching'],
  },
  {
    id: 'learning',
    name: 'Learning',
    nameCn: '学习',
    features: ['courses', 'community', 'study_groups'],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    nameCn: '高级功能',
    features: ['custom_ranges', 'solver_access', 'api_access'],
  },
  {
    id: 'support',
    name: 'Support',
    nameCn: '支持',
    features: ['support'],
  },
];

// 获取功能值显示
export function getFeatureDisplay(value: boolean | number | string): {
  text: string;
  available: boolean;
} {
  if (typeof value === 'boolean') {
    return {
      text: value ? '✓' : '—',
      available: value,
    };
  }
  if (typeof value === 'number') {
    return {
      text: value.toString(),
      available: value > 0,
    };
  }
  return {
    text: value,
    available: true,
  };
}

// 检查用户是否有权限访问功能
export function hasFeatureAccess(
  featureId: string,
  userTier: MembershipTier
): boolean {
  const feature = MEMBERSHIP_FEATURES.find(f => f.id === featureId);
  if (!feature) return false;

  const value = feature[userTier];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return true;
}

// 获取功能限制数量
export function getFeatureLimit(
  featureId: string,
  userTier: MembershipTier
): number | null {
  const feature = MEMBERSHIP_FEATURES.find(f => f.id === featureId);
  if (!feature) return null;

  const value = feature[userTier];
  if (typeof value === 'number') return value;
  if (value === '无限' || value === 'unlimited') return Infinity;
  return null;
}

// 获取升级建议
export function getUpgradeRecommendation(
  currentTier: MembershipTier,
  blockedFeature: string
): MembershipTier | null {
  const feature = MEMBERSHIP_FEATURES.find(f => f.id === blockedFeature);
  if (!feature) return null;

  if (currentTier === 'free') {
    if (hasFeatureAccess(blockedFeature, 'pro')) return 'pro';
    if (hasFeatureAccess(blockedFeature, 'premium')) return 'premium';
  }
  if (currentTier === 'pro') {
    if (hasFeatureAccess(blockedFeature, 'premium')) return 'premium';
  }
  return null;
}
