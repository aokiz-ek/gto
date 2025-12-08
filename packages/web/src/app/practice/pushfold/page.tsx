'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { useResponsive } from '@/hooks';
import { useUserStore } from '@/store';
import {
  createDeck,
  shuffleDeck,
  getNashPushRange,
  getNashCallRange,
} from '@gto/core';
import type { Hand } from '@gto/core';
import './pushfold.css';

// ============================================================================
// Types
// ============================================================================

type GameMode = 'heads_up' | 'three_handed';
type Position = 'btn' | 'sb' | 'bb';
type TrainingMode = 'push' | 'call';  // New: Push or Call training
type Action = 'push' | 'fold' | 'call';
type OpponentType = 'nash' | 'tight' | 'loose' | 'fish';
type ICMMode = 'chip_ev' | 'bubble' | 'asymmetric';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Custom payout structure
interface CustomPayout {
  enabled: boolean;
  prizePool: number;
  places: number[];  // Percentage for each place
}

// EV calculation result
interface EVAnalysis {
  evPush: number;
  evFold: number;
  evDiff: number;
  icmValue: number;  // Current ICM $ value
  isMarginal: boolean;
  marginalExplanation?: string;
}

// Achievement types
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'streak' | 'total' | 'accuracy' | 'speed' | 'special';
  unlocked: boolean;
  progress: number;
}

interface Scenario {
  heroHand: Hand;
  handString: string;
  heroStack: number;
  villainStacks: number[];
  heroPosition: Position;
  correctAction: Action;
  pushRange: string[];
  callRange?: string[];
  trainingMode: TrainingMode;
  icmMode: ICMMode;
  opponentType: OpponentType;
  // ICM specific
  isBubble?: boolean;
  payoutSpots?: number;
  // EV Analysis
  evAnalysis?: EVAnalysis;
  // Difficulty
  difficulty?: DifficultyLevel;
}

interface Result {
  scenario: Scenario;
  userAction: Action;
  isCorrect: boolean;
  timeMs: number;
  timedOut?: boolean;
}

interface WeaknessAnalysis {
  position: Position;
  stackRange: string;
  trainingMode: TrainingMode;
  errors: number;
  total: number;
  accuracy: number;
}

// ============================================================================
// Constants
// ============================================================================

const POSITION_NAMES: Record<Position, string> = {
  btn: 'BTN',
  sb: 'SB',
  bb: 'BB',
};

const STACK_PRESETS = [3, 5, 8, 10, 12, 15, 20];

const OPPONENT_NAMES: Record<OpponentType, string> = {
  nash: 'Nash 均衡',
  tight: '紧凶',
  loose: '松凶',
  fish: '鱼玩家',
};

const ICM_MODE_NAMES: Record<ICMMode, string> = {
  chip_ev: 'Chip EV',
  bubble: '泡沫边缘',
  asymmetric: '筹码不对称',
};

const DIFFICULTY_NAMES: Record<DifficultyLevel, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
  expert: '专家',
};

const DIFFICULTY_CONFIG: Record<DifficultyLevel, {
  stackRange: [number, number];
  includeICM: boolean;
  includeBubble: boolean;
  includeCall: boolean;
  timerDefault: number;
}> = {
  beginner: {
    stackRange: [5, 10],
    includeICM: false,
    includeBubble: false,
    includeCall: false,
    timerDefault: 10,
  },
  intermediate: {
    stackRange: [3, 15],
    includeICM: true,
    includeBubble: false,
    includeCall: true,
    timerDefault: 8,
  },
  advanced: {
    stackRange: [3, 20],
    includeICM: true,
    includeBubble: true,
    includeCall: true,
    timerDefault: 5,
  },
  expert: {
    stackRange: [3, 20],
    includeICM: true,
    includeBubble: true,
    includeCall: true,
    timerDefault: 3,
  },
};

// Default payout structures
const PAYOUT_PRESETS: Record<string, { name: string; places: number[] }> = {
  winner_takes_all: { name: '赢家通吃', places: [100] },
  '50_30_20': { name: '50/30/20', places: [50, 30, 20] },
  '65_35': { name: '65/35', places: [65, 35] },
  '40_30_20_10': { name: '40/30/20/10', places: [40, 30, 20, 10] },
  custom: { name: '自定义', places: [] },
};

// Achievements definitions
const ACHIEVEMENTS_DEF: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  { id: 'first_win', name: '初出茅庐', description: '完成第一道正确答案', icon: '🎯', requirement: 1, type: 'total' },
  { id: 'streak_5', name: '连胜新手', description: '连续答对5题', icon: '🔥', requirement: 5, type: 'streak' },
  { id: 'streak_10', name: '火力全开', description: '连续答对10题', icon: '💥', requirement: 10, type: 'streak' },
  { id: 'streak_20', name: '无人能敌', description: '连续答对20题', icon: '👑', requirement: 20, type: 'streak' },
  { id: 'total_50', name: '勤学苦练', description: '累计完成50题', icon: '📚', requirement: 50, type: 'total' },
  { id: 'total_100', name: '百题斩', description: '累计完成100题', icon: '💯', requirement: 100, type: 'total' },
  { id: 'total_500', name: '训练狂人', description: '累计完成500题', icon: '🏆', requirement: 500, type: 'total' },
  { id: 'accuracy_80', name: '精准打击', description: '单轮正确率达到80%', icon: '🎯', requirement: 80, type: 'accuracy' },
  { id: 'accuracy_95', name: '近乎完美', description: '单轮正确率达到95%', icon: '💎', requirement: 95, type: 'accuracy' },
  { id: 'speed_demon', name: '闪电决策', description: '平均用时低于2秒 (10题以上)', icon: '⚡', requirement: 2000, type: 'speed' },
  { id: 'bubble_master', name: '泡沫大师', description: '泡沫模式连续答对10题', icon: '🫧', requirement: 10, type: 'special' },
  { id: 'call_expert', name: 'Call 专家', description: 'Call训练连续答对10题', icon: '📞', requirement: 10, type: 'special' },
];

