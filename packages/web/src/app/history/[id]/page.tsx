'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card as CardType } from '@gto/core';
import { useResponsive } from '@/hooks';
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
    if (!history || !confirm('确定要删除这手牌吗？')) return;

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
    const labels: Record<string, string> = {
      preflop: '翻牌前',
      flop: '翻牌',
      turn: '转牌',
      river: '河牌',
    };
    return labels[street.toLowerCase()] || street;
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">加载牌局详情...</p>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="detail-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>加载失败</h2>
          <p>{error || '找不到该牌局'}</p>
          <Link href="/history" className="back-link">
            返回牌局列表
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
            <h1>牌局详情</h1>
            <span className="header-date">{formatDate(history.created_at)}</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`action-btn icon-btn ${history.is_favorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            title={history.is_favorite ? '取消收藏' : '添加收藏'}
          >
            {history.is_favorite ? '⭐' : '☆'}
          </button>
          <Link
            href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
            className="action-btn primary"
          >
            重新分析
          </Link>
          <button className="action-btn danger" onClick={deleteHistory}>
            删除
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
            <h2 className="section-title">手牌</h2>
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
              <h2 className="section-title">公共牌</h2>
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
                  <span className="info-label">底池大小</span>
                  <span className="info-value">{history.pot_size} <span className="unit">BB</span></span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">📊</div>
                <div className="info-content">
                  <span className="info-label">有效筹码</span>
                  <span className="info-value">{history.stack_size} <span className="unit">BB</span></span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">📈</div>
                <div className="info-content">
                  <span className="info-label">SPR</span>
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
              <h2 className="section-title">分析结果</h2>

              {history.analysis_result.equity !== undefined && (
                <div className="analysis-card">
                  <div className="analysis-header">
                    <span className="analysis-label">权益 (Equity)</span>
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
                      ? '强势手牌，有较高的获胜概率'
                      : history.analysis_result.equity >= 0.4
                      ? '中等手牌，需要谨慎处理'
                      : '弱势手牌，建议保守行动'}
                  </p>
                </div>
              )}

              {history.analysis_result.ev !== undefined && (
                <div className="analysis-card">
                  <div className="analysis-header">
                    <span className="analysis-label">期望值 (EV)</span>
                    <span className={`analysis-value ${history.analysis_result.ev >= 0 ? 'positive' : 'negative'}`}>
                      {history.analysis_result.ev >= 0 ? '+' : ''}{history.analysis_result.ev.toFixed(2)} BB
                    </span>
                  </div>
                  <p className="analysis-desc">
                    {history.analysis_result.ev > 0
                      ? '正EV操作，长期有利可图'
                      : history.analysis_result.ev === 0
                      ? '边缘情况，EV接近零'
                      : '负EV操作，长期会亏损'}
                  </p>
                </div>
              )}

              {history.analysis_result.recommendedAction && (
                <div className="recommendation-card">
                  <span className="recommendation-label">推荐动作</span>
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
              <h2 className="section-title">笔记</h2>
              {!isEditing && (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  编辑
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="notes-editor">
                <textarea
                  className="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="添加你对这手牌的思考和笔记..."
                  rows={6}
                />
                <div className="notes-actions">
                  <button className="btn-cancel" onClick={() => { setIsEditing(false); setNotes(history.notes || ''); }}>
                    取消
                  </button>
                  <button className="btn-save" onClick={saveNotes}>
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="notes-content">
                {history.notes ? (
                  <p>{history.notes}</p>
                ) : (
                  <p className="notes-empty">暂无笔记，点击编辑添加...</p>
                )}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="actions-section">
            <h2 className="section-title">快速操作</h2>
            <div className="quick-actions-grid">
              <Link
                href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
                className="quick-action-card"
              >
                <span className="quick-action-icon">🔄</span>
                <span className="quick-action-label">重新分析</span>
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
                <span className="quick-action-label">导出</span>
              </button>
              <button className="quick-action-card" onClick={() => {
                const text = `手牌: ${history.hero_hand}\n公共牌: ${history.board}\n位置: ${history.hero_position}\n权益: ${history.analysis_result?.equity ? (history.analysis_result.equity * 100).toFixed(1) + '%' : 'N/A'}`;
                navigator.clipboard.writeText(text);
                alert('已复制到剪贴板');
              }}>
                <span className="quick-action-icon">📋</span>
                <span className="quick-action-label">复制信息</span>
              </button>
              <Link href="/practice" className="quick-action-card">
                <span className="quick-action-icon">🎯</span>
                <span className="quick-action-label">开始练习</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
