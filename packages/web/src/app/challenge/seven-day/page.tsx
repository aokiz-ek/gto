'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { ShareButton } from '@/components';
import { useUserStore } from '@/store';
import {
  createDeck,
  handToDisplayString,
  GTO_RANGES,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
} from '@gto/core';
import type { Hand, Position, GTOHandStrategy, Card } from '@gto/core';

// Types
type PreflopScenario = 'rfi' | 'vs_rfi' | 'vs_3bet';

interface ChallengeQuestion {
  heroHand: Hand;
  handString: string;
  heroPosition: Position;
  villainPosition: Position;
  preflopScenario: PreflopScenario;
  strategy: GTOHandStrategy;
  seed: number;
}

interface DayProgress {
  day: number;
  completed: boolean;
  score: number;
  perfectCount: number;
  totalQuestions: number;
  completedAt?: string;
}

interface SevenDayChallengeState {
  startDate: string;
  currentDay: number;
  days: DayProgress[];
  isActive: boolean;
  completedDays: number;
}

// Constants
const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const RFI_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];

// Questions per day - increases with difficulty
const QUESTIONS_PER_DAY = [10, 12, 15, 18, 20, 22, 25];

// Seeded random number generator for consistent challenges
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Generate day seed based on start date and day number
function getDaySeed(startDate: string, day: number): number {
  const date = new Date(startDate);
  date.setDate(date.getDate() + day - 1);
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + day * 100;
}

