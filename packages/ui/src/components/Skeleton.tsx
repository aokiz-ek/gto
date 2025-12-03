'use client';

import React, { memo, useEffect } from 'react';
import { theme } from '../styles/theme';

export interface SkeletonProps {
  /** Shape of the skeleton */
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded' | 'card' | 'pokerCard' | 'rangeMatrix';
  /** Width of the skeleton */
  width?: number | string;
  /** Height of the skeleton */
  height?: number | string;
  /** Animation style */
  animation?: 'pulse' | 'wave' | 'none';
  /** Number of text lines (only for text variant) */
  lines?: number;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

// CSS keyframes for animations (injected once)
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes skeletonPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }

      @keyframes skeletonWave {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes skeletonFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  };
})();

// Base skeleton style
const getBaseStyle = (animation: 'pulse' | 'wave' | 'none'): React.CSSProperties => {
  const base: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'block',
  };

  if (animation === 'pulse') {
    return {
      ...base,
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
    };
  }

  if (animation === 'wave') {
    return {
      ...base,
      background: `linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0.08) 20%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.08) 80%,
        rgba(255, 255, 255, 0.03) 100%
      )`,
      backgroundSize: '200% 100%',
      animation: 'skeletonWave 1.5s linear infinite',
    };
  }

  return base;
};

// Text skeleton component
const SkeletonText = memo<{ lines: number; animation: 'pulse' | 'wave' | 'none' }>(({ lines, animation }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...getBaseStyle(animation),
            height: '14px',
            borderRadius: '4px',
            width: i === lines - 1 ? '70%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
});

SkeletonText.displayName = 'SkeletonText';

