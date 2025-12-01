'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import './course-detail.css';

// Types
type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type CourseCategory = 'preflop' | 'postflop' | 'tournament' | 'mental_game';
type LessonType = 'theory' | 'quiz' | 'practice' | 'video';

interface Quiz {
  question: string;
  questionZh: string;
  options: { en: string; zh: string }[];
  correctIndex: number;
  explanation: string;
  explanationZh: string;
}

interface Lesson {
  id: string;
  title: string;
  titleZh: string;
  type: LessonType;
  duration: number;
  content?: string;
  contentZh?: string;
  quizzes?: Quiz[];
  practiceConfig?: {
    scenario: string;
    questionCount: number;
    targetAccuracy: number;
  };
}

interface Module {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  level: CourseLevel;
  category: CourseCategory;
  estimatedHours: number;
  moduleCount: number;
  lessonCount: number;
  objectives: { en: string; zh: string }[];
  tags: string[];
  isFree: boolean;
  modules: Module[];
}

interface Labels {
  levels: Record<string, { en: string; zh: string; color: string }>;
  categories: Record<string, { en: string; zh: string; icon: string }>;
}

// Lesson type icons
const LESSON_TYPE_ICONS: Record<LessonType, string> = {
  theory: '📖',
  quiz: '❓',
  practice: '🎯',
  video: '🎬',
};

