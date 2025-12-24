'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './community.css';

// Types
type PostCategory = 'hand_analysis' | 'strategy' | 'question' | 'experience' | 'news';
type SortOption = 'latest' | 'hot' | 'top';

interface Author {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  author: Author;
  handData?: {
    heroHand: string;
    heroPosition: string;
    villainPosition: string;
    board?: string;
    action: string;
    pot: number;
  };
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryLabel {
  en: string;
  zh: string;
  icon: string;
  color: string;
}

export default function CommunityPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryLabel>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        params.set('sort', sortBy);
        params.set('page', page.toString());

        const res = await fetch(`/api/community/posts?${params}`);
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts);
          setCategories(data.labels.categories);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [selectedCategory, sortBy, page]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return t.community.justNow || '刚刚';
    if (hours < 24) return `${hours}${t.community.hoursAgo || '小时前'}`;
    if (days < 7) return `${days}${t.community.daysAgo || '天前'}`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="community-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/" className="back-btn">
            <span>←</span>
          </Link>
          <div>
            <h1>{t.community.title}</h1>
            <p className="header-subtitle">{t.community.subtitle}</p>
          </div>
        </div>
        <Link href="/community/new" className="new-post-btn">
          {t.community.newPost}
        </Link>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Categories */}
          <div className="category-section">
            <h3>{t.community.categories}</h3>
            <div className="category-list">
              <button
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setSelectedCategory('all'); setPage(1); }}
              >
                <span className="category-icon">📋</span>
                <span>{t.community.all}</span>
              </button>
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  className={`category-item ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(key as PostCategory); setPage(1); }}
                  style={{
                    borderColor: selectedCategory === key ? cat.color : 'transparent',
                  }}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.zh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hot Tags */}
          <div className="tags-section">
            <h3>{t.community.hotTags}</h3>
            <div className="tags-cloud">
              {['3-bet', 'C-bet', 'postflop', '新手', '位置', '心得', 'MTT', '河牌'].map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <Link href="/courses" className="quick-link">
              <span>📚</span>
              {t.community.courses}
            </Link>
            <Link href="/practice" className="quick-link">
              <span>🎯</span>
              {t.community.startPractice}
            </Link>
          </div>
        </aside>

        {/* Posts list */}
        <main className="posts-section">
          {/* Sort options */}
          <div className="sort-bar">
            <div className="sort-options">
              {[
                { value: 'latest', label: t.community.recent },
                { value: 'hot', label: t.community.trending },
                { value: 'top', label: t.community.top },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`sort-btn ${sortBy === opt.value ? 'active' : ''}`}
                  onClick={() => { setSortBy(opt.value as SortOption); setPage(1); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="posts-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>{t.community.loading}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>{t.community.noPosts}</h3>
                <p>{t.community.beFirstPost}</p>
              </div>
            ) : (
              posts.map(post => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className={`post-card ${post.isPinned ? 'pinned' : ''}`}
                >
                  {/* Post header */}
                  <div className="post-header">
                    <div className="post-badges">
                      {post.isPinned && (
                        <span className="badge pinned">{t.community.pinned}</span>
                      )}
                      {post.isHot && (
                        <span className="badge hot">{t.community.hot}</span>
                      )}
                      {categories[post.category] && (
                        <span
                          className="badge category"
                          style={{ backgroundColor: categories[post.category].color }}
                        >
                          {categories[post.category].icon} {categories[post.category].zh}
                        </span>
                      )}
                    </div>
                    <span className="post-time">{formatTime(post.createdAt)}</span>
                  </div>

                  {/* Post title */}
                  <h3 className="post-title">{post.title}</h3>

                  {/* Post preview */}
                  <p className="post-preview">
                    {post.content.slice(0, 150)}
                    {post.content.length > 150 && '...'}
                  </p>

                  {/* Hand data if present */}
                  {post.handData && (
                    <div className="hand-preview">
                      <span className="hand-label">{t.community.hand}:</span>
                      <span className="hand-value">{post.handData.heroHand}</span>
                      <span className="hand-label">{t.community.position}:</span>
                      <span className="hand-value">
                        {post.handData.heroPosition} vs {post.handData.villainPosition}
                      </span>
                      {post.handData.board && (
                        <>
                          <span className="hand-label">{t.community.board}:</span>
                          <span className="hand-value">{post.handData.board}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="post-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Post footer */}
                  <div className="post-footer">
                    <div className="author-info">
                      <div className="author-avatar">
                        {post.author.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="author-details">
                        <span className="author-name">{post.author.username}</span>
                        {post.author.title && (
                          <span className="author-title">{post.author.title}</span>
                        )}
                      </div>
                    </div>
                    <div className="post-stats">
                      <span className="stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        {formatNumber(post.likes)}
                      </span>
                      <span className="stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {formatNumber(post.comments)}
                      </span>
                      <span className="stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {formatNumber(post.views)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t.community.prevPage}
              </button>
              <span className="page-info">{page} / {totalPages}</span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t.community.nextPage}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
