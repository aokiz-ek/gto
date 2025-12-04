'use client';

import { useMemo } from 'react';
import type { Position, Street } from '@gto/core';

interface Action {
  position: Position;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  amount?: number;
  street: Street;
}

interface ActionLineProps {
  actions: Action[];
  currentStreet: Street;
  heroPosition: Position | null;
  villainPosition: Position | null;
  potSize?: number;
}

const ACTION_COLORS: Record<string, string> = {
  fold: '#6b7280',
  check: '#22c55e',
  call: '#22c55e',
  bet: '#ef4444',
  raise: '#ef4444',
  allin: '#8b5cf6',
};

const ACTION_LABELS: Record<string, string> = {
  fold: '弃牌',
  check: '过牌',
  call: '跟注',
  bet: '下注',
  raise: '加注',
  allin: '全下',
};

const STREET_LABELS: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

export function ActionLine({
  actions,
  currentStreet,
  heroPosition,
  villainPosition,
  potSize = 10,
}: ActionLineProps) {
  // Group actions by street
  const actionsByStreet = useMemo(() => {
    const grouped: Record<Street, Action[]> = {
      preflop: [],
      flop: [],
      turn: [],
      river: [],
    };

    actions.forEach(action => {
      grouped[action.street].push(action);
    });

    return grouped;
  }, [actions]);

  // Generate default preflop action line if no actions provided
  const displayActions = useMemo(() => {
    if (actions.length === 0 && heroPosition && villainPosition) {
      // Default preflop scenario: Villain opens, Hero responds
      return [
        { position: villainPosition, action: 'raise' as const, amount: 2.5, street: 'preflop' as Street },
        { position: heroPosition, action: 'call' as const, amount: 2.5, street: 'preflop' as Street },
      ];
    }
    return actions;
  }, [actions, heroPosition, villainPosition]);

  // Group displayed actions by street
  const displayByStreet = useMemo(() => {
    const grouped: Record<Street, Action[]> = {
      preflop: [],
      flop: [],
      turn: [],
      river: [],
    };

    displayActions.forEach(action => {
      grouped[action.street].push(action);
    });

    return grouped;
  }, [displayActions]);

  const streets: Street[] = ['preflop', 'flop', 'turn', 'river'];

  return (
    <div className="action-line-panel">
      <style jsx>{`
        .action-line-panel {
          background: #12121a;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .action-line-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .action-line-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .pot-display {
          font-size: 11px;
          color: #666;
        }

        .pot-value {
          color: #22d3bf;
          font-weight: 600;
        }

        .action-timeline {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .street-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .street-label {
          min-width: 40px;
          font-size: 10px;
          font-weight: 600;
          color: #666;
        }

        .street-row.active .street-label {
          color: #22d3bf;
        }

        .street-row.future .street-label {
          color: #444;
        }

        .street-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
        }

        .action-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
        }

        .action-position {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          color: #888;
        }

        .action-position.hero {
          background: rgba(34, 211, 191, 0.2);
          color: #22d3bf;
        }

        .action-position.villain {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .action-name {
          text-transform: capitalize;
        }

        .action-amount {
          font-size: 9px;
          color: #888;
          font-family: 'SF Mono', monospace;
        }

        .action-arrow {
          color: #444;
          font-size: 12px;
        }

        .street-divider {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          margin: 4px 0;
        }

        .empty-street {
          font-size: 10px;
          color: #444;
          font-style: italic;
        }

        .street-row.future .action-chip {
          opacity: 0.4;
        }

        .add-action-btn {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          background: transparent;
          color: #666;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .add-action-btn:hover {
          border-color: rgba(34, 211, 191, 0.4);
          color: #22d3bf;
        }

        .pot-progression {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pot-bar-container {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .pot-bar {
          height: 100%;
          background: linear-gradient(90deg, #22d3bf 0%, #3b82f6 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .pot-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
        }

        .current-pot {
          color: #22d3bf;
          font-weight: 600;
        }
      `}</style>

      <div className="action-line-header">
        <span className="action-line-title">行动线</span>
        <span className="pot-display">
          底池: <span className="pot-value">{potSize} BB</span>
        </span>
      </div>

      <div className="action-timeline">
        {streets.map((street, streetIndex) => {
          const streetActions = displayByStreet[street];
          const isActive = street === currentStreet;
          const isFuture = streets.indexOf(street) > streets.indexOf(currentStreet);
          const isPast = streets.indexOf(street) < streets.indexOf(currentStreet);

          // Only show streets up to current
          if (isFuture && streetActions.length === 0) return null;

          return (
            <div key={street}>
              {streetIndex > 0 && isPast && <div className="street-divider" />}
              <div className={`street-row ${isActive ? 'active' : ''} ${isFuture ? 'future' : ''}`}>
                <span className="street-label">{STREET_LABELS[street]}</span>
                <div className="street-actions">
                  {streetActions.length > 0 ? (
                    streetActions.map((action, i) => (
                      <div key={i} className="action-chip" style={{ borderLeft: `2px solid ${ACTION_COLORS[action.action]}` }}>
                        <span className={`action-position ${action.position === heroPosition ? 'hero' : action.position === villainPosition ? 'villain' : ''}`}>
                          {action.position}
                        </span>
                        <span className="action-name" style={{ color: ACTION_COLORS[action.action] }}>
                          {ACTION_LABELS[action.action]}
                        </span>
                        {action.amount && (
                          <span className="action-amount">{action.amount}BB</span>
                        )}
                        {i < streetActions.length - 1 && <span className="action-arrow">→</span>}
                      </div>
                    ))
                  ) : isActive ? (
                    <span className="empty-street">等待行动...</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pot progression bar */}
      <div className="pot-progression">
        <div className="pot-bar-container">
          <div
            className="pot-bar"
            style={{
              width: `${Math.min((potSize / 100) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="pot-labels">
          <span>0 BB</span>
          <span className="current-pot">{potSize} BB</span>
          <span>100 BB</span>
        </div>
      </div>
    </div>
  );
}
