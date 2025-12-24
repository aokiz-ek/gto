'use client';

import { useState, useMemo } from 'react';
import { Button, PokerCard, PositionBadge } from '@gto/ui';
import { parseCard } from '@gto/core';
import { useUserStore } from '@/store';
import { HandReplayer, type SavedHand as ReplayerSavedHand } from '@/components/HandReplayer';
import type { Card, Position } from '@gto/core';
import { useTranslation } from '@/i18n';
import './replayer.css';

// Store SavedHand type (matching userStore.ts)
interface StoreSavedHand {
  id: string;
  timestamp: string;
  heroHand: string;
  heroPosition: string;
  villainPosition: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  board: string[];
  results: {
    street: string;
    action: string;
    score: number;
    isCorrect: boolean;
  }[];
  totalScore: number;
  notes?: string;
}

// Convert saved hand from store to replayer format
function convertToReplayerFormat(savedHand: StoreSavedHand): ReplayerSavedHand {
  return {
    id: savedHand.id,
    heroHand: savedHand.heroHand,
    board: savedHand.board.join(''),
    heroPosition: savedHand.heroPosition as Position,
    villainPosition: savedHand.villainPosition as Position,
    actions: savedHand.results.map(r => ({
      street: r.street as 'preflop' | 'flop' | 'turn' | 'river',
      player: 'hero' as const,
      action: r.action,
      isCorrect: r.isCorrect,
      gtoAction: r.action,
      gtoFrequency: r.score,
    })),
    finalPot: 0,
    score: savedHand.totalScore,
    timestamp: new Date(savedHand.timestamp).getTime(),
  };
}

export default function ReplayerPage() {
  const { t } = useTranslation();
  const { savedHands, deleteHand } = useUserStore();
  const [selectedHand, setSelectedHand] = useState<ReplayerSavedHand | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'good' | 'bad'>('all');

  // Filter and sort hands
  const filteredHands = useMemo(() => {
    let hands = [...savedHands] as StoreSavedHand[];

    // Filter by score
    if (filterScore === 'good') {
      hands = hands.filter(h => h.totalScore >= 70);
    } else if (filterScore === 'bad') {
      hands = hands.filter(h => h.totalScore < 70);
    }

    // Sort
    if (sortBy === 'date') {
      hands.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      hands.sort((a, b) => b.totalScore - a.totalScore);
    }

    return hands;
  }, [savedHands, sortBy, filterScore]);

  // Stats
  const stats = useMemo(() => {
    if (savedHands.length === 0) return null;
    const hands = savedHands as StoreSavedHand[];
    const avgScore = hands.reduce((sum, h) => sum + h.totalScore, 0) / hands.length;
    const goodHands = hands.filter(h => h.totalScore >= 70).length;
    const badHands = hands.filter(h => h.totalScore < 70).length;
    return { avgScore, goodHands, badHands, total: hands.length };
  }, [savedHands]);

  const parseHeroHand = (handStr: string): [Card, Card] | null => {
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

  const formatDate = (timestamp: string) => {
    const locale = t.common.language === 'en' ? 'en-US' : 'zh-CN';
    return new Date(timestamp).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="replayer-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t.replayer.title}</h1>
          <p>{t.replayer.subtitle}</p>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t.replayer.totalHands}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: getScoreColor(stats.avgScore) }}>
              {stats.avgScore.toFixed(1)}%
            </div>
            <div className="stat-label">{t.replayer.avgScore}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.goodHands}</div>
            <div className="stat-label">{t.replayer.good}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--error)' }}>{stats.badHands}</div>
            <div className="stat-label">{t.replayer.needsWork}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>{t.replayer.sortBy}</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'score')}>
            <option value="date">{t.replayer.date}</option>
            <option value="score">{t.replayer.score}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t.replayer.filter}</label>
          <select value={filterScore} onChange={e => setFilterScore(e.target.value as 'all' | 'good' | 'bad')}>
            <option value="all">{t.replayer.allHands}</option>
            <option value="good">{t.replayer.good}</option>
            <option value="bad">{t.replayer.needsWork}</option>
          </select>
        </div>
      </div>

      {/* Hands list */}
      {filteredHands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <h3>{t.replayer.noHands}</h3>
          <p>{t.replayer.completeToSave}</p>
          <Button variant="primary" onClick={() => window.location.href = '/practice'}>
            {t.replayer.startPractice}
          </Button>
        </div>
      ) : (
        <div className="hands-grid">
          {filteredHands.map(hand => {
            const heroCards = parseHeroHand(hand.heroHand);
            return (
              <div
                key={hand.id}
                className="hand-card"
                onClick={() => setSelectedHand(convertToReplayerFormat(hand))}
              >
                {/* Cards */}
                <div className="hand-cards">
                  {heroCards?.map((card, i) => (
                    <PokerCard key={i} card={card} size="sm" variant="dark" />
                  ))}
                </div>

                {/* Info */}
                <div className="hand-info">
                  <div className="hand-positions">
                    <PositionBadge position={hand.heroPosition as Position} size="sm" />
                    <span className="vs">{t.replayer.vs}</span>
                    <PositionBadge position={hand.villainPosition as Position} size="sm" />
                  </div>
                  <div className="hand-scenario">
                    {hand.scenario === 'rfi' ? 'RFI' : hand.scenario === 'vs_rfi' ? 'vs RFI' : 'vs 3-Bet'}
                  </div>
                  <div className="hand-date">{formatDate(hand.timestamp)}</div>
                </div>

                {/* Score */}
                <div className="hand-score" style={{ color: getScoreColor(hand.totalScore) }}>
                  {hand.totalScore}%
                </div>

                {/* Actions count */}
                <div className="hand-actions-count">
                  {hand.results.length} {t.replayer.actions}
                </div>

                {/* Delete button */}
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t.replayer.deleteConfirm)) {
                      deleteHand(hand.id);
                    }
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Replayer modal */}
      {selectedHand && (
        <HandReplayer
          hand={selectedHand}
          onClose={() => setSelectedHand(null)}
        />
      )}
    </div>
  );
}
