'use client';

import { useCallback, useMemo } from 'react';
import { useUserStore } from '@/store';
import {
  MembershipTier,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_FEATURES,
  hasFeatureAccess,
  getFeatureLimit,
  getUpgradeRecommendation,
} from '@/config/membership';

interface UseMembershipReturn {
  tier: MembershipTier;
  plan: typeof MEMBERSHIP_PLANS[MembershipTier];
  isFreeTier: boolean;
  isProTier: boolean;
  isPremiumTier: boolean;
  hasAccess: (featureId: string) => boolean;
  getLimit: (featureId: string) => number | null;
  checkLimit: (featureId: string, currentUsage: number) => { allowed: boolean; remaining: number | null };
  getUpgradeTier: (featureId: string) => MembershipTier | null;
  canUpgrade: boolean;
}

export function useMembership(): UseMembershipReturn {
  const { user } = useUserStore();

  const tier: MembershipTier = useMemo(() => {
    if (!user) return 'free';
    const subscription = user.subscription as MembershipTier;
    if (subscription in MEMBERSHIP_PLANS) return subscription;
    return 'free';
  }, [user]);

  const plan = MEMBERSHIP_PLANS[tier];

  const isFreeTier = tier === 'free';
  const isProTier = tier === 'pro';
  const isPremiumTier = tier === 'premium';

  const hasAccess = useCallback(
    (featureId: string) => hasFeatureAccess(featureId, tier),
    [tier]
  );

  const getLimit = useCallback(
    (featureId: string) => getFeatureLimit(featureId, tier),
    [tier]
  );

  const checkLimit = useCallback(
    (featureId: string, currentUsage: number) => {
      const limit = getFeatureLimit(featureId, tier);
      if (limit === null) {
        return { allowed: true, remaining: null };
      }
      if (limit === Infinity) {
        return { allowed: true, remaining: Infinity };
      }
      const remaining = limit - currentUsage;
      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
      };
    },
    [tier]
  );

  const getUpgradeTier = useCallback(
    (featureId: string) => getUpgradeRecommendation(tier, featureId),
    [tier]
  );

  const canUpgrade = tier !== 'premium';

  return {
    tier,
    plan,
    isFreeTier,
    isProTier,
    isPremiumTier,
    hasAccess,
    getLimit,
    checkLimit,
    getUpgradeTier,
    canUpgrade,
  };
}

export default useMembership;
