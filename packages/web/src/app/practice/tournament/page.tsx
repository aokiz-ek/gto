'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { useResponsive } from '@/hooks';
import { useUserStore } from '@/store';
import {
  createDeck,
  shuffleDeck,
  quickICM,
  COMMON_PAYOUTS,
  getNashPushRange,
} from '@gto/core';
import type { Card, Hand } from '@gto/core';
import './tournament.css';

type TournamentType = 'sng_6max' | 'sng_9max' | 'mtt_final';
type TournamentStage = 'early' | 'middle' | 'late' | 'bubble' | 'final_table';
type Action = 'push' | 'fold' | 'call' | 'raise';

interface Player {
  id: number;
  name: string;
  chips: number;
  position: string;
  isHero: boolean;
}

interface Scenario {
  type: TournamentType;
  stage: TournamentStage;
  players: Player[];
  heroHand: Hand;
  handString: string;
  heroPosition: number;
  sb: number;
  bb: number;
  ante: number;
  payouts: number[];
  pot: number;
  correctAction: Action;
  actionOptions: Action[];
  icmEquities: number[];
}

interface Result {
  scenario: Scenario;
  userAction: Action;
  isCorrect: boolean;
  timeMs: number;
  evLoss: number;
}

const TOURNAMENT_CONFIGS = {
  sng_6max: {
    name: 'SNG 6-Max',
    numPlayers: 6,
    payouts: COMMON_PAYOUTS.SNG_6_MAX,
    prizePool: 100,
  },
  sng_9max: {
    name: 'SNG 9-Max',
    numPlayers: 9,
    payouts: COMMON_PAYOUTS.SNG_9_MAX,
    prizePool: 100,
  },
  mtt_final: {
    name: 'MTT Final Table',
    numPlayers: 9,
    payouts: COMMON_PAYOUTS.MTT_FINAL_TABLE_9,
    prizePool: 100,
  },
};

const STAGE_INFO = {
  early: { name: '初期', color: '#4ecdc4', blindLevelMultiplier: 1 },
  middle: { name: '中期', color: '#ffd700', blindLevelMultiplier: 2 },
  late: { name: '后期', color: '#ff9800', blindLevelMultiplier: 4 },
  bubble: { name: '钱圈泡沫', color: '#ff6b6b', blindLevelMultiplier: 6 },
  final_table: { name: '决赛桌', color: '#9b5de5', blindLevelMultiplier: 8 },
};

const POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'];

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

function generateRandomStacks(numPlayers: number, avgStack: number): number[] {
  const stacks: number[] = [];
  const variance = 0.6;

  for (let i = 0; i < numPlayers; i++) {
    const randomFactor = 0.3 + Math.random() * (1 + variance);
    stacks.push(Math.floor(avgStack * randomFactor));
  }

  return stacks;
}

function determineActionOptions(scenario: {
  heroStack: number;
  bb: number;
  pot: number;
  stage: TournamentStage;
}): { options: Action[]; correct: Action } {
  const stackInBB = scenario.heroStack / scenario.bb;

  // Short stack: Push/Fold decisions
  if (stackInBB < 12) {
    const shouldPush = Math.random() > 0.5;
    return {
      options: ['push', 'fold'],
      correct: shouldPush ? 'push' : 'fold',
    };
  }

  // Medium stack: Raise/Fold decisions
  if (stackInBB < 25) {
    const shouldRaise = Math.random() > 0.4;
    return {
      options: ['raise', 'fold'],
      correct: shouldRaise ? 'raise' : 'fold',
    };
  }

  // Deep stack: Call/Raise/Fold
  const rand = Math.random();
  if (rand < 0.4) {
    return { options: ['call', 'raise', 'fold'], correct: 'raise' };
  } else if (rand < 0.7) {
    return { options: ['call', 'raise', 'fold'], correct: 'call' };
  } else {
    return { options: ['call', 'raise', 'fold'], correct: 'fold' };
  }
}