// All 169 hand combos in matrix order
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function getAllHandsMatrix(): string[][] {
  const matrix: string[][] = [];
  for (let i = 0; i < 13; i++) {
    const row: string[] = [];
    for (let j = 0; j < 13; j++) {
      if (i === j) {
        row.push(RANKS[i] + RANKS[j]); // Pairs on diagonal
      } else if (i < j) {
        row.push(RANKS[i] + RANKS[j] + 's'); // Suited above diagonal
      } else {
        row.push(RANKS[j] + RANKS[i] + 'o'); // Offsuit below diagonal
      }
    }
    matrix.push(row);
  }
  return matrix;
}

const HAND_MATRIX = getAllHandsMatrix();

// ============================================================================
// Helper Functions
// ============================================================================

function handToString(hand: Hand): string {
  const r1 = hand[0].rank;
  const r2 = hand[1].rank;
  const suited = hand[0].suit === hand[1].suit;

  const ranks = 'AKQJT98765432';
  const i1 = ranks.indexOf(r1);
  const i2 = ranks.indexOf(r2);

  if (r1 === r2) {
    return r1 + r2;
  } else if (i1 < i2) {
    return r1 + r2 + (suited ? 's' : 'o');
  } else {
    return r2 + r1 + (suited ? 's' : 'o');
  }
}

function adjustRangeForOpponent(range: string[], opponentType: OpponentType): string[] {
  if (opponentType === 'nash') return range;

  const allHands = HAND_MATRIX.flat();
  const rangeSet = new Set(range);

  if (opponentType === 'tight') {
    // Tighter: only keep top 70% of the range
    return range.slice(0, Math.floor(range.length * 0.7));
  } else if (opponentType === 'loose') {
    // Looser: add 30% more hands
    const additionalHands = allHands
      .filter(h => !rangeSet.has(h))
      .slice(0, Math.floor(range.length * 0.3));
    return [...range, ...additionalHands];
  } else if (opponentType === 'fish') {
    // Fish: much looser, add 50% more hands
    const additionalHands = allHands
      .filter(h => !rangeSet.has(h))
      .slice(0, Math.floor(range.length * 0.5));
    return [...range, ...additionalHands];
  }
  return range;
}

function getStackRangeLabel(stack: number): string {
  if (stack <= 5) return '1-5BB';
  if (stack <= 10) return '6-10BB';
  if (stack <= 15) return '11-15BB';
  return '16-20BB';
}

// Get hand strength for EV calculations (0-100 scale)
function getHandStrengthValue(hand: string): number {
  const ranks = 'AKQJT98765432';
  const rank1 = hand[0];
  const rank2 = hand[1];
  const suited = hand.length === 3 && hand[2] === 's';
  const pair = rank1 === rank2;

  const r1 = ranks.indexOf(rank1);
  const r2 = ranks.indexOf(rank2);

  if (pair) {
    return 100 - r1 * 4;
  }

  let strength = 85 - r1 * 3 - r2 * 2;
  if (suited) strength += 4;

  const gap = r2 - r1;
  if (gap === 1) strength += 3;
  else if (gap === 2) strength += 2;
  else if (gap === 3) strength += 1;

  if (r1 <= 4 && r2 <= 4) strength += 5;

  return Math.max(0, Math.min(100, strength));
}

// Calculate EV for push/fold decision
function calculateEV(
  handString: string,
  heroStack: number,
  villainStacks: number[],
  pushRange: string[],
  callRange: string[] | undefined,
  trainingMode: TrainingMode,
  icmMode: ICMMode,
  payouts: number[]
): EVAnalysis {
  const totalVillainChips = villainStacks.reduce((sum, s) => sum + s, 0);
  const totalChips = heroStack + totalVillainChips;

  // Calculate chip % and ICM %
  const chipPct = heroStack / totalChips;
  const prizePool = payouts.reduce((sum, p) => sum + p, 0) || 1000; // Default $1000

  // Simple ICM approximation for 2-3 players
  let icmValue: number;
  if (villainStacks.length === 1) {
    // Heads up: ICM roughly equals chip %
    icmValue = chipPct * prizePool;
  } else {
    // Multi-way: ICM adjusts for payout structure
    const p1 = chipPct; // Chance to win 1st
    const p2 = (1 - chipPct) * 0.4; // Simplified 2nd place calc
    const p3 = (1 - chipPct - p2) * 0.3;
    icmValue = p1 * (payouts[0] || prizePool * 0.5) +
               p2 * (payouts[1] || prizePool * 0.3) +
               p3 * (payouts[2] || prizePool * 0.2);
  }

  // Get hand strength for EV calculation
  const handStrength = getHandStrengthValue(handString);
  const rangeToCheck = trainingMode === 'call' ? callRange : pushRange;
  const rangeSize = rangeToCheck?.length || 0;
  const rangePct = (rangeSize / 169) * 100;

  // Calculate position in range
  const allHands = HAND_MATRIX.flat();
  const handIdx = allHands.findIndex(h => h === handString);
  const sortedByStrength = [...allHands].sort((a, b) => getHandStrengthValue(b) - getHandStrengthValue(a));
  const strengthRank = sortedByStrength.findIndex(h => h === handString);

  // EV calculation based on push/fold theory
  const blindsToWin = 1.5; // SB + BB
  const potOdds = blindsToWin / heroStack;

  // Villain call frequency estimate
  const villainCallFreq = trainingMode === 'push'
    ? Math.min(0.8, Math.max(0.15, (rangeSize / 169) * 1.5))
    : 0;

  // Simplified EV calculations
  const evFold = 0; // Baseline
  let evAction: number;

  if (trainingMode === 'push') {
    // EV(push) = fold equity * pot + showdown equity when called
    const foldEquity = 1 - villainCallFreq;
    const showdownEquity = handStrength / 100 * 0.8 + 0.1; // Rough estimate
    evAction = foldEquity * blindsToWin + villainCallFreq * (showdownEquity * (heroStack + blindsToWin) - (1 - showdownEquity) * heroStack);
  } else {
    // EV(call) = equity vs push range * pot - (1-equity) * stack
    const pushRangeEquity = rangeSize > 0 ? handStrength / 100 * 0.9 : 0.5;
    evAction = pushRangeEquity * (heroStack * 2 + blindsToWin) - (1 - pushRangeEquity) * heroStack;
  }

  const evDiff = evAction - evFold;

  // Determine if hand is marginal (close to boundary)
  const isInRange = rangeToCheck?.includes(handString) || false;
  const marginalThreshold = 0.15; // Within 15% of range boundary is marginal
  const distanceFromBoundary = isInRange
    ? Math.abs(strengthRank - rangeSize) / 169
    : Math.abs(rangeSize - strengthRank) / 169;

  const isMarginal = distanceFromBoundary < marginalThreshold && rangeSize > 0;

  // Generate marginal explanation
  let marginalExplanation: string | undefined;
  if (isMarginal) {
    if (isInRange) {
      if (evDiff < 0.5) {
        marginalExplanation = `${handString} 位于范围边缘。虽然是正EV，但与弃牌相比优势很小 (+${evDiff.toFixed(2)}BB)。对手紧一点时可以考虑弃牌。`;
      } else {
        marginalExplanation = `${handString} 在范围内但接近边界。面对更紧的对手可能需要调整。`;
      }
    } else {
      if (Math.abs(evDiff) < 0.3) {
        marginalExplanation = `${handString} 虽然不在范围内，但非常接近边界。面对松的对手可能变为+EV。`;
      } else {
        marginalExplanation = `${handString} 刚好在范围外。继续学习更强的边缘手牌决策。`;
      }
    }
  }

  return {
    evPush: trainingMode === 'push' ? evAction : evFold,
    evFold,
    evDiff,
    icmValue,
    isMarginal,
    marginalExplanation,
  };
}

