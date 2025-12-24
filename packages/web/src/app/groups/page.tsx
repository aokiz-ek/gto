'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './groups.css';

// Types
type GroupCategory = 'beginner' | 'intermediate' | 'advanced' | 'mtt' | 'cash';

interface GroupStats {
  totalMembers: number;
  weeklyActive: number;
  totalQuestions: number;
  avgAccuracy: number;
}

interface GroupChallenge {
  id: string;
  title: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  isPublic: boolean;
  requireApproval: boolean;
  maxMembers: number;
  owner: {
    id: string;
    username: string;
  };
  stats: GroupStats;
  challenges: GroupChallenge[];
  tags: string[];
  createdAt: string;
}

interface CategoryLabel {
  en: string;
  zh: string;
  icon: string;
  color: string;
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryLabel>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);

        const res = await fetch(`/api/groups?${params}`);
        const data = await res.json();
        if (data.success) {
          setGroups(data.groups);
          setCategories(data.labels.categories);
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [selectedCategory, searchQuery]);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const handleJoinGroup = async (groupId: string, requireApproval: boolean) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', groupId, requireApproval }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  return (
    <div className="groups-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/" className="back-btn">
            <span>&larr;</span>
          </Link>
          <div>
            <h1>{t.groups.title}</h1>
            <p className="header-subtitle">{t.groups.subtitle}</p>
          </div>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          {t.groups.create}
        </button>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Search */}
          <div className="search-section">
            <input
              type="text"
              placeholder={t.groups.searchGroups}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Categories */}
          <div className="category-section">
            <h3>{t.common.categories}</h3>
            <div className="category-list">
              <button
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span className="category-icon">&#128203;</span>
                <span>{t.common.all}</span>
              </button>
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  className={`category-item ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(key as GroupCategory)}
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

          {/* Quick Stats */}
          <div className="stats-section">
            <h3>{t.common.statistics}</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{groups.length}</span>
                <span className="stat-label">{t.common.activeGroups}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {formatNumber(groups.reduce((sum, g) => sum + g.stats.totalMembers, 0))}
                </span>
                <span className="stat-label">{t.common.totalMembers}</span>
              </div>
            </div>
          </div>

          {/* My Groups */}
          <div className="my-groups-section">
            <h3>{t.groups.myGroups}</h3>
            <div className="my-groups-list">
              <p className="empty-text">{t.common.loginToView}</p>
            </div>
          </div>
        </aside>

        {/* Groups list */}
        <main className="groups-section">
          {/* Results info */}
          <div className="results-bar">
            <span className="results-count">
              {t.common.found} {groups.length} {t.common.groups}
            </span>
          </div>

          {/* Groups grid */}
          <div className="groups-grid">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>{t.common.loading}</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#128101;</div>
                <h3>{t.groups.noGroups}</h3>
                <p>{t.common.beFirstToCreate}</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.id} className="group-card">
                  {/* Group header */}
                  <div className="group-header">
                    <div className="group-avatar">
                      {group.name.slice(0, 2)}
                    </div>
                    <div className="group-info">
                      <Link href={`/groups/${group.id}`} className="group-name">
                        {group.name}
                      </Link>
                      <div className="group-meta">
                        {categories[group.category] && (
                          <span
                            className="group-category"
                            style={{ backgroundColor: categories[group.category].color }}
                          >
                            {categories[group.category].icon} {categories[group.category].zh}
                          </span>
                        )}
                        {!group.isPublic && (
                          <span className="group-private">{t.groups.private}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group description */}
                  <p className="group-description">
                    {group.description.slice(0, 100)}
                    {group.description.length > 100 && '...'}
                  </p>

                  {/* Tags */}
                  {group.tags.length > 0 && (
                    <div className="group-tags">
                      {group.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Group stats */}
                  <div className="group-stats">
                    <div className="stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{group.stats.totalMembers}/{group.maxMembers}</span>
                    </div>
                    <div className="stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>{group.stats.avgAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{group.stats.weeklyActive}{t.common.active}</span>
                    </div>
                  </div>

                  {/* Active challenges */}
                  {group.challenges.filter(c => c.status === 'active').length > 0 && (
                    <div className="active-challenge">
                      <span className="challenge-badge">{t.common.inProgress}</span>
                      <span className="challenge-name">
                        {group.challenges.find(c => c.status === 'active')?.title}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="group-actions">
                    <Link href={`/groups/${group.id}`} className="view-btn">
                      {t.common.viewDetails}
                    </Link>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGroup(group.id, group.requireApproval)}
                    >
                      {group.requireApproval ? t.common.applyToJoin : t.groups.join}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Create Group Modal Component
function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'beginner' as GroupCategory,
    isPublic: true,
    requireApproval: false,
    maxMembers: 50,
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(t.common.createSuccess);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.groups.createGroup}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>{t.groups.groupName} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.common.giveGroupName}
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>{t.groups.groupDescription} *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.common.describeGroupGoals}
              rows={3}
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label>{t.common.category}</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as GroupCategory })}
            >
              <option value="beginner">{t.common.beginner}</option>
              <option value="intermediate">{t.common.intermediate}</option>
              <option value="advanced">{t.common.advanced}</option>
              <option value="mtt">{t.common.mtt}</option>
              <option value="cash">{t.common.cashGame}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t.common.tags} ({t.common.commaSeparated})</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder={t.common.tagsPlaceholder}
            />
          </div>
          <div className="form-group">
            <label>{t.common.maxMembers}</label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={e => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
              min={5}
              max={100}
            />
          </div>
          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span>{t.common.publicGroup}</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.requireApproval}
                onChange={e => setFormData({ ...formData, requireApproval: e.target.checked })}
              />
              <span>{t.common.requireApproval}</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              {t.common.cancel}
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? t.common.creating : t.groups.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
