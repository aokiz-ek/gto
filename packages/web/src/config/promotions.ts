/**
 * 优惠活动系统配置
 * 包含优惠码、活动、邀请奖励等配置
 */

import { MembershipTier } from './membership';

// ============ 类型定义 ============

export type PromotionType =
  | 'percentage_discount'  // 百分比折扣
  | 'fixed_discount'       // 固定金额折扣
  | 'free_trial'           // 免费试用天数
  | 'free_upgrade'         // 免费升级
  | 'bonus_days';          // 赠送天数

export type PromoCodeStatus = 'active' | 'expired' | 'used' | 'invalid';

export interface PromoCode {
  code: string;
  type: PromotionType;
  value: number;  // 折扣百分比/金额/天数
  description: string;
  descriptionCn: string;
  minPurchase?: number;  // 最低消费 (元)
  applicableTiers?: MembershipTier[];  // 适用会员等级
  applicableIntervals?: ('monthly' | 'yearly')[];  // 适用付费周期
  maxUses?: number;  // 最大使用次数
  usedCount: number;
  startDate: string;
  endDate: string;
  isFirstPurchaseOnly?: boolean;  // 仅限首次购买
  isStackable?: boolean;  // 是否可叠加
}

export interface Campaign {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  type: 'seasonal' | 'holiday' | 'special' | 'flash_sale' | 'anniversary';
  discount: {
    type: PromotionType;
    value: number;
  };
  applicableTiers: MembershipTier[];
  startDate: string;
  endDate: string;
  banner?: {
    imageUrl: string;
    linkUrl: string;
  };
  isActive: boolean;
  priority: number;  // 展示优先级
}

export interface ReferralConfig {
  referrerReward: {
    type: PromotionType;
    value: number;
    description: string;
    descriptionCn: string;
  };
  refereeReward: {
    type: PromotionType;
    value: number;
    description: string;
    descriptionCn: string;
  };
  maxReferrals?: number;  // 每人最多邀请人数
  minPurchaseRequired: boolean;  // 被邀请人是否需要付费
  requireTier?: MembershipTier;  // 被邀请人需要购买的最低等级
}

export interface UserReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;  // 付费转化
  pendingRewards: number;
  claimedRewards: number;
  referralHistory: {
    refereeId: string;
    refereeName: string;
    date: string;
    status: 'pending' | 'converted' | 'expired';
    reward?: number;
  }[];
}

// ============ 预设优惠码 ============

export const PROMO_CODES: Record<string, PromoCode> = {
  // 新用户首月优惠
  WELCOME50: {
    code: 'WELCOME50',
    type: 'percentage_discount',
    value: 50,
    description: '50% off first month for new users',
    descriptionCn: '新用户首月5折',
    applicableTiers: ['pro', 'premium'],
    applicableIntervals: ['monthly'],
    maxUses: 10000,
    usedCount: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isFirstPurchaseOnly: true,
    isStackable: false,
  },

  // 年付优惠
  YEARLY20: {
    code: 'YEARLY20',
    type: 'percentage_discount',
    value: 20,
    description: '20% off yearly subscription',
    descriptionCn: '年付额外8折',
    applicableTiers: ['pro', 'premium'],
    applicableIntervals: ['yearly'],
    maxUses: 5000,
    usedCount: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isFirstPurchaseOnly: false,
    isStackable: false,
  },

  // 春节特惠
  SPRING2025: {
    code: 'SPRING2025',
    type: 'percentage_discount',
    value: 30,
    description: 'Spring Festival 30% off',
    descriptionCn: '春节特惠7折',
    applicableTiers: ['pro', 'premium'],
    maxUses: 2000,
    usedCount: 0,
    startDate: '2025-01-20',
    endDate: '2025-02-10',
    isFirstPurchaseOnly: false,
    isStackable: false,
  },

  // 免费试用延长
  TRIAL7: {
    code: 'TRIAL7',
    type: 'free_trial',
    value: 7,
    description: '7 extra days of free trial',
    descriptionCn: '额外7天免费试用',
    applicableTiers: ['pro', 'premium'],
    maxUses: 20000,
    usedCount: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isFirstPurchaseOnly: true,
    isStackable: true,
  },

  // VIP用户专属
  VIPBONUS: {
    code: 'VIPBONUS',
    type: 'bonus_days',
    value: 30,
    description: '30 bonus days for VIP users',
    descriptionCn: 'VIP用户专属赠送30天',
    applicableTiers: ['premium'],
    maxUses: 500,
    usedCount: 0,
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    isFirstPurchaseOnly: false,
    isStackable: false,
  },
};

