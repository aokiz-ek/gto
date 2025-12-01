'use client';

import { useMembership } from '@/hooks';
import { MEMBERSHIP_FEATURES } from '@/config/membership';
import './UsageLimitIndicator.css';

interface UsageLimitIndicatorProps {
  /** The feature ID to show usage for */
  featureId: string;
  /** Current usage count */
  currentUsage: number;
  /** Optional: Show compact version */
  compact?: boolean;
  /** Optional: Show upgrade link when limit is low */
  showUpgradeLink?: boolean;
  /** Optional: Threshold percentage to show warning (default: 80) */
  warningThreshold?: number;
}

/**
 * UsageLimitIndicator - Shows usage progress for limit-based features
 *
 * Usage:
 * ```tsx
 * <UsageLimitIndicator
 *   featureId="practice_daily"
 *   currentUsage={7}
 * />
 *
 * // Compact version for header/toolbar
 * <UsageLimitIndicator
 *   featureId="analysis_daily"
 *   currentUsage={2}
 *   compact
 * />
 * ```
 */
export default function UsageLimitIndicator({
  featureId,
  currentUsage,
  compact = false,
  showUpgradeLink = true,
  warningThreshold = 80,
}: UsageLimitIndicatorProps) {
  const { getLimit, canUpgrade } = useMembership();

  const limit = getLimit(featureId);
  const feature = MEMBERSHIP_FEATURES.find(f => f.id === featureId);

  // Don't show if unlimited
  if (limit === null || limit === Infinity) {
    return null;
  }

  const remaining = Math.max(0, limit - currentUsage);
  const percentage = Math.min(100, (currentUsage / limit) * 100);
  const isWarning = percentage >= warningThreshold;
  const isExhausted = remaining === 0;

  if (compact) {
    return (
      <div className={`usage-indicator-compact ${isExhausted ? 'exhausted' : isWarning ? 'warning' : ''}`}>
        <span className="usage-count">
          {remaining}/{limit}
        </span>
        {isExhausted && canUpgrade && showUpgradeLink && (
          <a href="/pricing" className="usage-upgrade-link">升级</a>
        )}
      </div>
    );
  }

  return (
    <div className={`usage-indicator ${isExhausted ? 'exhausted' : isWarning ? 'warning' : ''}`}>
      <div className="usage-header">
        <span className="usage-label">
          {feature?.nameCn || featureId}
        </span>
        <span className="usage-text">
          {remaining} / {limit} 剩余
        </span>
      </div>

      <div className="usage-bar-container">
        <div
          className="usage-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isExhausted && canUpgrade && showUpgradeLink && (
        <div className="usage-exhausted-message">
          <span>今日次数已用完</span>
          <a href="/pricing" className="usage-upgrade-btn">
            升级解锁更多
          </a>
        </div>
      )}

      {isWarning && !isExhausted && canUpgrade && showUpgradeLink && (
        <div className="usage-warning-message">
          <span>即将用完</span>
          <a href="/pricing" className="usage-upgrade-link">
            升级获取无限次数
          </a>
        </div>
      )}
    </div>
  );
}