// Calculate ICM $ value
function calculateICMValue(heroStack: number, villainStacks: number[], payouts: number[]): number {
  const totalChips = heroStack + villainStacks.reduce((sum, s) => sum + s, 0);
  const chipPct = heroStack / totalChips;
  const prizePool = payouts.reduce((sum, p) => sum + p, 0) || 1000;

  if (villainStacks.length === 1) {
    return chipPct * prizePool;
  }

  // Simple multi-way ICM approximation
  const p1 = chipPct;
  const p2 = (1 - chipPct) * chipPct;
  const p3 = Math.max(0, 1 - p1 - p2);

  return p1 * (payouts[0] || prizePool * 0.5) +
         p2 * (payouts[1] || prizePool * 0.3) +
         p3 * (payouts[2] || prizePool * 0.2);
}

function generateScenario(
  mode: GameMode,
  stackSize: number | 'random',
  positionFilter: Position | 'all',
  trainingMode: TrainingMode,
  opponentType: OpponentType,
  icmMode: ICMMode,
  difficulty?: DifficultyLevel,
  customPayout?: CustomPayout
): Scenario {
  const deck = shuffleDeck(createDeck());
  const heroHand: Hand = [deck[0], deck[1]];
  const handString = handToString(heroHand);

  const heroStack = stackSize === 'random'
    ? STACK_PRESETS[Math.floor(Math.random() * STACK_PRESETS.length)]
    : stackSize;

  let heroPosition: Position;

  if (trainingMode === 'call') {
    // For call training, hero is always in BB (facing SB push in HU) or BB/SB (facing BTN push in 3-handed)
    if (mode === 'heads_up') {
      heroPosition = 'bb';
    } else {
      heroPosition = positionFilter === 'all'
        ? (Math.random() > 0.5 ? 'bb' : 'sb')
        : (positionFilter === 'btn' ? 'bb' : positionFilter);
    }
  } else {
    // Push training
    if (positionFilter !== 'all') {
      heroPosition = positionFilter;
    } else if (mode === 'heads_up') {
      heroPosition = Math.random() > 0.5 ? 'sb' : 'bb';
    } else {
      const positions: Position[] = ['btn', 'sb', 'bb'];
      heroPosition = positions[Math.floor(Math.random() * positions.length)];
    }
  }

  // Generate villain stacks based on ICM mode
  let villainStacks: number[];
  let isBubble = false;

  if (icmMode === 'bubble') {
    // Bubble scenario: 4 players, 3 get paid
    isBubble = true;
    villainStacks = mode === 'heads_up'
      ? [heroStack * 2] // Big stack vs you
      : [heroStack * 2, heroStack * 0.5]; // Big stack and short stack
  } else if (icmMode === 'asymmetric') {
    // Asymmetric stacks
    const multipliers = [0.3, 0.5, 1.5, 2, 3];
    villainStacks = mode === 'heads_up'
      ? [heroStack * multipliers[Math.floor(Math.random() * multipliers.length)]]
      : [
          heroStack * multipliers[Math.floor(Math.random() * multipliers.length)],
          heroStack * multipliers[Math.floor(Math.random() * multipliers.length)]
        ];
  } else {
    // Normal chip EV
    villainStacks = mode === 'heads_up'
      ? [heroStack + Math.floor(Math.random() * 10) - 5]
      : [heroStack + Math.floor(Math.random() * 8) - 4, heroStack + Math.floor(Math.random() * 8) - 4];
  }

  // Ensure positive stacks
  villainStacks = villainStacks.map(s => Math.max(3, Math.round(s)));

  const numPlayers = mode === 'heads_up' ? 2 : 3;

  let pushRange = getNashPushRange(heroStack, heroPosition, numPlayers as 2 | 3);
  let callRange: string[] | undefined;
  let correctAction: Action;

  if (trainingMode === 'call') {
    // Get call range for BB facing push
    callRange = getNashCallRange(
      heroStack,
      heroPosition as 'sb' | 'bb',
      numPlayers as 2 | 3,
      mode === 'three_handed' ? 'btn' : 'sb'
    );

    // Adjust for opponent type (opponent's push range affects our calling range)
    if (opponentType !== 'nash') {
      callRange = adjustRangeForOpponent(callRange, opponentType);
    }

    correctAction = callRange.includes(handString) ? 'call' : 'fold';
  } else {
    // Adjust push range for opponent type
    if (opponentType !== 'nash') {
      pushRange = adjustRangeForOpponent(pushRange, opponentType);
    }

    correctAction = pushRange.includes(handString) ? 'push' : 'fold';
  }

  // Calculate payout structure
  const payouts: number[] = customPayout?.enabled && customPayout.prizePool > 0
    ? customPayout.places.map(p => (p / 100) * customPayout.prizePool)
    : icmMode === 'bubble'
      ? [500, 300, 200] // Default bubble payouts
      : [1000]; // Default winner takes all

  // Calculate EV analysis
  const evAnalysis = calculateEV(
    handString,
    heroStack,
    villainStacks,
    pushRange,
    callRange,
    trainingMode,
    icmMode,
    payouts
  );

  return {
    heroHand,
    handString,
    heroStack,
    villainStacks,
    heroPosition,
    correctAction,
    pushRange,
    callRange,
    trainingMode,
    icmMode,
    opponentType,
    isBubble,
    payoutSpots: isBubble ? 3 : undefined,
    evAnalysis,
    difficulty,
  };
}

