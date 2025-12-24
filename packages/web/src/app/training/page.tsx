'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store';
import { useTranslation } from '@/i18n';

// 30-Day Training Plan Structure
interface TrainingDay {
  day: number;
  title: string;
  description: string;
  focus: string;
  questionsMin: number;
  completed: boolean;
  score?: number;
  completedAt?: string;
}

interface TrainingWeek {
  week: number;
  theme: string;
  description: string;
  days: TrainingDay[];
}

// Training plan curriculum
const TRAINING_CURRICULUM: { week: number; theme: string; description: string; days: Omit<TrainingDay, 'completed' | 'score' | 'completedAt'>[] }[] = [
  {
    week: 1,
    theme: 'RFI基础',
    description: '掌握各位置的开池加注范围',
    days: [
      { day: 1, title: 'UTG开池', description: '学习最紧的开池位置', focus: 'rfi', questionsMin: 15 },
      { day: 2, title: 'HJ开池', description: '劫位的加注范围', focus: 'rfi', questionsMin: 15 },
      { day: 3, title: 'CO开池', description: '截止位的宽松范围', focus: 'rfi', questionsMin: 18 },
      { day: 4, title: 'BTN开池', description: '按钮位的最宽范围', focus: 'rfi', questionsMin: 18 },
      { day: 5, title: 'SB开池', description: '小盲位的特殊策略', focus: 'rfi', questionsMin: 15 },
      { day: 6, title: '综合复习', description: '复习所有RFI位置', focus: 'rfi', questionsMin: 25 },
      { day: 7, title: '周测试', description: 'RFI周测验', focus: 'rfi', questionsMin: 30 },
    ],
  },
  {
    week: 2,
    theme: '面对RFI',
    description: '学习如何对抗加注',
    days: [
      { day: 8, title: 'BB vs UTG', description: '面对最紧范围的防守', focus: 'vs_rfi', questionsMin: 15 },
      { day: 9, title: 'BB vs HJ', description: '面对劫位加注', focus: 'vs_rfi', questionsMin: 15 },
      { day: 10, title: 'BB vs CO', description: '面对截止位加注', focus: 'vs_rfi', questionsMin: 18 },
      { day: 11, title: 'BB vs BTN', description: '面对按钮位加注', focus: 'vs_rfi', questionsMin: 18 },
      { day: 12, title: 'BB vs SB', description: '面对小盲加注', focus: 'vs_rfi', questionsMin: 15 },
      { day: 13, title: '综合复习', description: '复习所有面对RFI场景', focus: 'vs_rfi', questionsMin: 25 },
      { day: 14, title: '周测试', description: '面对RFI周测验', focus: 'vs_rfi', questionsMin: 30 },
    ],
  },
  {
    week: 3,
    theme: '3-Bet策略',
    description: '掌握3-Bet和面对3-Bet的策略',
    days: [
      { day: 15, title: 'BTN vs BB 3-Bet', description: '按钮位面对3-Bet', focus: 'vs_3bet', questionsMin: 18 },
      { day: 16, title: 'CO vs BTN 3-Bet', description: '截止位面对3-Bet', focus: 'vs_3bet', questionsMin: 18 },
      { day: 17, title: 'HJ vs CO 3-Bet', description: '劫位面对3-Bet', focus: 'vs_3bet', questionsMin: 18 },
      { day: 18, title: '混合策略', description: '理解平衡的3-Bet范围', focus: 'vs_3bet', questionsMin: 20 },
      { day: 19, title: '极端范围', description: '面对宽/紧3-Bet', focus: 'vs_3bet', questionsMin: 20 },
      { day: 20, title: '综合复习', description: '复习所有3-Bet场景', focus: 'vs_3bet', questionsMin: 25 },
      { day: 21, title: '周测试', description: '3-Bet周测验', focus: 'vs_3bet', questionsMin: 30 },
    ],
  },
  {
    week: 4,
    theme: '综合实战',
    description: '混合所有场景的高强度训练',
    days: [
      { day: 22, title: '混合场景1', description: 'RFI + 面对RFI', focus: 'mixed', questionsMin: 25 },
      { day: 23, title: '混合场景2', description: '面对RFI + 3-Bet', focus: 'mixed', questionsMin: 25 },
      { day: 24, title: '混合场景3', description: '全场景随机', focus: 'mixed', questionsMin: 30 },
      { day: 25, title: '极限挑战1', description: '高难度边缘牌', focus: 'mixed', questionsMin: 30 },
      { day: 26, title: '极限挑战2', description: '复杂场景决策', focus: 'mixed', questionsMin: 30 },
      { day: 27, title: '模拟比赛', description: '模拟真实比赛环境', focus: 'mixed', questionsMin: 35 },
      { day: 28, title: '期中测试', description: '全面能力检测', focus: 'mixed', questionsMin: 40 },
      { day: 29, title: '巩固复习', description: '针对弱点复习', focus: 'mixed', questionsMin: 30 },
      { day: 30, title: '毕业测试', description: '30天终极测验', focus: 'mixed', questionsMin: 50 },
    ],
  },
];

