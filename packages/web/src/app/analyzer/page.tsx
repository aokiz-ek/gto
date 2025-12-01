'use client';

import { useState } from 'react';
import { Card, Button, PokerCard, ActionButton, PositionBadge, RangeMatrix } from '@gto/ui';
import { useGameStore } from '@/store';
import { parseCard, RANKS, SUITS, createEmptyMatrix, setMatrixValue, HAND_CATEGORIES } from '@gto/core';
import type { Card as CardType, Position, ActionType, Street } from '@gto/core';
import { useResponsive } from '@/hooks';

const SUIT_SYMBOLS: Record<string, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  h: '#ef4444',
  d: '#3b82f6',
  c: '#22c55e',
  s: '#ffffff',
};

// Interactive card button for card selection
function CardButton({
  rank,
  suit,
  isSelected,
  onClick
}: {
  rank: string;
  suit: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        width: isMobile ? '22px' : '24px',
        height: isMobile ? '28px' : '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '10px' : '11px',
        fontWeight: 600,
        background: isSelected ? '#22d3bf' : isHovered ? '#333333' : '#242424',
        border: `1px solid ${isSelected ? '#22d3bf' : isHovered ? '#444444' : 'transparent'}`,
        borderRadius: '4px',
        color: isSelected ? '#000000' : SUIT_COLORS[suit],
        cursor: 'pointer',
        transform: isPressed ? 'scale(0.9)' : isHovered && !isSelected ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHovered && !isSelected ? `0 0 8px ${SUIT_COLORS[suit]}40` : 'none',
        transition: 'all 0.1s ease',
      }}
    >
      {rank}
    </button>
  );
}

// Interactive street tab
function StreetTab({
  street,
  isActive,
  onClick,
  isMobile
}: {
  street: string;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          flex: 1,
          padding: '10px',
          background: isActive ? '#22d3bf' : isHovered ? 'rgba(34, 211, 191, 0.1)' : 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: isActive ? '#000000' : isHovered ? '#ffffff' : '#666666',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          textTransform: 'capitalize',
          transform: isPressed ? 'scale(0.96)' : 'scale(1)',
          transition: 'all 0.1s ease',
        }}
      >
        {street}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        flex: 1,
        padding: '12px',
        background: isActive ? '#1a1a1a' : isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        border: 'none',
        borderBottom: isActive ? '2px solid #22d3bf' : '2px solid transparent',
        color: isActive ? '#ffffff' : isHovered ? '#ffffff' : '#666666',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        textTransform: 'capitalize',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.1s ease',
      }}
    >
      {street}
    </button>
  );
}

// Interactive position badge wrapper
function InteractivePositionBadge({
  position,
  isActive,
  onClick
}: {
  position: Position;
  isActive: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      style={{
        transform: isPressed ? 'scale(0.9)' : isHovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isHovered && !isActive ? '0 0 12px rgba(34, 211, 191, 0.3)' : 'none',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
    >
      <PositionBadge
        position={position}
        size="xs"
        active={isActive}
      />
    </div>
  );
}

// Interactive stat card
function StatCard({
  label,
  value,
  color = '#ffffff'
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: isMobile ? '12px' : '16px',
        background: isHovered ? '#242424' : '#1a1a1a',
        borderRadius: '6px',
        border: `1px solid ${isHovered ? '#333333' : 'transparent'}`,
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.15s ease',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? '20px' : '24px',
        fontWeight: 700,
        color: color,
        fontFamily: "'SF Mono', monospace",
        textShadow: isHovered ? `0 0 15px ${color}50` : 'none',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'left',
        transition: 'all 0.15s ease',
      }}>
        {value}
      </div>
    </div>
  );
}

