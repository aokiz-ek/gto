'use client';

import { useState } from 'react';
import { validatePromoCode, calculateDiscountedPrice, PromoCode } from '@/config/promotions';
import { MembershipTier } from '@/config/membership';
import './PromoCodeInput.css';

interface PromoCodeInputProps {
  tier: MembershipTier;
  interval: 'monthly' | 'yearly';
  originalPrice: number;
  isFirstPurchase?: boolean;
  onApply?: (promoCode: PromoCode | null, finalPrice: number) => void;
}

export default function PromoCodeInput({
  tier,
  interval,
  originalPrice,
  isFirstPurchase = true,
  onApply,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('请输入优惠码');
      return;
    }

    setLoading(true);
    setError(null);

    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = validatePromoCode(code.trim(), tier, interval, isFirstPurchase);

    if (result.valid && result.promoCode) {
      setAppliedCode(result.promoCode);
      const { finalPrice } = calculateDiscountedPrice(originalPrice, result.promoCode);
      onApply?.(result.promoCode, finalPrice);
    } else {
      setError(result.error || '无效的优惠码');
      setAppliedCode(null);
      onApply?.(null, originalPrice);
    }

    setLoading(false);
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCode(null);
    setError(null);
    onApply?.(null, originalPrice);
  };

  const discountInfo = appliedCode
    ? calculateDiscountedPrice(originalPrice, appliedCode)
    : null;

  return (
    <div className="promo-code-container">
      <button
        className="promo-code-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <svg
          className="promo-code-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
          <path d="M7 15h0M7 9h0" />
          <path d="M12 17V7" strokeDasharray="2 2" />
        </svg>
        <span>有优惠码？</span>
        <svg
          className={`promo-code-chevron ${isExpanded ? 'expanded' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="promo-code-form">
          {appliedCode ? (
            <div className="promo-code-applied">
              <div className="applied-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{appliedCode.code}</span>
              </div>
              <div className="applied-info">
                <span className="applied-description">{appliedCode.descriptionCn}</span>
                <span className="applied-savings">
                  {discountInfo?.description} · 省 ¥{discountInfo?.savings}
                </span>
              </div>
              <button
                className="promo-code-remove"
                onClick={handleRemove}
                type="button"
              >
                移除
              </button>
            </div>
          ) : (
            <>
              <div className="promo-code-input-wrapper">
                <input
                  type="text"
                  className={`promo-code-input ${error ? 'error' : ''}`}
                  placeholder="输入优惠码"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  maxLength={20}
                />
                <button
                  className="promo-code-apply"
                  onClick={handleApply}
                  disabled={loading || !code.trim()}
                  type="button"
                >
                  {loading ? '验证中...' : '应用'}
                </button>
              </div>
              {error && <p className="promo-code-error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
