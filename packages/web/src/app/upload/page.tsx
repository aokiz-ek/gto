'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { parseHandHistory, parseMultipleHands, handHistoryToString } from '@gto/core';
import type { ParsedHandHistory, ParsedAction, ErrorSeverity } from '@gto/core';
import { useResponsive } from '@/hooks';

type AnalysisStreet = 'preflop' | 'flop' | 'turn' | 'river';

interface DecisionPoint {
  street: AnalysisStreet;
  actionIndex: number;
  player: string;
  action: ParsedAction;
  isHero: boolean;
  gtoRecommendation?: string;
  evLoss?: number;
  evLossBB?: number;
  severity?: string;
  severityColor?: string;
  severityLabel?: { zh: string; en: string };
  analysis?: string;
  analysisEn?: string;
  recommendations?: Array<{
    action: string;
    frequency: number;
    evDifference: number;
  }>;
  accuracy?: number;
}

interface AnalysisSummary {
  totalEvLoss: number;
  totalEvLossBB: number;
  averageEvLossBB: number;
  heroActionCount: number;
  perfectActions: number;
  goodActions: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  overallRating: string;
  overallRatingEn: string;
}

export default function UploadPage() {
  const { isMobile } = useResponsive();
  const [inputText, setInputText] = useState('');
  const [parsedHands, setParsedHands] = useState<ParsedHandHistory[]>([]);
  const [selectedHand, setSelectedHand] = useState<ParsedHandHistory | null>(null);
  const [decisionPoints, setDecisionPoints] = useState<DecisionPoint[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeStreet, setActiveStreet] = useState<AnalysisStreet>('preflop');

  // Handle text input change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setParseError(null);
  }, []);

  // Parse the hand history
  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      setParseError('请输入手牌历史');
      return;
    }

    const hands = parseMultipleHands(inputText);

    if (hands.length === 0) {
      // Try single hand
      const singleHand = parseHandHistory(inputText);
      if (singleHand) {
        setParsedHands([singleHand]);
        setSelectedHand(singleHand);
        extractDecisionPoints(singleHand);
      } else {
        setParseError('无法解析手牌历史，请检查格式');
      }
    } else {
      setParsedHands(hands);
      setSelectedHand(hands[0]);
      if (hands[0]) extractDecisionPoints(hands[0]);
    }
  }, [inputText]);

  // Extract decision points from parsed hand
  const extractDecisionPoints = useCallback((hand: ParsedHandHistory) => {
    const points: DecisionPoint[] = [];

    const processStreet = (street: AnalysisStreet, actions: ParsedAction[]) => {
      actions.forEach((action, idx) => {
        const isHero = action.player === hand.heroName;
        points.push({
          street,
          actionIndex: idx,
          player: action.player,
          action,
          isHero,
        });
      });
    };

    processStreet('preflop', hand.preflop);
    processStreet('flop', hand.flop);
    processStreet('turn', hand.turn);
    processStreet('river', hand.river);

    setDecisionPoints(points);
    setAnalysisSummary(null);
  }, []);

  // AI analysis using backend API
  const handleAnalyze = useCallback(async () => {
    if (!selectedHand) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze/hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handHistory: selectedHand.rawText }),
      });

      const result = await response.json();

      if (result.success && result.analyzedActions) {
        // Update decision points with real analysis
        setDecisionPoints(prev => prev.map(point => {
          const analyzed = result.analyzedActions.find(
            (a: { street: string; player: string; action: string }) =>
              a.street === point.street &&
              a.player === point.player &&
              a.action === point.action.action
          );

          if (analyzed && analyzed.isHero) {
            return {
              ...point,
              gtoRecommendation: analyzed.gtoRecommendation,
              evLoss: analyzed.evLoss,
              evLossBB: analyzed.evLossBB,
              severity: analyzed.severity,
              severityColor: analyzed.severityColor,
              severityLabel: analyzed.severityLabel,
              analysis: analyzed.analysis,
              analysisEn: analyzed.analysisEn,
              recommendations: analyzed.recommendations,
              accuracy: analyzed.accuracy,
            };
          }
          return point;
        }));

        // Set summary
        if (result.summary) {
          setAnalysisSummary(result.summary);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }

    setIsAnalyzing(false);
  }, [selectedHand]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  }, []);

  // Select a hand from multiple parsed hands
  const handleSelectHand = useCallback((hand: ParsedHandHistory) => {
    setSelectedHand(hand);
    extractDecisionPoints(hand);
  }, [extractDecisionPoints]);

  // Get street actions
  const getStreetActions = (street: AnalysisStreet) => {
    return decisionPoints.filter(p => p.street === street);
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'perfect': return '✓';
      case 'good': return '○';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return '';
    }
  };

  return (
    <div className="upload-page">
      <div className="header">
        <Link href="/" className="back-link">← 返回</Link>
        <h1>手牌分析</h1>
        <div className="spacer" />
      </div>

      {!selectedHand ? (
        // Input view
        <div className="input-section">
          <div className="upload-area">
            <div className="upload-icon">📋</div>
            <h2>粘贴手牌历史</h2>
            <p>支持 PokerStars、888poker 等主流格式</p>

            <textarea
              className="hand-input"
              placeholder={`PokerStars Hand #123456789: Hold'em No Limit ($0.50/$1.00 USD)
Table 'Example' 6-max Seat #4 is the button
Seat 1: Player1 ($100.00 in chips)
Seat 4: Hero ($100.00 in chips)
...`}
              value={inputText}
              onChange={handleTextChange}
              rows={12}
            />

            {parseError && (
              <div className="error-msg">{parseError}</div>
            )}

            <div className="action-row">
              <label className="file-upload-btn">
                <input
                  type="file"
                  accept=".txt,.log"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                上传文件
              </label>
              <button className="parse-btn" onClick={handleParse}>
                解析手牌
              </button>
            </div>
          </div>

          <div className="format-help">
            <h3>支持的格式</h3>
            <ul>
              <li><strong>PokerStars</strong> - 标准HH格式</li>
              <li><strong>888poker</strong> - Game No 格式</li>
              <li><strong>GGPoker</strong> - 即将支持</li>
              <li><strong>通用格式</strong> - 手动输入牌面</li>
            </ul>
          </div>
        </div>
      ) : (
        // Analysis view
        <div className="analysis-section">
          {/* Hand selector for multiple hands */}
          {parsedHands.length > 1 && (
            <div className="hand-selector">
              <span className="label">选择手牌:</span>
              <select
                value={selectedHand.id}
                onChange={(e) => {
                  const hand = parsedHands.find(h => h.id === e.target.value);
                  if (hand) handleSelectHand(hand);
                }}
              >
                {parsedHands.map((hand, idx) => (
                  <option key={hand.id} value={hand.id}>
                    #{idx + 1} - {hand.heroCards
                      ? `${hand.heroCards[0].rank}${hand.heroCards[0].suit} ${hand.heroCards[1].rank}${hand.heroCards[1].suit}`
                      : 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hand summary */}
          <div className="hand-summary">
            <div className="summary-header">
              <div className="platform-badge">{selectedHand.platform}</div>
              <div className="stakes">{selectedHand.stakes}</div>
              <div className="game-type">{selectedHand.gameType}</div>
            </div>

            <div className="hero-info">
              <div className="hero-cards">
                {selectedHand.heroCards && (
                  <>
                    <PokerCard card={selectedHand.heroCards[0]} size={isMobile ? 'md' : 'lg'} variant="dark" />
                    <PokerCard card={selectedHand.heroCards[1]} size={isMobile ? 'md' : 'lg'} variant="dark" />
                  </>
                )}
              </div>
              <div className="hero-details">
                <span className="hero-name">{selectedHand.heroName}</span>
                <span className="hero-position">
                  {selectedHand.players.find(p => p.isHero)?.position || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Board */}
            <div className="board-section">
              <div className="board-label">公共牌</div>
              <div className="board-cards">
                {selectedHand.board.flop?.map((card, idx) => (
                  <PokerCard key={`flop-${idx}`} card={card} size="md" variant="dark" />
                ))}
                {selectedHand.board.turn && (
                  <PokerCard card={selectedHand.board.turn} size="md" variant="dark" />
                )}
                {selectedHand.board.river && (
                  <PokerCard card={selectedHand.board.river} size="md" variant="dark" />
                )}
                {!selectedHand.board.flop && <span className="no-board">无公共牌</span>}
              </div>
            </div>
          </div>

          {/* Analysis summary with enhanced stats */}
          {analysisSummary && (
            <div className="analysis-summary enhanced">
              <div className="summary-header-row">
                <h3>分析总结</h3>
                <div className="overall-rating" style={{
                  background: analysisSummary.totalEvLossBB <= 0.5 ? 'rgba(34, 211, 191, 0.15)' :
                             analysisSummary.totalEvLossBB <= 2 ? 'rgba(245, 208, 0, 0.15)' :
                             'rgba(239, 68, 68, 0.15)',
                  color: analysisSummary.totalEvLossBB <= 0.5 ? '#22d3bf' :
                         analysisSummary.totalEvLossBB <= 2 ? '#f5d000' :
                         '#ef4444',
                }}>
                  {analysisSummary.overallRating}
                </div>
              </div>

              <div className="ev-display">
                <div className="ev-main">
                  <span className="ev-value">{analysisSummary.totalEvLossBB.toFixed(2)}</span>
                  <span className="ev-unit">BB</span>
                </div>
                <div className="ev-label">总EV损失</div>
              </div>

              <div className="summary-stats-grid">
                <div className="stat-item perfect">
                  <span className="stat-icon">✓</span>
                  <span className="stat-count">{analysisSummary.perfectActions}</span>
                  <span className="stat-label">完美</span>
                </div>
                <div className="stat-item good">
                  <span className="stat-icon">○</span>
                  <span className="stat-count">{analysisSummary.goodActions}</span>
                  <span className="stat-label">良好</span>
                </div>
                <div className="stat-item inaccuracy">
                  <span className="stat-icon">?!</span>
                  <span className="stat-count">{analysisSummary.inaccuracies}</span>
                  <span className="stat-label">不精确</span>
                </div>
                <div className="stat-item mistake">
                  <span className="stat-icon">?</span>
                  <span className="stat-count">{analysisSummary.mistakes}</span>
                  <span className="stat-label">错误</span>
                </div>
                <div className="stat-item blunder">
                  <span className="stat-icon">??</span>
                  <span className="stat-count">{analysisSummary.blunders}</span>
                  <span className="stat-label">严重失误</span>
                </div>
              </div>

              <div className="avg-ev-info">
                平均每决策损失: <strong>{analysisSummary.averageEvLossBB.toFixed(2)} BB</strong>
              </div>
            </div>
          )}

          {/* Street tabs */}
          <div className="street-tabs">
            {(['preflop', 'flop', 'turn', 'river'] as AnalysisStreet[]).map(street => (
              <button
                key={street}
                className={`street-tab ${activeStreet === street ? 'active' : ''}`}
                onClick={() => setActiveStreet(street)}
                disabled={getStreetActions(street).length === 0}
              >
                {street === 'preflop' ? '翻前' :
                 street === 'flop' ? '翻牌' :
                 street === 'turn' ? '转牌' : '河牌'}
                <span className="action-count">{getStreetActions(street).length}</span>
              </button>
            ))}
          </div>

          {/* Actions list */}
          <div className="actions-list">
            {getStreetActions(activeStreet).map((point, idx) => (
              <div
                key={`${point.street}-${idx}`}
                className={`action-item ${point.isHero ? 'hero' : ''} ${point.severity || ''}`}
                style={point.isHero && point.severityColor ? {
                  borderLeftColor: point.severityColor,
                  borderLeftWidth: '4px',
                } : {}}
              >
                <div className="action-header">
                  <span className="player-name">{point.player}</span>
                  {point.isHero && <span className="hero-badge">Hero</span>}
                  {point.isHero && point.severity && (
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: point.severityColor }}
                    >
                      {getSeverityIcon(point.severity)} {point.severityLabel?.zh}
                    </span>
                  )}
                </div>
                <div className="action-body">
                  <span className={`action-type ${point.action.action}`}>
                    {point.action.action.toUpperCase()}
                    {point.action.amount && ` $${point.action.amount}`}
                  </span>

                  {point.isHero && point.accuracy !== undefined && (
                    <span className="accuracy-badge">
                      频率: {point.accuracy.toFixed(0)}%
                    </span>
                  )}
                </div>

                {point.isHero && point.analysis && (
                  <div className="analysis-info">
                    <div className="analysis-row">
                      <div className="gto-rec">
                        <span className="label">GTO建议:</span>
                        <span className="value">{point.gtoRecommendation}</span>
                      </div>
                      <div className="ev-loss" style={{
                        color: point.severityColor || '#888'
                      }}>
                        <span className="label">EV损失:</span>
                        <span className="value">
                          {(point.evLossBB ?? point.evLoss ?? 0).toFixed(2)} BB
                        </span>
                      </div>
                    </div>

                    <div className="explanation">{point.analysis}</div>

                    {/* Recommendations */}
                    {point.recommendations && point.recommendations.length > 0 && (
                      <div className="recommendations">
                        <span className="rec-label">GTO频率:</span>
                        <div className="rec-list">
                          {point.recommendations.map((rec, i) => (
                            <span
                              key={i}
                              className={`rec-item ${rec.action === point.action.action ? 'current' : ''}`}
                            >
                              {rec.action}: {rec.frequency.toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="analysis-actions">
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '分析中...' : analysisSummary ? '重新分析' : 'AI分析'}
            </button>
            <button
              className="new-hand-btn"
              onClick={() => {
                setSelectedHand(null);
                setParsedHands([]);
                setDecisionPoints([]);
                setAnalysisSummary(null);
                setInputText('');
              }}
            >
              新手牌
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .upload-page {
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
          font-size: 20px;
          font-weight: 600;
        }

        .spacer {
          width: 50px;
        }

        /* Input section */
        .input-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .upload-area {
          background: #1a1a1a;
          border: 2px dashed #333;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .upload-area h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .upload-area p {
          color: #888;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .hand-input {
          width: 100%;
          min-height: 200px;
          background: #0d0d0d;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          color: #fff;
          font-family: monospace;
          font-size: 13px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .hand-input:focus {
          outline: none;
          border-color: #22d3bf;
        }

        .error-msg {
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .action-row {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .file-upload-btn {
          padding: 12px 24px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
        }

        .file-upload-btn:hover {
          border-color: #555;
          color: #aaa;
        }

        .parse-btn {
          padding: 12px 32px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .parse-btn:hover {
          background: #1eb8a6;
        }

        .format-help {
          margin-top: 32px;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
        }

        .format-help h3 {
          font-size: 14px;
          color: #888;
          margin-bottom: 12px;
        }

        .format-help ul {
          list-style: none;
          padding: 0;
        }

        .format-help li {
          padding: 8px 0;
          color: #aaa;
          font-size: 14px;
        }

        /* Analysis section */
        .analysis-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .hand-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .hand-selector .label {
          color: #888;
          font-size: 14px;
        }

        .hand-selector select {
          flex: 1;
          padding: 8px 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
        }

        .hand-summary {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .summary-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .platform-badge {
          padding: 4px 12px;
          background: rgba(34, 211, 191, 0.15);
          border: 1px solid rgba(34, 211, 191, 0.3);
          border-radius: 20px;
          color: #22d3bf;
          font-size: 12px;
          text-transform: capitalize;
        }

        .stakes, .game-type {
          color: #888;
          font-size: 14px;
        }

        .hero-info {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .hero-cards {
          display: flex;
          gap: 8px;
        }

        .hero-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero-name {
          font-size: 16px;
          font-weight: 600;
        }

        .hero-position {
          color: #22d3bf;
          font-size: 14px;
        }

        .board-section {
          padding-top: 16px;
          border-top: 1px solid #333;
        }

        .board-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 12px;
        }

        .board-cards {
          display: flex;
          gap: 8px;
        }

        .no-board {
          color: #666;
          font-size: 14px;
        }

        /* Enhanced Analysis summary */
        .analysis-summary.enhanced {
          background: linear-gradient(135deg, #1a1a1a 0%, #1f1f2e 100%);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .summary-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .summary-header-row h3 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .overall-rating {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .ev-display {
          text-align: center;
          margin-bottom: 24px;
        }

        .ev-main {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .ev-value {
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #22d3bf, #9b5de5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ev-unit {
          font-size: 24px;
          color: #888;
        }

        .ev-label {
          font-size: 14px;
          color: #888;
          margin-top: 4px;
        }

        .summary-stats-grid {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          min-width: 60px;
        }

        .stat-item .stat-icon {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-item.perfect .stat-icon { color: #00f5d4; }
        .stat-item.good .stat-icon { color: #4ecdc4; }
        .stat-item.inaccuracy .stat-icon { color: #f5d000; }
        .stat-item.mistake .stat-icon { color: #ff9500; }
        .stat-item.blunder .stat-icon { color: #ff4444; }

        .stat-item .stat-count {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .stat-item .stat-label {
          font-size: 11px;
          color: #888;
          margin-top: 2px;
        }

        .avg-ev-info {
          text-align: center;
          font-size: 13px;
          color: #888;
        }

        .avg-ev-info strong {
          color: #22d3bf;
        }

        /* Street tabs */
        .street-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .street-tab {
          flex: 1;
          padding: 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .street-tab.active {
          border-color: #22d3bf;
          color: #22d3bf;
        }

        .street-tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-count {
          background: #333;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        .street-tab.active .action-count {
          background: rgba(34, 211, 191, 0.2);
        }

        /* Actions list */
        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .action-item {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px 16px;
          border-left: 4px solid transparent;
        }

        .action-item.hero {
          border-color: #22d3bf;
          background: rgba(34, 211, 191, 0.05);
        }

        .action-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .player-name {
          font-weight: 500;
          font-size: 14px;
        }

        .hero-badge {
          background: #22d3bf;
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .severity-badge {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #000;
          margin-left: auto;
        }

        .action-body {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action-type {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }

        .action-type.fold { background: #3b82f6; }
        .action-type.check { background: #6b7280; }
        .action-type.call { background: #22c55e; }
        .action-type.bet, .action-type.raise { background: #ef4444; }
        .action-type.all-in { background: #7c3aed; }

        .accuracy-badge {
          font-size: 12px;
          color: #888;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .analysis-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #333;
        }

        .analysis-row {
          display: flex;
          gap: 24px;
          margin-bottom: 10px;
        }

        .gto-rec, .ev-loss {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .gto-rec .label, .ev-loss .label {
          color: #888;
        }

        .gto-rec .value {
          color: #22d3bf;
          font-weight: 600;
          text-transform: uppercase;
        }

        .ev-loss .value {
          font-weight: 600;
        }

        .explanation {
          color: #bbb;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .recommendations {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rec-label {
          font-size: 12px;
          color: #666;
        }

        .rec-list {
          display: flex;
          gap: 8px;
        }

        .rec-item {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          color: #888;
        }

        .rec-item.current {
          background: rgba(34, 211, 191, 0.15);
          color: #22d3bf;
          border: 1px solid rgba(34, 211, 191, 0.3);
        }

        /* Analysis actions */
        .analysis-actions {
          display: flex;
          gap: 12px;
        }

        .analyze-btn {
          flex: 1;
          padding: 14px;
          background: linear-gradient(135deg, #9b5de5, #ec4899);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .analyze-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .new-hand-btn {
          padding: 14px 24px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
        }

        .new-hand-btn:hover {
          border-color: #555;
          color: #aaa;
        }

        @media (max-width: 640px) {
          .upload-area {
            padding: 20px;
          }

          .hero-info {
            flex-direction: column;
            align-items: flex-start;
          }

          .summary-stats-grid {
            flex-wrap: wrap;
          }

          .stat-item {
            flex: 1 1 28%;
            min-width: 0;
          }

          .street-tabs {
            flex-wrap: wrap;
          }

          .street-tab {
            flex: 1 1 45%;
          }

          .analysis-row {
            flex-direction: column;
            gap: 8px;
          }

          .ev-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
