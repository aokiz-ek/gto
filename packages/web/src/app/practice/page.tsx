'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import './practice.css';
import { useUserStore, ACHIEVEMENTS } from '@/store';
import AICoachFeedback from '@/components/AICoachFeedback';
import {
  createDeck,
  shuffleDeck,
  handToDisplayString,
  GTO_RANGES,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
  analyzeBoardTexture,
  evaluateHandStrength,
  getPostflopStrategy,
} from '@gto/core';
import type { Hand, Position, GTOHandStrategy, Card, PostflopAction } from '@gto/core';

// Types
type PracticeMode = 'preflop' | 'postflop' | 'full_hand';
type PreflopScenario = 'rfi' | 'vs_rfi' | 'vs_3bet';
type Street = 'preflop' | 'flop' | 'turn' | 'river';
type PostflopScenarioType = 'cbet' | 'facing_cbet' | 'barrel' | 'value';
type HandTypeFilter = 'all' | 'pairs' | 'suited' | 'offsuit';

function getHandType(handString: string): 'pairs' | 'suited' | 'offsuit' {
  if (handString.length === 2 || (handString.length === 3 && handString[0] === handString[1])) return 'pairs';
  if (handString.endsWith('s')) return 'suited';
  return 'offsuit';
}

interface StreetResult {
  street: Street;
  action: string;
  isCorrect: boolean;
  score: number;
}

interface PracticeScenario {
  heroHand: Hand;
  handString: string;
  heroPosition: Position;
  villainPosition?: Position;
  villainHand?: Hand;
  preflopScenario: PreflopScenario;
  deck: Card[];
  board: Card[];
  currentStreet: Street;
  potSize: number;
  heroStack: number;
  villainStack: number;
  streetResults: StreetResult[];
  isHeroIP: boolean;
}

// Constants
const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const RFI_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const AVAILABLE_VS_3BET = [
  { hero: 'BTN' as Position, threeBetter: 'BB' as Position },
  { hero: 'CO' as Position, threeBetter: 'BTN' as Position },
  { hero: 'HJ' as Position, threeBetter: 'CO' as Position },
  { hero: 'UTG' as Position, threeBetter: 'HJ' as Position },
];

const STREET_NAMES: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

// Range matrix display
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Position coordinates for 6-max table (rounded rectangle style)
const SEAT_POSITIONS: { pos: Position; x: number; y: number }[] = [
  { pos: 'HJ', x: 15, y: 50 },   // Left side, middle
  { pos: 'CO', x: 28, y: 5 },    // Top left
  { pos: 'BTN', x: 72, y: 5 },   // Top right
  { pos: 'SB', x: 85, y: 50 },   // Right side, middle
  { pos: 'BB', x: 72, y: 95 },   // Bottom right
  { pos: 'UTG', x: 28, y: 95 },  // Bottom left
];

// Parse weak spot string to get type and value
function parseWeakSpot(spot: string): { type: 'street' | 'scenario' | 'position' | 'hands'; value: string } | null {
  if (spot.endsWith('_street')) {
    return { type: 'street', value: spot.replace('_street', '') };
  }
  if (spot.endsWith('_scenario')) {
    return { type: 'scenario', value: spot.replace('_scenario', '') };
  }
  if (spot.endsWith('_position')) {
    return { type: 'position', value: spot.replace('_position', '') };
  }
  if (spot.endsWith('_hands')) {
    return { type: 'hands', value: spot.replace('_hands', '') };
  }
  return null;
}

interface WeakSpotConfig {
  targetScenario?: PreflopScenario;
  targetPosition?: Position;
  targetHandType?: 'pairs' | 'suited' | 'offsuit';
  targetStreet?: Street;
}

function generateScenario(mode: PracticeMode, weakSpotConfig?: WeakSpotConfig): PracticeScenario | null {
  const deck = shuffleDeck(createDeck());
  const heroHand: Hand = [deck[0], deck[1]];
  const villainHand: Hand = [deck[2], deck[3]];
  const handString = handToDisplayString(heroHand);

  // Determine scenario based on weak spot config or random
  let preflopScenario: PreflopScenario;
  if (weakSpotConfig?.targetScenario) {
    preflopScenario = weakSpotConfig.targetScenario;
  } else {
    const rand = Math.random();
    preflopScenario = rand < 0.4 ? 'rfi' : rand < 0.7 ? 'vs_rfi' : 'vs_3bet';
  }

  let heroPosition: Position;
  let villainPosition: Position | undefined;
  let isHeroIP = false;

  if (preflopScenario === 'rfi') {
    // Use target position if specified and valid for RFI
    if (weakSpotConfig?.targetPosition && RFI_POSITIONS.includes(weakSpotConfig.targetPosition)) {
      heroPosition = weakSpotConfig.targetPosition;
    } else {
      heroPosition = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
    }
    villainPosition = 'BB';
    isHeroIP = heroPosition !== 'SB';
  } else if (preflopScenario === 'vs_rfi') {
    heroPosition = 'BB';
    villainPosition = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
    isHeroIP = false;
  } else {
    const scenario = AVAILABLE_VS_3BET[Math.floor(Math.random() * AVAILABLE_VS_3BET.length)];
    heroPosition = scenario.hero;
    villainPosition = scenario.threeBetter;
    isHeroIP = POSITIONS_6MAX.indexOf(heroPosition) > POSITIONS_6MAX.indexOf(villainPosition);
  }

  const potSize = preflopScenario === 'rfi' ? 1.5 : preflopScenario === 'vs_rfi' ? 5 : 22;
  const heroStack = preflopScenario === 'vs_3bet' ? 88 : 98;
  const villainStack = preflopScenario === 'vs_3bet' ? 88 : 98;

  return {
    heroHand,
    handString,
    heroPosition,
    villainPosition,
    villainHand,
    preflopScenario,
    deck: deck.slice(4),
    board: [],
    currentStreet: 'preflop',
    potSize,
    heroStack,
    villainStack,
    streetResults: [],
    isHeroIP,
  };
}

function getPreflopStrategy(scenario: PracticeScenario): GTOHandStrategy | null {
  const { handString, heroPosition, villainPosition, preflopScenario } = scenario;

  if (preflopScenario === 'rfi') {
    const positionData = GTO_RANGES[heroPosition];
    const ranges = positionData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
    return null;
  } else if (preflopScenario === 'vs_rfi' && villainPosition) {
    const key = `BB_vs_${villainPosition}`;
    const rangeData = GTO_VS_RFI_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
    return null;
  } else if (villainPosition) {
    const key = `${heroPosition}_vs_${villainPosition}`;
    const rangeData = GTO_VS_3BET_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
    return null;
  }
  return null;
}

function getPostflopGTOStrategy(scenario: PracticeScenario): PostflopAction[] {
  const { heroHand, board, currentStreet, isHeroIP } = scenario;

  const boardTexture = analyzeBoardTexture(board);
  const handStrength = evaluateHandStrength(heroHand, board);

  let scenarioType: PostflopScenarioType;
  if (currentStreet === 'flop') {
    scenarioType = isHeroIP ? 'cbet' : 'facing_cbet';
  } else if (currentStreet === 'turn') {
    scenarioType = 'barrel';
  } else {
    scenarioType = 'value';
  }

  return getPostflopStrategy(currentStreet as 'flop' | 'turn' | 'river', scenarioType, boardTexture, handStrength);
}

function mapActionType(action: string): string {
  if (action === 'all-in') return 'allin';
  if (action === 'bet') return 'bet';
  return action;
}

function getAccuracyScore(actions: { action: string; frequency: number }[], chosenAction: string): number {
  const mappedAction = mapActionType(chosenAction);
  const gtoAction = actions.find(a => a.action === mappedAction);
  return gtoAction?.frequency || 0;
}

// 5级动作评级系统
interface ActionRating {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  bgColor: string;
}

