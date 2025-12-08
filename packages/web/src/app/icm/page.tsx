'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import {
  calculateICM,
  COMMON_PAYOUTS,
  type ICMPlayer,
  type ICMResult,
} from '@gto/core';
import './icm.css';

type PayoutPreset = keyof typeof COMMON_PAYOUTS | 'custom';

interface PlayerInput {
  id: string;
  name: string;
  chips: string;
}

const PAYOUT_PRESETS: { key: PayoutPreset; label: string; places: number[] }[] = [
  { key: 'SNG_3_HANDED', label: '3人桌 SNG (100%)', places: [100] },
  { key: 'SNG_6_MAX', label: '6人桌 SNG (65/35)', places: [65, 35] },
  { key: 'SNG_9_MAX', label: '9人桌 SNG (50/30/20)', places: [50, 30, 20] },
  { key: 'SNG_18_MAX', label: '18人桌 SNG', places: [40, 30, 20, 10] },
  { key: 'MTT_FINAL_TABLE_9', label: 'MTT 决赛桌 (9人)', places: [30, 20, 14, 10.5, 8, 6.5, 5, 3.5, 2.5] },
  { key: 'MTT_FINAL_TABLE_6', label: 'MTT 决赛桌 (6人)', places: [35, 25, 18, 12, 7, 3] },
  { key: 'HEADS_UP', label: '单挑 (100%)', places: [100] },
  { key: 'SPIN_3_HANDED', label: 'Spin & Go (80/20)', places: [80, 20] },
  { key: 'custom', label: '自定义', places: [] },
];

