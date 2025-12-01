'use client';

import { useState, ReactNode } from 'react';
import { useMembership } from '@/hooks';
import UpgradePrompt from './UpgradePrompt';
import './FeatureGate.css';

interface FeatureGateProps {
  /** The feature ID to check access for */
  featureId: string;
  /** Content to render when access is granted */
  children: ReactNode;
  /** Optional: Current usage count for limit-based features */
  currentUsage?: number;
  /** Optional: Custom fallback content when access denied */
  fallback?: ReactNode;
  /** Optional: Show blurred preview instead of fallback */
  showBlurredPreview?: boolean;
  /** Optional: Custom message for the locked overlay */
  lockedMessage?: string;
  /** Optional: Callback when upgrade prompt is shown */
  onUpgradePromptShow?: () => void;
}

/**
 * FeatureGate component - Wraps content that requires membership access
 *
 * Usage:
 * ```tsx
 * <FeatureGate featureId="gto_solver">
 *   <SolverComponent />
 * </FeatureGate>
 *
 * // With usage limit
 * <FeatureGate featureId="practice_daily" currentUsage={dailyPracticeCount}>
 *   <PracticeButton onClick={handlePractice} />
 * </FeatureGate>
 *
 * // With blurred preview
 * <FeatureGate featureId="postflop_ranges" showBlurredPreview>
 *   <RangeMatrix />
 * </FeatureGate>
 * ```
 */
export default function FeatureGate({
  featureId,
  children,
  currentUsage = 0,
  fallback,
  showBlurredPreview = false,
  lockedMessage,
  onUpgradePromptShow,
}: FeatureGateProps) {
  const { hasAccess, checkLimit, getLimit, canUpgrade } = useMembership();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const featureAccess = hasAccess(featureId);
  const limit = getLimit(featureId);
  const { allowed: withinLimit, remaining } = checkLimit(featureId, currentUsage);

  // Access is granted if feature is accessible AND within usage limits
  const isAccessGranted = featureAccess && withinLimit;

  const handleLockedClick = () => {
    if (canUpgrade) {
      setShowUpgradePrompt(true);
      onUpgradePromptShow?.();
    }
  };

  const handleClosePrompt = () => {
    setShowUpgradePrompt(false);
  };

  // If access is granted, render children normally
  if (isAccessGranted) {
    return <>{children}</>;
  }

  // Determine the message to show
  const getMessage = () => {
    if (lockedMessage) return lockedMessage;

    if (!featureAccess) {
      return '此功能需要升级会员';
    }

    if (limit !== null && remaining === 0) {
      return `今日使用次数已达上限 (${limit}次)`;
    }

    return '此功能暂不可用';
  };

  // Show blurred preview with locked overlay
  if (showBlurredPreview) {
    return (
      <>
        <div className="feature-gate-blurred">
          <div className="feature-gate-content-blur">
            {children}
          </div>
          <div className="feature-gate-overlay" onClick={handleLockedClick}>
            <div className="feature-gate-lock">
              <svg
                className="lock-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="lock-message">{getMessage()}</span>
              {canUpgrade && (
                <button className="lock-upgrade-btn">
                  点击升级解锁
                </button>
              )}
            </div>
          </div>
        </div>
        {showUpgradePrompt && (
          <UpgradePrompt featureId={featureId} onClose={handleClosePrompt} />
        )}
      </>
    );
  }

  // Show custom fallback or default locked state
  if (fallback) {
    return (
      <>
        <div onClick={handleLockedClick} style={{ cursor: canUpgrade ? 'pointer' : 'default' }}>
          {fallback}
        </div>
        {showUpgradePrompt && (
          <UpgradePrompt featureId={featureId} onClose={handleClosePrompt} />
        )}
      </>
    );
  }

  // Default locked card
  return (
    <>
      <div className="feature-gate-locked" onClick={handleLockedClick}>
        <svg
          className="locked-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="locked-message">{getMessage()}</span>
        {canUpgrade && (
          <button className="locked-upgrade-btn">
            升级解锁
          </button>
        )}
      </div>
      {showUpgradePrompt && (
        <UpgradePrompt featureId={featureId} onClose={handleClosePrompt} />
      )}
    </>
  );
}
