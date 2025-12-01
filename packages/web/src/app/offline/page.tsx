'use client';

import Link from 'next/link';
import './offline.css';

export default function OfflinePage() {
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

        <h1>You're Offline</h1>
        <p className="offline-message">
          It looks like you've lost your internet connection.
          Some features may not be available until you're back online.
        </p>

        <div className="offline-features">
          <h3>Available Offline:</h3>
          <ul>
            <li>
              <span className="feature-icon">&#9989;</span>
              Previously viewed range charts
            </li>
            <li>
              <span className="feature-icon">&#9989;</span>
              Cached course content
            </li>
            <li>
              <span className="feature-icon">&#9989;</span>
              Recently visited pages
            </li>
          </ul>
        </div>

        <div className="offline-unavailable">
          <h3>Requires Connection:</h3>
          <ul>
            <li>
              <span className="feature-icon">&#10060;</span>
              Live PK battles
            </li>
            <li>
              <span className="feature-icon">&#10060;</span>
              Community posts
            </li>
            <li>
              <span className="feature-icon">&#10060;</span>
              Syncing progress
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
            Try Again
          </button>

          <Link href="/" className="home-link">
            Go to Home
          </Link>
        </div>

        <div className="offline-tips">
          <h4>Tips:</h4>
          <p>
            Make sure your device is connected to Wi-Fi or mobile data,
            then tap "Try Again" to reconnect.
          </p>
        </div>
      </div>
    </div>
  );
}
