'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import './practice.css';
import { useUserStore, ACHIEVEMENTS } from '@/store';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
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

// Legacy STREET_NAMES - replaced by STREET_NAMES_I18N in component

// Range matrix display
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Position coordinates for 6-max table (GTO Wizard style - ellipse layout)
// Adjusted for aspect-ratio: 3/0.8, table-felt height: 92%
const SEAT_POSITIONS: { pos: Position; x: number; y: number }[] = [
  { pos: 'HJ', x: 28, y: 8 },    // Top left
  { pos: 'CO', x: 72, y: 8 },    // Top right
  { pos: 'BTN', x: 92, y: 50 },  // Right side
  { pos: 'SB', x: 72, y: 98 },   // Bottom right
  { pos: 'BB', x: 38, y: 98 },   // Bottom center-left
  { pos: 'UTG', x: 12, y: 50 },  // Left side
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

// Legacy getActionRating - replaced by getActionRatingI18n in component

export default function PracticePage() {
  const { updatePracticeStats, updateDetailedStats, saveHand, settings, updateSettings, practiceStats, achievements, checkAchievements, clearRecentUnlock, savedHands, deleteHand } = useUserStore();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { t, locale } = useTranslation();

  // Translated street names
  const STREET_NAMES_I18N: Record<Street, string> = useMemo(() => ({
    preflop: t.practice.streets.preflop,
    flop: t.practice.streets.flop,
    turn: t.practice.streets.turn,
    river: t.practice.streets.river,
  }), [t]);

  // Translated action rating function
  const getActionRatingI18n = useCallback((frequency: number): ActionRating => {
    if (frequency >= 80) {
      return { level: 5, name: t.practice.ratings.perfect, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' };
    }
    if (frequency >= 50) {
      return { level: 4, name: t.practice.ratings.good, color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.15)' };
    }
    if (frequency >= 20) {
      return { level: 3, name: t.practice.ratings.smallMistake, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' };
    }
    if (frequency >= 5) {
      return { level: 2, name: t.practice.ratings.mistake, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
    }
    return { level: 1, name: t.practice.ratings.seriousMistake, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
  }, [t]);

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
  const [showAICoachModal, setShowAICoachModal] = useState(false);

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
  const getWeakSpotDisplayName = useCallback((spot: string): string => {
    const parsed = parseWeakSpot(spot);
    if (!parsed) return spot;

    const nameMap: Record<string, Record<string, string>> = {
      street: {
        preflop: t.practice.streets.preflop,
        flop: t.practice.streets.flop,
        turn: t.practice.streets.turn,
        river: t.practice.streets.river,
      },
      scenario: {
        rfi: t.practice.scenarios.rfi,
        vs_rfi: t.practice.scenarios.vsRfi,
        vs_3bet: t.practice.scenarios.vs3bet,
      },
      hands: {
        pairs: t.practice.handTypes.pairs,
        suited: t.practice.handTypes.suited,
        offsuit: t.practice.handTypes.offsuit,
      },
    };

    if (parsed.type === 'position') {
      return `${parsed.value} ${t.practice.positionText}`;
    }

    return nameMap[parsed.type]?.[parsed.value] || parsed.value;
  }, [t]);

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
      <div className="loading" style={{ background: '#0d0d0d', height: '100vh', width: '100vw' }}>
        <div className="spinner" />
      </div>
    );
  }

  const canContinue = showResult && scenario.currentStreet !== 'river' && mode !== 'preflop';

  return (
    <div className="practice-page">
      {/* Top bar: Left side controls */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="streak-indicator">
            <span className="fire">🔥</span>
            <span className="count">{streak}</span>
          </div>

          {/* Mini session stats */}
          <div className="mini-stats" onClick={() => setShowProgressChart(true)}>
            <span className="mini-stat">
              <span className="mini-label">{t.practice.today}</span>
              <span className="mini-value">{todayStats.total}</span>
            </span>
            <span className="mini-divider">·</span>
            <span className="mini-stat">
              <span className="mini-label">{t.practice.accurate}</span>
              <span className="mini-value">{sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%</span>
            </span>
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
              <span className="weak-spot-label">{t.practice.targetedTraining}: {getWeakSpotDisplayName(activeWeakSpot)}</span>
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
        </div>

        {/* Right side: PK button + Filter - grouped together */}
        <div className="top-bar-right">
          <Link href="/pk" className="pk-mode-btn">
            <span className="pk-icon">⚔️</span>
            <span className="pk-text">{t.practice.pkBattle}</span>
          </Link>
          <button
            className="filter-toggle-btn-inline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title={t.practice.filterSettings}
          >
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {(handTypeFilter !== 'all' || scenarioFilter !== 'all' || timerMode) && (
              <span className="filter-active-dot" />
            )}
          </button>
        </div>
      </div>

      {/* Weak spot selection panel */}
      {showWeakSpotPanel && practiceStats.weakSpots.length > 0 && (
        <div className="weak-spot-panel">
          <div className="panel-header">
            <h4>{t.practice.weakSpots.title}</h4>
            <button className="panel-close" onClick={() => setShowWeakSpotPanel(false)}>×</button>
          </div>
          <div className="panel-body">
            <p className="panel-desc">{t.practice.weakSpots.description}</p>
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

      {/* Hand History Bar - GTO Wizard style horizontal scrollable */}
      {scenario.streetResults.length > 0 && (
        <div className="hand-history-bar">
          {scenario.streetResults.map((result, idx) => (
            <div key={idx} className={`history-item ${result.isCorrect ? 'correct' : 'wrong'}`}>
              <span className="history-street">{STREET_NAMES_I18N[result.street as Street]}</span>
              <span className="history-stack">{scenario.heroStack}</span>
              <span className={`history-action ${result.isCorrect ? 'correct' : 'wrong'}`}>
                {result.isCorrect && <span className="check-icon">✓</span>}
                {result.action} {result.score}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main content - GTO Wizard style scalable layout */}
      <div className="main-content">
        {/* Table Area */}
        <div className="table-area">
          {/* Scenario Info - positioned above table */}
          <div className="scenario-info-display">
            <span className="scenario-text">
              {scenario.heroPosition} vs. {scenario.villainPosition}, {
                scenario.preflopScenario === 'rfi' ? t.practice.scenarios.rfiOpen :
                scenario.preflopScenario === 'vs_rfi' ? t.practice.scenarios.vsRfi : t.practice.scenarios.vs3bet
              }, {scenario.heroStack}bb
            </span>
            <span className="info-icon-inline" onClick={() => setShowScenarioInfo(true)}>ⓘ</span>
          </div>

          {/* Poker Table with dark ellipse */}
          <div className="poker-table">
            {/* Table felt (dark ellipse - GTO Wizard style) */}
            <div className="table-felt" />

            {/* All seats around the table */}
            {SEAT_POSITIONS.map(({ pos, x, y }) => {
              const isHero = pos === scenario.heroPosition;
              const isVillain = pos === scenario.villainPosition;
              const isActive = isHero || isVillain;
              const isBTN = pos === 'BTN';

              return (
                <div
                  key={pos}
                  className={`seat ${isActive ? 'active' : 'inactive'} ${isHero ? 'hero' : ''} ${isVillain ? 'villain' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Seat badge - circular style */}
                  <div className="seat-badge">
                    <span className="pos">{pos}</span>
                    <span className="stack">{isActive ? (isHero ? scenario.heroStack : scenario.villainStack) : 100}</span>
                  </div>

                  {/* Cards - show for hero always, villain when result shown */}
                  {/* Cards position: left side seats (UTG, HJ) show cards on right, right side seats (BTN, CO, SB) show cards on left */}
                  {isHero && (
                    <div className={`hole-cards hero-cards ${x > 50 ? 'cards-left' : 'cards-right'}`}>
                      <PokerCard card={scenario.heroHand[0]} size="sm" variant="dark" />
                      <PokerCard card={scenario.heroHand[1]} size="sm" variant="dark" />
                    </div>
                  )}
                  {isVillain && (
                    <div className={`hole-cards villain-cards ${x > 50 ? 'cards-left' : 'cards-right'}`}>
                      {showResult && scenario.villainHand ? (
                        <>
                          <PokerCard card={scenario.villainHand[0]} size="sm" variant="dark" />
                          <PokerCard card={scenario.villainHand[1]} size="sm" variant="dark" />
                        </>
                      ) : (
                        <>
                          <div className="card-back" />
                          <div className="card-back" />
                        </>
                      )}
                    </div>
                  )}

                  {/* Dealer button - next to BTN position */}
                  {isBTN && <div className="dealer-btn">D</div>}
                </div>
              );
            })}

            {/* Center: Pot and Board */}
            <div className="table-center">
              {/* Pot amount */}
              <div className="pot-display">
                <span className="pot-value">{scenario.potSize.toFixed(0)} bb</span>
              </div>

              {/* Board cards */}
              {scenario.board.length > 0 && (
                <div className="board-cards">
                  {scenario.board.map((card, idx) => (
                    <PokerCard key={idx} card={card} size="md" variant="dark" />
                  ))}
                </div>
              )}

              {/* Pot chip indicator */}
              {scenario.board.length > 0 && (
                <div className="pot-chip-display">
                  <span className="chip-icon" />
                  <span className="chip-amount">{scenario.potSize.toFixed(0)} bb</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - only show when not showing result */}
        {!showResult && (
          <div className="action-buttons">
            {availableActions.map(({ action, label, color, hotkey }) => (
              <button
                key={action}
                className="action-btn"
                style={{ backgroundColor: color }}
                onClick={() => handleAction(action)}
              >
                {label}
                <span className="hotkey">{hotkey}</span>
              </button>
            ))}
          </div>
        )}

        {/* Result Panel - GTO Wizard style */}
        {showResult && (
          <div className="result-panel-wizard">
            {/* Navigation arrow left */}
            <button className="result-nav prev" onClick={repeatCurrentScenario} title={t.practice.repeatHand}>‹</button>

            <div className="result-card-wizard">
              {/* Score circle */}
              <div className="score-circle-container">
                <svg className="score-ring" viewBox="0 0 100 100">
                  <circle className="ring-bg" cx="50" cy="50" r="42" />
                  <circle
                    className="ring-progress"
                    cx="50" cy="50" r="42"
                    style={{
                      stroke: '#f59e0b',
                      strokeDasharray: `${accuracyScore * 2.64} 264`
                    }}
                  />
                </svg>
                <div className="score-inner">
                  <span className="score-label">{t.practice.gtoScore}</span>
                  <span className="score-value" style={{ color: '#f59e0b' }}>
                    {accuracyScore}%
                  </span>
                </div>
              </div>

              {/* Right side info */}
              <div className="result-info-wizard">
                <div className="result-status">
                  <span className="status-icon" style={{ color: isCorrect ? '#22d3bf' : '#ef4444' }}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="status-text">{isCorrect ? t.practice.correctAction : t.practice.wrongAction}</span>
                </div>

                {/* Street progress tabs */}
                <div className="street-tabs">
                  {(['preflop', 'flop', 'turn', 'river'] as Street[]).map((street) => {
                    const result = scenario.streetResults.find(r => r.street === street);
                    const isCurrent = scenario.currentStreet === street;
                    return (
                      <div
                        key={street}
                        className={`street-tab ${result?.isCorrect ? 'correct' : result ? 'wrong' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        {result && <span className="tab-check" style={{ color: result.isCorrect ? '#22d3bf' : '#ef4444' }}>✓</span>}
                        {STREET_NAMES_I18N[street]}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Coach Icon Button */}
              <button
                className="ai-coach-btn"
                onClick={() => setShowAICoachModal(true)}
                title={t.practice.aiCoachAnalysis}
              >
                <span className="ai-icon">🤖</span>
              </button>
            </div>

            {/* Navigation arrow right */}
            <button className="result-nav next" onClick={canContinue ? dealNextStreet : generateNewScenario} title={canContinue ? t.practice.continueStreet : t.practice.nextHand}>›</button>
          </div>
        )}

        {/* AI Coach Modal */}
        {showAICoachModal && showResult && scenario && selectedAction && (
          <div className="modal-overlay" onClick={() => setShowAICoachModal(false)}>
            <div className="ai-coach-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🤖 {t.practice.aiCoachAnalysis}</h3>
                <button className="modal-close" onClick={() => setShowAICoachModal(false)}>×</button>
              </div>
              <div className="modal-body ai-coach-modal-body">
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
                  expanded={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom control bar - GTO Wizard style */}
        <div className="bottom-bar">
          <button className="btn-secondary" onClick={repeatCurrentScenario}>
            <span className="btn-icon">↻</span> {t.practice.repeatHand}
          </button>
          {showResult && scenario.streetResults.length > 0 && (
            <button className="btn-save" onClick={handleSaveHand}>
              <span className="btn-icon">💾</span> {t.practice.save}
            </button>
          )}
          {canContinue ? (
            <button className="btn-primary" onClick={dealNextStreet}>
              <span className="btn-icon">▶▶</span> {t.practice.continueStreet}
            </button>
          ) : showResult && scenario.streetResults.length > 1 ? (
            <>
              <button className="btn-summary" onClick={() => setShowSessionSummary(true)}>
                <span className="btn-icon">📊</span> {t.practice.viewSummary}
              </button>
              <button className="btn-primary" onClick={generateNewScenario}>
                <span className="btn-icon">▶▶</span> {t.practice.nextHand}
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={generateNewScenario}>
              <span className="btn-icon">▶▶</span> {t.practice.nextHand}
            </button>
          )}
          <div className="more-menu-wrapper">
              <button className="btn-more" onClick={() => setShowMoreMenu(!showMoreMenu)}>⋮</button>
              {showMoreMenu && (
                <div className="more-menu">
                  <div className="menu-section">
                    <div className="menu-section-title">{t.practice.menu.navigation}</div>
                    <Link href="/" className="menu-item">
                      <span className="menu-icon">🏠</span>
                      {t.practice.menu.home}
                    </Link>
                    <div className="menu-item" onClick={() => { setShowProgressChart(true); setShowMoreMenu(false); }}>
                      <span className="menu-icon">📊</span>
                      {t.practice.menu.progressChart}
                    </div>
                    <div className="menu-item" onClick={() => { setShowHandHistory(true); setShowMoreMenu(false); }}>
                      <span className="menu-icon">📜</span>
                      {t.practice.menu.handHistory} ({savedHands.length})
                    </div>
                    <Link href="/solutions" className="menu-item">
                      <span className="menu-icon">📚</span>
                      {t.practice.menu.ranges}
                    </Link>
                    <div className="menu-item" onClick={() => { setShowAchievements(true); setShowMoreMenu(false); }}>
                      <span className="menu-icon">🏆</span>
                      {t.practice.menu.achievements} ({achievements.unlockedCount}/{achievements.totalCount})
                    </div>
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    <div className="menu-section-title">{t.practice.menu.otherModes}</div>
                    <Link href="/practice/pushfold" className="menu-item">
                      <span className="menu-icon">🎯</span>
                      {t.practice.menu.pushFold}
                    </Link>
                    <Link href="/practice/multitable" className="menu-item">
                      <span className="menu-icon">🃏</span>
                      {t.practice.menu.multitable}
                    </Link>
                    <Link href="/practice/tournament" className="menu-item">
                      <span className="menu-icon">🏆</span>
                      {t.practice.menu.tournament}
                    </Link>
                    <Link href="/practice/range-builder" className="menu-item">
                      <span className="menu-icon">🎨</span>
                      {t.practice.menu.rangeBuilder}
                    </Link>
                    <Link href="/reports" className="menu-item">
                      <span className="menu-icon">📊</span>
                      {t.practice.menu.reports}
                    </Link>
                    <Link href="/icm" className="menu-item">
                      <span className="menu-icon">🔢</span>
                      {t.practice.menu.icm}
                    </Link>
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    <div className="menu-section-title">{t.practice.menu.settings}</div>
                    <div
                      className="menu-item toggle-item"
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    >
                      <span className="menu-label">
                        <span className="menu-icon">{settings.soundEnabled ? '🔊' : '🔇'}</span>
                        {t.practice.menu.sound}
                      </span>
                      <span className={`toggle-switch ${settings.soundEnabled ? 'on' : ''}`}>
                        <span className="toggle-knob" />
                      </span>
                    </div>
                    <div className="menu-item" onClick={() => { setShowTutorial(true); setTutorialStep(0); setShowMoreMenu(false); }}>
                      <span className="menu-icon">📖</span>
                      {t.practice.menu.tutorial}
                    </div>
                    <Link href="/settings" className="menu-item">
                      <span className="menu-icon">⚙️</span>
                      {t.practice.menu.moreSettings}
                    </Link>
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-hint" onClick={() => { setShowKeyboardHelp(true); setShowMoreMenu(false); }} style={{ cursor: 'pointer' }}>
                    <span className="hint-icon">⌨️</span>
                    {t.practice.menu.keyboardShortcuts}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Click outside to close menu */}
        {showMoreMenu && <div className="menu-overlay" onClick={() => setShowMoreMenu(false)} />}
      </div>

      {/* Scenario Info Modal */}
      {showScenarioInfo && (
        <div className="modal-overlay" onClick={() => setShowScenarioInfo(false)}>
          <div className="scenario-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.practice.scenarioDetails.title}</h3>
              <button className="modal-close" onClick={() => setShowScenarioInfo(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.scenarioType}</span>
                <span className="info-value">
                  {scenario.preflopScenario === 'rfi' ? t.practice.scenarioDetails.rfi :
                   scenario.preflopScenario === 'vs_rfi' ? t.practice.scenarioDetails.vsRfi : t.practice.scenarioDetails.vs3bet}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.yourPosition}</span>
                <span className="info-value highlight">{scenario.heroPosition}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.opponentPosition}</span>
                <span className="info-value">{scenario.villainPosition}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.effectiveStack}</span>
                <span className="info-value">100bb</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.currentPot}</span>
                <span className="info-value">{scenario.potSize.toFixed(1)} BB</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t.practice.scenarioDetails.positionAdvantage}</span>
                <span className="info-value">{scenario.isHeroIP ? t.practice.scenarioDetails.inPosition : t.practice.scenarioDetails.outOfPosition}</span>
              </div>
              <div className="scenario-desc">
                <strong>{t.practice.scenarioDetails.actionDescription}</strong>
                {scenario.preflopScenario === 'rfi' && (
                  <p>{t.practice.scenarioDetails.rfiDescription.replace('{position}', scenario.heroPosition)}</p>
                )}
                {scenario.preflopScenario === 'vs_rfi' && (
                  <p>{t.practice.scenarioDetails.vsRfiDescription.replace('{villainPosition}', scenario.villainPosition || '')}</p>
                )}
                {scenario.preflopScenario === 'vs_3bet' && (
                  <p>{t.practice.scenarioDetails.vs3betDescription.replace('{heroPosition}', scenario.heroPosition).replace('{villainPosition}', scenario.villainPosition || '')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved toast notification */}
      {savedToast && (
        <div className="saved-toast">
          <span>✓</span> {t.practice.savedToast}
        </div>
      )}

      {/* Achievement unlock toast */}
      {achievementToast && (
        <div className="achievement-toast">
          <span className="achievement-unlock-icon">🎉</span>
          <span className="achievement-unlock-text">{t.practice.achievementUnlocked}: {achievementToast}</span>
        </div>
      )}

      {/* Achievement Panel Modal */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="achievement-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 {t.practice.menu.achievements} ({achievements.unlockedCount}/{achievements.totalCount})</h3>
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
              <h3>{t.practice.handSummary}</h3>
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
                const rating = getActionRatingI18n(avgScore);
                return (
                  <div className="summary-score" style={{ background: rating.bgColor }}>
                    <div className="summary-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= rating.level ? rating.color : '#333' }}>★</span>
                      ))}
                    </div>
                    <div className="summary-score-value" style={{ color: rating.color }}>{avgScore}%</div>
                    <div className="summary-score-label">{rating.name} · {correctCount}/{scenario.streetResults.length} {t.practice.correct}</div>
                  </div>
                );
              })()}

              {/* Street by street breakdown */}
              <div className="summary-breakdown">
                <h4>{t.practice.streetPerformance}</h4>
                {scenario.streetResults.map((result, idx) => {
                  const streetRating = getActionRatingI18n(result.score);
                  return (
                    <div key={idx} className="summary-street-row">
                      <span className="street-label">{STREET_NAMES_I18N[result.street as Street]}</span>
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
                  <h4>{t.practice.board}</h4>
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
                  💾 {t.practice.saveThisHand}
                </button>
                <button className="btn-primary" onClick={() => {
                  setShowSessionSummary(false);
                  generateNewScenario();
                }}>
                  {t.practice.nextHand} ▶
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
                  ? `${scenario.heroPosition} RFI ${t.practice.range}`
                  : scenario.preflopScenario === 'vs_rfi'
                  ? `BB vs ${scenario.villainPosition} ${t.practice.range}`
                  : `${scenario.heroPosition} vs ${scenario.villainPosition} 3-Bet ${t.practice.range}`}
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
                  <span>{t.practice.raiseHigh}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#22c55e' }} />
                  <span>{t.practice.callHigh}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b3b3b' }} />
                  <span>Mixed</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#22d3bf' }} />
                  <span>{t.practice.currentHand}</span>
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
              <h3>📊 {t.practice.menu.progressChart}</h3>
              <button className="modal-close" onClick={() => setShowProgressChart(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Overview Stats */}
              <div className="progress-overview">
                <div className="overview-stat">
                  <div className="stat-value">{practiceStats.totalDecisions}</div>
                  <div className="stat-label">{t.practice.stats.totalDecisions}</div>
                </div>
                <div className="overview-stat">
                  <div className="stat-value">
                    {practiceStats.totalDecisions > 0
                      ? Math.round((practiceStats.correctDecisions / practiceStats.totalDecisions) * 100)
                      : 0}%
                  </div>
                  <div className="stat-label">{t.practice.stats.totalAccuracy}</div>
                </div>
                <div className="overview-stat">
                  <div className="stat-value">{practiceStats.streakDays}</div>
                  <div className="stat-label">{t.practice.stats.streakDays}</div>
                </div>
              </div>

              {/* Daily Chart */}
              <div className="daily-chart-section">
                <h4>{t.practice.stats.last7Days}</h4>
                <div className="daily-chart">
                  {(() => {
                    const last7Days = [];
                    const dayNames = locale === 'zh-CN'
                      ? ['日', '一', '二', '三', '四', '五', '六']
                      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayStats = practiceStats.dailyHistory.find(d => d.date === dateStr);
                      last7Days.push({
                        date: dateStr,
                        dayName: dayNames[date.getDay()],
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
                <h4>{t.practice.stats.categoryBreakdown}</h4>
                <div className="breakdown-grid">
                  {/* By Street */}
                  <div className="breakdown-section">
                    <div className="breakdown-title">{t.practice.stats.byStreet}</div>
                    {(['preflop', 'flop', 'turn', 'river'] as const).map(street => {
                      const stats = practiceStats.byStreet[street];
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      return (
                        <div key={street} className="breakdown-row">
                          <span className="breakdown-label">{STREET_NAMES_I18N[street]}</span>
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
                    <div className="breakdown-title">{t.practice.stats.byScenario}</div>
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
                    <div className="breakdown-title">{t.practice.stats.byHandType}</div>
                    {(['pairs', 'suited', 'offsuit'] as const).map(ht => {
                      const stats = practiceStats.byHandType[ht];
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      const labels = { pairs: t.practice.handTypes.pairs, suited: t.practice.handTypes.suited, offsuit: t.practice.handTypes.offsuit };
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
                    <div className="breakdown-title">{t.practice.stats.byPosition}</div>
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
                            <div className="position-count">{stats.total} {t.practice.hands}</div>
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
              <h3>📜 {t.practice.menu.handHistory} ({savedHands.length})</h3>
              <button className="modal-close" onClick={() => setShowHandHistory(false)}>×</button>
            </div>
            <div className="modal-body">
              {savedHands.length === 0 ? (
                <div className="empty-history">
                  <div className="empty-icon">📭</div>
                  <div className="empty-text">{t.practice.history.noHands}</div>
                  <div className="empty-hint">{t.practice.history.saveHint}</div>
                </div>
              ) : (
                <div className="history-list">
                  {savedHands.slice().reverse().map((hand) => {
                    const avgScore = Math.round(hand.results.reduce((sum, r) => sum + r.score, 0) / hand.results.length);
                    const rating = getActionRatingI18n(avgScore);
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
                                  <span className="detail-street">{STREET_NAMES_I18N[result.street as Street]}</span>
                                  <span className="detail-action">{result.action}</span>
                                  <span className="detail-score" style={{ color: getActionRatingI18n(result.score).color }}>
                                    {result.score}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Board if available */}
                            {hand.board.length > 0 && (
                              <div className="detail-board">
                                <span className="board-label">{t.practice.board}:</span>
                                <span className="board-cards-text">{hand.board.join(' ')}</span>
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
                              🗑️ {t.practice.delete}
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
              <h3>⌨️ {t.practice.shortcuts.title}</h3>
              <button className="modal-close" onClick={() => setShowKeyboardHelp(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-section">
                <div className="shortcuts-title">{t.practice.shortcuts.actions}</div>
                <div className="shortcut-row">
                  <span className="shortcut-key">F</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.fold}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">C</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.callCheck}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">R</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.raise}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">B</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.bet}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">A</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.allin}</span>
                </div>
              </div>

              <div className="shortcuts-section">
                <div className="shortcuts-title">{t.practice.menu.navigation}</div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Space</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.nextHandStreet}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Enter</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.nextHandStreet}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Esc</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.closeModal}</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">?</span>
                  <span className="shortcut-desc">{t.practice.shortcuts.showHelp}</span>
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
              <h3>📖 {t.practice.menu.tutorial}</h3>
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
                  <button className="btn-secondary" onClick={() => setTutorialStep(s => s - 1)}>{t.practice.tutorial.previous}</button>
                )}
                {tutorialStep < 4 ? (
                  <button className="btn-primary" onClick={() => setTutorialStep(s => s + 1)}>{t.practice.tutorial.next}</button>
                ) : (
                  <button className="btn-primary" onClick={() => setShowTutorial(false)}>{t.practice.tutorial.start}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Filter panel - top right */}
      {showFilterPanel && (
        <>
          <div className="filter-overlay" onClick={() => setShowFilterPanel(false)} />
          <div className="filter-panel">
        {/* Mode filter */}
        <div className="filter-group">
          <span className="filter-label">{t.practice.filters.mode}</span>
          <div className="filter-chips">
            {[
              { value: 'preflop', label: t.practice.streets.preflop },
              { value: 'full_hand', label: t.practice.filters.fullHand },
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

        {/* Scenario filter */}
        <div className="filter-group">
          <span className="filter-label">{t.practice.filters.scenario}</span>
          <div className="filter-chips">
            {[
              { value: 'all', label: t.practice.filters.all },
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

        {/* Hand type filter */}
        <div className="filter-group">
          <span className="filter-label">{t.practice.filters.handType}</span>
          <div className="filter-chips">
            {[
              { value: 'all', label: t.practice.filters.all },
              { value: 'pairs', label: t.practice.handTypes.pairs },
              { value: 'suited', label: t.practice.handTypes.suited },
              { value: 'offsuit', label: t.practice.handTypes.offsuit },
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

        {/* Timer mode */}
        <div className="filter-group timer-group">
          <span className="filter-label">{t.practice.filters.timer}</span>
          <div className="filter-chips">
            <button
              className={`filter-chip timer-chip ${timerMode ? 'active' : ''}`}
              onClick={() => setTimerMode(!timerMode)}
            >
              {timerMode ? `⏱️ ${t.practice.filters.on}` : `⏱️ ${t.practice.filters.off}`}
            </button>
            {timerMode && (
              <select
                className="timer-select"
                value={timerDuration}
                onChange={(e) => setTimerDuration(Number(e.target.value))}
              >
                <option value={5}>5{t.practice.filters.seconds}</option>
                <option value={10}>10{t.practice.filters.seconds}</option>
                <option value={15}>15{t.practice.filters.seconds}</option>
                <option value={20}>20{t.practice.filters.seconds}</option>
                <option value={30}>30{t.practice.filters.seconds}</option>
              </select>
            )}
          </div>
        </div>

        {/* Average decision time */}
        {timerMode && decisionTimes.length > 0 && (
          <div className="avg-time-display">
            <span className="avg-label">{t.practice.filters.avgDecision}</span>
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


      {/* Daily Goal Modal */}
      {showDailyGoalModal && (
        <div className="modal-overlay" onClick={() => setShowDailyGoalModal(false)}>
          <div className="daily-goal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 {t.practice.dailyGoal.title}</h3>
              <button className="modal-close" onClick={() => setShowDailyGoalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="goal-desc">{t.practice.dailyGoal.description}</p>
              <div className="goal-options">
                {[10, 20, 30, 50, 100].map(goal => (
                  <button
                    key={goal}
                    className={`goal-option ${dailyGoal === goal ? 'active' : ''}`}
                    onClick={() => setDailyGoal(goal)}
                  >
                    {goal}{t.practice.hands}
                  </button>
                ))}
              </div>
              <div className="goal-custom">
                <label>{t.practice.dailyGoal.custom}:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                />
                <span>{t.practice.dailyGoal.handsPerDay}</span>
              </div>
              <div className="goal-stats">
                <div className="goal-stat-row">
                  <span>{t.practice.dailyGoal.todayCompleted}</span>
                  <span className="goal-stat-value">{todayStats.total} {t.practice.hands}</span>
                </div>
                <div className="goal-stat-row">
                  <span>{t.practice.dailyGoal.todayAccuracy}</span>
                  <span className="goal-stat-value">
                    {todayStats.total > 0 ? Math.round((todayStats.correct / todayStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="goal-stat-row">
                  <span>{t.practice.dailyGoal.remaining}</span>
                  <span className="goal-stat-value">
                    {Math.max(0, dailyGoal - todayStats.total)} {t.practice.hands}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDailyGoalModal(false)}>
                {t.practice.dailyGoal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .practice-page {
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          background: #0a0a0f;
          display: grid;
          grid-template-rows: auto 1fr;
          grid-template-areas:
            "header"
            "main";
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        }

        .loading {
          height: 100vh;
          width: 100vw;
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
          grid-area: header;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: ${isMobile ? '6px 10px' : '8px 16px'};
          background: rgba(10, 10, 15, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 20;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Streak indicator */
        .streak-indicator {
          position: fixed;
          top: 100px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 50;
        }

        .streak-indicator .fire { font-size: 18px; }
        .streak-indicator .count { font-size: 14px; color: #fff; font-weight: 600; }

        /* Mini stats in top bar */
        .mini-stats {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .mini-stats:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .mini-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mini-label {
          font-size: 10px;
          color: #666;
        }

        .mini-value {
          font-size: 12px;
          font-weight: 600;
          color: #22d3bf;
        }

        .mini-divider {
          color: #444;
          font-size: 10px;
        }

        @media (max-width: 480px) {
          .mini-stats {
            display: none;
          }
        }

        /* PK Mode Button - inline style */
        .pk-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 20px;
          text-decoration: none;
          color: #a78bfa;
          font-weight: 500;
          font-size: 12px;
          transition: all 0.2s;
        }

        .pk-mode-btn:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%);
          border-color: #a78bfa;
        }

        .pk-mode-btn .pk-icon { font-size: 14px; }
        .pk-mode-btn .pk-text { font-size: 12px; }

        /* Inline filter toggle button */
        .filter-toggle-btn-inline {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-toggle-btn-inline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #22d3bf;
        }

        .filter-toggle-btn-inline .filter-icon {
          width: 16px;
          height: 16px;
          color: #888;
        }

        .filter-toggle-btn-inline:hover .filter-icon {
          color: #22d3bf;
        }

        .filter-toggle-btn-inline .filter-active-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          background: #22d3bf;
          border-radius: 50%;
          box-shadow: 0 0 6px #22d3bf;
        }

        /* Weak spot toggle button */
        .weak-spot-toggle {
          position: fixed;
          top: 110px;
          right: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          min-height: unset !important;
          height: auto !important;
          z-index: 50;
        }

        .weak-spot-toggle:hover .toggle-badge {
          background: rgba(245, 158, 11, 0.3);
        }

        .weak-spot-toggle .toggle-icon { font-size: 18px; }

        .weak-spot-toggle .toggle-badge {
          font-size: 14px;
          font-weight: 600;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          padding: 3px 8px;
          border-radius: 10px;
        }

        /* Weak spot indicator (active mode) */
        .weak-spot-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid #f59e0b;
          padding: 6px 12px;
          border-radius: 16px;
        }

        .weak-spot-icon { font-size: 14px; }
        .weak-spot-label { font-size: 12px; color: #f59e0b; font-weight: 500; }

        .weak-spot-close {
          background: none;
          border: none;
          color: #f59e0b;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
        }

        .weak-spot-close:hover { opacity: 1; }

        @media (max-width: 480px) {
          .pk-mode-btn .pk-text { display: none; }
          .pk-mode-btn { padding: 6px 10px; }
        }

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
          top: 56px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(26, 26, 26, 0.98);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #333;
          z-index: 100;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          animation: filterSlideIn 0.2s ease;
          min-width: 220px;
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
        @media (max-width: 639px) {
          .filter-panel {
            top: auto;
            bottom: 70px;
            right: 8px;
            left: 8px;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
            padding: 10px;
            max-height: none;
            min-width: auto;
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

        /* Hand History Bar - GTO Wizard style */
        .hand-history-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: #0d0d0d;
          border-bottom: 1px solid #222;
          overflow-x: auto;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .hand-history-bar .history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: #1a1a1a;
          border-radius: 4px;
          font-size: 12px;
        }

        .hand-history-bar .history-street {
          color: #888;
        }

        .hand-history-bar .history-stack {
          color: #666;
        }

        .hand-history-bar .history-action {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .hand-history-bar .history-action.correct {
          color: #22d3bf;
        }

        .hand-history-bar .history-action.wrong {
          color: #ef4444;
        }

        .hand-history-bar .check-icon {
          font-size: 10px;
        }

        /* Main content - GTO Wizard scalable container */
        .main-content {
          grid-area: main;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          min-height: 0;
          padding: ${isMobile ? '12px 8px' : '20px 16px'};
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          overflow-y: auto;
          overflow-x: hidden;
          gap: ${isMobile ? '16px' : '24px'};
        }

        /* Table Area - scalable based on viewport */
        .table-area {
          width: 100%;
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 0;
          margin: ${isMobile ? '8px 0' : '16px 0'};
        }

        /* Scenario Info Display - above table */
        .scenario-info-display {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #888;
        }

        .scenario-text {
          color: #aaa;
        }

        .info-icon-inline {
          cursor: pointer;
          opacity: 0.6;
          font-size: 12px;
        }

        .info-icon-inline:hover {
          opacity: 1;
        }

        /* Poker Table - GTO Wizard style dark ellipse */
        .poker-table {
          position: relative;
          width: 100%;
          max-width: ${isMobile ? 'min(98vw, 420px)' : 'min(92vw, 880px)'};
          aspect-ratio: ${isMobile ? '2.5 / 1' : '3 / 0.8'};
          margin: 0 auto;
        }

        @media (max-width: 639px) {
          .poker-table {
            max-width: min(95vw, 480px);
          }

          /* Scale down board cards on mobile */
          .board-cards {
            gap: 2px;
            transform: scale(0.75);
          }

          /* Scale down hole cards on mobile */
          .hole-cards {
            transform: scale(0.7);
          }

          .hole-cards.cards-right {
            left: 44px;
            transform: scale(0.7) translateY(-50%);
            transform-origin: left center;
          }

          .hole-cards.cards-left {
            right: 44px;
            transform: scale(0.7) translateY(-50%);
            transform-origin: right center;
          }

          /* Scale down card back */
          .card-back {
            width: 28px;
            height: 40px;
          }

          /* Adjust pot display */
          .pot-display .pot-value {
            font-size: 16px;
          }

          /* Adjust seat badge */
          .seat-badge {
            width: 38px;
            height: 38px;
          }

          .seat-badge .pos {
            font-size: 10px;
          }

          .seat-badge .stack {
            font-size: 10px;
          }
        }

        @media (max-height: 700px) {
          .poker-table {
            max-width: min(85vw, 720px);
          }
        }

        /* Table felt - Dark ellipse (GTO Wizard style) */
        .table-felt {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 75%;
          height: 92%;
          border: 2px solid rgba(60, 60, 80, 0.6);
          border-radius: 100px;
          background: radial-gradient(ellipse at center, #1a1a24 0%, #12121a 70%, #0a0a0f 100%);
          box-shadow:
            inset 0 0 40px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(0, 0, 0, 0.3);
        }

        /* Seats - GTO Wizard style */
        .seat {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: opacity 0.2s;
        }

        .seat.inactive { opacity: 0.35; }
        .seat.inactive:hover { opacity: 0.5; }

        /* Seat badge - Circular style like GTO Wizard */
        .seat-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: clamp(36px, 5vw, 48px);
          height: clamp(36px, 5vw, 48px);
          background: linear-gradient(180deg, #2a2a34 0%, #1e1e26 100%);
          border: 2px solid #3a3a44;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .seat.hero .seat-badge {
          border-color: #22d3bf;
          background: linear-gradient(180deg, rgba(34, 211, 191, 0.15) 0%, rgba(34, 211, 191, 0.05) 100%);
          box-shadow: 0 0 12px rgba(34, 211, 191, 0.2);
        }

        .seat.villain .seat-badge {
          border-color: #ef4444;
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%);
        }

        .seat-badge .pos {
          font-size: clamp(9px, 1.2vw, 11px);
          color: #888;
          font-weight: 600;
          line-height: 1;
        }

        .seat.hero .seat-badge .pos { color: #22d3bf; }
        .seat.villain .seat-badge .pos { color: #ef4444; }

        .seat-badge .stack {
          font-size: clamp(9px, 1.2vw, 11px);
          color: #fff;
          font-weight: 700;
          line-height: 1;
        }

        /* Hole cards - positioned relative to seat */
        .hole-cards {
          display: flex;
          gap: 2px;
          position: absolute;
        }

        /* Cards positioned based on seat location */
        .hole-cards.cards-right {
          left: 54px;
          top: 50%;
          transform: translateY(-50%);
        }

        .hole-cards.cards-left {
          right: 54px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Card back styling */
        .card-back {
          width: 36px;
          height: 50px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border-radius: 4px;
          border: 1px solid #60a5fa;
        }

        /* Dealer button - positioned next to BTN seat */
        .dealer-btn {
          position: absolute;
          left: -20px;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #000;
          border: 2px solid #ccc;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        /* Table center - Pot and Board */
        .table-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 5;
        }

        .pot-display {
          text-align: center;
        }

        .pot-display .pot-value {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .board-cards {
          display: flex;
          gap: 4px;
        }

        .pot-chip-display {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }

        .chip-icon {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          border: 1px solid #60a5fa;
        }

        .chip-amount {
          font-size: 12px;
          color: #fff;
        }

        .pot-percent {
          font-size: 11px;
          color: #888;
        }

        /* Result Panel - GTO Wizard style */
        .result-panel-wizard {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          max-width: 520px;
          padding: 0;
          flex-shrink: 0;
        }

        .result-nav {
          width: 36px;
          height: 70px;
          border: none;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          color: #444;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .result-nav:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        .result-card-wizard {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(180deg, #1a1a24 0%, #14141c 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 14px 20px;
        }

        /* Score circle */
        .score-circle-container {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .score-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .ring-bg {
          fill: none;
          stroke: #333;
          stroke-width: 6;
        }

        .ring-progress {
          fill: none;
          stroke-width: 6;
          stroke-linecap: round;
          transition: stroke-dasharray 0.3s ease;
        }

        .score-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .score-label {
          display: block;
          font-size: 9px;
          color: #666;
          margin-bottom: 1px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .score-value {
          font-size: 18px;
          font-weight: 700;
        }

        /* Result info */
        .result-info-wizard {
          flex: 1;
        }

        .result-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .status-icon {
          color: #22d3bf;
          font-size: 16px;
        }

        .status-text {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        /* Street tabs */
        .street-tabs {
          display: flex;
          gap: 8px;
        }

        .street-tab {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #2a2a34;
          border-radius: 6px;
          font-size: 12px;
          color: #888;
        }

        .street-tab.current {
          background: #3b82f6;
          color: #fff;
          font-weight: 600;
        }

        .street-tab.correct {
          color: #22d3bf;
        }

        .street-tab.wrong {
          color: #ef4444;
        }

        .tab-check {
          font-size: 10px;
        }

        /* AI Coach Button in Result Panel */
        .ai-coach-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(155, 93, 229, 0.15) 100%);
          border: 2px solid rgba(0, 245, 212, 0.4);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .ai-coach-btn:hover {
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.25) 0%, rgba(155, 93, 229, 0.25) 100%);
          border-color: rgba(0, 245, 212, 0.7);
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(0, 245, 212, 0.3);
        }

        .ai-coach-btn .ai-icon {
          font-size: 22px;
        }

        /* AI Coach Modal */
        .ai-coach-modal {
          background: #12121a;
          border: 1px solid rgba(0, 245, 212, 0.3);
          border-radius: 16px;
          width: 95%;
          max-width: 560px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(0, 245, 212, 0.1);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* AI Coach Modal Overlay with fade animation */
        .modal-overlay:has(.ai-coach-modal) {
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .ai-coach-modal .modal-header {
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.1) 0%, rgba(155, 93, 229, 0.1) 100%);
          border-bottom: 1px solid rgba(0, 245, 212, 0.2);
        }

        .ai-coach-modal .modal-header h3 {
          color: #00f5d4;
        }

        .ai-coach-modal-body {
          overflow-y: auto;
          padding: 0 !important;
        }

        .ai-coach-modal-body .ai-coach-feedback {
          max-width: 100%;
          border-radius: 0;
          border-left: none;
          margin: 0;
        }

        @media (max-width: 639px) {
          .ai-coach-btn {
            width: 38px;
            height: 38px;
          }

          .ai-coach-btn .ai-icon {
            font-size: 18px;
          }

          .ai-coach-modal {
            width: 98%;
            max-height: 90vh;
          }
        }

        @media (max-width: 639px) {
          .result-card-wizard {
            padding: 12px 16px;
            gap: 12px;
          }

          .score-circle-container {
            width: 70px;
            height: 70px;
          }

          .score-value {
            font-size: 18px;
          }

          .status-text {
            font-size: 16px;
          }

          .street-tabs {
            flex-wrap: wrap;
            gap: 4px;
          }

          .street-tab {
            padding: 4px 8px;
            font-size: 11px;
          }
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
          flex-direction: row;
          gap: ${isMobile ? '6px' : '10px'};
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          padding: ${isMobile ? '6px 8px' : '8px 16px'};
          width: 100%;
        }

        .action-btn {
          padding: ${isMobile ? '10px 18px' : '12px 28px'};
          border: none;
          border-radius: ${isMobile ? '8px' : '10px'};
          font-size: ${isMobile ? '12px' : '13px'};
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          width: auto;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.15);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .action-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .action-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .action-btn.selected {
          box-shadow: 0 0 0 3px #22d3bf, 0 0 20px rgba(34, 211, 191, 0.4);
        }

        .action-btn .hotkey {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-left: 8px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          opacity: 0.7;
        }

        @media (max-width: 639px) {
          .action-buttons {
            gap: 8px;
            padding: 8px 12px;
          }

          .action-btn {
            padding: 10px 20px;
            font-size: 12px;
            width: auto;
            flex: 0 0 auto;
          }

          .action-btn .hotkey {
            display: none;
          }
        }

        /* Bottom bar */
        .bottom-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${isMobile ? '6px' : '10px'};
          padding: ${isMobile ? '8px 8px' : '12px 16px'};
          padding-bottom: max(${isMobile ? '8px' : '12px'}, env(safe-area-inset-bottom));
          background: rgba(10, 10, 15, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: ${isMobile ? '8px' : '12px'};
          margin-top: ${isMobile ? '12px' : '16px'};
          z-index: 20;
        }

        .btn-secondary {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #888;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          color: #aaa;
        }

        .btn-icon {
          font-size: 14px;
        }

        .btn-save {
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          color: #f59e0b;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-save:hover {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.5);
        }

        .btn-summary {
          padding: 10px 14px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: #a78bfa;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-summary:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .btn-primary {
          padding: 10px 24px;
          background: linear-gradient(135deg, #22d3bf 0%, #1eb8a6 100%);
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(34, 211, 191, 0.25);
        }

        .btn-primary:hover {
          filter: brightness(1.1);
          box-shadow: 0 4px 12px rgba(34, 211, 191, 0.35);
        }

        .btn-more {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #666;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-more:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #888;
        }

        @media (max-width: 480px) {
          .bottom-bar {
            gap: 8px;
            padding: 8px 12px;
          }

          .btn-secondary,
          .btn-save,
          .btn-summary,
          .btn-primary {
            padding: 8px 12px;
            font-size: 11px;
          }

          .btn-primary {
            padding: 8px 18px;
          }

          .btn-icon {
            font-size: 12px;
          }
        }

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
          z-index: 1;
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

        .detail-board .board-cards-text {
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
