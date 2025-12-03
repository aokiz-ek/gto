'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
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
  /** Enable 3D flip animation */
  animated?: boolean;
  /** Enable hover tilt effect */
  tiltOnHover?: boolean;
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

// Background colors for dark variant
const SUIT_BG_COLORS: Record<string, string> = {
  h: '#b91c1c', // Dark red for hearts
  d: '#1d4ed8', // Dark blue for diamonds
  c: '#15803d', // Dark green for clubs
  s: '#374151', // Dark gray for spades
};

// CSS keyframes for animations (injected once)
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pokerCardSelect {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1.05); }
      }

      @keyframes pokerCardShine {
        0% { left: -100%; }
        100% { left: 200%; }
      }

      @keyframes pokerCardPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 191, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(34, 211, 191, 0); }
      }
    `;
    document.head.appendChild(style);
  };
})();

export const PokerCard = memo<PokerCardProps>(({
  card,
  faceDown = false,
  size = 'md',
  selected = false,
  disabled = false,
  variant = 'default',
  onClick,
  animated = true,
  tiltOnHover = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [wasJustSelected, setWasJustSelected] = useState(false);

  // Inject animation styles
  if (typeof window !== 'undefined') {
    injectStyles();
  }

  const sizeConfig = {
    xs: { width: 28, height: 38, fontSize: 14, suitSize: 10 },
    sm: { width: 36, height: 50, fontSize: 18, suitSize: 12 },
    md: { width: 48, height: 68, fontSize: 22, suitSize: 14 },
    lg: { width: 60, height: 84, fontSize: 28, suitSize: 18 },
    xl: { width: 72, height: 100, fontSize: 32, suitSize: 22 },
  };

  const { width, height, fontSize, suitSize } = sizeConfig[size];

  // Handle mouse move for tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltOnHover || disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setTiltStyle({
      transform: `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.05)`,
    });
  }, [tiltOnHover, disabled]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTiltStyle({});
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || !onClick) return;
    setWasJustSelected(true);
    setTimeout(() => setWasJustSelected(false), 300);
    onClick();
  }, [disabled, onClick]);

  // Container style with 3D perspective
  const containerStyle = useMemo((): React.CSSProperties => ({
    perspective: '1000px',
    display: 'inline-block',
  }), []);

  // Card wrapper for 3D flip
  const cardWrapperStyle = useMemo((): React.CSSProperties => ({
    position: 'relative',
    width,
    height,
    transformStyle: 'preserve-3d',
    transition: animated ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    transform: faceDown ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }), [width, height, faceDown, animated]);

  // Common face style
  const faceStyle = useMemo((): React.CSSProperties => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  }), []);

  // Professional variant with 3D flip
  if (variant === 'professional') {
    const proSuitColor = card ? SUIT_PRO_COLORS[card.suit] : '#666';
    const proSuitSymbol = card ? SUIT_SYMBOLS[card.suit] : '';

    return (
      <div style={containerStyle}>
        <div
          style={cardWrapperStyle}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Front face */}
          <div
            style={{
              ...faceStyle,
              borderRadius: 4,
              background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
              border: selected ? '2px solid #22d3bf' : '1px solid #ddd',
              cursor: onClick && !disabled ? 'pointer' : 'default',
              opacity: disabled ? 0.4 : 1,
              boxShadow: selected
                ? '0 0 20px rgba(34,211,191,0.5), 0 8px 16px rgba(0,0,0,0.2)'
                : isHovered
                  ? '0 12px 24px rgba(0,0,0,0.25)'
                  : '0 2px 6px rgba(0,0,0,0.15)',
              animation: wasJustSelected ? 'pokerCardSelect 0.3s ease' : 'none',
              ...(isHovered && tiltOnHover ? tiltStyle : {}),
              transition: 'box-shadow 0.3s ease, transform 0.15s ease',
            }}
          >
            {card && (
              <>
                {/* Top-left rank and suit */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'absolute',
                  top: 2,
                  left: 3,
                }}>
                  <span style={{
                    fontSize: fontSize * 0.7,
                    fontWeight: 700,
                    color: proSuitColor,
                    lineHeight: 1,
                    fontFamily: 'Georgia, serif',
                  }}>
                    {card.rank}
                  </span>
                  <span style={{
                    fontSize: suitSize * 0.7,
                    color: proSuitColor,
                    lineHeight: 1,
                  }}>
                    {proSuitSymbol}
                  </span>
                </div>
                {/* Center suit */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}>
                  <span style={{
                    fontSize: fontSize * 1.2,
                    color: proSuitColor,
                    lineHeight: 1,
                  }}>
                    {proSuitSymbol}
                  </span>
                </div>
                {/* Bottom-right rank and suit */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'absolute',
                  bottom: 2,
                  right: 3,
                  transform: 'rotate(180deg)',
                }}>
                  <span style={{
                    fontSize: fontSize * 0.7,
                    fontWeight: 700,
                    color: proSuitColor,
                    lineHeight: 1,
                    fontFamily: 'Georgia, serif',
                  }}>
                    {card.rank}
                  </span>
                  <span style={{
                    fontSize: suitSize * 0.7,
                    color: proSuitColor,
                    lineHeight: 1,
                  }}>
                    {proSuitSymbol}
                  </span>
                </div>
              </>
            )}
            {/* Shine effect on hover */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'pokerCardShine 0.6s ease-out',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Back face */}
          <div
            style={{
              ...faceStyle,
              borderRadius: 4,
              background: 'linear-gradient(145deg, #1a4a8c 0%, #0d2d5c 50%, #1a4a8c 100%)',
              border: '1px solid #2a5a9c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onClick && !disabled ? 'pointer' : 'default',
              opacity: disabled ? 0.4 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              transform: 'rotateY(180deg)',
            }}
          >
            <div style={{
              width: '80%',
              height: '85%',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.15)',
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.05) 2px,
                rgba(255,255,255,0.05) 4px
              )`,
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Dark variant with 3D flip
  if (variant === 'dark') {
    const bgColor = card ? SUIT_BG_COLORS[card.suit] : '#374151';
    const suitSymbol = card ? SUIT_SYMBOLS[card.suit] : '';

    return (
      <div style={containerStyle}>
        <div
          style={cardWrapperStyle}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Front face */}
          <div
            style={{
              ...faceStyle,
              borderRadius: 8,
              background: bgColor,
              border: selected ? '2px solid #22d3bf' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onClick && !disabled ? 'pointer' : 'default',
              opacity: disabled ? 0.4 : 1,
              boxShadow: selected
                ? '0 0 20px rgba(34,211,191,0.5), 0 8px 16px rgba(0,0,0,0.3)'
                : isHovered
                  ? '0 12px 24px rgba(0,0,0,0.4)'
                  : '0 2px 6px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              animation: wasJustSelected ? 'pokerCardSelect 0.3s ease' : selected ? 'pokerCardPulse 2s ease-in-out infinite' : 'none',
              ...(isHovered && tiltOnHover ? tiltStyle : {}),
              transition: 'box-shadow 0.3s ease, transform 0.15s ease',
            }}
          >
            {card && (
              <>
                {/* Large suit symbol as background */}
                <span style={{
                  position: 'absolute',
                  fontSize: 60,
                  color: 'rgba(0,0,0,0.25)',
                  lineHeight: 1,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(calc(-50% + 8px), -50%)',
                  transition: 'transform 0.3s ease',
                }}>
                  {suitSymbol}
                </span>
                {/* Large rank in center */}
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: fontSize * 1.5,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  {card.rank}
                </span>
              </>
            )}
            {/* Shine effect on hover */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'pokerCardShine 0.6s ease-out',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Back face */}
          <div
            style={{
              ...faceStyle,
              borderRadius: 8,
              background: 'linear-gradient(145deg, #2a3a5c 0%, #1a2a4c 100%)',
              border: '1px solid #3a4a6c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onClick && !disabled ? 'pointer' : 'default',
              opacity: disabled ? 0.4 : 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transform: 'rotateY(180deg)',
            }}
          >
            <div style={{
              width: '75%',
              height: '80%',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 6px)',
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Default and mini variants
  const suitColor = card ? SUIT_CARD_COLORS[card.suit] : '#666';
  const suitSymbol = card ? SUIT_SYMBOLS[card.suit] : '';

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
    userSelect: 'none',
    opacity: disabled ? 0.4 : 1,
  };

  // Simple card without flip (default/mini variants)
  if (!animated || variant === 'mini') {
    if (faceDown || !card) {
      return (
        <div
          style={{
            ...baseCardStyles,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.surfaceBorder}`,
            transition: `all ${theme.transitions.fast}`,
          }}
          onClick={handleClick}
        >
          <div style={{
            width: '70%',
            height: '70%',
            borderRadius: theme.borders.radius.sm,
            background: theme.gradients.secondary,
            opacity: 0.3,
          }} />
        </div>
      );
    }

    const cardStyles: React.CSSProperties = {
      ...baseCardStyles,
      background: selected ? theme.colors.primary : '#ffffff',
      border: selected
        ? `2px solid ${theme.colors.primary}`
        : `1px solid ${theme.colors.surfaceBorder}`,
      boxShadow: selected ? theme.shadows.glow : theme.shadows.sm,
      transition: `all ${theme.transitions.fast}`,
    };

    if (variant === 'mini') {
      return (
        <div style={cardStyles} onClick={handleClick}>
          <span style={{
            fontSize: fontSize * 0.9,
            fontWeight: theme.typography.fontWeight.bold,
            color: selected ? '#000' : suitColor,
            lineHeight: 1,
          }}>
            {card.rank}
          </span>
          <span style={{
            fontSize: suitSize * 0.9,
            color: selected ? '#000' : suitColor,
            lineHeight: 1,
          }}>
            {suitSymbol}
          </span>
        </div>
      );
    }

    return (
      <div style={cardStyles} onClick={handleClick}>
        <span style={{
          fontSize,
          fontWeight: theme.typography.fontWeight.bold,
          color: selected ? '#000' : suitColor,
          lineHeight: 1,
          fontFamily: theme.typography.fontFamilyMono,
        }}>
          {card.rank}
        </span>
        <span style={{
          fontSize: suitSize,
          color: selected ? '#000' : suitColor,
          lineHeight: 1,
        }}>
          {suitSymbol}
        </span>
      </div>
    );
  }

  // Default variant with 3D flip
  return (
    <div style={containerStyle}>
      <div
        style={cardWrapperStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Front face */}
        <div
          style={{
            ...faceStyle,
            ...baseCardStyles,
            background: selected ? theme.colors.primary : '#ffffff',
            border: selected
              ? `2px solid ${theme.colors.primary}`
              : `1px solid ${theme.colors.surfaceBorder}`,
            boxShadow: selected
              ? '0 0 20px rgba(34,211,191,0.5), 0 8px 16px rgba(0,0,0,0.2)'
              : isHovered
                ? '0 12px 24px rgba(0,0,0,0.2)'
                : theme.shadows.sm,
            animation: wasJustSelected ? 'pokerCardSelect 0.3s ease' : 'none',
            ...(isHovered && tiltOnHover ? tiltStyle : {}),
            transition: 'box-shadow 0.3s ease, transform 0.15s ease',
          }}
        >
          {card && (
            <>
              <span style={{
                fontSize,
                fontWeight: theme.typography.fontWeight.bold,
                color: selected ? '#000' : suitColor,
                lineHeight: 1,
                fontFamily: theme.typography.fontFamilyMono,
              }}>
                {card.rank}
              </span>
              <span style={{
                fontSize: suitSize,
                color: selected ? '#000' : suitColor,
                lineHeight: 1,
              }}>
                {suitSymbol}
              </span>
            </>
          )}
          {/* Shine effect on hover */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'pokerCardShine 0.6s ease-out',
              pointerEvents: 'none',
              borderRadius: theme.borders.radius.md,
            }} />
          )}
        </div>

        {/* Back face */}
        <div
          style={{
            ...faceStyle,
            ...baseCardStyles,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.surfaceBorder}`,
            transform: 'rotateY(180deg)',
          }}
        >
          <div style={{
            width: '70%',
            height: '70%',
            borderRadius: theme.borders.radius.sm,
            background: theme.gradients.secondary,
            opacity: 0.3,
          }} />
        </div>
      </div>
    </div>
  );
});

PokerCard.displayName = 'PokerCard';
