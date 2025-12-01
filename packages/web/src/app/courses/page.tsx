'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
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
            <h1>GTO课程</h1>
            <p className="header-subtitle">系统学习德州扑克GTO策略</p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="hero-section">
        <div className="hero-content">
          <h2>从入门到精通</h2>
          <p>结构化的GTO学习路径，包含理论讲解、测验和实战练习</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">{courses.length}</span>
              <span className="stat-label">门课程</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {courses.reduce((sum, c) => sum + c.lessonCount, 0)}
              </span>
              <span className="stat-label">节课</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {courses.reduce((sum, c) => sum + c.estimatedHours, 0)}
              </span>
              <span className="stat-label">小时内容</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Filters */}
        <div className={`filters-section ${isMobileOrTablet ? 'mobile' : ''}`}>
          <div className="filter-group">
            <label>难度级别</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`}
                onClick={() => setFilterLevel('all')}
              >
                全部
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
            <label>课程分类</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                全部
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
              只显示免费课程
            </label>
          </div>
        </div>

        {/* Course grid */}
        <div className="courses-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>加载课程...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>暂无符合条件的课程</h3>
              <p>尝试调整筛选条件</p>
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
                      <span className="free-badge">免费</span>
                    )}
                  </div>
                </div>

                <h3 className="course-title">{course.titleZh}</h3>
                <p className="course-desc">{course.descriptionZh}</p>

                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📚</span>
                    <span>{course.moduleCount} 模块</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📝</span>
                    <span>{course.lessonCount} 节课</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{course.estimatedHours} 小时</span>
                  </div>
                </div>

                <div className="course-objectives">
                  <div className="objectives-label">你将学到：</div>
                  <ul>
                    {course.objectives.slice(0, 3).map((obj, i) => (
                      <li key={i}>{obj.zh}</li>
                    ))}
                  </ul>
                </div>

                <div className="course-footer">
                  <span className="start-btn">
                    开始学习 <span>→</span>
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Learning path section */}
        <div className="learning-path-section">
          <h2>推荐学习路径</h2>
          <div className="path-steps">
            <div className="path-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>翻牌前基础</h4>
                <p>从位置和起手牌选择开始</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>3-Bet进阶</h4>
                <p>学习高级翻前策略</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>C-Bet策略</h4>
                <p>掌握翻牌后持续下注</p>
              </div>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>高级策略</h4>
                <p>精通复杂场景决策</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