// Poker card skeleton
const SkeletonPokerCard = memo<{ animation: 'pulse' | 'wave' | 'none'; size?: 'sm' | 'md' | 'lg' }>(
  ({ animation, size = 'md' }) => {
    const sizeConfig = {
      sm: { width: 36, height: 50 },
      md: { width: 48, height: 68 },
      lg: { width: 60, height: 84 },
    };
    const { width, height } = sizeConfig[size];

    return (
      <div
        style={{
          ...getBaseStyle(animation),
          width,
          height,
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        <div
          style={{
            width: '40%',
            height: '20%',
            borderRadius: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div
          style={{
            width: '30%',
            height: '15%',
            borderRadius: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }}
        />
      </div>
    );
  }
);

SkeletonPokerCard.displayName = 'SkeletonPokerCard';

// Range matrix skeleton (13x13 grid)
const SkeletonRangeMatrix = memo<{ animation: 'pulse' | 'wave' | 'none'; cellSize?: number }>(
  ({ animation, cellSize = 24 }) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(13, ${cellSize}px)`,
          gap: '1px',
          padding: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
        }}
      >
        {Array.from({ length: 169 }).map((_, i) => {
          const row = Math.floor(i / 13);
          const col = i % 13;
          const delay = (row + col) * 0.02;

          return (
            <div
              key={i}
              style={{
                ...getBaseStyle(animation),
                width: cellSize,
                height: cellSize,
                borderRadius: '2px',
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    );
  }
);

SkeletonRangeMatrix.displayName = 'SkeletonRangeMatrix';

// Card skeleton
const SkeletonCard = memo<{ animation: 'pulse' | 'wave' | 'none'; width?: number | string; height?: number | string }>(
  ({ animation, width = '100%', height = 200 }) => {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              ...getBaseStyle(animation),
              width: 40,
              height: 40,
              borderRadius: '50%',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                ...getBaseStyle(animation),
                width: '60%',
                height: 14,
                borderRadius: '4px',
              }}
            />
            <div
              style={{
                ...getBaseStyle(animation),
                width: '40%',
                height: 10,
                borderRadius: '4px',
                animationDelay: '0.1s',
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              ...getBaseStyle(animation),
              width: '100%',
              height: 12,
              borderRadius: '4px',
              animationDelay: '0.2s',
            }}
          />
          <div
            style={{
              ...getBaseStyle(animation),
              width: '90%',
              height: 12,
              borderRadius: '4px',
              animationDelay: '0.3s',
            }}
          />
          <div
            style={{
              ...getBaseStyle(animation),
              width: '75%',
              height: 12,
              borderRadius: '4px',
              animationDelay: '0.4s',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              ...getBaseStyle(animation),
              width: 80,
              height: 32,
              borderRadius: '6px',
              animationDelay: '0.5s',
            }}
          />
          <div
            style={{
              ...getBaseStyle(animation),
              width: 80,
              height: 32,
              borderRadius: '6px',
              animationDelay: '0.6s',
            }}
          />
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

export const Skeleton = memo<SkeletonProps>(({
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
  lines = 3,
  className,
  style,
}) => {
  // Inject animation styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Text variant
  if (variant === 'text') {
    return <SkeletonText lines={lines} animation={animation} />;
  }

  // Poker card variant
  if (variant === 'pokerCard') {
    return <SkeletonPokerCard animation={animation} />;
  }

  // Range matrix variant
  if (variant === 'rangeMatrix') {
    return <SkeletonRangeMatrix animation={animation} />;
  }

  // Card variant
  if (variant === 'card') {
    return <SkeletonCard animation={animation} width={width} height={height} />;
  }

  // Get border radius based on variant
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'rounded':
        return theme.borders.radius.lg;
      default:
        return theme.borders.radius.sm;
    }
  };

  // Base shape skeleton
  return (
    <div
      className={className}
      style={{
        ...getBaseStyle(animation),
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'circular' ? 40 : 20),
        borderRadius: getBorderRadius(),
        ...style,
      }}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Convenient skeleton group components
export const SkeletonGroup = {
  /** Skeleton for a list of items */
  List: memo<{ count?: number; itemHeight?: number; gap?: number; animation?: 'pulse' | 'wave' | 'none' }>(
    ({ count = 5, itemHeight = 60, gap = 12, animation = 'wave' }) => {
      useEffect(() => {
        injectStyles();
      }, []);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                style={{
                  ...getBaseStyle(animation),
                  width: itemHeight - 24,
                  height: itemHeight - 24,
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    ...getBaseStyle(animation),
                    width: '60%',
                    height: 14,
                    borderRadius: '4px',
                  }}
                />
                <div
                  style={{
                    ...getBaseStyle(animation),
                    width: '40%',
                    height: 10,
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }
  ),

  /** Skeleton for a hand of poker cards */
  Hand: memo<{ count?: number; animation?: 'pulse' | 'wave' | 'none' }>(
    ({ count = 2, animation = 'wave' }) => {
      useEffect(() => {
        injectStyles();
      }, []);

      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonPokerCard key={i} animation={animation} />
          ))}
        </div>
      );
    }
  ),

  /** Skeleton for stats/metrics */
  Stats: memo<{ count?: number; animation?: 'pulse' | 'wave' | 'none' }>(
    ({ count = 4, animation = 'wave' }) => {
      useEffect(() => {
        injectStyles();
      }, []);

      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '16px' }}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  ...getBaseStyle(animation),
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
              <div
                style={{
                  ...getBaseStyle(animation),
                  width: '80%',
                  height: 20,
                  borderRadius: '4px',
                  animationDelay: `${i * 0.1 + 0.05}s`,
                }}
              />
              <div
                style={{
                  ...getBaseStyle(animation),
                  width: '60%',
                  height: 12,
                  borderRadius: '4px',
                  animationDelay: `${i * 0.1 + 0.1}s`,
                }}
              />
            </div>
          ))}
        </div>
      );
    }
  ),
};

SkeletonGroup.List.displayName = 'SkeletonGroup.List';
SkeletonGroup.Hand.displayName = 'SkeletonGroup.Hand';
SkeletonGroup.Stats.displayName = 'SkeletonGroup.Stats';
