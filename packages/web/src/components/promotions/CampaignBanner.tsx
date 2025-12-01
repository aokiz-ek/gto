'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActiveCampaigns, formatCountdown, Campaign } from '@/config/promotions';
import './CampaignBanner.css';

interface CampaignBannerProps {
  /** Show only the highest priority campaign */
  singleMode?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: (campaignId: string) => void;
  /** Custom class name */
  className?: string;
}

export default function CampaignBanner({
  singleMode = true,
  onDismiss,
  className = '',
}: CampaignBannerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load dismissed campaigns from localStorage
    const stored = localStorage.getItem('dismissedCampaigns');
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }

    // Get active campaigns
    const active = getActiveCampaigns();
    setCampaigns(active);

    // Update countdown every minute
    const updateCountdown = () => {
      const newCountdown: Record<string, string> = {};
      active.forEach(campaign => {
        newCountdown[campaign.id] = formatCountdown(campaign.endDate);
      });
      setCountdown(newCountdown);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (campaignId: string) => {
    const newDismissed = [...dismissedIds, campaignId];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedCampaigns', JSON.stringify(newDismissed));
    onDismiss?.(campaignId);
  };

  // Filter out dismissed campaigns
  const visibleCampaigns = campaigns.filter(c => !dismissedIds.includes(c.id));

  if (visibleCampaigns.length === 0) {
    return null;
  }

  const displayCampaigns = singleMode ? [visibleCampaigns[0]] : visibleCampaigns;

  return (
    <div className={`campaign-banner-container ${className}`}>
      {displayCampaigns.map(campaign => (
        <div
          key={campaign.id}
          className={`campaign-banner ${campaign.type}`}
        >
          <div className="campaign-content">
            <div className="campaign-badge">
              {campaign.type === 'flash_sale' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
              {campaign.type === 'holiday' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {campaign.type === 'special' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
              )}
              <span className="campaign-discount">
                {campaign.discount.value}% OFF
              </span>
            </div>

            <div className="campaign-info">
              <h3 className="campaign-name">{campaign.nameCn}</h3>
              <p className="campaign-description">{campaign.descriptionCn}</p>
            </div>

            <div className="campaign-timer">
              <span className="timer-label">剩余时间</span>
              <span className="timer-value">{countdown[campaign.id] || '...'}</span>
            </div>

            <Link
              href={`/pricing?campaign=${campaign.id}`}
              className="campaign-cta"
            >
              立即抢购
            </Link>
          </div>

          <button
            className="campaign-dismiss"
            onClick={() => handleDismiss(campaign.id)}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
