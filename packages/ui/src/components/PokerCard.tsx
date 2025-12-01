import React from 'react';
import { theme } from '../styles/theme';
import { SUIT_SYMBOLS } from '@gto/core';
import type { Card } from '@gto/core';

export interface PokerCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'mini' | 'compact' | 'dark' | 'professional';
  onClick?: () => void;
}

// GTO Wizard style suit colors
const SUIT_CARD_COLORS: Record<string, string> = {
  h: '#ef4444', // Red for hearts
  d: '#3b82f6', // Blue for diamonds
  c: '#22c55e', // Green for clubs
  s: '#64748b', // Gray for spades
};

// Professional style suit colors (4-color deck)
const SUIT_PRO_COLORS: Record<string, string> = {
  h: '#e53935', // Red for hearts
  d: '#2196f3', // Blue for diamonds
  c: '#4caf50', // Green for clubs
  s: '#1a1a1a', // Black for spades
};

export const PokerCard: React.FC<PokerCardProps> = ({
  card,
  faceDown = false,
  size = 'md',
  selected = false,
  disabled = false,
  variant = 'default',
  onClick,
}) => {
  const sizeConfig = {
    xs: { width: 28, height: 38, fontSize: 14, suitSize: 10 },
    sm: { width: 36, height: 50, fontSize: 18, suitSize: 12 },
    md: { width: 48, height: 68, fontSize: 22, suitSize: 14 },
    lg: { width: 60, height: 84, fontSize: 28, suitSize: 18 },
    xl: { width: 72, height: 100, fontSize: 32, suitSize: 22 },
  };

  const { width, height, fontSize, suitSize } = sizeConfig[size];

  // Professional poker style - realistic card design
  if (variant === 'professional') {
    if (faceDown || !card) {
      return (
        <div
          style={{
            width,
            height,
            borderRadius: 4,
            background: 'linear-gradient(145deg, #1a4a8c 0%, #0d2d5c 50%, #1a4a8c 100%)',
            border: '1px solid #2a5a9c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onClick && !disabled ? 'pointer' : 'default',
            opacity: disabled ? 0.4 : 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          onClick={!disabled ? onClick : undefined}
        >
          {/* Card back pattern */}
          <div
            style={{
              width: '80%',
              height: '85%',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.15)',
              background: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.05) 2px,
                  rgba(255,255,255,0.05) 4px
                )
              `,
            }}
          />
        </div>
      );
    }

    const proSuitColor = SUIT_PRO_COLORS[card.suit];
    const proSuitSymbol = SUIT_SYMBOLS[card.suit];

    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: 4,
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
          border: selected ? '2px solid #22d3bf' : '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          padding: '3px',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          opacity: disabled ? 0.4 : 1,
          boxShadow: selected
            ? '0 0 12px rgba(34,211,191,0.4), 0 2px 8px rgba(0,0,0,0.2)'
            : '0 2px 6px rgba(0,0,0,0.15)',
        }}
        onClick={!disabled ? onClick : undefined}
      >
        {/* Top-left rank and suit */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            top: 2,
            left: 3,
          }}
        >
          <span
            style={{
              fontSize: fontSize * 0.7,
              fontWeight: 700,
              color: proSuitColor,
              lineHeight: 1,
              fontFamily: 'Georgia, serif',
            }}
          >
            {card.rank}
          </span>
          <span
            style={{
              fontSize: suitSize * 0.7,
              color: proSuitColor,
              lineHeight: 1,
            }}
          >
            {proSuitSymbol}
          </span>
        </div>
        {/* Center large suit */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: fontSize * 1.2,
              color: proSuitColor,
              lineHeight: 1,
            }}
          >
            {proSuitSymbol}
          </span>
        </div>
        {/* Bottom-right rank and suit (inverted) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            bottom: 2,
            right: 3,
            transform: 'rotate(180deg)',
          }}
        >
          <span
            style={{
              fontSize: fontSize * 0.7,
              fontWeight: 700,
              color: proSuitColor,
              lineHeight: 1,
              fontFamily: 'Georgia, serif',
            }}
          >
            {card.rank}
          </span>
          <span
            style={{
              fontSize: suitSize * 0.7,
              color: proSuitColor,
              lineHeight: 1,
            }}
          >
            {proSuitSymbol}
          </span>
        </div>
      </div>
    );
  }

  // Dark variant - GTO Wizard style with colored background
  // Background colors for each suit
  const SUIT_BG_COLORS: Record<string, string> = {
    h: '#b91c1c', // Dark red for hearts
    d: '#1d4ed8', // Dark blue for diamonds
    c: '#15803d', // Dark green for clubs
    s: '#374151', // Dark gray for spades
  };

  if (variant === 'dark') {
    if (faceDown || !card) {
      return (
        <div
          style={{
            width,
            height,
            borderRadius: 8,
            background: 'linear-gradient(145deg, #2a3a5c 0%, #1a2a4c 100%)',
            border: '1px solid #3a4a6c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onClick && !disabled ? 'pointer' : 'default',
            opacity: disabled ? 0.4 : 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          onClick={!disabled ? onClick : undefined}
        >
          <div
            style={{
              width: '75%',
              height: '80%',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 6px)',
            }}
          />
        </div>
      );
    }

    const bgColor = SUIT_BG_COLORS[card.suit];
    const suitSymbol = SUIT_SYMBOLS[card.suit];

    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: 8,
          background: bgColor,
          border: selected ? '2px solid #22d3bf' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          opacity: disabled ? 0.4 : 1,
          boxShadow: selected ? '0 0 10px rgba(34,211,191,0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={!disabled ? onClick : undefined}
      >
        {/* Large suit symbol as background */}
        <span
          style={{
            position: 'absolute',
            fontSize: 60,
            color: 'rgba(0,0,0,0.25)',
            lineHeight: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(calc(-50% + 8px), -50%)',
          }}
        >
          {suitSymbol}
        </span>
        {/* Large rank in center */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: fontSize * 1.5,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {card.rank}
        </span>
      </div>
    );
  }

  const baseCardStyles: React.CSSProperties = {
    width,
    height,
    borderRadius: theme.borders.radius.md,
    display: 'flex',
    flexDirection: variant === 'mini' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: variant === 'mini' ? '1px' : '2px',
    cursor: onClick && !disabled ? 'pointer' : 'default',
    transition: `all ${theme.transitions.fast}`,
    userSelect: 'none',
    opacity: disabled ? 0.4 : 1,
  };

  if (faceDown || !card) {
    return (
      <div
        style={{
          ...baseCardStyles,
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.surfaceBorder}`,
        }}
        onClick={!disabled ? onClick : undefined}
      >
        <div
          style={{
            width: '70%',
            height: '70%',
            borderRadius: theme.borders.radius.sm,
            background: theme.gradients.secondary,
            opacity: 0.3,
          }}
        />
      </div>
    );
  }

  const suitColor = SUIT_CARD_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  const cardStyles: React.CSSProperties = {
    ...baseCardStyles,
    background: selected ? theme.colors.primary : '#ffffff',
    border: selected
      ? `2px solid ${theme.colors.primary}`
      : `1px solid ${theme.colors.surfaceBorder}`,
    boxShadow: selected ? theme.shadows.glow : theme.shadows.sm,
  };

  if (variant === 'mini') {
    return (
      <div style={cardStyles} onClick={!disabled ? onClick : undefined}>
        <span
          style={{
            fontSize: fontSize * 0.9,
            fontWeight: theme.typography.fontWeight.bold,
            color: selected ? '#000' : suitColor,
            lineHeight: 1,
          }}
        >
          {card.rank}
        </span>
        <span
          style={{
            fontSize: suitSize * 0.9,
            color: selected ? '#000' : suitColor,
            lineHeight: 1,
          }}
        >
          {suitSymbol}
        </span>
      </div>
    );
  }

  return (
    <div style={cardStyles} onClick={!disabled ? onClick : undefined}>
      <span
        style={{
          fontSize,
          fontWeight: theme.typography.fontWeight.bold,
          color: selected ? '#000' : suitColor,
          lineHeight: 1,
          fontFamily: theme.typography.fontFamilyMono,
        }}
      >
        {card.rank}
      </span>
      <span
        style={{
          fontSize: suitSize,
          color: selected ? '#000' : suitColor,
          lineHeight: 1,
        }}
      >
        {suitSymbol}
      </span>
    </div>
  );
};
