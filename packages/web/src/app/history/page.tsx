'use client';

import { useState, useEffect } from 'react';
import { Card, Button, PokerCard, PositionBadge } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card as CardType, Position } from '@gto/core';

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
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<HandHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<HandHistory | null>(null);

  useEffect(() => {
    fetchHistories();
  }, []);

  const fetchHistories = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.histories) {
        setHistories(data.histories);
      }
    } catch (error) {
      console.error('Failed to fetch histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hand?')) return;

    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistories(histories.filter(h => h.id !== id));
        if (selectedHistory?.id === id) {
          setSelectedHistory(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#a0a0b0',
      }}>
        Loading hand histories...
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '8px',
        }}>
          Hand History
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
          Review your saved hand analyses
        </p>
      </div>

      {histories.length === 0 ? (
        <Card variant="default" padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>
            No hand histories yet
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/analyzer'}>
            Analyze Your First Hand
          </Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedHistory ? '1fr 1fr' : '1fr',
          gap: '24px',
        }}>
          {/* History List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {histories.map(history => {
              const hand = parseHeroHand(history.hero_hand);
              const isSelected = selectedHistory?.id === history.id;

              return (
                <Card
                  key={history.id}
                  variant={isSelected ? 'outlined' : 'default'}
                  padding="md"
                  onClick={() => setSelectedHistory(history)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Cards Preview */}
                      {hand && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <PokerCard card={hand[0]} size="sm" />
                          <PokerCard card={hand[1]} size="sm" />
                        </div>
                      )}

                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}>
                          <PositionBadge
                            position={history.hero_position as Position}
                            size="sm"
                          />
                          <span style={{ color: '#6b6b7b', fontSize: '12px' }}>
                            vs
                          </span>
                          {history.villain_position && (
                            <PositionBadge
                              position={history.villain_position as Position}
                              size="sm"
                            />
                          )}
                        </div>
                        <div style={{ color: '#6b6b7b', fontSize: '12px' }}>
                          {formatDate(history.created_at)} • {history.street}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {history.analysis_result?.equity && (
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#00f5d4',
                        }}>
                          {(history.analysis_result.equity * 100).toFixed(1)}%
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistory(history.id);
                        }}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selectedHistory && (
            <Card variant="outlined" padding="lg">
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#00f5d4',
                marginBottom: '16px',
              }}>
                Hand Details
              </h2>

              {/* Cards */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#a0a0b0',
                  marginBottom: '8px',
                }}>
                  Hole Cards
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {parseHeroHand(selectedHistory.hero_hand)?.map((card, i) => (
                    <PokerCard key={i} card={card} size="lg" />
                  ))}
                </div>
              </div>

              {/* Board */}
              {selectedHistory.board && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a0a0b0',
                    marginBottom: '8px',
                  }}>
                    Board
                  </label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {parseBoard(selectedHistory.board).map((card, i) => (
                      <PokerCard key={i} card={card} size="md" />
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <div style={{
                  padding: '12px',
                  background: '#1a1a24',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Pot</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                    {selectedHistory.pot_size} BB
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#1a1a24',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Stack</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                    {selectedHistory.stack_size} BB
                  </div>
                </div>
              </div>

              {/* Analysis Result */}
              {selectedHistory.analysis_result && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a0a0b0',
                    marginBottom: '8px',
                  }}>
                    Analysis
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}>
                    {selectedHistory.analysis_result.equity && (
                      <div style={{
                        padding: '12px',
                        background: '#1a1a24',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Equity</div>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 700,
                          color: '#00f5d4',
                        }}>
                          {(selectedHistory.analysis_result.equity * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {selectedHistory.analysis_result.ev !== undefined && (
                      <div style={{
                        padding: '12px',
                        background: '#1a1a24',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '12px', color: '#a0a0b0' }}>EV</div>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 700,
                          color: selectedHistory.analysis_result.ev >= 0 ? '#00f5d4' : '#ff6b6b',
                        }}>
                          {selectedHistory.analysis_result.ev >= 0 ? '+' : ''}
                          {selectedHistory.analysis_result.ev.toFixed(2)} BB
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedHistory.notes && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a0a0b0',
                    marginBottom: '8px',
                  }}>
                    Notes
                  </label>
                  <div style={{
                    padding: '12px',
                    background: '#1a1a24',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {selectedHistory.notes}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
