'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import './hand-detail.css';

// Types
interface HandAuthor {
  id: string;
  username: string;
  level: number;
  title?: string;
}

interface HandAction {
  player: string;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
  isHero?: boolean;
}

interface HandStreet {
  name: 'preflop' | 'flop' | 'turn' | 'river';
  board?: string[];
  pot: number;
  actions: HandAction[];
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
  streets: HandStreet[];
  result: HandResult;
  keyDecision?: KeyDecision;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HandComment {
  id: string;
  handId: string;
  author: HandAuthor;
  content: string;
  likes: number;
  createdAt: string;
  replies?: HandComment[];
}

export default function HandDetailPage() {
  const params = useParams();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [hand, setHand] = useState<SharedHand | null>(null);
  const [comments, setComments] = useState<HandComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [activeStreet, setActiveStreet] = useState<string>('preflop');

  useEffect(() => {
    async function fetchHand() {
      setLoading(true);
      try {
        const res = await fetch(`/api/hands?id=${params.id}`);
        const data = await res.json();
        if (data.success) {
          setHand(data.hand);
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Failed to fetch hand:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchHand();
    }
  }, [params.id]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const getCardDisplay = (card: string) => {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    return (
      <span className="card-visual" style={{ color: suitColors[suit] }}>
        {rank}{suitSymbols[suit]}
      </span>
    );
  };

  const getActionDisplay = (action: HandAction) => {
    const actionLabels: Record<string, { label: string; color: string }> = {
      fold: { label: '弃牌', color: '#6b7280' },
      check: { label: '过牌', color: '#3b82f6' },
      call: { label: '跟注', color: '#22c55e' },
      bet: { label: '下注', color: '#f59e0b' },
      raise: { label: '加注', color: '#ef4444' },
      'all-in': { label: '全下', color: '#8b5cf6' },
    };

    const info = actionLabels[action.action];
    return (
      <span className="action-display" style={{ borderColor: info.color }}>
        <span className="action-player" style={{ color: action.isHero ? '#00f5d4' : 'inherit' }}>
          {action.player}{action.isHero && ' (Hero)'}
        </span>
        <span className="action-type" style={{ color: info.color }}>
          {info.label}
          {action.amount && ` $${action.amount}`}
        </span>
      </span>
    );
  };

  const handleLike = async () => {
    setLiked(!liked);
    if (hand) {
      setHand({
        ...hand,
        likes: liked ? hand.likes - 1 : hand.likes + 1,
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch('/api/hands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          handId: hand?.id,
          content: newComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="hand-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/hands" className="back-btn">
              <span>&larr;</span>
            </Link>
            <h1>加载中...</h1>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>加载牌谱...</p>
        </div>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="hand-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/hands" className="back-btn">
              <span>&larr;</span>
            </Link>
            <h1>牌谱不存在</h1>
          </div>
        </header>
        <div className="empty-container">
          <div className="empty-icon">&#127183;</div>
          <h3>牌谱不存在</h3>
          <p>该牌谱可能已被删除</p>
          <Link href="/hands" className="back-link">返回牌谱列表</Link>
        </div>
      </div>
    );
  }

  const currentStreet = hand.streets.find(s => s.name === activeStreet);

  return (
    <div className="hand-detail-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/hands" className="back-btn">
            <span>&larr;</span>
          </Link>
          <h1>牌谱详情</h1>
        </div>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Hand visualization */}
        <section className="hand-visualization">
          {/* Hero hand */}
          <div className="hero-section">
            <div className="hero-label">
              <span className="position-badge">{hand.heroPosition}</span>
              <span>Hero</span>
            </div>
            <div className="hero-cards">
              {hand.heroHand.map((card, i) => (
                <div key={i} className="hero-card">
                  {getCardDisplay(card)}
                </div>
              ))}
            </div>
          </div>

          {/* Game info */}
          <div className="game-info">
            <div className="info-item">
              <span className="info-label">盲注</span>
              <span className="info-value">{hand.blinds}</span>
            </div>
            <div className="info-item">
              <span className="info-label">有效筹码</span>
              <span className="info-value">{hand.effectiveStack}BB</span>
            </div>
            <div className="info-item">
              <span className="info-label">结果</span>
              <span className={`info-value ${hand.result.won ? 'won' : 'lost'}`}>
                {hand.result.won ? '+' : ''}{hand.result.amount}BB
              </span>
            </div>
          </div>

          {/* Street tabs */}
          <div className="street-tabs">
            {hand.streets.map(street => (
              <button
                key={street.name}
                className={`street-tab ${activeStreet === street.name ? 'active' : ''}`}
                onClick={() => setActiveStreet(street.name)}
              >
                {street.name === 'preflop' ? '翻前' :
                 street.name === 'flop' ? '翻牌' :
                 street.name === 'turn' ? '转牌' : '河牌'}
              </button>
            ))}
          </div>

          {/* Board */}
          {currentStreet?.board && (
            <div className="board-section">
              <span className="board-label">公共牌</span>
              <div className="board-cards">
                {currentStreet.board.map((card, i) => (
                  <div key={i} className="board-card">
                    {getCardDisplay(card)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pot */}
          {currentStreet && (
            <div className="pot-info">
              <span>底池: ${currentStreet.pot}</span>
            </div>
          )}

          {/* Actions */}
          {currentStreet && (
            <div className="actions-section">
              <h4>行动</h4>
              <div className="actions-list">
                {currentStreet.actions.map((action, i) => (
                  <div key={i} className="action-item">
                    {getActionDisplay(action)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Hand details */}
        <section className="hand-details">
          {/* Badges */}
          <div className="detail-badges">
            {hand.isFeatured && <span className="badge featured">精选</span>}
            {hand.isHot && <span className="badge hot">热门</span>}
          </div>

          {/* Title */}
          <h1 className="hand-title">{hand.title}</h1>

          {/* Author info */}
          <div className="author-section">
            <div className="author-avatar">
              {hand.author.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="author-info">
              <span className="author-name">{hand.author.username}</span>
              <div className="author-meta">
                {hand.author.title && (
                  <span className="author-title">{hand.author.title}</span>
                )}
                <span className="post-time">{formatTime(hand.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Key decision */}
          {hand.keyDecision && (
            <div className="key-decision">
              <h4>关键决策</h4>
              <div className="decision-content">
                <div className="decision-header">
                  <span className="decision-street">{hand.keyDecision.street}</span>
                  <span className="decision-action">{hand.keyDecision.action}</span>
                  {hand.keyDecision.isCorrect !== undefined && (
                    <span className={`decision-result ${hand.keyDecision.isCorrect ? 'correct' : 'wrong'}`}>
                      {hand.keyDecision.isCorrect ? '正确' : '失误'}
                    </span>
                  )}
                </div>
                <p>{hand.keyDecision.description}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="description-section">
            <h4>描述</h4>
            <div className="description-content">
              {hand.description.split('\n').map((para, i) => (
                para.trim() && <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Tags */}
          {hand.tags.length > 0 && (
            <div className="tags-section">
              {hand.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="social-actions">
            <button
              className={`action-btn like ${liked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <span dangerouslySetInnerHTML={{ __html: '&#128077;' }} />
              <span>{hand.likes}</span>
            </button>
            <button className="action-btn">
              <span dangerouslySetInnerHTML={{ __html: '&#128279;' }} />
              <span>分享</span>
            </button>
            <button className="action-btn">
              <span dangerouslySetInnerHTML={{ __html: '&#128278;' }} />
              <span>收藏</span>
            </button>
          </div>
        </section>

        {/* Comments section */}
        <section className="comments-section">
          <h3>评论 ({comments.length})</h3>

          {/* Comment input */}
          <div className="comment-input">
            <textarea
              placeholder={replyTo ? `回复 @${replyTo}` : '写下你的分析...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="comment-input-actions">
              {replyTo && (
                <button className="cancel-reply" onClick={() => setReplyTo(null)}>
                  取消回复
                </button>
              )}
              <button
                className="submit-comment"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                发表评论
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>暂无评论，来分享你的观点吧！</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.author.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author.username}</span>
                      {comment.author.title && (
                        <span className="comment-title">{comment.author.title}</span>
                      )}
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                    <div className="comment-actions">
                      <button className="comment-action">
                        <span dangerouslySetInnerHTML={{ __html: '&#128077;' }} />
                        <span>{comment.likes}</span>
                      </button>
                      <button
                        className="comment-action"
                        onClick={() => setReplyTo(comment.author.username)}
                      >
                        回复
                      </button>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-avatar">
                              {reply.author.username.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="reply-body">
                              <div className="reply-header">
                                <span className="reply-author">{reply.author.username}</span>
                                <span className="reply-time">{formatTime(reply.createdAt)}</span>
                              </div>
                              <div className="reply-content">{reply.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
