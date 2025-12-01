'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { ShareButton } from '@/components';
import { usePKStore, useUserStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import {
  GTO_RANGES,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
} from '@gto/core';
import type { Position, GTOHandStrategy } from '@gto/core';

// Constants
const ROUND_TIME_LIMIT = 15; // seconds per round

type MatchMode = 'quick' | 'ranked' | 'friend';

interface MatchInfo {
  mode: MatchMode;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

const MATCH_MODES: MatchInfo[] = [
  {
    mode: 'quick',
    label: '快速匹配',
    description: '随机匹配对手，进行5局对决',
    icon: '⚡',
    available: true,
  },
  {
    mode: 'ranked',
    label: '排位赛',
    description: '匹配相近段位玩家，影响排名',
    icon: '🏆',
    available: false,
  },
  {
    mode: 'friend',
    label: '好友对战',
    description: '邀请好友进行私人对局',
    icon: '👥',
    available: false,
  },
];

// Get GTO strategy for a hand
function getGTOStrategy(
  handString: string,
  heroPosition: string,
  villainPosition: string,
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet'
): GTOHandStrategy | null {
  if (scenario === 'rfi') {
    const positionData = GTO_RANGES[heroPosition as Position];
    const ranges = positionData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  } else if (scenario === 'vs_rfi') {
    const key = `BB_vs_${villainPosition}`;
    const rangeData = GTO_VS_RFI_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  } else {
    const key = `${heroPosition}_vs_${villainPosition}`;
    const rangeData = GTO_VS_3BET_RANGES[key];
    const ranges = rangeData?.ranges;
    if (ranges) {
      return (ranges instanceof Map ? ranges.get(handString) : ranges[handString]) || null;
    }
  }
  return null;
}

// Calculate score based on action accuracy and time
function calculateScore(frequency: number, timeMs: number): number {
  const accuracyScore = Math.round(frequency * 100);
  const timeBonus = Math.max(0, Math.round((10000 - timeMs) / 100)); // Bonus for fast answers
  return accuracyScore + timeBonus;
}

export default function PKPage() {
  const [selectedMode, setSelectedMode] = useState<MatchMode | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchingTime, setMatchingTime] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_LIMIT);
  const [gtoStrategy, setGtoStrategy] = useState<GTOHandStrategy | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    status,
    battle,
    opponent,
    isPlayer1,
    currentRound,
    error,
    startMatching,
    cancelMatching,
    submitAnswer,
    leaveBattle,
    reset,
  } = usePKStore();

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });

    return () => {
      reset();
    };
  }, [reset]);

  // Matching timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'matching') {
      interval = setInterval(() => {
        setMatchingTime((t) => t + 1);
      }, 1000);
    } else {
      setMatchingTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Round timer with countdown
  useEffect(() => {
    if (status === 'matched' || status === 'playing') {
      if (currentRound && currentRound.status === 'active' && !hasSubmitted) {
        setRoundStartTime(Date.now());
        setSelectedAction(null);
        setHasSubmitted(false);
        setShowResult(false);
        setTimeLeft(ROUND_TIME_LIMIT);

        // Load GTO strategy for this round
        const strategy = getGTOStrategy(
          currentRound.heroHand,
          currentRound.heroPosition,
          currentRound.villainPosition,
          currentRound.scenario
        );
        setGtoStrategy(strategy);

        // Clear previous timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Start countdown
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // Auto-submit fold when time runs out
              if (!hasSubmitted && currentRound) {
                handleSelectAction('fold');
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, currentRound?.roundNumber, currentRound?.status]);

  // Check if round is complete
  useEffect(() => {
    if (currentRound && currentRound.status === 'completed') {
      setShowResult(true);
    }
  }, [currentRound?.status]);

  // Handle start matching
  const handleStartMatching = async (mode: MatchMode) => {
    if (!userId) {
      alert('请先登录');
      return;
    }
    setSelectedMode(mode);
    await startMatching(mode, userId);
  };

  // Handle cancel matching
  const handleCancelMatching = async () => {
    if (userId) {
      await cancelMatching(userId);
    }
    setSelectedMode(null);
  };

  // Handle action selection
  const handleSelectAction = useCallback(async (action: string) => {
    if (!currentRound || hasSubmitted || !roundStartTime) return;

    setSelectedAction(action);
    setHasSubmitted(true);

    const timeMs = Date.now() - roundStartTime;

    // Get GTO strategy
    const strategy = getGTOStrategy(
      currentRound.heroHand,
      currentRound.heroPosition,
      currentRound.villainPosition,
      currentRound.scenario
    );

    // Calculate frequency and score
    let frequency = 0;
    if (strategy) {
      if (action === 'fold') frequency = strategy.fold || 0;
      else if (action === 'call') frequency = strategy.call || 0;
      else if (action === 'raise') frequency = strategy.raise || 0;
      else if (action === 'allin') frequency = strategy.allin || 0;
    }

    const score = calculateScore(frequency, timeMs);

    await submitAnswer(action, timeMs, score);
  }, [currentRound, hasSubmitted, roundStartTime, submitAnswer]);

  // Continue to next round
  const handleNextRound = () => {
    setShowResult(false);
    setHasSubmitted(false);
    setSelectedAction(null);
  };

  // Render idle state - mode selection
  if (status === 'idle') {
    return (
      <div className="pk-page">
        <div className="header">
          <Link href="/practice" className="back-link">← 返回练习</Link>
          <h1>PK对战</h1>
          <div className="placeholder" />
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        <div className="mode-section">
          <h2>选择对战模式</h2>
          <div className="mode-grid">
            {MATCH_MODES.map((mode) => (
              <button
                key={mode.mode}
                className={`mode-card ${selectedMode === mode.mode ? 'selected' : ''} ${!mode.available ? 'disabled' : ''}`}
                onClick={() => mode.available && handleStartMatching(mode.mode)}
                disabled={!mode.available || !userId}
              >
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-label">{mode.label}</span>
                <span className="mode-desc">{mode.description}</span>
                {!mode.available && <span className="coming-tag">即将上线</span>}
              </button>
            ))}
          </div>
        </div>

        {!userId && (
          <div className="login-prompt">
            <p>请先 <Link href="/auth/login">登录</Link> 以开始对战</p>
          </div>
        )}

        <div className="info-section">
          <h2>PK对战规则</h2>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">1️⃣</span>
              <div className="rule-content">
                <strong>同题对决</strong>
                <p>双方玩家面对相同的GTO场景题目</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">2️⃣</span>
              <div className="rule-content">
                <strong>速度 + 准确性</strong>
                <p>答题更快更准确可获得更高分数</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">3️⃣</span>
              <div className="rule-content">
                <strong>5局定胜负</strong>
                <p>总分高者获胜，赢得积分和荣耀</p>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`${styles}`}</style>
      </div>
    );
  }

  // Render matching state
  if (status === 'matching') {
    return (
      <div className="pk-page">
        <div className="matching-screen">
          <div className="matching-animation">
            <div className="pulse-ring" />
            <div className="pulse-ring delay" />
            <span className="matching-icon">⚔️</span>
          </div>
          <h2>正在匹配对手...</h2>
          <p className="matching-time">{Math.floor(matchingTime / 60)}:{(matchingTime % 60).toString().padStart(2, '0')}</p>
          <button className="cancel-btn" onClick={handleCancelMatching}>
            取消匹配
          </button>
        </div>

        <style jsx>{`${styles}`}</style>
      </div>
    );
  }

  // Render matched/playing state
  if ((status === 'matched' || status === 'playing') && battle && opponent && currentRound) {
    const myScore = isPlayer1 ? battle.player1Score : battle.player2Score;
    const opponentScore = isPlayer1 ? battle.player2Score : battle.player1Score;

    return (
      <div className="pk-page">
        {/* Battle header */}
        <div className="battle-header">
          <div className="player-info me">
            <span className="player-name">你</span>
            <span className="player-score">{myScore}</span>
          </div>
          <div className="vs-indicator">
            <span className="round-info">第 {battle.currentRound}/{battle.totalRounds} 局</span>
            <span className="vs">VS</span>
          </div>
          <div className="player-info opponent">
            <span className="player-name">{opponent.username}</span>
            <span className="player-score">{opponentScore}</span>
          </div>
        </div>

        {/* Question area */}
        <div className="question-area">
          {/* Countdown timer */}
          {!hasSubmitted && (
            <div className={`countdown-timer ${timeLeft <= 5 ? 'urgent' : ''}`}>
              <div className="timer-circle">
                <svg viewBox="0 0 36 36" className="timer-svg">
                  <path
                    className="timer-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="timer-progress"
                    strokeDasharray={`${(timeLeft / ROUND_TIME_LIMIT) * 100}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="timer-text">{timeLeft}</span>
              </div>
            </div>
          )}

          <div className="scenario-info">
            <span className="position">{currentRound.heroPosition}</span>
            <span className="vs-text">vs</span>
            <span className="position">{currentRound.villainPosition}</span>
            <span className="scenario-type">
              {currentRound.scenario === 'rfi' ? 'RFI' : currentRound.scenario === 'vs_rfi' ? '面对加注' : '面对3-Bet'}
            </span>
          </div>

          <div className="hand-display">
            <span className="hand-text">{currentRound.heroHand}</span>
          </div>

          <p className="question-text">你应该怎么做？</p>
        </div>

        {/* Action buttons */}
        {!hasSubmitted && (
          <div className="action-buttons">
            <button
              className={`action-btn fold ${selectedAction === 'fold' ? 'selected' : ''}`}
              onClick={() => handleSelectAction('fold')}
            >
              Fold
            </button>
            <button
              className={`action-btn call ${selectedAction === 'call' ? 'selected' : ''}`}
              onClick={() => handleSelectAction('call')}
            >
              Call
            </button>
            <button
              className={`action-btn raise ${selectedAction === 'raise' ? 'selected' : ''}`}
              onClick={() => handleSelectAction('raise')}
            >
              Raise
            </button>
          </div>
        )}

        {/* Waiting for opponent */}
        {hasSubmitted && !showResult && (
          <div className="waiting-opponent">
            <div className="spinner" />
            <p>等待对手答题...</p>
          </div>
        )}

        {/* Round result */}
        {showResult && currentRound.status === 'completed' && (
          <div className="round-result">
            <div className="result-comparison">
              <div className="result-player">
                <span className="label">你的选择</span>
                <span className="action">{selectedAction}</span>
                <span className="score">+{isPlayer1 ? currentRound.player1Score : currentRound.player2Score}</span>
              </div>
              <div className="result-player">
                <span className="label">对手选择</span>
                <span className="action">{isPlayer1 ? currentRound.player2Action : currentRound.player1Action}</span>
                <span className="score">+{isPlayer1 ? currentRound.player2Score : currentRound.player1Score}</span>
              </div>
            </div>

            {/* GTO Strategy Display */}
            {gtoStrategy && (
              <div className="gto-strategy">
                <h4>GTO策略</h4>
                <div className="strategy-bars">
                  {gtoStrategy.fold && gtoStrategy.fold > 0 && (
                    <div className="strategy-bar">
                      <span className="bar-label">Fold</span>
                      <div className="bar-container">
                        <div className="bar fold" style={{ width: `${gtoStrategy.fold * 100}%` }} />
                      </div>
                      <span className="bar-value">{Math.round(gtoStrategy.fold * 100)}%</span>
                    </div>
                  )}
                  {gtoStrategy.call && gtoStrategy.call > 0 && (
                    <div className="strategy-bar">
                      <span className="bar-label">Call</span>
                      <div className="bar-container">
                        <div className="bar call" style={{ width: `${gtoStrategy.call * 100}%` }} />
                      </div>
                      <span className="bar-value">{Math.round(gtoStrategy.call * 100)}%</span>
                    </div>
                  )}
                  {gtoStrategy.raise && gtoStrategy.raise > 0 && (
                    <div className="strategy-bar">
                      <span className="bar-label">Raise</span>
                      <div className="bar-container">
                        <div className="bar raise" style={{ width: `${gtoStrategy.raise * 100}%` }} />
                      </div>
                      <span className="bar-value">{Math.round(gtoStrategy.raise * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {battle.currentRound <= battle.totalRounds && (
              <button className="next-btn" onClick={handleNextRound}>
                下一局
              </button>
            )}
          </div>
        )}

        <style jsx>{`${styles}`}</style>
      </div>
    );
  }

  // Render completed state
  if (status === 'completed' && battle) {
    const myScore = isPlayer1 ? battle.player1Score : battle.player2Score;
    const opponentScore = isPlayer1 ? battle.player2Score : battle.player1Score;
    const isWinner = battle.winnerId === (isPlayer1 ? battle.player1Id : battle.player2Id);
    const isDraw = !battle.winnerId;

    return (
      <div className="pk-page">
        <div className="result-screen">
          <div className={`result-banner ${isWinner ? 'win' : isDraw ? 'draw' : 'lose'}`}>
            <span className="result-icon">
              {isWinner ? '🏆' : isDraw ? '🤝' : '😢'}
            </span>
            <h2>{isWinner ? '胜利!' : isDraw ? '平局' : '失败'}</h2>
          </div>

          <div className="final-score">
            <div className="score-item">
              <span className="label">你的得分</span>
              <span className="value">{myScore}</span>
            </div>
            <div className="score-divider">:</div>
            <div className="score-item">
              <span className="label">{opponent?.username}</span>
              <span className="value">{opponentScore}</span>
            </div>
          </div>

          {/* Round by Round Review */}
          <div className="rounds-review">
            <h3>对局回顾</h3>
            <div className="rounds-list">
              {battle.rounds.map((round) => {
                const myAction = isPlayer1 ? round.player1Action : round.player2Action;
                const myRoundScore = isPlayer1 ? round.player1Score : round.player2Score;
                const oppAction = isPlayer1 ? round.player2Action : round.player1Action;
                const oppRoundScore = isPlayer1 ? round.player2Score : round.player1Score;
                const roundStrategy = getGTOStrategy(
                  round.heroHand,
                  round.heroPosition,
                  round.villainPosition,
                  round.scenario
                );
                const gtoAction = roundStrategy
                  ? Object.entries({ fold: roundStrategy.fold, call: roundStrategy.call, raise: roundStrategy.raise })
                      .filter(([_, v]) => v && v > 0)
                      .sort(([, a], [, b]) => (b || 0) - (a || 0))[0]?.[0] || 'N/A'
                  : 'N/A';

                return (
                  <div key={round.roundNumber} className="round-review-item">
                    <div className="round-header">
                      <span className="round-num">第{round.roundNumber}局</span>
                      <span className="round-hand">{round.heroHand}</span>
                      <span className="round-scenario">
                        {round.heroPosition} vs {round.villainPosition}
                      </span>
                    </div>
                    <div className="round-details">
                      <div className="player-result me">
                        <span className="action-label">你: </span>
                        <span className={`action-value ${myAction}`}>{myAction?.toUpperCase()}</span>
                        <span className="score-value">+{myRoundScore || 0}</span>
                      </div>
                      <div className="player-result opp">
                        <span className="action-label">对手: </span>
                        <span className={`action-value ${oppAction}`}>{oppAction?.toUpperCase()}</span>
                        <span className="score-value">+{oppRoundScore || 0}</span>
                      </div>
                      <div className="gto-optimal">
                        <span className="action-label">GTO: </span>
                        <span className="action-value gto">{gtoAction.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="result-actions">
            <ShareButton
              title={isWinner ? `我在GTO对战中获胜！` : isDraw ? `GTO对战平局结束` : `GTO对战结束`}
              desc={`比分 ${myScore}:${opponentScore}，来和我PK吧！`}
              variant="secondary"
            >
              分享战绩
            </ShareButton>
            <button className="action-btn primary" onClick={() => reset()}>
              再来一局
            </button>
            <Link href="/practice" className="action-btn secondary">
              返回练习
            </Link>
          </div>
        </div>

        <style jsx>{`${styles}`}</style>
      </div>
    );
  }

  return null;
}

const styles = `
  .pk-page {
    min-height: 100vh;
    background: #0d0d0d;
    padding: 20px;
    color: #fff;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .back-link {
    color: #888;
    text-decoration: none;
    font-size: 14px;
  }

  .back-link:hover {
    color: #22d3bf;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .placeholder {
    width: 60px;
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    color: #ef4444;
  }

  .login-prompt {
    text-align: center;
    padding: 16px;
    color: #888;
  }

  .login-prompt a {
    color: #22d3bf;
  }

  /* Mode Selection */
  .mode-section {
    margin-bottom: 32px;
  }

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: #888;
    margin-bottom: 16px;
  }

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .mode-card {
    position: relative;
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mode-card:hover:not(.disabled) {
    border-color: #a78bfa;
    transform: translateY(-2px);
  }

  .mode-card.selected {
    border-color: #a78bfa;
    background: rgba(139, 92, 246, 0.1);
  }

  .mode-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .mode-icon {
    display: block;
    font-size: 36px;
    margin-bottom: 12px;
  }

  .mode-label {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .mode-desc {
    display: block;
    font-size: 13px;
    color: #888;
  }

  .coming-tag {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
  }

  /* Info Section */
  .info-section {
    margin-bottom: 32px;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .rule-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 16px;
  }

  .rule-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .rule-content {
    flex: 1;
  }

  .rule-content strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .rule-content p {
    font-size: 13px;
    color: #888;
    margin: 0;
  }

  /* Matching Screen */
  .matching-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }

  .matching-animation {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  .pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid #a78bfa;
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
  }

  .pulse-ring.delay {
    animation-delay: 1s;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .matching-icon {
    font-size: 48px;
    z-index: 1;
  }

  .matching-time {
    font-size: 24px;
    font-weight: 600;
    color: #888;
    margin: 16px 0;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid #333;
    color: #888;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  /* Battle Screen */
  .battle-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .player-info {
    text-align: center;
    flex: 1;
  }

  .player-info.me .player-score {
    color: #22d3bf;
  }

  .player-info.opponent .player-score {
    color: #f97316;
  }

  .player-name {
    display: block;
    font-size: 14px;
    color: #888;
    margin-bottom: 4px;
  }

  .player-score {
    display: block;
    font-size: 32px;
    font-weight: 700;
  }

  .vs-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .round-info {
    font-size: 12px;
    color: #666;
  }

  .vs {
    font-size: 20px;
    font-weight: 700;
    color: #a78bfa;
  }

  /* Question Area */
  .question-area {
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;
  }

  .scenario-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .position {
    background: #1a1a2e;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 600;
    color: #22d3bf;
  }

  .vs-text {
    color: #666;
  }

  .scenario-type {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
  }

  .hand-display {
    margin: 24px 0;
  }

  .hand-text {
    font-size: 48px;
    font-weight: 700;
    background: linear-gradient(135deg, #22d3bf 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .question-text {
    color: #888;
    font-size: 16px;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-bottom: 24px;
  }

  .action-btn {
    flex: 1;
    max-width: 150px;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .action-btn.fold {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
    border-color: rgba(107, 114, 128, 0.3);
  }

  .action-btn.call {
    background: rgba(34, 211, 191, 0.2);
    color: #22d3bf;
    border-color: rgba(34, 211, 191, 0.3);
  }

  .action-btn.raise {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .action-btn:hover {
    transform: translateY(-2px);
  }

  .action-btn.selected {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }

  /* Waiting for opponent */
  .waiting-opponent {
    text-align: center;
    padding: 32px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #1a1a1a;
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Round Result */
  .round-result {
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  }

  .result-comparison {
    display: flex;
    justify-content: space-around;
    margin-bottom: 24px;
  }

  .result-player {
    text-align: center;
  }

  .result-player .label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
  }

  .result-player .action {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .result-player .score {
    color: #22c55e;
    font-weight: 600;
  }

  .next-btn {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
    color: #fff;
    border: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(167, 139, 250, 0.4);
  }

  /* Result Screen */
  .result-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }

  .result-banner {
    margin-bottom: 32px;
  }

  .result-banner .result-icon {
    font-size: 64px;
    display: block;
    margin-bottom: 16px;
  }

  .result-banner h2 {
    font-size: 32px;
    font-weight: 700;
  }

  .result-banner.win h2 {
    color: #22c55e;
  }

  .result-banner.draw h2 {
    color: #f59e0b;
  }

  .result-banner.lose h2 {
    color: #ef4444;
  }

  .final-score {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
  }

  .score-item {
    text-align: center;
  }

  .score-item .label {
    display: block;
    font-size: 14px;
    color: #888;
    margin-bottom: 8px;
  }

  .score-item .value {
    font-size: 48px;
    font-weight: 700;
    color: #fff;
  }

  .score-divider {
    font-size: 48px;
    font-weight: 700;
    color: #666;
  }

  .result-actions {
    display: flex;
    gap: 16px;
  }

  .result-actions .action-btn {
    padding: 14px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
  }

  .result-actions .action-btn.primary {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
    color: #fff;
    border: none;
  }

  .result-actions .action-btn.secondary {
    background: transparent;
    border: 1px solid #333;
    color: #888;
  }

  .result-actions .action-btn:hover {
    transform: translateY(-2px);
  }

  /* Countdown Timer */
  .countdown-timer {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .timer-circle {
    position: relative;
    width: 60px;
    height: 60px;
  }

  .timer-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .timer-bg {
    fill: none;
    stroke: #1a1a2e;
    stroke-width: 3;
  }

  .timer-progress {
    fill: none;
    stroke: #22d3bf;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .countdown-timer.urgent .timer-progress {
    stroke: #ef4444;
  }

  .timer-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 20px;
    font-weight: 700;
    color: #22d3bf;
  }

  .countdown-timer.urgent .timer-text {
    color: #ef4444;
    animation: pulse-text 0.5s ease infinite;
  }

  @keyframes pulse-text {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }

  /* GTO Strategy Display */
  .gto-strategy {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 16px;
    margin: 20px 0;
  }

  .gto-strategy h4 {
    font-size: 14px;
    font-weight: 600;
    color: #888;
    margin-bottom: 12px;
    text-align: center;
  }

  .strategy-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .strategy-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bar-label {
    width: 50px;
    font-size: 12px;
    font-weight: 600;
    color: #888;
    text-align: right;
  }

  .bar-container {
    flex: 1;
    height: 8px;
    background: #12121a;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .bar.fold {
    background: #6b7280;
  }

  .bar.call {
    background: #22d3bf;
  }

  .bar.raise {
    background: #ef4444;
  }

  .bar-value {
    width: 40px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-align: left;
  }

  /* Rounds Review Section */
  .rounds-review {
    width: 100%;
    max-width: 500px;
    margin: 24px auto;
  }

  .rounds-review h3 {
    font-size: 16px;
    font-weight: 600;
    color: #888;
    margin-bottom: 16px;
    text-align: center;
  }

  .rounds-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .round-review-item {
    background: #12121a;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    padding: 16px;
  }

  .round-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #1a1a2e;
  }

  .round-num {
    font-size: 12px;
    font-weight: 600;
    color: #a78bfa;
    background: rgba(139, 92, 246, 0.2);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .round-hand {
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(135deg, #22d3bf 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .round-scenario {
    font-size: 12px;
    color: #666;
    margin-left: auto;
  }

  .round-details {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .player-result,
  .gto-optimal {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-label {
    font-size: 12px;
    color: #666;
  }

  .action-value {
    font-size: 13px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .action-value.fold {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }

  .action-value.call {
    background: rgba(34, 211, 191, 0.2);
    color: #22d3bf;
  }

  .action-value.raise {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .action-value.gto {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }

  .score-value {
    font-size: 12px;
    font-weight: 600;
    color: #22c55e;
  }

  @media (max-width: 768px) {
    .mode-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }

    .action-btn {
      max-width: 100%;
    }

    .final-score {
      flex-direction: column;
      gap: 8px;
    }

    .score-divider {
      display: none;
    }
  }
`;
