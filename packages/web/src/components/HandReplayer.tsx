'use client';

import { useState, useEffect, useCallback } from 'react';
import { PokerCard, Button, PositionBadge } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card, Position } from '@gto/core';

// Hand action type
interface HandAction {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  player: 'hero' | 'villain';
  action: string;
  amount?: number;
  isCorrect?: boolean;
  gtoAction?: string;
  gtoFrequency?: number;
}

// Saved hand data structure
export interface SavedHand {
  id: string;
  heroHand: string;
  villainHand?: string;
  board: string;
  heroPosition: Position;
  villainPosition: Position;
  actions: HandAction[];
  finalPot: number;
  result?: 'win' | 'lose' | 'tie';
  score: number;
  timestamp: number;
}

interface HandReplayerProps {
  hand: SavedHand;
  onClose?: () => void;
  onExport?: (hand: SavedHand) => void;
}

// Street names in Chinese
const STREET_NAMES: Record<string, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

// Action names in Chinese
const ACTION_NAMES: Record<string, string> = {
  fold: '弃牌',
  check: '过牌',
  call: '跟注',
  bet: '下注',
  raise: '加注',
  allin: '全下',
};

export function HandReplayer({ hand, onClose, onExport }: HandReplayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500); // ms between steps
  const [showGTO, setShowGTO] = useState(true);

  // Parse cards
  const heroCards = parseHand(hand.heroHand);
  const villainCards = hand.villainHand ? parseHand(hand.villainHand) : null;
  const boardCards = parseBoard(hand.board);

  // Get visible board cards at current step
  const getVisibleBoard = useCallback(() => {
    if (currentStep === 0) return [];

    const currentAction = hand.actions[currentStep - 1];
    if (!currentAction) return boardCards;

    switch (currentAction.street) {
      case 'preflop':
        return [];
      case 'flop':
        return boardCards.slice(0, 3);
      case 'turn':
        return boardCards.slice(0, 4);
      case 'river':
        return boardCards;
      default:
        return [];
    }
  }, [currentStep, hand.actions, boardCards]);

  // Get current street
  const getCurrentStreet = useCallback(() => {
    if (currentStep === 0) return 'preflop';
    const currentAction = hand.actions[currentStep - 1];
    return currentAction?.street || 'preflop';
  }, [currentStep, hand.actions]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= hand.actions.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, hand.actions.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentStep(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentStep(prev => Math.min(hand.actions.length, prev + 1));
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hand.actions.length, onClose]);

  // Calculate pot at current step
  const getPotAtStep = useCallback(() => {
    let pot = 1.5; // Initial blinds
    for (let i = 0; i < currentStep && i < hand.actions.length; i++) {
      const action = hand.actions[i];
      if (action.amount) {
        pot += action.amount;
      }
    }
    return pot;
  }, [currentStep, hand.actions]);

  // Export hand as text
  const exportAsText = () => {
    let text = `=== Hand Replay ===\n`;
    text += `Hero: ${hand.heroPosition} - ${hand.heroHand}\n`;
    text += `Villain: ${hand.villainPosition}${hand.villainHand ? ` - ${hand.villainHand}` : ''}\n`;
    text += `Board: ${hand.board || 'N/A'}\n`;
    text += `\n--- Actions ---\n`;

    hand.actions.forEach((action, idx) => {
      const player = action.player === 'hero' ? hand.heroPosition : hand.villainPosition;
      const actionStr = action.amount ? `${action.action} ${action.amount}BB` : action.action;
      const gtoInfo = action.gtoAction ? ` (GTO: ${action.gtoAction} ${action.gtoFrequency}%)` : '';
      const correctMark = action.isCorrect !== undefined ? (action.isCorrect ? ' ✓' : ' ✗') : '';
      text += `${idx + 1}. [${action.street}] ${player}: ${actionStr}${gtoInfo}${correctMark}\n`;
    });

    text += `\nFinal Pot: ${hand.finalPot}BB\n`;
    text += `Score: ${hand.score}%\n`;

    return text;
  };

  const handleExport = () => {
    const text = exportAsText();
    navigator.clipboard.writeText(text).then(() => {
      alert('Hand copied to clipboard!');
    });
    onExport?.(hand);
  };

  const visibleBoard = getVisibleBoard();
  const currentStreet = getCurrentStreet();
  const currentPot = getPotAtStep();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        background: 'var(--surface)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--surface-border)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Hand Replayer</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Table visualization */}
        <div style={{
          padding: '24px',
          background: 'var(--background)',
        }}>
          {/* Street indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {['preflop', 'flop', 'turn', 'river'].map(street => (
              <div
                key={street}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: currentStreet === street ? 'var(--primary)' : 'var(--surface)',
                  color: currentStreet === street ? 'white' : 'var(--text-secondary)',
                }}
              >
                {STREET_NAMES[street]}
              </div>
            ))}
          </div>

          {/* Poker table */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            background: 'linear-gradient(180deg, #1a3d2e 0%, #0d2818 100%)',
            borderRadius: '140px',
            border: '4px solid #2a4a3a',
            marginBottom: '20px',
          }}>
            {/* Villain position */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <PositionBadge position={hand.villainPosition} size="sm" />
              <div style={{ display: 'flex', gap: '4px' }}>
                {villainCards && currentStep >= hand.actions.length ? (
                  villainCards.map((card, i) => (
                    <PokerCard key={i} card={card} size="sm" variant="dark" />
                  ))
                ) : (
                  <>
                    <div style={{
                      width: '40px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                      borderRadius: '4px',
                      border: '1px solid #3a3a4a',
                    }} />
                    <div style={{
                      width: '40px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                      borderRadius: '4px',
                      border: '1px solid #3a3a4a',
                    }} />
                  </>
                )}
              </div>
            </div>

            {/* Center - Pot and Board */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}>
              {/* Pot */}
              <div style={{
                padding: '6px 16px',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--warning)',
              }}>
                Pot: {currentPot.toFixed(1)} BB
              </div>

              {/* Board cards */}
              {visibleBoard.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {visibleBoard.map((card, i) => (
                    <PokerCard key={i} card={card} size="sm" variant="dark" />
                  ))}
                </div>
              )}
            </div>

            {/* Hero position */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {heroCards?.map((card, i) => (
                  <PokerCard key={i} card={card} size="sm" variant="dark" />
                ))}
              </div>
              <PositionBadge position={hand.heroPosition} size="sm" />
            </div>
          </div>
        </div>

        {/* Action timeline */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--surface-border)',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}>
            {/* Start marker */}
            <div
              onClick={() => setCurrentStep(0)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: currentStep === 0 ? 'var(--primary)' : 'var(--surface-hover)',
                color: currentStep === 0 ? 'white' : 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Start
            </div>

            {/* Action steps */}
            {hand.actions.map((action, idx) => {
              const isActive = idx === currentStep - 1;
              const isPast = idx < currentStep - 1;
              const bgColor = isActive
                ? (action.isCorrect === true ? 'var(--success)' : action.isCorrect === false ? 'var(--error)' : 'var(--primary)')
                : isPast
                  ? 'var(--surface-hover)'
                  : 'var(--surface)';

              return (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx + 1)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: bgColor,
                    color: isActive || isPast ? 'white' : 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isActive ? '2px solid white' : '1px solid var(--surface-border)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {action.player === 'hero' ? 'Hero' : 'Villain'}
                  </div>
                  <div>
                    {ACTION_NAMES[action.action] || action.action}
                    {action.amount ? ` ${action.amount}BB` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current action details */}
          {currentStep > 0 && currentStep <= hand.actions.length && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--surface-hover)',
              borderRadius: '8px',
            }}>
              {(() => {
                const action = hand.actions[currentStep - 1];
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                        {action.player === 'hero' ? 'Hero' : 'Villain'} ({action.player === 'hero' ? hand.heroPosition : hand.villainPosition})
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {STREET_NAMES[action.street]} - {ACTION_NAMES[action.action] || action.action}
                        {action.amount ? ` ${action.amount}BB` : ''}
                      </div>
                    </div>
                    {showGTO && action.gtoAction && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GTO 建议</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                          {ACTION_NAMES[action.gtoAction] || action.gtoAction} ({action.gtoFrequency}%)
                        </div>
                      </div>
                    )}
                    {action.isCorrect !== undefined && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: action.isCorrect ? 'var(--success)' : 'var(--error)',
                        color: 'white',
                        fontSize: '16px',
                      }}>
                        {action.isCorrect ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderTop: '1px solid var(--surface-border)',
          background: 'var(--surface)',
        }}>
          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(0)}
              disabled={currentStep === 0}
            >
              ⏮
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              ◀
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸' : '▶'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(prev => Math.min(hand.actions.length, prev + 1))}
              disabled={currentStep >= hand.actions.length}
            >
              ▶
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(hand.actions.length)}
              disabled={currentStep >= hand.actions.length}
            >
              ⏭
            </Button>
          </div>

          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Speed:</span>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--surface-border)',
                borderRadius: '4px',
                color: 'var(--text)',
                fontSize: '12px',
              }}
            >
              <option value={2500}>0.5x</option>
              <option value={1500}>1x</option>
              <option value={1000}>1.5x</option>
              <option value={500}>2x</option>
            </select>
          </div>

          {/* GTO toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show GTO:</span>
            <button
              onClick={() => setShowGTO(!showGTO)}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: showGTO ? 'var(--primary)' : 'var(--surface-hover)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: showGTO ? '20px' : '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Score */}
          <div style={{
            padding: '8px 16px',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Score: </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 700,
              color: hand.score >= 80 ? 'var(--success)' : hand.score >= 60 ? 'var(--warning)' : 'var(--error)',
            }}>
              {hand.score}%
            </span>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid var(--surface-border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Keyboard: ← Previous | → Next | Space Play/Pause | Esc Close
        </div>
      </div>
    </div>
  );
}

// Helper functions
function parseHand(handStr: string): [Card, Card] | null {
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
}

function parseBoard(boardStr: string): Card[] {
  const cards: Card[] = [];
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
}

export default HandReplayer;
