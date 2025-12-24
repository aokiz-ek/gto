'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n';
import './offline.css';

export default function OfflinePage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="offline-page">
      <div className="offline-content">
        <div className="offline-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1>{t.offline.pageTitle}</h1>
        <p className="offline-message">
          {t.offline.message}
        </p>

        <div className="offline-features">
          <h3>{t.offline.availableOfflineTitle}</h3>
          <ul>
            <li>
              <span className="feature-icon">&#9989;</span>
              {t.offline.previouslyViewedRangeCharts}
            </li>
            <li>
              <span className="feature-icon">&#9989;</span>
              {t.offline.cachedCourseContent}
            </li>
            <li>
              <span className="feature-icon">&#9989;</span>
              {t.offline.recentlyVisitedPages}
            </li>
          </ul>
        </div>

        <div className="offline-unavailable">
          <h3>{t.offline.requiresConnectionTitle}</h3>
          <ul>
            <li>
              <span className="feature-icon">&#10060;</span>
              {t.offline.livePKBattles}
            </li>
            <li>
              <span className="feature-icon">&#10060;</span>
              {t.offline.communityPosts}
            </li>
            <li>
              <span className="feature-icon">&#10060;</span>
              {t.offline.syncingProgress}
            </li>
          </ul>
        </div>

        <div className="offline-actions">
          <button className="retry-btn" onClick={handleRetry}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {t.offline.tryAgain}
          </button>

          <Link href="/" className="home-link">
            {t.offline.goToHome}
          </Link>
        </div>

        <div className="offline-tips">
          <h4>{t.offline.tipsTitle}</h4>
          <p>
            {t.offline.tips}
          </p>
        </div>
      </div>
    </div>
  );
}