export default function ICMCalculatorPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();

  // Players state
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: '1', name: '玩家 1', chips: '5000' },
    { id: '2', name: '玩家 2', chips: '3000' },
    { id: '3', name: '玩家 3', chips: '2000' },
  ]);

  // Payout state
  const [payoutPreset, setPayoutPreset] = useState<PayoutPreset>('SNG_9_MAX');
  const [customPayouts, setCustomPayouts] = useState<string>('50, 30, 20');
  const [prizePool, setPrizePool] = useState<string>('1000');

  // Results
  const [results, setResults] = useState<ICMResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current payouts
  const currentPayouts = useMemo(() => {
    if (payoutPreset === 'custom') {
      return customPayouts.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    }
    const preset = PAYOUT_PRESETS.find(p => p.key === payoutPreset);
    return preset?.places || [];
  }, [payoutPreset, customPayouts]);

  // Add player
  const addPlayer = useCallback(() => {
    const newId = String(players.length + 1);
    setPlayers([...players, { id: newId, name: `玩家 ${newId}`, chips: '1000' }]);
  }, [players]);

  // Remove player
  const removePlayer = useCallback((id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  }, [players]);

  // Update player
  const updatePlayer = useCallback((id: string, field: 'name' | 'chips', value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, [players]);

  // Calculate ICM
  const calculate = useCallback(() => {
    setError(null);

    try {
      // Validate inputs
      const icmPlayers: ICMPlayer[] = players.map((p, i) => {
        const chips = parseInt(p.chips, 10);
        if (isNaN(chips) || chips < 0) {
          throw new Error(`玩家 ${i + 1} 的筹码无效`);
        }
        return { id: p.id, name: p.name, chips };
      });

      const pool = parseFloat(prizePool);
      if (isNaN(pool) || pool <= 0) {
        throw new Error('奖池金额无效');
      }

      if (currentPayouts.length === 0) {
        throw new Error('请设置奖金分配');
      }

      // Check if payouts sum to 100%
      const payoutSum = currentPayouts.reduce((sum, p) => sum + p, 0);
      if (Math.abs(payoutSum - 100) > 0.1) {
        throw new Error(`奖金分配总和应为 100%，当前为 ${payoutSum.toFixed(1)}%`);
      }

      // Calculate
      const result = calculateICM(icmPlayers, {
        places: currentPayouts,
        isPercentage: true,
        totalPrizePool: pool,
      });

      setResults(result.players);
    } catch (e) {
      setError(e instanceof Error ? e.message : '计算失败');
      setResults(null);
    }
  }, [players, prizePool, currentPayouts]);

  // Total chips for percentage display
  const totalChips = useMemo(() => {
    return players.reduce((sum, p) => {
      const chips = parseInt(p.chips, 10);
      return sum + (isNaN(chips) ? 0 : chips);
    }, 0);
  }, [players]);

  return (
    <div className="icm-page">
      <header className="icm-header">
        <Link href="/" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </Link>
        <h1>ICM 计算器</h1>
        <p className="subtitle">Independent Chip Model - 锦标赛筹码价值计算</p>
      </header>

      <div className={`icm-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Left Panel - Inputs */}
        <div className="icm-panel input-panel">
          <section className="panel-section">
            <h2>
              <span className="section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </span>
              玩家筹码
            </h2>

            <div className="players-list">
              {players.map((player, index) => {
                const chips = parseInt(player.chips, 10);
                const percentage = totalChips > 0 && !isNaN(chips) ? (chips / totalChips) * 100 : 0;

                return (
                  <div key={player.id} className="player-row">
                    <span className="player-number">{index + 1}</span>
                    <input
                      type="text"
                      className="player-name"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      placeholder="玩家名"
                    />
                    <input
                      type="number"
                      className="player-chips"
                      value={player.chips}
                      onChange={(e) => updatePlayer(player.id, 'chips', e.target.value)}
                      placeholder="筹码"
                      min="0"
                    />
                    <span className="player-percentage">
                      {percentage.toFixed(1)}%
                    </span>
                    {players.length > 2 && (
                      <button
                        className="remove-player"
                        onClick={() => removePlayer(player.id)}
                        aria-label="移除玩家"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="add-player-btn" onClick={addPlayer}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              添加玩家
            </button>

            <div className="total-chips">
              总筹码: <strong>{totalChips.toLocaleString()}</strong>
            </div>
          </section>

          <section className="panel-section">
            <h2>
              <span className="section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </span>
              奖金结构
            </h2>

            <div className="prize-pool-input">
              <label>总奖池</label>
              <div className="input-with-unit">
                <span className="unit">$</span>
                <input
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="1000"
                  min="0"
                />
              </div>
            </div>

            <div className="payout-preset">
              <label>奖金分配</label>
              <select
                value={payoutPreset}
                onChange={(e) => setPayoutPreset(e.target.value as PayoutPreset)}
              >
                {PAYOUT_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {payoutPreset === 'custom' && (
              <div className="custom-payouts">
                <label>自定义比例 (逗号分隔)</label>
                <input
                  type="text"
                  value={customPayouts}
                  onChange={(e) => setCustomPayouts(e.target.value)}
                  placeholder="50, 30, 20"
                />
              </div>
            )}

            <div className="payout-preview">
              <span className="preview-label">当前分配:</span>
              <div className="payout-places">
                {currentPayouts.map((payout, i) => (
                  <span key={i} className="payout-place">
                    <span className="place-rank">{i + 1}st</span>
                    <span className="place-value">{payout}%</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <button className="calculate-btn" onClick={calculate}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
            </svg>
            计算 ICM
          </button>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="icm-panel results-panel">
          <h2>
            <span className="section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            计算结果
          </h2>

          {results ? (
            <div className="results-content">
              <div className="results-table">
                <div className="table-header">
                  <span>排名</span>
                  <span>玩家</span>
                  <span>筹码</span>
                  <span>筹码%</span>
                  <span>ICM $EV</span>
                  <span>ICM %</span>
                </div>

                {results
                  .sort((a, b) => b.chips - a.chips)
                  .map((result, index) => {
                    const player = players.find(p => p.id === result.playerId);
                    const chipEV = (result.chipPercentage / 100) * parseFloat(prizePool);
                    const icmDiff = result.icmEquity - chipEV;

                    return (
                      <div key={result.playerId} className="result-row">
                        <span className="rank">
                          <span className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </span>
                        </span>
                        <span className="player-name">{player?.name}</span>
                        <span className="chips">{result.chips.toLocaleString()}</span>
                        <span className="chip-pct">{result.chipPercentage.toFixed(1)}%</span>
                        <span className="icm-ev">${result.icmEquity.toFixed(2)}</span>
                        <span className="icm-pct">
                          {result.icmPercentage.toFixed(1)}%
                          <span className={`icm-diff ${icmDiff >= 0 ? 'positive' : 'negative'}`}>
                            ({icmDiff >= 0 ? '+' : ''}{icmDiff.toFixed(2)})
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="results-explanation">
                <h3>ICM 解读</h3>
                <p>
                  <strong>ICM $EV</strong> 表示玩家当前筹码在锦标赛中的实际美元价值。
                </p>
                <p>
                  <strong>ICM %</strong> 与 <strong>筹码 %</strong> 的差异显示了 ICM 效应：
                </p>
                <ul>
                  <li><span className="positive">绿色 (+)</span>: ICM 价值高于筹码比例，说明筹码领先者的每个筹码价值更低</li>
                  <li><span className="negative">红色 (-)</span>: ICM 价值低于筹码比例，说明筹码落后者应该更谨慎</li>
                </ul>
              </div>

              {results.length > 0 && results[0].finishProbabilities && (
                <div className="finish-probabilities">
                  <h3>完赛概率</h3>
                  <div className="prob-table">
                    <div className="prob-header">
                      <span>玩家</span>
                      {results[0].finishProbabilities.map((_, i) => (
                        <span key={i}>{i + 1}st</span>
                      ))}
                    </div>
                    {results
                      .sort((a, b) => b.chips - a.chips)
                      .map((result) => {
                        const player = players.find(p => p.id === result.playerId);
                        return (
                          <div key={result.playerId} className="prob-row">
                            <span>{player?.name}</span>
                            {result.finishProbabilities.map((prob, i) => (
                              <span key={i} className="prob-cell">
                                {(prob * 100).toFixed(1)}%
                              </span>
                            ))}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-results">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <p>输入玩家筹码和奖金结构后点击计算</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
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
