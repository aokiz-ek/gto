'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import './AICoachFeedback.css';

// Types matching the API
type ErrorSeverity = 'perfect' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
type FeedbackType = 'praise' | 'explanation' | 'correction' | 'tip' | 'common_mistake' | 'advanced';

interface CoachFeedback {
  severity: ErrorSeverity;
  severityLabel: { en: string; zh: string };
  severityColor: string;
  evLossBB: number;
  headline: string;
  headlineZh: string;
  explanation: string;
  explanationZh: string;
  gtoReasoning: string;
  gtoReasoningZh: string;
  tips: { en: string; zh: string }[];
  commonMistake?: { en: string; zh: string };
  advancedNote?: { en: string; zh: string };
  feedbackType: FeedbackType;
}

interface AICoachFeedbackProps {
  handString: string;
  heroPosition: string;
  villainPosition?: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  street: 'preflop' | 'flop' | 'turn' | 'river';
  playerAction: string;
  gtoStrategy: { action: string; frequency: number }[];
  isCorrect: boolean;
  accuracyScore: number;
  board?: string[];
  potSize?: number;
  language?: 'en' | 'zh';
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// Debounce delay for API calls (ms)
const DEBOUNCE_DELAY = 300;

export const AICoachFeedback = memo(function AICoachFeedback({
  handString,
  heroPosition,
  villainPosition,
  scenario,
  street,
  playerAction,
  gtoStrategy,
  isCorrect,
  accuracyScore,
  board,
  potSize,
  language = 'zh',
  expanded = false,
  onToggleExpand,
}: AICoachFeedbackProps) {
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs for debouncing and abort controller
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a stable key from props to detect meaningful changes
  const requestKey = useMemo(() => {
    return JSON.stringify({
      handString,
      heroPosition,
      villainPosition,
      scenario,
      street,
      playerAction,
      gtoStrategy,
      isCorrect,
      accuracyScore,
      board,
      potSize,
    });
  }, [handString, heroPosition, villainPosition, scenario, street, playerAction, gtoStrategy, isCorrect, accuracyScore, board, potSize]);

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/training/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestKey,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }

        const data = await response.json();
        if (data.success) {
          setFeedback(data.feedback);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or deps change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [requestKey]);

  if (loading) {
    return (
      <div className="ai-coach-feedback loading">
        <div className="coach-icon-loading">
          <span className="coach-avatar">AI</span>
          <span className="loading-dots">...</span>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return null;
  }

  const isZh = language === 'zh';

  const severityIcons: Record<ErrorSeverity, string> = {
    perfect: '★',
    best: '◆',
    good: '●',
    inaccuracy: '◇',
    mistake: '△',
    blunder: '✕',
  };

  return (
    <div
      className={`ai-coach-feedback ${feedback.severity} ${expanded ? 'expanded' : ''}`}
      style={{ borderLeftColor: feedback.severityColor }}
    >
      {/* Header with severity badge */}
      <div className="coach-header" onClick={onToggleExpand}>
        <div className="coach-avatar-section">
          <span className="coach-avatar" style={{ borderColor: feedback.severityColor }}>AI</span>
          <div className="coach-title">
            <span className="severity-badge" style={{ backgroundColor: feedback.severityColor }}>
              <span className="severity-icon">{severityIcons[feedback.severity]}</span>
              {isZh ? feedback.severityLabel.zh : feedback.severityLabel.en}
            </span>
            {feedback.evLossBB > 0 && (
              <span className="ev-loss" style={{ color: feedback.severityColor }}>
                -{feedback.evLossBB.toFixed(1)} BB
              </span>
            )}
          </div>
        </div>
        {onToggleExpand && (
          <button className="expand-btn" aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Headline */}
      <div className="coach-headline">
        {isZh ? feedback.headlineZh : feedback.headline}
      </div>

      {/* Main explanation */}
      <div className="coach-explanation">
        {isZh ? feedback.explanationZh : feedback.explanation}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="coach-details">
          {/* GTO Reasoning */}
          {feedback.gtoReasoning && (
            <div className="detail-section gto-reasoning">
              <div className="section-label">
                <span className="label-icon">📊</span>
                {isZh ? 'GTO分析' : 'GTO Analysis'}
              </div>
              <p>{isZh ? feedback.gtoReasoningZh : feedback.gtoReasoning}</p>
            </div>
          )}

          {/* Common Mistake */}
          {feedback.commonMistake && (
            <div className="detail-section common-mistake">
              <div className="section-label">
                <span className="label-icon">⚠️</span>
                {isZh ? '常见错误' : 'Common Mistake'}
              </div>
              <p>{isZh ? feedback.commonMistake.zh : feedback.commonMistake.en}</p>
            </div>
          )}

          {/* Tips */}
          {feedback.tips.length > 0 && (
            <div className="detail-section tips">
              <div className="section-label">
                <span className="label-icon">💡</span>
                {isZh ? '学习建议' : 'Tips'}
              </div>
              <ul>
                {feedback.tips.map((tip, i) => (
                  <li key={i}>{isZh ? tip.zh : tip.en}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Advanced Note */}
          {feedback.advancedNote && (
            <div className="detail-section advanced-note">
              <div className="section-label">
                <span className="label-icon">🎓</span>
                {isZh ? '进阶提示' : 'Advanced Note'}
              </div>
              <p>{isZh ? feedback.advancedNote.zh : feedback.advancedNote.en}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick toggle hint */}
      {!expanded && (feedback.tips.length > 0 || feedback.commonMistake || feedback.gtoReasoning) && (
        <div className="expand-hint" onClick={onToggleExpand}>
          {isZh ? '点击展开详细分析 ▼' : 'Click for detailed analysis ▼'}
        </div>
      )}
    </div>
  );
});

export default AICoachFeedback;
