'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { RangeMatrix } from '@gto/ui';
import { useResponsive } from '@/hooks/useResponsive';
import {
  ALL_HANDS,
  GTO_RANGES_100BB,
  GTO_VS_RFI_RANGES,
  GTO_VS_3BET_RANGES,
  RANKS,
  POSITIONS,
} from '@gto/core';
import type { Position, GTOHandStrategy, RangeMatrix as RangeMatrixType } from '@gto/core';
import './range-builder.css';

// Types
type ScenarioType = 'rfi' | 'vs_rfi' | 'vs_3bet';

interface Scenario {
  position: Position;
  type: ScenarioType;
  description: string;
  gtoRange: Record<string, GTOHandStrategy>;
}

interface ComparisonResult {
  correct: string[];
  missed: string[];
  extra: string[];
  accuracy: number;
  score: number;
}

// Available positions for each scenario type
const RFI_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const VS_RFI_POSITIONS: Position[] = ['BB', 'BTN', 'CO', 'HJ'];
const VS_3BET_POSITIONS: Position[] = ['BTN', 'CO', 'HJ', 'UTG'];

// Position names in Chinese
const POSITION_NAMES: Record<Position, string> = {
  UTG: 'UTG (枪口)',
  HJ: 'HJ (中间)',
  CO: 'CO (关煞)',
  BTN: 'BTN (按钮)',
  SB: 'SB (小盲)',
  BB: 'BB (大盲)',
  UTG1: 'UTG+1',
  UTG2: 'UTG+2',
  LJ: 'LJ (早位)',
};

// Scenario descriptions
const getScenarioDescription = (position: Position, type: ScenarioType, vsPosition?: Position): string => {
  if (type === 'rfi') {
    return `${POSITION_NAMES[position]} RFI - 构建 ${POSITION_NAMES[position]} 位置的开池加注范围`;
  } else if (type === 'vs_rfi') {
    const raiserPos = vsPosition || 'CO';
    return `${POSITION_NAMES[position]} vs ${POSITION_NAMES[raiserPos]} RFI - 面对 ${POSITION_NAMES[raiserPos]} 开池加注的范围`;
  } else {
    const threeBetPos = vsPosition || 'BB';
    return `${POSITION_NAMES[position]} vs ${POSITION_NAMES[threeBetPos]} 3-Bet - 面对 ${POSITION_NAMES[threeBetPos]} 三次加注的范围`;
  }
};

// Get GTO range for a scenario
const getGTORange = (position: Position, type: ScenarioType, vsPosition?: Position): Record<string, GTOHandStrategy> => {
  if (type === 'rfi') {
    const key = `${position}_rfi`;
    return GTO_RANGES_100BB[key]?.ranges as Record<string, GTOHandStrategy> || {};
  } else if (type === 'vs_rfi') {
    // Use BB vs positions or positional defense
    const raiserPos = vsPosition || 'CO';
    const key = `${position}_vs_${raiserPos}_rfi`;
    return GTO_VS_RFI_RANGES[key]?.ranges as Record<string, GTOHandStrategy> || {};
  } else {
    // vs 3-bet
    const threeBetPos = vsPosition || 'BB';
    const key = `${position}_vs_${threeBetPos}_3bet`;
    return GTO_VS_3BET_RANGES[key]?.ranges as Record<string, GTOHandStrategy> || {};
  }
};

// Check if hand should be in range (has any non-fold action with freq > 0)
const isHandInRange = (handStrategy: GTOHandStrategy | undefined): boolean => {
  if (!handStrategy || !handStrategy.actions) return false;

  return handStrategy.actions.some(
    action => action.action !== 'fold' && action.frequency > 0
  );
};

// Convert hand string to matrix indices
const handToIndices = (hand: string): { row: number; col: number } | null => {
  if (!hand || hand.length < 2) return null;

  const rank1 = hand[0];
  const rank2 = hand[1];
  const suited = hand.endsWith('s');

  const rank1Index = RANKS.indexOf(rank1 as any);
  const rank2Index = RANKS.indexOf(rank2 as any);

  if (rank1Index === -1 || rank2Index === -1) return null;

  // Pairs are on diagonal
  if (rank1 === rank2) {
    return { row: rank1Index, col: rank1Index };
  }

  // Suited hands are upper triangle (row < col)
  // Offsuit hands are lower triangle (row > col)
  if (suited) {
    return { row: Math.min(rank1Index, rank2Index), col: Math.max(rank1Index, rank2Index) };
  } else {
    return { row: Math.max(rank1Index, rank2Index), col: Math.min(rank1Index, rank2Index) };
  }
};

