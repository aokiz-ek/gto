'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { useResponsive } from '@/hooks';
import { useUserStore } from '@/store';
import {
  createDeck,
  shuffleDeck,
  handToDisplayString,
  GTO_RANGES,
} from '@gto/core';
import type { Hand, Position, Card } from '@gto/core';
import './multitable.css';

type TableCount = 1 | 2 | 4;
type PreflopScenario = 'rfi' | 'vs_rfi' | 'vs_3bet';

interface TableScenario {
  id: number;
  heroHand: Hand;
  handString: string;
  heroPosition: Position;
  villainPosition?: Position;
  scenario: PreflopScenario;
  correctAction: string;
  gtoStrategy: Record<string, number>;
  status: 'waiting' | 'answered' | 'timeout';
  userAction?: string;
  isCorrect?: boolean;
  timeRemaining: number;
}

interface TableResult {
  tableId: number;
  isCorrect: boolean;
  timeMs: number;
}

const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const RFI_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const BB_POSITIONS: Position[] = ['BB'];

const TIME_LIMIT = 15; // seconds per hand

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

function getGTOStrategy(position: Position, handString: string): { action: string; strategy: Record<string, number> } {
  const positionData = GTO_RANGES[position];
  if (!positionData) {
    return { action: 'fold', strategy: { fold: 100 } };
  }

  const handData = positionData[handString];
  if (!handData || !handData.actions || handData.actions.length === 0) {
    return { action: 'fold', strategy: { fold: 100 } };
  }

  // Find the highest frequency action
  let bestAction = 'fold';
  let highestFreq = 0;
  const strategy: Record<string, number> = {};

  for (const action of handData.actions) {
    const actionName = action.action;
    const freq = action.frequency;
    strategy[actionName] = freq;

    if (freq > highestFreq) {
      highestFreq = freq;
      bestAction = actionName;
    }
  }

  return { action: bestAction, strategy };
}

function generateTableScenario(tableId: number): TableScenario {
  const deck = shuffleDeck(createDeck());
  const heroHand: Hand = [deck[0], deck[1]];
  const handString = handToString(heroHand);

  // Random RFI position
  const heroPosition = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
  const { action, strategy } = getGTOStrategy(heroPosition, handString);

  return {
    id: tableId,
    heroHand,
    handString,
    heroPosition,
    scenario: 'rfi',
    correctAction: action,
    gtoStrategy: strategy,
    status: 'waiting',
    timeRemaining: TIME_LIMIT,
  };
}

