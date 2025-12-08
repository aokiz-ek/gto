'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PokerCard } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card as CardType } from '@gto/core';
import { useResponsive } from '@/hooks';
import './history.css';

interface HandHistory {
  id: string;
  hero_hand: string;
  board: string;
  hero_position: string;
  villain_position: string | null;
  pot_size: number;
  stack_size: number;
  street: string;
  analysis_result: {
    equity?: number;
    ev?: number;
    recommendedAction?: string;
  } | null;
  notes: string | null;
  created_at: string;
  is_favorite?: boolean;
}

type FilterType = 'all' | 'preflop' | 'flop' | 'turn' | 'river';
type SortType = 'newest' | 'oldest' | 'equity_high' | 'equity_low' | 'ev_high' | 'ev_low';
type ViewType = 'list' | 'grid';

const POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const STREETS = ['preflop', 'flop', 'turn', 'river'];
const ITEMS_PER_PAGE = 20;

export default function HistoryPage() {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [histories, setHistories] = useState<HandHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [streetFilter, setStreetFilter] = useState<FilterType>('all');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination / Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);

  // Touch/swipe handling
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Long press for selection mode
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  // Import file input ref
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHistories();
  }, []);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortDropdown(false);
      setShowPositionDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const fetchHistories = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.histories) {
        setHistories(data.histories);
      }
    } catch (error) {
      console.error('Failed to fetch histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id: string) => {
    if (!confirm('确定要删除这手牌吗？')) return;

    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistories(histories.filter(h => h.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 手牌吗？`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/history?id=${id}`, { method: 'DELETE' })
        )
      );
      setHistories(histories.filter(h => !selectedIds.has(h.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete histories:', error);
    }
  };

  const exportSelected = () => {
    const selectedHistories = histories.filter(h => selectedIds.has(h.id));
    const dataStr = JSON.stringify(selectedHistories, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hand-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const handsToImport = Array.isArray(imported) ? imported : [imported];

      // Validate and save imported hands
      for (const hand of handsToImport) {
        if (hand.hero_hand && hand.board !== undefined) {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              heroHand: hand.hero_hand,
              board: hand.board,
              heroPosition: hand.hero_position || 'BTN',
              villainPosition: hand.villain_position,
              potSize: hand.pot_size || 0,
              stackSize: hand.stack_size || 100,
              street: hand.street || 'preflop',
              analysisResult: hand.analysis_result,
              notes: hand.notes,
            }),
          });
        }
      }

      // Refresh histories
      fetchHistories();
      alert(`成功导入 ${handsToImport.length} 手牌`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请检查文件格式');
    }

    // Reset input
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const history = histories.find(h => h.id === id);
    if (!history) return;

    const newFavoriteStatus = !history.is_favorite;

    // Optimistic update
    setHistories(prev =>
      prev.map(h =>
        h.id === id ? { ...h, is_favorite: newFavoriteStatus } : h
      )
    );

    // Update on server (if API supports it)
    try {
      await fetch(`/api/history/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: newFavoriteStatus }),
      });
    } catch {
      // Revert on error
      setHistories(prev =>
        prev.map(h =>
          h.id === id ? { ...h, is_favorite: !newFavoriteStatus } : h
        )
      );
    }
  };

  // Touch handlers for swipe to delete
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    // Long press detection
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      toggleSelect(id);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!isMobile) return;

    // Cancel long press if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setSwipingId(id);
      // Only allow left swipe (negative values)
      setSwipeOffset(Math.min(0, Math.max(-80, deltaX)));
    }
  };

  const handleTouchEnd = (id: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (swipeOffset < -50) {
      // Show delete action
      setSwipeOffset(-80);
    } else {
      // Reset
      setSwipingId(null);
      setSwipeOffset(0);
    }
  };

  const resetSwipe = () => {
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const parseHeroHand = (handStr: string): [CardType, CardType] | null => {
    try {
      if (handStr.length >= 4) {
        return [
          parseCard(handStr.slice(0, 2)),
          parseCard(handStr.slice(2, 4)),
        ];
      }
    } catch {
      return null;
    }
    return null;
  };

  const parseBoard = (boardStr: string): CardType[] => {
    const cards: CardType[] = [];
    try {
      for (let i = 0; i < boardStr.length; i += 2) {
        if (i + 1 < boardStr.length) {
          cards.push(parseCard(boardStr.slice(i, i + 2)));
        }
      }
    } catch {
      return [];
    }
    return cards;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatDate(dateStr);
  };

  const getDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (histories.length === 0) {
      return { totalHands: 0, avgEquity: 0, totalEV: 0, winRate: 0 };
    }

    const withEquity = histories.filter(h => h.analysis_result?.equity);
    const withEV = histories.filter(h => h.analysis_result?.ev !== undefined);

    const avgEquity = withEquity.length > 0
      ? withEquity.reduce((sum, h) => sum + (h.analysis_result?.equity || 0), 0) / withEquity.length
      : 0;

    const totalEV = withEV.reduce((sum, h) => sum + (h.analysis_result?.ev || 0), 0);

    const positiveEV = withEV.filter(h => (h.analysis_result?.ev || 0) > 0).length;
    const winRate = withEV.length > 0 ? positiveEV / withEV.length : 0;

    return {
      totalHands: histories.length,
      avgEquity,
      totalEV,
      winRate,
    };
  }, [histories]);

  // Get street counts
  const streetCounts = useMemo(() => {
    const counts: Record<string, number> = { all: histories.length };
    STREETS.forEach(street => {
      counts[street] = histories.filter(h => h.street.toLowerCase() === street).length;
    });
    return counts;
  }, [histories]);

  // Filtered and sorted histories
  const filteredHistories = useMemo(() => {
    let result = [...histories];

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter(h => h.is_favorite);
    }

    // Filter by street
    if (streetFilter !== 'all') {
      result = result.filter(h => h.street.toLowerCase() === streetFilter);
    }

    // Filter by position
    if (positionFilter) {
      result = result.filter(h => h.hero_position === positionFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.hero_hand.toLowerCase().includes(query) ||
        h.board.toLowerCase().includes(query) ||
        h.notes?.toLowerCase().includes(query) ||
        h.hero_position.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'equity_high':
        result.sort((a, b) => (b.analysis_result?.equity || 0) - (a.analysis_result?.equity || 0));
        break;
      case 'equity_low':
        result.sort((a, b) => (a.analysis_result?.equity || 0) - (b.analysis_result?.equity || 0));
        break;
      case 'ev_high':
        result.sort((a, b) => (b.analysis_result?.ev || 0) - (a.analysis_result?.ev || 0));
        break;
      case 'ev_low':
        result.sort((a, b) => (a.analysis_result?.ev || 0) - (b.analysis_result?.ev || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [histories, streetFilter, positionFilter, searchQuery, sortBy, showFavoritesOnly]);

  // Paginated histories for display
  const paginatedHistories = useMemo(() => {
    const endIndex = page * ITEMS_PER_PAGE;
    const result = filteredHistories.slice(0, endIndex);
    setHasMore(endIndex < filteredHistories.length);
    return result;
  }, [filteredHistories, page]);

  // Group by date for timeline view
  const groupedHistories = useMemo(() => {
    const groups: { date: string; items: HandHistory[] }[] = [];
    let currentDate = '';

    filteredHistories.forEach(history => {
      const date = getDateGroup(history.created_at);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, items: [] });
      }
      groups[groups.length - 1].items.push(history);
    });

    return groups;
  }, [filteredHistories]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredHistories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistories.map(h => h.id)));
    }
  };

  const getEquityClass = (equity: number) => {
    if (equity >= 0.6) return 'high';
    if (equity >= 0.4) return 'medium';
    return 'low';
  };

  const getActionClass = (action?: string) => {
    if (!action) return '';
    const lower = action.toLowerCase();
    if (lower.includes('raise') || lower.includes('bet')) return 'raise';
    if (lower.includes('call')) return 'call';
    if (lower.includes('fold')) return 'fold';
    if (lower.includes('check')) return 'check';
    if (lower.includes('all-in') || lower.includes('allin')) return 'all-in';
    return '';
  };

  const getStreetLabel = (street: string) => {
    const labels: Record<string, string> = {
      preflop: '翻牌前',
      flop: '翻牌',
      turn: '转牌',
      river: '河牌',
    };
    return labels[street.toLowerCase()] || street;
  };

  // Skeleton loading component
  const renderSkeleton = () => (
    <div className="history-page">
      <header className="history-header">
        <div className="header-top">
          <div className="header-title-section">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-subtitle" />
          </div>
        </div>
        <div className="stats-dashboard">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton skeleton-icon" />
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-value" />
            </div>
          ))}
        </div>
      </header>
      <div className="history-content">
        <div className="history-list-section">
          <div className="history-list list-view">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="history-card skeleton-card">
                <div className="skeleton skeleton-cards" />
                <div className="card-info">
                  <div className="skeleton skeleton-badges" />
                  <div className="skeleton skeleton-board" />
                  <div className="skeleton skeleton-info" />
                </div>
                <div className="skeleton skeleton-result" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="history-page">
      {/* Hidden import input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {/* Header */}
      <header className="history-header">
        <div className="header-top">
          <div className="header-title-section">
            <div className="title-row">
              <Link href="/" className="back-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="page-title">牌局历史</h1>
            </div>
            <p className="page-subtitle">
              回顾和分析你保存的牌局
              {filteredHistories.length !== histories.length && (
                <span className="result-count">
                  · 显示 {filteredHistories.length} / {histories.length} 条
                </span>
              )}
            </p>
          </div>
          <div className="header-actions">
            {selectedIds.size > 0 ? (
              <>
                <button className="action-btn" onClick={exportSelected}>
                  <span>📤</span>
                  导出 ({selectedIds.size})
                </button>
                <button className="action-btn danger" onClick={deleteSelected}>
                  <span>🗑️</span>
                  删除
                </button>
                <button className="action-btn" onClick={() => { setSelectedIds(new Set()); setSelectionMode(false); }}>
                  取消
                </button>
              </>
            ) : (
              <>
                <button className="action-btn" onClick={() => importInputRef.current?.click()}>
                  <span>📥</span>
                  导入
                </button>
                <Link href="/analyzer" className="action-btn primary">
                  <span>➕</span>
                  分析新牌局
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Statistics Dashboard */}
        {histories.length > 0 && (
          <div className="stats-dashboard">
            <div className="stat-card">
              <div className="stat-icon sessions">📊</div>
              <div className="stat-label">总牌局数</div>
              <div className="stat-value">{stats.totalHands}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon equity">📈</div>
              <div className="stat-label">平均权益</div>
              <div className="stat-value">{(stats.avgEquity * 100).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ev">💰</div>
              <div className="stat-label">累计 EV</div>
              <div className={`stat-value ${stats.totalEV >= 0 ? 'positive' : 'negative'}`}>
                {stats.totalEV >= 0 ? '+' : ''}{stats.totalEV.toFixed(2)} BB
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon streak">🎯</div>
              <div className="stat-label">正EV比例</div>
              <div className="stat-value">{(stats.winRate * 100).toFixed(0)}%</div>
              {stats.winRate > 0.5 && (
                <span className="stat-change">
                  <span>↑</span> 高于平均
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="filter-section">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="搜索手牌、公共牌、笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Favorites filter */}
            <button
              className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title="仅显示收藏"
            >
              <span>{showFavoritesOnly ? '⭐' : '☆'}</span>
              收藏
            </button>

            {/* View toggle */}
            <div className="view-options">
              <button
                className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                onClick={() => setViewType('list')}
              >
                列表
              </button>
              <button
                className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                onClick={() => setViewType('grid')}
              >
                卡片
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                className={`dropdown-trigger ${showSortDropdown ? 'open' : ''}`}
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowPositionDropdown(false);
                }}
              >
                <span>排序</span>
                <span className="arrow">▼</span>
              </button>
              <div className={`dropdown-menu ${showSortDropdown ? 'open' : ''}`}>
                {[
                  { value: 'newest', label: '最新优先' },
                  { value: 'oldest', label: '最早优先' },
                  { value: 'equity_high', label: '权益从高到低' },
                  { value: 'equity_low', label: '权益从低到高' },
                  { value: 'ev_high', label: 'EV 从高到低' },
                  { value: 'ev_low', label: 'EV 从低到高' },
                ].map(option => (
                  <button
                    key={option.value}
                    className={`dropdown-item ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(option.value as SortType);
                      setShowSortDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position dropdown */}
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                className={`dropdown-trigger ${showPositionDropdown ? 'open' : ''}`}
                onClick={() => {
                  setShowPositionDropdown(!showPositionDropdown);
                  setShowSortDropdown(false);
                }}
              >
                <span>{positionFilter || '所有位置'}</span>
                <span className="arrow">▼</span>
              </button>
              <div className={`dropdown-menu ${showPositionDropdown ? 'open' : ''}`}>
                <button
                  className={`dropdown-item ${!positionFilter ? 'active' : ''}`}
                  onClick={() => {
                    setPositionFilter(null);
                    setShowPositionDropdown(false);
                  }}
                >
                  所有位置
                </button>
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    className={`dropdown-item ${positionFilter === pos ? 'active' : ''}`}
                    onClick={() => {
                      setPositionFilter(pos);
                      setShowPositionDropdown(false);
                    }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Select all */}
            {filteredHistories.length > 0 && (
              <button className="action-btn" onClick={selectAll}>
                {selectedIds.size === filteredHistories.length ? '取消全选' : '全选'}
              </button>
            )}
          </div>

          {/* Street filter chips */}
          <div className="filter-chips">
            {(['all', ...STREETS] as FilterType[]).map(street => (
              <button
                key={street}
                className={`filter-chip ${streetFilter === street ? 'active' : ''}`}
                onClick={() => setStreetFilter(street)}
              >
                <span>{street === 'all' ? '全部' : street.charAt(0).toUpperCase() + street.slice(1)}</span>
                <span className="chip-count">{streetCounts[street] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {histories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">🃏</div>
          <h3 className="empty-title">暂无牌局历史</h3>
          <p className="empty-description">
            开始分析你的第一手牌，记录并优化你的策略
          </p>
          <button className="action-btn primary" onClick={() => window.location.href = '/analyzer'}>
            分析第一手牌
          </button>
        </div>
      ) : (
        <div className="history-content">
          {/* History List */}
          <div className="history-list-section">
            <div className={`history-list ${viewType === 'grid' ? 'grid-view' : 'list-view'}`}>
              {viewType === 'grid' ? (
                // Grid/Card view
                paginatedHistories.map(history => renderGridCard(history))
              ) : (
                // List view
                paginatedHistories.map(history => renderHistoryCard(history))
              )}
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && paginatedHistories.length > 0 && (
              <div ref={loadMoreRef} className="load-more-trigger">
                <div className="loading-spinner small" />
                <span>加载更多...</span>
              </div>
            )}

            {filteredHistories.length === 0 && histories.length > 0 && (
              <div className="empty-state">
                <div className="empty-illustration">🔍</div>
                <h3 className="empty-title">没有找到匹配的牌局</h3>
                <p className="empty-description">
                  尝试调整筛选条件
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="batch-action-bar">
          <span className="selected-count">{selectedIds.size} 已选择</span>
          <span className="divider" />
          <button className="batch-btn" onClick={exportSelected}>
            <span>📤</span>
            导出
          </button>
          <button className="batch-btn danger" onClick={deleteSelected}>
            <span>🗑️</span>
            删除
          </button>
          <button className="batch-btn" onClick={() => setSelectedIds(new Set())}>
            取消
          </button>
        </div>
      )}
    </div>
  );

  function renderHistoryCard(history: HandHistory) {
    const hand = parseHeroHand(history.hero_hand);
    const board = parseBoard(history.board);
    const isChecked = selectedIds.has(history.id);
    const isSwiping = swipingId === history.id;

    const handleCardClick = (e: React.MouseEvent) => {
      if (selectionMode) {
        e.preventDefault();
        toggleSelect(history.id);
      }
    };

    return (
      <div
        key={history.id}
        className={`history-card-wrapper ${isSwiping ? 'swiping' : ''}`}
      >
        {/* Swipe delete action (background) */}
        {isMobile && (
          <div className="swipe-action delete" onClick={() => { resetSwipe(); deleteHistory(history.id); }}>
            <span>🗑️</span>
            <span>删除</span>
          </div>
        )}

        <Link
          href={selectionMode ? '#' : `/history/${history.id}`}
          className="history-card"
          style={isMobile && isSwiping ? { transform: `translateX(${swipeOffset}px)` } : undefined}
          onClick={handleCardClick}
          onTouchStart={(e) => handleTouchStart(e, history.id)}
          onTouchMove={(e) => handleTouchMove(e, history.id)}
          onTouchEnd={() => handleTouchEnd(history.id)}
        >
          {/* Selection checkbox */}
          <div className="card-select" onClick={(e) => { e.stopPropagation(); toggleSelect(history.id); }}>
            <div className={`select-checkbox ${isChecked ? 'checked' : ''}`} />
          </div>

          {/* Cards preview using PokerCard */}
          {hand && (
            <div className="cards-preview">
              <PokerCard card={hand[0]} size={isMobile ? 'xs' : 'sm'} variant="dark" />
              <PokerCard card={hand[1]} size={isMobile ? 'xs' : 'sm'} variant="dark" />
            </div>
          )}

          {/* Card info */}
          <div className="card-info">
            <div className="info-top">
              <span className="position-badge">{history.hero_position}</span>
              {history.villain_position && (
                <>
                  <span className="vs-text">vs</span>
                  <span className="position-badge villain">{history.villain_position}</span>
                </>
              )}
              <span className="street-badge">{getStreetLabel(history.street)}</span>
            </div>
            <div className="info-middle">
              {board.length > 0 && (
                <div className="board-preview">
                  {board.map((card, i) => (
                    <PokerCard key={i} card={card} size="xs" variant="dark" />
                  ))}
                </div>
              )}
            </div>
            <div className="info-bottom">
              <div className="pot-stack">
                <span className="pot-info">
                  <span className="label">底池</span>
                  <span className="value">{history.pot_size} BB</span>
                </span>
                <span className="stack-info">
                  <span className="label">筹码</span>
                  <span className="value">{history.stack_size} BB</span>
                </span>
              </div>
              <span className="time-ago">{formatRelativeTime(history.created_at)}</span>
            </div>
          </div>

          {/* Result */}
          <div className="card-result">
            {history.analysis_result?.equity !== undefined && (
              <div className="result-item equity">
                <span className="result-label">权益</span>
                <span className={`result-value ${getEquityClass(history.analysis_result.equity)}`}>
                  {(history.analysis_result.equity * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {history.analysis_result?.ev !== undefined && (
              <div className="result-item ev">
                <span className="result-label">EV</span>
                <span className={`result-value ${history.analysis_result.ev >= 0 ? 'positive' : 'negative'}`}>
                  {history.analysis_result.ev >= 0 ? '+' : ''}{history.analysis_result.ev.toFixed(2)}
                </span>
              </div>
            )}
            {history.analysis_result?.recommendedAction && (
              <div className={`action-badge ${getActionClass(history.analysis_result.recommendedAction)}`}>
                {history.analysis_result.recommendedAction}
              </div>
            )}
          </div>

          {/* Quick action buttons (desktop hover) */}
          {!isMobile && (
            <div className="quick-actions">
              <button
                className={`quick-action-btn favorite ${history.is_favorite ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(history.id, e)}
                title={history.is_favorite ? '取消收藏' : '添加收藏'}
              >
                {history.is_favorite ? '⭐' : '☆'}
              </button>
              <Link
                href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
                className="quick-action-btn"
                onClick={(e) => e.stopPropagation()}
                title="重新分析"
              >
                🔄
              </Link>
              <button
                className="quick-action-btn danger"
                onClick={(e) => { e.stopPropagation(); deleteHistory(history.id); }}
                title="删除"
              >
                🗑️
              </button>
            </div>
          )}

          {/* Favorite indicator (mobile) */}
          {isMobile && history.is_favorite && (
            <span className="favorite-indicator">⭐</span>
          )}
        </Link>
      </div>
    );
  }

  function renderGridCard(history: HandHistory) {
    const hand = parseHeroHand(history.hero_hand);
    const board = parseBoard(history.board);
    const isChecked = selectedIds.has(history.id);

    return (
      <Link
        key={history.id}
        href={selectionMode ? '#' : `/history/${history.id}`}
        className="grid-card"
        onClick={(e) => {
          if (selectionMode) {
            e.preventDefault();
            toggleSelect(history.id);
          }
        }}
      >
        {/* Selection checkbox */}
        <div className="grid-card-select" onClick={(e) => { e.stopPropagation(); toggleSelect(history.id); }}>
          <div className={`select-checkbox ${isChecked ? 'checked' : ''}`} />
        </div>

        {/* Card Header with position and time */}
        <div className="grid-card-header">
          <div className="position-badges">
            <span className="position-badge">{history.hero_position}</span>
            {history.villain_position && (
              <>
                <span className="vs-indicator">vs</span>
                <span className="position-badge villain">{history.villain_position}</span>
              </>
            )}
          </div>
          <span className="street-tag">{getStreetLabel(history.street)}</span>
        </div>

        {/* Hero Hand */}
        <div className="grid-card-hand">
          {hand && (
            <div className="hero-cards">
              <PokerCard card={hand[0]} size={isMobile ? 'sm' : 'md'} variant="dark" />
              <PokerCard card={hand[1]} size={isMobile ? 'sm' : 'md'} variant="dark" />
            </div>
          )}
        </div>

        {/* Board Cards */}
        {board.length > 0 && (
          <div className="grid-card-board">
            <span className="board-label">公共牌</span>
            <div className="board-cards">
              {board.map((card, i) => (
                <PokerCard key={i} card={card} size="xs" variant="dark" />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid-card-stats">
          <div className="stat-row">
            <span className="stat-item">
              <span className="stat-label">底池</span>
              <span className="stat-value">{history.pot_size} BB</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">筹码</span>
              <span className="stat-value">{history.stack_size} BB</span>
            </span>
          </div>
        </div>

        {/* Analysis Result */}
        {history.analysis_result && (
          <div className="grid-card-result">
            {history.analysis_result.equity !== undefined && (
              <div className={`result-badge equity ${getEquityClass(history.analysis_result.equity)}`}>
                <span className="badge-label">权益</span>
                <span className="badge-value">{(history.analysis_result.equity * 100).toFixed(1)}%</span>
              </div>
            )}
            {history.analysis_result.ev !== undefined && (
              <div className={`result-badge ev ${history.analysis_result.ev >= 0 ? 'positive' : 'negative'}`}>
                <span className="badge-label">EV</span>
                <span className="badge-value">{history.analysis_result.ev >= 0 ? '+' : ''}{history.analysis_result.ev.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Recommended Action */}
        {history.analysis_result?.recommendedAction && (
          <div className="grid-card-action">
            <span className={`action-tag ${getActionClass(history.analysis_result.recommendedAction)}`}>
              {history.analysis_result.recommendedAction}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="grid-card-footer">
          <span className="time-stamp">{formatRelativeTime(history.created_at)}</span>
          <div className="grid-card-meta">
            {history.notes && <span className="has-notes" title="有笔记">📝</span>}
            <button
              className={`favorite-btn ${history.is_favorite ? 'active' : ''}`}
              onClick={(e) => toggleFavorite(history.id, e)}
              title={history.is_favorite ? '取消收藏' : '添加收藏'}
            >
              {history.is_favorite ? '⭐' : '☆'}
            </button>
          </div>
        </div>

        {/* Quick actions on hover */}
        <div className="grid-quick-actions">
          <Link
            href={`/analyzer?hand=${history.hero_hand}&board=${history.board}&position=${history.hero_position}`}
            className="grid-quick-btn"
            onClick={(e) => e.stopPropagation()}
          >
            🔄 重新分析
          </Link>
          <button
            className="grid-quick-btn danger"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteHistory(history.id); }}
          >
            🗑️ 删除
          </button>
        </div>
      </Link>
    );
  }
}