function generateScenario(
  tournamentType: TournamentType,
  stageFilter: TournamentStage | 'all'
): Scenario {
  const config = TOURNAMENT_CONFIGS[tournamentType];
  const deck = shuffleDeck(createDeck());

  // Determine stage
  const stages: TournamentStage[] = ['early', 'middle', 'late', 'bubble', 'final_table'];
  const stage = stageFilter === 'all'
    ? stages[Math.floor(Math.random() * stages.length)]
    : stageFilter;

  // Calculate remaining players based on stage
  let numPlayers: number;
  if (stage === 'final_table' || (stage === 'bubble' && tournamentType === 'sng_6max')) {
    numPlayers = Math.min(6, config.numPlayers);
  } else if (stage === 'bubble' || stage === 'late') {
    numPlayers = Math.max(Math.floor(config.numPlayers * 0.6), 6);
  } else {
    numPlayers = config.numPlayers;
  }

  // Blinds based on stage
  const blindMultiplier = STAGE_INFO[stage].blindLevelMultiplier;
  const bb = 100 * blindMultiplier;
  const sb = bb / 2;
  const ante = stage === 'early' ? 0 : bb / 10;

  // Calculate average stack
  const totalChips = config.prizePool * config.numPlayers * 100;
  const avgStack = totalChips / numPlayers;

  // Generate stacks
  const stacks = generateRandomStacks(numPlayers, avgStack);
  const heroPosition = Math.floor(Math.random() * numPlayers);
  stacks[heroPosition] = Math.floor(avgStack * (0.5 + Math.random() * 1.0));

  // Create players
  const players: Player[] = stacks.map((chips, i) => ({
    id: i,
    name: i === heroPosition ? 'Hero' : `Player ${i + 1}`,
    chips,
    position: POSITIONS[i % POSITIONS.length],
    isHero: i === heroPosition,
  }));

  // Deal hero hand
  const heroHand: Hand = [deck[0], deck[1]];
  const handString = handToString(heroHand);

  // Calculate pot
  const totalAnte = ante * numPlayers;
  const pot = sb + bb + totalAnte;

  // Determine action options
  const { options, correct } = determineActionOptions({
    heroStack: stacks[heroPosition],
    bb,
    pot,
    stage,
  });

  // Calculate ICM equities
  const payouts = config.payouts.map(p => (p / 100) * config.prizePool);
  const icmEquities = quickICM(stacks, payouts);

  return {
    type: tournamentType,
    stage,
    players,
    heroHand,
    handString,
    heroPosition,
    sb,
    bb,
    ante,
    payouts,
    pot,
    correctAction: correct,
    actionOptions: options,
    icmEquities,
  };
}

function calculateEVLoss(
  scenario: Scenario,
  userAction: Action,
  correctAction: Action
): number {
  if (userAction === correctAction) return 0;

  // Simplified EV loss calculation
  const heroICM = scenario.icmEquities[scenario.heroPosition];
  const stackInBB = scenario.players[scenario.heroPosition].chips / scenario.bb;

  // Estimate loss based on stack size and stage
  let baseLoss = 0.5;
  if (scenario.stage === 'bubble') baseLoss = 1.5;
  if (scenario.stage === 'final_table') baseLoss = 2.0;

  if (stackInBB < 10) baseLoss *= 1.5;

  return baseLoss * (heroICM / 100);
}

