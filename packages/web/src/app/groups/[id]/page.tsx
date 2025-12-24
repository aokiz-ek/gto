'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import { useTranslation } from '@/i18n';
import './group-detail.css';

// Types
type GroupCategory = 'beginner' | 'intermediate' | 'advanced' | 'mtt' | 'cash';

interface GroupMember {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  weeklyQuestions: number;
  weeklyAccuracy: number;
}

interface GroupStats {
  totalMembers: number;
  weeklyActive: number;
  totalQuestions: number;
  avgAccuracy: number;
}

interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  questions: number;
  startTime: string;
  endTime: string;
  participants: number;
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
  members: GroupMember[];
  challenges: GroupChallenge[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  member: GroupMember;
  weeklyQuestions: number;
  weeklyAccuracy: number;
  weeklyScore: number;
}

interface CategoryLabel {
  en: string;
  zh: string;
  icon: string;
  color: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const { t } = useTranslation();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryLabel>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'challenges' | 'members'>('overview');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups?id=${params.id}`);
        const data = await res.json();
        if (data.success) {
          setGroup(data.group);
          setLeaderboard(data.leaderboard);
          setCategories(data.labels.categories);
        }
      } catch (error) {
        console.error('Failed to fetch group:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchGroup();
    }
  }, [params.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getChallengeStatus = (challenge: GroupChallenge) => {
    const now = new Date();
    const start = new Date(challenge.startTime);
    const end = new Date(challenge.endTime);

    if (now < start) return { status: 'upcoming', label: '即将开始', color: '#f59e0b' };
    if (now > end) return { status: 'completed', label: '已结束', color: '#6b7280' };
    return { status: 'active', label: '进行中', color: '#22c55e' };
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_challenge', challengeId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  if (loading) {
    return (
      <div className="group-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/groups" className="back-btn">
              <span>&larr;</span>
            </Link>
            <h1>加载中...</h1>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>加载小组信息...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/groups" className="back-btn">
              <span>&larr;</span>
            </Link>
            <h1>小组不存在</h1>
          </div>
        </header>
        <div className="empty-container">
          <div className="empty-icon">&#128101;</div>
          <h3>小组不存在</h3>
          <p>该小组可能已被解散</p>
          <Link href="/groups" className="back-link">返回小组列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/groups" className="back-btn">
            <span>&larr;</span>
          </Link>
          <h1>{group.name}</h1>
        </div>
        <button className="join-group-btn">
          {group.requireApproval ? t.groups.join : t.groups.join}
        </button>
      </header>

      {/* Group hero */}
      <div className="group-hero">
        <div className="hero-content">
          <div className="group-avatar-large">
            {group.name.slice(0, 2)}
          </div>
          <div className="group-info">
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
                <span className="group-private">私密小组</span>
              )}
              <span className="group-date">创建于 {formatDate(group.createdAt)}</span>
            </div>
            <p className="group-description">{group.description}</p>
            <div className="group-tags">
              {group.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{group.stats.totalMembers}</span>
            <span className="stat-label">{t.groups.members}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{group.stats.weeklyActive}</span>
            <span className="stat-label">周活跃</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatNumber(group.stats.totalQuestions)}</span>
            <span className="stat-label">总练习</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{group.stats.avgAccuracy.toFixed(1)}%</span>
            <span className="stat-label">平均正确率</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tab-nav">
        {[
          { key: 'overview', label: t.groups.posts },
          { key: 'leaderboard', label: t.groups.events },
          { key: 'challenges', label: t.groups.about },
          { key: 'members', label: t.groups.members },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Leaderboard preview */}
            <section className="content-section">
              <div className="section-header">
                <h2>本周排行榜</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('leaderboard')}>
                  查看全部
                </button>
              </div>
              <div className="leaderboard-preview">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.member.id} className={`leaderboard-item rank-${entry.rank}`}>
                    <div className="rank">
                      {entry.rank <= 3 ? (
                        <span className={`medal medal-${entry.rank}`}>
                          {entry.rank === 1 ? '&#129351;' : entry.rank === 2 ? '&#129352;' : '&#129353;'}
                        </span>
                      ) : (
                        <span className="rank-num">{entry.rank}</span>
                      )}
                    </div>
                    <div className="member-avatar">
                      {entry.member.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{entry.member.username}</span>
                      {entry.member.title && (
                        <span className="member-title">{entry.member.title}</span>
                      )}
                    </div>
                    <div className="member-stats">
                      <span className="score">{entry.weeklyScore}分</span>
                      <span className="details">
                        {entry.weeklyQuestions}题 | {entry.weeklyAccuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active challenges */}
            <section className="content-section">
              <div className="section-header">
                <h2>进行中的挑战</h2>
                <button className="create-challenge-btn" onClick={() => setShowCreateChallenge(true)}>
                  发起挑战
                </button>
              </div>
              <div className="challenges-list">
                {group.challenges.filter(c => c.status === 'active' || c.status === 'upcoming').length === 0 ? (
                  <div className="empty-challenges">
                    <p>暂无进行中的挑战</p>
                    <button className="create-first-btn" onClick={() => setShowCreateChallenge(true)}>
                      发起第一个挑战
                    </button>
                  </div>
                ) : (
                  group.challenges
                    .filter(c => c.status === 'active' || c.status === 'upcoming')
                    .map(challenge => {
                      const statusInfo = getChallengeStatus(challenge);
                      return (
                        <div key={challenge.id} className="challenge-card">
                          <div className="challenge-header">
                            <h3>{challenge.title}</h3>
                            <span
                              className="challenge-status"
                              style={{ backgroundColor: statusInfo.color }}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="challenge-description">{challenge.description}</p>
                          <div className="challenge-info">
                            <span>&#128221; {challenge.questions}题</span>
                            <span>&#128101; {challenge.participants}人参与</span>
                            <span>&#128197; {formatTime(challenge.startTime)} - {formatTime(challenge.endTime)}</span>
                          </div>
                          <button
                            className="join-challenge-btn"
                            onClick={() => handleJoinChallenge(challenge.id)}
                          >
                            参加挑战
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </section>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-content">
            <div className="leaderboard-header">
              <h2>本周排行榜</h2>
              <p>基于练习题数和正确率计算积分</p>
            </div>
            <div className="leaderboard-full">
              {leaderboard.map(entry => (
                <div key={entry.member.id} className={`leaderboard-item rank-${entry.rank}`}>
                  <div className="rank">
                    {entry.rank <= 3 ? (
                      <span className={`medal medal-${entry.rank}`}>
                        {entry.rank === 1 ? '&#129351;' : entry.rank === 2 ? '&#129352;' : '&#129353;'}
                      </span>
                    ) : (
                      <span className="rank-num">{entry.rank}</span>
                    )}
                  </div>
                  <div className="member-avatar">
                    {entry.member.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{entry.member.username}</span>
                    <div className="member-meta">
                      {entry.member.title && (
                        <span className="member-title">{entry.member.title}</span>
                      )}
                      <span className="member-role">
                        {entry.member.role === 'owner' ? t.groups.admin :
                         entry.member.role === 'admin' ? t.groups.admin : t.groups.members}
                      </span>
                    </div>
                  </div>
                  <div className="member-stats">
                    <span className="score">{entry.weeklyScore}分</span>
                    <div className="stats-details">
                      <span>&#128221; {entry.weeklyQuestions}题</span>
                      <span>&#9989; {entry.weeklyAccuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="challenges-content">
            <div className="challenges-header">
              <h2>小组挑战</h2>
              <button className="create-challenge-btn" onClick={() => setShowCreateChallenge(true)}>
                发起挑战
              </button>
            </div>
            <div className="challenges-full">
              {group.challenges.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">&#127942;</div>
                  <h3>暂无挑战</h3>
                  <p>发起第一个小组挑战吧！</p>
                </div>
              ) : (
                group.challenges.map(challenge => {
                  const statusInfo = getChallengeStatus(challenge);
                  return (
                    <div key={challenge.id} className="challenge-card-full">
                      <div className="challenge-header">
                        <h3>{challenge.title}</h3>
                        <span
                          className="challenge-status"
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="challenge-description">{challenge.description}</p>
                      <div className="challenge-stats">
                        <div className="stat">
                          <span className="stat-value">{challenge.questions}</span>
                          <span className="stat-label">题目数</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{challenge.participants}</span>
                          <span className="stat-label">参与者</span>
                        </div>
                      </div>
                      <div className="challenge-time">
                        <span>&#128197; 开始: {formatTime(challenge.startTime)}</span>
                        <span>&#128197; 结束: {formatTime(challenge.endTime)}</span>
                      </div>
                      {statusInfo.status !== 'completed' && (
                        <button
                          className="join-challenge-btn"
                          onClick={() => handleJoinChallenge(challenge.id)}
                        >
                          参加挑战
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="members-content">
            <div className="members-header">
              <h2>成员列表 ({group.members.length})</h2>
            </div>
            <div className="members-grid">
              {group.members.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar-large">
                    {member.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="member-details">
                    <span className="member-name">{member.username}</span>
                    <span className="member-level">Lv.{member.level}</span>
                    {member.title && (
                      <span className="member-title-badge">{member.title}</span>
                    )}
                    <span className={`member-role-badge role-${member.role}`}>
                      {member.role === 'owner' ? t.groups.admin :
                       member.role === 'admin' ? t.groups.admin : t.groups.members}
                    </span>
                  </div>
                  <div className="member-activity">
                    <span>本周: {member.weeklyQuestions}题</span>
                    <span>正确率: {member.weeklyAccuracy.toFixed(1)}%</span>
                  </div>
                  <span className="join-date">加入于 {formatDate(member.joinedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <CreateChallengeModal onClose={() => setShowCreateChallenge(false)} groupId={group.id} />
      )}
    </div>
  );
}

// Create Challenge Modal
function CreateChallengeModal({ onClose, groupId }: { onClose: () => void; groupId: string }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: 50,
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_challenge',
          groupId,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('挑战创建成功！');
        onClose();
      }
    } catch (error) {
      console.error('Failed to create challenge:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发起小组挑战</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="challenge-form">
          <div className="form-group">
            <label>挑战名称 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如: 周末RFI特训"
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>挑战描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这次挑战的目标和规则"
              rows={3}
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label>题目数量</label>
            <input
              type="number"
              value={formData.questions}
              onChange={e => setFormData({ ...formData, questions: parseInt(e.target.value) || 50 })}
              min={10}
              max={200}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间 *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>结束时间 *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? '创建中...' : '创建挑战'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
