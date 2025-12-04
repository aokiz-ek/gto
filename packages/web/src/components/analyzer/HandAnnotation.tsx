'use client';

import { useState, useEffect, CSSProperties } from 'react';
import type { Card as CardType } from '@gto/core';

// 项目统一色系
const COLORS = {
  primary: '#00f5d4',      // 主色 - 青色
  secondary: '#9b5de5',    // 次色 - 紫色
  accent: '#f15bb5',       // 强调色 - 粉色
  success: '#00f5d4',      // 成功 - 青色
  warning: '#fbbf24',      // 警告 - 黄色
  danger: '#ef4444',       // 危险 - 红色
  bgDark: '#0a0a0f',       // 深背景
  bgCard: '#12121a',       // 卡片背景
  bgSurface: '#1a1a24',    // 表面背景
  border: '#2a2a3a',       // 边框
  textPrimary: '#ffffff',  // 主文本
  textSecondary: '#9ca3af', // 次文本
  textMuted: '#6b7280',    // 弱化文本
};

interface Annotation {
  id: string;
  text: string;
  category: string;
  timestamp: number;
}

interface HandAnnotationProps {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  onAnnotationChange?: (annotations: Annotation[]) => void;
}

const CATEGORIES = [
  { id: 'correct', label: '正确', color: COLORS.success },
  { id: 'review', label: '待研究', color: COLORS.warning },
  { id: 'mistake', label: '错误', color: COLORS.danger },
  { id: 'exploit', label: '剥削', color: COLORS.secondary },
  { id: 'note', label: '备注', color: COLORS.primary },
];