const LESSON_TYPE_LABELS: Record<LessonType, { en: string; zh: string }> = {
  theory: { en: 'Theory', zh: '理论' },
  quiz: { en: 'Quiz', zh: '测验' },
  practice: { en: 'Practice', zh: '练习' },
  video: { en: 'Video', zh: '视频' },
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isMobile, isMobileOrTablet } = useResponsive();

  const [course, setCourse] = useState<Course | null>(null);
  const [labels, setLabels] = useState<Labels | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses?id=${params.id}`);
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
          setLabels(data.labels);
          // Expand first module by default
          if (data.course.modules.length > 0) {
            setExpandedModules(new Set([data.course.modules[0].id]));
          }
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchCourse();
    }
  }, [params.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore({ correct: 0, total: 0 });
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !selectedLesson?.quizzes) return;

    const currentQuiz = selectedLesson.quizzes[quizIndex];
    const isCorrect = selectedAnswer === currentQuiz.correctIndex;

    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setShowResult(true);
  };

  const handleNextQuiz = () => {
    if (!selectedLesson?.quizzes) return;

    if (quizIndex < selectedLesson.quizzes.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleStartPractice = () => {
    if (!selectedLesson?.practiceConfig) return;
    router.push(`/practice?scenario=${selectedLesson.practiceConfig.scenario}`);
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/courses" className="back-btn">
              <span>←</span>
            </Link>
            <h1>加载中...</h1>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>加载课程...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/courses" className="back-btn">
              <span>←</span>
            </Link>
            <h1>课程未找到</h1>
          </div>
        </header>
        <div className="empty-container">
          <div className="empty-icon">📚</div>
          <h3>课程不存在</h3>
          <p>请返回课程列表选择其他课程</p>
          <Link href="/courses" className="back-link">返回课程列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/courses" className="back-btn">
            <span>←</span>
          </Link>
          <div>
            <h1>{course.titleZh}</h1>
            {labels && (
              <div className="header-badges">
                <span
                  className="level-badge"
                  style={{ backgroundColor: labels.levels[course.level]?.color }}
                >
                  {labels.levels[course.level]?.zh}
                </span>
                <span className="category-badge">
                  {labels.categories[course.category]?.icon}{' '}
                  {labels.categories[course.category]?.zh}
                </span>
                {course.isFree && <span className="free-badge">免费</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Sidebar - Course outline */}
        <div className="sidebar">
          <div className="course-info">
            <p className="course-desc">{course.descriptionZh}</p>
            <div className="course-stats">
              <div className="stat-item">
                <span className="stat-icon">📚</span>
                <span>{course.moduleCount} 模块</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📝</span>
                <span>{course.lessonCount} 节课</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⏱️</span>
                <span>{course.estimatedHours} 小时</span>
              </div>
            </div>
          </div>

          <div className="course-outline">
            <h3>课程大纲</h3>
            <div className="modules-list">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="module-item">
                  <div
                    className={`module-header ${expandedModules.has(module.id) ? 'expanded' : ''}`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span className="module-number">{moduleIndex + 1}</span>
                    <span className="module-title">{module.titleZh}</span>
                    <span className="module-toggle">
                      {expandedModules.has(module.id) ? '−' : '+'}
                    </span>
                  </div>

                  {expandedModules.has(module.id) && (
                    <div className="lessons-list">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`lesson-item ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                          onClick={() => handleSelectLesson(lesson)}
                        >
                          <span className="lesson-icon">
                            {LESSON_TYPE_ICONS[lesson.type]}
                          </span>
                          <span className="lesson-title">{lesson.titleZh}</span>
                          <span className="lesson-duration">{lesson.duration}分钟</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main panel - Lesson content */}
        <div className="main-panel">
          {selectedLesson ? (
            <div className="lesson-content">
              <div className="lesson-header">
                <div className="lesson-type-badge">
                  {LESSON_TYPE_ICONS[selectedLesson.type]}{' '}
                  {LESSON_TYPE_LABELS[selectedLesson.type].zh}
                </div>
                <h2>{selectedLesson.titleZh}</h2>
              </div>

              {/* Theory content */}
              {selectedLesson.type === 'theory' && selectedLesson.contentZh && (
                <div className="theory-content">
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: selectedLesson.contentZh
                        .replace(/## (.*)/g, '<h2>$1</h2>')
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n- (.*)/g, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.*)$/, '<p>$1</p>')
                    }}
                  />
                </div>
              )}

              {/* Quiz content */}
              {selectedLesson.type === 'quiz' && selectedLesson.quizzes && (
                <div className="quiz-content">
                  <div className="quiz-progress">
                    问题 {quizIndex + 1} / {selectedLesson.quizzes.length}
                    {quizScore.total > 0 && (
                      <span className="quiz-score">
                        得分: {quizScore.correct}/{quizScore.total}
                      </span>
                    )}
                  </div>

                  <div className="quiz-question">
                    <p>{selectedLesson.quizzes[quizIndex].questionZh}</p>
                  </div>

                  <div className="quiz-options">
                    {selectedLesson.quizzes[quizIndex].options.map((option, i) => (
                      <button
                        key={i}
                        className={`quiz-option ${selectedAnswer === i ? 'selected' : ''} ${
                          showResult
                            ? i === selectedLesson.quizzes![quizIndex].correctIndex
                              ? 'correct'
                              : selectedAnswer === i
                              ? 'incorrect'
                              : ''
                            : ''
                        }`}
                        onClick={() => handleAnswerSelect(i)}
                        disabled={showResult}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="option-text">{option.zh}</span>
                      </button>
                    ))}
                  </div>

                  {showResult && (
                    <div className={`quiz-result ${
                      selectedAnswer === selectedLesson.quizzes[quizIndex].correctIndex
                        ? 'correct'
                        : 'incorrect'
                    }`}>
                      <div className="result-header">
                        {selectedAnswer === selectedLesson.quizzes[quizIndex].correctIndex
                          ? '✓ 正确!'
                          : '✗ 错误'}
                      </div>
                      <p className="result-explanation">
                        {selectedLesson.quizzes[quizIndex].explanationZh}
                      </p>
                    </div>
                  )}

                  <div className="quiz-actions">
                    {!showResult ? (
                      <button
                        className="submit-btn"
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                      >
                        提交答案
                      </button>
                    ) : quizIndex < selectedLesson.quizzes.length - 1 ? (
                      <button className="next-btn" onClick={handleNextQuiz}>
                        下一题 →
                      </button>
                    ) : (
                      <div className="quiz-complete">
                        <p>测验完成! 最终得分: {quizScore.correct}/{quizScore.total}</p>
                        <button
                          className="restart-btn"
                          onClick={() => {
                            setQuizIndex(0);
                            setSelectedAnswer(null);
                            setShowResult(false);
                            setQuizScore({ correct: 0, total: 0 });
                          }}
                        >
                          重新开始
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Practice content */}
              {selectedLesson.type === 'practice' && selectedLesson.practiceConfig && (
                <div className="practice-content">
                  <div className="practice-info">
                    <h3>实战练习</h3>
                    <p>通过练习巩固所学知识，将理论应用到实际场景中。</p>

                    <div className="practice-config">
                      <div className="config-item">
                        <span className="config-label">练习场景</span>
                        <span className="config-value">
                          {selectedLesson.practiceConfig.scenario}
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="config-label">题目数量</span>
                        <span className="config-value">
                          {selectedLesson.practiceConfig.questionCount} 题
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="config-label">目标准确率</span>
                        <span className="config-value">
                          {selectedLesson.practiceConfig.targetAccuracy}%
                        </span>
                      </div>
                    </div>

                    <button className="start-practice-btn" onClick={handleStartPractice}>
                      开始练习 →
                    </button>
                  </div>
                </div>
              )}

              {/* Video placeholder */}
              {selectedLesson.type === 'video' && (
                <div className="video-content">
                  <div className="video-placeholder">
                    <div className="video-icon">🎬</div>
                    <p>视频内容即将上线</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-lesson">
              <div className="empty-icon">📖</div>
              <h3>选择一节课开始学习</h3>
              <p>从左侧课程大纲中选择一节课程开始学习</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
