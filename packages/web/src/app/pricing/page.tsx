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
import './pricing.css';

function PricingContent() {
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
        alert(data.error || '创建订单失败');
      }
    } catch (error) {
      alert('创建订单失败，请稍后重试');
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
      alert('打开订阅管理失败');
    }
  };

  const tiers: MembershipTier[] = ['free', 'pro', 'premium'];

  return (
    <div className="pricing-page">
      <div className="pricing-container">
        {/* Header */}
        <header className="pricing-header">
          <h1 className="pricing-title">选择您的计划</h1>
          <p className="pricing-subtitle">
            升级会员解锁高级GTO功能，提升您的扑克水平
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
              订阅成功！
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
              订单已取消
            </div>
          )}

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={`billing-option ${!isYearly ? 'active' : ''}`}>月付</span>
            <button
              className={`billing-toggle-switch ${isYearly ? 'active' : ''}`}
              onClick={() => setIsYearly(!isYearly)}
            >
              <span className="billing-toggle-knob" />
            </button>
            <span className={`billing-option ${isYearly ? 'active' : ''}`}>
              年付
              <span className="save-badge">省20%</span>
            </span>
          </div>

          {/* Promo Code Input */}
          <div style={{ marginTop: '24px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            <PromoCodeInput
              onApply={(code, discount) => {
                setAppliedPromoCode(code);
                setPromoDiscount(discount);
              }}
              onRemove={() => {
                setAppliedPromoCode(null);
                setPromoDiscount(0);
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
                  {getQuickFeatures(tierId).map((feature, i) => (
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
                    {tierId === 'free' ? '当前计划' : '管理订阅'}
                  </button>
                ) : (
                  <button
                    className={`plan-button ${isPro ? 'primary' : isPremium ? 'premium' : 'ghost'}`}
                    onClick={() => handleSubscribe(tierId)}
                    disabled={loading === tierId}
                  >
                    {loading === tierId ? '处理中...' : tierId === 'free' ? '免费开始' : '立即订阅'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <section className="comparison-section">
          <h2 className="comparison-title">完整功能对比</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>功能</th>
                <th>免费版</th>
                <th>专业版</th>
                <th>旗舰版</th>
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
          <h2 className="faq-title">常见问题</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">可以免费试用吗？</h3>
              <p className="faq-answer">
                是的，所有付费计划都提供7天免费试用。试用期内可随时取消，不会产生任何费用。
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">如何取消订阅？</h3>
              <p className="faq-answer">
                您可以在"设置"页面的"订阅管理"中随时取消订阅。取消后，您仍可使用剩余的订阅时间。
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">支持哪些支付方式？</h3>
              <p className="faq-answer">
                我们支持微信支付、支付宝和信用卡支付。企业用户还可以选择银行转账。
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">可以升级或降级计划吗？</h3>
              <p className="faq-answer">
                可以随时升级计划，差价会按剩余时间比例计算。降级将在当前计划到期后生效。
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pricing-footer">
          <p>有问题？联系我们：support@gtoplay.com</p>
          <p>
            <a href="/terms">服务条款</a> · <a href="/privacy">隐私政策</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

// Quick features for plan cards
function getQuickFeatures(tier: MembershipTier): string[] {
  switch (tier) {
    case 'free':
      return [
        '基础翻牌前范围',
        '每日10次练习',
        '每日3次手牌分析',
        '入门课程',
        '社区只读访问',
      ];
    case 'pro':
      return [
        '全部范围（含翻牌后）',
        '无限练习',
        '每日50次手牌分析',
        'EV计算器',
        '弱点诊断报告',
        '全部课程',
        '优先客服支持',
      ];
    case 'premium':
      return [
        '专业版全部功能',
        '无限手牌分析',
        'GTO求解器',
        '自定义范围（无限）',
        'API访问',
        '高级AI教练',
        '专属1对1支持',
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