// Convert matrix indices to hand string
const indicesToHand = (row: number, col: number): string => {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];

  if (row === col) return `${rank1}${rank2}`;
  if (row < col) return `${rank1}${rank2}s`;
  return `${rank2}${rank1}o`;
};

export default function RangeBuilderPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();

  // Scenario state
  const [scenarioType, setScenarioType] = useState<ScenarioType>('rfi');
  const [position, setPosition] = useState<Position>('BTN');
  const [vsPosition, setVsPosition] = useState<Position | undefined>();

  // User selection state
  const [userMatrix, setUserMatrix] = useState<RangeMatrixType>({ matrix: Array(13).fill(0).map(() => Array(13).fill(0)) });
  const [selectedHands, setSelectedHands] = useState<Set<string>>(new Set());

  // UI state
  const [showResults, setShowResults] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Stats
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // Get current scenario
  const currentScenario = useMemo<Scenario>(() => {
    return {
      position,
      type: scenarioType,
      description: getScenarioDescription(position, scenarioType, vsPosition),
      gtoRange: getGTORange(position, scenarioType, vsPosition),
    };
  }, [position, scenarioType, vsPosition]);

  // Calculate range size
  const rangeSize = useMemo(() => {
    const totalCombos = Array.from(selectedHands).reduce((sum, hand) => {
      if (hand.length === 2) return sum + 6; // Pairs
      if (hand.endsWith('s')) return sum + 4; // Suited
      return sum + 12; // Offsuit
    }, 0);

    const percentage = ((totalCombos / 1326) * 100).toFixed(1);
    return { combos: totalCombos, percentage };
  }, [selectedHands]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (showResults) return; // Disable editing after check

    const hand = indicesToHand(row, col);
    const newSelectedHands = new Set(selectedHands);

    if (selectedHands.has(hand)) {
      newSelectedHands.delete(hand);
    } else {
      newSelectedHands.add(hand);
    }

    setSelectedHands(newSelectedHands);

    // Update matrix
    const newMatrix = { ...userMatrix };
    newMatrix.matrix[row][col] = newSelectedHands.has(hand) ? 1 : 0;
    setUserMatrix(newMatrix);
  }, [selectedHands, userMatrix, showResults]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string, indices: {row: number, col: number}[]) => {
    if (showResults) return;

    const newSelectedHands = new Set(selectedHands);
    const newMatrix = { ...userMatrix };

    indices.forEach(({ row, col }) => {
      const hand = indicesToHand(row, col);
      newSelectedHands.add(hand);
      newMatrix.matrix[row][col] = 1;
    });

    setSelectedHands(newSelectedHands);
    setUserMatrix(newMatrix);
  }, [selectedHands, userMatrix, showResults]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedHands(new Set());
    setUserMatrix({ matrix: Array(13).fill(0).map(() => Array(13).fill(0)) });
    setShowResults(false);
    setComparisonResult(null);
    setShowAnswer(false);
  }, []);

  // Check answer
  const handleCheck = useCallback(() => {
    const gtoRange = currentScenario.gtoRange;
    const correct: string[] = [];
    const missed: string[] = [];
    const extra: string[] = [];

    let points = 0;
    let maxPoints = 0;

    ALL_HANDS.forEach(hand => {
      const shouldBeInRange = isHandInRange(gtoRange[hand]);
      const isSelected = selectedHands.has(hand);

      if (shouldBeInRange) {
        maxPoints += 1;
        if (isSelected) {
          correct.push(hand);
          points += 1;
        } else {
          missed.push(hand);
        }
      } else {
        maxPoints += 0.5;
        if (isSelected) {
          extra.push(hand);
          points -= 1;
        } else {
          points += 0.5;
        }
      }
    });

    const accuracy = (correct.length / (correct.length + missed.length + extra.length)) * 100;
    const score = Math.max(0, Math.round((points / maxPoints) * 100));

    setComparisonResult({ correct, missed, extra, accuracy, score });
    setShowResults(true);
    setRoundsCompleted(prev => prev + 1);
    setTotalScore(prev => prev + score);
    setBestScore(prev => Math.max(prev, score));
  }, [currentScenario, selectedHands]);

  // Show GTO answer
  const handleShowAnswer = useCallback(() => {
    const gtoRange = currentScenario.gtoRange;
    const newSelectedHands = new Set<string>();
    const newMatrix = { matrix: Array(13).fill(0).map(() => Array(13).fill(0)) };

    ALL_HANDS.forEach(hand => {
      if (isHandInRange(gtoRange[hand])) {
        newSelectedHands.add(hand);
        const indices = handToIndices(hand);
        if (indices) {
          newMatrix.matrix[indices.row][indices.col] = 1;
        }
      }
    });

    setSelectedHands(newSelectedHands);
    setUserMatrix(newMatrix);
    setShowAnswer(true);
  }, [currentScenario]);

  // New scenario
  const handleNewScenario = useCallback(() => {
    handleClear();

    // Randomly select new scenario
    const types: ScenarioType[] = ['rfi', 'vs_rfi', 'vs_3bet'];
    const newType = types[Math.floor(Math.random() * types.length)];

    let newPosition: Position;
    let newVsPosition: Position | undefined;

    if (newType === 'rfi') {
      newPosition = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
    } else if (newType === 'vs_rfi') {
      newPosition = VS_RFI_POSITIONS[Math.floor(Math.random() * VS_RFI_POSITIONS.length)];
      newVsPosition = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
    } else {
      newPosition = VS_3BET_POSITIONS[Math.floor(Math.random() * VS_3BET_POSITIONS.length)];
      newVsPosition = ['BB', 'BTN', 'SB'][Math.floor(Math.random() * 3)] as Position;
    }

    setScenarioType(newType);
    setPosition(newPosition);
    setVsPosition(newVsPosition);
  }, [handleClear]);

  // Get comparison matrix for visualization
  const comparisonMatrix = useMemo<RangeMatrixType | null>(() => {
    if (!showResults || !comparisonResult) return null;

    const matrix = Array(13).fill(0).map(() => Array(13).fill(0));

    comparisonResult.correct.forEach(hand => {
      const indices = handToIndices(hand);
      if (indices) matrix[indices.row][indices.col] = 1; // Green
    });

    comparisonResult.missed.forEach(hand => {
      const indices = handToIndices(hand);
      if (indices) matrix[indices.row][indices.col] = 0.33; // Red
    });

    comparisonResult.extra.forEach(hand => {
      const indices = handToIndices(hand);
      if (indices) matrix[indices.row][indices.col] = 0.66; // Yellow
    });

    return { matrix };
  }, [showResults, comparisonResult]);

  const averageScore = roundsCompleted > 0 ? Math.round(totalScore / roundsCompleted) : 0;

  return (
    <div className="range-builder-page">
      {/* Header */}
      <header className="range-builder-header">
        <div className="header-left">
          <Link href="/practice" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回
          </Link>
          <h1 className="page-title">范围构建训练</h1>
        </div>

        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">轮数</span>
            <span className="stat-value">{roundsCompleted}</span>
          </div>
          <div className="stat">
            <span className="stat-label">平均</span>
            <span className="stat-value">{averageScore}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">最佳</span>
            <span className="stat-value">{bestScore}%</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="range-builder-content" style={{ flexDirection: isMobileOrTablet ? 'column' : 'row' }}>
        {/* Left panel - Matrix */}
        <div className="matrix-panel" style={{ width: isMobileOrTablet ? '100%' : '60%' }}>
          <div className="scenario-info">
            <h2 className="scenario-title">{currentScenario.description}</h2>
            <div className="range-info">
              <span className="range-combos">{rangeSize.combos} 组合</span>
              <span className="range-percentage">{rangeSize.percentage}% 范围</span>
            </div>
          </div>

          <div className="matrix-container">
            <RangeMatrix
              matrix={showResults && comparisonMatrix ? comparisonMatrix : userMatrix}
              onCellClick={handleCellClick}
              size={isMobile ? 'xs' : 'sm'}
              colorScheme={showResults ? 'heatmap' : 'default'}
              interactive={!showResults}
              showCategoryPanel={!showResults && !isMobile}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          {showResults && comparisonResult && (
            <div className="results-summary">
              <div className="score-display">
                <div className="score-circle" style={{ background: comparisonResult.score >= 80 ? 'var(--success)' : comparisonResult.score >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                  <span className="score-number">{comparisonResult.score}</span>
                  <span className="score-label">分</span>
                </div>
              </div>

              <div className="results-breakdown">
                <div className="result-item correct">
                  <span className="result-label">正确</span>
                  <span className="result-count">{comparisonResult.correct.length}</span>
                </div>
                <div className="result-item missed">
                  <span className="result-label">遗漏</span>
                  <span className="result-count">{comparisonResult.missed.length}</span>
                </div>
                <div className="result-item extra">
                  <span className="result-label">多余</span>
                  <span className="result-count">{comparisonResult.extra.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Controls and details */}
        <div className="controls-panel" style={{ width: isMobileOrTablet ? '100%' : '40%' }}>
          {/* Scenario selector */}
          {!showResults && (
            <div className="scenario-selector">
              <h3 className="panel-title">场景选择</h3>

              <div className="selector-group">
                <label className="selector-label">场景类型</label>
                <div className="button-group">
                  <button
                    className={`type-button ${scenarioType === 'rfi' ? 'active' : ''}`}
                    onClick={() => setScenarioType('rfi')}
                  >
                    RFI
                  </button>
                  <button
                    className={`type-button ${scenarioType === 'vs_rfi' ? 'active' : ''}`}
                    onClick={() => setScenarioType('vs_rfi')}
                  >
                    vs RFI
                  </button>
                  <button
                    className={`type-button ${scenarioType === 'vs_3bet' ? 'active' : ''}`}
                    onClick={() => setScenarioType('vs_3bet')}
                  >
                    vs 3-Bet
                  </button>
                </div>
              </div>

              <div className="selector-group">
                <label className="selector-label">位置</label>
                <select
                  className="position-select"
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                >
                  {(scenarioType === 'rfi' ? RFI_POSITIONS : scenarioType === 'vs_rfi' ? VS_RFI_POSITIONS : VS_3BET_POSITIONS).map(pos => (
                    <option key={pos} value={pos}>{POSITION_NAMES[pos]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="action-buttons">
            {!showResults ? (
              <>
                <button className="action-button primary" onClick={handleCheck} disabled={selectedHands.size === 0}>
                  检查答案
                </button>
                <button className="action-button secondary" onClick={handleClear}>
                  清空
                </button>
                <button className="action-button outline" onClick={handleShowAnswer}>
                  显示答案
                </button>
              </>
            ) : (
              <>
                <button className="action-button primary" onClick={handleNewScenario}>
                  下一场景
                </button>
                <button className="action-button secondary" onClick={handleClear}>
                  重试
                </button>
              </>
            )}
          </div>

          {/* Hand lists */}
          {showResults && comparisonResult && (
            <div className="hand-lists">
              {comparisonResult.missed.length > 0 && (
                <div className="hand-list missed-list">
                  <h4 className="list-title">遗漏的手牌 ({comparisonResult.missed.length})</h4>
                  <div className="hand-chips">
                    {comparisonResult.missed.slice(0, 20).map(hand => (
                      <span key={hand} className="hand-chip missed">{hand}</span>
                    ))}
                    {comparisonResult.missed.length > 20 && (
                      <span className="hand-chip more">+{comparisonResult.missed.length - 20}</span>
                    )}
                  </div>
                </div>
              )}

              {comparisonResult.extra.length > 0 && (
                <div className="hand-list extra-list">
                  <h4 className="list-title">多余的手牌 ({comparisonResult.extra.length})</h4>
                  <div className="hand-chips">
                    {comparisonResult.extra.slice(0, 20).map(hand => (
                      <span key={hand} className="hand-chip extra">{hand}</span>
                    ))}
                    {comparisonResult.extra.length > 20 && (
                      <span className="hand-chip more">+{comparisonResult.extra.length - 20}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          {showResults && (
            <div className="legend">
              <h4 className="legend-title">图例</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color correct"></div>
                  <span>正确</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color missed"></div>
                  <span>遗漏</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color extra"></div>
                  <span>多余</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
