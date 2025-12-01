'use client';

import { useRouter } from 'next/navigation';
import { useMembership } from '@/hooks';
import { MEMBERSHIP_PLANS, MEMBERSHIP_FEATURES } from '@/config/membership';
import './UpgradePrompt.css';

interface UpgradePromptProps {
  featureId: string;
  onClose?: () => void;
}

export default function UpgradePrompt({ featureId, onClose }: UpgradePromptProps) {
  const router = useRouter();
  const { tier, getUpgradeTier } = useMembership();

  const feature = MEMBERSHIP_FEATURES.find(f => f.id === featureId);
  const recommendedTier = getUpgradeTier(featureId);

  if (!feature || !recommendedTier) return null;

  const recommendedPlan = MEMBERSHIP_PLANS[recommendedTier];

  const handleUpgrade = () => {
    router.push(`/pricing?highlight=${recommendedTier}`);
    onClose?.();
  };

  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt" onClick={e => e.stopPropagation()}>
        <button className="upgrade-prompt-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="upgrade-prompt-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <h3 className="upgrade-prompt-title">解锁 {feature.nameCn}</h3>
        <p className="upgrade-prompt-description">
          {feature.descriptionCn}功能需要升级到{recommendedPlan.nameCn}才能使用
        </p>

        <div className="upgrade-prompt-comparison">
          <div className="comparison-item current">
            <span className="comparison-label">当前 ({MEMBERSHIP_PLANS[tier].nameCn})</span>
            <span className="comparison-value unavailable">
              {typeof feature[tier] === 'boolean' ? '不可用' : feature[tier]}
            </span>
          </div>
          <div className="comparison-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="comparison-item upgraded">
            <span className="comparison-label">{recommendedPlan.nameCn}</span>
            <span className="comparison-value available">
              {typeof feature[recommendedTier] === 'boolean' ? '可用' : feature[recommendedTier]}
            </span>
          </div>
        </div>

        <div className="upgrade-prompt-price">
          <span className="price-value">¥{recommendedPlan.price.monthly}</span>
          <span className="price-unit">/月</span>
          {recommendedPlan.price.monthlyOriginal && (
            <span className="price-original">¥{recommendedPlan.price.monthlyOriginal}</span>
          )}
        </div>

        <div className="upgrade-prompt-actions">
          <button className="upgrade-btn primary" onClick={handleUpgrade}>
            立即升级
          </button>
          <button className="upgrade-btn secondary" onClick={onClose}>
            稍后再说
          </button>
        </div>

        <p className="upgrade-prompt-note">
          7天免费试用 · 随时取消
        </p>
      </div>
    </div>
  );
}