// ============================================================================
// Components
// ============================================================================

interface RangeMatrixProps {
  range: string[];
  currentHand: string;
  compact?: boolean;
}

function RangeMatrix({ range, currentHand, compact = false }: RangeMatrixProps) {
  const rangeSet = useMemo(() => new Set(range), [range]);

  return (
    <div className={`range-matrix ${compact ? 'compact' : ''}`}>
      {HAND_MATRIX.map((row, i) => (
        <div key={i} className="matrix-row">
          {row.map((hand, j) => {
            const inRange = rangeSet.has(hand);
            const isCurrent = hand === currentHand;
            const isPair = i === j;
            const isSuited = i < j;

            return (
              <div
                key={hand}
                className={`matrix-cell ${inRange ? 'in-range' : ''} ${isCurrent ? 'current' : ''} ${isPair ? 'pair' : isSuited ? 'suited' : 'offsuit'}`}
                title={hand}
              >
                {compact ? '' : hand}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface TimerProps {
  timeLeft: number;
  maxTime: number;
  isActive: boolean;
}

function Timer({ timeLeft, maxTime, isActive }: TimerProps) {
  const percentage = (timeLeft / maxTime) * 100;
  const isLow = timeLeft <= 2;

  return (
    <div className={`countdown-timer ${isLow ? 'low' : ''} ${!isActive ? 'inactive' : ''}`}>
      <div className="timer-bar">
        <div
          className="timer-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="timer-text">{timeLeft}s</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function PushFoldPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { updatePracticeStats } = useUserStore();

  // Settings
  const [gameMode, setGameMode] = useState<GameMode>('heads_up');
  const [stackSize, setStackSize] = useState<number | 'random'>(10);
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all');
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('push');
  const [opponentType, setOpponentType] = useState<OpponentType>('nash');
  const [icmMode, setIcmMode] = useState<ICMMode>('chip_ev');

  // New settings for advanced features
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [customPayout, setCustomPayout] = useState<CustomPayout>({
    enabled: false,
    prizePool: 1000,
    places: [50, 30, 20],
  });
  const [payoutPreset, setPayoutPreset] = useState<string>('50_30_20');
  const [showEV, setShowEV] = useState(true);  // Show EV by default

  // Timer settings
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [bubbleStreak, setBubbleStreak] = useState(0);
  const [callStreak, setCallStreak] = useState(0);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>(
    ACHIEVEMENTS_DEF.map(a => ({ ...a, unlocked: false, progress: 0 }))
  );
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  // Game state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [actionStartTime, setActionStartTime] = useState<number>(0);

  // Mistake review
  const [showMistakeReview, setShowMistakeReview] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState<Result | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgTime = total > 0
      ? results.reduce((sum, r) => sum + r.timeMs, 0) / total
      : 0;
    const timedOut = results.filter(r => r.timedOut).length;
    return { total, correct, accuracy, avgTime, timedOut };
  }, [results]);

  // Mistakes (incorrect answers)
  const mistakes = useMemo(() => {
    return results.filter(r => !r.isCorrect);
  }, [results]);

  // Weakness analysis
  const weaknessAnalysis = useMemo((): WeaknessAnalysis[] => {
    if (results.length < 5) return [];

    const groups: Record<string, { errors: number; total: number }> = {};

    results.forEach(r => {
      const key = `${r.scenario.heroPosition}-${getStackRangeLabel(r.scenario.heroStack)}-${r.scenario.trainingMode}`;
      if (!groups[key]) {
        groups[key] = { errors: 0, total: 0 };
      }
      groups[key].total++;
      if (!r.isCorrect) {
        groups[key].errors++;
      }
    });

    return Object.entries(groups)
      .map(([key, data]) => {
        const [position, stackRange, mode] = key.split('-');
        return {
          position: position as Position,
          stackRange,
          trainingMode: mode as TrainingMode,
          errors: data.errors,
          total: data.total,
          accuracy: ((data.total - data.errors) / data.total) * 100,
        };
      })
      .filter(a => a.errors > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [results]);

  // Generate new scenario
  const newScenario = useCallback(() => {
    const s = generateScenario(
      gameMode,
      stackSize,
      positionFilter,
      trainingMode,
      opponentType,
      icmMode,
      difficulty,
      customPayout
    );
    setScenario(s);
    setShowResult(false);
    setLastResult(null);
    setActionStartTime(Date.now());
    setTimeLeft(timerDuration);
    setShowMistakeReview(false);
    setSelectedMistake(null);
  }, [gameMode, stackSize, positionFilter, trainingMode, opponentType, icmMode, timerDuration, difficulty, customPayout]);

  // Initialize
  useEffect(() => {
    newScenario();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerEnabled && !showResult && scenario) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto fold
            handleAction('fold', true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timerEnabled, showResult, scenario]);

  // Clear timer when result is shown
  useEffect(() => {
    if (showResult && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [showResult]);

  // Check and update achievements
  const checkAchievements = useCallback((
    newStreak: number,
    newTotal: number,
    newAccuracy: number,
    avgTime: number,
    newBubbleStreak: number,
    newCallStreak: number
  ) => {
    setAchievements(prev => {
      const updated = [...prev];
      let justUnlocked: Achievement | null = null;

      updated.forEach((achievement, idx) => {
        if (achievement.unlocked) return;

        let progress = 0;
        let shouldUnlock = false;

        switch (achievement.type) {
          case 'streak':
            progress = newStreak;
            shouldUnlock = newStreak >= achievement.requirement;
            break;
          case 'total':
            progress = newTotal;
            shouldUnlock = newTotal >= achievement.requirement;
            break;
          case 'accuracy':
            progress = newAccuracy;
            shouldUnlock = newAccuracy >= achievement.requirement && newTotal >= 10;
            break;
          case 'speed':
            progress = avgTime;
            shouldUnlock = avgTime <= achievement.requirement && newTotal >= 10;
            break;
          case 'special':
            if (achievement.id === 'bubble_master') {
              progress = newBubbleStreak;
              shouldUnlock = newBubbleStreak >= achievement.requirement;
            } else if (achievement.id === 'call_expert') {
              progress = newCallStreak;
              shouldUnlock = newCallStreak >= achievement.requirement;
            }
            break;
        }

        updated[idx] = { ...achievement, progress };

        if (shouldUnlock && !achievement.unlocked) {
          updated[idx].unlocked = true;
          justUnlocked = updated[idx];
        }
      });

      if (justUnlocked) {
        setNewAchievement(justUnlocked);
        setTimeout(() => setNewAchievement(null), 3000);
      }

      return updated;
    });
  }, []);

  // Handle action
  const handleAction = useCallback((action: Action, timedOut = false) => {
    if (!scenario || showResult) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const timeMs = Date.now() - actionStartTime;
    const isCorrect = action === scenario.correctAction;

    const result: Result = {
      scenario,
      userAction: action,
      isCorrect,
      timeMs,
      timedOut,
    };

    setLastResult(result);
    setResults(prev => [...prev, result]);
    setShowResult(true);

    // Update streak tracking
    if (isCorrect) {
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(max => Math.max(max, newStreak));
        return newStreak;
      });
      setTotalCorrect(prev => prev + 1);

      // Update special streaks
      if (scenario.icmMode === 'bubble') {
        setBubbleStreak(prev => prev + 1);
      } else {
        setBubbleStreak(0);
      }

      if (scenario.trainingMode === 'call') {
        setCallStreak(prev => prev + 1);
      } else {
        setCallStreak(0);
      }
    } else {
      setCurrentStreak(0);
      setBubbleStreak(0);
      setCallStreak(0);
    }

    // Check achievements
    const newResults = [...results, result];
    const newTotal = newResults.filter(r => r.isCorrect).length;
    const newAccuracy = (newTotal / newResults.length) * 100;
    const avgTime = newResults.reduce((sum, r) => sum + r.timeMs, 0) / newResults.length;

    checkAchievements(
      isCorrect ? currentStreak + 1 : 0,
      totalCorrect + (isCorrect ? 1 : 0),
      newAccuracy,
      avgTime,
      scenario.icmMode === 'bubble' && isCorrect ? bubbleStreak + 1 : 0,
      scenario.trainingMode === 'call' && isCorrect ? callStreak + 1 : 0
    );

    updatePracticeStats(isCorrect);
  }, [scenario, showResult, actionStartTime, updatePracticeStats, results, currentStreak, totalCorrect, bubbleStreak, callStreak, checkAchievements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (!showResult && scenario) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleAction('fold');
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handleAction(trainingMode === 'call' ? 'call' : 'push');
        }
      } else if (showResult) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          newScenario();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, scenario, handleAction, newScenario, trainingMode]);

  // Reset session
  const resetSession = useCallback(() => {
    setResults([]);
    setCurrentStreak(0);
    setBubbleStreak(0);
    setCallStreak(0);
    newScenario();
  }, [newScenario]);

  // Handle payout preset change
  const handlePayoutPresetChange = (preset: string) => {
    setPayoutPreset(preset);
    if (preset === 'custom') {
      setCustomPayout(prev => ({ ...prev, enabled: true }));
    } else {
      setCustomPayout({
        enabled: false,
        prizePool: 1000,
        places: PAYOUT_PRESETS[preset]?.places || [50, 30, 20],
      });
    }
  };

  if (!scenario) {
    return <div className="pushfold-loading">Loading...</div>;
  }

  const actionRange = trainingMode === 'call' ? scenario.callRange : scenario.pushRange;
  const actionLabel = trainingMode === 'call' ? 'Call' : 'All-In';
  const rangeLabel = trainingMode === 'call' ? 'Call Range' : 'Push Range';

  return (
    <div className="pushfold-page">
      <header className="pushfold-header">
        <Link href="/practice" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回练习
        </Link>
        <h1>Push/Fold 训练</h1>
        <p className="subtitle">
          Nash 均衡短筹码策略 ·
          <span className="shortcut-hint">快捷键: F=Fold, P={trainingMode === 'call' ? 'Call' : 'Push'}, Space=下一题</span>
        </p>
      </header>

      <div className={`pushfold-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Settings Panel */}
        <div className="settings-panel">
          <h2>训练设置</h2>

          {/* Training Mode */}
          <div className="setting-group">
            <label>训练模式</label>
            <div className="button-group">
              <button
                className={trainingMode === 'push' ? 'active' : ''}
                onClick={() => setTrainingMode('push')}
              >
                Push 训练
              </button>
              <button
                className={trainingMode === 'call' ? 'active' : ''}
                onClick={() => setTrainingMode('call')}
              >
                Call 训练
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label>游戏模式</label>
            <div className="button-group">
              <button
                className={gameMode === 'heads_up' ? 'active' : ''}
                onClick={() => setGameMode('heads_up')}
              >
                单挑 (HU)
              </button>
              <button
                className={gameMode === 'three_handed' ? 'active' : ''}
                onClick={() => setGameMode('three_handed')}
              >
                三人桌
              </button>
            </div>
          </div>

          {/* ICM Mode */}
          <div className="setting-group">
            <label>ICM 压力</label>
            <div className="button-group">
              {(['chip_ev', 'bubble', 'asymmetric'] as ICMMode[]).map(mode => (
                <button
                  key={mode}
                  className={icmMode === mode ? 'active' : ''}
                  onClick={() => setIcmMode(mode)}
                >
                  {ICM_MODE_NAMES[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Opponent Type */}
          <div className="setting-group">
            <label>对手类型</label>
            <div className="button-group">
              {(['nash', 'tight', 'loose', 'fish'] as OpponentType[]).map(type => (
                <button
                  key={type}
                  className={opponentType === type ? 'active' : ''}
                  onClick={() => setOpponentType(type)}
                >
                  {OPPONENT_NAMES[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>筹码深度 (BB)</label>
            <div className="button-group stack-buttons">
              <button
                className={stackSize === 'random' ? 'active' : ''}
                onClick={() => setStackSize('random')}
              >
                随机
              </button>
              {STACK_PRESETS.map(size => (
                <button
                  key={size}
                  className={stackSize === size ? 'active' : ''}
                  onClick={() => setStackSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>位置</label>
            <div className="button-group">
              <button
                className={positionFilter === 'all' ? 'active' : ''}
                onClick={() => setPositionFilter('all')}
              >
                全部
              </button>
              {(gameMode === 'three_handed' ? ['btn', 'sb', 'bb'] : ['sb', 'bb']).map(pos => (
                <button
                  key={pos}
                  className={positionFilter === pos ? 'active' : ''}
                  onClick={() => setPositionFilter(pos as Position)}
                >
                  {POSITION_NAMES[pos as Position]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="setting-group">
            <label>难度等级</label>
            <div className="button-group">
              {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map(level => (
                <button
                  key={level}
                  className={difficulty === level ? 'active' : ''}
                  onClick={() => setDifficulty(level)}
                >
                  {DIFFICULTY_NAMES[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Payout Structure */}
          <div className="setting-group">
            <label>奖池结构</label>
            <div className="payout-settings">
              <select
                className="payout-select"
                value={payoutPreset}
                onChange={(e) => handlePayoutPresetChange(e.target.value)}
              >
                {Object.entries(PAYOUT_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>{preset.name}</option>
                ))}
              </select>
              {customPayout.enabled && (
                <div className="custom-payout-inputs">
                  <div className="payout-input-row">
                    <label>奖池总额 $</label>
                    <input
                      type="number"
                      value={customPayout.prizePool}
                      onChange={(e) => setCustomPayout(prev => ({
                        ...prev,
                        prizePool: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="payout-places-input">
                    <label>分配 (%)</label>
                    <input
                      type="text"
                      placeholder="50,30,20"
                      defaultValue={customPayout.places.join(',')}
                      onChange={(e) => {
                        const places = e.target.value.split(',').map(s => parseInt(s.trim()) || 0);
                        setCustomPayout(prev => ({ ...prev, places }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timer Settings */}
          <div className="setting-group">
            <label>倒计时模式</label>
            <div className="timer-settings">
              <button
                className={`timer-toggle ${timerEnabled ? 'active' : ''}`}
                onClick={() => setTimerEnabled(!timerEnabled)}
              >
                {timerEnabled ? '开启' : '关闭'}
              </button>
              {timerEnabled && (
                <div className="timer-duration">
                  {[3, 5, 8, 10].map(sec => (
                    <button
                      key={sec}
                      className={timerDuration === sec ? 'active' : ''}
                      onClick={() => setTimerDuration(sec)}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* EV Display Toggle */}
          <div className="setting-group">
            <label>显示 EV</label>
            <div className="button-group">
              <button
                className={showEV ? 'active' : ''}
                onClick={() => setShowEV(true)}
              >
                显示
              </button>
              <button
                className={!showEV ? 'active' : ''}
                onClick={() => setShowEV(false)}
              >
                隐藏
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="session-stats">
            <h3>本轮统计</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">总题数</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.correct}</span>
                <span className="stat-label">正确</span>
              </div>
              <div className="stat-item">
                <span className={`stat-value ${stats.accuracy >= 70 ? 'good' : stats.accuracy >= 50 ? 'ok' : 'bad'}`}>
                  {stats.accuracy.toFixed(0)}%
                </span>
                <span className="stat-label">正确率</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{(stats.avgTime / 1000).toFixed(1)}s</span>
                <span className="stat-label">平均时间</span>
              </div>
            </div>

            {/* Streak Display */}
            {currentStreak > 0 && (
              <div className="streak-display">
                <span className="streak-icon">🔥</span>
                <span className="streak-count">{currentStreak}</span>
                <span className="streak-label">连胜中</span>
                {maxStreak > currentStreak && (
                  <span className="max-streak">最高: {maxStreak}</span>
                )}
              </div>
            )}

            {stats.timedOut > 0 && (
              <div className="timeout-stat">
                超时: {stats.timedOut} 次
              </div>
            )}

            {stats.total > 0 && (
              <div className="stats-actions">
                <button className="reset-btn" onClick={resetSession}>
                  重新开始
                </button>
                {mistakes.length > 0 && (
                  <button
                    className="review-btn"
                    onClick={() => setShowMistakeReview(!showMistakeReview)}
                  >
                    错题回顾 ({mistakes.length})
                  </button>
                )}
              </div>
            )}

            {/* Achievements Button */}
            <button
              className="achievements-btn"
              onClick={() => setShowAchievements(!showAchievements)}
            >
              🏆 成就 ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </button>
          </div>

          {/* Achievements Panel */}
          {showAchievements && (
            <div className="achievements-panel">
              <h3>成就列表</h3>
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <span className="achievement-icon">{achievement.icon}</span>
                    <div className="achievement-info">
                      <span className="achievement-name">{achievement.name}</span>
                      <span className="achievement-desc">{achievement.description}</span>
                      {!achievement.unlocked && achievement.progress > 0 && (
                        <div className="achievement-progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${Math.min(100, (achievement.progress / achievement.requirement) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weakness Analysis */}
          {weaknessAnalysis.length > 0 && (
            <div className="weakness-section">
              <h3>薄弱点分析</h3>
              <div className="weakness-list">
                {weaknessAnalysis.map((w, i) => (
                  <div key={i} className="weakness-item">
                    <span className="weakness-label">
                      {POSITION_NAMES[w.position]} · {w.stackRange} · {w.trainingMode === 'call' ? 'Call' : 'Push'}
                    </span>
                    <span className={`weakness-accuracy ${w.accuracy < 50 ? 'bad' : 'ok'}`}>
                      {w.accuracy.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game Panel */}
        <div className="game-panel">
          {/* Mistake Review Modal */}
          {showMistakeReview && (
            <div className="mistake-review-panel">
              <div className="mistake-review-header">
                <h3>错题回顾</h3>
                <button onClick={() => setShowMistakeReview(false)}>×</button>
              </div>
              <div className="mistake-list">
                {mistakes.map((m, i) => (
                  <div
                    key={i}
                    className={`mistake-item ${selectedMistake === m ? 'selected' : ''}`}
                    onClick={() => setSelectedMistake(m)}
                  >
                    <span className="mistake-hand">{m.scenario.handString}</span>
                    <span className="mistake-info">
                      {POSITION_NAMES[m.scenario.heroPosition]} · {m.scenario.heroStack}BB
                    </span>
                    <span className="mistake-action">
                      你: {m.userAction === 'push' ? 'Push' : m.userAction === 'call' ? 'Call' : 'Fold'}
                      → 正确: {m.scenario.correctAction === 'push' ? 'Push' : m.scenario.correctAction === 'call' ? 'Call' : 'Fold'}
                    </span>
                  </div>
                ))}
              </div>
              {selectedMistake && (
                <div className="selected-mistake-detail">
                  <h4>Range 详情</h4>
                  <RangeMatrix
                    range={selectedMistake.scenario.trainingMode === 'call'
                      ? (selectedMistake.scenario.callRange || [])
                      : selectedMistake.scenario.pushRange}
                    currentHand={selectedMistake.scenario.handString}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {/* Timer */}
          {timerEnabled && !showResult && (
            <Timer
              timeLeft={timeLeft}
              maxTime={timerDuration}
              isActive={!showResult}
            />
          )}

          {/* Compact Info Bar with Pill Badges */}
          <div className="compact-info-bar">
            <span className="info-pill position-pill">
              {POSITION_NAMES[scenario.heroPosition]}
            </span>
            <span className="info-pill stack-pill">
              {scenario.heroStack}BB
            </span>
            <span className="info-pill mode-pill">
              {trainingMode === 'call' ? 'Call' : 'Push'}模式
            </span>
            {scenario.isBubble && (
              <span className="info-pill bubble-pill">
                <span className="bubble-dot"></span>
                泡沫期
              </span>
            )}
            {icmMode !== 'chip_ev' && (
              <span className="info-pill icm-pill">
                ICM
              </span>
            )}
          </div>

          {/* Villain Stacks Info */}
          {icmMode !== 'chip_ev' && (
            <div className="villain-stacks">
              {scenario.villainStacks.map((stack, i) => (
                <span key={i} className="villain-stack">
                  对手{i + 1}: {stack}BB
                </span>
              ))}
            </div>
          )}

          {/* Training Context */}
          {trainingMode === 'call' && (
            <div className="training-context">
              <span className="context-label">
                {gameMode === 'heads_up' ? 'SB' : 'BTN'} All-In → 你在 {POSITION_NAMES[scenario.heroPosition]} 是否 Call?
              </span>
            </div>
          )}

          {/* Hero Hand - Enhanced Visual */}
          <div className={`hero-hand-section ${showResult ? 'result-shown' : ''}`}>
            <div className="hero-cards-container">
              <div className={`hero-cards ${!showResult ? 'glow-effect' : ''}`}>
                <div className="card-wrapper">
                  <PokerCard card={scenario.heroHand[0]} size={isMobile ? 'md' : 'lg'} variant="dark" />
                </div>
                <div className="card-wrapper">
                  <PokerCard card={scenario.heroHand[1]} size={isMobile ? 'md' : 'lg'} variant="dark" />
                </div>
              </div>
              <div className="hand-string-badge">{scenario.handString}</div>
            </div>
          </div>

          {/* Action Buttons - Enhanced with Animations */}
          {!showResult && (
            <div className="action-section">
              <div className="action-buttons-enhanced">
                <button
                  className="action-btn-enhanced fold-btn-enhanced"
                  onClick={() => handleAction('fold')}
                >
                  <div className="btn-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </div>
                  <div className="btn-text">
                    <span className="btn-label">Fold</span>
                    <span className="btn-hint">按 F</span>
                  </div>
                </button>
                <button
                  className="action-btn-enhanced push-btn-enhanced"
                  onClick={() => handleAction(trainingMode === 'call' ? 'call' : 'push')}
                >
                  <div className="btn-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div className="btn-text">
                    <span className="btn-label">{actionLabel}</span>
                    <span className="btn-hint">按 P</span>
                  </div>
                  <div className="btn-pulse"></div>
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && lastResult && (
            <div className={`result-section ${lastResult.isCorrect ? 'correct' : 'incorrect'}`}>
              {/* Result Header */}
              <div className="result-header-row">
                <div className={`result-icon ${lastResult.isCorrect ? 'correct' : 'incorrect'}`}>
                  {lastResult.isCorrect ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </div>
                <div className="result-summary">
                  <div className="result-title">
                    {lastResult.isCorrect ? '正确' : '错误'}
                    {lastResult.timedOut && <span className="timeout-badge">超时</span>}
                  </div>
                  <div className="result-meta">
                    <span className="meta-item">
                      <span className="meta-label">你的选择</span>
                      <span className={`meta-value ${lastResult.userAction}`}>
                        {lastResult.userAction === 'push' ? 'All-In' : lastResult.userAction === 'call' ? 'Call' : 'Fold'}
                      </span>
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                      <span className="meta-label">正确答案</span>
                      <span className={`meta-value ${scenario.correctAction}`}>
                        {scenario.correctAction === 'push' ? 'All-In' : scenario.correctAction === 'call' ? 'Call' : 'Fold'}
                      </span>
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                      <span className="meta-label">用时</span>
                      <span className="meta-value time">{(lastResult.timeMs / 1000).toFixed(1)}s</span>
                    </span>
                  </div>
                </div>
                <button className="next-btn-inline" onClick={newScenario}>
                  下一题 <span className="key-hint">(Space)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* EV Analysis Section */}
              {showEV && scenario.evAnalysis && (
                <div className="ev-analysis-section">
                  <h4>EV 分析</h4>
                  <div className="ev-grid">
                    <div className="ev-item">
                      <span className="ev-label">{trainingMode === 'call' ? 'EV(Call)' : 'EV(Push)'}</span>
                      <span className={`ev-value ${scenario.evAnalysis.evDiff > 0 ? 'positive' : 'negative'}`}>
                        {scenario.evAnalysis.evDiff > 0 ? '+' : ''}{scenario.evAnalysis.evDiff.toFixed(2)} BB
                      </span>
                    </div>
                    <div className="ev-item">
                      <span className="ev-label">EV(Fold)</span>
                      <span className="ev-value neutral">0.00 BB</span>
                    </div>
                    <div className="ev-item">
                      <span className="ev-label">ICM $</span>
                      <span className="ev-value icm">${scenario.evAnalysis.icmValue.toFixed(0)}</span>
                    </div>
                    <div className="ev-item">
                      <span className="ev-label">决策</span>
                      <span className={`ev-value ${scenario.evAnalysis.evDiff > 0 ? 'action' : 'fold'}`}>
                        {scenario.evAnalysis.evDiff > 0
                          ? (trainingMode === 'call' ? 'Call ✓' : 'Push ✓')
                          : 'Fold ✓'}
                      </span>
                    </div>
                  </div>

                  {/* Marginal Hand Explanation */}
                  {scenario.evAnalysis.isMarginal && scenario.evAnalysis.marginalExplanation && (
                    <div className="marginal-explanation">
                      <div className="marginal-badge">边际手牌</div>
                      <p>{scenario.evAnalysis.marginalExplanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Range Section with Matrix */}
              <div className="range-section">
                <div className="range-header">
                  <h4>
                    <span className="range-position">{POSITION_NAMES[scenario.heroPosition]}</span>
                    <span className="range-stack">{scenario.heroStack}BB</span>
                    {rangeLabel}
                    {opponentType !== 'nash' && (
                      <span className="opponent-badge">vs {OPPONENT_NAMES[opponentType]}</span>
                    )}
                  </h4>
                  <div className="range-stats">
                    <span className="stat">
                      <span className="stat-value">{actionRange?.length || 0}</span>
                      <span className="stat-label">手牌</span>
                    </span>
                    <span className="stat">
                      <span className="stat-value">{(((actionRange?.length || 0) / 169) * 100).toFixed(0)}%</span>
                      <span className="stat-label">范围</span>
                    </span>
                  </div>
                </div>
                <div className="range-status">
                  <span className={`hand-badge ${actionRange?.includes(scenario.handString) ? 'in-range' : 'out-range'}`}>
                    {scenario.handString}
                  </span>
                  <span className="status-text">
                    {actionRange?.includes(scenario.handString) ? `在 ${rangeLabel} 内` : `不在 ${rangeLabel} 内`}
                  </span>
                </div>

                {/* Range Matrix Visualization */}
                <div className="range-visualization">
                  <RangeMatrix
                    range={actionRange || []}
                    currentHand={scenario.handString}
                    compact={isMobile}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Achievement Popup */}
          {newAchievement && (
            <div className="achievement-popup">
              <div className="popup-icon">{newAchievement.icon}</div>
              <div className="popup-content">
                <span className="popup-label">成就解锁!</span>
                <span className="popup-name">{newAchievement.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link href="/icm" className="quick-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
          </svg>
          ICM 计算器
        </Link>
        <Link href="/practice" className="quick-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          常规训练
        </Link>
      </div>
    </div>
  );
}
