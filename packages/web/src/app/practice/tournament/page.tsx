'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TOURNAMENT_TYPES,
  TOURNAMENT_STAGES,
  TOURNAMENT_SCENARIOS,
  STACK_DEPTHS,
  TournamentType,
  TournamentStage,
  filterScenarios,
  getStackDepth,
  type TournamentScenario,
} from '@/config/tournament';
import { useResponsive } from '@/hooks';
import './tournament.css';

export default function TournamentPracticePage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [selectedType, setSelectedType] = useState<TournamentType | null>(null);
  const [selectedStage, setSelectedStage] = useState<TournamentStage | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<TournamentScenario | null>(null);

  // 根据筛选条件获取场景
  const filteredScenarios = filterScenarios({
    type: selectedType || undefined,
    stage: selectedStage || undefined,
  });

  // 获取可用的阶段（根据选中的类型）
  const availableStages = selectedType
    ? TOURNAMENT_TYPES.find(t => t.id === selectedType)?.stages || []
    : Object.keys(TOURNAMENT_STAGES) as TournamentStage[];

  const handleStartPractice = (scenario: TournamentScenario) => {
    setSelectedScenario(scenario);
    // 这里可以导航到练习页面或打开练习模态框
  };

  return (
    <div className="tournament-page">
      <div className="tournament-container">
        {/* 头部 */}
        <header className="tournament-header">
          <div className="header-left">
            <Link href="/practice" className="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              返回练习
            </Link>
            <h1 className="tournament-title">锦标赛练习</h1>
            <p className="tournament-subtitle">MTT、SNG、PKO 等锦标赛场景专项训练</p>
          </div>
        </header>

        {/* 锦标赛类型选择 */}
        <section className="type-section">
          <h2 className="section-title">选择锦标赛类型</h2>
          <div className="type-grid">
            {TOURNAMENT_TYPES.map((type) => (
              <button
                key={type.id}
                className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedType(selectedType === type.id ? null : type.id);
                  setSelectedStage(null);
                }}
              >
                <span className="type-icon">{type.icon}</span>
                <div className="type-info">
                  <span className="type-name">{type.nameCn}</span>
                  <span className="type-desc">{type.name}</span>
                </div>
                {selectedType === type.id && (
                  <span className="type-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 阶段筛选 */}
        <section className="stage-section">
          <h2 className="section-title">锦标赛阶段</h2>
          <div className="stage-tabs">
            <button
              className={`stage-tab ${!selectedStage ? 'active' : ''}`}
              onClick={() => setSelectedStage(null)}
            >
              全部阶段
            </button>
            {availableStages.map((stageId) => {
              const stage = TOURNAMENT_STAGES[stageId];
              return (
                <button
                  key={stageId}
                  className={`stage-tab ${selectedStage === stageId ? 'active' : ''}`}
                  onClick={() => setSelectedStage(stageId)}
                >
                  {stage.nameCn}
                </button>
              );
            })}
          </div>
        </section>

        {/* 筹码深度快速参考 */}
        <section className="stack-reference">
          <h3 className="reference-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            筹码深度参考
          </h3>
          <div className="stack-chips">
            {['micro', 'short', 'medium', 'deep'].map((cat) => {
              const stacks = STACK_DEPTHS.filter(s => s.category === cat);
              const labels: Record<string, string> = {
                micro: '微筹码 (<10bb)',
                short: '短筹码 (10-20bb)',
                medium: '中等 (25-50bb)',
                deep: '深筹码 (60bb+)',
              };
              return (
                <div key={cat} className="stack-category">
                  <span className="stack-cat-label">{labels[cat]}</span>
                  <div className="stack-values">
                    {stacks.slice(0, 3).map(s => (
                      <span key={s.id} className="stack-chip">{s.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 场景列表 */}
        <section className="scenarios-section">
          <div className="scenarios-header">
            <h2 className="section-title">
              练习场景
              <span className="count-badge">{filteredScenarios.length}</span>
            </h2>
          </div>

          {filteredScenarios.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <p>暂无匹配的场景</p>
              <button
                className="reset-btn"
                onClick={() => {
                  setSelectedType(null);
                  setSelectedStage(null);
                }}
              >
                重置筛选
              </button>
            </div>
          ) : (
            <div className="scenarios-grid">
              {filteredScenarios.map((scenario) => {
                const typeConfig = TOURNAMENT_TYPES.find(t => t.id === scenario.type);
                const stageConfig = TOURNAMENT_STAGES[scenario.stage];
                const stackConfig = getStackDepth(scenario.stackDepth);

                return (
                  <div key={scenario.id} className="scenario-card">
                    <div className="scenario-header">
                      <span className="scenario-type-badge" data-type={scenario.type}>
                        {typeConfig?.icon} {typeConfig?.name}
                      </span>
                      <span className="scenario-stage-badge" data-stage={scenario.stage}>
                        {stageConfig?.nameCn}
                      </span>
                    </div>

                    <h3 className="scenario-title">{scenario.descriptionCn}</h3>

                    <div className="scenario-details">
                      <div className="detail-item">
                        <span className="detail-label">筹码深度</span>
                        <span className="detail-value">{stackConfig?.labelCn}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">ICM压力</span>
                        <span className="detail-value icm" data-level={
                          scenario.icmAdjustment >= 0.8 ? 'high' :
                          scenario.icmAdjustment >= 0.4 ? 'medium' : 'low'
                        }>
                          {Math.round(scenario.icmAdjustment * 100)}%
                        </span>
                      </div>
                      {scenario.playersRemaining && (
                        <div className="detail-item">
                          <span className="detail-label">剩余玩家</span>
                          <span className="detail-value">{scenario.playersRemaining}人</span>
                        </div>
                      )}
                      {scenario.bountyMultiplier && (
                        <div className="detail-item">
                          <span className="detail-label">赏金倍数</span>
                          <span className="detail-value bounty">{scenario.bountyMultiplier}x</span>
                        </div>
                      )}
                    </div>

                    <div className="scenario-notes">
                      <span className="notes-label">策略要点</span>
                      <ul className="notes-list">
                        {scenario.strategyNotesCn.slice(0, 2).map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className="start-btn"
                      onClick={() => handleStartPractice(scenario)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      开始练习
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 选中场景详情模态框 */}
        {selectedScenario && (
          <div className="scenario-modal-overlay" onClick={() => setSelectedScenario(null)}>
            <div className="scenario-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedScenario(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="modal-content">
                <h2 className="modal-title">{selectedScenario.descriptionCn}</h2>
                <p className="modal-desc">{selectedScenario.description}</p>

                <div className="modal-info-grid">
                  <div className="info-card">
                    <span className="info-label">锦标赛类型</span>
                    <span className="info-value">
                      {TOURNAMENT_TYPES.find(t => t.id === selectedScenario.type)?.nameCn}
                    </span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">阶段</span>
                    <span className="info-value">
                      {TOURNAMENT_STAGES[selectedScenario.stage].nameCn}
                    </span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">筹码深度</span>
                    <span className="info-value">
                      {getStackDepth(selectedScenario.stackDepth)?.labelCn}
                    </span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">ICM调整</span>
                    <span className="info-value">
                      {Math.round(selectedScenario.icmAdjustment * 100)}%
                    </span>
                  </div>
                </div>

                <div className="modal-notes">
                  <h3>策略要点</h3>
                  <ul>
                    {selectedScenario.strategyNotesCn.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-actions">
                  <Link
                    href={`/practice?mode=tournament&scenario=${selectedScenario.id}`}
                    className="modal-start-btn"
                  >
                    开始练习
                  </Link>
                  <button
                    className="modal-cancel-btn"
                    onClick={() => setSelectedScenario(null)}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
