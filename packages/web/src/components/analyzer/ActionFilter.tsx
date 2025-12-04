'use client';

import { useState } from 'react';
import type { Street } from '@gto/core';

interface ActionFilterProps {
  street: Street;
  selectedActions: string[];
  onActionsChange: (actions: string[]) => void;
  previousActions?: { street: Street; action: string; position: string }[];
}

const STREET_ACTIONS: Record<Street, { id: string; label: string; color: string }[]> = {
  preflop: [
    { id: 'fold', label: '弃牌', color: '#6b7280' },
    { id: 'call', label: '跟注', color: '#22c55e' },
    { id: 'raise', label: '加注', color: '#ef4444' },
    { id: '3bet', label: '3-Bet', color: '#f59e0b' },
    { id: '4bet', label: '4-Bet', color: '#8b5cf6' },
    { id: 'allin', label: '全下', color: '#ec4899' },
  ],
  flop: [
    { id: 'check', label: '过牌', color: '#22c55e' },
    { id: 'bet_small', label: '小注 (33%)', color: '#3b82f6' },
    { id: 'bet_medium', label: '中注 (66%)', color: '#f59e0b' },
    { id: 'bet_large', label: '大注 (100%+)', color: '#ef4444' },
    { id: 'call', label: '跟注', color: '#22c55e' },
    { id: 'raise', label: '加注', color: '#8b5cf6' },
    { id: 'fold', label: '弃牌', color: '#6b7280' },
  ],
  turn: [
    { id: 'check', label: '过牌', color: '#22c55e' },
    { id: 'bet_small', label: '小注 (33%)', color: '#3b82f6' },
    { id: 'bet_medium', label: '中注 (66%)', color: '#f59e0b' },
    { id: 'bet_large', label: '大注 (100%+)', color: '#ef4444' },
    { id: 'call', label: '跟注', color: '#22c55e' },
    { id: 'raise', label: '加注', color: '#8b5cf6' },
    { id: 'fold', label: '弃牌', color: '#6b7280' },
  ],
  river: [
    { id: 'check', label: '过牌', color: '#22c55e' },
    { id: 'bet_small', label: '小注 (33%)', color: '#3b82f6' },
    { id: 'bet_medium', label: '中注 (66%)', color: '#f59e0b' },
    { id: 'bet_large', label: '大注 (100%+)', color: '#ef4444' },
    { id: 'bet_overbet', label: '超池 (150%+)', color: '#ec4899' },
    { id: 'call', label: '跟注', color: '#22c55e' },
    { id: 'raise', label: '加注', color: '#8b5cf6' },
    { id: 'fold', label: '弃牌', color: '#6b7280' },
  ],
};

const STREET_LABELS: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

export function ActionFilter({
  street,
  selectedActions,
  onActionsChange,
  previousActions = [],
}: ActionFilterProps) {
  const [expanded, setExpanded] = useState(true);

  const actions = STREET_ACTIONS[street];

  const toggleAction = (actionId: string) => {
    if (selectedActions.includes(actionId)) {
      onActionsChange(selectedActions.filter(a => a !== actionId));
    } else {
      onActionsChange([...selectedActions, actionId]);
    }
  };

  const selectAll = () => {
    onActionsChange(actions.map(a => a.id));
  };

  const clearAll = () => {
    onActionsChange([]);
  };

  return (
    <div className="action-filter-panel">
      <style jsx>{`
        .action-filter-panel {
          background: linear-gradient(180deg, #14141e 0%, #12121a 100%);
          border-radius: 12px;
          padding: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          cursor: pointer;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-icon {
          font-size: 16px;
        }

        .filter-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .street-badge {
          padding: 3px 8px;
          background: rgba(34, 211, 191, 0.12);
          border: 1px solid rgba(34, 211, 191, 0.25);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #22d3bf;
        }

        .expand-icon {
          font-size: 12px;
          color: #666;
          transition: transform 0.2s;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .filter-content {
          display: none;
        }

        .filter-content.expanded {
          display: block;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .quick-btn {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 10px;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .action-item.selected {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .action-checkbox {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        .action-item.selected .action-checkbox {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: #fff;
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-label {
          font-size: 11px;
          font-weight: 600;
          color: #ccc;
        }

        .action-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .previous-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .previous-title {
          font-size: 10px;
          color: #666;
          margin-bottom: 8px;
        }

        .previous-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
        }

        .previous-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 10px;
        }

        .previous-street {
          color: #666;
        }

        .previous-action {
          color: #aaa;
          font-weight: 600;
        }

        .flow-arrow {
          color: #444;
          font-size: 10px;
        }

        .selected-count {
          font-size: 10px;
          color: #888;
          margin-top: 8px;
          text-align: right;
        }
      `}</style>

      <div className="filter-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-left">
          <span className="filter-icon">🎯</span>
          <span className="filter-title">行动过滤器</span>
          <span className="street-badge">{STREET_LABELS[street]}</span>
        </div>
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>

      <div className={`filter-content ${expanded ? 'expanded' : ''}`}>
        <div className="quick-actions">
          <button className="quick-btn" onClick={selectAll}>全选</button>
          <button className="quick-btn" onClick={clearAll}>清空</button>
        </div>

        <div className="action-grid">
          {actions.map(action => (
            <div
              key={action.id}
              className={`action-item ${selectedActions.includes(action.id) ? 'selected' : ''}`}
              onClick={() => toggleAction(action.id)}
            >
              <div className="action-checkbox">
                {selectedActions.includes(action.id) && '✓'}
              </div>
              <div className="action-info">
                <span className="action-label">{action.label}</span>
              </div>
              <div className="action-dot" style={{ backgroundColor: action.color }} />
            </div>
          ))}
        </div>

        {previousActions.length > 0 && (
          <div className="previous-actions">
            <div className="previous-title">前序行动</div>
            <div className="previous-flow">
              {previousActions.map((pa, i) => (
                <span key={i}>
                  {i > 0 && <span className="flow-arrow">→</span>}
                  <span className="previous-chip">
                    <span className="previous-street">{STREET_LABELS[pa.street]}</span>
                    <span className="previous-action">{pa.position}: {pa.action}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="selected-count">
          已选择 {selectedActions.length}/{actions.length} 个行动
        </div>
      </div>
    </div>
  );
}