export default function TournamentPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { updatePracticeStats } = useUserStore();

  // Settings
  const [tournamentType, setTournamentType] = useState<TournamentType>('sng_6max');
  const [stageFilter, setStageFilter] = useState<TournamentStage | 'all'>('all');

  // Game state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [actionStartTime, setActionStartTime] = useState<number>(0);

  // Stats
  const stats = useMemo(() => {
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgTime = total > 0
      ? results.reduce((sum, r) => sum + r.timeMs, 0) / total
      : 0;
    const totalEVLoss = results.reduce((sum, r) => sum + r.evLoss, 0);
    return { total, correct, accuracy, avgTime, totalEVLoss };
  }, [results]);

  // Generate new scenario
  const newScenario = useCallback(() => {
    const s = generateScenario(tournamentType, stageFilter);
    setScenario(s);
    setShowResult(false);
    setLastResult(null);
    setActionStartTime(Date.now());
  }, [tournamentType, stageFilter]);

  // Initialize
  useEffect(() => {
    newScenario();
  }, []);

  // Handle action
  const handleAction = useCallback((action: Action) => {
    if (!scenario || showResult) return;

    const timeMs = Date.now() - actionStartTime;
    const isCorrect = action === scenario.correctAction;
    const evLoss = calculateEVLoss(scenario, action, scenario.correctAction);

    const result: Result = {
      scenario,
      userAction: action,
      isCorrect,
      timeMs,
      evLoss,
    };

    setLastResult(result);
    setResults(prev => [...prev, result]);
    setShowResult(true);

    updatePracticeStats(isCorrect);
  }, [scenario, showResult, actionStartTime, updatePracticeStats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showResult) {
        if (e.key === ' ') {
          e.preventDefault();
          newScenario();
        }
        return;
      }

      if (!scenario) return;

      const key = e.key.toLowerCase();
      if (key === 'p' && scenario.actionOptions.includes('push')) {
        handleAction('push');
      } else if (key === 'f' && scenario.actionOptions.includes('fold')) {
        handleAction('fold');
      } else if (key === 'c' && scenario.actionOptions.includes('call')) {
        handleAction('call');
      } else if (key === 'r' && scenario.actionOptions.includes('raise')) {
        handleAction('raise');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scenario, showResult, handleAction, newScenario]);

  // Reset session
  const resetSession = useCallback(() => {
    setResults([]);
    newScenario();
  }, [newScenario]);

  if (!scenario) {
    return <div className="tournament-loading">Loading...</div>;
  }

  const config = TOURNAMENT_CONFIGS[scenario.type];
  const stageInfo = STAGE_INFO[scenario.stage];
  const heroPlayer = scenario.players[scenario.heroPosition];

  return (
    <div className="tournament-page">
      <header className="tournament-header">
        <Link href="/practice" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回练习
        </Link>
        <h1>锦标赛 ICM 训练</h1>
        <p className="subtitle">Independent Chip Model 决策训练</p>
      </header>

      <div className={`tournament-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Settings Panel */}
        <div className="settings-panel">
          <h2>训练设置</h2>

          <div className="setting-group">
            <label>锦标赛类型</label>
            <div className="button-group">
              <button
                className={tournamentType === 'sng_6max' ? 'active' : ''}
                onClick={() => setTournamentType('sng_6max')}
              >
                SNG 6-Max
              </button>
              <button
                className={tournamentType === 'sng_9max' ? 'active' : ''}
                onClick={() => setTournamentType('sng_9max')}
              >
                SNG 9-Max
              </button>
              <button
                className={tournamentType === 'mtt_final' ? 'active' : ''}
                onClick={() => setTournamentType('mtt_final')}
              >
                MTT 决赛桌
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label>比赛阶段</label>
            <div className="button-group vertical">
              <button
                className={stageFilter === 'all' ? 'active' : ''}
                onClick={() => setStageFilter('all')}
              >
                全部阶段
              </button>
              {Object.entries(STAGE_INFO).map(([key, info]) => (
                <button
                  key={key}
                  className={stageFilter === key ? 'active' : ''}
                  onClick={() => setStageFilter(key as TournamentStage)}
                >
                  {info.name}
                </button>
              ))}
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
              <div className="stat-item wide">
                <span className="stat-value ev-loss">{stats.totalEVLoss.toFixed(2)}</span>
                <span className="stat-label">累计EV损失 (%)</span>
              </div>
            </div>
            {stats.total > 0 && (
              <button className="reset-btn" onClick={resetSession}>
                重新开始
              </button>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="shortcuts-info">
            <h4>快捷键</h4>
            <div className="shortcuts-list">
              <div className="shortcut"><kbd>P</kbd> Push</div>
              <div className="shortcut"><kbd>F</kbd> Fold</div>
              <div className="shortcut"><kbd>C</kbd> Call</div>
              <div className="shortcut"><kbd>R</kbd> Raise</div>
              <div className="shortcut"><kbd>Space</kbd> 下一题</div>
            </div>
          </div>
        </div>

        {/* Game Panel */}
        <div className="game-panel">
          {/* Tournament Info */}
          <div className="tournament-info">
            <div className="info-row">
              <div className="info-item">
                <span className="info-label">赛事</span>
                <span className="info-value">{config.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">阶段</span>
                <span className="stage-badge" style={{ background: stageInfo.color }}>
                  {stageInfo.name}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">盲注</span>
                <span className="info-value">{scenario.sb}/{scenario.bb}</span>
                {scenario.ante > 0 && <span className="info-value-small">({scenario.ante})</span>}
              </div>
            </div>
          </div>

          {/* Poker Table */}
          <div className="poker-table">
            <div className="table-felt">
              <div className="pot-info">
                <div className="pot-label">底池</div>
                <div className="pot-amount">{scenario.pot}</div>
              </div>

              {/* Players */}
              <div className="players-container">
                {scenario.players.map((player, i) => (
                  <div
                    key={player.id}
                    className={`player-seat seat-${i} ${player.isHero ? 'hero' : ''}`}
                    style={{ '--player-index': i, '--total-players': scenario.players.length } as React.CSSProperties}
                  >
                    <div className="player-card">
                      <div className="player-name">{player.name}</div>
                      <div className="player-chips">{player.chips.toLocaleString()}</div>
                      <div className="player-position">{player.position}</div>
                      {player.isHero && (
                        <div className="player-badge hero-badge">You</div>
                      )}
                      <div className="icm-equity">
                        ICM: {scenario.icmEquities[i].toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Hand */}
          <div className="hero-hand-section">
            <h3>你的手牌</h3>
            <div className="hero-cards">
              <PokerCard card={scenario.heroHand[0]} size={isMobile ? 'md' : 'lg'} />
              <PokerCard card={scenario.heroHand[1]} size={isMobile ? 'md' : 'lg'} />
            </div>
            <div className="hand-string">{scenario.handString}</div>
            <div className="stack-info">
              筹码: {heroPlayer.chips.toLocaleString()} ({(heroPlayer.chips / scenario.bb).toFixed(1)} BB)
            </div>
          </div>

          {/* Action Buttons */}
          {!showResult && (
            <div className="action-section">
              <h3>你的决定</h3>
              <div className="action-buttons">
                {scenario.actionOptions.includes('fold') && (
                  <button
                    className="action-btn fold-btn"
                    onClick={() => handleAction('fold')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Fold <span className="shortcut-hint">(F)</span>
                  </button>
                )}
                {scenario.actionOptions.includes('call') && (
                  <button
                    className="action-btn call-btn"
                    onClick={() => handleAction('call')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Call <span className="shortcut-hint">(C)</span>
                  </button>
                )}
                {scenario.actionOptions.includes('raise') && (
                  <button
                    className="action-btn raise-btn"
                    onClick={() => handleAction('raise')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    Raise <span className="shortcut-hint">(R)</span>
                  </button>
                )}
                {scenario.actionOptions.includes('push') && (
                  <button
                    className="action-btn push-btn"
                    onClick={() => handleAction('push')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    All-In <span className="shortcut-hint">(P)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && lastResult && (
            <div className={`result-section ${lastResult.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="result-header">
                {lastResult.isCorrect ? (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>正确!</span>
                  </>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>错误</span>
                  </>
                )}
              </div>

              <div className="result-details">
                <div className="result-row">
                  <span>你的选择:</span>
                  <span className={`action-label ${lastResult.userAction}`}>
                    {lastResult.userAction.toUpperCase()}
                  </span>
                </div>
                <div className="result-row">
                  <span>正确答案:</span>
                  <span className={`action-label ${scenario.correctAction}`}>
                    {scenario.correctAction.toUpperCase()}
                  </span>
                </div>
                <div className="result-row">
                  <span>用时:</span>
                  <span>{(lastResult.timeMs / 1000).toFixed(2)}秒</span>
                </div>
                {lastResult.evLoss > 0 && (
                  <div className="result-row ev-loss-row">
                    <span>EV损失:</span>
                    <span className="ev-loss-value">{lastResult.evLoss.toFixed(2)}%</span>
                  </div>
                )}
              </div>

              <div className="icm-info">
                <h4>ICM 信息</h4>
                <div className="icm-grid">
                  <div className="icm-item">
                    <span className="icm-label">你的ICM权益</span>
                    <span className="icm-value">
                      {scenario.icmEquities[scenario.heroPosition].toFixed(2)}%
                    </span>
                  </div>
                  <div className="icm-item">
                    <span className="icm-label">筹码占比</span>
                    <span className="icm-value">
                      {((heroPlayer.chips / scenario.players.reduce((s, p) => s + p.chips, 0)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <p className="icm-explanation">
                  {scenario.stage === 'bubble' && 'ICM压力在泡沫阶段最大,应该打得更保守。'}
                  {scenario.stage === 'final_table' && '决赛桌阶段需要平衡ICM压力和进攻性。'}
                  {scenario.stage === 'early' && '早期阶段ICM压力较小,可以打得更加进攻。'}
                </p>
              </div>

              <button className="next-btn" onClick={newScenario}>
                下一题
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
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
        <Link href="/practice/pushfold" className="quick-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          Push/Fold 训练
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
