'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_FEATURES,
  FEATURE_CATEGORIES,
  getFeatureDisplay,
  MembershipTier,
} from '@/config/membership';
import { PromoCodeInput } from '@/components';
import { useTranslation } from '@/i18n';
import './pricing.css';

function PricingContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const highlight = searchParams.get('highlight') as MembershipTier | null;

  const currentTier = (user?.subscription as MembershipTier) || 'free';

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (planId === 'free') return;

    setLoading(planId);

    try {
      // In production, this would call your payment API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          interval: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t.pricing.createOrderFailed);
      }
    } catch (error) {
      alert(t.pricing.createOrderFailed);
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert(t.pricing.openManageFailed);
    }
  };

  const tiers: MembershipTier[] = ['free', 'pro', 'premium'];

  return (
    <div className="pricing-page">
      <div className="pricing-container">
        {/* Header */}
        <header className="pricing-header">
          <h1 className="pricing-title">{t.pricing.title}</h1>
          <p className="pricing-subtitle">
            {t.pricing.subtitle}
          </p>

          {/* Success/Cancel Messages */}
          {success && (
            <div style={{
              padding: '16px',
              background: 'rgba(0, 245, 212, 0.1)',
              border: '1px solid #00f5d4',
              borderRadius: '8px',
              color: '#00f5d4',
              marginBottom: '24px',
            }}>
              {t.pricing.subscriptionSuccess}
            </div>
          )}

          {canceled && (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid #ff6b6b',
              borderRadius: '8px',
              color: '#ff6b6b',
              marginBottom: '24px',
            }}>
              {t.pricing.orderCanceled}
            </div>
          )}

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={`billing-option ${!isYearly ? 'active' : ''}`}>{t.pricing.monthly}</span>
            <button
              className={`billing-toggle-switch ${isYearly ? 'active' : ''}`}
              onClick={() => setIsYearly(!isYearly)}
            >
              <span className="billing-toggle-knob" />
            </button>
            <span className={`billing-option ${isYearly ? 'active' : ''}`}>
              {t.pricing.yearly}
              <span className="save-badge">{t.pricing.save}20%</span>
            </span>
          </div>

          {/* Promo Code Input */}
          <div style={{ marginTop: '24px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            <PromoCodeInput
              tier="pro"
              interval={isYearly ? 'yearly' : 'monthly'}
              originalPrice={isYearly ? 708 : 68}
              onApply={(promoCode, finalPrice) => {
                setAppliedPromoCode(promoCode?.code || null);
                setPromoDiscount(promoCode ? (isYearly ? 708 : 68) - finalPrice : 0);
              }}
            />
          </div>
        </header>

        {/* Plans Grid */}
        <div className="plans-grid">
          {tiers.map((tierId) => {
            const plan = MEMBERSHIP_PLANS[tierId];
            const isCurrentPlan = currentTier === tierId;
            const isPro = tierId === 'pro';
            const isPremium = tierId === 'premium';
            const isHighlighted = highlight === tierId;
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const originalPrice = isYearly ? plan.price.yearlyOriginal : plan.price.monthlyOriginal;

            return (
              <div
                key={tierId}
                className={`plan-card ${isPro ? 'popular' : ''} ${isPremium ? 'premium-card' : ''} ${isHighlighted ? 'highlighted' : ''}`}
              >
                {plan.badge && (
                  <span className="plan-badge">{plan.badge}</span>
                )}

                <h3 className="plan-name">{plan.nameCn}</h3>
                <p className="plan-description">{plan.descriptionCn}</p>

                <div className="plan-price">
                  <span className="price-currency">¥</span>
                  <span className="price-amount">{price}</span>
                  {price > 0 && (
                    <span className="price-period">/{isYearly ? '年' : '月'}</span>
                  )}
                  {originalPrice && (
                    <span className="price-original">¥{originalPrice}</span>
                  )}
                </div>

                <ul className="plan-features">
                  {getQuickFeatures(tierId, t).map((feature, i) => (
                    <li key={i}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    className="plan-button current"
                    onClick={tierId !== 'free' ? handleManageSubscription : undefined}
                  >
                    {tierId === 'free' ? t.pricing.currentPlan : t.pricing.manageSubscription}
                  </button>
                ) : (
                  <button
                    className={`plan-button ${isPro ? 'primary' : isPremium ? 'premium' : 'ghost'}`}
                    onClick={() => handleSubscribe(tierId)}
                    disabled={loading === tierId}
                  >
                    {loading === tierId ? t.pricing.processing : tierId === 'free' ? t.pricing.freeStart : t.pricing.subscribe}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <section className="comparison-section">
          <h2 className="comparison-title">{t.pricing.featureComparison}</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>{t.pricing.feature}</th>
                <th>{MEMBERSHIP_PLANS.free.nameCn}</th>
                <th>{MEMBERSHIP_PLANS.pro.nameCn}</th>
                <th>{MEMBERSHIP_PLANS.premium.nameCn}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_CATEGORIES.map((category) => (
                <>
                  <tr key={category.id} className="category-row">
                    <td colSpan={4}>{category.nameCn}</td>
                  </tr>
                  {category.features.map((featureId) => {
                    const feature = MEMBERSHIP_FEATURES.find(f => f.id === featureId);
                    if (!feature) return null;

                    return (
                      <tr key={featureId}>
                        <td>{feature.nameCn}</td>
                        {(['free', 'pro', 'premium'] as MembershipTier[]).map((tier) => {
                          const { text, available } = getFeatureDisplay(feature[tier]);
                          return (
                            <td
                              key={tier}
                              className={
                                typeof feature[tier] === 'boolean'
                                  ? available ? 'value-available' : 'value-unavailable'
                                  : 'value-text'
                              }
                            >
                              {text}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="faq-title">{t.pricing.faq}</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">{t.pricing.faqFreeTrial}</h3>
              <p className="faq-answer">
                {t.pricing.faqFreeTrialAnswer}
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">{t.pricing.faqCancelSubscription}</h3>
              <p className="faq-answer">
                {t.pricing.faqCancelSubscriptionAnswer}
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">{t.pricing.faqPaymentMethods}</h3>
              <p className="faq-answer">
                {t.pricing.faqPaymentMethodsAnswer}
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">{t.pricing.faqUpgradeDowngrade}</h3>
              <p className="faq-answer">
                {t.pricing.faqUpgradeDowngradeAnswer}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pricing-footer">
          <p>有问题？联系我们：support@gtoplay.com</p>
          <p>
            <a href="/terms">{t.pricing.terms}</a> · <a href="/privacy">{t.pricing.privacy}</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

// Quick features for plan cards
function getQuickFeatures(tier: MembershipTier, t: any): string[] {
  switch (tier) {
    case 'free':
      return [
        t.pricing.features.basicRanges,
        t.pricing.features.practice10,
        t.pricing.features.analysis3,
        t.pricing.features.basicCourses,
        t.pricing.features.communityReadOnly,
      ];
    case 'pro':
      return [
        t.pricing.features.allRanges,
        t.pricing.features.unlimitedPractice,
        t.pricing.features.analysis50,
        t.pricing.features.evCalculator,
        t.pricing.features.weaknessReport,
        t.pricing.features.allCourses,
        t.pricing.features.prioritySupport,
      ];
    case 'premium':
      return [
        t.pricing.features.allProFeatures,
        t.pricing.features.unlimitedAnalysis,
        t.pricing.features.gtoSolver,
        t.pricing.features.customRangesUnlimited,
        t.pricing.features.apiAccess,
        t.pricing.features.advancedAiCoach,
        t.pricing.features.dedicatedSupport,
      ];
    default:
      return [];
  }
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        color: '#9ca3af',
      }}>
        加载中...
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
