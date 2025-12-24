'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type FocusArea = 'position' | 'street' | 'scenario' | 'hand_type' | 'action';

interface TrainingRecommendation {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  focusArea: FocusArea;
  targetValue: string;
  targetValueZh: string;
  difficulty: DifficultyLevel;
  estimatedQuestions: number;
  priority: number;
  reason: string;
  reasonZh: string;
  practiceUrl: string;
}

interface LearningPath {
  currentLevel: DifficultyLevel;
  nextMilestone: string;
  nextMilestoneZh: string;
  progressPercent: number;
  totalSessionsCompleted: number;
  streak: number;
  recommendations: TrainingRecommendation[];
  dailyGoal: {
    target: number;
    completed: number;
    accuracy: number;
  };
}

interface TrainingData {
  success: boolean;
  learningPath: LearningPath;
  levelLabel: { en: string; zh: string };
}

export default function TrainingRecommendPage() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/training/recommend');
        const result = await response.json();
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || t.training.recommend.loadError);
        }
      } catch (err) {
        setError(t.training.recommend.networkError);
      }
      setLoading(false);
    }
    fetchRecommendations();
  }, [t]);

  const getDifficultyColor = (level: DifficultyLevel): string => {
    const colors: Record<DifficultyLevel, string> = {
      beginner: '#22c55e',
      intermediate: '#f5d000',
      advanced: '#ff9500',
      expert: '#9b5de5',
    };
    return colors[level];
  };

  const getDifficultyLabel = (level: DifficultyLevel): string => {
    return t.training.recommend.difficultyLevel[level];
  };

  const getFocusIcon = (focus: FocusArea): string => {
    const icons: Record<FocusArea, string> = {
      position: '📍',
      street: '🎴',
      scenario: '🎯',
      hand_type: '🃏',
      action: '⚡',
    };
    return icons[focus];
  };

  if (loading) {
    return (
      <div className="training-page loading">
        <div className="loading-spinner" />
        <p>{t.training.recommend.loading}</p>
        <style jsx>{`
          .training-page.loading {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #888;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #333;
            border-top-color: #22d3bf;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="training-page error">
        <div className="error-icon">!</div>
        <p>{error || t.training.recommend.loadError}</p>
        <Link href="/" className="back-link">{t.training.recommend.backToHome}</Link>
        <style jsx>{`
          .training-page.error {
            min-height: 100vh;
            background: #0d0d0d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #888;
          }
          .error-icon {
            width: 48px;
            height: 48px;
            border: 2px solid #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ef4444;
            font-size: 24px;
            margin-bottom: 16px;
          }
          .back-link {
            margin-top: 16px;
            color: #22d3bf;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  const { learningPath } = data;

  return (
    <div className="training-page">
      <div className="header">
        <Link href="/" className="back-link">← {t.common.back}</Link>
        <h1>{t.training.recommend.personalizedTraining}</h1>
        <div className="spacer" />
      </div>

      {/* Level & Progress */}
      <div className="level-card">
        <div className="level-header">
          <div className="level-info">
            <span className="level-label">{t.training.recommend.currentLevel}</span>
            <span
              className="level-value"
              style={{ color: getDifficultyColor(learningPath.currentLevel) }}
            >
              {getDifficultyLabel(learningPath.currentLevel)}
            </span>
          </div>
          <div className="streak-info">
            <span className="streak-value">{learningPath.streak}</span>
            <span className="streak-label">{t.training.recommend.daysStreak}</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>{t.training.recommend.progress}</span>
            <span>{learningPath.progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${learningPath.progressPercent}%` }}
            />
          </div>
          <div className="milestone">
            {t.training.recommend.nextGoal}: {learningPath.nextMilestoneZh}
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="daily-goal-card">
        <h2>{t.training.recommend.dailyGoal}</h2>
        <div className="goal-content">
          <div className="goal-progress">
            <div className="goal-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#333"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22d3bf"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45 * (learningPath.dailyGoal.completed / learningPath.dailyGoal.target)} ${2 * Math.PI * 45}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="goal-text">
                <span className="goal-current">{learningPath.dailyGoal.completed}</span>
                <span className="goal-target">/ {learningPath.dailyGoal.target}</span>
              </div>
            </div>
          </div>
          <div className="goal-stats">
            <div className="goal-stat">
              <span className="stat-value">{learningPath.dailyGoal.accuracy}%</span>
              <span className="stat-label">{t.training.recommend.todayAccuracy}</span>
            </div>
            <div className="goal-stat">
              <span className="stat-value">{learningPath.totalSessionsCompleted}</span>
              <span className="stat-label">{t.training.recommend.totalPracticeSessions}</span>
            </div>
          </div>
        </div>
        <Link href="/practice" className="quick-practice-btn">
          {t.training.recommend.quickPractice}
        </Link>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>{t.training.recommend.targetedRecommendations}</h2>
        <div className="recommendations-list">
          {learningPath.recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <div className="rec-header">
                <span className="rec-icon">{getFocusIcon(rec.focusArea)}</span>
                <div className="rec-title-section">
                  <span className="rec-title">{rec.titleZh}</span>
                  <span
                    className="rec-difficulty"
                    style={{
                      backgroundColor: getDifficultyColor(rec.difficulty) + '20',
                      color: getDifficultyColor(rec.difficulty),
                    }}
                  >
                    {getDifficultyLabel(rec.difficulty)}
                  </span>
                </div>
                <span className="rec-priority">#{rec.priority}</span>
              </div>

              <p className="rec-reason">{rec.reasonZh}</p>

              <div className="rec-meta">
                <span className="rec-questions">
                  {t.training.recommend.estimatedQuestions.replace('{count}', rec.estimatedQuestions.toString())}
                </span>
                <span className="rec-target">{rec.targetValueZh}</span>
              </div>

              <Link href={rec.practiceUrl} className="start-training-btn">
                {t.training.recommend.startTraining}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/practice?mode=random" className="action-btn random">
          <span className="action-icon">🎲</span>
          <span>{t.training.recommend.quickActions.randomPractice}</span>
        </Link>
        <Link href="/report" className="action-btn report">
          <span className="action-icon">📊</span>
          <span>{t.training.recommend.quickActions.weaknessReport}</span>
        </Link>
        <Link href="/challenge" className="action-btn challenge">
          <span className="action-icon">🏆</span>
          <span>{t.training.recommend.quickActions.dailyChallenge}</span>
        </Link>
      </div>

      <style jsx>{`
        .training-page {
          min-height: 100vh;
          background: #0d0d0d;
          padding: 20px;
          padding-bottom: 100px;
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

        /* Level Card */
        .level-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .level-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .level-info {
          display: flex;
          flex-direction: column;
        }

        .level-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 4px;
        }

        .level-value {
          font-size: 28px;
          font-weight: 700;
        }

        .streak-info {
          text-align: right;
        }

        .streak-value {
          font-size: 32px;
          font-weight: 700;
          color: #ff9500;
        }

        .streak-label {
          display: block;
          font-size: 11px;
          color: #888;
        }

        .progress-section {
          margin-top: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22d3bf, #9b5de5);
          border-radius: 4px;
          transition: width 0.3s;
        }

        .milestone {
          font-size: 12px;
          color: #888;
          margin-top: 8px;
        }

        /* Daily Goal Card */
        .daily-goal-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .daily-goal-card h2 {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .goal-content {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 16px;
        }

        .goal-progress {
          flex: 0 0 auto;
        }

        .goal-circle {
          width: 100px;
          height: 100px;
          position: relative;
        }

        .goal-circle svg {
          width: 100%;
          height: 100%;
        }

        .goal-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .goal-current {
          font-size: 24px;
          font-weight: 700;
          color: #22d3bf;
        }

        .goal-target {
          font-size: 14px;
          color: #888;
        }

        .goal-stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-stat {
          display: flex;
          flex-direction: column;
        }

        .goal-stat .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .goal-stat .stat-label {
          font-size: 12px;
          color: #888;
        }

        .quick-practice-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: #22d3bf;
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }

        /* Recommendations */
        .recommendations-section {
          margin-bottom: 24px;
        }

        .recommendations-section h2 {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 16px;
        }

        .rec-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .rec-icon {
          font-size: 24px;
        }

        .rec-title-section {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rec-title {
          font-weight: 600;
          font-size: 15px;
        }

        .rec-difficulty {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .rec-priority {
          font-size: 14px;
          color: #666;
          font-weight: 600;
        }

        .rec-reason {
          font-size: 13px;
          color: #aaa;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .rec-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #888;
        }

        .start-training-btn {
          display: block;
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #9b5de5, #ec4899);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
        }

        .action-icon {
          font-size: 24px;
        }

        .action-btn.random:hover { border-color: #22d3bf; }
        .action-btn.report:hover { border-color: #9b5de5; }
        .action-btn.challenge:hover { border-color: #ff9500; }

        @media (max-width: 640px) {
          .goal-content {
            flex-direction: column;
            text-align: center;
          }

          .goal-stats {
            flex-direction: row;
            justify-content: center;
            gap: 32px;
          }

          .goal-stat {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