// Local storage key
const STORAGE_KEY = 'training-plan-30day';

interface TrainingState {
  startDate: string;
  currentDay: number;
  weeks: TrainingWeek[];
  isActive: boolean;
  completedDays: number;
}

function loadTrainingState(): TrainingState | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveTrainingState(state: TrainingState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createInitialState(): TrainingState {
  const today = new Date().toISOString().split('T')[0];
  const weeks: TrainingWeek[] = TRAINING_CURRICULUM.map(w => ({
    ...w,
    days: w.days.map(d => ({
      ...d,
      completed: false,
    })),
  }));

  return {
    startDate: today,
    currentDay: 1,
    weeks,
    isActive: true,
    completedDays: 0,
  };
}

export default function TrainingPlanPage() {
  const { t } = useTranslation();
  const [trainingState, setTrainingState] = useState<TrainingState | null>(null);
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null);

  useEffect(() => {
    const saved = loadTrainingState();
    setTrainingState(saved);
  }, []);

  const startNewTraining = () => {
    const newState = createInitialState();
    setTrainingState(newState);
    saveTrainingState(newState);
  };

  const completeDay = (dayNum: number, score: number) => {
    if (!trainingState) return;

    const updatedWeeks = trainingState.weeks.map(week => ({
      ...week,
      days: week.days.map(day => {
        if (day.day === dayNum) {
          return {
            ...day,
            completed: true,
            score,
            completedAt: new Date().toISOString(),
          };
        }
        return day;
      }),
    }));

    const newState: TrainingState = {
      ...trainingState,
      weeks: updatedWeeks,
      currentDay: Math.min(dayNum + 1, 30),
      completedDays: trainingState.completedDays + 1,
    };

    setTrainingState(newState);
    saveTrainingState(newState);
    setSelectedDay(null);
  };

  // Not started view
  if (!trainingState) {
    return (
      <div className="training-page">
        <div className="start-view">
          <div className="icon">30</div>
          <h1>{t.training.title}</h1>
          <p className="subtitle">{t.training.subtitle}</p>

          <div className="curriculum-preview">
            {TRAINING_CURRICULUM.map((week, i) => (
              <div key={i} className="week-preview">
                <div className="week-header">
                  <span className="week-num">Week {week.week}</span>
                  <span className="week-theme">{week.theme}</span>
                </div>
                <p className="week-desc">{week.description}</p>
              </div>
            ))}
          </div>

          <div className="features">
            <div className="feature">
              <span className="feature-icon">📚</span>
              <span className="feature-text">{t.training.programs.beginner}</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span className="feature-text">{t.training.programs.intermediate}</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">{t.training.programs.advanced}</span>
            </div>
          </div>

          <button className="start-btn" onClick={startNewTraining}>
            {t.training.start}
          </button>

          <Link href="/" className="back-link">
            {t.challenge.backToHome}
          </Link>
        </div>

        <style jsx>{`
          .training-page {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .start-view {
            text-align: center;
            max-width: 600px;
          }

          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #22d3bf 0%, #22c55e 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #000;
            margin: 0 auto 24px;
          }

          h1 {
            font-size: 32px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }

          .subtitle {
            color: #888;
            margin-bottom: 32px;
          }

          .curriculum-preview {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .week-preview {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px;
            text-align: left;
          }

          .week-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }

          .week-num {
            font-size: 11px;
            font-weight: 600;
            color: #22d3bf;
            background: rgba(34, 211, 191, 0.15);
            padding: 4px 8px;
            border-radius: 4px;
          }

          .week-theme {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
          }

          .week-desc {
            font-size: 12px;
            color: #888;
            margin: 0;
          }

          .features {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-bottom: 32px;
          }

          .feature {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #888;
            font-size: 13px;
          }

          .feature-icon {
            font-size: 18px;
          }

          .start-btn {
            width: 100%;
            max-width: 300px;
            padding: 16px;
            background: linear-gradient(135deg, #22d3bf 0%, #22c55e 100%);
            border: none;
            border-radius: 12px;
            color: #000;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 16px;
          }

          .back-link {
            color: #666;
            font-size: 14px;
            text-decoration: none;
          }

          @media (max-width: 640px) {
            .curriculum-preview {
              grid-template-columns: 1fr;
            }
            .features {
              flex-direction: column;
              gap: 12px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Calculate overall progress
  const totalDays = 30;
  const completedDays = trainingState.completedDays;
  const progressPercent = (completedDays / totalDays) * 100;

  // Main training view
  return (
    <div className="training-page">
      <div className="header">
        <Link href="/" className="back-link">← {t.challenge.backToHome}</Link>
        <h1>{t.training.title}</h1>
        <div className="progress-badge">
          {completedDays}/{totalDays}{t.training.days}
        </div>
      </div>

      {/* Overall progress */}
      <div className="overall-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-stats">
          <span>{t.training.completed} {completedDays} {t.training.days}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Weeks */}
      <div className="weeks-container">
        {trainingState.weeks.map((week, weekIdx) => {
          const weekCompleted = week.days.filter(d => d.completed).length;
          const isCurrentWeek = week.days.some(d => d.day === trainingState.currentDay);

          return (
            <div key={weekIdx} className={`week-section ${isCurrentWeek ? 'current' : ''}`}>
              <div className="week-header">
                <div className="week-info">
                  <span className="week-badge">Week {week.week}</span>
                  <span className="week-title">{week.theme}</span>
                </div>
                <span className="week-progress">{weekCompleted}/{week.days.length}</span>
              </div>

              <div className="days-grid">
                {week.days.map((day) => {
                  const isLocked = day.day > trainingState.currentDay;
                  const isCurrent = day.day === trainingState.currentDay;

                  return (
                    <div
                      key={day.day}
                      className={`day-card ${day.completed ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => !isLocked && setSelectedDay(day)}
                    >
                      <div className="day-num">Day {day.day}</div>
                      <div className="day-title">{day.title}</div>
                      <div className="day-questions">{day.questionsMin} {t.training.questions}</div>
                      {day.completed && (
                        <div className="day-score">{day.score}%</div>
                      )}
                      {day.completed && <span className="check-mark">✓</span>}
                      {isLocked && <span className="lock-icon">🔒</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-day">Day {selectedDay.day}</span>
              <h2>{selectedDay.title}</h2>
            </div>
            <p className="modal-desc">{selectedDay.description}</p>
            <div className="modal-info">
              <div className="info-item">
                <span className="info-label">{t.training.questionCount}</span>
                <span className="info-value">{selectedDay.questionsMin} {t.training.questions}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t.training.trainingFocus}</span>
                <span className="info-value">
                  {selectedDay.focus === 'rfi' ? 'RFI开池' :
                   selectedDay.focus === 'vs_rfi' ? '面对RFI' :
                   selectedDay.focus === 'vs_3bet' ? '面对3-Bet' : '综合训练'}
                </span>
              </div>
            </div>

            {selectedDay.completed ? (
              <div className="completed-status">
                <span className="status-icon">✓</span>
                <span>{t.training.completed}</span>
                <span className="status-score">{t.training.score}: {selectedDay.score}%</span>
              </div>
            ) : (
              <Link
                href={`/practice?focus=${selectedDay.focus}&day=${selectedDay.day}`}
                className="start-day-btn"
              >
                {t.training.start}
              </Link>
            )}

            <button className="close-btn" onClick={() => setSelectedDay(null)}>
              {t.common.close}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .training-page {
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
          color: #666;
          text-decoration: none;
          font-size: 14px;
        }

        h1 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #22d3bf 0%, #22c55e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .progress-badge {
          font-size: 14px;
          font-weight: 600;
          color: #22d3bf;
          background: rgba(34, 211, 191, 0.15);
          padding: 6px 12px;
          border-radius: 20px;
        }

        .overall-progress {
          margin-bottom: 32px;
        }

        .progress-bar {
          height: 8px;
          background: #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22d3bf, #22c55e);
          transition: width 0.5s ease;
        }

        .progress-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        }

        .weeks-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .week-section {
          background: #12121a;
          border: 1px solid #1a1a1a;
          border-radius: 16px;
          padding: 20px;
        }

        .week-section.current {
          border-color: #22d3bf;
        }

        .week-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .week-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .week-badge {
          font-size: 11px;
          font-weight: 600;
          color: #22d3bf;
          background: rgba(34, 211, 191, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .week-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .week-progress {
          font-size: 13px;
          color: #888;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .day-card {
          position: relative;
          background: #1a1a2e;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .day-card:hover:not(.locked) {
          border-color: #22d3bf;
          transform: translateY(-2px);
        }

        .day-card.completed {
          background: rgba(34, 211, 191, 0.1);
          border-color: rgba(34, 211, 191, 0.3);
        }

        .day-card.current {
          border-color: #22d3bf;
          box-shadow: 0 0 0 2px rgba(34, 211, 191, 0.2);
        }

        .day-card.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .day-num {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .day-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .day-questions {
          font-size: 11px;
          color: #888;
        }

        .day-score {
          font-size: 12px;
          font-weight: 600;
          color: #22d3bf;
          margin-top: 4px;
        }

        .check-mark {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #22d3bf;
          font-size: 12px;
        }

        .lock-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal-content {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
        }

        .modal-header {
          margin-bottom: 16px;
        }

        .modal-day {
          font-size: 12px;
          color: #22d3bf;
          background: rgba(34, 211, 191, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-top: 12px;
        }

        .modal-desc {
          color: #888;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .modal-info {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }

        .info-item {
          flex: 1;
        }

        .info-label {
          display: block;
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .completed-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 211, 191, 0.1);
          border: 1px solid rgba(34, 211, 191, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          color: #22d3bf;
          margin-bottom: 16px;
        }

        .status-icon {
          font-size: 18px;
        }

        .status-score {
          margin-left: auto;
          font-weight: 600;
        }

        .start-day-btn {
          display: block;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #22d3bf 0%, #22c55e 100%);
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          margin-bottom: 12px;
        }

        .close-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .days-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