// Generate challenges for a specific day
function generateDayChallenges(startDate: string, day: number): ChallengeQuestion[] {
  const seed = getDaySeed(startDate, day);
  const random = seededRandom(seed);
  const challenges: ChallengeQuestion[] = [];
  const deck = createDeck();
  const questionCount = QUESTIONS_PER_DAY[day - 1] || 10;

  // Day difficulty: affects scenario distribution
  const rfiChance = Math.max(0.2, 0.4 - day * 0.03);
  const vs3betChance = Math.min(0.4, 0.2 + day * 0.03);

  for (let i = 0; i < questionCount; i++) {
    const questionSeed = seed + i;
    const qRandom = seededRandom(questionSeed);

    // Pick random cards
    const shuffled = [...deck].sort(() => qRandom() - 0.5);
    const heroHand: Hand = [shuffled[0], shuffled[1]];
    const handString = handToDisplayString(heroHand);

    // Pick scenario based on day difficulty
    const scenarioRand = qRandom();
    let preflopScenario: PreflopScenario =
      scenarioRand < rfiChance ? 'rfi' :
      scenarioRand < rfiChance + (1 - rfiChance - vs3betChance) ? 'vs_rfi' :
      'vs_3bet';

    let heroPosition: Position;
    let villainPosition: Position;
    let strategy: GTOHandStrategy | null = null;

    // Try to find a valid scenario with strategy
    let attempts = 0;
    while (!strategy && attempts < 20) {
      if (preflopScenario === 'rfi') {
        heroPosition = RFI_POSITIONS[Math.floor(qRandom() * RFI_POSITIONS.length)];
        villainPosition = 'BB';
        const positionData = GTO_RANGES[heroPosition];
        const ranges = positionData?.ranges;
        if (ranges) {
          strategy = (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
        } else {
          strategy = null;
        }
      } else if (preflopScenario === 'vs_rfi') {
        heroPosition = 'BB';
        villainPosition = RFI_POSITIONS[Math.floor(qRandom() * RFI_POSITIONS.length)];
        const key = `BB_vs_${villainPosition}`;
        const rangeData = GTO_VS_RFI_RANGES[key];
        const ranges = rangeData?.ranges;
        if (ranges) {
          strategy = (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
        } else {
          strategy = null;
        }
      } else {
        const scenarios = [
          { hero: 'BTN' as Position, villain: 'BB' as Position },
          { hero: 'CO' as Position, villain: 'BTN' as Position },
          { hero: 'HJ' as Position, villain: 'CO' as Position },
        ];
        const scenario = scenarios[Math.floor(qRandom() * scenarios.length)];
        heroPosition = scenario.hero;
        villainPosition = scenario.villain;
        const key = `${heroPosition}_vs_${villainPosition}`;
        const rangeData = GTO_VS_3BET_RANGES[key];
        const ranges = rangeData?.ranges;
        if (ranges) {
          strategy = (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
        } else {
          strategy = null;
        }
      }
      attempts++;

      if (!strategy) {
        const reshuffled = [...deck].sort(() => qRandom() - 0.5);
        heroHand[0] = reshuffled[0];
        heroHand[1] = reshuffled[1];
      }
    }

    if (strategy) {
      challenges.push({
        heroHand,
        handString: handToDisplayString(heroHand),
        heroPosition: heroPosition!,
        villainPosition: villainPosition!,
        preflopScenario,
        strategy,
        seed: questionSeed,
      });
    }
  }

  return challenges;
}

// Rating system
interface ActionRating {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
}

function getActionRating(frequency: number): ActionRating {
  if (frequency >= 80) return { level: 5, name: '完美', color: '#22c55e' };
  if (frequency >= 50) return { level: 4, name: '良好', color: '#84cc16' };
  if (frequency >= 20) return { level: 3, name: '小失误', color: '#eab308' };
  if (frequency >= 5) return { level: 2, name: '错误', color: '#f97316' };
  return { level: 1, name: '严重失误', color: '#ef4444' };
}

function mapActionType(action: string): string {
  if (action === 'all-in') return 'allin';
  if (action === 'bet') return 'bet';
  return action;
}

// Local storage key
const STORAGE_KEY = 'seven-day-challenge';

function loadChallengeState(): SevenDayChallengeState | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveChallengeState(state: SevenDayChallengeState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function SevenDayChallengePage() {
  const [challengeState, setChallengeState] = useState<SevenDayChallengeState | null>(null);
  const [challenges, setChallenges] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [dayResults, setDayResults] = useState<{ score: number; perfect: boolean }[]>([]);
  const [isDayComplete, setIsDayComplete] = useState(false);

  // Load challenge state on mount
  useEffect(() => {
    const saved = loadChallengeState();
    if (saved) {
      setChallengeState(saved);
      // Load today's challenges if active
      if (saved.isActive) {
        const todaysChallenges = generateDayChallenges(saved.startDate, saved.currentDay);
        setChallenges(todaysChallenges);
      }
    }
  }, []);

  const startNewChallenge = () => {
    const today = new Date().toISOString().split('T')[0];
    const newState: SevenDayChallengeState = {
      startDate: today,
      currentDay: 1,
      days: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        completed: false,
        score: 0,
        perfectCount: 0,
        totalQuestions: QUESTIONS_PER_DAY[i],
      })),
      isActive: true,
      completedDays: 0,
    };
    setChallengeState(newState);
    saveChallengeState(newState);
    const dayChallenges = generateDayChallenges(today, 1);
    setChallenges(dayChallenges);
    setCurrentIndex(0);
    setDayResults([]);
    setIsDayComplete(false);
  };

  const currentQuestion = challenges[currentIndex];

  const availableActions = useMemo(() => {
    if (!currentQuestion) return [];

    if (currentQuestion.preflopScenario === 'rfi') {
      return [
        { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
        { action: 'raise', label: 'RAISE', color: '#ef4444', hotkey: 'R' },
      ];
    } else if (currentQuestion.preflopScenario === 'vs_rfi') {
      return [
        { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
        { action: 'call', label: 'CALL', color: '#22c55e', hotkey: 'C' },
        { action: 'raise', label: '3-BET', color: '#ef4444', hotkey: 'R' },
      ];
    } else {
      return [
        { action: 'fold', label: 'FOLD', color: '#3b82f6', hotkey: 'F' },
        { action: 'call', label: 'CALL', color: '#22c55e', hotkey: 'C' },
        { action: 'raise', label: '4-BET', color: '#ef4444', hotkey: 'R' },
        { action: 'allin', label: 'ALL-IN', color: '#7f1d1d', hotkey: 'A' },
      ];
    }
  }, [currentQuestion]);

  const handleAction = useCallback((action: string) => {
    if (showResult || !currentQuestion) return;

    setSelectedAction(action);
    const mappedAction = mapActionType(action);
    const gtoAction = currentQuestion.strategy.actions.find(a => a.action === mappedAction);
    const score = gtoAction?.frequency || 0;

    setAccuracyScore(score);
    setShowResult(true);
    setDayResults(prev => [...prev, { score, perfect: score >= 80 }]);
  }, [showResult, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex >= challenges.length - 1) {
      // Day complete
      const totalScore = dayResults.reduce((sum, r) => sum + r.score, 0);
      const perfectCount = dayResults.filter(r => r.perfect).length;

      if (challengeState) {
        const updatedDays = [...challengeState.days];
        updatedDays[challengeState.currentDay - 1] = {
          ...updatedDays[challengeState.currentDay - 1],
          completed: true,
          score: Math.round(totalScore / challenges.length),
          perfectCount,
          completedAt: new Date().toISOString(),
        };

        const newState: SevenDayChallengeState = {
          ...challengeState,
          days: updatedDays,
          completedDays: challengeState.completedDays + 1,
          currentDay: Math.min(challengeState.currentDay + 1, 7),
        };

        setChallengeState(newState);
        saveChallengeState(newState);
      }
      setIsDayComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAction(null);
      setShowResult(false);
      setAccuracyScore(0);
    }
  }, [currentIndex, challenges.length, dayResults, challengeState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
        return;
      }
      if (e.key.toLowerCase() === 'f') handleAction('fold');
      if (e.key.toLowerCase() === 'c') handleAction('call');
      if (e.key.toLowerCase() === 'r') handleAction('raise');
      if (e.key.toLowerCase() === 'a') handleAction('allin');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, handleAction, handleNext]);

  // Not started view
  if (!challengeState || !challengeState.isActive) {
    return (
      <div className="challenge-page">
        <div className="start-view">
          <div className="icon">7</div>
          <h1>7天挑战</h1>
          <p className="subtitle">连续7天完成每日训练，提升你的GTO水平</p>

          <div className="rules">
            <h3>挑战规则</h3>
            <ul>
              <li>每天完成指定数量的GTO题目</li>
              <li>难度逐日递增，从第1天10题到第7天25题</li>
              <li>连续7天完成即为挑战成功</li>
              <li>中断后需重新开始</li>
            </ul>
          </div>

          <div className="day-preview">
            <h3>每日任务</h3>
            <div className="days-grid">
              {QUESTIONS_PER_DAY.map((count, i) => (
                <div key={i} className="day-preview-item">
                  <span className="day-num">Day {i + 1}</span>
                  <span className="day-count">{count}题</span>
                </div>
              ))}
            </div>
          </div>

          <button className="start-btn" onClick={startNewChallenge}>
            开始挑战
          </button>

          <Link href="/challenge" className="back-link">
            返回每日挑战
          </Link>
        </div>

        <style jsx>{`
          .challenge-page {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .start-view {
            text-align: center;
            max-width: 500px;
          }

          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 800;
            color: #fff;
            margin: 0 auto 24px;
          }

          h1 {
            font-size: 32px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }

          .subtitle {
            color: #888;
            margin-bottom: 32px;
          }

          .rules, .day-preview {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: left;
          }

          .rules h3, .day-preview h3 {
            font-size: 14px;
            font-weight: 600;
            color: #888;
            margin-bottom: 12px;
          }

          .rules ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .rules li {
            padding: 8px 0;
            color: #aaa;
            font-size: 14px;
            border-bottom: 1px solid #222;
          }

          .rules li:last-child {
            border-bottom: none;
          }

          .rules li::before {
            content: '✓';
            color: #22d3bf;
            margin-right: 10px;
          }

          .days-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
          }

          .day-preview-item {
            text-align: center;
            padding: 12px 8px;
            background: #12121a;
            border-radius: 8px;
          }

          .day-num {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
          }

          .day-count {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
          }

          .start-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 16px;
          }

          .start-btn:hover {
            filter: brightness(1.1);
          }

          .back-link {
            color: #666;
            font-size: 14px;
            text-decoration: none;
          }

          .back-link:hover {
            color: #22d3bf;
          }
        `}</style>
      </div>
    );
  }

  // Day complete view
  if (isDayComplete) {
    const totalScore = dayResults.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Math.round(totalScore / dayResults.length);
    const perfectCount = dayResults.filter(r => r.perfect).length;
    const isAllComplete = challengeState.completedDays >= 7;

    return (
      <div className="challenge-page">
        <div className="day-complete-view">
          <div className="trophy">{isAllComplete ? '🎉' : '✨'}</div>
          <h1>{isAllComplete ? '7天挑战完成!' : `Day ${challengeState.currentDay - 1} 完成!`}</h1>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-value">{avgScore}%</div>
              <div className="card-label">平均分数</div>
            </div>
            <div className="summary-card highlight">
              <div className="card-value">{perfectCount}/{dayResults.length}</div>
              <div className="card-label">完美决策</div>
            </div>
          </div>

          <div className="progress-overview">
            <h3>挑战进度</h3>
            <div className="progress-days">
              {challengeState.days.map((day, i) => (
                <div
                  key={i}
                  className={`progress-day ${day.completed ? 'completed' : i === challengeState.currentDay - 1 ? 'current' : ''}`}
                >
                  <span className="day-num">{i + 1}</span>
                  {day.completed && <span className="check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="action-btns">
            <ShareButton
              title={isAllComplete
                ? `我完成了7天GTO挑战！`
                : `我完成了7天挑战第${challengeState.currentDay - 1}天！`}
              desc={`得分: ${avgScore}% | 完美决策: ${perfectCount}/${dayResults.length}，来挑战我吧！`}
              variant="secondary"
            >
              分享战绩
            </ShareButton>
            {!isAllComplete && (
              <button className="btn-primary" onClick={() => {
                const dayChallenges = generateDayChallenges(challengeState.startDate, challengeState.currentDay);
                setChallenges(dayChallenges);
                setCurrentIndex(0);
                setDayResults([]);
                setIsDayComplete(false);
                setSelectedAction(null);
                setShowResult(false);
              }}>
                继续 Day {challengeState.currentDay}
              </button>
            )}
            <Link href="/" className="btn-secondary">
              返回首页
            </Link>
          </div>
        </div>

        <style jsx>{`
          .challenge-page {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .day-complete-view {
            text-align: center;
            max-width: 400px;
          }

          .trophy {
            font-size: 64px;
            margin-bottom: 16px;
          }

          h1 {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 24px;
          }

          .summary-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .summary-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px;
          }

          .summary-card.highlight {
            border-color: #22d3bf;
            background: rgba(34, 211, 191, 0.1);
          }

          .card-value {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }

          .summary-card.highlight .card-value {
            color: #22d3bf;
          }

          .card-label {
            font-size: 12px;
            color: #888;
            margin-top: 4px;
          }

          .progress-overview {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .progress-overview h3 {
            font-size: 14px;
            color: #888;
            margin-bottom: 12px;
          }

          .progress-days {
            display: flex;
            justify-content: center;
            gap: 8px;
          }

          .progress-day {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #222;
            border: 2px solid #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            position: relative;
          }

          .progress-day.completed {
            background: rgba(34, 211, 191, 0.2);
            border-color: #22d3bf;
            color: #22d3bf;
          }

          .progress-day.current {
            border-color: #a78bfa;
            color: #a78bfa;
          }

          .progress-day .check {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #22d3bf;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #000;
          }

          .action-btns {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .btn-primary {
            padding: 14px 24px;
            background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .btn-secondary {
            padding: 14px 24px;
            background: transparent;
            border: 1px solid #333;
            border-radius: 8px;
            color: #888;
            font-size: 14px;
            text-decoration: none;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="loading">
        <div className="spinner" />
        <style jsx>{`
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
            border: 3px solid #a78bfa;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="challenge-page">
      {/* Header */}
      <div className="header">
        <Link href="/" className="back-link">← 返回</Link>
        <div className="title">
          <span className="day-badge">Day {challengeState.currentDay}</span>
          7天挑战
        </div>
        <div className="progress">
          {currentIndex + 1} / {challenges.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + (showResult ? 1 : 0)) / challenges.length) * 100}%` }}
        />
      </div>

      {/* Question content */}
      <div className="question-content">
        <div className="scenario-info">
          <span className="scenario-badge">
            {currentQuestion.preflopScenario === 'rfi' ? 'RFI' :
             currentQuestion.preflopScenario === 'vs_rfi' ? '面对RFI' : '面对3-Bet'}
          </span>
          <span className="position-info">
            {currentQuestion.heroPosition} vs {currentQuestion.villainPosition}
          </span>
        </div>

        <div className="hand-display">
          <PokerCard card={currentQuestion.heroHand[0]} size="lg" variant="dark" />
          <PokerCard card={currentQuestion.heroHand[1]} size="lg" variant="dark" />
        </div>

        <div className="hand-name">{currentQuestion.handString}</div>
      </div>

      {/* Result or Actions */}
      {showResult ? (
        <div className="result-panel">
          <div className="score-display">
            {(() => {
              const rating = getActionRating(accuracyScore);
              return (
                <>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: star <= rating.level ? rating.color : '#333' }}>★</span>
                    ))}
                  </div>
                  <div className="rating-text" style={{ color: rating.color }}>{rating.name}</div>
                  <div className="score-value">{accuracyScore}%</div>
                </>
              );
            })()}
          </div>

          <div className="gto-breakdown">
            {currentQuestion.strategy.actions
              .filter(a => a.frequency > 0)
              .sort((a, b) => b.frequency - a.frequency)
              .map(action => {
                const isSelected = mapActionType(selectedAction || '') === action.action;
                const actionLabels: Record<string, string> = {
                  fold: 'Fold', call: 'Call', raise: 'Raise', allin: 'All-in',
                };
                return (
                  <div key={action.action} className={`gto-item ${isSelected ? 'selected' : ''}`}>
                    <span className="action-name">{actionLabels[action.action] || action.action}</span>
                    <div className="freq-bar">
                      <div className="freq-fill" style={{ width: `${action.frequency}%` }} />
                    </div>
                    <span className="freq-value">{action.frequency}%</span>
                    {isSelected && <span className="you-marker">←</span>}
                  </div>
                );
              })}
          </div>

          <button className="next-btn" onClick={handleNext}>
            {currentIndex >= challenges.length - 1 ? '查看结果' : '下一题'}
            <span className="hint">空格键继续</span>
          </button>
        </div>
      ) : (
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

      <style jsx>{`
        .challenge-page {
          min-height: 100vh;
          background: #0d0d0d;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }

        .header {
          width: 100%;
          max-width: 600px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .back-link {
          color: #666;
          text-decoration: none;
          font-size: 14px;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .day-badge {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .progress {
          font-size: 14px;
          color: #888;
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          max-width: 600px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 40px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a78bfa, #ec4899);
          transition: width 0.3s ease;
        }

        .question-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }

        .scenario-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .scenario-badge {
          padding: 6px 16px;
          background: rgba(167, 139, 250, 0.15);
          border: 1px solid rgba(167, 139, 250, 0.3);
          border-radius: 20px;
          color: #a78bfa;
          font-size: 13px;
          font-weight: 500;
        }

        .position-info {
          color: #888;
          font-size: 14px;
        }

        .hand-display {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .hand-name {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          padding: 14px 36px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .action-btn .hotkey {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          margin-left: 10px;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }

        .result-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          padding: 24px;
          min-width: 320px;
        }

        .score-display {
          text-align: center;
        }

        .rating-stars {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .rating-text {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .score-value {
          font-size: 14px;
          color: #888;
        }

        .gto-breakdown {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gto-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #222;
          border-radius: 6px;
          font-size: 13px;
        }

        .gto-item.selected {
          border: 1px solid #a78bfa;
          background: rgba(167, 139, 250, 0.1);
        }

        .gto-item .action-name {
          width: 60px;
          color: #fff;
          font-weight: 500;
        }

        .freq-bar {
          flex: 1;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .freq-fill {
          height: 100%;
          background: #a78bfa;
        }

        .freq-value {
          width: 45px;
          text-align: right;
          color: #a78bfa;
          font-weight: 600;
        }

        .you-marker {
          color: #a78bfa;
          font-size: 12px;
        }

        .next-btn {
          padding: 14px 48px;
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .next-btn .hint {
          font-size: 11px;
          font-weight: 400;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
