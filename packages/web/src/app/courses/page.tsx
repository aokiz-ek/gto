'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './courses.css';

// Types
type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type CourseCategory = 'preflop' | 'postflop' | 'tournament' | 'mental_game';

interface CourseListItem {
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
}

interface Labels {
  levels: Record<string, { en: string; zh: string; color: string }>;
  categories: Record<string, { en: string; zh: string; icon: string }>;
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [labels, setLabels] = useState<Labels | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLevel, setFilterLevel] = useState<CourseLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<CourseCategory | 'all'>('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterLevel !== 'all') params.set('level', filterLevel);
        if (filterCategory !== 'all') params.set('category', filterCategory);
        if (showFreeOnly) params.set('free', 'true');

        const res = await fetch(`/api/courses?${params}`);
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses);
          setLabels(data.labels);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [filterLevel, filterCategory, showFreeOnly]);

  return (
    <div className="courses-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/" className="back-btn">
            <span>←</span>
          </Link>
          <div>
            <h1>{t.courses.title}</h1>
            <p className="header-subtitle">{t.courses.subtitle}</p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="hero-section">
        <div className="hero-content">
          <h2>{t.courses.heroTitle}</h2>
          <p>{t.courses.heroDescription}</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">{courses.length}</span>
              <span className="stat-label">{t.courses.coursesCount}</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {courses.reduce((sum, c) => sum + c.lessonCount, 0)}
              </span>
              <span className="stat-label">{t.courses.lessonsCount}</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {courses.reduce((sum, c) => sum + c.estimatedHours, 0)}
              </span>
              <span className="stat-label">{t.courses.hoursContent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Filters */}
        <div className={`filters-section ${isMobileOrTablet ? 'mobile' : ''}`}>
          <div className="filter-group">
            <label>{t.courses.difficultyLevel}</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`}
                onClick={() => setFilterLevel('all')}
              >
                {t.courses.all}
              </button>
              {labels && Object.entries(labels.levels).map(([key, label]) => (
                <button
                  key={key}
                  className={`filter-btn ${filterLevel === key ? 'active' : ''}`}
                  style={{
                    borderColor: filterLevel === key ? label.color : 'transparent',
                    color: filterLevel === key ? label.color : 'inherit',
                  }}
                  onClick={() => setFilterLevel(key as CourseLevel)}
                >
                  {label.zh}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>{t.courses.courseCategory}</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                {t.courses.all}
              </button>
              {labels && Object.entries(labels.categories).map(([key, label]) => (
                <button
                  key={key}
                  className={`filter-btn ${filterCategory === key ? 'active' : ''}`}
                  onClick={() => setFilterCategory(key as CourseCategory)}
                >
                  <span>{label.icon}</span> {label.zh}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
              />
              <span className="toggle-switch" />
              {t.courses.showFreeOnly}
            </label>
          </div>
        </div>

        {/* Course grid */}
        <div className="courses-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>{t.courses.loadingCourses}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>{t.courses.noCoursesFound}</h3>
              <p>{t.courses.adjustFilters}</p>
            </div>
          ) : (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="course-card"
              >
                <div className="course-header">
                  <div className="course-badges">
                    {labels && (
                      <>
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
                      </>
                    )}
                    {course.isFree && (
                      <span className="free-badge">{t.courses.free}</span>
                    )}
                  </div>
                </div>

                <h3 className="course-title">{course.titleZh}</h3>
                <p className="course-desc">{course.descriptionZh}</p>

                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📚</span>
                    <span>{course.moduleCount} {t.courses.modules}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📝</span>
                    <span>{course.lessonCount} {t.courses.lessons}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{course.estimatedHours} {t.courses.hours}</span>
                  </div>
                </div>

                <div className="course-objectives">
                  <div className="objectives-label">{t.courses.youWillLearn}</div>
                  <ul>
                    {course.objectives.slice(0, 3).map((obj, i) => (
                      <li key={i}>{obj.zh}</li>
                    ))}
                  </ul>
                </div>

                <div className="course-footer">
                  <span className="start-btn">
                    {t.courses.startCourse} <span>→</span>
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Learning path section */}
        <div className="learning-path-section">
          <h2>{t.courses.recommendedPath}</h2>
          <div className="path-steps">
            <div className="path-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>{t.courses.path1Title}</h4>
                <p>{t.courses.path1Description}</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>{t.courses.path2Title}</h4>
                <p>{t.courses.path2Description}</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>{t.courses.path3Title}</h4>
                <p>{t.courses.path3Description}</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>{t.courses.path4Title}</h4>
                <p>{t.courses.path4Description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
