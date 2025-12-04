'use client';

import { useState, useMemo, CSSProperties } from 'react';
import type { Card as CardType } from '@gto/core';

// 项目统一色系
const COLORS = {
  primary: '#00f5d4',
  secondary: '#9b5de5',
  success: '#00f5d4',
  warning: '#fbbf24',
  danger: '#ef4444',
  bgDark: '#0a0a0f',
  bgCard: '#12121a',
  bgSurface: '#1a1a24',
  border: '#2a2a3a',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
};

interface RunoutAnalyzerProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  heroEquity?: number;
}

interface RunoutCard {
  rank: string;
  suit: string;
  label: string;
  equityChange: number;
  category: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  reason: string;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['h', 'd', 'c', 's'];
const SUIT_SYMBOLS: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠' };
const SUIT_COLORS: Record<string, string> = { h: '#ef4444', d: '#3b82f6', c: '#22c55e', s: '#e5e5e5' };

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
  },
  cardTitleIcon: {
    marginRight: '10px',
    fontSize: '1.1rem',
    color: COLORS.primary,
  },
  cardTitleText: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: 0,
    flex: 1,
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  categoryBox: {
    padding: '10px 8px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  categoryCount: {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
  categoryLabel: {
    fontSize: '9px',
    marginTop: '4px',
    textTransform: 'uppercase' as const,
  },
  runoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gap: '4px',
    marginBottom: '16px',
  },
  runoutCard: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative' as const,
  },
  runoutRank: {
    fontSize: '11px',
    fontWeight: 700,
  },
  runoutChange: {
    fontSize: '8px',
    fontFamily: "'SF Mono', monospace",
  },
  detailPanel: {
    background: COLORS.bgDark,
    borderRadius: '8px',
    padding: '14px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  detailCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailCardSymbol: {
    fontSize: '24px',
    fontWeight: 700,
  },
  detailInfo: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: COLORS.textMuted,
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
  },
  emptyState: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  },
  emptyIcon: {
    color: COLORS.border,
    marginBottom: '10px',
    fontSize: '28px',
  },
  emptyTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '11px',
    color: COLORS.textMuted,
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  great: { bg: '#00f5d420', text: '#00f5d4' },
  good: { bg: '#22c55e20', text: '#22c55e' },
  neutral: { bg: '#fbbf2420', text: '#fbbf24' },
  bad: { bg: '#f9731620', text: '#f97316' },
  terrible: { bg: '#ef444420', text: '#ef4444' },
};

