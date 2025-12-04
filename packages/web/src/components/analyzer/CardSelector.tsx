'use client';

import { useState, useCallback } from 'react';
import { RANKS, SUITS, parseCard } from '@gto/core';
import type { Card as CardType, Street } from '@gto/core';

const SUIT_SYMBOLS: Record<string, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const SUIT_LABELS: Record<string, string> = {
  h: 'h (Hearts)',
  d: 'd (Diamonds)',
  c: 'c (Clubs)',
  s: 's (Spades)',
};

const SUIT_COLORS: Record<string, string> = {
  h: '#ef4444',
  d: '#3b82f6',
  c: '#22c55e',
  s: '#ffffff',
};

interface CardSelectorProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  street: Street;
  selectionMode: 'hero' | 'board';
  onSelectionModeChange: (mode: 'hero' | 'board') => void;
  onHeroHandChange: (hand: [CardType, CardType] | null) => void;
  onBoardChange: (board: CardType[]) => void;
  isMobile?: boolean;
}

export function CardSelector({
  heroHand,
  board,
  street,
  selectionMode,
  onSelectionModeChange,
  onHeroHandChange,
  onBoardChange,
  isMobile = false,
}: CardSelectorProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [quickInput, setQuickInput] = useState('');

  // Check if card is used
  const isCardUsed = useCallback((rank: string, suit: string) => {
    const cardStr = `${rank}${suit}`;
    if (selectedCards.includes(cardStr)) return true;
    if (heroHand?.some(c => c.rank === rank && c.suit === suit)) return true;
    if (board.some(c => c.rank === rank && c.suit === suit)) return true;
    return false;
  }, [selectedCards, heroHand, board]);

  // Handle card selection
  const handleCardSelect = useCallback((rank: string, suit: string) => {
    const cardStr = `${rank}${suit}`;

    if (selectedCards.includes(cardStr)) {
      setSelectedCards(selectedCards.filter(c => c !== cardStr));
      return;
    }

    if (selectionMode === 'hero' && selectedCards.length < 2) {
      const newCards = [...selectedCards, cardStr];
      setSelectedCards(newCards);

      if (newCards.length === 2) {
        const hand = [parseCard(newCards[0]), parseCard(newCards[1])] as [CardType, CardType];
        onHeroHandChange(hand);
        setSelectedCards([]);
        onSelectionModeChange('board');
      }
    } else if (selectionMode === 'board') {
      const maxBoardCards = street === 'flop' ? 3 : street === 'turn' ? 4 : street === 'river' ? 5 : 0;
      if (board.length < maxBoardCards) {
        const newCard = parseCard(cardStr);
        onBoardChange([...board, newCard]);
      }
    }
  }, [selectedCards, selectionMode, board, street, onHeroHandChange, onBoardChange, onSelectionModeChange]);

  // Parse quick input (e.g., "AhKs" or "Ah Ks" or "AhKs QcJdTh")
  const parseQuickInput = useCallback((input: string) => {
    const cleaned = input.toUpperCase().replace(/\s+/g, '');
    const cards: string[] = [];

    // Parse cards in format like "AhKs"
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i + 1 < cleaned.length) {
        const rank = cleaned[i];
        const suit = cleaned[i + 1].toLowerCase();
        if (RANKS.includes(rank as typeof RANKS[number]) && SUITS.includes(suit as typeof SUITS[number])) {
          cards.push(`${rank}${suit}`);
        }
      }
    }

    if (cards.length >= 2) {
      // First 2 cards are hero hand
      const hand = [parseCard(cards[0]), parseCard(cards[1])] as [CardType, CardType];
      onHeroHandChange(hand);
      onSelectionModeChange('board');

      // Remaining cards are board
      if (cards.length > 2) {
        const boardCards = cards.slice(2).map(c => parseCard(c));
        onBoardChange(boardCards);
      }

      setQuickInput('');
    }
  }, [onHeroHandChange, onBoardChange, onSelectionModeChange]);

  return (
    <div className="card-selector">
      <style jsx>{`
        .card-selector {
          background: #12121a;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .selector-title {
          font-size: 12px;
          font-weight: 500;
          color: #fff;
        }

        .selector-mode {
          display: flex;
          gap: 6px;
        }

        .mode-btn {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
          color: #666;
          border: 1px solid transparent;
        }

        .mode-btn.active {
          background: rgba(34, 211, 191, 0.15);
          color: #22d3bf;
          border-color: rgba(34, 211, 191, 0.3);
        }

        .quick-input-section {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .quick-input {
          flex: 1;
          min-width: 180px;
          max-width: 300px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 12px;
          font-family: 'SF Mono', monospace;
          outline: none;
          transition: all 0.15s;
        }

        .quick-input::placeholder {
          color: #555;
        }

        .quick-input:focus {
          border-color: #22d3bf;
          background: rgba(34, 211, 191, 0.05);
        }

        .quick-input-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: #22d3bf;
          color: #000;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-input-btn:hover {
          filter: brightness(1.1);
        }

        .quick-input-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .suit-rows {
          display: flex;
          flex-direction: column;
          gap: ${isMobile ? '6px' : '8px'};
          flex: 1;
          justify-content: flex-start;
          padding-top: 8px;
        }

        .suit-row {
          display: flex;
          gap: ${isMobile ? '4px' : '6px'};
          align-items: center;
          justify-content: flex-start;
        }

        .suit-icon {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: ${isMobile ? '70px' : '100px'};
          flex-shrink: 0;
        }

        .suit-symbol {
          font-size: ${isMobile ? '16px' : '20px'};
          width: 20px;
          text-align: center;
        }

        .suit-label {
          font-size: ${isMobile ? '10px' : '11px'};
          color: #666;
          white-space: nowrap;
        }

        .card-btn {
          width: ${isMobile ? '32px' : '44px'};
          height: ${isMobile ? '38px' : '48px'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isMobile ? '14px' : '18px'};
          font-weight: 700;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.1s;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #1a1a24;
          flex-shrink: 0;
        }

        .card-btn:hover:not(.used):not(.selected) {
          transform: scale(1.1);
          background: #2a2a34;
        }

        .card-btn.selected {
          background: #22d3bf;
          color: #000;
        }

        .card-btn.used {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>

      <div className="selector-header">
        <span className="selector-title">选择卡牌</span>
        <div className="selector-mode">
          <button
            className={`mode-btn ${selectionMode === 'hero' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('hero')}
          >
            手牌 {heroHand ? '✓' : `(${selectedCards.length}/2)`}
          </button>
          <button
            className={`mode-btn ${selectionMode === 'board' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('board')}
            disabled={!heroHand}
          >
            公共牌 ({board.length}/{street === 'flop' ? 3 : street === 'turn' ? 4 : street === 'river' ? 5 : 0})
          </button>
        </div>
      </div>

      {/* Quick Input */}
      <div className="quick-input-section">
        <input
          type="text"
          className="quick-input"
          placeholder="快速输入: AhKs 或 AhKs QcJdTh"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              parseQuickInput(quickInput);
            }
          }}
        />
        <button
          className="quick-input-btn"
          onClick={() => parseQuickInput(quickInput)}
          disabled={quickInput.length < 4}
        >
          确认
        </button>
      </div>

      <div className="suit-rows">
        {SUITS.map(suit => (
          <div key={suit} className="suit-row">
            <div className="suit-icon">
              <span className="suit-symbol" style={{ color: SUIT_COLORS[suit] }}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="suit-label">{SUIT_LABELS[suit]}</span>
            </div>
            {RANKS.map(rank => {
              const used = isCardUsed(rank, suit);
              const selected = selectedCards.includes(`${rank}${suit}`);
              return (
                <button
                  key={`${rank}${suit}`}
                  className={`card-btn ${selected ? 'selected' : ''} ${used && !selected ? 'used' : ''}`}
                  style={{ color: !selected ? SUIT_COLORS[suit] : undefined }}
                  onClick={() => !used && handleCardSelect(rank, suit)}
                  disabled={used && !selected}
                >
                  {rank}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