// Interactive card container with hover
function InteractiveCard({
  children,
  padding = 'md',
  style = {}
}: {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { isMobile } = useResponsive();
  const paddingMap = { sm: '12px', md: isMobile ? '12px' : '16px', lg: isMobile ? '16px' : '20px' };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#0d0d0d',
        border: `1px solid ${isHovered ? '#444444' : '#333333'}`,
        borderRadius: '8px',
        padding: paddingMap[padding],
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Interactive button component
function InteractiveButton({
  onClick,
  children,
  variant = 'default',
  fullWidth = false,
  style = {}
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  fullWidth?: boolean;
  style?: React.CSSProperties;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getStyles = () => {
    if (variant === 'primary') {
      return {
        background: isPressed ? '#14b8a6' : isHovered ? '#1ad4c0' : '#22d3bf',
        color: '#000000',
        border: 'none',
      };
    }
    if (variant === 'ghost') {
      return {
        background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        color: isHovered ? '#ffffff' : '#666666',
        border: `1px solid ${isHovered ? '#444444' : '#333333'}`,
      };
    }
    return {
      background: isHovered ? '#242424' : '#1a1a1a',
      color: isHovered ? '#ffffff' : '#b3b3b3',
      border: `1px solid ${isHovered ? '#444444' : '#333333'}`,
    };
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        ...getStyles(),
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function AnalyzerPage() {
  const {
    street,
    board,
    heroHand,
    heroPosition,
    villainPosition,
    setStreet,
    setBoard,
    setHeroHand,
    setHeroPosition,
    setVillainPosition,
  } = useGameStore();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'hero' | 'board'>('hero');
  const [showCardSelector, setShowCardSelector] = useState(false);

  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

  const positions: Position[] = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const streets: Street[] = ['preflop', 'flop', 'turn', 'river'];

  // Create a sample villain range
  const villainRange = createEmptyMatrix();
  HAND_CATEGORIES.PREMIUM.forEach(hand => setMatrixValue(villainRange, hand, 1));
  HAND_CATEGORIES.STRONG.forEach(hand => setMatrixValue(villainRange, hand, 0.9));
  HAND_CATEGORIES.PLAYABLE.forEach(hand => setMatrixValue(villainRange, hand, 0.7));

  const handleCardSelect = (rank: string, suit: string) => {
    const cardStr = `${rank}${suit}`;
    if (selectedCards.includes(cardStr)) {
      setSelectedCards(selectedCards.filter(c => c !== cardStr));
    } else if (selectedCards.length < 7) {
      setSelectedCards([...selectedCards, cardStr]);
    }
  };

  const applySelection = () => {
    if (selectedCards.length >= 2) {
      const hand = [
        parseCard(selectedCards[0]),
        parseCard(selectedCards[1])
      ] as [CardType, CardType];
      setHeroHand(hand);

      if (selectedCards.length > 2) {
        const boardCards = selectedCards.slice(2).map(parseCard);
        setBoard(boardCards);
      }
    }
    if (isMobileOrTablet) {
      setShowCardSelector(false);
    }
  };

  const clearSelection = () => {
    setSelectedCards([]);
    setHeroHand(null);
    setBoard([]);
  };

  // Card Selector toggle button
  const CardSelectorButton = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    return (
      <button
        onClick={() => setShowCardSelector(!showCardSelector)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 14px',
          background: showCardSelector ? '#22d3bf' : isHovered ? '#242424' : '#1a1a1a',
          border: `1px solid ${showCardSelector ? '#22d3bf' : isHovered ? '#444444' : '#333333'}`,
          borderRadius: '8px',
          color: showCardSelector ? '#000000' : '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: showCardSelector ? 'rotate(45deg)' : isHovered ? 'rotate(15deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        Cards
      </button>
    );
  };

  // Card Selector Component
  const CardSelector = () => (
    <div style={{ padding: isMobile ? '12px' : '16px 20px', flex: 1, overflow: 'auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: '#666666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Select Cards ({selectedCards.length}/7)
        </div>
        <InteractiveButton onClick={clearSelection} variant="ghost" style={{ padding: '4px 8px', fontSize: '11px' }}>
          Clear
        </InteractiveButton>
      </div>

      {/* Card Grid by Suits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {SUITS.map(suit => (
          <div key={suit} style={{
            display: 'flex',
            gap: isMobile ? '2px' : '4px',
            padding: '8px',
            background: '#1a1a1a',
            borderRadius: '6px',
          }}>
            <div style={{
              width: isMobile ? '20px' : '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '14px' : '16px',
              color: SUIT_COLORS[suit],
            }}>
              {SUIT_SYMBOLS[suit]}
            </div>
            {RANKS.map(rank => {
              const cardStr = `${rank}${suit}`;
              const isSelected = selectedCards.includes(cardStr);
              return (
                <CardButton
                  key={cardStr}
                  rank={rank}
                  suit={suit}
                  isSelected={isSelected}
                  onClick={() => handleCardSelect(rank, suit)}
                />
              );
            })}
          </div>
        ))}
      </div>

      <InteractiveButton
        variant="primary"
        fullWidth
        onClick={applySelection}
        style={{ marginTop: '16px', padding: '12px' }}
      >
        Apply Selection
      </InteractiveButton>
    </div>
  );

  // Position Selector Component
  const PositionSelector = () => (
    <div style={{
      padding: isMobile ? '12px' : '16px 20px',
      borderBottom: '1px solid #333333',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: '#666666',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Hero Position
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}>
          {positions.map(pos => (
            <InteractivePositionBadge
              key={pos}
              position={pos}
              isActive={heroPosition === pos}
              onClick={() => setHeroPosition(pos)}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: '#666666',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Villain Position
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}>
          {positions.filter(p => p !== heroPosition).map(pos => (
            <InteractivePositionBadge
              key={pos}
              position={pos}
              isActive={villainPosition === pos}
              onClick={() => setVillainPosition(pos)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobileOrTablet ? 'column' : 'row',
      minHeight: 'calc(100vh - 56px)',
      background: '#0d0d0d',
    }}>
      {/* Mobile Header */}
      {isMobileOrTablet && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #333333',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '2px',
              }}>
                Hand Analyzer
              </h1>
              <p style={{ fontSize: '13px', color: '#666666' }}>
                Analyze any hand situation
              </p>
            </div>
            <CardSelectorButton />
          </div>

          {/* Street Tabs */}
          <div style={{
            display: 'flex',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '4px',
          }}>
            {streets.map(s => (
              <StreetTab
                key={s}
                street={s}
                isActive={street === s}
                onClick={() => setStreet(s)}
                isMobile={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Card Selector Panel */}
      {isMobileOrTablet && showCardSelector && (
        <div style={{
          borderBottom: '1px solid #333333',
          background: '#0d0d0d',
          animation: 'slideDown 0.2s ease',
        }}>
          <PositionSelector />
          <CardSelector />
        </div>
      )}

      {/* Left Panel - Card Selection (Desktop) */}
      {!isMobileOrTablet && (
        <div style={{
          width: '380px',
          borderRight: '1px solid #333333',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #333333',
          }}>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '4px',
            }}>
              Hand Analyzer
            </h1>
            <p style={{ fontSize: '13px', color: '#666666' }}>
              Analyze any hand situation
            </p>
          </div>

          {/* Street Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333333',
          }}>
            {streets.map(s => (
              <StreetTab
                key={s}
                street={s}
                isActive={street === s}
                onClick={() => setStreet(s)}
              />
            ))}
          </div>

          <PositionSelector />
          <CardSelector />
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '16px' : '24px',
        overflow: 'auto',
      }}>
        {/* Hand Display */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '24px',
          alignItems: isMobile ? 'stretch' : 'flex-start',
        }}>
          {/* Hero Hand */}
          <InteractiveCard padding="lg" style={{ flex: 1 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#666666',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Hero Hand
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              padding: isMobile ? '12px 0' : '20px 0',
            }}>
              {heroHand ? (
                <>
                  <PokerCard card={heroHand[0]} size={isMobile ? 'lg' : 'xl'} />
                  <PokerCard card={heroHand[1]} size={isMobile ? 'lg' : 'xl'} />
                </>
              ) : (
                <>
                  <PokerCard faceDown size={isMobile ? 'lg' : 'xl'} />
                  <PokerCard faceDown size={isMobile ? 'lg' : 'xl'} />
                </>
              )}
            </div>
          </InteractiveCard>

          {/* Board */}
          <InteractiveCard padding="lg" style={{ flex: isMobile ? 1 : 2 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#666666',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Board
            </div>
            <div style={{
              display: 'flex',
              gap: isMobile ? '4px' : '8px',
              justifyContent: 'center',
              padding: isMobile ? '12px 0' : '20px 0',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}>
              {[0, 1, 2, 3, 4].map(i => {
                const showCard = street === 'preflop' ? false :
                  street === 'flop' ? i < 3 :
                  street === 'turn' ? i < 4 : true;
                return (
                  <PokerCard
                    key={i}
                    card={board[i]}
                    faceDown={!board[i] && showCard}
                    size={isMobile ? 'md' : 'lg'}
                    disabled={!showCard}
                  />
                );
              })}
            </div>
          </InteractiveCard>
        </div>

        {/* Analysis Results */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px',
        }}>
          {/* GTO Strategy */}
          <InteractiveCard padding="lg">
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '16px',
            }}>
              GTO Strategy
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              <ActionButton action="raise" frequency={0.65} selected size={isMobile ? 'sm' : 'md'} />
              <ActionButton action="call" frequency={0.25} size={isMobile ? 'sm' : 'md'} />
              <ActionButton action="fold" frequency={0.10} size={isMobile ? 'sm' : 'md'} />
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <StatCard label="Equity" value="62.3%" color="#22d3bf" />
              <StatCard label="Expected Value" value="+3.2 BB" color="#22c55e" />
              <StatCard label="Pot Odds" value="33.3%" />
              <StatCard label="SPR" value="4.2" />
            </div>
          </InteractiveCard>

          {/* Villain Range */}
          <InteractiveCard padding="lg">
            <VillainRangeHeader position={villainPosition} />
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto',
            }}>
              <RangeMatrix
                matrix={villainRange}
                size={isMobile ? 'xs' : 'xs'}
                showLabels={false}
                interactive={false}
              />
            </div>
            <RangeStats isMobile={isMobile} />
          </InteractiveCard>
        </div>
      </div>
    </div>
  );
}

// Villain range header component
function VillainRangeHeader({ position }: { position: Position | null }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#ffffff',
      }}>
        Villain Range
      </div>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '4px 10px',
          background: isHovered ? '#8b5cf630' : '#8b5cf620',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#8b5cf6',
          fontWeight: 500,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.15s ease',
          cursor: 'default',
        }}
      >
        {position}
      </div>
    </div>
  );
}

// Range stats component
function RangeStats({ isMobile }: { isMobile: boolean }) {
  const stats = [
    { label: 'Range', value: '18.5%' },
    { label: 'Combos', value: '248' },
    { label: 'Avg Equity', value: '54.2%' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '16px',
      padding: '12px',
      background: '#1a1a1a',
      borderRadius: '6px',
      flexWrap: 'wrap',
      gap: '8px',
    }}>
      {stats.map((stat, index) => (
        <RangeStatItem key={index} label={stat.label} value={stat.value} isMobile={isMobile} />
      ))}
    </div>
  );
}

function RangeStatItem({
  label,
  value,
  isMobile
}: {
  label: string;
  value: string;
  isMobile: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textAlign: isMobile ? 'center' : 'left',
        flex: isMobile ? '1 1 30%' : 'none',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: '11px', color: '#666666' }}>{label}</div>
      <div style={{
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: 600,
        color: isHovered ? '#22d3bf' : '#ffffff',
        transition: 'color 0.15s ease',
      }}>
        {value}
      </div>
    </div>
  );
}
