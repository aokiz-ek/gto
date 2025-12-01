'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import './hands.css';

// Types
interface HandAuthor {
  id: string;
  username: string;
  level: number;
  title?: string;
}

interface HandResult {
  won: boolean;
  amount: number;
  showdown: boolean;
}

interface KeyDecision {
  street: string;
  action: string;
  description: string;
  isCorrect?: boolean;
}

interface SharedHand {
  id: string;
  title: string;
  description: string;
  author: HandAuthor;
  heroHand: string[];
  heroPosition: string;
  blinds: string;
  effectiveStack: number;
  result: HandResult;
  keyDecision?: KeyDecision;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  isFeatured: boolean;
  createdAt: string;
}

type SortOption = 'latest' | 'hot' | 'top' | 'views';

export default function HandsPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [hands, setHands] = useState<SharedHand[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchHands() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('sort', sortBy);
        params.set('page', page.toString());
        if (selectedTag) params.set('tag', selectedTag);

        const res = await fetch(`/api/hands?${params}`);
        const data = await res.json();
        if (data.success) {
          setHands(data.hands);
          setPopularTags(data.popularTags);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch hands:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHands();
  }, [sortBy, selectedTag, page]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getCardDisplay = (cards: string[]) => {
    const suitSymbols: Record<string, string> = {
      s: '\u2660',
      h: '\u2665',
      d: '\u2666',
      c: '\u2663',
    };
    const suitColors: Record<string, string> = {
      s: '#1a1a2e',
      h: '#ef4444',
      d: '#3b82f6',
      c: '#22c55e',
    };

    return cards.map((card, i) => {
      const rank = card.slice(0, -1);
      const suit = card.slice(-1);
      return (
        <span
          key={i}
          className="card-display"
          style={{ color: suitColors[suit] }}
        >
          {rank}{suitSymbols[suit]}
        </span>
      );
    });
  };

  return (
    <div className="hands-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/" className="back-btn">
            <span>&larr;</span>
          </Link>
          <div>
            <h1>牌谱分享</h1>
            <p className="header-subtitle">分享你的精彩牌局，学习他人的策略</p>
          </div>
        </div>
        <Link href="/hands/share" className="share-btn">
          分享牌谱
        </Link>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Sort options */}
          <div className="sort-section">
            <h3>排序</h3>
            <div className="sort-list">
              {[
                { value: 'latest', label: '最新', icon: '&#128337;' },
                { value: 'hot', label: '热门', icon: '&#128293;' },
                { value: 'top', label: '最赞', icon: '&#128077;' },
                { value: 'views', label: '浏览量', icon: '&#128065;' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`sort-item ${sortBy === opt.value ? 'active' : ''}`}
                  onClick={() => { setSortBy(opt.value as SortOption); setPage(1); }}
                  dangerouslySetInnerHTML={{ __html: `${opt.icon} ${opt.label}` }}
                />
              ))}
            </div>
          </div>

          {/* Popular tags */}
          <div className="tags-section">
            <h3>热门标签</h3>
            <div className="tags-cloud">
              {selectedTag && (
                <button
                  className="tag-clear"
                  onClick={() => { setSelectedTag(null); setPage(1); }}
                >
                  清除筛选
                </button>
              )}
              {popularTags.map(tag => (
                <button
                  key={tag}
                  className={`tag ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => { setSelectedTag(tag === selectedTag ? null : tag); setPage(1); }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Featured hands */}
          <div className="featured-section">
            <h3>精选牌谱</h3>
            <div className="featured-list">
              {hands.filter(h => h.isFeatured).slice(0, 3).map(hand => (
                <Link key={hand.id} href={`/hands/${hand.id}`} className="featured-item">
                  <div className="featured-cards">{getCardDisplay(hand.heroHand)}</div>
                  <span className="featured-title">{hand.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Hands list */}
        <main className="hands-section">
          {/* Results info */}
          <div className="results-bar">
            <span className="results-count">
              {selectedTag ? `"${selectedTag}" 相关牌谱` : '全部牌谱'} ({hands.length})
            </span>
          </div>

          {/* Hands list */}
          <div className="hands-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>加载中...</p>
              </div>
            ) : hands.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#127183;</div>
                <h3>暂无牌谱</h3>
                <p>成为第一个分享牌谱的人吧！</p>
              </div>
            ) : (
              hands.map(hand => (
                <Link key={hand.id} href={`/hands/${hand.id}`} className="hand-card">
                  {/* Hand header */}
                  <div className="hand-header">
                    <div className="hand-badges">
                      {hand.isFeatured && <span className="badge featured">精选</span>}
                      {hand.isHot && <span className="badge hot">热门</span>}
                      <span className="badge position">{hand.heroPosition}</span>
                    </div>
                    <span className="hand-time">{formatTime(hand.createdAt)}</span>
                  </div>

                  {/* Hand cards */}
                  <div className="hand-cards">
                    {getCardDisplay(hand.heroHand)}
                  </div>

                  {/* Hand title */}
                  <h3 className="hand-title">{hand.title}</h3>

                  {/* Hand preview */}
                  <p className="hand-preview">
                    {hand.description.slice(0, 100)}
                    {hand.description.length > 100 && '...'}
                  </p>

                  {/* Key decision */}
                  {hand.keyDecision && (
                    <div className="key-decision">
                      <span className="decision-label">关键决策:</span>
                      <span className="decision-desc">{hand.keyDecision.description}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {hand.tags.length > 0 && (
                    <div className="hand-tags">
                      {hand.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="hand-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Hand footer */}
                  <div className="hand-footer">
                    <div className="author-info">
                      <div className="author-avatar">
                        {hand.author.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="author-details">
                        <span className="author-name">{hand.author.username}</span>
                        {hand.author.title && (
                          <span className="author-title">{hand.author.title}</span>
                        )}
                      </div>
                    </div>
                    <div className="hand-stats">
                      <span className="stat">
                        <span dangerouslySetInnerHTML={{ __html: '&#128077;' }} />
                        {formatNumber(hand.likes)}
                      </span>
                      <span className="stat">
                        <span dangerouslySetInnerHTML={{ __html: '&#128172;' }} />
                        {formatNumber(hand.comments)}
                      </span>
                      <span className="stat">
                        <span dangerouslySetInnerHTML={{ __html: '&#128065;' }} />
                        {formatNumber(hand.views)}
                      </span>
                    </div>
                  </div>

                  {/* Result indicator */}
                  <div className={`result-indicator ${hand.result.won ? 'won' : 'lost'}`}>
                    {hand.result.won ? '+' : ''}{hand.result.amount}BB
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
                上一页
              </button>
              <span className="page-info">{page} / {totalPages}</span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
