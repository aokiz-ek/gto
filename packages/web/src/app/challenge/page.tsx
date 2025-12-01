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

// Constants
const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const RFI_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const DAILY_CHALLENGE_COUNT = 10;

// Seeded random number generator for consistent daily challenges
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Generate today's date seed
function getTodaySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Generate consistent daily challenges
function generateDailyChallenges(): ChallengeQuestion[] {
  const seed = getTodaySeed();
  const random = seededRandom(seed);
  const challenges: ChallengeQuestion[] = [];
  const deck = createDeck();

  for (let i = 0; i < DAILY_CHALLENGE_COUNT; i++) {
    const questionSeed = seed + i;
    const qRandom = seededRandom(questionSeed);

    // Pick random cards
    const shuffled = [...deck].sort(() => qRandom() - 0.5);
    const heroHand: Hand = [shuffled[0], shuffled[1]];
    const handString = handToDisplayString(heroHand);

    // Pick scenario
    const scenarioRand = qRandom();
    let preflopScenario: PreflopScenario = scenarioRand < 0.35 ? 'rfi' : scenarioRand < 0.7 ? 'vs_rfi' : 'vs_3bet';

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
        // Try different cards
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

// 5-level rating system
interface ActionRating {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  bgColor: string;
}

function getActionRating(frequency: number): ActionRating {
  if (frequency >= 80) return { level: 5, name: '完美', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' };
  if (frequency >= 50) return { level: 4, name: '良好', color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.15)' };
  if (frequency >= 20) return { level: 3, name: '小失误', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' };
  if (frequency >= 5) return { level: 2, name: '错误', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
  return { level: 1, name: '严重失误', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
}

function mapActionType(action: string): string {
  if (action === 'all-in') return 'allin';
  if (action === 'bet') return 'bet';
  return action;
}

export default function DailyChallengePage() {
  const {
    dailyChallenge,
    startDailyChallenge,
    recordDailyChallengeResult,
    completeDailyChallenge,
  } = useUserStore();

  const [challenges] = useState<ChallengeQuestion[]>(() => generateDailyChallenges());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Check if already completed today
  useEffect(() => {
    if (dailyChallenge?.date === today && dailyChallenge.completed) {
      setIsComplete(true);
    } else if (!dailyChallenge || dailyChallenge.date !== today) {
      startDailyChallenge();
    } else {
      // Resume from last position
      setCurrentIndex(dailyChallenge.results.length);
    }
  }, [dailyChallenge, today, startDailyChallenge]);

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
    const correct = score >= 20;

    setAccuracyScore(score);
    setShowResult(true);

    recordDailyChallengeResult({
      questionIndex: currentIndex,
      correct,
      score,
      action,
    });
  }, [showResult, currentQuestion, currentIndex, recordDailyChallengeResult]);

  const handleNext = useCallback(() => {
    if (currentIndex >= challenges.length - 1) {
      completeDailyChallenge();
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAction(null);
      setShowResult(false);
      setAccuracyScore(0);
    }
  }, [currentIndex, challenges.length, completeDailyChallenge]);

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

  // Results summary view
  if (isComplete && dailyChallenge) {
    const avgScore = dailyChallenge.results.length > 0
      ? Math.round(dailyChallenge.totalScore / dailyChallenge.results.length)
      : 0;
    const perfectRate = Math.round((dailyChallenge.perfectCount / challenges.length) * 100);

    return (
      <div className="challenge-page">
        <div className="completion-view">
          <div className="trophy">🏆</div>
          <h1>每日挑战完成!</h1>
          <p className="date-label">{today}</p>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-value">{avgScore}%</div>
              <div className="card-label">平均分数</div>
            </div>
            <div className="summary-card highlight">
              <div className="card-value">{dailyChallenge.perfectCount}/{challenges.length}</div>
              <div className="card-label">完美决策</div>
            </div>
            <div className="summary-card">
              <div className="card-value">{perfectRate}%</div>
              <div className="card-label">完美率</div>
            </div>
          </div>

          <div className="results-list">
            <h3>答题详情</h3>
            {dailyChallenge.results.map((result, idx) => {
              const question = challenges[idx];
              const rating = getActionRating(result.score);
              return (
                <div key={idx} className="result-item">
                  <span className="q-num">#{idx + 1}</span>
                  <span className="q-hand">{question?.handString}</span>
                  <span className="q-pos">{question?.heroPosition}</span>
                  <span className="q-action">{result.action}</span>
                  <span className="q-score" style={{ color: rating.color }}>{result.score}%</span>
                  <span className="q-rating" style={{ color: rating.color }}>{rating.name}</span>
                </div>
              );
            })}
          </div>

          <div className="action-btns">
            <ShareButton
              title={`我在Aokiz GTO完成了每日挑战！`}
              desc={`得分: ${avgScore}% | 完美决策: ${dailyChallenge.perfectCount}/${challenges.length}，来挑战我吧！`}
              variant="secondary"
            >
              分享战绩
            </ShareButton>
            <Link href="/challenge/seven-day" className="btn-highlight">7天挑战</Link>
            <Link href="/practice" className="btn-secondary">自由练习</Link>
            <Link href="/" className="btn-primary">返回首页</Link>
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

          .completion-view {
            text-align: center;
            max-width: 500px;
            width: 100%;
          }

          .trophy {
            font-size: 64px;
            margin-bottom: 16px;
          }

          h1 {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }

          .date-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 32px;
          }

          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 32px;
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

          .results-list {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
          }

          .results-list h3 {
            font-size: 14px;
            color: #888;
            margin-bottom: 12px;
          }

          .result-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #222;
            font-size: 13px;
          }

          .result-item:last-child {
            border-bottom: none;
          }

          .q-num {
            color: #555;
            width: 30px;
          }

          .q-hand {
            color: #fff;
            font-weight: 600;
            width: 50px;
          }

          .q-pos {
            color: #888;
            width: 40px;
          }

          .q-action {
            color: #aaa;
            width: 50px;
          }

          .q-score {
            font-weight: 600;
            width: 45px;
            text-align: right;
          }

          .q-rating {
            font-weight: 500;
            margin-left: auto;
          }

          .action-btns {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          .btn-highlight {
            padding: 12px 24px;
            background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.15s;
          }

          .btn-highlight:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }

          .btn-secondary {
            padding: 12px 24px;
            background: transparent;
            border: 1px solid #333;
            border-radius: 8px;
            color: #888;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.15s;
          }

          .btn-secondary:hover {
            border-color: #555;
            color: #aaa;
          }

          .btn-primary {
            padding: 12px 32px;
            background: #22d3bf;
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.15s;
          }

          .btn-primary:hover {
            background: #1eb8a6;
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
            border: 3px solid #22d3bf;
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
          <span className="challenge-icon">🎯</span>
          每日挑战
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

        .back-link:hover {
          color: #22d3bf;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .challenge-icon {
          font-size: 20px;
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
          background: linear-gradient(90deg, #22d3bf, #22c55e);
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
          background: rgba(34, 211, 191, 0.15);
          border: 1px solid rgba(34, 211, 191, 0.3);
          border-radius: 20px;
          color: #22d3bf;
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
          transition: transform 0.1s, filter 0.1s;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
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
          border: 1px solid #22d3bf;
          background: rgba(34, 211, 191, 0.1);
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
          background: #22d3bf;
        }

        .freq-value {
          width: 45px;
          text-align: right;
          color: #22d3bf;
          font-weight: 600;
        }

        .you-marker {
          color: #22d3bf;
          font-size: 12px;
        }

        .next-btn {
          padding: 14px 48px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .next-btn:hover {
          background: #1eb8a6;
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