export default function MultiTablePage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { updatePracticeStats } = useUserStore();

  // Settings
  const [tableCount, setTableCount] = useState<TableCount>(2);
  const [isRunning, setIsRunning] = useState(false);

  // Game state
  const [tables, setTables] = useState<TableScenario[]>([]);
  const [focusedTable, setFocusedTable] = useState<number>(0);
  const [results, setResults] = useState<TableResult[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Stats
  const stats = useMemo(() => {
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgTime = total > 0
      ? results.reduce((sum, r) => sum + r.timeMs, 0) / total
      : 0;
    return { total, correct, accuracy, avgTime };
  }, [results]);

  // Initialize tables
  const initializeTables = useCallback(() => {
    const newTables = Array.from({ length: tableCount }, (_, i) => generateTableScenario(i));
    setTables(newTables);
    setFocusedTable(0);
    startTimeRef.current = Date.now();
    setRoundNumber(prev => prev + 1);
  }, [tableCount]);

  // Start game
  const startGame = useCallback(() => {
    setResults([]);
    setRoundNumber(0);
    setIsRunning(true);
    initializeTables();
  }, [initializeTables]);

  // Stop game
  const stopGame = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle action
  const handleAction = useCallback((tableId: number, action: string) => {
    if (!isRunning) return;

    setTables(prev => {
      const updated = [...prev];
      const table = updated[tableId];
      if (table.status !== 'waiting') return prev;

      const timeMs = Date.now() - startTimeRef.current;
      const isCorrect = action === table.correctAction ||
        (table.gtoStrategy[action] && table.gtoStrategy[action] >= 30); // Accept if frequency >= 30%

      table.status = 'answered';
      table.userAction = action;
      table.isCorrect = isCorrect;

      // Add result
      setResults(r => [...r, { tableId, isCorrect, timeMs }]);
      updatePracticeStats(isCorrect);

      return updated;
    });

    // Move focus to next waiting table
    setTables(prev => {
      const nextWaiting = prev.findIndex((t, i) => i !== tableId && t.status === 'waiting');
      if (nextWaiting !== -1) {
        setFocusedTable(nextWaiting);
      }
      return prev;
    });
  }, [isRunning, updatePracticeStats]);

  // Check if all tables are answered
  useEffect(() => {
    if (!isRunning) return;

    const allAnswered = tables.length > 0 && tables.every(t => t.status !== 'waiting');
    if (allAnswered) {
      // Wait a moment then generate new scenarios
      const timeout = setTimeout(() => {
        initializeTables();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [tables, isRunning, initializeTables]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTables(prev => {
        const updated = prev.map(table => {
          if (table.status !== 'waiting') return table;

          const newTime = table.timeRemaining - 1;
          if (newTime <= 0) {
            // Timeout - mark as incorrect
            setResults(r => [...r, { tableId: table.id, isCorrect: false, timeMs: TIME_LIMIT * 1000 }]);
            updatePracticeStats(false);
            return { ...table, status: 'timeout' as const, timeRemaining: 0 };
          }
          return { ...table, timeRemaining: newTime };
        });
        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, updatePracticeStats]);

  // Keyboard navigation
  useEffect(() => {
    if (!isRunning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const table = tables[focusedTable];
      if (!table || table.status !== 'waiting') return;

      switch (e.key.toLowerCase()) {
        case 'f':
          handleAction(focusedTable, 'fold');
          break;
        case 'c':
          handleAction(focusedTable, 'call');
          break;
        case 'r':
          handleAction(focusedTable, 'raise');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          const idx = parseInt(e.key) - 1;
          if (idx < tables.length && tables[idx].status === 'waiting') {
            setFocusedTable(idx);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, tables, focusedTable, handleAction]);

  return (
    <div className="multitable-page">
      <header className="multitable-header">
        <Link href="/practice" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </Link>
        <div className="header-content">
          <h1>多桌训练</h1>
          <p className="subtitle">模拟真实多桌环境，提升决策速度</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">总手数</span>
          </div>
          <div className="stat">
            <span className={`stat-value ${stats.accuracy >= 70 ? 'good' : stats.accuracy >= 50 ? 'ok' : ''}`}>
              {stats.accuracy.toFixed(0)}%
            </span>
            <span className="stat-label">正确率</span>
          </div>
          <div className="stat">
            <span className="stat-value">{(stats.avgTime / 1000).toFixed(1)}s</span>
            <span className="stat-label">平均时间</span>
          </div>
        </div>
      </header>

      {!isRunning ? (
        <div className="start-panel">
          <h2>选择桌数</h2>
          <div className="table-count-selector">
            {([1, 2, 4] as TableCount[]).map(count => (
              <button
                key={count}
                className={`count-btn ${tableCount === count ? 'active' : ''}`}
                onClick={() => setTableCount(count)}
              >
                <span className="count-number">{count}</span>
                <span className="count-label">{count === 1 ? '单桌' : `${count}桌`}</span>
              </button>
            ))}
          </div>

          <div className="instructions">
            <h3>操作说明</h3>
            <ul>
              <li><kbd>F</kbd> - Fold</li>
              <li><kbd>C</kbd> - Call</li>
              <li><kbd>R</kbd> - Raise</li>
              <li><kbd>1-4</kbd> - 切换桌子</li>
            </ul>
            <p>每手牌有 {TIME_LIMIT} 秒的决策时间</p>
          </div>

          <button className="start-btn" onClick={startGame}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            开始训练
          </button>
        </div>
      ) : (
        <div className="game-area">
          <div className="controls-bar">
            <span className="round-info">第 {roundNumber} 轮</span>
            <button className="stop-btn" onClick={stopGame}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
              停止
            </button>
          </div>

          <div className={`tables-grid tables-${tableCount}`}>
            {tables.map((table, idx) => (
              <div
                key={`${roundNumber}-${table.id}`}
                className={`table-card ${table.status} ${focusedTable === idx ? 'focused' : ''}`}
                onClick={() => table.status === 'waiting' && setFocusedTable(idx)}
              >
                <div className="table-header">
                  <span className="table-number">桌 {idx + 1}</span>
                  <span className="table-position">{table.heroPosition}</span>
                  {table.status === 'waiting' && (
                    <span className={`table-timer ${table.timeRemaining <= 5 ? 'urgent' : ''}`}>
                      {table.timeRemaining}s
                    </span>
                  )}
                </div>

                <div className="table-cards">
                  <PokerCard card={table.heroHand[0]} size="sm" />
                  <PokerCard card={table.heroHand[1]} size="sm" />
                </div>

                <div className="table-hand">{table.handString}</div>

                {table.status === 'waiting' && (
                  <div className="table-actions">
                    <button
                      className="action-btn fold"
                      onClick={(e) => { e.stopPropagation(); handleAction(idx, 'fold'); }}
                    >
                      Fold
                    </button>
                    <button
                      className="action-btn raise"
                      onClick={(e) => { e.stopPropagation(); handleAction(idx, 'raise'); }}
                    >
                      Raise
                    </button>
                  </div>
                )}

                {table.status !== 'waiting' && (
                  <div className={`table-result ${table.isCorrect ? 'correct' : 'incorrect'}`}>
                    {table.status === 'timeout' ? (
                      <span className="timeout-text">超时</span>
                    ) : table.isCorrect ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                    <div className="result-info">
                      <span>你选: {table.userAction || 'N/A'}</span>
                      <span>正确: {table.correctAction}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="keyboard-hint">
            <span><kbd>F</kbd> Fold</span>
            <span><kbd>R</kbd> Raise</span>
            <span><kbd>1-{tableCount}</kbd> 切换桌</span>
          </div>
        </div>
      )}
    </div>
  );
}
