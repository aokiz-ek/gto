'use client';

import { useState, useEffect } from 'react';
import {
  getAnalyticsEvents,
  getEventStats,
  calculateFunnelConversion,
  CONVERSION_FUNNELS,
  AnalyticsEvent,
} from '@/lib/analytics';
import { useTranslation } from '@/i18n';
import './analytics.css';

// Mock data for demo (in production, fetch from API)
const MOCK_METRICS = {
  overview: {
    totalUsers: 12580,
    activeUsers: 3420,
    newUsers: 856,
    totalSessions: 28450,
    avgSessionDuration: 8.5, // minutes
    bounceRate: 32.5,
    pageViews: 156780,
  },
  retention: {
    day1: 68,
    day7: 42,
    day14: 35,
    day30: 28,
  },
  topPages: [
    { path: '/practice', views: 45600, avgTime: 12.3 },
    { path: '/solutions', views: 38200, avgTime: 5.8 },
    { path: '/challenge', views: 28900, avgTime: 8.2 },
    { path: '/courses', views: 18500, avgTime: 15.6 },
    { path: '/pk', views: 12300, avgTime: 6.4 },
  ],
  deviceBreakdown: {
    mobile: 58,
    tablet: 12,
    desktop: 30,
  },
  conversionMetrics: {
    freeToTrial: 28.5,
    trialToPaid: 12.3,
    monthlyChurn: 5.2,
    mrr: 68500,
    arr: 822000,
    ltv: 580,
    cac: 85,
  },
};

