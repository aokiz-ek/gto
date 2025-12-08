'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { PokerCard, RangeMatrix, Skeleton, SkeletonGroup } from '@gto/ui';
import { useGameStore } from '@/store';
import { parseCard, RANKS, SUITS, createEmptyMatrix, setMatrixValue, getMatrixValue, HAND_CATEGORIES, countCombos, rangePercentage } from '@gto/core';
import type { Card as CardType, Position, Street } from '@gto/core';
import { useResponsive, useLocalStorage } from '@/hooks';
import {
  BoardTexturePanel,
  StrategyExplainer,
  BetSizingSelector,
  ActionLine,
  ActionFilter,
  HandAnnotation,
  EquityCalculator,
  GTOReports,
  SizingAdvisor,
  RunoutAnalyzer,
  RangeExplorer,
  HandHistoryInput,
  OpponentRangeAdjuster,
} from '@/components/analyzer';

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

// Dynamic analysis result generator based on hand, board, and position
const createDynamicAnalysisResult = (
  heroHand: [CardType, CardType] | null,
  board: CardType[],
  heroPosition: Position | null,
  villainPosition: Position | null,
  potSize: number,
  effectiveStack: number,
  estimatedEquity: number,
  betSizePercent: number = 0.66 // 下注尺寸百分比
): AnalysisResult => {
  // Calculate SPR
  const spr = potSize > 0 ? Math.round((effectiveStack / potSize) * 10) / 10 : 10;

  // Calculate pot odds based on bet size
  // 底池赔率 = 需要跟注的金额 / (底池 + 下注金额 + 需要跟注的金额)
  const betAmount = potSize * betSizePercent;
  const potOdds = Math.round((betAmount / (potSize + betAmount + betAmount)) * 1000) / 10;

  // Position-based range estimates
  const POSITION_RANGES: Record<string, number> = {
    'UTG': 12, 'UTG1': 14, 'UTG2': 15, 'LJ': 17, 'HJ': 20,
    'CO': 27, 'BTN': 40, 'SB': 35, 'BB': 100,
  };
  const villainRangePercent = villainPosition ? POSITION_RANGES[villainPosition] || 20 : 20;
  const combos = Math.round(villainRangePercent * 12.69);

  // Calculate hand strength for action frequencies
  const equity = estimatedEquity;
  let raiseFreq = 0, callFreq = 0, foldFreq = 0;

  // Dynamic action calculation based on equity and SPR
  if (equity >= 65) {
    // Strong hand - value bet/raise
    raiseFreq = 0.75 + (equity - 65) / 100;
    callFreq = 0.20 - (equity - 65) / 200;
    foldFreq = 0.05;
  } else if (equity >= 50) {
    // Medium hand - mixed strategy
    raiseFreq = 0.45 + (equity - 50) / 100;
    callFreq = 0.35;
    foldFreq = 0.20 - (equity - 50) / 100;
  } else if (equity >= 35) {
    // Marginal hand - mostly call/fold
    raiseFreq = 0.15 + (equity - 35) / 150;
    callFreq = 0.40;
    foldFreq = 0.45 - (equity - 35) / 100;
  } else {
    // Weak hand - mostly fold
    raiseFreq = 0.05;
    callFreq = 0.20;
    foldFreq = 0.75;
  }

  // Adjust for SPR
  if (spr < 4) {
    // Low SPR - more aggressive
    raiseFreq *= 1.2;
    foldFreq *= 0.8;
  } else if (spr > 10) {
    // High SPR - more conservative
    raiseFreq *= 0.9;
    callFreq *= 1.1;
  }

  // Normalize frequencies
  const total = raiseFreq + callFreq + foldFreq;
  raiseFreq = Math.round(raiseFreq / total * 100) / 100;
  callFreq = Math.round(callFreq / total * 100) / 100;
  foldFreq = Math.round((1 - raiseFreq - callFreq) * 100) / 100;

  // Calculate EV based on equity and pot
  const raiseEV = Math.round((equity / 100 * (potSize * 1.5) - (1 - equity / 100) * potSize * 0.5) * 10) / 10;
  const callEV = Math.round((equity / 100 * potSize - (1 - equity / 100) * potSize * 0.3) * 10) / 10;

  // Generate street-by-street analysis dynamically
  const streetAnalysis: StreetAnalysis[] = generateStreetAnalysis(equity, potOdds, spr, board.length);

  return {
    actions: [
      { action: board.length > 0 ? 'bet' : 'raise', frequency: raiseFreq, ev: raiseEV },
      { action: board.length > 0 ? 'check' : 'call', frequency: callFreq, ev: callEV },
      { action: 'fold', frequency: foldFreq, ev: 0 },
    ].filter(a => a.frequency > 0.01).sort((a, b) => b.frequency - a.frequency),
    equity,
    potOdds,
    spr,
    villainRange: villainRangePercent,
    combos,
    streetAnalysis,
  };
};

