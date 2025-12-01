'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useResponsive } from '@/hooks';
import './post-detail.css';

// Types
type PostCategory = 'hand_analysis' | 'strategy' | 'question' | 'experience' | 'news';

interface Author {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
}

interface Comment {
  id: string;
  postId: string;
  author: Author;
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
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

export default function PostDetailPage() {
  const params = useParams();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryLabel>>({});
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/posts?id=${params.id}&comments=true`);
        const data = await res.json();
        if (data.success) {
          setPost(data.post);
          setComments(data.comments);
          setCategories(data.labels.categories);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchPost();
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

  const handleLike = () => {
    setLiked(!liked);
    if (post) {
      setPost({
        ...post,
        likes: liked ? post.likes - 1 : post.likes + 1,
      });
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      postId: post?.id || '',
      author: {
        id: 'current-user',
        username: 'CurrentUser',
        level: 10,
        title: '活跃玩家',
      },
      content: newComment,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setReplyTo(null);
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/community" className="back-btn">
              <span>←</span>
            </Link>
            <h1>加载中...</h1>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>加载帖子...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <header className="page-header">
          <div className="header-left">
            <Link href="/community" className="back-btn">
              <span>←</span>
            </Link>
            <h1>帖子不存在</h1>
          </div>
        </header>
        <div className="empty-container">
          <div className="empty-icon">📝</div>
          <h3>帖子不存在</h3>
          <p>该帖子可能已被删除</p>
          <Link href="/community" className="back-link">返回社区</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <Link href="/community" className="back-btn">
            <span>←</span>
          </Link>
          <h1>帖子详情</h1>
        </div>
      </header>

      {/* Main content */}
      <div className={`main-content ${isMobileOrTablet ? 'mobile' : ''}`}>
        {/* Post content */}
        <article className="post-detail">
          {/* Post header */}
          <div className="post-header">
            <div className="post-badges">
              {post.isPinned && <span className="badge pinned">置顶</span>}
              {post.isHot && <span className="badge hot">热门</span>}
              {categories[post.category] && (
                <span
                  className="badge category"
                  style={{ backgroundColor: categories[post.category].color }}
                >
                  {categories[post.category].icon} {categories[post.category].zh}
                </span>
              )}
            </div>
          </div>

          {/* Post title */}
          <h1 className="post-title">{post.title}</h1>

          {/* Author info */}
          <div className="post-author">
            <div className="author-avatar">
              {post.author.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="author-details">
              <span className="author-name">{post.author.username}</span>
              <div className="author-meta">
                {post.author.title && (
                  <span className="author-title">{post.author.title}</span>
                )}
                <span className="post-time">{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Hand data */}
          {post.handData && (
            <div className="hand-data">
              <h4>手牌信息</h4>
              <div className="hand-grid">
                <div className="hand-item">
                  <span className="label">手牌</span>
                  <span className="value">{post.handData.heroHand}</span>
                </div>
                <div className="hand-item">
                  <span className="label">Hero位置</span>
                  <span className="value">{post.handData.heroPosition}</span>
                </div>
                <div className="hand-item">
                  <span className="label">Villain位置</span>
                  <span className="value">{post.handData.villainPosition}</span>
                </div>
                {post.handData.board && (
                  <div className="hand-item">
                    <span className="label">牌面</span>
                    <span className="value">{post.handData.board}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post content */}
          <div className="post-content">
            {post.content.split('\n').map((para, i) => {
              if (para.startsWith('## ')) {
                return <h2 key={i}>{para.slice(3)}</h2>;
              }
              if (para.startsWith('### ')) {
                return <h3 key={i}>{para.slice(4)}</h3>;
              }
              if (para.startsWith('- ')) {
                return <li key={i}>{para.slice(2)}</li>;
              }
              if (para.trim()) {
                return <p key={i}>{para}</p>;
              }
              return null;
            })}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Post actions */}
          <div className="post-actions">
            <button
              className={`action-btn like ${liked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span>{post.likes}</span>
            </button>
            <button className="action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>分享</span>
            </button>
            <button className="action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>收藏</span>
            </button>
          </div>
        </article>

        {/* Comments section */}
        <section className="comments-section">
          <h3>评论 ({comments.length})</h3>

          {/* Comment input */}
          <div className="comment-input">
            <textarea
              placeholder={replyTo ? `回复 @${replyTo}` : '写下你的评论...'}
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
                <p>暂无评论，来发表第一条评论吧！</p>
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
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