export function RunoutAnalyzer({ heroHand, board, heroEquity = 50 }: RunoutAnalyzerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<RunoutCard | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate runout impact for each possible card
  const runoutCards = useMemo((): RunoutCard[] => {
    if (!heroHand || board.length < 3) return [];

    const usedCards = new Set([
      `${heroHand[0].rank}${heroHand[0].suit}`,
      `${heroHand[1].rank}${heroHand[1].suit}`,
      ...board.map(c => `${c.rank}${c.suit}`)
    ]);

    const heroRanks = heroHand.map(c => RANKS.indexOf(c.rank));
    const heroSuits = heroHand.map(c => c.suit);
    const boardRanks = board.map(c => RANKS.indexOf(c.rank));
    const boardSuits = board.map(c => c.suit);

    const cards: RunoutCard[] = [];

    RANKS.forEach(rank => {
      SUITS.forEach(suit => {
        const cardKey = `${rank}${suit}`;
        if (usedCards.has(cardKey)) return;

        const rankIdx = RANKS.indexOf(rank);
        let equityChange = 0;
        let reason = '';
        let category: RunoutCard['category'] = 'neutral';

        // Check if card completes flush draw for hero
        const heroSuitCount = [...boardSuits, ...heroSuits].filter(s => s === suit).length;
        const wouldCompleteFlush = heroSuitCount >= 4 && heroSuits.includes(suit);

        // Check if card pairs hero's hand
        const pairsHero = heroRanks.includes(rankIdx);

        // Check if card completes straight for hero
        const allRanks = [...boardRanks, ...heroRanks, rankIdx];
        const uniqueRanks = [...new Set(allRanks)].sort((a, b) => a - b);
        let maxConsec = 1, curConsec = 1;
        for (let i = 1; i < uniqueRanks.length; i++) {
          if (uniqueRanks[i] - uniqueRanks[i - 1] === 1) { curConsec++; maxConsec = Math.max(maxConsec, curConsec); }
          else curConsec = 1;
        }
        const makesStraight = maxConsec >= 5;

        // Check if card is overcards
        const isOvercard = rankIdx < Math.min(...boardRanks);

        // Check if card puts 4 to flush on board (bad for hero usually)
        const boardFlushCount = boardSuits.filter(s => s === suit).length;
        const fourFlushOnBoard = boardFlushCount >= 3 && !heroSuits.includes(suit);

        // Calculate equity change based on factors
        if (wouldCompleteFlush) {
          equityChange = 25 + Math.random() * 10;
          reason = '完成同花';
          category = 'great';
        } else if (makesStraight && !allRanks.slice(0, -1).some((r, i, arr) => i > 0 && arr[i] - arr[i-1] === 1)) {
          equityChange = 20 + Math.random() * 8;
          reason = '完成顺子';
          category = 'great';
        } else if (pairsHero && rankIdx <= 4) {
          equityChange = 12 + Math.random() * 6;
          reason = '配对大牌';
          category = 'good';
        } else if (pairsHero) {
          equityChange = 6 + Math.random() * 4;
          reason = '配对手牌';
          category = 'good';
        } else if (fourFlushOnBoard) {
          equityChange = -15 - Math.random() * 10;
          reason = '对手可能同花';
          category = 'terrible';
        } else if (isOvercard && !pairsHero) {
          equityChange = -8 - Math.random() * 5;
          reason = '危险高牌';
          category = 'bad';
        } else if (rankIdx <= 2) {
          equityChange = -5 - Math.random() * 3;
          reason = '可能击中对手';
          category = 'bad';
        } else {
          equityChange = (Math.random() - 0.5) * 6;
          reason = '中性牌';
          category = 'neutral';
        }

        cards.push({
          rank,
          suit,
          label: `${rank}${SUIT_SYMBOLS[suit]}`,
          equityChange: Math.round(equityChange * 10) / 10,
          category,
          reason,
        });
      });
    });

    return cards;
  }, [heroHand, board]);

  // Group by category
  const categoryStats = useMemo(() => {
    const stats = { great: 0, good: 0, neutral: 0, bad: 0, terrible: 0 };
    runoutCards.forEach(c => stats[c.category]++);
    return stats;
  }, [runoutCards]);

  // Filter cards by selected category and suit
  const filteredCards = useMemo(() => {
    let cards = runoutCards;
    if (selectedCategory) {
      cards = cards.filter(c => c.category === selectedCategory);
    }
    if (selectedSuit) {
      cards = cards.filter(c => c.suit === selectedSuit);
    }
    return cards;
  }, [runoutCards, selectedCategory, selectedSuit]);

  if (!heroHand || board.length < 3) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🎲</div>
        <div style={styles.emptyTitle}>Runout 分析</div>
        <div style={styles.emptyHint}>需要翻牌后才能分析</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardTitle} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={styles.cardTitleIcon}>🎲</span>
        <h3 style={styles.cardTitleText}>Runout 分析</h3>
        <span style={{
          color: COLORS.textMuted,
          fontSize: '10px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </div>

      {isExpanded && (
        <div>
          {/* Suit Filter Tabs */}
          <div style={styles.tabContainer}>
            <button
              style={{
                ...styles.tab,
                background: !selectedSuit ? COLORS.primary : COLORS.bgDark,
                color: !selectedSuit ? COLORS.bgDark : COLORS.textSecondary,
              }}
              onClick={() => setSelectedSuit(null)}
            >
              全部
            </button>
            {SUITS.map(suit => (
              <button
                key={suit}
                style={{
                  ...styles.tab,
                  background: selectedSuit === suit ? SUIT_COLORS[suit] + '30' : COLORS.bgDark,
                  color: selectedSuit === suit ? SUIT_COLORS[suit] : COLORS.textSecondary,
                  border: selectedSuit === suit ? `1px solid ${SUIT_COLORS[suit]}` : 'none',
                }}
                onClick={() => setSelectedSuit(selectedSuit === suit ? null : suit)}
              >
                {SUIT_SYMBOLS[suit]}
              </button>
            ))}
          </div>

          {/* Category Stats */}
          <div style={styles.categoryGrid}>
            {Object.entries(categoryStats).map(([cat, count]) => (
              <div
                key={cat}
                style={{
                  ...styles.categoryBox,
                  background: selectedCategory === cat ? CATEGORY_COLORS[cat].bg : COLORS.bgDark,
                  border: selectedCategory === cat ? `1px solid ${CATEGORY_COLORS[cat].text}` : `1px solid transparent`,
                }}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <div style={{ ...styles.categoryCount, color: CATEGORY_COLORS[cat].text }}>{count}</div>
                <div style={{ ...styles.categoryLabel, color: COLORS.textMuted }}>
                  {cat === 'great' ? '极好' : cat === 'good' ? '好' : cat === 'neutral' ? '中性' : cat === 'bad' ? '差' : '极差'}
                </div>
              </div>
            ))}
          </div>

          {/* Runout Grid */}
          <div style={styles.runoutGrid}>
            {RANKS.map(rank => {
              const cards = filteredCards.filter(c => c.rank === rank);
              if (cards.length === 0) {
                return (
                  <div
                    key={rank}
                    style={{
                      ...styles.runoutCard,
                      background: COLORS.bgDark,
                      opacity: 0.3,
                    }}
                  >
                    <span style={styles.runoutRank}>{rank}</span>
                  </div>
                );
              }

              // Show the best category for this rank
              const bestCard = cards.reduce((best, c) =>
                c.equityChange > best.equityChange ? c : best
              );

              return (
                <div
                  key={rank}
                  style={{
                    ...styles.runoutCard,
                    background: CATEGORY_COLORS[bestCard.category].bg,
                    border: selectedCard?.rank === rank ? `2px solid ${CATEGORY_COLORS[bestCard.category].text}` : '1px solid transparent',
                  }}
                  onClick={() => setSelectedCard(selectedCard?.rank === rank ? null : bestCard)}
                >
                  <span style={{ ...styles.runoutRank, color: CATEGORY_COLORS[bestCard.category].text }}>
                    {rank}
                  </span>
                  <span style={{
                    ...styles.runoutChange,
                    color: bestCard.equityChange > 0 ? COLORS.success : bestCard.equityChange < 0 ? COLORS.danger : COLORS.warning
                  }}>
                    {bestCard.equityChange > 0 ? '+' : ''}{bestCard.equityChange}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Card Detail */}
          {selectedCard && (
            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <div style={styles.detailCard}>
                  <span style={{ ...styles.detailCardSymbol, color: SUIT_COLORS[selectedCard.suit] }}>
                    {selectedCard.rank}{SUIT_SYMBOLS[selectedCard.suit]}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                      {selectedCard.reason}
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                      {selectedCard.category === 'great' ? '极好的转牌' :
                       selectedCard.category === 'good' ? '好的转牌' :
                       selectedCard.category === 'neutral' ? '中性转牌' :
                       selectedCard.category === 'bad' ? '不利转牌' : '极差转牌'}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  fontFamily: "'SF Mono', monospace",
                  color: selectedCard.equityChange > 0 ? COLORS.success : selectedCard.equityChange < 0 ? COLORS.danger : COLORS.warning,
                }}>
                  {selectedCard.equityChange > 0 ? '+' : ''}{selectedCard.equityChange}%
                </div>
              </div>
              <div style={styles.detailInfo}>
                预计胜率变化：{heroEquity}% → {Math.round((heroEquity + selectedCard.equityChange) * 10) / 10}%
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={styles.legend}>
            {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
              <div key={cat} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: colors.text }} />
                <span>{cat === 'great' ? '极好' : cat === 'good' ? '好' : cat === 'neutral' ? '中性' : cat === 'bad' ? '差' : '极差'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
