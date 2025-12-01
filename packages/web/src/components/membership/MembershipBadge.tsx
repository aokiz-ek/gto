'use client';

import { MembershipTier, MEMBERSHIP_PLANS } from '@/config/membership';
import './MembershipBadge.css';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function MembershipBadge({ tier, size = 'md', showName = true }: MembershipBadgeProps) {
  const plan = MEMBERSHIP_PLANS[tier];

  return (
    <span className={`membership-badge tier-${tier} size-${size}`}>
      <span className="badge-icon">
        {tier === 'free' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
        {tier === 'pro' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
        {tier === 'premium' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 4l3 12h14l3-12-6 6-4-8-4 8-6-6zm3 14h14v2H5v-2z" />
          </svg>
        )}
      </span>
      {showName && <span className="badge-name">{plan.nameCn}</span>}
    </span>
  );
}
