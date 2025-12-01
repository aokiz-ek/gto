'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import './postflop.css';

// Types
type BoardTexture = 'dry' | 'wet' | 'monotone' | 'paired' | 'connected' | 'high' | 'low' | 'ace_high';
type HandStrength = 'nuts' | 'strong' | 'medium' | 'marginal' | 'weak' | 'draw' | 'air';
type ScenarioType = 'cbet_ip' | 'cbet_oop' | 'facing_cbet' | 'check_raise' | 'donk_bet' | 'probe_bet' | 'turn_barrel' | 'river_value';
type Street = 'flop' | 'turn' | 'river';

interface PostflopAction {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  frequency: number;
  size?: number;
  ev: number;
}

interface PostflopScenario {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  scenarioType: ScenarioType;
  street: Street;
  boardTexture: BoardTexture;
  hasPosition: boolean;
  sprCategory: string;
  strategies: Record<HandStrength, PostflopAction[]>;
  tips: { en: string; zh: string }[];
}

interface Labels {
  scenarioTypes: Record<string, { en: string; zh: string }>;
  boardTextures: Record<string, { en: string; zh: string }>;
  sprCategories: Record<string, { en: string; zh: string; range: string }>;
}

// Action colors
const ACTION_COLORS: Record<string, string> = {
  fold: '#3b82f6',
  check: '#6b7280',
  call: '#22c55e',
  bet: '#ef4444',
  raise: '#f97316',
  allin: '#dc2626',
};

// Hand strength colors
const STRENGTH_COLORS: Record<HandStrength, string> = {
  nuts: '#22c55e',
  strong: '#4ade80',
  medium: '#a3e635',
  marginal: '#fbbf24',
  weak: '#f97316',
  draw: '#3b82f6',
  air: '#6b7280',
};

// Hand strength labels
const STRENGTH_LABELS: Record<HandStrength, { en: string; zh: string }> = {
  nuts: { en: 'Nuts', zh: '坚果牌' },
  strong: { en: 'Strong', zh: '强牌' },
  medium: { en: 'Medium', zh: '中等牌' },
  marginal: { en: 'Marginal', zh: '边缘牌' },
  weak: { en: 'Weak', zh: '弱牌' },
  draw: { en: 'Draw', zh: '听牌' },
  air: { en: 'Air', zh: '空气牌' },
};

// Street labels
const STREET_LABELS: Record<Street, { en: string; zh: string }> = {
  flop: { en: 'Flop', zh: '翻牌' },
  turn: { en: 'Turn', zh: '转牌' },
  river: { en: 'River', zh: '河牌' },
};