// Generate street-by-street analysis dynamically
const generateStreetAnalysis = (
  baseEquity: number,
  basePotOdds: number,
  spr: number,
  boardCards: number
): StreetAnalysis[] => {
  // Equity typically improves or stabilizes as streets progress (for made hands)
  // or decreases (for draws that don't complete)
  const equityDelta = baseEquity >= 50 ? 3 : -2;

  // Pot odds typically decrease as pot grows
  const potOddsDelta = -3;

  // Calculate dynamic frequencies based on equity and SPR
  const calcFreqs = (eq: number, sp: number, isPostflop: boolean) => {
    const betFreq = isPostflop
      ? Math.min(0.85, 0.40 + (eq - 40) / 100 + (1 / sp) * 0.1)
      : Math.min(0.95, 0.50 + (eq - 40) / 80);
    const checkFreq = 1 - betFreq;
    return { bet: Math.round(betFreq * 100) / 100, check: Math.round(checkFreq * 100) / 100 };
  };

  // Preflop analysis
  const preflopEquity = Math.max(30, baseEquity - 8);
  const preflopFreqs = calcFreqs(preflopEquity, spr, false);

  // Flop analysis
  const flopEquity = baseEquity;
  const flopPotOdds = basePotOdds;
  const flopFreqs = calcFreqs(flopEquity, spr, true);

  // Turn analysis
  const turnEquity = Math.min(90, baseEquity + equityDelta);
  const turnPotOdds = Math.max(10, basePotOdds + potOddsDelta);
  const turnSpr = spr * 0.6; // SPR decreases
  const turnFreqs = calcFreqs(turnEquity, turnSpr, true);

  // River analysis
  const riverEquity = Math.min(95, baseEquity + equityDelta * 2);
  const riverPotOdds = Math.max(8, basePotOdds + potOddsDelta * 2);
  const riverSpr = spr * 0.3;
  const riverFreqs = calcFreqs(riverEquity, riverSpr, true);

  return [
    {
      street: 'preflop',
      actions: [
        { action: 'raise', frequency: preflopFreqs.bet, ev: Math.round((preflopEquity / 100 * 2.5 - 1) * 10) / 10 },
        { action: 'call', frequency: preflopFreqs.check * 0.7, ev: Math.round((preflopEquity / 100 * 1.5 - 0.5) * 10) / 10 },
        { action: 'fold', frequency: preflopFreqs.check * 0.3, ev: 0 },
      ].filter(a => a.frequency > 0.01),
      equity: Math.round(preflopEquity * 10) / 10,
      potOdds: 0,
    },
    {
      street: 'flop',
      actions: [
        { action: 'bet', frequency: flopFreqs.bet, ev: Math.round((flopEquity / 100 * 3 - 0.8) * 10) / 10 },
        { action: 'check', frequency: flopFreqs.check, ev: Math.round((flopEquity / 100 * 1.5) * 10) / 10 },
      ],
      equity: Math.round(flopEquity * 10) / 10,
      potOdds: Math.round(flopPotOdds * 10) / 10,
    },
    {
      street: 'turn',
      actions: [
        { action: 'bet', frequency: turnFreqs.bet, ev: Math.round((turnEquity / 100 * 4 - 1) * 10) / 10 },
        { action: 'check', frequency: turnFreqs.check, ev: Math.round((turnEquity / 100 * 2) * 10) / 10 },
      ],
      equity: Math.round(turnEquity * 10) / 10,
      potOdds: Math.round(turnPotOdds * 10) / 10,
    },
    {
      street: 'river',
      actions: [
        { action: 'bet', frequency: riverFreqs.bet, ev: Math.round((riverEquity / 100 * 5 - 1.2) * 10) / 10 },
        { action: 'check', frequency: riverFreqs.check, ev: Math.round((riverEquity / 100 * 2.5) * 10) / 10 },
      ],
      equity: Math.round(riverEquity * 10) / 10,
      potOdds: Math.round(riverPotOdds * 10) / 10,
    },
  ];
};

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
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('gto-analyzer-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const hasAutoAnalyzed = useRef(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [betSize, setBetSize] = useState(0.66); // Default 66% pot
  const [potSize, setPotSize] = useState(6); // Default pot size in BB (2.5BB open + 1BB call + blinds)
  const [effectiveStack, setEffectiveStack] = useState(100); // Default effective stack in BB
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [userActions, setUserActions] = useState<{ street: Street; action: string }[]>([]);
  const [customVillainRangePercent, setCustomVillainRangePercent] = useState<number | null>(null); // 用户调整的对手范围百分比
  const [filteredActions, setFilteredActions] = useState<{ action: string; frequency: number; ev: number }[]>([]); // 过滤后的行动
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notes, setNotes] = useState('');

  const { isMobile, isMobileOrTablet } = useResponsive();

  // Determine position advantage
  const heroPositionAdvantage = useMemo((): 'IP' | 'OOP' | null => {
    if (!heroPosition || !villainPosition) return null;
    const positionOrder = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const heroIdx = positionOrder.indexOf(heroPosition);
    const villainIdx = positionOrder.indexOf(villainPosition);
    // BTN is last to act postflop, SB/BB act first
    if (heroPosition === 'SB' || heroPosition === 'BB') {
      return villainPosition === 'SB' || villainPosition === 'BB' ? (heroIdx > villainIdx ? 'IP' : 'OOP') : 'OOP';
    }
    return heroIdx > villainIdx ? 'IP' : 'OOP';
  }, [heroPosition, villainPosition]);

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

  // Step hints (memoized)
  const stepHint = useMemo((): string => {
    switch (currentStep) {
      case 'position': return '第1步：选择你和对手的位置';
      case 'hero': return '第2步：选择你的两张手牌';
      case 'board': {
        const requiredCards = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
        return `第3步：选择${requiredCards}张公共牌 (${board.length}/${requiredCards})`;
      }
      case 'complete': return '✓ 分析完成';
    }
  }, [currentStep, street, board.length]);

  // Check if ready for analysis
  const isReadyForAnalysis = currentStep === 'complete';

  // Generate villain range based on position with dynamic strength calculation
  const getVillainRange = useCallback((pos: Position | null) => {
    const matrix = createEmptyMatrix();
    if (!pos) return matrix;

    // Position-based opening range percentages
    const POSITION_OPEN_PERCENT: Record<Position, number> = {
      'UTG': 12, 'UTG1': 14, 'UTG2': 15, 'LJ': 17, 'HJ': 20,
      'CO': 27, 'BTN': 40, 'SB': 35, 'BB': 100,
    };

    const openPercent = POSITION_OPEN_PERCENT[pos] || 20;
    const rankOrder = 'AKQJT98765432';

    // Calculate hand strength for each cell based on rank values and suited/offsuit
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const rank1Value = 14 - row; // A=14, K=13, ..., 2=2
        const rank2Value = 14 - col;

        let handStrength = 0;

        if (row === col) {
          // Pairs - strength based on rank
          handStrength = 0.50 + (rank1Value / 14) * 0.50; // 0.50-1.00 for pairs
        } else if (row < col) {
          // Suited hands (upper triangle)
          const avgRank = (rank1Value + rank2Value) / 2;
          const gap = col - row;
          const connectivity = Math.max(0, 1 - gap * 0.1);
          handStrength = 0.30 + (avgRank / 14) * 0.35 + connectivity * 0.15 + 0.08; // +0.08 for suited
        } else {
          // Offsuit hands (lower triangle)
          const avgRank = (rank1Value + rank2Value) / 2;
          const gap = row - col;
          const connectivity = Math.max(0, 1 - gap * 0.12);
          handStrength = 0.25 + (avgRank / 14) * 0.30 + connectivity * 0.10;
        }

        // Adjust based on position range width
        // Wider ranges (higher openPercent) include more hands with varying frequencies
        const positionMultiplier = openPercent / 100;

        // Calculate if this hand is in range and its frequency
        // Hands with strength > threshold are in range
        const strengthThreshold = 1 - positionMultiplier;

        if (handStrength >= strengthThreshold) {
          // Frequency based on how much above threshold
          const excessStrength = handStrength - strengthThreshold;
          const maxExcess = 1 - strengthThreshold;
          const frequency = maxExcess > 0 ? Math.min(1, 0.3 + (excessStrength / maxExcess) * 0.7) : 1;
          matrix.matrix[row][col] = Math.round(frequency * 100) / 100;
        }
      }
    }

    // Ensure premium hands are always full frequency
    HAND_CATEGORIES.PREMIUM.forEach(hand => setMatrixValue(matrix, hand, 1.0));

    // Adjust strong hands based on position
    const strongMultiplier = Math.min(1, openPercent / 20);
    HAND_CATEGORIES.STRONG.forEach(hand => {
      const currentVal = getMatrixValue(matrix, hand);
      setMatrixValue(matrix, hand, Math.max(currentVal, 0.70 * strongMultiplier + 0.30));
    });

    return matrix;
  }, []);

  const villainRange = useMemo(() => getVillainRange(villainPosition), [villainPosition, getVillainRange]);

  // Calculate hero hand's position in range matrix for highlighting
  const heroHandCell = useMemo(() => {
    if (!heroHand) return null;

    // RANKS order in matrix: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
    const rankOrder = 'AKQJT98765432';
    const r1 = rankOrder.indexOf(heroHand[0].rank);
    const r2 = rankOrder.indexOf(heroHand[1].rank);

    if (r1 === -1 || r2 === -1) return null;

    const isPair = r1 === r2;
    const isSuited = heroHand[0].suit === heroHand[1].suit;

    // In the matrix:
    // - Diagonal (row === col): Pairs
    // - Above diagonal (row < col): Suited hands (higher rank first)
    // - Below diagonal (row > col): Offsuit hands (higher rank first)
    if (isPair) {
      return { row: r1, col: r1 };
    } else if (isSuited) {
      // Suited: smaller index (higher rank) is row
      return { row: Math.min(r1, r2), col: Math.max(r1, r2) };
    } else {
      // Offsuit: smaller index (higher rank) is col (below diagonal)
      return { row: Math.max(r1, r2), col: Math.min(r1, r2) };
    }
  }, [heroHand]);

  // Calculate range stats based on villain range and hero hand
  const rangeStats = useMemo(() => {
    const totalCombos = Math.round(countCombos(villainRange));
    // 优先使用用户自定义的范围百分比，否则从矩阵计算
    const rangePercent = customVillainRangePercent !== null
      ? customVillainRangePercent
      : Math.round(rangePercentage(villainRange) * 10) / 10;

    // Calculate effective combos (excluding hero's blockers)
    let effectiveCombos = totalCombos;
    if (heroHand) {
      // Rough blocker adjustment: each card blocks some combos
      // This is a simplified calculation
      const heroCards = heroHand.map(c => c.rank);
      const uniqueRanks = new Set(heroCards);
      // Each rank in hero hand blocks roughly 4-8% of villain's combos
      effectiveCombos = Math.round(totalCombos * (1 - uniqueRanks.size * 0.04));
    }

    // Calculate equity vs villain range (simplified estimation based on hero hand strength)
    let estimatedEquity = 50; // Default
    if (heroHand) {
      const rankValues: Record<string, number> = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
        '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
      };
      const r1 = rankValues[heroHand[0].rank] || 0;
      const r2 = rankValues[heroHand[1].rank] || 0;
      const highCard = Math.max(r1, r2);
      const lowCard = Math.min(r1, r2);
      const isPair = r1 === r2;
      const isSuited = heroHand[0].suit === heroHand[1].suit;
      const isConnected = Math.abs(r1 - r2) <= 2;

      // Base equity on hand strength
      if (isPair) {
        // Pairs: 50-85% equity based on rank
        estimatedEquity = 50 + (highCard / 14) * 35;
      } else if (highCard >= 12 && lowCard >= 10) {
        // Premium broadway: 55-65%
        estimatedEquity = 55 + (isSuited ? 5 : 0) + (isConnected ? 3 : 0);
      } else if (highCard >= 12) {
        // High card hands: 45-55%
        estimatedEquity = 45 + (lowCard / 14) * 10 + (isSuited ? 3 : 0);
      } else {
        // Weaker hands: 35-50%
        estimatedEquity = 35 + ((highCard + lowCard) / 28) * 15 + (isSuited ? 3 : 0);
      }

      // Adjust for board if post-flop
      if (board.length > 0) {
        // Simplified: assume equity narrows as board develops
        estimatedEquity = estimatedEquity * 0.95 + 2.5; // Slight regression to mean
      }
    }

    return {
      combos: effectiveCombos,
      rangePercent,
      equity: Math.round(estimatedEquity * 10) / 10,
    };
  }, [villainRange, heroHand, board.length, customVillainRangePercent]);

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
          // Get base values from API response
          const baseEquity = data.analysis.equity || rangeStats.equity || 50;
          const basePotOdds = data.analysis.potOdds || 25;
          const baseSpr = data.analysis.spr || (effectiveStack / potSize);

          // Generate street-by-street analysis dynamically based on API response
          const streetAnalysis = generateStreetAnalysis(baseEquity, basePotOdds, baseSpr, board.length);

          // Use API actions for preflop if available
          if (data.analysis.actions && data.analysis.actions.length > 0) {
            streetAnalysis[0] = {
              street: 'preflop',
              actions: data.analysis.actions,
              equity: Math.max(baseEquity - 8, 30),
              potOdds: 0,
            };
          }

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
        // Fallback to dynamic calculation
        const fallbackResult = createDynamicAnalysisResult(
          heroHand,
          board,
          heroPosition,
          villainPosition,
          potSize,
          effectiveStack,
          rangeStats.equity,
          betSize
        );
        setAnalysisResult(fallbackResult);
      }
    } catch {
      // Fallback to dynamic calculation
      const fallbackResult = createDynamicAnalysisResult(
        heroHand,
        board,
        heroPosition,
        villainPosition,
        potSize,
        effectiveStack,
        rangeStats.equity,
        betSize
      );
      setAnalysisResult(fallbackResult);
    } finally {
      setIsAnalyzing(false);
    }
  }, [heroHand, heroPosition, villainPosition, board, street, potSize, effectiveStack, rangeStats.equity, betSize]);

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

  // Save to database history
  const saveToHistory = async () => {
    if (!heroHand || !heroPosition || !analysisResult) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroHand: heroHand.map(c => `${c.rank}${c.suit}`).join(''),
          board: board.map(c => `${c.rank}${c.suit}`).join(''),
          heroPosition,
          villainPosition,
          potSize,
          stackSize: effectiveStack,
          street,
          analysisResult: {
            equity: analysisResult.equity / 100,
            ev: analysisResult.actions[0]?.ev || 0,
            recommendedAction: analysisResult.actions[0]?.action || '',
          },
          notes: notes || null,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || '保存失败，请先登录');
      }
    } catch (error) {
      console.error('Save to history error:', error);
      alert('保存失败，请检查网络连接');
    } finally {
      setIsSaving(false);
    }
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
          overflow-y: auto;
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

        .guide-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          text-decoration: none;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .guide-btn:hover {
          background: rgba(139, 92, 246, 0.25);
          color: #a78bfa;
          transform: scale(1.1);
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
        }

        .left-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          min-height: 0;
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

        /* Stack Config */
        .stack-config {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .stack-input-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stack-input-label {
          font-size: 11px;
          color: #666;
          min-width: 32px;
        }

        .stack-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 0 8px;
          transition: all 0.15s;
        }

        .stack-input-wrapper:focus-within {
          border-color: #00f5d4;
          box-shadow: 0 0 0 2px rgba(0, 245, 212, 0.1);
        }

        .stack-input {
          width: 60px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 0;
          outline: none;
          text-align: right;
        }

        .stack-input::-webkit-inner-spin-button,
        .stack-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .stack-input[type=number] {
          -moz-appearance: textfield;
        }

        .stack-input-unit {
          font-size: 10px;
          color: #666;
          margin-left: 4px;
        }

        .spr-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(255, 209, 102, 0.1);
          border: 1px solid rgba(255, 209, 102, 0.2);
          border-radius: 6px;
        }

        .spr-label {
          font-size: 10px;
          color: #ffd166;
          font-weight: 500;
        }

        .spr-value {
          font-size: 12px;
          color: #ffd166;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
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

        /* Action Comparison with EV Loss */
        .action-comparison {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .action-comparison-title {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .action-bars {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .action-bar-row {
          display: grid;
          grid-template-columns: 70px 1fr 90px;
          gap: 8px;
          align-items: center;
        }

        .action-bar-label {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-name {
          font-size: 11px;
          font-weight: 600;
        }

        .action-name.raise,
        .action-name.bet,
        .action-name.allin {
          color: #ef4444;
        }

        .action-name.call,
        .action-name.check {
          color: #22c55e;
        }

        .action-name.fold {
          color: #9ca3af;
        }

        .action-freq {
          font-size: 10px;
          color: #666;
        }

        .action-bar-container {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
        }

        .action-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .action-bar.raise,
        .action-bar.bet,
        .action-bar.allin {
          background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
        }

        .action-bar.call,
        .action-bar.check {
          background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
        }

        .action-bar.fold {
          background: linear-gradient(90deg, #6b7280 0%, #9ca3af 100%);
        }

        .action-ev-info {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }

        .action-ev {
          font-size: 10px;
          font-weight: 600;
          color: #888;
          font-family: 'SF Mono', monospace;
        }

        .action-ev-loss {
          font-size: 9px;
          font-weight: 600;
          color: #ef4444;
          padding: 1px 4px;
          background: rgba(239, 68, 68, 0.15);
          border-radius: 3px;
        }

        .action-ev-optimal {
          font-size: 9px;
          font-weight: 600;
          color: #22c55e;
          padding: 1px 4px;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 3px;
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
          min-width: 280px;
          overflow-y: auto;
          min-height: 0;
        }

        .range-card {
          background: #12121a;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 0 0 auto;
        }

        .range-card-header {
          padding: 10px 10px 8px;
          flex-shrink: 0;
        }

        .range-card-footer {
          padding: 8px 10px 10px;
          flex-shrink: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
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
          overflow: hidden;
          padding: 0 10px;
        }

        .range-stats {
          display: flex;
          justify-content: space-around;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          flex-shrink: 0;
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
          <Link href="/analyzer/guide" className="guide-btn" title="查看功能说明">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </Link>
          <span className="step-hint-inline">{stepHint}</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            历史
          </button>
          <button className="btn btn-ghost" onClick={clearAll}>
            清除
          </button>
          {analysisResult && (
            <button
              className={`btn ${saveSuccess ? 'btn-success' : 'btn-ghost'}`}
              onClick={saveToHistory}
              disabled={isSaving || saveSuccess}
              style={{
                background: saveSuccess ? 'rgba(34, 197, 94, 0.2)' : undefined,
                borderColor: saveSuccess ? '#22c55e' : undefined,
                color: saveSuccess ? '#22c55e' : undefined,
              }}
            >
              {isSaving ? <span className="loading-spinner" /> : saveSuccess ? '✓ 已保存' : '💾 保存'}
            </button>
          )}
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

            <div className="setup-row" style={{ marginBottom: '12px' }}>
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

            {/* Pot Size and Stack Configuration */}
            <div className="setup-row">
              <span className="setup-label">底池/筹码</span>
              <div className="stack-config">
                <div className="stack-input-group">
                  <label className="stack-input-label">底池</label>
                  <div className="stack-input-wrapper">
                    <input
                      type="number"
                      className="stack-input"
                      value={potSize}
                      onChange={(e) => setPotSize(Math.max(1, parseFloat(e.target.value) || 1))}
                      min="1"
                      step="0.5"
                    />
                    <span className="stack-input-unit">BB</span>
                  </div>
                </div>
                <div className="stack-input-group">
                  <label className="stack-input-label">筹码</label>
                  <div className="stack-input-wrapper">
                    <input
                      type="number"
                      className="stack-input"
                      value={effectiveStack}
                      onChange={(e) => setEffectiveStack(Math.max(1, parseFloat(e.target.value) || 1))}
                      min="1"
                      step="5"
                    />
                    <span className="stack-input-unit">BB</span>
                  </div>
                </div>
                <div className="spr-display">
                  <span className="spr-label">SPR</span>
                  <span className="spr-value">{(effectiveStack / potSize).toFixed(1)}</span>
                </div>
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

          {/* Action Line - Shows betting sequence */}
          {heroPosition && villainPosition && (
            <ActionLine
              actions={[]}
              currentStreet={street}
              heroPosition={heroPosition}
              villainPosition={villainPosition}
              potSize={potSize}
            />
          )}

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

        {/* Right Section - Optimized module order for better UX */}
        <div className="right-section">
          {/* ========== 第一层：核心分析结果（最重要，始终显示） ========== */}

          {/* GTO Analysis Result - Always visible, shows progress/results */}
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
          ) : analysisResult ? (
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

              {/* Action Comparison with EV Loss */}
              <div className="action-comparison">
                <div className="action-comparison-title">行动对比 (EV损失)</div>
                <div className="action-bars">
                  {analysisResult.actions.map((action, i) => {
                    const maxEv = Math.max(...analysisResult.actions.map(a => a.ev));
                    const evLoss = maxEv - action.ev;
                    const barWidth = action.frequency * 100;
                    const actionLabel = action.action === 'raise' ? '加注' :
                      action.action === 'call' ? '跟注' :
                      action.action === 'fold' ? '弃牌' :
                      action.action === 'bet' ? '下注' :
                      action.action === 'check' ? '过牌' :
                      action.action === 'allin' ? '全下' : action.action;
                    return (
                      <div key={i} className="action-bar-row">
                        <div className="action-bar-label">
                          <span className={`action-name ${action.action}`}>{actionLabel}</span>
                          <span className="action-freq">{Math.round(action.frequency * 100)}%</span>
                        </div>
                        <div className="action-bar-container">
                          <div
                            className={`action-bar ${action.action}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="action-ev-info">
                          <span className="action-ev">EV: {action.ev > 0 ? '+' : ''}{action.ev.toFixed(1)}</span>
                          {evLoss > 0 && (
                            <span className="action-ev-loss">-{evLoss.toFixed(1)} BB</span>
                          )}
                          {evLoss === 0 && (
                            <span className="action-ev-optimal">最优</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

              {/* Save Notes Section */}
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#888',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  保存笔记 (可选)
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="添加笔记，记录你的思考过程..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    resize: 'vertical' as const,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}>
                  <span style={{ fontSize: '10px', color: '#666' }}>
                    保存后可在"历史记录"页面查看
                  </span>
                  <button
                    onClick={saveToHistory}
                    disabled={isSaving || saveSuccess}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: saveSuccess ? 'rgba(34, 197, 94, 0.2)' : 'linear-gradient(135deg, #22d3bf 0%, #1eb8a6 100%)',
                      color: saveSuccess ? '#22c55e' : '#000',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isSaving || saveSuccess ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSaving ? '保存中...' : saveSuccess ? '✓ 已保存' : '💾 保存到历史'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {/* ========== 核心工具模块（始终可用） ========== */}

          {/* 手牌历史导入 - Always available for quick input */}
          <HandHistoryInput
            onHandParsed={(parsedHand) => {
              if (parsedHand.heroHand) {
                setHeroHand(parsedHand.heroHand);
              }
              if (parsedHand.board.length > 0) {
                setBoard(parsedHand.board);
              }
              if (parsedHand.heroPosition) {
                const pos = parsedHand.heroPosition as Position;
                if (POSITIONS.includes(pos)) {
                  setHeroPosition(pos);
                }
              }
              if (parsedHand.street) {
                setStreet(parsedHand.street);
              }
              hasAutoAnalyzed.current = false;
            }}
          />

          {/* 范围浏览器 - Always visible */}
          <RangeExplorer
            heroHand={heroHand}
            board={board}
            position={heroPosition || undefined}
          />

          {/* 对手范围调整 - Always visible */}
          <OpponentRangeAdjuster
            board={board}
            onRangeChange={(rangePercent) => {
              setCustomVillainRangePercent(rangePercent);
              // 清除分析结果，需要重新分析
              if (analysisResult) {
                hasAutoAnalyzed.current = false;
              }
            }}
          />

          {/* 策略笔记 - Always visible */}
          <HandAnnotation
            heroHand={heroHand}
            board={board}
          />

          {/* ========== 第二层：牌面分析（翻牌后显示，与左侧公共牌联动） ========== */}

          {/* Board Texture Panel - Show after flop with board cards */}
          {street !== 'preflop' && board.length >= 3 && (
            <BoardTexturePanel board={board} heroHand={heroHand} street={street} />
          )}

          {/* Sizing Advisor - Show after flop with board cards (key betting advice) */}
          {street !== 'preflop' && board.length >= 3 && (
            <SizingAdvisor
              heroHand={heroHand}
              board={board}
              street={street}
              position={heroPositionAdvantage}
              potSize={potSize}
              effectiveStack={effectiveStack}
            />
          )}

          {/* ========== 第三层：对手范围分析（选择对手位置后显示） ========== */}

          {/* Villain Range - Show when villain position is selected */}
          {villainPosition && (
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
                  <span className="range-position">{villainPosition}</span>
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
                  highlightedCell={heroHandCell}
                />
              </div>

              <div className="range-card-footer">
                <div className="range-stats">
                  <div className="range-stat">
                    <div className="range-stat-label">范围</div>
                    <div className="range-stat-value">{rangeStats.rangePercent}%</div>
                  </div>
                  <div className="range-stat">
                    <div className="range-stat-label">组合</div>
                    <div className="range-stat-value">{rangeStats.combos}</div>
                  </div>
                  <div className="range-stat">
                    <div className="range-stat-label">vs范围权益</div>
                    <div className="range-stat-value" style={{ color: heroHand ? '#22d3bf' : '#666' }}>
                      {heroHand ? `${rangeStats.equity}%` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 第四层：权益与策略（选择手牌后显示） ========== */}

          {/* Equity Calculator - Show when hero hand is selected */}
          {heroHand && (
            <EquityCalculator
              heroHand={heroHand}
              board={board}
              villainRangePercent={rangeStats.rangePercent}
            />
          )}

          {/* Strategy Explainer - Show when positions and hand are selected */}
          {heroPosition && villainPosition && heroHand && (
            <StrategyExplainer
              heroHand={heroHand}
              heroPosition={heroPosition}
              villainPosition={villainPosition}
              board={board}
              street={street}
              analysisResult={analysisResult}
            />
          )}

          {/* ========== 第五层：下注尺寸选择（翻牌后，有手牌时显示） ========== */}

          {/* Bet Sizing Selector - Show for postflop with hero hand */}
          {street !== 'preflop' && heroHand && (
            <BetSizingSelector
              selectedSize={betSize}
              onSizeChange={setBetSize}
              potSize={potSize}
              disabled={false}
            />
          )}

          {/* ========== 第六层：深度分析（分析完成后显示） ========== */}

          {/* GTO Reports - Show after analysis is complete */}
          {analysisResult && (
            <GTOReports
              analysisResult={analysisResult}
              userActions={userActions}
              street={street}
            />
          )}

          {/* Runout Analyzer - Show for postflop with analysis result */}
          {street !== 'preflop' && board.length >= 3 && analysisResult && (
            <RunoutAnalyzer
              heroHand={heroHand}
              board={board}
              heroEquity={analysisResult.equity}
            />
          )}

          {/* Action Filter - Show for postflop with analysis result */}
          {street !== 'preflop' && analysisResult && (
            <ActionFilter
              street={street}
              selectedActions={selectedActions}
              onActionsChange={setSelectedActions}
              analysisActions={analysisResult.actions}
              onFilteredActionsChange={setFilteredActions}
            />
          )}

          {/* History - Show when toggled */}
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