// ============ 活动配置 ============

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'new_year_2025',
    name: 'New Year Sale 2025',
    nameCn: '2025新年特惠',
    description: 'Start the new year with GTO mastery',
    descriptionCn: '新年新开始，GTO训练大促',
    type: 'holiday',
    discount: {
      type: 'percentage_discount',
      value: 25,
    },
    applicableTiers: ['pro', 'premium'],
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    banner: {
      imageUrl: '/images/campaigns/new-year-2025.png',
      linkUrl: '/pricing?campaign=new_year_2025',
    },
    isActive: true,
    priority: 10,
  },
  {
    id: 'spring_festival_2025',
    name: 'Spring Festival Sale',
    nameCn: '春节钜惠',
    description: 'Celebrate Chinese New Year with special offers',
    descriptionCn: '龙年大吉，GTO特训优惠来袭',
    type: 'holiday',
    discount: {
      type: 'percentage_discount',
      value: 30,
    },
    applicableTiers: ['pro', 'premium'],
    startDate: '2025-01-20',
    endDate: '2025-02-10',
    banner: {
      imageUrl: '/images/campaigns/spring-2025.png',
      linkUrl: '/pricing?campaign=spring_festival_2025',
    },
    isActive: false,
    priority: 20,
  },
  {
    id: 'flash_sale_weekly',
    name: 'Weekly Flash Sale',
    nameCn: '每周限时秒杀',
    description: 'Limited time offer every week',
    descriptionCn: '每周三限时特惠，先到先得',
    type: 'flash_sale',
    discount: {
      type: 'percentage_discount',
      value: 40,
    },
    applicableTiers: ['pro'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isActive: true,
    priority: 5,
  },
];

// ============ 邀请奖励配置 ============

export const REFERRAL_CONFIG: ReferralConfig = {
  referrerReward: {
    type: 'bonus_days',
    value: 7,
    description: 'Get 7 bonus days for each successful referral',
    descriptionCn: '每成功邀请1人，获得7天会员',
  },
  refereeReward: {
    type: 'percentage_discount',
    value: 20,
    description: 'Get 20% off on first purchase',
    descriptionCn: '首次购买享8折优惠',
  },
  maxReferrals: 50,
  minPurchaseRequired: true,
  requireTier: 'pro',
};

// ============ 工具函数 ============

/**
 * 验证优惠码
 */
export function validatePromoCode(
  code: string,
  tier: MembershipTier,
  interval: 'monthly' | 'yearly',
  isFirstPurchase: boolean
): { valid: boolean; error?: string; promoCode?: PromoCode } {
  const promoCode = PROMO_CODES[code.toUpperCase()];

  if (!promoCode) {
    return { valid: false, error: '优惠码不存在' };
  }

  const now = new Date();
  const startDate = new Date(promoCode.startDate);
  const endDate = new Date(promoCode.endDate);

  if (now < startDate || now > endDate) {
    return { valid: false, error: '优惠码已过期' };
  }

  if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, error: '优惠码已达使用上限' };
  }

  if (promoCode.applicableTiers && !promoCode.applicableTiers.includes(tier)) {
    return { valid: false, error: '优惠码不适用于此会员等级' };
  }

  if (promoCode.applicableIntervals && !promoCode.applicableIntervals.includes(interval)) {
    return { valid: false, error: `优惠码仅适用于${interval === 'monthly' ? '月付' : '年付'}` };
  }

  if (promoCode.isFirstPurchaseOnly && !isFirstPurchase) {
    return { valid: false, error: '优惠码仅限首次购买使用' };
  }

  return { valid: true, promoCode };
}

/**
 * 计算折扣后价格
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  promoCode: PromoCode
): { finalPrice: number; savings: number; description: string } {
  let finalPrice = originalPrice;
  let description = '';

  switch (promoCode.type) {
    case 'percentage_discount':
      finalPrice = originalPrice * (1 - promoCode.value / 100);
      description = `${promoCode.value}% 折扣`;
      break;
    case 'fixed_discount':
      finalPrice = Math.max(0, originalPrice - promoCode.value);
      description = `减 ¥${promoCode.value}`;
      break;
    case 'free_trial':
      description = `免费试用 ${promoCode.value} 天`;
      break;
    case 'bonus_days':
      description = `赠送 ${promoCode.value} 天`;
      break;
    default:
      break;
  }

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    savings: Math.round((originalPrice - finalPrice) * 100) / 100,
    description,
  };
}

/**
 * 获取当前有效活动
 */
export function getActiveCampaigns(): Campaign[] {
  const now = new Date();

  return CAMPAIGNS
    .filter(campaign => {
      if (!campaign.isActive) return false;
      const startDate = new Date(campaign.startDate);
      const endDate = new Date(campaign.endDate);
      return now >= startDate && now <= endDate;
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * 获取活动折扣
 */
export function getCampaignDiscount(
  campaignId: string,
  tier: MembershipTier
): { discount: number; type: PromotionType } | null {
  const campaign = CAMPAIGNS.find(c => c.id === campaignId);

  if (!campaign || !campaign.applicableTiers.includes(tier)) {
    return null;
  }

  return {
    discount: campaign.discount.value,
    type: campaign.discount.type,
  };
}

/**
 * 生成邀请码
 */
export function generateReferralCode(userId: string): string {
  const prefix = 'GTO';
  const hash = userId.slice(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`;
}

/**
 * 计算邀请奖励
 */
export function calculateReferralRewards(
  stats: UserReferralStats
): { totalDays: number; pendingDays: number; description: string } {
  const config = REFERRAL_CONFIG;
  const successfulCount = stats.successfulReferrals;

  if (config.referrerReward.type === 'bonus_days') {
    const totalDays = successfulCount * config.referrerReward.value;
    const pendingDays = stats.pendingRewards;

    return {
      totalDays,
      pendingDays,
      description: `已获得 ${totalDays} 天会员奖励`,
    };
  }

  return {
    totalDays: 0,
    pendingDays: 0,
    description: '',
  };
}

/**
 * 格式化倒计时
 */
export function formatCountdown(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return '已结束';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}