function getActionRating(frequency: number): ActionRating {
  if (frequency >= 80) {
    return { level: 5, name: '完美', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' };
  }
  if (frequency >= 50) {
    return { level: 4, name: '良好', color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.15)' };
  }
  if (frequency >= 20) {
    return { level: 3, name: '小失误', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' };
  }
  if (frequency >= 5) {
    return { level: 2, name: '错误', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
  }
  return { level: 1, name: '严重失误', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
}

export default function PracticePage() {
  const { updatePracticeStats, updateDetailedStats, saveHand, settings, updateSettings, practiceStats, achievements, checkAchievements, clearRecentUnlock, savedHands, deleteHand } = useUserStore();

  // Sound effects using Web Audio API
  const playSound = useCallback((type: 'correct' | 'wrong' | 'click') => {
    if (!settings.soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'wrong') {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } else {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    }
  }, [settings.soundEnabled]);
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState<PracticeMode>('full_hand');
  const [handTypeFilter, setHandTypeFilter] = useState<HandTypeFilter>('all');
  const [currentActions, setCurrentActions] = useState<{ action: string; frequency: number; ev: number }[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState<'all' | PreflopScenario>('all');
  const [savedToast, setSavedToast] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [weakSpotMode, setWeakSpotMode] = useState(false);
  const [activeWeakSpot, setActiveWeakSpot] = useState<string | null>(null);
  const [showWeakSpotPanel, setShowWeakSpotPanel] = useState(false);

  // Timer mode state
  const [timerMode, setTimerMode] = useState(false);
  const [showRangeView, setShowRangeView] = useState(false);
  const [timerDuration, setTimerDuration] = useState(10); // seconds
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [avgDecisionTime, setAvgDecisionTime] = useState(0);
  const [decisionTimes, setDecisionTimes] = useState<number[]>([]);
  const [decisionStartTime, setDecisionStartTime] = useState<number | null>(null);

  // Achievement state
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  // New features state
  const [showProgressChart, setShowProgressChart] = useState(false);
  const [showHandHistory, setShowHandHistory] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedHistoryHand, setSelectedHistoryHand] = useState<string | null>(null);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // AI Coach state
  const [coachExpanded, setCoachExpanded] = useState(false);

  // Session stats (current session only)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });

  // Daily goal state
  const [dailyGoal, setDailyGoal] = useState(30); // Default 30 hands per day
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);

  // Get today's practice count
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return practiceStats.dailyHistory.find(d => d.date === today) || { total: 0, correct: 0 };
  }, [practiceStats.dailyHistory]);

  // Check if first time user (no decisions made yet)
  useEffect(() => {
    if (practiceStats.totalDecisions === 0) {
      // First time user - show tutorial after a short delay
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [practiceStats.totalDecisions]);

  // Get weak spot config from active weak spot
  const weakSpotConfig = useMemo((): WeakSpotConfig | undefined => {
    if (!weakSpotMode || !activeWeakSpot) return undefined;

    const parsed = parseWeakSpot(activeWeakSpot);
    if (!parsed) return undefined;

    const config: WeakSpotConfig = {};

    if (parsed.type === 'scenario') {
      config.targetScenario = parsed.value as PreflopScenario;
    } else if (parsed.type === 'position') {
      config.targetPosition = parsed.value as Position;
    } else if (parsed.type === 'hands') {
      config.targetHandType = parsed.value as 'pairs' | 'suited' | 'offsuit';
    } else if (parsed.type === 'street') {
      config.targetStreet = parsed.value as Street;
    }

    return config;
  }, [weakSpotMode, activeWeakSpot]);

  // Get human readable weak spot name
  const getWeakSpotDisplayName = (spot: string): string => {
    const parsed = parseWeakSpot(spot);
    if (!parsed) return spot;

    const nameMap: Record<string, Record<string, string>> = {
      street: { preflop: '翻前', flop: '翻牌', turn: '转牌', river: '河牌' },
      scenario: { rfi: 'RFI', vs_rfi: '面对RFI', vs_3bet: '面对3-Bet' },
      hands: { pairs: '对子', suited: '同花', offsuit: '杂色' },
    };

    if (parsed.type === 'position') {
      return `${parsed.value} 位置`;
    }

    return nameMap[parsed.type]?.[parsed.value] || parsed.value;
  };

  // Save current hand to history
  const handleSaveHand = useCallback(() => {
    if (!scenario || scenario.streetResults.length === 0) return;

    const totalScore = scenario.streetResults.reduce((sum, r) => sum + r.score, 0) / scenario.streetResults.length;

    saveHand({
      heroHand: scenario.handString,
      heroPosition: scenario.heroPosition,
      villainPosition: scenario.villainPosition || '',
      scenario: scenario.preflopScenario,
      board: scenario.board.map(c => `${c.rank}${c.suit}`),
      results: scenario.streetResults.map(r => ({
        street: r.street,
        action: r.action,
        score: r.score,
        isCorrect: r.isCorrect,
      })),
      totalScore: Math.round(totalScore),
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }, [scenario, saveHand]);

  const generateNewScenario = useCallback(() => {
    let newScenario: PracticeScenario | null = null;
    let attempts = 0;

    while (attempts < 50) {
      newScenario = generateScenario(mode, weakSpotConfig);
      if (!newScenario) break;

      const handType = getHandType(newScenario.handString);

      // Apply filters (weak spot config takes priority when in weak spot mode)
      let handTypeMatch = true;
      let scenarioMatch = true;

      if (weakSpotMode && weakSpotConfig) {
        // In weak spot mode, match the target config
        if (weakSpotConfig.targetHandType) {
          handTypeMatch = handType === weakSpotConfig.targetHandType;
        }
        if (weakSpotConfig.targetScenario) {
          scenarioMatch = newScenario.preflopScenario === weakSpotConfig.targetScenario;
        }
      } else {
        // Normal mode: use filters
        handTypeMatch = handTypeFilter === 'all' || handType === handTypeFilter;
        scenarioMatch = scenarioFilter === 'all' || newScenario.preflopScenario === scenarioFilter;
      }

      if (handTypeMatch && scenarioMatch) break;
      attempts++;
    }

    setScenario(newScenario);
    setSelectedAction(null);
    setShowResult(false);
    setAccuracyScore(0);
    setCoachExpanded(false);

    if (newScenario) {
      const strategy = getPreflopStrategy(newScenario);
      if (strategy) {
        setCurrentActions(strategy.actions.map(a => ({ ...a })));
      }
    }
  }, [mode, handTypeFilter, scenarioFilter, weakSpotMode, weakSpotConfig]);

  // Repeat current hand - reset to initial state with same cards
  const repeatCurrentScenario = useCallback(() => {
    if (!scenario) return;

    // Create a fresh deck and restore the original cards
    const freshDeck = shuffleDeck(createDeck());
    // Remove hero and villain cards from fresh deck to rebuild
    const usedCards = [
      scenario.heroHand[0],
      scenario.heroHand[1],
      ...(scenario.villainHand || []),
    ];
    const remainingDeck = freshDeck.filter(
      card => !usedCards.some(used => used.rank === card.rank && used.suit === card.suit)
    );

    // Reset scenario to preflop with same hero hand and positions
    const resetScenario: PracticeScenario = {
      ...scenario,
      deck: remainingDeck,
      board: [],
      currentStreet: 'preflop',
      potSize: scenario.preflopScenario === 'rfi' ? 1.5 : scenario.preflopScenario === 'vs_rfi' ? 5 : 22,
      heroStack: scenario.preflopScenario === 'vs_3bet' ? 88 : 98,
      villainStack: scenario.preflopScenario === 'vs_3bet' ? 88 : 98,
      streetResults: [],
    };

    setScenario(resetScenario);
    setSelectedAction(null);
    setShowResult(false);
    setAccuracyScore(0);

    // Reset preflop actions
    const strategy = getPreflopStrategy(resetScenario);
    if (strategy) {
      setCurrentActions(strategy.actions.map(a => ({ ...a })));
    }
  }, [scenario]);

  useEffect(() => { generateNewScenario(); }, [generateNewScenario]);

  // Timer effect - start timer when scenario changes and timer mode is on
  useEffect(() => {
    if (timerMode && scenario && !showResult) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
      setTimerExpired(false);
      setDecisionStartTime(Date.now());
    } else {
      setTimerActive(false);
    }
  }, [timerMode, scenario?.handString, scenario?.currentStreet, timerDuration, showResult]);

  // Timer countdown effect - uses ref to avoid circular dependency
  const handleActionRef = useRef<((action: string) => void) | null>(null);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerExpired(true);
          setTimerActive(false);
          // Auto-fold on timeout
          if (!showResult && handleActionRef.current) {
            handleActionRef.current('fold');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeLeft, showResult]);

  // Start timer for new decision
  const startTimer = useCallback(() => {
    if (timerMode) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
      setTimerExpired(false);
      setDecisionStartTime(Date.now());
    }
  }, [timerMode, timerDuration]);

  const dealNextStreet = useCallback(() => {
    if (!scenario) return;

    const newScenario = { ...scenario };
    const newBoard = [...scenario.board];

    if (scenario.currentStreet === 'preflop') {
      newBoard.push(scenario.deck[0], scenario.deck[1], scenario.deck[2]);
      newScenario.currentStreet = 'flop';
      newScenario.deck = scenario.deck.slice(3);
    } else if (scenario.currentStreet === 'flop') {
      newBoard.push(scenario.deck[0]);
      newScenario.currentStreet = 'turn';
      newScenario.deck = scenario.deck.slice(1);
    } else if (scenario.currentStreet === 'turn') {
      newBoard.push(scenario.deck[0]);
      newScenario.currentStreet = 'river';
      newScenario.deck = scenario.deck.slice(1);
    }

    newScenario.board = newBoard;

    const postflopActions = getPostflopGTOStrategy(newScenario);
    setCurrentActions(postflopActions.map(a => ({ ...a })));

    setScenario(newScenario);
    setShowResult(false);
    setSelectedAction(null);

    // Restart timer for next street
    if (timerMode) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
      setTimerExpired(false);
      setDecisionStartTime(Date.now());
    }
  }, [scenario, timerMode, timerDuration]);

  const handleAction = useCallback((action: string) => {
    if (showResult || !scenario) return;

    // Stop timer and record decision time
    setTimerActive(false);
    if (timerMode && decisionStartTime) {
      const decisionTime = (Date.now() - decisionStartTime) / 1000;
      setDecisionTimes(prev => {
        const newTimes = [...prev, decisionTime];
        const avg = newTimes.reduce((sum, t) => sum + t, 0) / newTimes.length;
        setAvgDecisionTime(Math.round(avg * 10) / 10);
        return newTimes.slice(-50); // Keep last 50 decisions
      });
    }

    setSelectedAction(action);
    const score = getAccuracyScore(currentActions, action);
    const correct = score >= 20;

    setIsCorrect(correct);
    setAccuracyScore(score);
    setShowResult(true);
    updatePracticeStats(correct);
    setStreak(prev => correct ? prev + 1 : 0);

    // Update session stats
    setSessionStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0)
    }));

    // Play sound feedback
    playSound(correct ? 'correct' : 'wrong');

    updateDetailedStats({
      correct,
      street: scenario.currentStreet,
      scenario: scenario.preflopScenario,
      position: scenario.heroPosition,
      handType: getHandType(scenario.handString),
    });

    // Check for achievement unlocks
    setTimeout(() => {
      const newUnlocks = checkAchievements();
      if (newUnlocks.length > 0) {
        const achievement = ACHIEVEMENTS[newUnlocks[0]];
        setAchievementToast(`${achievement.icon} ${achievement.name}`);
        setTimeout(() => setAchievementToast(null), 3000);
      }
      // Check for perfect score achievement
      if (score === 100 && !achievements.achievements.first_perfect?.unlockedAt) {
        const unlocks = checkAchievements();
        if (unlocks.includes('first_perfect')) {
          const achievement = ACHIEVEMENTS.first_perfect;
          setAchievementToast(`${achievement.icon} ${achievement.name}`);
          setTimeout(() => setAchievementToast(null), 3000);
        }
      }
    }, 100);

    setScenario(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        streetResults: [
          ...prev.streetResults,
          { street: prev.currentStreet, action, isCorrect: correct, score },
        ],
      };
    });
  }, [showResult, scenario, currentActions, updatePracticeStats, updateDetailedStats, playSound, timerMode, decisionStartTime, checkAchievements, achievements]);

  // Keep the ref in sync with handleAction for timer auto-fold
  useEffect(() => {
    handleActionRef.current = handleAction;
  }, [handleAction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show keyboard help with ? key
      if (e.key === '?') {
        setShowKeyboardHelp(true);
        return;
      }
      // Close modals with Escape
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
        setShowProgressChart(false);
        setShowHandHistory(false);
        setShowAchievements(false);
        setShowSessionSummary(false);
        setShowRangeView(false);
        return;
      }
      if (showResult) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (scenario?.currentStreet === 'river' || mode === 'preflop') {
            generateNewScenario();
          } else {
            dealNextStreet();
          }
        }
        return;
      }
      if (e.key.toLowerCase() === 'f') handleAction('fold');
      if (e.key.toLowerCase() === 'c') handleAction(scenario?.currentStreet === 'preflop' ? 'call' : 'check');
      if (e.key.toLowerCase() === 'b') handleAction('bet');
      if (e.key.toLowerCase() === 'r') handleAction('raise');
      if (e.key.toLowerCase() === 'a') handleAction('allin');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, scenario, generateNewScenario, dealNextStreet, handleAction, mode]);

  const availableActions = useMemo(() => {
    if (!scenario) return [];

    if (scenario.currentStreet === 'preflop') {
      if (scenario.preflopScenario === 'rfi') {
        return [
          { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
          { action: 'raise', label: 'RAISE 2.5', color: '#ef4444', hotkey: 'R' },
        ];
      } else if (scenario.preflopScenario === 'vs_rfi') {
        return [
          { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
          { action: 'call', label: 'CALL', color: '#22c55e', hotkey: 'C' },
          { action: 'raise', label: '3-BET 10', color: '#ef4444', hotkey: 'R' },
        ];
      } else {
        return [
          { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
          { action: 'call', label: 'CALL', color: '#22c55e', hotkey: 'C' },
          { action: 'raise', label: '4-BET 28', color: '#ef4444', hotkey: 'R' },
          { action: 'allin', label: 'ALL-IN', color: '#7f1d1d', hotkey: 'A' },
        ];
      }
    } else {
      return [
        { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
        { action: 'check', label: 'CHECK', color: '#6b7280', hotkey: 'C' },
        { action: 'bet', label: `BET ${(scenario.potSize * 0.5).toFixed(1)}`, color: '#ef4444', hotkey: 'B' },
      ];
    }
  }, [scenario]);

  if (!scenario) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  const canContinue = showResult && scenario.currentStreet !== 'river' && mode !== 'preflop';

  return (
    <div className="practice-page">
      {/* Top bar: Streak indicator + Weak spot toggle */}
      <div className="top-bar">
        <div className="streak-indicator">
          <span className="fire">🔥</span>
          <span className="count">{streak}</span>
        </div>

        {/* Weak spot panel toggle button */}
        {practiceStats.weakSpots.length > 0 && !weakSpotMode && (
          <button
            className="weak-spot-toggle"
            onClick={() => setShowWeakSpotPanel(!showWeakSpotPanel)}
          >
            <span className="toggle-icon">🎯</span>
            <span className="toggle-badge">{practiceStats.weakSpots.length}</span>
          </button>
        )}

        {/* Weak spot mode indicator */}
        {weakSpotMode && activeWeakSpot && (
          <div className="weak-spot-indicator">
            <span className="weak-spot-icon">🎯</span>
            <span className="weak-spot-label">针对训练: {getWeakSpotDisplayName(activeWeakSpot)}</span>
            <button
              className="weak-spot-close"
              onClick={() => {
                setWeakSpotMode(false);
                setActiveWeakSpot(null);
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* PK Mode Entry Button */}
        <Link href="/pk" className="pk-mode-btn">
          <span className="pk-icon">⚔️</span>
          <span className="pk-text">PK对战</span>
        </Link>
      </div>

      {/* Weak spot selection panel */}
      {showWeakSpotPanel && practiceStats.weakSpots.length > 0 && (
        <div className="weak-spot-panel">
          <div className="panel-header">
            <h4>需要加强的领域</h4>
            <button className="panel-close" onClick={() => setShowWeakSpotPanel(false)}>×</button>
          </div>
          <div className="panel-body">
            <p className="panel-desc">以下领域准确率低于 60%，建议针对练习：</p>
            <div className="weak-spot-list">
              {practiceStats.weakSpots.map(spot => {
                const parsed = parseWeakSpot(spot);
                if (!parsed) return null;

                // Get accuracy for this weak spot
                let accuracy = 0;
                if (parsed.type === 'street') {
                  const streetStats = practiceStats.byStreet[parsed.value as Street];
                  if (streetStats && streetStats.total > 0) {
                    accuracy = Math.round((streetStats.correct / streetStats.total) * 100);
                  }
                } else if (parsed.type === 'scenario') {
                  const scenarioStats = practiceStats.byScenario[parsed.value as PreflopScenario];
                  if (scenarioStats && scenarioStats.total > 0) {
                    accuracy = Math.round((scenarioStats.correct / scenarioStats.total) * 100);
                  }
                } else if (parsed.type === 'position') {
                  const posStats = practiceStats.byPosition[parsed.value];
                  if (posStats && posStats.total > 0) {
                    accuracy = Math.round((posStats.correct / posStats.total) * 100);
                  }
                } else if (parsed.type === 'hands') {
                  const handStats = practiceStats.byHandType[parsed.value as 'pairs' | 'suited' | 'offsuit'];
                  if (handStats && handStats.total > 0) {
                    accuracy = Math.round((handStats.correct / handStats.total) * 100);
                  }
                }

                return (
                  <button
                    key={spot}
                    className="weak-spot-item"
                    onClick={() => {
                      setActiveWeakSpot(spot);
                      setWeakSpotMode(true);
                      setShowWeakSpotPanel(false);
                      // Generate new scenario immediately
                      setTimeout(() => generateNewScenario(), 0);
                    }}
                  >
                    <span className="item-name">{getWeakSpotDisplayName(spot)}</span>
                    <span className="item-accuracy" style={{ color: accuracy < 40 ? '#ef4444' : '#f97316' }}>
                      {accuracy}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Scenario title */}
        <div className="scenario-title">
          {scenario.heroPosition} vs. {scenario.villainPosition},
          {scenario.preflopScenario === 'rfi' ? ' RFI' : scenario.preflopScenario === 'vs_rfi' ? ' 面对加注' : ' 面对3-Bet'}, 100bb
          <span className="info-icon" onClick={() => setShowScenarioInfo(true)}>ⓘ</span>
        </div>

        {/* 当前街道指示器 */}
        <div className="street-indicator">
          {(['preflop', 'flop', 'turn', 'river'] as Street[]).map((street, idx) => {
            const isCurrent = scenario.currentStreet === street;
            const isPast = ['preflop', 'flop', 'turn', 'river'].indexOf(scenario.currentStreet) > idx;
            return (
              <div key={street} className={`street-step ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}>
                <span className="step-dot">{isPast ? '✓' : idx + 1}</span>
                <span className="step-name">{STREET_NAMES[street]}</span>
              </div>
            );
          })}
        </div>

        {/* Poker Table */}
        <div className="poker-table">
          {/* Table outline */}
          <div className="table-outline" />

          {/* All seats */}
          {SEAT_POSITIONS.map(({ pos, x, y }) => {
            const isHero = pos === scenario.heroPosition;
            const isVillain = pos === scenario.villainPosition;
            const isActive = isHero || isVillain;
            const isBTN = pos === 'BTN';

            return (
              <div
                key={pos}
                className={`seat ${isActive ? 'active' : 'inactive'} ${isHero ? 'hero' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {/* Horizontal layout: cards + badge */}
                <div className="seat-content">
                  {/* Cards - only for active players */}
                  {isHero && (
                    <div className="hole-cards">
                      <PokerCard card={scenario.heroHand[0]} size="sm" variant="dark" />
                      <PokerCard card={scenario.heroHand[1]} size="sm" variant="dark" />
                    </div>
                  )}
                  {isVillain && showResult && scenario.villainHand && (
                    <div className="hole-cards">
                      <PokerCard card={scenario.villainHand[0]} size="sm" variant="dark" />
                      <PokerCard card={scenario.villainHand[1]} size="sm" variant="dark" />
                    </div>
                  )}

                  {/* Seat badge */}
                  <div className={`seat-badge ${isHero ? 'hero-badge' : ''}`}>
                    <span className="pos">{pos}</span>
                    <span className="stack">{isActive ? (isHero ? scenario.heroStack : scenario.villainStack) : 100}</span>
                  </div>
                </div>

                {/* Dealer button */}
                {isBTN && <div className="dealer-btn">D</div>}
              </div>
            );
          })}

          {/* Center: Pot + Board */}
          <div className="table-center">
            <div className="pot">
              <div className="chip-stack">
                <div className="chip c1"></div>
                <div className="chip c2"></div>
                <div className="chip c3"></div>
              </div>
              {scenario.potSize.toFixed(0)} BB
            </div>
            {scenario.board.length > 0 && (
              <div className="board">
                <div className="board-cards">
                  {scenario.board.map((card, idx) => (
                    <PokerCard key={idx} card={card} size="sm" variant="dark" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - always visible */}
        <div className="action-buttons">
          {availableActions.map(({ action, label, color, hotkey }) => (
            <button
              key={action}
              className={`action-btn ${showResult && mapActionType(selectedAction || '') === action ? 'selected' : ''}`}
              style={{ backgroundColor: color, opacity: showResult ? 0.6 : 1 }}
              onClick={() => !showResult && handleAction(action)}
              disabled={showResult}
            >
              {label}
              <span className="hotkey">{hotkey}</span>
            </button>
          ))}
        </div>

        {/* Result Panel - shown below action buttons after selection */}
        {showResult && (
          <div className="result-panel-wrapper">
            <button className="result-nav-btn prev" onClick={repeatCurrentScenario} title="重复这一手">
              <span>‹</span>
            </button>

            <div className="result-panel">
              <div className="result-content">
                {/* 左侧：你的选择 */}
                <div className="result-section your-section">
                  <div className="section-header">你的选择</div>
                  <div className={`your-action ${isCorrect ? 'correct' : 'wrong'}`}>
                    {selectedAction?.toUpperCase()}
                  </div>
                  <div className="your-score">
                    <span className="score-value" style={{ color: isCorrect ? '#22c55e' : '#f87171' }}>
                      {accuracyScore}%
                    </span>
                    <span className="score-label">{isCorrect ? '正确' : '失误'}</span>
                  </div>
                </div>

                {/* 中间：分隔线 */}
                <div className="result-divider" />

                {/* 右侧：GTO策略 */}
                <div className="result-section gto-section">
                  <div className="section-header">GTO最优策略</div>
                  <div className="gto-actions-row">
                    {currentActions
                      .filter(a => a.frequency > 0)
                      .sort((a, b) => b.frequency - a.frequency)
                      .map(action => {
                        const isSelected = mapActionType(selectedAction || '') === action.action;
                        const actionColor = action.action === 'fold' ? '#3b82f6' :
                                           action.action === 'call' || action.action === 'check' ? '#22c55e' :
                                           '#ef4444';
                        return (
                          <div
                            key={action.action}
                            className={`gto-action-chip ${isSelected ? 'selected' : ''}`}
                            style={{ borderColor: isSelected ? actionColor : 'transparent' }}
                          >
                            <span className="action-name" style={{ color: actionColor }}>
                              {action.action.toUpperCase()}
                            </span>
                            <span className="action-freq">{action.frequency}%</span>
                          </div>
                        );
                      })}
                  </div>
                  {/* 策略原因 */}
                  <div className="gto-reason">
                    {scenario.handString} 在 {scenario.heroPosition} 位置
                    {scenario.preflopScenario === 'rfi' ? '开池' :
                     scenario.preflopScenario === 'vs_rfi' ? `面对${scenario.villainPosition}加注` :
                     `面对${scenario.villainPosition}的3-Bet`}
                    {currentActions.find(a => a.frequency >= 80) ?
                      `，应${currentActions.find(a => a.frequency >= 80)?.action === 'fold' ? '弃牌' :
                            currentActions.find(a => a.frequency >= 80)?.action === 'raise' ? '加注' :
                            currentActions.find(a => a.frequency >= 80)?.action === 'call' ? '跟注' : '过牌'}` :
                      '，是混合策略'}
                  </div>
                </div>

                {/* 街道进度 */}
                <div className="street-progress">
                  {(['preflop', 'flop', 'turn', 'river'] as Street[]).map(street => {
                    const result = scenario.streetResults.find(r => r.street === street);
                    return (
                      <span
                        key={street}
                        className={`progress-dot ${result?.isCorrect ? 'correct' : result ? 'wrong' : ''}`}
                        title={STREET_NAMES[street]}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <button className="result-nav-btn next" onClick={canContinue ? dealNextStreet : generateNewScenario} title={canContinue ? '继续下一街' : '下一手'}>
              <span>›</span>
            </button>
          </div>
        )}

        {/* AI Coach Feedback */}
        {showResult && scenario && selectedAction && (
          <AICoachFeedback
            handString={scenario.handString}
            heroPosition={scenario.heroPosition}
            villainPosition={scenario.villainPosition}
            scenario={scenario.preflopScenario}
            street={scenario.currentStreet}
            playerAction={selectedAction}
            gtoStrategy={currentActions.map(a => ({ action: a.action, frequency: a.frequency }))}
            isCorrect={isCorrect}
            accuracyScore={accuracyScore}
            board={scenario.board?.map(c => `${c.rank}${c.suit}`)}
            potSize={scenario.potSize}
            language="zh"
            expanded={coachExpanded}
            onToggleExpand={() => setCoachExpanded(!coachExpanded)}
          />
        )}

        {/* Bottom bar */}
        <div className="bottom-bar">
          <button className="btn-secondary" onClick={repeatCurrentScenario}>
            <span>↻</span> 重复这一手
          </button>
          {showResult && scenario.streetResults.length > 0 && (
            <button className="btn-save" onClick={handleSaveHand}>
              <span>💾</span> 保存
            </button>
          )}
          {canContinue ? (
            <button className="btn-primary" onClick={dealNextStreet}>
              <span>▶▶</span> 继续下一街
            </button>
          ) : showResult && scenario.streetResults.length > 1 ? (
            <>
              <button className="btn-summary" onClick={() => setShowSessionSummary(true)}>
                <span>📊</span> 查看总结
              </button>
              <button className="btn-primary" onClick={generateNewScenario}>
                <span>▶▶</span> 下一手
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={generateNewScenario}>
              <span>▶▶</span> 下一手
            </button>
          )}
          <div className="more-menu-wrapper">
            <button className="btn-more" onClick={() => setShowMoreMenu(!showMoreMenu)}>⋮</button>
            {showMoreMenu && (
              <div className="more-menu">
                <div className="menu-section">
                  <div className="menu-section-title">导航</div>
                  <Link href="/" className="menu-item">
                    <span className="menu-icon">🏠</span>
                    首页
                  </Link>
                  <div className="menu-item" onClick={() => { setShowProgressChart(true); setShowMoreMenu(false); }}>
                    <span className="menu-icon">📊</span>
                    进度图表
                  </div>
                  <div className="menu-item" onClick={() => { setShowHandHistory(true); setShowMoreMenu(false); }}>
                    <span className="menu-icon">📜</span>
                    手牌历史 ({savedHands.length})
                  </div>
                  <Link href="/solutions" className="menu-item">
                    <span className="menu-icon">📚</span>
                    范围
                  </Link>
                  <div className="menu-item" onClick={() => { setShowAchievements(true); setShowMoreMenu(false); }}>
                    <span className="menu-icon">🏆</span>
                    成就 ({achievements.unlockedCount}/{achievements.totalCount})
                  </div>
                </div>
                <div className="menu-divider" />
                <div className="menu-section">
                  <div className="menu-section-title">设置</div>
                  <div
                    className="menu-item toggle-item"
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  >
                    <span className="menu-label">
                      <span className="menu-icon">{settings.soundEnabled ? '🔊' : '🔇'}</span>
                      声音
                    </span>
                    <span className={`toggle-switch ${settings.soundEnabled ? 'on' : ''}`}>
                      <span className="toggle-knob" />
                    </span>
                  </div>
                  <div className="menu-item" onClick={() => { setShowTutorial(true); setTutorialStep(0); setShowMoreMenu(false); }}>
                    <span className="menu-icon">📖</span>
                    新手教程
                  </div>
                  <Link href="/settings" className="menu-item">
                    <span className="menu-icon">⚙️</span>
                    更多设置
                  </Link>
                </div>
                <div className="menu-divider" />
                <div className="menu-hint" onClick={() => { setShowKeyboardHelp(true); setShowMoreMenu(false); }} style={{ cursor: 'pointer' }}>
                  <span className="hint-icon">⌨️</span>
                  快捷键：按 ? 查看全部
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {showMoreMenu && <div className="menu-overlay" onClick={() => setShowMoreMenu(false)} />}

      {/* 场景信息弹窗 */}
      {showScenarioInfo && (
        <div className="modal-overlay" onClick={() => setShowScenarioInfo(false)}>
          <div className="scenario-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>场景详情</h3>
              <button className="modal-close" onClick={() => setShowScenarioInfo(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <span className="info-label">场景类型</span>
                <span className="info-value">
                  {scenario.preflopScenario === 'rfi' ? 'RFI (率先加注)' :
                   scenario.preflopScenario === 'vs_rfi' ? '面对RFI (防守大盲)' : '面对3-Bet'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">你的位置</span>
                <span className="info-value highlight">{scenario.heroPosition}</span>
              </div>
              <div className="info-row">
                <span className="info-label">对手位置</span>
                <span className="info-value">{scenario.villainPosition}</span>
              </div>
              <div className="info-row">
                <span className="info-label">有效筹码</span>
                <span className="info-value">100bb</span>
              </div>
              <div className="info-row">
                <span className="info-label">当前底池</span>
                <span className="info-value">{scenario.potSize.toFixed(1)} BB</span>
              </div>
              <div className="info-row">
                <span className="info-label">位置优势</span>
                <span className="info-value">{scenario.isHeroIP ? '有位置 (IP)' : '无位置 (OOP)'}</span>
              </div>
              <div className="scenario-desc">
                <strong>行动描述：</strong>
                {scenario.preflopScenario === 'rfi' && (
                  <p>你在 {scenario.heroPosition} 位置率先行动，前面玩家全部弃牌。选择是弃牌还是加注开池。</p>
                )}
                {scenario.preflopScenario === 'vs_rfi' && (
                  <p>{scenario.villainPosition} 位置开池加注到 2.5bb，你在 BB 位置面对这个加注。选择是弃牌、跟注还是3-Bet。</p>
                )}
                {scenario.preflopScenario === 'vs_3bet' && (
                  <p>你在 {scenario.heroPosition} 位置开池加注后，{scenario.villainPosition} 位置进行了3-Bet到 10bb。选择是弃牌、跟注还是4-Bet。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved toast notification */}
      {savedToast && (
        <div className="saved-toast">
          <span>✓</span> 已保存到手牌记录
        </div>
      )}

      {/* Achievement unlock toast */}
      {achievementToast && (
        <div className="achievement-toast">
          <span className="achievement-unlock-icon">🎉</span>
          <span className="achievement-unlock-text">成就解锁: {achievementToast}</span>
        </div>
      )}

      {/* Achievement Panel Modal */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="achievement-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 成就 ({achievements.unlockedCount}/{achievements.totalCount})</h3>
              <button className="modal-close" onClick={() => setShowAchievements(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="achievement-grid">
                {(Object.keys(ACHIEVEMENTS) as Array<keyof typeof ACHIEVEMENTS>).map(id => {
                  const achievement = achievements.achievements[id];
                  const isUnlocked = !!achievement?.unlockedAt;
                  const progress = achievement?.progress || 0;
                  const maxProgress = ACHIEVEMENTS[id].maxProgress || 1;
                  const progressPercent = Math.min((progress / maxProgress) * 100, 100);

                  return (
                    <div key={id} className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      <div className="achievement-icon">{ACHIEVEMENTS[id].icon}</div>
                      <div className="achievement-info">
                        <div className="achievement-name">{ACHIEVEMENTS[id].name}</div>
                        <div className="achievement-desc">{ACHIEVEMENTS[id].description}</div>
                        {!isUnlocked && maxProgress > 1 && (
                          <div className="achievement-progress">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="progress-text">{progress}/{maxProgress}</span>
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="achievement-date">
                            {new Date(achievement.unlockedAt!).toLocaleDateString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSessionSummary && scenario && scenario.streetResults.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowSessionSummary(false)}>
          <div className="session-summary-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>这手牌总结</h3>
              <button className="modal-close" onClick={() => setShowSessionSummary(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Hand info */}
              <div className="summary-hand-info">
                <span className="summary-cards">{scenario.handString}</span>
                <span className="summary-scenario">
                  {scenario.heroPosition} {scenario.preflopScenario === 'rfi' ? 'RFI' : scenario.preflopScenario === 'vs_rfi' ? 'vs RFI' : 'vs 3-Bet'}
                </span>
              </div>

              {/* Overall score */}
              {(() => {
                const avgScore = Math.round(scenario.streetResults.reduce((sum, r) => sum + r.score, 0) / scenario.streetResults.length);
                const correctCount = scenario.streetResults.filter(r => r.isCorrect).length;
                const rating = getActionRating(avgScore);
                return (
                  <div className="summary-score" style={{ background: rating.bgColor }}>
                    <div className="summary-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= rating.level ? rating.color : '#333' }}>★</span>
                      ))}
                    </div>
                    <div className="summary-score-value" style={{ color: rating.color }}>{avgScore}%</div>
                    <div className="summary-score-label">{rating.name} · {correctCount}/{scenario.streetResults.length} 正确</div>
                  </div>
                );
              })()}

              {/* Street by street breakdown */}
              <div className="summary-breakdown">
                <h4>各街表现</h4>
                {scenario.streetResults.map((result, idx) => {
                  const streetRating = getActionRating(result.score);
                  return (
                    <div key={idx} className="summary-street-row">
                      <span className="street-label">{STREET_NAMES[result.street as Street]}</span>
                      <span className="street-action">{result.action}</span>
                      <span className="street-score" style={{ color: streetRating.color }}>{result.score}%</span>
                      <span className="street-status" style={{ color: result.isCorrect ? '#22c55e' : '#ef4444' }}>
                        {result.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Board if postflop */}
              {scenario.board.length > 0 && (
                <div className="summary-board">
                  <h4>公共牌</h4>
                  <div className="board-cards-preview">
                    {scenario.board.map((card, idx) => (
                      <PokerCard key={idx} card={card} size="sm" variant="dark" />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="summary-actions">
                <button className="btn-secondary" onClick={() => {
                  setShowSessionSummary(false);
                  handleSaveHand();
                }}>
                  💾 保存这手牌
                </button>
                <button className="btn-primary" onClick={() => {
                  setShowSessionSummary(false);
                  generateNewScenario();
                }}>
                  下一手 ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Range View Modal */}
      {showRangeView && scenario && (
        <div className="modal-overlay" onClick={() => setShowRangeView(false)}>
          <div className="range-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {scenario.preflopScenario === 'rfi'
                  ? `${scenario.heroPosition} RFI 范围`
                  : scenario.preflopScenario === 'vs_rfi'
                  ? `BB vs ${scenario.villainPosition} 范围`
                  : `${scenario.heroPosition} vs ${scenario.villainPosition} 3-Bet 范围`}
              </h3>
              <button className="modal-close" onClick={() => setShowRangeView(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="range-matrix-mini">
                {RANKS.map((r1, i) => (
                  <div key={r1} className="matrix-row">
                    {RANKS.map((r2, j) => {
                      let hand: string;
                      if (i === j) {
                        hand = r1 + r2;
                      } else if (i < j) {
                        hand = r1 + r2 + 's';
                      } else {
                        hand = r2 + r1 + 'o';
                      }

                      // Get strategy for this hand
                      const strategy = getPreflopStrategy({ ...scenario, handString: hand });
                      const isCurrentHand = hand === scenario.handString;
                      const raiseFreq = strategy?.actions.find(a => a.action === 'raise')?.frequency || 0;
                      const callFreq = strategy?.actions.find(a => a.action === 'call')?.frequency || 0;
                      const totalAction = raiseFreq + callFreq;

                      // Determine cell color based on action frequencies
                      let bgColor = '#1a1a1a';
                      if (totalAction > 80) {
                        bgColor = raiseFreq > callFreq ? '#dc2626' : '#22c55e';
                      } else if (totalAction > 50) {
                        bgColor = raiseFreq > callFreq ? '#b91c1c' : '#15803d';
                      } else if (totalAction > 20) {
                        bgColor = '#3b3b3b';
                      }

                      return (
                        <div
                          key={hand}
                          className={`matrix-cell ${isCurrentHand ? 'current' : ''}`}
                          style={{ backgroundColor: isCurrentHand ? '#22d3bf' : bgColor }}
                          title={`${hand}: R${raiseFreq}% C${callFreq}%`}
                        >
                          <span className={isCurrentHand ? 'current-text' : ''}>
                            {i === j ? r1 + r1 : i < j ? r1 + r2 : r2 + r1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="range-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#dc2626' }} />
                  <span>Raise 高频</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#22c55e' }} />
                  <span>Call 高频</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b3b3b' }} />
                  <span>Mixed</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#22d3bf' }} />
                  <span>当前手牌</span>
                </div>
              </div>
              <div className="current-hand-info">
                <span className="hand-label">{scenario.handString}</span>
                <span className="hand-strategy">
                  {currentActions.filter(a => a.frequency > 0).map(a => (
                    <span key={a.action} className="strategy-item">
                      {a.action}: {a.frequency}%
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart Modal */}
      {showProgressChart && (
        <div className="modal-overlay" onClick={() => setShowProgressChart(false)}>
          <div className="progress-chart-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 练习进度</h3>
              <button className="modal-close" onClick={() => setShowProgressChart(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Overview Stats */}
              <div className="progress-overview">
                <div className="overview-stat">
                  <div className="stat-value">{practiceStats.totalDecisions}</div>
                  <div className="stat-label">总决策数</div>
                </div>
                <div className="overview-stat">
                  <div className="stat-value">
                    {practiceStats.totalDecisions > 0
                      ? Math.round((practiceStats.correctDecisions / practiceStats.totalDecisions) * 100)
                      : 0}%
                  </div>
                  <div className="stat-label">总准确率</div>
                </div>
                <div className="overview-stat">
                  <div className="stat-value">{practiceStats.streakDays}</div>
                  <div className="stat-label">连续天数</div>
                </div>
              </div>

              {/* Daily Chart */}
              <div className="daily-chart-section">
                <h4>最近7天练习</h4>
                <div className="daily-chart">
                  {(() => {
                    const last7Days = [];
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayStats = practiceStats.dailyHistory.find(d => d.date === dateStr);
                      last7Days.push({
                        date: dateStr,
                        dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
                        total: dayStats?.total || 0,
                        correct: dayStats?.correct || 0,
                      });
                    }
                    const maxTotal = Math.max(...last7Days.map(d => d.total), 1);
                    return last7Days.map((day, idx) => (
                      <div key={idx} className="chart-bar-container">
                        <div className="chart-bar-wrapper">
                          <div
                            className="chart-bar"
                            style={{
                              height: `${(day.total / maxTotal) * 100}%`,
                              background: day.total > 0
                                ? `linear-gradient(to top, #22d3bf ${(day.correct / day.total) * 100}%, #ef4444 ${(day.correct / day.total) * 100}%)`
                                : '#333'
                            }}
                          />
                        </div>
                        <div className="chart-day-label">{day.dayName}</div>
                        <div className="chart-count">{day.total}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="category-breakdown">
                <h4>分类统计</h4>
                <div className="breakdown-grid">
                  {/* By Street */}
                  <div className="breakdown-section">
                    <div className="breakdown-title">按街道</div>
                    {(['preflop', 'flop', 'turn', 'river'] as const).map(street => {
                      const stats = practiceStats.byStreet[street];
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      return (
                        <div key={street} className="breakdown-row">
                          <span className="breakdown-label">{STREET_NAMES[street]}</span>
                          <div className="breakdown-bar">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="breakdown-value">{pct}%</span>
                          <span className="breakdown-count">({stats.total})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* By Scenario */}
                  <div className="breakdown-section">
                    <div className="breakdown-title">按场景</div>
                    {(['rfi', 'vs_rfi', 'vs_3bet'] as const).map(sc => {
                      const stats = practiceStats.byScenario[sc];
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      const labels = { rfi: 'RFI', vs_rfi: 'vs RFI', vs_3bet: 'vs 3-Bet' };
                      return (
                        <div key={sc} className="breakdown-row">
                          <span className="breakdown-label">{labels[sc]}</span>
                          <div className="breakdown-bar">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="breakdown-value">{pct}%</span>
                          <span className="breakdown-count">({stats.total})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* By Hand Type */}
                  <div className="breakdown-section">
                    <div className="breakdown-title">按手牌</div>
                    {(['pairs', 'suited', 'offsuit'] as const).map(ht => {
                      const stats = practiceStats.byHandType[ht];
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      const labels = { pairs: '对子', suited: '同花', offsuit: '杂色' };
                      return (
                        <div key={ht} className="breakdown-row">
                          <span className="breakdown-label">{labels[ht]}</span>
                          <div className="breakdown-bar">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="breakdown-value">{pct}%</span>
                          <span className="breakdown-count">({stats.total})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* By Position */}
                  <div className="breakdown-section breakdown-full-width">
                    <div className="breakdown-title">按位置</div>
                    <div className="position-stats-grid">
                      {(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const).map(pos => {
                        const stats = practiceStats.byPosition[pos] || { correct: 0, total: 0 };
                        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                        const isWeak = stats.total >= 10 && pct < 60;
                        return (
                          <div key={pos} className={`position-stat-item ${isWeak ? 'weak' : ''}`}>
                            <div className="position-badge">{pos}</div>
                            <div className="position-accuracy">
                              <div className="position-bar">
                                <div
                                  className="position-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span className="position-pct">{pct}%</span>
                            </div>
                            <div className="position-count">{stats.total} 手</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hand History Modal */}
      {showHandHistory && (
        <div className="modal-overlay" onClick={() => setShowHandHistory(false)}>
          <div className="hand-history-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 手牌历史 ({savedHands.length})</h3>
              <button className="modal-close" onClick={() => setShowHandHistory(false)}>×</button>
            </div>
            <div className="modal-body">
              {savedHands.length === 0 ? (
                <div className="empty-history">
                  <div className="empty-icon">📭</div>
                  <div className="empty-text">还没有保存的手牌</div>
                  <div className="empty-hint">完成练习后点击"保存"按钮来记录手牌</div>
                </div>
              ) : (
                <div className="history-list">
                  {savedHands.slice().reverse().map((hand) => {
                    const avgScore = Math.round(hand.results.reduce((sum, r) => sum + r.score, 0) / hand.results.length);
                    const rating = getActionRating(avgScore);
                    const isExpanded = selectedHistoryHand === hand.id;

                    return (
                      <div key={hand.id} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
                        <div className="history-item-header" onClick={() => setSelectedHistoryHand(isExpanded ? null : hand.id)}>
                          <div className="history-hand-info">
                            <span className="history-hand">{hand.heroHand}</span>
                            <span className="history-scenario">
                              {hand.heroPosition} {hand.scenario === 'rfi' ? 'RFI' : hand.scenario === 'vs_rfi' ? 'vs RFI' : 'vs 3-Bet'}
                            </span>
                          </div>
                          <div className="history-meta">
                            <span className="history-score" style={{ color: rating.color }}>{avgScore}%</span>
                            <span className="history-date">{new Date(hand.timestamp).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <span className="history-expand">{isExpanded ? '▼' : '▶'}</span>
                        </div>

                        {isExpanded && (
                          <div className="history-item-detail">
                            {/* Street results */}
                            <div className="detail-streets">
                              {hand.results.map((result, idx) => (
                                <div key={idx} className="detail-street-row">
                                  <span className="detail-street">{STREET_NAMES[result.street as Street]}</span>
                                  <span className="detail-action">{result.action}</span>
                                  <span className="detail-score" style={{ color: getActionRating(result.score).color }}>
                                    {result.score}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Board if available */}
                            {hand.board.length > 0 && (
                              <div className="detail-board">
                                <span className="board-label">公共牌:</span>
                                <span className="board-cards">{hand.board.join(' ')}</span>
                              </div>
                            )}

                            {/* Delete button */}
                            <button
                              className="btn-delete-hand"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHand(hand.id);
                                setSelectedHistoryHand(null);
                              }}
                            >
                              🗑️ 删除
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="modal-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ 快捷键</h3>
              <button className="modal-close" onClick={() => setShowKeyboardHelp(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-section">
                <div className="shortcuts-title">决策动作</div>
                <div className="shortcut-row">
                  <span className="shortcut-key">F</span>
                  <span className="shortcut-desc">弃牌 (Fold)</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">C</span>
                  <span className="shortcut-desc">跟注/过牌 (Call/Check)</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">R</span>
                  <span className="shortcut-desc">加注 (Raise)</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">B</span>
                  <span className="shortcut-desc">下注 (Bet)</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">A</span>
                  <span className="shortcut-desc">全下 (All-in)</span>
                </div>
              </div>

              <div className="shortcuts-section">
                <div className="shortcuts-title">导航</div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Space</span>
                  <span className="shortcut-desc">下一手/下一街</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Enter</span>
                  <span className="shortcut-desc">下一手/下一街</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Esc</span>
                  <span className="shortcut-desc">关闭弹窗</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">?</span>
                  <span className="shortcut-desc">显示快捷键帮助</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
          <div className="tutorial-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 新手教程</h3>
              <button className="modal-close" onClick={() => setShowTutorial(false)}>×</button>
            </div>
            <div className="modal-body">
              {tutorialStep === 0 && (
                <div className="tutorial-step">
                  <div className="tutorial-icon">🎯</div>
                  <h4>欢迎来到GTO训练器!</h4>
                  <p>这是一款帮助你学习博弈论最优(GTO)扑克策略的训练工具。通过反复练习，提高你的决策能力。</p>
                  <div className="tutorial-highlight">
                    <span className="highlight-label">目标</span>
                    <span className="highlight-text">根据GTO策略选择最佳动作</span>
                  </div>
                </div>
              )}
              {tutorialStep === 1 && (
                <div className="tutorial-step">
                  <div className="tutorial-icon">🃏</div>
                  <h4>理解场景</h4>
                  <p>每个练习场景包含:</p>
                  <ul className="tutorial-list">
                    <li><strong>你的手牌</strong> - 屏幕中央显示的两张牌</li>
                    <li><strong>位置</strong> - 你在牌桌上的位置(UTG, HJ, CO, BTN, SB, BB)</li>
                    <li><strong>场景类型</strong> - RFI(率先加注)、面对RFI、面对3-Bet</li>
                  </ul>
                </div>
              )}
              {tutorialStep === 2 && (
                <div className="tutorial-step">
                  <div className="tutorial-icon">🎮</div>
                  <h4>如何做决策</h4>
                  <p>观察你的手牌和位置，然后选择动作:</p>
                  <div className="tutorial-actions">
                    <div className="action-item action-fold">Fold - 弃牌</div>
                    <div className="action-item action-call">Call - 跟注</div>
                    <div className="action-item action-raise">Raise - 加注</div>
                    <div className="action-item action-allin">All-in - 全下</div>
                  </div>
                  <p className="tutorial-tip">💡 使用键盘快捷键更高效: F/C/R/A</p>
                </div>
              )}
              {tutorialStep === 3 && (
                <div className="tutorial-step">
                  <div className="tutorial-icon">📊</div>
                  <h4>理解结果</h4>
                  <p>选择后你会看到GTO最优策略的频率分布:</p>
                  <ul className="tutorial-list">
                    <li><strong>100%</strong> - 完美选择，该动作是唯一最优解</li>
                    <li><strong>50-99%</strong> - 良好选择，是混合策略的一部分</li>
                    <li><strong>1-49%</strong> - 有待改进，不是主要选择</li>
                    <li><strong>0%</strong> - 错误选择，不在GTO范围内</li>
                  </ul>
                </div>
              )}
              {tutorialStep === 4 && (
                <div className="tutorial-step">
                  <div className="tutorial-icon">🏆</div>
                  <h4>进阶功能</h4>
                  <ul className="tutorial-list">
                    <li><strong>弱点练习</strong> - 专注于你表现较差的领域</li>
                    <li><strong>计时模式</strong> - 限时决策，模拟真实比赛压力</li>
                    <li><strong>成就系统</strong> - 解锁成就，追踪进步</li>
                    <li><strong>进度图表</strong> - 查看每日练习数据</li>
                  </ul>
                  <p className="tutorial-tip">🎯 建议每天练习20-50手，持续提高!</p>
                </div>
              )}
            </div>
            <div className="tutorial-footer">
              <div className="tutorial-progress">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`progress-dot ${i === tutorialStep ? 'active' : i < tutorialStep ? 'completed' : ''}`} />
                ))}
              </div>
              <div className="tutorial-buttons">
                {tutorialStep > 0 && (
                  <button className="btn-secondary" onClick={() => setTutorialStep(s => s - 1)}>上一步</button>
                )}
                {tutorialStep < 4 ? (
                  <button className="btn-primary" onClick={() => setTutorialStep(s => s + 1)}>下一步</button>
                ) : (
                  <button className="btn-primary" onClick={() => setShowTutorial(false)}>开始练习!</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter toggle button */}
      <button
        className="filter-toggle-btn"
        onClick={() => setShowFilterPanel(!showFilterPanel)}
        title="筛选设置"
      >
        <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {(handTypeFilter !== 'all' || scenarioFilter !== 'all' || timerMode) && (
          <span className="filter-active-dot" />
        )}
      </button>

      {/* Filter panel - top right */}
      {showFilterPanel && (
        <>
          <div className="filter-overlay" onClick={() => setShowFilterPanel(false)} />
          <div className="filter-panel">
        {/* 模式筛选 */}
        <div className="filter-group">
          <span className="filter-label">模式</span>
          <div className="filter-chips">
            {[
              { value: 'preflop', label: '翻前' },
              { value: 'full_hand', label: '完整' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-chip ${mode === opt.value ? 'active' : ''}`}
                onClick={() => setMode(opt.value as PracticeMode)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 场景筛选 */}
        <div className="filter-group">
          <span className="filter-label">场景</span>
          <div className="filter-chips">
            {[
              { value: 'all', label: '全部' },
              { value: 'rfi', label: 'RFI' },
              { value: 'vs_rfi', label: 'vs RFI' },
              { value: 'vs_3bet', label: 'vs 3-Bet' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-chip ${scenarioFilter === opt.value ? 'active' : ''}`}
                onClick={() => setScenarioFilter(opt.value as typeof scenarioFilter)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 手牌类型筛选 */}
        <div className="filter-group">
          <span className="filter-label">手牌</span>
          <div className="filter-chips">
            {[
              { value: 'all', label: '全部' },
              { value: 'pairs', label: '对子' },
              { value: 'suited', label: '同花' },
              { value: 'offsuit', label: '杂色' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-chip ${handTypeFilter === opt.value ? 'active' : ''}`}
                onClick={() => setHandTypeFilter(opt.value as HandTypeFilter)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 计时模式 */}
        <div className="filter-group timer-group">
          <span className="filter-label">计时</span>
          <div className="filter-chips">
            <button
              className={`filter-chip timer-chip ${timerMode ? 'active' : ''}`}
              onClick={() => setTimerMode(!timerMode)}
            >
              {timerMode ? '⏱️ 开' : '⏱️ 关'}
            </button>
            {timerMode && (
              <select
                className="timer-select"
                value={timerDuration}
                onChange={(e) => setTimerDuration(Number(e.target.value))}
              >
                <option value={5}>5秒</option>
                <option value={10}>10秒</option>
                <option value={15}>15秒</option>
                <option value={20}>20秒</option>
                <option value={30}>30秒</option>
              </select>
            )}
          </div>
        </div>

        {/* 平均决策时间 */}
        {timerMode && decisionTimes.length > 0 && (
          <div className="avg-time-display">
            <span className="avg-label">平均决策</span>
            <span className="avg-value">{avgDecisionTime}s</span>
          </div>
        )}
          </div>
        </>
      )}

      {/* Timer display */}
      {timerMode && !showResult && (
        <div className={`timer-display ${timeLeft <= 3 ? 'warning' : ''}`}>
          <svg className="timer-ring" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="16"
              fill="none"
              stroke="#333"
              strokeWidth="3"
            />
            <circle
              cx="18" cy="18" r="16"
              fill="none"
              stroke={timeLeft <= 3 ? '#ef4444' : '#22d3bf'}
              strokeWidth="3"
              strokeDasharray={`${(timeLeft / timerDuration) * 100} 100`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          <span className="timer-value">{timeLeft}</span>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="quick-stat" onClick={() => setShowProgressChart(true)}>
          <span className="stat-icon">📊</span>
          <span className="stat-label">今日</span>
          <span className="stat-main">{todayStats.total}/{dailyGoal}</span>
          <div className="stat-progress">
            <div
              className="stat-progress-fill"
              style={{
                width: `${Math.min((todayStats.total / dailyGoal) * 100, 100)}%`,
                background: todayStats.total >= dailyGoal ? '#22c55e' : '#22d3bf'
              }}
            />
          </div>
        </div>
        <div className="quick-stat-divider" />
        <div className="quick-stat">
          <span className="stat-icon">🎯</span>
          <span className="stat-label">本次</span>
          <span className="stat-main">{sessionStats.correct}/{sessionStats.total}</span>
          <span className="stat-pct">
            {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
          </span>
        </div>
        <div className="quick-stat-divider" />
        <div className="quick-stat" onClick={() => setShowDailyGoalModal(true)}>
          <span className="stat-icon">🏆</span>
          <span className="stat-label">目标</span>
          <span className="stat-main">{dailyGoal}手</span>
          <span className="stat-edit">✏️</span>
        </div>
      </div>

      {/* Daily Goal Modal */}
      {showDailyGoalModal && (
        <div className="modal-overlay" onClick={() => setShowDailyGoalModal(false)}>
          <div className="daily-goal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 设置每日目标</h3>
              <button className="modal-close" onClick={() => setShowDailyGoalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="goal-desc">设置每天的练习目标，帮助你保持持续进步</p>
              <div className="goal-options">
                {[10, 20, 30, 50, 100].map(goal => (
                  <button
                    key={goal}
                    className={`goal-option ${dailyGoal === goal ? 'active' : ''}`}
                    onClick={() => setDailyGoal(goal)}
                  >
                    {goal}手
                  </button>
                ))}
              </div>
              <div className="goal-custom">
                <label>自定义:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                />
                <span>手/天</span>
              </div>
              <div className="goal-stats">
                <div className="goal-stat-row">
                  <span>今日已完成</span>
                  <span className="goal-stat-value">{todayStats.total} 手</span>
                </div>
                <div className="goal-stat-row">
                  <span>今日准确率</span>
                  <span className="goal-stat-value">
                    {todayStats.total > 0 ? Math.round((todayStats.correct / todayStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="goal-stat-row">
                  <span>距离目标还差</span>
                  <span className="goal-stat-value">
                    {Math.max(0, dailyGoal - todayStats.total)} 手
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDailyGoalModal(false)}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .practice-page {
          min-height: 100vh;
          width: 100vw;
          background: #0d0d0d;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          padding-top: 0;
        }

        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #22d3bf;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Top bar container */
        .top-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        /* Streak indicator */
        .streak-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .streak-indicator .fire { font-size: 20px; }
        .streak-indicator .count { font-size: 16px; color: #fff; font-weight: 600; }

        /* Weak spot toggle button */
        .weak-spot-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          min-height: unset !important;
          height: auto !important;
        }

        .weak-spot-toggle:hover .toggle-badge {
          background: rgba(245, 158, 11, 0.3);
        }

        .weak-spot-toggle .toggle-icon { font-size: 20px; }

        .weak-spot-toggle .toggle-badge {
          font-size: 16px;
          font-weight: 600;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
        }

        /* Weak spot indicator (active mode) */
        .weak-spot-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid #f59e0b;
          padding: 8px 16px;
          border-radius: 20px;
        }

        .weak-spot-icon { font-size: 16px; }
        .weak-spot-label { font-size: 13px; color: #f59e0b; font-weight: 500; }

        .weak-spot-close {
          background: none;
          border: none;
          color: #f59e0b;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
        }

        .weak-spot-close:hover { opacity: 1; }

        /* Weak spot panel */
        .weak-spot-panel {
          position: absolute;
          top: 70px;
          left: 24px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          width: 280px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }

        .weak-spot-panel .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #333;
        }

        .weak-spot-panel .panel-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .weak-spot-panel .panel-close {
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .weak-spot-panel .panel-close:hover { color: #fff; }

        .weak-spot-panel .panel-body {
          padding: 12px 16px;
        }

        .weak-spot-panel .panel-desc {
          font-size: 12px;
          color: #888;
          margin: 0 0 12px 0;
        }

        .weak-spot-panel .weak-spot-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .weak-spot-panel .weak-spot-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .weak-spot-panel .weak-spot-item:hover {
          background: #2a2a2a;
          border-color: #f59e0b;
        }

        .weak-spot-panel .item-name {
          font-size: 13px;
          color: #fff;
        }

        .weak-spot-panel .item-accuracy {
          font-size: 13px;
          font-weight: 600;
        }

        /* Filter toggle button */
        .filter-toggle-btn {
          position: fixed;
          top: 60px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 60;
          transition: all 0.2s;
        }

        .filter-toggle-btn:hover {
          opacity: 0.7;
        }

        .filter-toggle-btn .filter-icon {
          width: 20px;
          height: 20px;
          color: #fff;
        }

        .filter-toggle-btn .filter-active-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #22d3bf;
          border-radius: 50%;
          box-shadow: 0 0 6px #22d3bf;
        }

        /* Filter overlay */
        .filter-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 55;
        }

        /* Filter panel */
        .filter-panel {
          position: fixed;
          top: 114px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(26, 26, 26, 0.98);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #333;
          z-index: 100;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          animation: filterSlideIn 0.2s ease;
        }

        @keyframes filterSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile: collapse filter panel to avoid overlap */
        @media (max-width: 768px) {
          .filter-panel {
            top: auto;
            bottom: 80px;
            right: 8px;
            left: 8px;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
            padding: 8px;
            max-height: none;
          }

          .filter-panel .filter-group {
            flex: 0 0 auto;
          }

          .filter-panel .filter-label {
            display: none;
          }
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 11px;
          color: #666;
          min-width: 32px;
        }

        .filter-chips {
          display: flex;
          gap: 4px;
        }

        .filter-chip {
          padding: 4px 10px;
          background: #222;
          border: 1px solid #333;
          border-radius: 12px;
          color: #888;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
          min-height: auto !important;
          height: auto;
        }

        .filter-chip:hover {
          border-color: #555;
          color: #aaa;
        }

        .filter-chip.active {
          background: rgba(34, 211, 191, 0.15);
          border-color: #22d3bf;
          color: #22d3bf;
        }

        /* Timer controls */
        .timer-select {
          padding: 4px 8px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          color: #22d3bf;
          font-size: 11px;
          cursor: pointer;
        }

        .timer-select:focus {
          outline: none;
          border-color: #22d3bf;
        }

        .avg-time-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(34, 211, 191, 0.1);
          border-radius: 8px;
          margin-top: 4px;
        }

        .avg-time-display .avg-label {
          font-size: 10px;
          color: #888;
        }

        .avg-time-display .avg-value {
          font-size: 12px;
          font-weight: 600;
          color: #22d3bf;
        }

        /* Timer display */
        .timer-display {
          position: absolute;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
        }

        .timer-display .timer-ring {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .timer-display .timer-value {
          font-size: 20px;
          font-weight: 700;
          color: #22d3bf;
          z-index: 1;
        }

        .timer-display.warning .timer-value {
          color: #ef4444;
          animation: pulse 0.5s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Main content */
        .main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1100px;
          padding: 16px 40px 120px;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }

        /* Scenario title */
        .scenario-title {
          font-size: 14px;
          color: #888;
          margin-bottom: 4px;
        }

        .info-icon {
          margin-left: 6px;
          color: #555;
          cursor: pointer;
          transition: color 0.15s;
        }

        .info-icon:hover {
          color: #22d3bf;
        }

        /* 街道指示器 */
        .street-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 24px;
        }

        .street-step {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #1a1a1a;
          border-radius: 20px;
          font-size: 12px;
          color: #555;
          transition: all 0.2s;
        }

        .street-step .step-dot {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #333;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 600;
        }

        .street-step .step-name {
          font-weight: 500;
        }

        .street-step.current {
          background: rgba(34, 211, 191, 0.15);
          color: #22d3bf;
        }

        .street-step.current .step-dot {
          background: #22d3bf;
          color: #000;
        }

        .street-step.past {
          color: #666;
        }

        .street-step.past .step-dot {
          background: #22c55e;
          color: #fff;
          font-size: 11px;
        }

        /* Poker Table */
        .poker-table {
          position: relative;
          width: 100%;
          flex: 0 0 auto;
          height: 200px;
          min-height: 200px;
          max-height: 200px;
          margin-bottom: 32px;
        }

        .table-outline {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 90%;
          border: 2px solid #2a2a2a;
          border-radius: 100px;
        }

        /* Seats */
        .seat {
          position: absolute;
          transform: translate(-50%, -50%);
        }

        .seat.inactive { opacity: 0.4; }

        .seat-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hole-cards {
          display: flex;
          gap: 2px;
        }

        .seat-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 12px;
          background: #222;
          border: 2px solid #333;
          border-radius: 16px;
          min-width: 44px;
        }

        .seat.hero .seat-badge {
          border-color: #22d3bf;
          background: rgba(34, 211, 191, 0.1);
        }

        .seat-badge .pos {
          font-size: 11px;
          color: #888;
          font-weight: 600;
        }

        .seat.hero .seat-badge .pos { color: #22d3bf; }

        .seat-badge .stack {
          font-size: 12px;
          color: #fff;
          font-weight: 700;
        }

        .dealer-btn {
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        /* Table center */
        .table-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .pot {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chip-stack {
          position: relative;
          width: 28px;
          height: 24px;
        }

        .chip-stack .chip {
          position: absolute;
          width: 26px;
          height: 6px;
          border-radius: 3px;
          left: 0;
        }

        .chip-stack .chip.c1 {
          background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
          bottom: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .chip-stack .chip.c2 {
          background: linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
          bottom: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .chip-stack .chip.c3 {
          background: linear-gradient(90deg, #15803d 0%, #22c55e 50%, #15803d 100%);
          bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .board {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .board-cards {
          display: flex;
          gap: 4px;
        }

        /* Result Panel Wrapper */
        .result-panel-wrapper {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 0;
          width: 100%;
          max-width: 800px;
          margin-top: 24px;
          position: static !important;
          z-index: 1;
        }

        .result-nav-btn {
          width: 48px;
          border: none;
          background: transparent;
          color: #555;
          font-size: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .result-nav-btn:hover {
          color: #fff;
        }

        /* Result Panel */
        .result-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          flex: 1;
          min-width: 0;
          position: static !important;
        }

        @media (max-width: 768px) {
          .result-panel-wrapper {
            padding: 0;
          }

          .result-nav-btn {
            width: 36px;
            font-size: 24px;
          }

          .result-panel {
            padding: 16px 20px;
          }
        }

        .result-content {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 12px 16px;
          background: rgba(26, 26, 26, 0.95);
          border-radius: 12px;
          border: 1px solid #333;
        }

        .score-circle-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .score-circle {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .score-circle svg { width: 100%; height: 100%; }

        .score-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .score-inner .label { font-size: 10px; color: #888; margin-bottom: 2px; }
        .score-inner .value { font-size: 20px; font-weight: 700; }

        @media (max-width: 768px) {
          .result-content {
            gap: 12px;
            padding: 10px 12px;
          }
          .score-circle {
            width: 60px;
            height: 60px;
          }
          .score-inner .label { font-size: 8px; }
          .score-inner .value { font-size: 16px; }
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 180px;
        }

        /* 用户选择 */
        .your-choice {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .your-choice .choice-label {
          font-size: 11px;
          color: #888;
        }

        .your-choice .choice-value {
          font-size: 13px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .your-choice .choice-value.correct {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .your-choice .choice-value.wrong {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .your-choice .choice-freq {
          font-size: 11px;
          color: #666;
        }

        /* GTO 策略 */
        .gto-strategy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .gto-strategy .strategy-label {
          font-size: 11px;
          color: #888;
        }

        .gto-strategy .strategy-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .gto-strategy .strategy-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: #1a1a1a;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .gto-strategy .strategy-item.selected {
          border-color: #22d3bf;
          background: rgba(34, 211, 191, 0.1);
        }

        .gto-strategy .strategy-action {
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          min-width: 45px;
        }

        .gto-strategy .strategy-bar {
          flex: 1;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
          min-width: 60px;
        }

        .gto-strategy .strategy-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .gto-strategy .strategy-freq {
          font-size: 11px;
          font-weight: 600;
          color: #22d3bf;
          min-width: 30px;
          text-align: right;
        }

        /* 结果状态 */
        .result-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-status .status-icon {
          font-size: 24px;
        }

        .result-status .status-text {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
        }

        @media (max-width: 768px) {
          .result-status .status-icon { font-size: 20px; }
          .result-status .status-text { font-size: 18px; }
        }

        /* 5级评级样式 */
        .rating-display {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .rating-stars {
          display: flex;
          gap: 1px;
        }

        .rating-stars .star {
          font-size: 14px;
          transition: color 0.2s;
        }

        .rating-label {
          font-size: 14px;
          font-weight: 700;
        }

        .street-chips {
          display: flex;
          gap: 3px;
          margin-top: 4px;
        }

        .street-chips .chip {
          padding: 2px 6px;
          background: #222;
          border-radius: 3px;
          font-size: 10px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .street-chips .chip-icon {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 700;
        }

        .street-chips .chip.correct { background: #222; color: #aaa; }
        .street-chips .chip.correct .chip-icon { background: #22c55e; color: #fff; }
        .street-chips .chip.wrong { background: #222; color: #aaa; }
        .street-chips .chip.wrong .chip-icon { background: #ef4444; color: #fff; }

        /* GTO Actions Display */
        .gto-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 6px 0;
          min-width: 220px;
        }

        .gto-action-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          background: #222;
          border-radius: 4px;
          font-size: 11px;
          overflow: hidden;
        }

        .gto-action-item.selected {
          border: 1px solid #22d3bf;
          background: rgba(34, 211, 191, 0.1);
        }

        .gto-action-item .action-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          opacity: 0.2;
          z-index: 0;
        }

        .gto-action-item .action-name {
          position: relative;
          z-index: 1;
          font-weight: 600;
          color: #fff;
          min-width: 50px;
        }

        .gto-action-item .action-freq {
          position: relative;
          z-index: 1;
          font-weight: 700;
          color: #22d3bf;
          min-width: 45px;
        }

        .gto-action-item .action-ev {
          position: relative;
          z-index: 1;
          font-size: 11px;
          color: #888;
          min-width: 70px;
        }

        .gto-action-item .selected-mark {
          position: relative;
          z-index: 1;
          font-size: 11px;
          color: #22d3bf;
          margin-left: auto;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: transform 0.1s, filter 0.1s;
        }

        .action-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        .action-btn:disabled { cursor: not-allowed; }
        .action-btn.selected { box-shadow: 0 0 0 3px #22d3bf, 0 0 15px rgba(34, 211, 191, 0.5); }

        .action-btn .hotkey {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-left: 8px;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          opacity: 0.8;
        }

        /* Bottom bar */
        .bottom-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }

        .btn-secondary {
          padding: 12px 20px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-secondary:hover { border-color: #555; color: #aaa; }

        .btn-save {
          padding: 12px 16px;
          background: transparent;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          color: #f59e0b;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-save:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .btn-summary {
          padding: 12px 16px;
          background: transparent;
          border: 1px solid #8b5cf6;
          border-radius: 8px;
          color: #8b5cf6;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-summary:hover {
          background: rgba(139, 92, 246, 0.1);
        }

        .btn-primary {
          padding: 12px 40px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary:hover { background: #1eb8a6; }

        .btn-more {
          padding: 12px 14px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 16px;
          cursor: pointer;
        }

        .btn-more:hover { border-color: #555; }

        /* More Menu */
        .more-menu-wrapper {
          position: relative;
          z-index: 100;
        }

        .more-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 8px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 12px;
          min-width: 200px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }

        .more-menu .menu-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .more-menu .menu-section-title {
          font-size: 10px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 8px;
          margin-bottom: 4px;
        }

        .more-menu .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          color: #ccc;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 8px;
        }

        .more-menu .menu-item:hover {
          background: #252525;
          color: #fff;
        }

        .more-menu .menu-item.toggle-item {
          justify-content: space-between;
        }

        .more-menu .menu-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .more-menu .menu-icon {
          font-size: 14px;
          width: 18px;
          text-align: center;
        }

        .more-menu .toggle-switch {
          width: 36px;
          height: 20px;
          background: #333;
          border-radius: 10px;
          position: relative;
          transition: background 0.2s;
        }

        .more-menu .toggle-switch.on {
          background: #22d3bf;
        }

        .more-menu .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .more-menu .toggle-switch.on .toggle-knob {
          transform: translateX(16px);
        }

        .more-menu .menu-divider {
          height: 1px;
          background: #2a2a2a;
          margin: 8px 0;
        }

        .more-menu .menu-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: #555;
        }

        .more-menu .hint-icon {
          font-size: 12px;
        }

        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .scenario-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        }

        .modal-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: #666;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .modal-close:hover { color: #fff; }

        .modal-body {
          padding: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #222;
        }

        .info-row:last-of-type {
          border-bottom: none;
        }

        .info-label {
          color: #888;
          font-size: 13px;
        }

        .info-value {
          color: #fff;
          font-size: 13px;
          font-weight: 500;
        }

        .info-value.highlight {
          color: #22d3bf;
        }

        .scenario-desc {
          margin-top: 16px;
          padding: 12px;
          background: #222;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }

        .scenario-desc strong {
          color: #888;
          display: block;
          margin-bottom: 8px;
        }

        .scenario-desc p {
          color: #ccc;
          margin: 0;
        }

        /* Session Summary Modal */
        .session-summary-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 420px;
          overflow: hidden;
        }

        .summary-hand-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-cards {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }

        .summary-scenario {
          font-size: 14px;
          color: #888;
        }

        .summary-score {
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .summary-stars {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .summary-score-value {
          font-size: 36px;
          font-weight: 700;
        }

        .summary-score-label {
          font-size: 14px;
          color: #888;
          margin-top: 4px;
        }

        .summary-breakdown {
          margin-bottom: 20px;
        }

        .summary-breakdown h4 {
          font-size: 13px;
          color: #888;
          margin-bottom: 12px;
        }

        .summary-street-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #222;
          border-radius: 6px;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .summary-street-row .street-label {
          width: 50px;
          color: #888;
        }

        .summary-street-row .street-action {
          flex: 1;
          color: #fff;
        }

        .summary-street-row .street-score {
          font-weight: 600;
          width: 50px;
          text-align: right;
        }

        .summary-street-row .street-status {
          width: 20px;
          text-align: center;
        }

        .summary-board {
          margin-bottom: 20px;
        }

        .summary-board h4 {
          font-size: 13px;
          color: #888;
          margin-bottom: 12px;
        }

        .board-cards-preview {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .summary-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        /* Saved toast */
        .saved-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(34, 197, 94, 0.9);
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 300;
          animation: toastIn 0.3s ease;
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Range View Modal */
        .range-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 20px;
          min-width: 400px;
          max-width: 480px;
        }

        .range-modal h3 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 16px 0;
          text-align: center;
        }

        .range-matrix-mini {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-bottom: 16px;
        }

        .matrix-row {
          display: flex;
          gap: 1px;
        }

        .matrix-cell {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 600;
          border-radius: 3px;
          color: rgba(255,255,255,0.9);
          transition: transform 0.1s;
        }

        .matrix-cell:hover {
          transform: scale(1.1);
          z-index: 1;
        }

        .matrix-cell.current {
          outline: 2px solid #22d3bf;
          outline-offset: 1px;
          z-index: 2;
        }

        .range-legend {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #888;
        }

        .legend-item .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 3px;
        }

        .current-hand-info {
          text-align: center;
          padding: 12px;
          background: #222;
          border-radius: 8px;
        }

        .current-hand-info .hand-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 6px;
        }

        .current-hand-info .hand-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .current-hand-info .hand-name {
          font-size: 18px;
          font-weight: 700;
          color: #22d3bf;
        }

        .current-hand-info .hand-actions {
          font-size: 12px;
          color: #fff;
        }

        .current-hand-info .hand-strategy {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 8px;
        }

        .current-hand-info .strategy-item {
          padding: 4px 10px;
          background: #333;
          border-radius: 4px;
          font-size: 12px;
          color: #fff;
        }

        .matrix-cell .current-text {
          color: #000;
          font-weight: 700;
        }

        /* Range view button in street-chips */
        .range-view-btn {
          padding: 4px 10px;
          background: rgba(34, 211, 191, 0.1);
          border: 1px solid #22d3bf;
          border-radius: 4px;
          font-size: 11px;
          color: #22d3bf;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
        }

        .range-view-btn:hover {
          background: rgba(34, 211, 191, 0.2);
        }

        /* Achievement Toast */
        .achievement-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #000;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 400;
          animation: achievementIn 0.5s ease;
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
        }

        .achievement-unlock-icon {
          font-size: 18px;
        }

        @keyframes achievementIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.9);
          }
          50% {
            transform: translateX(-50%) translateY(5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        /* Achievement Modal */
        .achievement-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 520px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .achievement-modal .modal-body {
          overflow-y: auto;
          padding: 20px;
        }

        .achievement-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .achievement-item {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: #222;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .achievement-item.locked {
          opacity: 0.5;
        }

        .achievement-item.unlocked {
          background: rgba(34, 211, 191, 0.1);
          border: 1px solid rgba(34, 211, 191, 0.3);
        }

        .achievement-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #333;
          border-radius: 10px;
        }

        .achievement-item.unlocked .achievement-icon {
          background: rgba(34, 211, 191, 0.2);
        }

        .achievement-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .achievement-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .achievement-desc {
          font-size: 12px;
          color: #888;
        }

        .achievement-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }

        .achievement-progress .progress-bar {
          flex: 1;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .achievement-progress .progress-fill {
          height: 100%;
          background: #22d3bf;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .achievement-progress .progress-text {
          font-size: 11px;
          color: #666;
          min-width: 50px;
          text-align: right;
        }

        .achievement-date {
          font-size: 11px;
          color: #22d3bf;
          margin-top: 4px;
        }

        /* Progress Chart Modal */
        .progress-chart-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .progress-chart-modal .modal-body {
          overflow-y: auto;
          padding: 20px;
        }

        .progress-overview {
          display: flex;
          justify-content: space-around;
          margin-bottom: 24px;
          padding: 16px;
          background: #222;
          border-radius: 12px;
        }

        .overview-stat {
          text-align: center;
        }

        .overview-stat .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #22d3bf;
        }

        .overview-stat .stat-label {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .daily-chart-section {
          margin-bottom: 24px;
        }

        .daily-chart-section h4 {
          font-size: 14px;
          color: #888;
          margin-bottom: 12px;
        }

        .daily-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 120px;
          padding: 10px;
          background: #222;
          border-radius: 12px;
        }

        .chart-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .chart-bar-wrapper {
          width: 24px;
          height: 80px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .chart-bar {
          width: 100%;
          min-height: 2px;
          border-radius: 4px;
          transition: height 0.3s ease;
        }

        .chart-day-label {
          font-size: 11px;
          color: #666;
        }

        .chart-count {
          font-size: 10px;
          color: #888;
        }

        .category-breakdown h4 {
          font-size: 14px;
          color: #888;
          margin-bottom: 12px;
        }

        .breakdown-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .breakdown-section {
          background: #222;
          border-radius: 12px;
          padding: 14px;
        }

        .breakdown-title {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 10px;
        }

        .breakdown-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .breakdown-row:last-child {
          margin-bottom: 0;
        }

        .breakdown-label {
          font-size: 12px;
          color: #aaa;
          width: 60px;
        }

        .breakdown-bar {
          flex: 1;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .breakdown-bar .bar-fill {
          height: 100%;
          background: #22d3bf;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .breakdown-value {
          font-size: 12px;
          font-weight: 600;
          color: #22d3bf;
          width: 35px;
          text-align: right;
        }

        .breakdown-count {
          font-size: 10px;
          color: #666;
          width: 40px;
        }

        .breakdown-full-width {
          grid-column: 1 / -1;
        }

        .position-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .position-stat-item {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }

        .position-stat-item.weak {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .position-badge {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
        }

        .position-accuracy {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .position-bar {
          flex: 1;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .position-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .position-pct {
          font-size: 11px;
          font-weight: 600;
          color: #aaa;
          width: 30px;
          text-align: right;
        }

        .position-count {
          font-size: 10px;
          color: #666;
        }

        /* Hand History Modal */
        .hand-history-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .hand-history-modal .modal-body {
          overflow-y: auto;
          padding: 16px;
        }

        .empty-history {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 16px;
          color: #888;
          margin-bottom: 8px;
        }

        .empty-hint {
          font-size: 13px;
          color: #666;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          background: #222;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .history-item.expanded {
          background: #252525;
        }

        .history-item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
        }

        .history-item-header:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .history-hand-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .history-hand {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .history-scenario {
          font-size: 11px;
          color: #888;
        }

        .history-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .history-score {
          font-size: 14px;
          font-weight: 600;
        }

        .history-date {
          font-size: 10px;
          color: #666;
        }

        .history-expand {
          font-size: 10px;
          color: #666;
          width: 16px;
        }

        .history-item-detail {
          padding: 0 12px 12px;
          border-top: 1px solid #333;
        }

        .detail-streets {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 0;
        }

        .detail-street-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-street {
          font-size: 12px;
          color: #888;
          width: 40px;
        }

        .detail-action {
          font-size: 12px;
          color: #aaa;
          flex: 1;
        }

        .detail-score {
          font-size: 12px;
          font-weight: 600;
        }

        .detail-board {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-top: 1px solid #333;
        }

        .board-label {
          font-size: 11px;
          color: #666;
        }

        .board-cards {
          font-size: 12px;
          color: #aaa;
          font-family: monospace;
        }

        .btn-delete-hand {
          margin-top: 10px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ef4444;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-delete-hand:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        /* Keyboard Shortcuts Modal */
        .keyboard-help-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 380px;
          overflow: hidden;
        }

        .keyboard-help-modal .modal-body {
          padding: 20px;
        }

        .shortcuts-section {
          margin-bottom: 20px;
        }

        .shortcuts-section:last-child {
          margin-bottom: 0;
        }

        .shortcuts-title {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shortcut-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .shortcut-row:last-child {
          margin-bottom: 0;
        }

        .shortcut-key {
          min-width: 60px;
          padding: 6px 10px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          text-align: center;
          font-family: monospace;
        }

        .shortcut-desc {
          font-size: 13px;
          color: #aaa;
        }

        /* Tutorial Modal */
        .tutorial-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 480px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tutorial-modal .modal-body {
          padding: 24px;
          min-height: 280px;
        }

        .tutorial-step {
          text-align: center;
        }

        .tutorial-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .tutorial-step h4 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 12px;
        }

        .tutorial-step p {
          font-size: 14px;
          color: #aaa;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .tutorial-highlight {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(34, 211, 191, 0.1);
          border: 1px solid rgba(34, 211, 191, 0.3);
          border-radius: 8px;
          margin-top: 16px;
        }

        .highlight-label {
          font-size: 12px;
          color: #22d3bf;
          font-weight: 600;
        }

        .highlight-text {
          font-size: 14px;
          color: #fff;
        }

        .tutorial-list {
          text-align: left;
          padding-left: 20px;
          margin: 12px 0;
        }

        .tutorial-list li {
          font-size: 13px;
          color: #aaa;
          line-height: 1.8;
        }

        .tutorial-list li strong {
          color: #fff;
        }

        .tutorial-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
        }

        .action-item {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .action-fold {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .action-call {
          background: rgba(34, 211, 191, 0.2);
          color: #22d3bf;
        }

        .action-raise {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .action-allin {
          background: rgba(168, 85, 247, 0.2);
          color: #a855f7;
        }

        .tutorial-tip {
          font-size: 13px !important;
          color: #888 !important;
          font-style: italic;
          margin-top: 12px !important;
        }

        .tutorial-footer {
          padding: 16px 24px;
          border-top: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tutorial-progress {
          display: flex;
          gap: 8px;
        }

        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #333;
          transition: all 0.2s;
        }

        .progress-dot.active {
          background: #22d3bf;
          transform: scale(1.2);
        }

        .progress-dot.completed {
          background: rgba(34, 211, 191, 0.5);
        }

        .tutorial-buttons {
          display: flex;
          gap: 10px;
        }

        .tutorial-buttons .btn-secondary {
          padding: 10px 20px;
          background: #333;
          border: 1px solid #444;
          border-radius: 8px;
          color: #aaa;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tutorial-buttons .btn-secondary:hover {
          background: #444;
          color: #fff;
        }

        .tutorial-buttons .btn-primary {
          padding: 10px 24px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tutorial-buttons .btn-primary:hover {
          background: #1fb8a6;
        }

        /* Quick Stats Bar */
        .quick-stats-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(20, 20, 20, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 8px 16px;
          z-index: 50;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.2s;
          border-radius: 8px;
        }

        .quick-stat:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-label {
          font-size: 11px;
          color: #888;
        }

        .stat-main {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .stat-pct {
          font-size: 12px;
          color: #22d3bf;
          font-weight: 500;
        }

        .stat-edit {
          font-size: 12px;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .quick-stat:hover .stat-edit {
          opacity: 1;
        }

        .stat-progress {
          width: 50px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          overflow: hidden;
        }

        .stat-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .quick-stat-divider {
          width: 1px;
          height: 24px;
          background: #333;
          margin: 0 4px;
        }

        /* Daily Goal Modal */
        .daily-goal-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          width: 90%;
          max-width: 400px;
          overflow: hidden;
        }

        .daily-goal-modal .modal-body {
          padding: 20px 24px;
        }

        .goal-desc {
          font-size: 14px;
          color: #888;
          margin-bottom: 20px;
          text-align: center;
        }

        .goal-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .goal-option {
          padding: 10px 18px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 8px;
          color: #aaa;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .goal-option:hover {
          border-color: #22d3bf;
          color: #fff;
        }

        .goal-option.active {
          background: rgba(34, 211, 191, 0.15);
          border-color: #22d3bf;
          color: #22d3bf;
        }

        .goal-custom {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .goal-custom label {
          font-size: 13px;
          color: #888;
        }

        .goal-custom input {
          width: 70px;
          padding: 8px 12px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          text-align: center;
        }

        .goal-custom input:focus {
          outline: none;
          border-color: #22d3bf;
        }

        .goal-custom span {
          font-size: 13px;
          color: #888;
        }

        .goal-stats {
          background: #222;
          border-radius: 10px;
          padding: 14px;
        }

        .goal-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .goal-stat-row:last-child {
          border-bottom: none;
        }

        .goal-stat-row span:first-child {
          font-size: 13px;
          color: #888;
        }

        .goal-stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #22d3bf;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #333;
          display: flex;
          justify-content: center;
        }

        .daily-goal-modal .btn-primary {
          padding: 12px 40px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .daily-goal-modal .btn-primary:hover {
          background: #1fb8a6;
        }
      `}</style>
    </div>
  );
}
