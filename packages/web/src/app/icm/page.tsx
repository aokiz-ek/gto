"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useResponsive } from "@/hooks";
import { useTranslation } from "@/i18n";
import {
  calculateICM,
  COMMON_PAYOUTS,
  type ICMPlayer,
  type ICMResult,
} from "@gto/core";
import "./icm.css";

type PayoutPreset = keyof typeof COMMON_PAYOUTS | "custom";

interface PlayerInput {
  id: string;
  name: string;
  chips: string;
}

// Move PAYOUT_PRESETS inside component to access t function

export default function ICMCalculatorPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { t } = useTranslation();

  // Define presets with translations
  const PAYOUT_PRESETS: {
    key: PayoutPreset;
    label: string;
    places: number[];
  }[] = [
    { key: "SNG_3_HANDED", label: t.icm.presets.sng3, places: [100] },
    { key: "SNG_6_MAX", label: t.icm.presets.sng6, places: [65, 35] },
    { key: "SNG_9_MAX", label: t.icm.presets.sng9, places: [50, 30, 20] },
    { key: "SNG_18_MAX", label: t.icm.presets.sng18, places: [40, 30, 20, 10] },
    {
      key: "MTT_FINAL_TABLE_9",
      label: t.icm.presets.mtt9,
      places: [30, 20, 14, 10.5, 8, 6.5, 5, 3.5, 2.5],
    },
    {
      key: "MTT_FINAL_TABLE_6",
      label: t.icm.presets.mtt6,
      places: [35, 25, 18, 12, 7, 3],
    },
    { key: "HEADS_UP", label: t.icm.presets.headsUp, places: [100] },
    { key: "SPIN_3_HANDED", label: t.icm.presets.spinAndGo, places: [80, 20] },
    { key: "custom", label: t.icm.presets.custom, places: [] },
  ];

  // Players state
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: "1", name: `${t.icm.player} 1`, chips: "5000" },
    { id: "2", name: `${t.icm.player} 2`, chips: "3000" },
    { id: "3", name: `${t.icm.player} 3`, chips: "2000" },
  ]);

  // Payout state
  const [payoutPreset, setPayoutPreset] = useState<PayoutPreset>("SNG_9_MAX");
  const [customPayouts, setCustomPayouts] = useState<string>("50, 30, 20");
  const [prizePool, setPrizePool] = useState<string>("1000");

  // Results
  const [results, setResults] = useState<ICMResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current payouts
  const currentPayouts = useMemo(() => {
    if (payoutPreset === "custom") {
      return customPayouts
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
    }
    const preset = PAYOUT_PRESETS.find((p) => p.key === payoutPreset);
    return preset?.places || [];
  }, [payoutPreset, customPayouts]);

  // Add player
  const addPlayer = useCallback(() => {
    const newId = String(players.length + 1);
    setPlayers([
      ...players,
      { id: newId, name: `${t.icm.player} ${newId}`, chips: "1000" },
    ]);
  }, [players, t]);

  // Remove player
  const removePlayer = useCallback(
    (id: string) => {
      if (players.length > 2) {
        setPlayers(players.filter((p) => p.id !== id));
      }
    },
    [players]
  );

  // Update player
  const updatePlayer = useCallback(
    (id: string, field: "name" | "chips", value: string) => {
      setPlayers(
        players.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    },
    [players]
  );

  // Calculate ICM
  const calculate = useCallback(() => {
    setError(null);

    try {
      // Validate inputs
      const icmPlayers: ICMPlayer[] = players.map((p, i) => {
        const chips = parseInt(p.chips, 10);
        if (isNaN(chips) || chips < 0) {
          throw new Error(
            t.icm.errors.invalidChips.replace("{player}", String(i + 1))
          );
        }
        return { id: p.id, name: p.name, chips };
      });

      const pool = parseFloat(prizePool);
      if (isNaN(pool) || pool <= 0) {
        throw new Error(t.icm.errors.invalidPrizePool);
      }

      if (currentPayouts.length === 0) {
        throw new Error(t.icm.errors.noPayout);
      }

      // Check if payouts sum to 100%
      const payoutSum = currentPayouts.reduce((sum, p) => sum + p, 0);
      if (Math.abs(payoutSum - 100) > 0.1) {
        throw new Error(
          t.icm.errors.payoutSum.replace("{sum}", payoutSum.toFixed(1))
        );
      }

      // Calculate
      const result = calculateICM(icmPlayers, {
        places: currentPayouts,
        isPercentage: true,
        totalPrizePool: pool,
      });

      setResults(result.players);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.icm.errors.calculationFailed);
      setResults(null);
    }
  }, [players, prizePool, currentPayouts, t]);

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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t.icm.back}
        </Link>
        <h1>{t.icm.title}</h1>
        <p className="subtitle">{t.icm.subtitle}</p>
      </header>

      <div className={`icm-content ${isMobileOrTablet ? "mobile" : ""}`}>
        {/* Left Panel - Inputs */}
        <div className="icm-panel input-panel">
          <section className="panel-section">
            <h2>
              <span className="section-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </span>
              {t.icm.playerChips}
            </h2>

            <div className="players-list">
              {players.map((player, index) => {
                const chips = parseInt(player.chips, 10);
                const percentage =
                  totalChips > 0 && !isNaN(chips)
                    ? (chips / totalChips) * 100
                    : 0;

                return (
                  <div key={player.id} className="player-row">
                    <span className="player-number">{index + 1}</span>
                    <input
                      type="text"
                      className="player-name"
                      value={player.name}
                      onChange={(e) =>
                        updatePlayer(player.id, "name", e.target.value)
                      }
                      placeholder={t.icm.player}
                    />
                    <input
                      type="number"
                      className="player-chips"
                      value={player.chips}
                      onChange={(e) =>
                        updatePlayer(player.id, "chips", e.target.value)
                      }
                      placeholder={t.icm.chips}
                      min="0"
                    />
                    <span className="player-percentage">
                      {percentage.toFixed(1)}%
                    </span>
                    {players.length > 2 && (
                      <button
                        className="remove-player"
                        onClick={() => removePlayer(player.id)}
                        aria-label={t.icm.removePlayer}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="add-player-btn" onClick={addPlayer}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t.icm.addPlayer}
            </button>

            <div className="total-chips">
              {t.icm.totalChips}: <strong>{totalChips.toLocaleString()}</strong>
            </div>
          </section>

          <section className="panel-section">
            <h2>
              <span className="section-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </span>
              {t.icm.payoutStructure}
            </h2>

            <div className="prize-pool-input">
              <label>{t.icm.prizePool}</label>
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
              <label>{t.icm.payoutDistribution}</label>
              <select
                value={payoutPreset}
                onChange={(e) =>
                  setPayoutPreset(e.target.value as PayoutPreset)
                }
              >
                {PAYOUT_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {payoutPreset === "custom" && (
              <div className="custom-payouts">
                <label>{t.icm.customPayouts}</label>
                <input
                  type="text"
                  value={customPayouts}
                  onChange={(e) => setCustomPayouts(e.target.value)}
                  placeholder="50, 30, 20"
                />
              </div>
            )}

            <div className="payout-preview">
              <span className="preview-label">
                {t.icm.currentDistribution}:
              </span>
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
            {t.icm.calculate}
          </button>

          {error && (
            <div className="error-message">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="icm-panel results-panel">
          <h2>
            <span className="section-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            {t.icm.results}
          </h2>

          {results ? (
            <div className="results-content">
              <div className="results-table">
                <div className="table-header">
                  <span>{t.icm.rank}</span>
                  <span>{t.icm.player}</span>
                  <span>{t.icm.chips}</span>
                  <span>{t.icm.chipPercent}</span>
                  <span>{t.icm.icmEv}</span>
                  <span>{t.icm.icmPercent}</span>
                </div>

                {results
                  .sort((a, b) => b.chips - a.chips)
                  .map((result, index) => {
                    const player = players.find(
                      (p) => p.id === result.playerId
                    );
                    const chipEV =
                      (result.chipPercentage / 100) * parseFloat(prizePool);
                    const icmDiff = result.icmEquity - chipEV;

                    return (
                      <div key={result.playerId} className="result-row">
                        <span className="rank">
                          <span className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </span>
                        </span>
                        <span className="player-name">{player?.name}</span>
                        <span className="chips">
                          {result.chips.toLocaleString()}
                        </span>
                        <span className="chip-pct">
                          {result.chipPercentage.toFixed(1)}%
                        </span>
                        <span className="icm-ev">
                          ${result.icmEquity.toFixed(2)}
                        </span>
                        <span className="icm-pct">
                          {result.icmPercentage.toFixed(1)}%
                          <span
                            className={`icm-diff ${
                              icmDiff >= 0 ? "positive" : "negative"
                            }`}
                          >
                            ({icmDiff >= 0 ? "+" : ""}
                            {icmDiff.toFixed(2)})
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="results-explanation">
                <h3>{t.icm.icmExplanation}</h3>
                <p>
                  <strong>{t.icm.icmEv}</strong>{" "}
                  {t.icm.explanationText.evDescription}
                </p>
                <p>
                  <strong>{t.icm.icmPercent}</strong>{" "}
                  {t.icm.explanationText.percentComparison}
                </p>
                <ul>
                  <li>
                    <span className="positive">
                      {t.icm.explanationText.greenLabel}
                    </span>
                    : {t.icm.explanationText.greenDescription}
                  </li>
                  <li>
                    <span className="negative">
                      {t.icm.explanationText.redLabel}
                    </span>
                    : {t.icm.explanationText.redDescription}
                  </li>
                </ul>
              </div>

              {results.length > 0 && results[0].finishProbabilities && (
                <div className="finish-probabilities">
                  <h3>{t.icm.finishProbabilities}</h3>
                  <div className="prob-table">
                    <div className="prob-header">
                      <span>{t.icm.player}</span>
                      {results[0].finishProbabilities.map((_, i) => (
                        <span key={i}>{i + 1}st</span>
                      ))}
                    </div>
                    {results
                      .sort((a, b) => b.chips - a.chips)
                      .map((result) => {
                        const player = players.find(
                          (p) => p.id === result.playerId
                        );
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
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p>{t.icm.noResultsText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link href="/practice/pushfold" className="quick-link">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {t.icm.pushFoldTraining}
        </Link>
        <Link href="/practice" className="quick-link">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {t.icm.regularTraining}
        </Link>
      </div>
    </div>
  );
}
