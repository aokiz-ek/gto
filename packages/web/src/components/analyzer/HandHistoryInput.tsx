'use client';

import { useState, CSSProperties } from 'react';
import type { Card as CardType, Street } from '@gto/core';

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

interface ParsedHand {
  heroHand: [CardType, CardType] | null;
  board: CardType[];
  heroPosition: string;
  villainPosition: string;
  potSize: number;
  street: Street;
  actions: { player: string; action: string; amount?: number }[];
}

interface HandHistoryInputProps {
  onHandParsed?: (hand: ParsedHand) => void;
}

// 支持的手牌格式示例
const EXAMPLE_FORMATS = [
  {
    name: 'PokerStars',
    example: `PokerStars Hand #123456789
Seat 1: Hero (BTN) [Ah Kd]
*** FLOP *** [Jh 9c 2d]
Hero: raises $10`,
  },
  {
    name: 'GGPoker',
    example: `Seat 3: Hero [As Ks]
*** FLOP *** [Qh Jd Tc]
Hero: bets $5`,
  },
  {
    name: '简易格式',
    example: `Hero: AhKs BTN
Board: Jh9c2d
Pot: 100`,
  },
];

// 解析扑克牌字符串为Card对象
function parseCard(cardStr: string): CardType | null {
  const rankMap: Record<string, string> = {
    'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': 'T', '10': 'T',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
  };
  const suitMap: Record<string, 'h' | 's' | 'd' | 'c'> = {
    'h': 'h', 's': 's', 'd': 'd', 'c': 'c',
    '♥': 'h', '♠': 's', '♦': 'd', '♣': 'c',
    'H': 'h', 'S': 's', 'D': 'd', 'C': 'c',
  };

  const cleaned = cardStr.trim();
  if (cleaned.length < 2) return null;

  const rank = rankMap[cleaned.slice(0, -1)] || rankMap[cleaned[0]];
  const suit = suitMap[cleaned.slice(-1)];

  if (!rank || !suit) return null;

  return { rank: rank as CardType['rank'], suit };
}

// 解析手牌历史
function parseHandHistory(text: string): ParsedHand {
  const result: ParsedHand = {
    heroHand: null,
    board: [],
    heroPosition: 'BTN',
    villainPosition: 'BB',
    potSize: 0,
    street: 'preflop',
    actions: [],
  };

  // 尝试解析Hero手牌
  const heroHandMatch = text.match(/Hero[:\s]*\[?([AKQJT2-9][hsdc♥♠♦♣])\s*([AKQJT2-9][hsdc♥♠♦♣])\]?/i);
  if (heroHandMatch) {
    const card1 = parseCard(heroHandMatch[1]);
    const card2 = parseCard(heroHandMatch[2]);
    if (card1 && card2) {
      result.heroHand = [card1, card2];
    }
  }

  // 尝试解析公共牌
  const boardMatch = text.match(/(?:FLOP|Board|公共牌)[:\s*\[]*([AKQJT2-9][hsdc♥♠♦♣]\s*[AKQJT2-9][hsdc♥♠♦♣]\s*[AKQJT2-9][hsdc♥♠♦♣])(?:\s*([AKQJT2-9][hsdc♥♠♦♣]))?(?:\s*([AKQJT2-9][hsdc♥♠♦♣]))?/i);
  if (boardMatch) {
    const boardCards = boardMatch[0].match(/[AKQJT2-9][hsdc♥♠♦♣]/gi) || [];
    result.board = boardCards.map(parseCard).filter((c): c is CardType => c !== null);

    if (result.board.length >= 5) {
      result.street = 'river';
    } else if (result.board.length === 4) {
      result.street = 'turn';
    } else if (result.board.length >= 3) {
      result.street = 'flop';
    }
  }

  // 尝试解析位置
  const posMatch = text.match(/(UTG|UTG1|UTG2|LJ|HJ|CO|BTN|SB|BB)/gi);
  if (posMatch && posMatch.length > 0) {
    result.heroPosition = posMatch[0].toUpperCase();
    if (posMatch.length > 1) {
      result.villainPosition = posMatch[1].toUpperCase();
    }
  }

  // 尝试解析底池
  const potMatch = text.match(/(?:Pot|底池)[:\s]*\$?(\d+)/i);
  if (potMatch) {
    result.potSize = parseInt(potMatch[1]);
  }

  // 解析行动
  const actionPatterns = [
    /(\w+)[:\s]*(raises?|bets?|calls?|checks?|folds?)\s*\$?(\d+)?/gi,
  ];
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      result.actions.push({
        player: match[1],
        action: match[2].toLowerCase().replace(/s$/, ''),
        amount: match[3] ? parseInt(match[3]) : undefined,
      });
    }
  }

  return result;
}

