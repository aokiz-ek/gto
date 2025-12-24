'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card as CardType } from '@gto/core';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './detail.css';

interface HandHistory {
  id: string;
  hero_hand: string;
  board: string;
  hero_position: string;
  villain_position: string | null;
  pot_size: number;
  stack_size: number;
  street: string;
  analysis_result: {
    equity?: number;
    ev?: number;
    recommendedAction?: string;
  } | null;
  notes: string | null;
  created_at: string;
  is_favorite?: boolean;
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [history, setHistory] = useState<HandHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchHistory(params.id as string);
    }
  }, [params.id]);

  const fetchHistory = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/history/${id}`);
      if (!response.ok) {
        throw new Error('History not found');
      }
      const data = await response.json();
      setHistory(data.history);
      setNotes(data.history.notes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async () => {
    if (!history || !confirm(t.history.confirmClear)) return;

    try {
      const response = await fetch(`/api/history?id=${history.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/history');
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!history) return;

    const newFavoriteStatus = !history.is_favorite;
    setHistory({ ...history, is_favorite: newFavoriteStatus });

    try {
      await fetch(`/api/history/${history.id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: newFavoriteStatus }),
      });
    } catch {
      setHistory({ ...history, is_favorite: !newFavoriteStatus });
    }
  };

  const saveNotes = async () => {
    if (!history) return;

    try {
      await fetch(`/api/history/${history.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setHistory({ ...history, notes });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const parseHeroHand = (handStr: string): [CardType, CardType] | null => {
    try {
      if (handStr.length >= 4) {
        return [
          parseCard(handStr.slice(0, 2)),
          parseCard(handStr.slice(2, 4)),
        ];
      }
    } catch {
      return null;
    }
    return null;
  };

  const parseBoard = (boardStr: string): CardType[] => {
    const cards: CardType[] = [];
    try {
      for (let i = 0; i < boardStr.length; i += 2) {
        if (i + 1 < boardStr.length) {
          cards.push(parseCard(boardStr.slice(i, i + 2)));
        }
      }
    } catch {
      return [];
    }
    return cards;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEquityClass = (equity: number) => {
    if (equity >= 0.6) return 'high';
    if (equity >= 0.4) return 'medium';
    return 'low';
  };

  const getActionClass = (action?: string) => {
    if (!action) return '';
    const lower = action.toLowerCase();
    if (lower.includes('raise') || lower.includes('bet')) return 'raise';
    if (lower.includes('call')) return 'call';
    if (lower.includes('fold')) return 'fold';
    if (lower.includes('check')) return 'check';
    if (lower.includes('all-in') || lower.includes('allin')) return 'all-in';
    return '';
  };

  const getStreetLabel = (street: string) => {
    const streetLower = street.toLowerCase();
    if (streetLower === 'preflop') return t.poker.preflop;
    if (streetLower === 'flop') return t.poker.flop;
    if (streetLower === 'turn') return t.poker.turn;
    if (streetLower === 'river') return t.poker.river;
    return street;
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="detail-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>{t.common.error}</h2>
          <p>{error || t.errors.notFound}</p>
          <Link href="/history" className="back-link">
            {t.common.back}
          </Link>
        </div>
      </div>
    );
  }

  const hand = parseHeroHand(history.hero_hand);
  const board = parseBoard(history.board);

  return (
    <div className="detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="header-left">
          <Link href="/history" className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="header-title">
            <h1>{t.history.title}</h1>
            <span className="header-date">{formatDate(history.created_at)}</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`action-btn icon-btn ${history.is_favorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            title={history.is_favorite ? t.hands.delete : t.hands.addNotes}
          >
            {history.is_favorite ? '⭐' : '☆'}
          </button>
          <Link
            href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
            className="action-btn primary"
          >
            {t.hands.analyze}
          </Link>
          <button className="action-btn danger" onClick={deleteHistory}>
            {t.common.delete}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`detail-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Left Column - Cards & Info */}
        <div className="detail-main">
          {/* Position & Street Info */}
          <div className="info-row">
            <div className="position-info">
              <span className="position-badge hero">{history.hero_position}</span>
              {history.villain_position && (
                <>
                  <span className="vs-text">vs</span>
                  <span className="position-badge villain">{history.villain_position}</span>
                </>
              )}
            </div>
            <span className="street-badge">{getStreetLabel(history.street)}</span>
          </div>

          {/* Hero Hand */}
          <section className="card-section">
            <h2 className="section-title">{t.analyzer.yourHand}</h2>
            <div className="cards-display hero-cards">
              {hand && (
                <>
                  <PokerCard card={hand[0]} size={isMobile ? 'lg' : 'xl'} variant="dark" />
                  <PokerCard card={hand[1]} size={isMobile ? 'lg' : 'xl'} variant="dark" />
                </>
              )}
            </div>
          </section>

          {/* Board */}
          {board.length > 0 && (
            <section className="card-section">
              <h2 className="section-title">{t.analyzer.communityCards}</h2>
              <div className="cards-display board-cards">
                {board.map((card, i) => (
                  <PokerCard key={i} card={card} size={isMobile ? 'md' : 'lg'} variant="dark" />
                ))}
                {/* Placeholder for remaining cards */}
                {board.length < 5 && (
                  <div className="remaining-cards">
                    {Array.from({ length: 5 - board.length }).map((_, i) => (
                      <div key={i} className="card-placeholder" />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Pot & Stack Info */}
          <section className="info-section">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">💰</div>
                <div className="info-content">
                  <span className="info-label">{t.analyzer.potSize}</span>
                  <span className="info-value">{history.pot_size} <span className="unit">BB</span></span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">📊</div>
                <div className="info-content">
                  <span className="info-label">{t.analyzer.effectiveStack}</span>
                  <span className="info-value">{history.stack_size} <span className="unit">BB</span></span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">📈</div>
                <div className="info-content">
                  <span className="info-label">{t.analyzer.spr}</span>
                  <span className="info-value">
                    {history.pot_size > 0 ? (history.stack_size / history.pot_size).toFixed(1) : '∞'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Analysis & Notes */}
        <div className="detail-sidebar">
          {/* Analysis Result */}
          {history.analysis_result && (
            <section className="analysis-section">
              <h2 className="section-title">{t.analyzer.analysisResults}</h2>

              {history.analysis_result.equity !== undefined && (
                <div className="analysis-card">
                  <div className="analysis-header">
                    <span className="analysis-label">{t.analyzer.equity}</span>
                    <span className={`analysis-value ${getEquityClass(history.analysis_result.equity)}`}>
                      {(history.analysis_result.equity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getEquityClass(history.analysis_result.equity)}`}
                      style={{ width: `${history.analysis_result.equity * 100}%` }}
                    />
                  </div>
                  <p className="analysis-desc">
                    {history.analysis_result.equity >= 0.6
                      ? t.postflop.handStrength.strong
                      : history.analysis_result.equity >= 0.4
                      ? t.postflop.handStrength.medium
                      : t.postflop.handStrength.weak}
                  </p>
                </div>
              )}

              {history.analysis_result.ev !== undefined && (
                <div className="analysis-card">
                  <div className="analysis-header">
                    <span className="analysis-label">{t.analyzer.expectedValue}</span>
                    <span className={`analysis-value ${history.analysis_result.ev >= 0 ? 'positive' : 'negative'}`}>
                      {history.analysis_result.ev >= 0 ? '+' : ''}{history.analysis_result.ev.toFixed(2)} BB
                    </span>
                  </div>
                  <p className="analysis-desc">
                    {history.analysis_result.ev > 0
                      ? t.analyzer.bestEv
                      : history.analysis_result.ev === 0
                      ? t.postflop.handStrength.marginal
                      : t.postflop.handStrength.weak}
                  </p>
                </div>
              )}

              {history.analysis_result.recommendedAction && (
                <div className="recommendation-card">
                  <span className="recommendation-label">{t.analyzer.recommendedAction}</span>
                  <span className={`recommendation-action ${getActionClass(history.analysis_result.recommendedAction)}`}>
                    {history.analysis_result.recommendedAction}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Notes */}
          <section className="notes-section">
            <div className="section-header">
              <h2 className="section-title">{t.hands.notes}</h2>
              {!isEditing && (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  {t.common.edit}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="notes-editor">
                <textarea
                  className="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.analyzer.notesPlaceholder}
                  rows={6}
                />
                <div className="notes-actions">
                  <button className="btn-cancel" onClick={() => { setIsEditing(false); setNotes(history.notes || ''); }}>
                    {t.common.cancel}
                  </button>
                  <button className="btn-save" onClick={saveNotes}>
                    {t.common.save}
                  </button>
                </div>
              </div>
            ) : (
              <div className="notes-content">
                {history.notes ? (
                  <p>{history.notes}</p>
                ) : (
                  <p className="notes-empty">{t.hands.addNotes}</p>
                )}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="actions-section">
            <h2 className="section-title">{t.hands.actions}</h2>
            <div className="quick-actions-grid">
              <Link
                href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
                className="quick-action-card"
              >
                <span className="quick-action-icon">🔄</span>
                <span className="quick-action-label">{t.hands.analyze}</span>
              </Link>
              <button className="quick-action-card" onClick={() => {
                const data = JSON.stringify(history, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `hand-${history.id}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}>
                <span className="quick-action-icon">📤</span>
                <span className="quick-action-label">{t.history.export}</span>
              </button>
              <button className="quick-action-card" onClick={() => {
                const text = `${t.analyzer.yourHand}: ${history.hero_hand}\n${t.analyzer.communityCards}: ${history.board}\n${t.poker.position}: ${history.hero_position}\n${t.analyzer.equity}: ${history.analysis_result?.equity ? (history.analysis_result.equity * 100).toFixed(1) + '%' : 'N/A'}`;
                navigator.clipboard.writeText(text);
                alert(t.common.success);
              }}>
                <span className="quick-action-icon">📋</span>
                <span className="quick-action-label">{t.community.share}</span>
              </button>
              <Link href="/practice" className="quick-action-card">
                <span className="quick-action-icon">🎯</span>
                <span className="quick-action-label">{t.practice.startPractice}</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