export default function PostflopPage() {
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const [scenarios, setScenarios] = useState<PostflopScenario[]>([]);
  const [labels, setLabels] = useState<Labels | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<PostflopScenario | null>(null);
  const [selectedStrength, setSelectedStrength] = useState<HandStrength>('medium');

  // Filters
  const [filterType, setFilterType] = useState<ScenarioType | 'all'>('all');
  const [filterStreet, setFilterStreet] = useState<Street | 'all'>('all');
  const [filterTexture, setFilterTexture] = useState<BoardTexture | 'all'>('all');

  useEffect(() => {
    async function fetchScenarios() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') params.set('type', filterType);
        if (filterStreet !== 'all') params.set('street', filterStreet);
        if (filterTexture !== 'all') params.set('texture', filterTexture);

        const res = await fetch(`/api/postflop/scenarios?${params}`);
        const data = await res.json();
        if (data.success) {
          setScenarios(data.scenarios);
          setLabels(data.labels);
          if (data.scenarios.length > 0 && !selectedScenario) {
            setSelectedScenario(data.scenarios[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchScenarios();
  }, [filterType, filterStreet, filterTexture]);

  const renderActionBar = (actions: PostflopAction[]) => {
    const sortedActions = [...actions].sort((a, b) => b.frequency - a.frequency);

    return (
      <div className="action-bar">
        {sortedActions.map((action, i) => (
          <div
            key={i}
            className="action-segment"
            style={{
              width: `${action.frequency}%`,
              backgroundColor: ACTION_COLORS[action.action],
            }}
            title={`${action.action.toUpperCase()} ${action.frequency}%${action.size ? ` (${action.size}% pot)` : ''}`}
          />
        ))}
      </div>
    );
  };

  const renderActionDetails = (actions: PostflopAction[]) => {
    const sortedActions = [...actions].sort((a, b) => b.frequency - a.frequency);

    return (
      <div className="action-details">
        {sortedActions.map((action, i) => (
          <div key={i} className="action-item">
            <span
              className="action-dot"
              style={{ backgroundColor: ACTION_COLORS[action.action] }}
            />
            <span className="action-name">
              {action.action.toUpperCase()}
              {action.size && <span className="action-size"> ({action.size}%)</span>}
            </span>
            <span className="action-freq">{action.frequency}%</span>
            <span className={`action-ev ${action.ev >= 0 ? 'positive' : 'negative'}`}>
              {action.ev >= 0 ? '+' : ''}{action.ev.toFixed(1)} BB
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="postflop-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/" className="back-btn">
            <span>←</span>
          </Link>
          <h1>翻牌后策略库</h1>
        </div>
        <div className="header-right">
          <Link href="/practice?mode=postflop" className="practice-btn">
            开始练习
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Sidebar - Scenario list */}
        <div className="sidebar">
          {/* Filters */}
          <div className="filters">
            <div className="filter-group">
              <label>场景类型</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ScenarioType | 'all')}
              >
                <option value="all">全部场景</option>
                {labels && Object.entries(labels.scenarioTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label.zh}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>街道</label>
              <select
                value={filterStreet}
                onChange={(e) => setFilterStreet(e.target.value as Street | 'all')}
              >
                <option value="all">全部街道</option>
                {Object.entries(STREET_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label.zh}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>牌面质地</label>
              <select
                value={filterTexture}
                onChange={(e) => setFilterTexture(e.target.value as BoardTexture | 'all')}
              >
                <option value="all">全部质地</option>
                {labels && Object.entries(labels.boardTextures).map(([key, label]) => (
                  <option key={key} value={key}>{label.zh}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scenario list */}
          <div className="scenario-list">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : scenarios.length === 0 ? (
              <div className="empty">暂无符合条件的场景</div>
            ) : (
              scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <div className="scenario-title">{scenario.nameZh}</div>
                  <div className="scenario-meta">
                    <span className={`street-badge ${scenario.street}`}>
                      {STREET_LABELS[scenario.street].zh}
                    </span>
                    <span className={`position-badge ${scenario.hasPosition ? 'ip' : 'oop'}`}>
                      {scenario.hasPosition ? 'IP' : 'OOP'}
                    </span>
                    {labels && (
                      <span className="texture-badge">
                        {labels.boardTextures[scenario.boardTexture]?.zh}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main panel - Scenario details */}
        <div className="main-panel">
          {selectedScenario ? (
            <>
              {/* Scenario header */}
              <div className="scenario-header">
                <h2>{selectedScenario.nameZh}</h2>
                <p className="scenario-desc">{selectedScenario.descriptionZh}</p>
                <div className="scenario-badges">
                  <span className={`street-badge ${selectedScenario.street}`}>
                    {STREET_LABELS[selectedScenario.street].zh}
                  </span>
                  <span className={`position-badge ${selectedScenario.hasPosition ? 'ip' : 'oop'}`}>
                    {selectedScenario.hasPosition ? '有位置' : '无位置'}
                  </span>
                  {labels && (
                    <span className="texture-badge">
                      {labels.boardTextures[selectedScenario.boardTexture]?.zh}
                    </span>
                  )}
                </div>
              </div>

              {/* Hand strength selector */}
              <div className="strength-selector">
                <div className="selector-label">选择牌力查看策略</div>
                <div className="strength-tabs">
                  {(Object.keys(STRENGTH_LABELS) as HandStrength[]).map((strength) => (
                    <button
                      key={strength}
                      className={`strength-tab ${selectedStrength === strength ? 'active' : ''}`}
                      style={{
                        borderColor: selectedStrength === strength ? STRENGTH_COLORS[strength] : 'transparent',
                        backgroundColor: selectedStrength === strength ? `${STRENGTH_COLORS[strength]}20` : 'transparent',
                      }}
                      onClick={() => setSelectedStrength(strength)}
                    >
                      <span
                        className="strength-dot"
                        style={{ backgroundColor: STRENGTH_COLORS[strength] }}
                      />
                      {STRENGTH_LABELS[strength].zh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy display */}
              <div className="strategy-panel">
                <div className="strategy-header">
                  <span
                    className="strength-label"
                    style={{ color: STRENGTH_COLORS[selectedStrength] }}
                  >
                    {STRENGTH_LABELS[selectedStrength].zh}
                  </span>
                  策略
                </div>

                {/* Action frequency bar */}
                <div className="action-bar-section">
                  {renderActionBar(selectedScenario.strategies[selectedStrength])}
                </div>

                {/* Action details */}
                {renderActionDetails(selectedScenario.strategies[selectedStrength])}

                {/* All strengths overview */}
                <div className="all-strengths-section">
                  <h3>所有牌力策略概览</h3>
                  <div className="strength-overview-grid">
                    {(Object.keys(STRENGTH_LABELS) as HandStrength[]).map((strength) => (
                      <div
                        key={strength}
                        className={`strength-overview-item ${selectedStrength === strength ? 'active' : ''}`}
                        onClick={() => setSelectedStrength(strength)}
                      >
                        <div className="strength-overview-header">
                          <span
                            className="strength-dot"
                            style={{ backgroundColor: STRENGTH_COLORS[strength] }}
                          />
                          <span>{STRENGTH_LABELS[strength].zh}</span>
                        </div>
                        {renderActionBar(selectedScenario.strategies[strength])}
                        <div className="strength-overview-legend">
                          {selectedScenario.strategies[strength]
                            .filter(a => a.frequency > 0)
                            .sort((a, b) => b.frequency - a.frequency)
                            .slice(0, 3)
                            .map((a, i) => (
                              <span key={i} style={{ color: ACTION_COLORS[a.action] }}>
                                {a.action.charAt(0).toUpperCase()}{a.frequency}%
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips section */}
                {selectedScenario.tips.length > 0 && (
                  <div className="tips-section">
                    <h3>策略要点</h3>
                    <ul className="tips-list">
                      {selectedScenario.tips.map((tip, i) => (
                        <li key={i}>
                          <span className="tip-icon">💡</span>
                          {tip.zh}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>选择一个场景查看策略</h3>
              <p>从左侧列表选择一个翻牌后场景，查看详细的GTO策略分析</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