type TimeRange = '24h' | '7d' | '30d' | '90d';

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [eventStats, setEventStats] = useState<ReturnType<typeof getEventStats> | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState(CONVERSION_FUNNELS[0].id);

  useEffect(() => {
    // Load local analytics data
    setEvents(getAnalyticsEvents());
    setEventStats(getEventStats());
  }, []);

  const funnelData = calculateFunnelConversion(selectedFunnel);

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <header className="analytics-header">
          <div className="header-left">
            <h1 className="analytics-title">{t.admin.analytics.title}</h1>
            <p className="analytics-subtitle">{t.admin.analytics.subtitle}</p>
          </div>
          <div className="header-right">
            <select
              className="time-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="24h">{t.admin.analytics.timeRange.last24h}</option>
              <option value="7d">{t.admin.analytics.timeRange.last7d}</option>
              <option value="30d">{t.admin.analytics.timeRange.last30d}</option>
              <option value="90d">{t.admin.analytics.timeRange.last90d}</option>
            </select>
          </div>
        </header>

        {/* Overview Stats */}
        <section className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{MOCK_METRICS.overview.totalUsers.toLocaleString()}</span>
              <span className="stat-label">{t.admin.analytics.totalUsers}</span>
            </div>
            <span className="stat-change positive">+12.5%</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{MOCK_METRICS.overview.activeUsers.toLocaleString()}</span>
              <span className="stat-label">{t.admin.analytics.activeUsers}</span>
            </div>
            <span className="stat-change positive">+8.3%</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon sessions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{MOCK_METRICS.overview.totalSessions.toLocaleString()}</span>
              <span className="stat-label">{t.admin.analytics.sessions}</span>
            </div>
            <span className="stat-change positive">+15.2%</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon duration">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{MOCK_METRICS.overview.avgSessionDuration}{t.admin.analytics.minutes}</span>
              <span className="stat-label">{t.admin.analytics.avgDuration}</span>
            </div>
            <span className="stat-change positive">+2.1%</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon bounce">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{MOCK_METRICS.overview.bounceRate}%</span>
              <span className="stat-label">{t.admin.analytics.bounceRate}</span>
            </div>
            <span className="stat-change negative">-3.2%</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">¥{MOCK_METRICS.conversionMetrics.mrr.toLocaleString()}</span>
              <span className="stat-label">{t.admin.analytics.mrr}</span>
            </div>
            <span className="stat-change positive">+18.7%</span>
          </div>
        </section>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Retention Chart */}
          <section className="chart-card retention-chart">
            <h3 className="chart-title">{t.admin.analytics.retention.title}</h3>
            <div className="retention-bars">
              <div className="retention-bar">
                <div className="bar-fill" style={{ height: `${MOCK_METRICS.retention.day1}%` }} />
                <span className="bar-value">{MOCK_METRICS.retention.day1}%</span>
                <span className="bar-label">{t.admin.analytics.retention.day1}</span>
              </div>
              <div className="retention-bar">
                <div className="bar-fill" style={{ height: `${MOCK_METRICS.retention.day7}%` }} />
                <span className="bar-value">{MOCK_METRICS.retention.day7}%</span>
                <span className="bar-label">{t.admin.analytics.retention.day7}</span>
              </div>
              <div className="retention-bar">
                <div className="bar-fill" style={{ height: `${MOCK_METRICS.retention.day14}%` }} />
                <span className="bar-value">{MOCK_METRICS.retention.day14}%</span>
                <span className="bar-label">{t.admin.analytics.retention.day14}</span>
              </div>
              <div className="retention-bar">
                <div className="bar-fill" style={{ height: `${MOCK_METRICS.retention.day30}%` }} />
                <span className="bar-value">{MOCK_METRICS.retention.day30}%</span>
                <span className="bar-label">{t.admin.analytics.retention.day30}</span>
              </div>
            </div>
          </section>

          {/* Device Breakdown */}
          <section className="chart-card device-chart">
            <h3 className="chart-title">{t.admin.analytics.devices.title}</h3>
            <div className="device-breakdown">
              <div className="device-item">
                <div className="device-icon mobile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div className="device-info">
                  <span className="device-name">{t.admin.analytics.devices.mobile}</span>
                  <span className="device-percent">{MOCK_METRICS.deviceBreakdown.mobile}%</span>
                </div>
                <div className="device-bar">
                  <div className="bar-fill mobile" style={{ width: `${MOCK_METRICS.deviceBreakdown.mobile}%` }} />
                </div>
              </div>
              <div className="device-item">
                <div className="device-icon tablet">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div className="device-info">
                  <span className="device-name">{t.admin.analytics.devices.tablet}</span>
                  <span className="device-percent">{MOCK_METRICS.deviceBreakdown.tablet}%</span>
                </div>
                <div className="device-bar">
                  <div className="bar-fill tablet" style={{ width: `${MOCK_METRICS.deviceBreakdown.tablet}%` }} />
                </div>
              </div>
              <div className="device-item">
                <div className="device-icon desktop">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className="device-info">
                  <span className="device-name">{t.admin.analytics.devices.desktop}</span>
                  <span className="device-percent">{MOCK_METRICS.deviceBreakdown.desktop}%</span>
                </div>
                <div className="device-bar">
                  <div className="bar-fill desktop" style={{ width: `${MOCK_METRICS.deviceBreakdown.desktop}%` }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Conversion Funnel */}
        <section className="chart-card funnel-section">
          <div className="funnel-header">
            <h3 className="chart-title">{t.admin.analytics.funnel.title}</h3>
            <select
              className="funnel-select"
              value={selectedFunnel}
              onChange={(e) => setSelectedFunnel(e.target.value)}
            >
              {CONVERSION_FUNNELS.map(funnel => (
                <option key={funnel.id} value={funnel.id}>{funnel.name}</option>
              ))}
            </select>
          </div>
          {funnelData && (
            <div className="funnel-visualization">
              {funnelData.steps.map((step, index) => (
                <div key={index} className="funnel-step">
                  <div
                    className="funnel-bar"
                    style={{ width: `${Math.max(20, step.rate)}%` }}
                  >
                    <span className="funnel-step-name">{step.name}</span>
                    <span className="funnel-step-count">{step.count}</span>
                  </div>
                  {index < funnelData.steps.length - 1 && (
                    <div className="funnel-arrow">
                      <span className="conversion-rate">{funnelData.steps[index + 1].rate}%</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="funnel-summary">
                <span>{t.admin.analytics.funnel.totalConversion}: </span>
                <strong>{funnelData.overallRate}%</strong>
              </div>
            </div>
          )}
        </section>

        {/* Top Pages */}
        <section className="chart-card top-pages">
          <h3 className="chart-title">{t.admin.analytics.topPages.title}</h3>
          <table className="pages-table">
            <thead>
              <tr>
                <th>{t.admin.analytics.topPages.page}</th>
                <th>{t.admin.analytics.topPages.views}</th>
                <th>{t.admin.analytics.topPages.avgTime}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_METRICS.topPages.map((page, index) => (
                <tr key={index}>
                  <td className="page-path">{page.path}</td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.avgTime}{t.admin.analytics.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Business Metrics */}
        <section className="chart-card business-metrics">
          <h3 className="chart-title">{t.admin.analytics.business.title}</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.freeToTrial}</span>
              <span className="metric-value">{MOCK_METRICS.conversionMetrics.freeToTrial}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.trialToPaid}</span>
              <span className="metric-value">{MOCK_METRICS.conversionMetrics.trialToPaid}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.churn}</span>
              <span className="metric-value negative">{MOCK_METRICS.conversionMetrics.monthlyChurn}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.arr}</span>
              <span className="metric-value">¥{MOCK_METRICS.conversionMetrics.arr.toLocaleString()}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.ltv}</span>
              <span className="metric-value">¥{MOCK_METRICS.conversionMetrics.ltv}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.admin.analytics.business.cac}</span>
              <span className="metric-value">¥{MOCK_METRICS.conversionMetrics.cac}</span>
            </div>
          </div>
        </section>

        {/* Local Events (Dev) */}
        {process.env.NODE_ENV !== 'production' && eventStats && (
          <section className="chart-card local-events">
            <h3 className="chart-title">{t.admin.analytics.localEvents.title}</h3>
            <div className="events-summary">
              <p>{t.admin.analytics.localEvents.totalEvents}: {eventStats.totalEvents}</p>
              <div className="events-by-category">
                {Object.entries(eventStats.byCategory).map(([category, count]) => (
                  <span key={category} className="category-badge">
                    {category}: {count}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