// Styles
const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(145deg, ${COLORS.bgSurface}, ${COLORS.bgCard})`,
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: `1px solid ${COLORS.border}`,
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
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    background: COLORS.bgDark,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: "'SF Mono', monospace",
    color: COLORS.textPrimary,
    resize: 'vertical' as const,
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
  },
  parseBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  clearBtn: {
    padding: '10px 16px',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  result: {
    padding: '14px',
    background: COLORS.bgDark,
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
  },
  resultTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  resultItem: {
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
  },
  resultLabel: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginBottom: '4px',
  },
  resultValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    fontFamily: "'SF Mono', monospace",
  },
  exampleSection: {
    marginTop: '8px',
  },
  exampleTitle: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginBottom: '8px',
  },
  exampleList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  exampleItem: {
    padding: '8px 10px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  exampleName: {
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '4px',
  },
  exampleText: {
    fontSize: '10px',
    fontFamily: "'SF Mono', monospace",
    color: COLORS.textMuted,
    whiteSpace: 'pre-wrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxHeight: '40px',
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: `${COLORS.success}20`,
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.success,
    marginBottom: '10px',
  },
  errorBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: `${COLORS.danger}20`,
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    color: COLORS.danger,
    marginBottom: '10px',
  },
  cardDisplay: {
    display: 'flex',
    gap: '4px',
  },
  miniCard: {
    padding: '4px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: "'SF Mono', monospace",
  },
};

type InputMode = 'paste' | 'examples';

export function HandHistoryInput({ onHandParsed }: HandHistoryInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedHand | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [hoveredExample, setHoveredExample] = useState<number | null>(null);

  const handleParse = () => {
    if (!inputText.trim()) {
      setParseError('请输入手牌历史');
      setParsedResult(null);
      return;
    }

    const result = parseHandHistory(inputText);

    if (!result.heroHand && result.board.length === 0) {
      setParseError('无法解析手牌信息，请检查格式');
      setParsedResult(null);
      return;
    }

    setParseError(null);
    setParsedResult(result);
    onHandParsed?.(result);
  };

  const handleClear = () => {
    setInputText('');
    setParsedResult(null);
    setParseError(null);
  };

  const handleExampleClick = (example: typeof EXAMPLE_FORMATS[0]) => {
    setInputText(example.example);
    setInputMode('paste');
  };

  const getSuitColor = (suit: string): string => {
    return suit === 'h' || suit === 'd' ? COLORS.danger : COLORS.textPrimary;
  };

  const formatCard = (card: CardType): string => {
    const suitSymbol: Record<string, string> = { h: '♥', s: '♠', d: '♦', c: '♣' };
    return `${card.rank}${suitSymbol[card.suit]}`;
  };

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
          <span style={styles.headerIcon}>📋</span>
          <span style={styles.title}>手牌历史导入</span>
        </div>
        <span style={{
          ...styles.toggle,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </span>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={styles.body}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {(['paste', 'examples'] as InputMode[]).map(mode => (
              <button
                key={mode}
                style={{
                  ...styles.tab,
                  background: inputMode === mode ? `${COLORS.primary}20` : 'transparent',
                  borderColor: inputMode === mode ? COLORS.primary : COLORS.border,
                  color: inputMode === mode ? COLORS.primary : COLORS.textSecondary,
                }}
                onClick={() => setInputMode(mode)}
              >
                {mode === 'paste' ? '粘贴手牌' : '格式示例'}
              </button>
            ))}
          </div>

          {inputMode === 'paste' ? (
            <>
              {/* Textarea */}
              <textarea
                style={styles.textarea}
                placeholder="粘贴手牌历史记录...&#10;支持 PokerStars、GGPoker 等常见格式"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              {/* Buttons */}
              <div style={styles.buttonRow}>
                <button
                  style={{
                    ...styles.parseBtn,
                    background: inputText.trim() ? COLORS.primary : COLORS.border,
                    color: inputText.trim() ? COLORS.bgDark : COLORS.textMuted,
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  }}
                  onClick={handleParse}
                  disabled={!inputText.trim()}
                >
                  解析手牌
                </button>
                <button
                  style={styles.clearBtn}
                  onClick={handleClear}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.danger;
                    e.currentTarget.style.color = COLORS.danger;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.color = COLORS.textSecondary;
                  }}
                >
                  清空
                </button>
              </div>

              {/* Parse Result */}
              {parseError && (
                <div style={styles.errorBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {parseError}
                </div>
              )}

              {parsedResult && (
                <div style={styles.result}>
                  <div style={styles.successBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    解析成功
                  </div>

                  <div style={styles.resultGrid}>
                    {/* Hero Hand */}
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>手牌</div>
                      <div style={styles.cardDisplay}>
                        {parsedResult.heroHand ? (
                          parsedResult.heroHand.map((card, i) => (
                            <span
                              key={i}
                              style={{
                                ...styles.miniCard,
                                background: getSuitColor(card.suit) === COLORS.danger ? `${COLORS.danger}20` : 'rgba(255, 255, 255, 0.1)',
                                color: getSuitColor(card.suit),
                              }}
                            >
                              {formatCard(card)}
                            </span>
                          ))
                        ) : (
                          <span style={{ ...styles.resultValue, color: COLORS.textMuted }}>-</span>
                        )}
                      </div>
                    </div>

                    {/* Position */}
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>位置</div>
                      <div style={styles.resultValue}>{parsedResult.heroPosition}</div>
                    </div>

                    {/* Board */}
                    <div style={{ ...styles.resultItem, gridColumn: '1 / -1' }}>
                      <div style={styles.resultLabel}>公共牌 ({parsedResult.street})</div>
                      <div style={styles.cardDisplay}>
                        {parsedResult.board.length > 0 ? (
                          parsedResult.board.map((card, i) => (
                            <span
                              key={i}
                              style={{
                                ...styles.miniCard,
                                background: getSuitColor(card.suit) === COLORS.danger ? `${COLORS.danger}20` : 'rgba(255, 255, 255, 0.1)',
                                color: getSuitColor(card.suit),
                              }}
                            >
                              {formatCard(card)}
                            </span>
                          ))
                        ) : (
                          <span style={{ ...styles.resultValue, color: COLORS.textMuted }}>-</span>
                        )}
                      </div>
                    </div>

                    {/* Pot */}
                    {parsedResult.potSize > 0 && (
                      <div style={styles.resultItem}>
                        <div style={styles.resultLabel}>底池</div>
                        <div style={{ ...styles.resultValue, color: COLORS.primary }}>
                          ${parsedResult.potSize}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {parsedResult.actions.length > 0 && (
                      <div style={styles.resultItem}>
                        <div style={styles.resultLabel}>行动</div>
                        <div style={{ ...styles.resultValue, fontSize: '11px' }}>
                          {parsedResult.actions.length} 个行动
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.exampleSection}>
              <div style={styles.exampleTitle}>点击示例填充到输入框</div>
              <div style={styles.exampleList}>
                {EXAMPLE_FORMATS.map((example, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.exampleItem,
                      background: hoveredExample === i ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                      borderLeft: hoveredExample === i ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                    }}
                    onClick={() => handleExampleClick(example)}
                    onMouseEnter={() => setHoveredExample(i)}
                    onMouseLeave={() => setHoveredExample(null)}
                  >
                    <div style={styles.exampleName}>{example.name}</div>
                    <div style={styles.exampleText}>{example.example}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
