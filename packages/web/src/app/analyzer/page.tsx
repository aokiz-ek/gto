'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PokerCard, ActionButton, RangeMatrix, Skeleton, SkeletonGroup } from '@gto/ui';
import { useGameStore } from '@/store';
import { parseCard, RANKS, SUITS, createEmptyMatrix, setMatrixValue, HAND_CATEGORIES } from '@gto/core';
import type { Card as CardType, Position, Street } from '@gto/core';
import { useResponsive } from '@/hooks';

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

const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river'];
const STREET_LABELS: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

// Street analysis result
interface StreetAnalysis {
  street: Street;
  actions: { action: string; frequency: number; ev: number }[];
  equity: number;
  potOdds: number;
}

// Analysis result type
interface AnalysisResult {
  actions: { action: string; frequency: number; ev: number }[];
  equity: number;
  potOdds: number;
  spr: number;
  villainRange: number;
  combos: number;
  streetAnalysis?: StreetAnalysis[];
}

// Analysis history item
interface HistoryItem {
  id: string;
  timestamp: number;
  heroHand: [CardType, CardType];
  board: CardType[];
  heroPosition: Position;
  villainPosition: Position;
  street: Street;
  result: AnalysisResult;
}

// Step definition for guided flow
type Step = 'position' | 'hero' | 'board' | 'complete';

