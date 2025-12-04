'use client';

import { Skeleton, SkeletonGroup } from '@gto/ui';
import type { Card as CardType, Position, Street } from '@gto/core';

const STREET_LABELS: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

// Street analysis result
interface StreetAnalysis {
  street: Street;
  actions: { action: string; frequency: number; ev: number }[];
  equity: number;
  potOdds: number;
}

// Analysis result type
interface AnalysisResultData {
  actions: { action: string; frequency: number; ev: number }[];
  equity: number;
  potOdds: number;
  spr: number;
  villainRange: number;
  combos: number;
  streetAnalysis?: StreetAnalysis[];
}

interface AnalysisResultProps {
  isAnalyzing: boolean;
  result: AnalysisResultData | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  street: Street;
}

export function AnalysisResult({
  isAnalyzing,
  result,
  heroPosition,
  villainPosition,
  heroHand,
  board,
  street,
}: AnalysisResultProps) {
  // Get placeholder text based on current state
  const getPlaceholderText = () => {
    if (!heroPosition || !villainPosition) {
      return '请先选择你和对手的位置';
    }
    if (!heroHand) {
      return '请选择你的两张手牌';
    }
    if (street !== 'preflop') {
      const requiredCards = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
      if (board.length < requiredCards) {
        return `请选择公共牌 (${board.length}/${requiredCards})`;
      }
    }
    return '点击"分析"按钮开始分析';
  };

  return (
    <div className="analysis-card">
      <style jsx>{`
        .analysis-card {
          background: #12121a;
          border-radius: 10px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
          max-height: 280px;
          overflow-y: auto;
        }

        .analysis-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .actions-row {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .stat-item {
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          text-align: center;
        }

        .stat-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 700;
          font-family: 'SF Mono', monospace;
        }

        .street-analysis {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .street-analysis-title {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .street-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
        }

        .street-item.active {
          background: rgba(34, 211, 191, 0.08);
          border-color: rgba(34, 211, 191, 0.2);
        }

        .street-name {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          min-width: 32px;
        }

        .street-item.active .street-name {
          color: #22d3bf;
        }

        .street-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          flex-wrap: wrap;
        }

        .street-action-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        }

        .street-action-chip.raise,
        .street-action-chip.bet {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .street-action-chip.call,
        .street-action-chip.check {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .street-action-chip.fold {
          background: rgba(107, 114, 128, 0.15);
          color: #9ca3af;
        }

        .street-action-freq {
          opacity: 0.8;
        }

        .street-equity {
          font-size: 10px;
          font-weight: 600;
          color: #22d3bf;
          margin-left: auto;
          white-space: nowrap;
        }

        .analysis-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
        }

        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .placeholder-text {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }
      `}</style>

      {isAnalyzing ? (
        <>
          <div className="analysis-title">
            <Skeleton variant="rectangular" width={20} height={20} animation="pulse" />
            <span style={{ marginLeft: '8px' }}>分析中...</span>
          </div>
          <div className="actions-row">
            <Skeleton variant="rounded" width={80} height={36} animation="wave" />
            <Skeleton variant="rounded" width={80} height={36} animation="wave" />
            <Skeleton variant="rounded" width={80} height={36} animation="wave" />
          </div>
          <SkeletonGroup.Stats count={4} animation="wave" />
        </>
      ) : !result ? (
        <>
          <div className="analysis-title">
            📊 GTO 分析结果
          </div>
          <div className="analysis-placeholder">
            <div className="placeholder-icon">🎯</div>
            <div className="placeholder-text">{getPlaceholderText()}</div>
          </div>
        </>
      ) : (
        <>
          <div className="analysis-title">
            📊 GTO 分析结果
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">权益</div>
              <div className="stat-value" style={{ color: '#22d3bf' }}>{result.equity}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">底池赔率</div>
              <div className="stat-value">{result.potOdds}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">SPR</div>
              <div className="stat-value">{result.spr}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">最佳EV</div>
              <div className="stat-value" style={{ color: '#22c55e' }}>+{result.actions[0]?.ev} BB</div>
            </div>
          </div>

          {/* Street-by-street Analysis */}
          {result.streetAnalysis && (
            <div className="street-analysis">
              <div className="street-analysis-title">各街道策略</div>
              {result.streetAnalysis.map((sa) => (
                <div
                  key={sa.street}
                  className={`street-item ${sa.street === street ? 'active' : ''}`}
                >
                  <span className="street-name">{STREET_LABELS[sa.street]}</span>
                  <div className="street-actions">
                    {sa.actions.map((a, i) => (
                      <span
                        key={i}
                        className={`street-action-chip ${a.action}`}
                      >
                        {a.action === 'raise' ? '加注' :
                         a.action === 'call' ? '跟注' :
                         a.action === 'fold' ? '弃牌' :
                         a.action === 'bet' ? '下注' :
                         a.action === 'check' ? '过牌' : a.action}
                        <span className="street-action-freq">{Math.round(a.frequency * 100)}%</span>
                      </span>
                    ))}
                  </div>
                  <span className="street-equity">{sa.equity}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