const QUICK_TAGS = [
  '标准线', '剥削调整', '需要复习', '边缘情况',
  '多人底池', '位置优势', '诈唬点', '价值下注',
];

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.15s',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    fontSize: '1.1rem',
    color: COLORS.primary,
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.textPrimary,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  count: {
    padding: '2px 8px',
    background: `${COLORS.primary}20`,
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.primary,
  },
  toggle: {
    color: COLORS.textMuted,
    transition: 'transform 0.2s',
    display: 'flex',
  },
  body: {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  categories: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  category: {
    padding: '5px 10px',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    background: COLORS.bgDark,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: COLORS.textPrimary,
    outline: 'none',
  },
  addBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '18px',
    fontWeight: 500,
    color: COLORS.bgDark,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s, transform 0.15s',
  },
  quickTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  tag: {
    padding: '4px 8px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    fontSize: '10px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    maxHeight: '180px',
    overflowY: 'auto' as const,
  },
  listEmpty: {
    padding: '16px',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: COLORS.textMuted,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px',
    background: COLORS.bgDark,
    borderRadius: '8px',
  },
  itemIndicator: {
    width: '3px',
    minHeight: '32px',
    borderRadius: '2px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  itemText: {
    fontSize: '12px',
    color: COLORS.textPrimary,
    lineHeight: 1.4,
    wordBreak: 'break-word' as const,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
  },
  itemCategory: {
    fontWeight: 500,
  },
  itemTime: {
    color: COLORS.textMuted,
  },
  itemRemove: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    background: 'transparent',
    border: 'none',
    color: COLORS.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  clearBtn: {
    padding: '8px',
    background: 'transparent',
    border: `1px dashed ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '10px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  emptyState: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  },
  emptyIcon: {
    color: COLORS.border,
    marginBottom: '10px',
  },
  emptyTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '11px',
    color: COLORS.textMuted,
  },
};

export function HandAnnotation({
  heroHand,
  board,
  onAnnotationChange,
}: HandAnnotationProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('note');
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [hoveredRemove, setHoveredRemove] = useState<string | null>(null);

  const handKey = heroHand
    ? `${heroHand[0].rank}${heroHand[0].suit}${heroHand[1].rank}${heroHand[1].suit}_${board.map(c => c.rank + c.suit).join('')}`
    : null;

  useEffect(() => {
    if (handKey) {
      const saved = localStorage.getItem(`gto-annotation-${handKey}`);
      if (saved) {
        try {
          setAnnotations(JSON.parse(saved));
        } catch {
          setAnnotations([]);
        }
      } else {
        setAnnotations([]);
      }
    }
  }, [handKey]);

  const saveAnnotations = (newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
    if (handKey) {
      localStorage.setItem(`gto-annotation-${handKey}`, JSON.stringify(newAnnotations));
    }
    onAnnotationChange?.(newAnnotations);
  };

  const addAnnotation = (text: string) => {
    if (!text.trim()) return;
    const annotation: Annotation = {
      id: Date.now().toString(),
      text: text.trim(),
      category: selectedCategory,
      timestamp: Date.now(),
    };
    saveAnnotations([...annotations, annotation]);
    setNewNote('');
  };

  const removeAnnotation = (id: string) => {
    saveAnnotations(annotations.filter(a => a.id !== id));
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[4];
  };

  if (!heroHand) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        <div style={styles.emptyTitle}>策略笔记</div>
        <div style={styles.emptyHint}>选择手牌后添加笔记</div>
      </div>
    );
  }

  const currentCategory = getCategoryInfo(selectedCategory);

  return (
    <div style={styles.card}>
      {/* Header */}
      <button
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>📝</span>
          <span style={styles.title}>策略笔记</span>
        </div>
        <div style={styles.headerRight}>
          {annotations.length > 0 && (
            <span style={styles.count}>{annotations.length}</span>
          )}
          <span style={{
            ...styles.toggle,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={styles.body}>
          {/* Category Selector */}
          <div style={styles.categories}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                style={{
                  ...styles.category,
                  background: selectedCategory === cat.id ? `${cat.color}20` : 'transparent',
                  borderColor: selectedCategory === cat.id ? cat.color : COLORS.border,
                  color: selectedCategory === cat.id ? cat.color : COLORS.textSecondary,
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              type="text"
              style={{
                ...styles.input,
                borderColor: `${currentCategory.color}50`,
              }}
              placeholder="输入笔记..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addAnnotation(newNote)}
            />
            <button
              style={{
                ...styles.addBtn,
                background: currentCategory.color,
                opacity: !newNote.trim() ? 0.4 : 1,
                cursor: !newNote.trim() ? 'not-allowed' : 'pointer',
              }}
              onClick={() => addAnnotation(newNote)}
              disabled={!newNote.trim()}
            >
              +
            </button>
          </div>

          {/* Quick Tags */}
          <div style={styles.quickTags}>
            {QUICK_TAGS.map(tag => (
              <button
                key={tag}
                style={{
                  ...styles.tag,
                  background: hoveredTag === tag ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  color: hoveredTag === tag ? COLORS.textSecondary : COLORS.textMuted,
                }}
                onClick={() => addAnnotation(tag)}
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Annotations List */}
          <div style={styles.list}>
            {annotations.length === 0 ? (
              <div style={styles.listEmpty}>
                暂无笔记
              </div>
            ) : (
              annotations.map(a => {
                const cat = getCategoryInfo(a.category);
                return (
                  <div key={a.id} style={styles.item}>
                    <div style={{ ...styles.itemIndicator, background: cat.color }} />
                    <div style={styles.itemContent}>
                      <span style={styles.itemText}>{a.text}</span>
                      <span style={styles.itemMeta}>
                        <span style={{ ...styles.itemCategory, color: cat.color }}>{cat.label}</span>
                        <span style={styles.itemTime}>
                          {new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </div>
                    <button
                      style={{
                        ...styles.itemRemove,
                        background: hoveredRemove === a.id ? `${COLORS.danger}20` : 'transparent',
                        color: hoveredRemove === a.id ? COLORS.danger : COLORS.textMuted,
                      }}
                      onClick={() => removeAnnotation(a.id)}
                      onMouseEnter={() => setHoveredRemove(a.id)}
                      onMouseLeave={() => setHoveredRemove(null)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Clear Button */}
          {annotations.length > 0 && (
            <button
              style={styles.clearBtn}
              onClick={() => saveAnnotations([])}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${COLORS.danger}50`;
                e.currentTarget.style.color = COLORS.danger;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textMuted;
              }}
            >
              清空所有笔记
            </button>
          )}
        </div>
      )}
    </div>
  );
}