export default function AnalyzerPage() {
  const {
    street,
    board,
    heroHand,
    heroPosition,
    villainPosition,
    setStreet,
    setBoard,
    setHeroHand,
    setHeroPosition,
    setVillainPosition,
  } = useGameStore();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'hero' | 'board'>('hero');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const hasAutoAnalyzed = useRef(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { isMobile, isMobileOrTablet } = useResponsive();

  // Handle tooltip positioning
  const handleTooltipEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 220;
    const padding = 12;

    // Calculate position - prefer below and to the left
    let x = rect.left - tooltipWidth + rect.width + padding;
    let y = rect.bottom + 8;

    // Ensure tooltip doesn't go off screen
    if (x < padding) x = padding;
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth - padding;
    }
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = rect.top - tooltipHeight - 8;
    }

    setTooltipPos({ x, y });
  };

  const handleTooltipLeave = () => {
    setTooltipPos(null);
  };

  // Determine current step
  const getCurrentStep = useCallback((): Step => {
    if (!heroPosition || !villainPosition) return 'position';
    if (!heroHand) return 'hero';
    if (street !== 'preflop') {
      const requiredCards = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
      if (board.length < requiredCards) return 'board';
    }
    return 'complete';
  }, [heroPosition, villainPosition, heroHand, street, board.length]);

  const currentStep = getCurrentStep();

  // Step hints
  const getStepHint = (): string => {
    switch (currentStep) {
      case 'position': return '第1步：选择你和对手的位置';
      case 'hero': return '第2步：选择你的两张手牌';
      case 'board': {
        const requiredCards = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
        return `第3步：选择${requiredCards}张公共牌 (${board.length}/${requiredCards})`;
      }
      case 'complete': return '✓ 分析完成';
    }
  };

  // Check if ready for analysis
  const isReadyForAnalysis = currentStep === 'complete';

  // Generate villain range based on position
  const getVillainRange = useCallback((pos: Position | null) => {
    const matrix = createEmptyMatrix();
    if (!pos) return matrix;

    // Different ranges for different positions
    const positionRanges: Record<Position, { premium: number; strong: number; playable: number }> = {
      'UTG': { premium: 1, strong: 0.8, playable: 0.3 },
      'HJ': { premium: 1, strong: 0.85, playable: 0.4 },
      'CO': { premium: 1, strong: 0.9, playable: 0.55 },
      'BTN': { premium: 1, strong: 0.95, playable: 0.7 },
      'SB': { premium: 1, strong: 0.9, playable: 0.5 },
      'BB': { premium: 1, strong: 0.95, playable: 0.6 },
      'UTG1': { premium: 1, strong: 0.8, playable: 0.35 },
      'UTG2': { premium: 1, strong: 0.82, playable: 0.38 },
      'LJ': { premium: 1, strong: 0.85, playable: 0.45 },
    };

    const range = positionRanges[pos] || { premium: 1, strong: 0.9, playable: 0.5 };
    HAND_CATEGORIES.PREMIUM.forEach(hand => setMatrixValue(matrix, hand, range.premium));
    HAND_CATEGORIES.STRONG.forEach(hand => setMatrixValue(matrix, hand, range.strong));
    HAND_CATEGORIES.PLAYABLE.forEach(hand => setMatrixValue(matrix, hand, range.playable));

    return matrix;
  }, []);

  const villainRange = getVillainRange(villainPosition);

  // Analyze hand
  const analyzeHand = useCallback(async (isAuto = false) => {
    if (!heroHand || !heroPosition || !villainPosition) return;

    // Prevent duplicate auto analysis
    if (isAuto && hasAutoAnalyzed.current) return;
    if (isAuto) hasAutoAnalyzed.current = true;

    setIsAnalyzing(true);

    try {
      // Call analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroHand: heroHand.map(c => `${c.rank}${c.suit}`),
          board: board.map(c => `${c.rank}${c.suit}`),
          heroPosition,
          villainPosition,
          street,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Generate street-by-street analysis based on API response
          const baseEquity = data.analysis.equity || 50;
          const basePotOdds = data.analysis.potOdds || 25;
          const baseActions = data.analysis.actions || [];

          const streetAnalysis: StreetAnalysis[] = [
            {
              street: 'preflop',
              actions: baseActions.length > 0 ? baseActions : [
                { action: 'raise', frequency: 0.70, ev: 1.2 },
                { action: 'call', frequency: 0.20, ev: 0.4 },
                { action: 'fold', frequency: 0.10, ev: 0 },
              ],
              equity: Math.max(baseEquity - 8, 30),
              potOdds: 0,
            },
            {
              street: 'flop',
              actions: [
                { action: 'bet', frequency: 0.60, ev: 1.8 },
                { action: 'check', frequency: 0.40, ev: 0.6 },
              ],
              equity: baseEquity,
              potOdds: basePotOdds,
            },
            {
              street: 'turn',
              actions: [
                { action: 'bet', frequency: 0.50, ev: 2.5 },
                { action: 'check', frequency: 0.50, ev: 1.2 },
              ],
              equity: Math.min(baseEquity + 5, 85),
              potOdds: Math.max(basePotOdds - 5, 15),
            },
            {
              street: 'river',
              actions: [
                { action: 'bet', frequency: 0.45, ev: 3.8 },
                { action: 'check', frequency: 0.55, ev: 2.2 },
              ],
              equity: Math.min(baseEquity + 10, 90),
              potOdds: Math.max(basePotOdds - 8, 12),
            },
          ];

          const analysisWithStreets = {
            ...data.analysis,
            streetAnalysis,
          };

          setAnalysisResult(analysisWithStreets);

          // Add to history
          const historyItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            heroHand,
            board: [...board],
            heroPosition,
            villainPosition,
            street,
            result: analysisWithStreets,
          };
          setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
        }
      } else {
        // Fallback to mock data with street analysis
        setAnalysisResult({
          actions: [
            { action: 'raise', frequency: 0.65, ev: 2.8 },
            { action: 'call', frequency: 0.25, ev: 1.2 },
            { action: 'fold', frequency: 0.10, ev: 0 },
          ],
          equity: 62.3,
          potOdds: 33.3,
          spr: 4.2,
          villainRange: 18.5,
          combos: 248,
          streetAnalysis: [
            {
              street: 'preflop',
              actions: [
                { action: 'raise', frequency: 0.85, ev: 1.5 },
                { action: 'call', frequency: 0.10, ev: 0.3 },
                { action: 'fold', frequency: 0.05, ev: 0 },
              ],
              equity: 58.2,
              potOdds: 0,
            },
            {
              street: 'flop',
              actions: [
                { action: 'bet', frequency: 0.70, ev: 2.1 },
                { action: 'check', frequency: 0.30, ev: 0.8 },
              ],
              equity: 62.3,
              potOdds: 33.3,
            },
            {
              street: 'turn',
              actions: [
                { action: 'bet', frequency: 0.55, ev: 3.2 },
                { action: 'check', frequency: 0.45, ev: 1.5 },
              ],
              equity: 68.5,
              potOdds: 25.0,
            },
            {
              street: 'river',
              actions: [
                { action: 'bet', frequency: 0.40, ev: 4.5 },
                { action: 'check', frequency: 0.60, ev: 2.8 },
              ],
              equity: 72.1,
              potOdds: 20.0,
            },
          ],
        });
      }
    } catch {
      // Mock fallback with street analysis
      setAnalysisResult({
        actions: [
          { action: 'raise', frequency: 0.65, ev: 2.8 },
          { action: 'call', frequency: 0.25, ev: 1.2 },
          { action: 'fold', frequency: 0.10, ev: 0 },
        ],
        equity: 62.3,
        potOdds: 33.3,
        spr: 4.2,
        villainRange: 18.5,
        combos: 248,
        streetAnalysis: [
          {
            street: 'preflop',
            actions: [
              { action: 'raise', frequency: 0.85, ev: 1.5 },
              { action: 'call', frequency: 0.10, ev: 0.3 },
              { action: 'fold', frequency: 0.05, ev: 0 },
            ],
            equity: 58.2,
            potOdds: 0,
          },
          {
            street: 'flop',
            actions: [
              { action: 'bet', frequency: 0.70, ev: 2.1 },
              { action: 'check', frequency: 0.30, ev: 0.8 },
            ],
            equity: 62.3,
            potOdds: 33.3,
          },
          {
            street: 'turn',
            actions: [
              { action: 'bet', frequency: 0.55, ev: 3.2 },
              { action: 'check', frequency: 0.45, ev: 1.5 },
            ],
            equity: 68.5,
            potOdds: 25.0,
          },
          {
            street: 'river',
            actions: [
              { action: 'bet', frequency: 0.40, ev: 4.5 },
              { action: 'check', frequency: 0.60, ev: 2.8 },
            ],
            equity: 72.1,
            potOdds: 20.0,
          },
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [heroHand, heroPosition, villainPosition, board, street]);

  // Handle card selection
  const handleCardSelect = (rank: string, suit: string) => {
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
        setHeroHand(hand);
        setSelectedCards([]);
        setSelectionMode('board');
      }
    } else if (selectionMode === 'board') {
      const maxBoardCards = street === 'flop' ? 3 : street === 'turn' ? 4 : street === 'river' ? 5 : 0;
      if (board.length < maxBoardCards) {
        const newCard = parseCard(cardStr);
        setBoard([...board, newCard]);
      }
    }
  };

  // Check if card is used
  const isCardUsed = (rank: string, suit: string) => {
    const cardStr = `${rank}${suit}`;
    if (selectedCards.includes(cardStr)) return true;
    if (heroHand?.some(c => c.rank === rank && c.suit === suit)) return true;
    if (board.some(c => c.rank === rank && c.suit === suit)) return true;
    return false;
  };

  // Auto-analyze when ready
  useEffect(() => {
    if (isReadyForAnalysis && !analysisResult && !isAnalyzing) {
      analyzeHand(true);
    }
  }, [isReadyForAnalysis, analysisResult, isAnalyzing, analyzeHand]);

  // Reset auto-analyze flag when conditions change
  useEffect(() => {
    if (!isReadyForAnalysis) {
      hasAutoAnalyzed.current = false;
    }
  }, [isReadyForAnalysis]);

  // Parse quick input (e.g., "AhKs" or "Ah Ks" or "AhKs QcJdTh")
  const parseQuickInput = (input: string) => {
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
      setHeroHand(hand);
      setSelectionMode('board');

      // Remaining cards are board
      if (cards.length > 2) {
        const boardCards = cards.slice(2).map(c => parseCard(c));
        setBoard(boardCards);
      }

      setQuickInput('');
      hasAutoAnalyzed.current = false;
    }
  };

  // Clear all
  const clearAll = () => {
    setSelectedCards([]);
    setHeroHand(null);
    setBoard([]);
    setSelectionMode('hero');
    setAnalysisResult(null);
    setQuickInput('');
    hasAutoAnalyzed.current = false;
  };

  // Load history item
  const loadHistoryItem = (item: HistoryItem) => {
    setHeroHand(item.heroHand);
    setBoard(item.board);
    setHeroPosition(item.heroPosition);
    setVillainPosition(item.villainPosition);
    setStreet(item.street);
    setAnalysisResult(item.result);
    setShowHistory(false);
    hasAutoAnalyzed.current = true; // Don't re-analyze loaded items
  };

  // Remove hero hand
  const removeHeroHand = () => {
    setHeroHand(null);
    setBoard([]);
    setSelectionMode('hero');
    setAnalysisResult(null);
    hasAutoAnalyzed.current = false;
  };

  // Remove board card
  const removeBoardCard = (index: number) => {
    const newBoard = board.filter((_, i) => i !== index);
    setBoard(newBoard);
    setAnalysisResult(null);
    hasAutoAnalyzed.current = false;
  };

  return (
    <div className="analyzer-container">
      <style jsx>{`
        .analyzer-container {
          height: calc(100vh - 56px);
          background: #0a0a0f;
          padding: ${isMobile ? '8px' : '12px'};
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .analyzer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-title {
          font-size: ${isMobile ? '16px' : '18px'};
          font-weight: 600;
          color: #fff;
        }

        .step-hint-inline {
          font-size: 12px;
          color: #22d3bf;
          padding: 4px 10px;
          background: rgba(34, 211, 191, 0.1);
          border-radius: 4px;
        }

        .header-actions {
          display: flex;
          gap: 6px;
        }

        .btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.05);
          color: #888;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-primary {
          background: linear-gradient(135deg, #22d3bf 0%, #1eb8a6 100%);
          color: #000;
          font-weight: 600;
        }

        .btn-primary:hover {
          filter: brightness(1.1);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .main-grid {
          display: grid;
          grid-template-columns: ${isMobileOrTablet ? '1fr' : '6fr 4fr'};
          gap: 12px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .left-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }

        /* Setup Card */
        .setup-card {
          background: #12121a;
          border-radius: 10px;
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .setup-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .setup-label {
          font-size: 11px;
          color: #666;
          min-width: 50px;
        }

        .position-chips {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .position-chip {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: rgba(255, 255, 255, 0.05);
          color: #888;
          border: 1px solid transparent;
        }

        .position-chip:hover {
          background: rgba(34, 211, 191, 0.1);
          color: #22d3bf;
        }

        .position-chip.active {
          background: #22d3bf;
          color: #000;
        }

        .street-chips {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.03);
          padding: 2px;
          border-radius: 6px;
        }

        .street-chip {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
          color: #666;
          border: none;
        }

        .street-chip:hover {
          color: #fff;
        }

        .street-chip.active {
          background: #3b82f6;
          color: #fff;
        }

        /* Combined Setup Row */
        .combined-setup {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .setup-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Hand Display */
        .hand-display {
          display: flex;
          gap: ${isMobile ? '16px' : '24px'};
          align-items: flex-start;
          padding: 8px 0;
        }

        .hand-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hand-label {
          font-size: 11px;
          color: #888;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cards-row {
          display: flex;
          gap: 4px;
        }

        .click-hint {
          font-size: 9px;
          color: #555;
          font-weight: 400;
        }

        .clickable-cards {
          display: flex;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 6px;
          padding: 3px;
          margin: -3px;
        }

        .clickable-cards:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .clickable-card {
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 4px;
          padding: 2px;
          margin: -2px;
        }

        .clickable-card:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .board-cards-wrapper {
          display: flex;
          gap: 4px;
        }

        .board-group {
          display: flex;
          gap: 3px;
        }

        .board-divider {
          width: 2px;
          align-self: stretch;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 1px;
          margin: 4px 4px;
        }

        /* Card Selector */
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

        /* Analysis Result */
        .analysis-card {
          background: #12121a;
          border-radius: 10px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
          max-height: 280px;
          overflow-y: auto;
        }

        .analysis-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .actions-row {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .stat-item {
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          text-align: center;
        }

        .stat-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 700;
          font-family: 'SF Mono', monospace;
        }

        /* Street Analysis */
        .street-analysis {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .street-analysis-title {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .street-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
        }

        .street-item.active {
          background: rgba(34, 211, 191, 0.08);
          border-color: rgba(34, 211, 191, 0.2);
        }

        .street-name {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          min-width: 32px;
        }

        .street-item.active .street-name {
          color: #22d3bf;
        }

        .street-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          flex-wrap: wrap;
        }

        .street-action-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        }

        .street-action-chip.raise,
        .street-action-chip.bet {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .street-action-chip.call,
        .street-action-chip.check {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .street-action-chip.fold {
          background: rgba(107, 114, 128, 0.15);
          color: #9ca3af;
        }

        .street-action-freq {
          opacity: 0.8;
        }

        .street-equity {
          font-size: 10px;
          font-weight: 600;
          color: #22d3bf;
          margin-left: auto;
          white-space: nowrap;
        }

        /* Analysis Placeholder */
        .analysis-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
        }

        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .placeholder-text {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }

        /* Right Panel - Range */
        .right-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          min-width: 280px;
        }

        .range-card {
          background: #12121a;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
          min-height: 0;
        }

        .range-card-header {
          padding: 10px 10px 8px;
          flex-shrink: 0;
        }

        .range-card-footer {
          padding: 8px 10px 10px;
          flex-shrink: 0;
        }

        .range-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .range-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .range-title-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .help-icon {
          position: static;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          font-size: 10px;
          font-weight: 600;
          cursor: help;
          transition: all 0.2s;
        }

        .help-icon:hover {
          background: rgba(139, 92, 246, 0.4);
          transform: scale(1.1);
        }

        .help-tooltip-title {
          font-size: 12px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 8px;
        }

        .help-tooltip-content {
          font-size: 11px;
          color: #a0a0b0;
          line-height: 1.5;
        }

        .help-tooltip-content p {
          margin: 0 0 8px 0;
        }

        .help-tooltip-content p:last-child {
          margin-bottom: 0;
        }

        .help-tooltip-stats {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .help-tooltip-stat {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .help-tooltip-stat:last-child {
          margin-bottom: 0;
        }

        .help-tooltip-stat-label {
          color: #666;
        }

        .help-tooltip-stat-desc {
          color: #888;
        }

        .range-position {
          padding: 2px 8px;
          background: rgba(139, 92, 246, 0.15);
          border-radius: 4px;
          font-size: 11px;
          color: #8b5cf6;
          font-weight: 600;
        }

        .range-matrix-wrapper {
          width: 100%;
          flex: 1;
          min-height: 0;
        }

        .range-matrix-wrapper > div,
        .range-matrix-wrapper > div > div {
          width: 100% !important;
          height: 100% !important;
        }

        .range-stats {
          display: flex;
          justify-content: space-around;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          flex-shrink: 0;
          margin-top: 8px;
        }

        .range-stat {
          text-align: center;
        }

        .range-stat-label {
          font-size: 9px;
          color: #666;
        }

        .range-stat-value {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        /* History Panel */
        .history-card {
          background: #12121a;
          border-radius: 10px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          max-height: 150px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .history-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 110px;
          overflow-y: auto;
        }

        .history-item {
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .history-hand {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .history-info {
          font-size: 10px;
          color: #666;
        }

        .history-equity {
          font-size: 12px;
          font-weight: 600;
          color: #22d3bf;
        }

        .empty-state {
          text-align: center;
          padding: 16px;
          color: #666;
          font-size: 12px;
        }

        .loading-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #22d3bf;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 639px) {
          .setup-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .position-chips {
            width: 100%;
          }

          .hand-display {
            justify-content: center;
          }

          .divider {
            width: 30px;
            height: 1px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* Header */}
      <div className="analyzer-header">
        <div className="header-left">
          <h1 className="header-title">手牌分析器</h1>
          <span className="step-hint-inline">{getStepHint()}</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            历史
          </button>
          <button className="btn btn-ghost" onClick={clearAll}>
            清除
          </button>
          <button
            className="btn btn-primary"
            onClick={() => analyzeHand(false)}
            disabled={!isReadyForAnalysis || isAnalyzing}
          >
            {isAnalyzing ? <span className="loading-spinner" /> : '分析'}
          </button>
        </div>
      </div>

      <div className="main-grid">
        {/* Left Section */}
        <div className="left-section">
          {/* Setup Card */}
          <div className="setup-card">
            {/* Positions Row */}
            <div className="setup-row" style={{ marginBottom: '12px' }}>
              <span className="setup-label">你的位置</span>
              <div className="position-chips">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    className={`position-chip ${heroPosition === pos ? 'active' : ''}`}
                    onClick={() => setHeroPosition(pos)}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-row" style={{ marginBottom: '12px' }}>
              <span className="setup-label">对手位置</span>
              <div className="position-chips">
                {POSITIONS.filter(p => p !== heroPosition).map(pos => (
                  <button
                    key={pos}
                    className={`position-chip ${villainPosition === pos ? 'active' : ''}`}
                    onClick={() => setVillainPosition(pos)}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-row">
              <span className="setup-label">街道</span>
              <div className="street-chips">
                {STREETS.map(s => (
                  <button
                    key={s}
                    className={`street-chip ${street === s ? 'active' : ''}`}
                    onClick={() => setStreet(s)}
                  >
                    {STREET_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hand Display */}
          <div className="setup-card">
            <div className="hand-display">
              <div className="hand-section">
                <span className="hand-label">
                  你的手牌
                  {heroHand && <span className="click-hint">(点击移除)</span>}
                </span>
                <div className="cards-row">
                  {heroHand ? (
                    <div className="clickable-cards" onClick={removeHeroHand}>
                      <PokerCard card={heroHand[0]} size="md" variant="dark" />
                      <PokerCard card={heroHand[1]} size="md" variant="dark" />
                    </div>
                  ) : (
                    <>
                      <PokerCard faceDown size="md" variant="dark" />
                      <PokerCard faceDown size="md" variant="dark" />
                    </>
                  )}
                </div>
              </div>

              <div className="hand-section">
                <span className="hand-label">
                  公共牌
                  {board.length > 0 && <span className="click-hint">(点击移除)</span>}
                </span>
                <div className="board-cards-wrapper">
                  {/* Flop (3 cards) */}
                  <div className="board-group">
                    {[0, 1, 2].map(i => {
                      const showCard = street !== 'preflop';
                      return (
                        <div
                          key={i}
                          className={board[i] ? 'clickable-card' : ''}
                          onClick={() => board[i] && removeBoardCard(i)}
                        >
                          <PokerCard
                            card={board[i]}
                            faceDown={!board[i] && showCard}
                            size="md"
                            variant="dark"
                            disabled={!showCard}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Turn (1 card) */}
                  {(street === 'turn' || street === 'river') && (
                    <>
                      <div className="board-divider" />
                      <div className="board-group">
                        <div
                          className={board[3] ? 'clickable-card' : ''}
                          onClick={() => board[3] && removeBoardCard(3)}
                        >
                          <PokerCard
                            card={board[3]}
                            faceDown={!board[3]}
                            size="md"
                            variant="dark"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* River (1 card) */}
                  {street === 'river' && (
                    <>
                      <div className="board-divider" />
                      <div className="board-group">
                        <div
                          className={board[4] ? 'clickable-card' : ''}
                          onClick={() => board[4] && removeBoardCard(4)}
                        >
                          <PokerCard
                            card={board[4]}
                            faceDown={!board[4]}
                            size="md"
                            variant="dark"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card Selector */}
          <div className="card-selector">
            <div className="selector-header">
              <span className="selector-title">选择卡牌</span>
              <div className="selector-mode">
                <button
                  className={`mode-btn ${selectionMode === 'hero' ? 'active' : ''}`}
                  onClick={() => setSelectionMode('hero')}
                >
                  手牌 {heroHand ? '✓' : `(${selectedCards.length}/2)`}
                </button>
                <button
                  className={`mode-btn ${selectionMode === 'board' ? 'active' : ''}`}
                  onClick={() => setSelectionMode('board')}
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
        </div>

        {/* Right Section */}
        <div className="right-section">
          {/* Villain Range */}
          <div className="range-card">
            <div className="range-card-header">
              <div className="range-header">
                <div className="range-title-wrapper">
                  <span className="range-title">对手范围</span>
                  <span
                    className="help-icon"
                    onMouseEnter={handleTooltipEnter}
                    onMouseLeave={handleTooltipLeave}
                  >
                    ?
                  </span>
                </div>
                {villainPosition && <span className="range-position">{villainPosition}</span>}
              </div>
            </div>

            {/* Tooltip Portal */}
            {tooltipPos && (
              <div
                className="help-tooltip-portal"
                style={{
                  position: 'fixed',
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  width: 280,
                  padding: 12,
                  background: '#1a1a24',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                  zIndex: 99999,
                  pointerEvents: 'none',
                }}
              >
                <div className="help-tooltip-title">什么是对手范围？</div>
                <div className="help-tooltip-content">
                  <p>对手范围是指基于对手位置和行动，推测其可能持有的所有起手牌组合。</p>
                  <p>矩阵中的颜色深浅表示该手牌在对手范围内的可能性：颜色越深，可能性越高。</p>
                </div>
                <div className="help-tooltip-stats">
                  <div className="help-tooltip-stat">
                    <span className="help-tooltip-stat-label">范围%</span>
                    <span className="help-tooltip-stat-desc">对手开牌范围百分比</span>
                  </div>
                  <div className="help-tooltip-stat">
                    <span className="help-tooltip-stat-label">组合数</span>
                    <span className="help-tooltip-stat-desc">范围内的手牌组合总数</span>
                  </div>
                  <div className="help-tooltip-stat">
                    <span className="help-tooltip-stat-label">平均权益</span>
                    <span className="help-tooltip-stat-desc">你的手牌对抗此范围的胜率</span>
                  </div>
                </div>
              </div>
            )}

            <div className="range-matrix-wrapper">
              <RangeMatrix
                matrix={villainRange}
                size="sm"
                showLabels={true}
                interactive={false}
                fullWidth={true}
              />
            </div>

            <div className="range-card-footer">
              <div className="range-stats">
                <div className="range-stat">
                  <div className="range-stat-label">范围</div>
                  <div className="range-stat-value">{analysisResult?.villainRange || 18.5}%</div>
                </div>
                <div className="range-stat">
                  <div className="range-stat-label">组合</div>
                  <div className="range-stat-value">{analysisResult?.combos || 248}</div>
                </div>
                <div className="range-stat">
                  <div className="range-stat-label">平均权益</div>
                  <div className="range-stat-value">54.2%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Result - with Skeleton loading state */}
          {isAnalyzing ? (
            <div className="analysis-card">
              <div className="analysis-title">
                <Skeleton variant="rectangular" width={20} height={20} animation="pulse" />
                <span style={{ marginLeft: '8px' }}>分析中...</span>
              </div>
              <div className="actions-row">
                <Skeleton variant="rounded" width={80} height={36} animation="wave" />
                <Skeleton variant="rounded" width={80} height={36} animation="wave" />
                <Skeleton variant="rounded" width={80} height={36} animation="wave" />
              </div>
              <SkeletonGroup.Stats count={4} animation="wave" />
            </div>
          ) : !analysisResult ? (
            <div className="analysis-card">
              <div className="analysis-title">
                📊 GTO 分析结果
              </div>
              <div className="analysis-placeholder">
                <div className="placeholder-icon">🎯</div>
                <div className="placeholder-text">
                  {!heroPosition || !villainPosition
                    ? '请先选择你和对手的位置'
                    : !heroHand
                    ? '请选择你的两张手牌'
                    : street !== 'preflop' && board.length < (street === 'flop' ? 3 : street === 'turn' ? 4 : 5)
                    ? `请选择公共牌 (${board.length}/${street === 'flop' ? 3 : street === 'turn' ? 4 : 5})`
                    : '点击"分析"按钮开始分析'}
                </div>
              </div>
            </div>
          ) : (
            <div className="analysis-card">
              <div className="analysis-title">
                📊 GTO 分析结果
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">权益</div>
                  <div className="stat-value" style={{ color: '#22d3bf' }}>{analysisResult.equity}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">底池赔率</div>
                  <div className="stat-value">{analysisResult.potOdds}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">SPR</div>
                  <div className="stat-value">{analysisResult.spr}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">最佳EV</div>
                  <div className="stat-value" style={{ color: '#22c55e' }}>+{analysisResult.actions[0]?.ev} BB</div>
                </div>
              </div>

              {/* Street-by-street Analysis */}
              {analysisResult.streetAnalysis && (
                <div className="street-analysis">
                  <div className="street-analysis-title">各街道策略</div>
                  {analysisResult.streetAnalysis.map((sa) => (
                    <div
                      key={sa.street}
                      className={`street-item ${sa.street === street ? 'active' : ''}`}
                    >
                      <span className="street-name">{STREET_LABELS[sa.street]}</span>
                      <div className="street-actions">
                        {sa.actions.map((a, i) => (
                          <span
                            key={i}
                            className={`street-action-chip ${a.action}`}
                          >
                            {a.action === 'raise' ? '加注' :
                             a.action === 'call' ? '跟注' :
                             a.action === 'fold' ? '弃牌' :
                             a.action === 'bet' ? '下注' :
                             a.action === 'check' ? '过牌' : a.action}
                            <span className="street-action-freq">{Math.round(a.frequency * 100)}%</span>
                          </span>
                        ))}
                      </div>
                      <span className="street-equity">{sa.equity}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div className="history-card">
              <div className="history-title">分析历史</div>
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map(item => (
                    <div
                      key={item.id}
                      className="history-item"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div>
                        <div className="history-hand">
                          {item.heroHand[0].rank}{item.heroHand[0].suit} {item.heroHand[1].rank}{item.heroHand[1].suit}
                        </div>
                        <div className="history-info">
                          {item.heroPosition} vs {item.villainPosition} • {STREET_LABELS[item.street]}
                        </div>
                      </div>
                      <div className="history-equity">{item.result.equity}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无分析历史</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
