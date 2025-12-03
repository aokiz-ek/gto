'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { theme } from '../styles/theme';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass' | 'gradient' | 'neon';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Enable hover lift effect */
  hoverEffect?: boolean;
  /** Enable animated border on hover */
  animatedBorder?: boolean;
  /** Glow color for neon variant */
  glowColor?: string;
}

// CSS keyframes for animations (injected once)
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes cardBorderGlow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      @keyframes cardShine {
        0% { left: -100%; }
        100% { left: 200%; }
      }

      @keyframes cardGradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  };
})();

export const Card = memo<CardProps>(({
  variant = 'default',
  padding = 'md',
  children,
  className,
  style,
  onClick,
  header,
  footer,
  hoverEffect = true,
  animatedBorder = false,
  glowColor = theme.colors.primary,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const paddingStyles: Record<string, string> = {
    none: '0',
    xs: theme.spacing.xs,
    sm: theme.spacing.sm,
    md: theme.spacing.lg,
    lg: theme.spacing.xl,
    xl: theme.spacing.xxl,
  };

  // Enhanced variant styles with glassmorphism
  const getVariantStyles = (): React.CSSProperties => {
    const base: Record<string, React.CSSProperties> = {
      default: {
        background: theme.colors.surface,
        border: `1px solid ${isHovered ? 'rgba(34, 211, 191, 0.3)' : theme.colors.surfaceBorder}`,
        boxShadow: isHovered
          ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 211, 191, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      elevated: {
        background: `linear-gradient(180deg, ${theme.colors.surface} 0%, rgba(18, 18, 26, 0.95) 100%)`,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: isHovered
          ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
          : theme.shadows.lg,
      },
      outlined: {
        background: 'transparent',
        border: `1px solid ${isHovered ? theme.colors.primary : theme.colors.surfaceBorder}`,
        boxShadow: isHovered ? '0 0 20px rgba(34, 211, 191, 0.15)' : 'none',
      },
      filled: {
        background: theme.colors.surfaceLight,
        border: 'none',
        boxShadow: isHovered ? '0 8px 24px rgba(0, 0, 0, 0.3)' : 'none',
      },
      glass: {
        background: 'rgba(18, 18, 26, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered
          ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      gradient: {
        background: `linear-gradient(135deg,
          rgba(34, 211, 191, 0.1) 0%,
          rgba(155, 93, 229, 0.1) 50%,
          rgba(59, 130, 246, 0.1) 100%
        )`,
        backgroundSize: '200% 200%',
        animation: isHovered ? 'cardGradientShift 3s ease infinite' : 'none',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered
          ? '0 8px 32px rgba(34, 211, 191, 0.2), 0 0 0 1px rgba(34, 211, 191, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
      neon: {
        background: 'rgba(18, 18, 26, 0.9)',
        border: `1px solid ${glowColor}40`,
        boxShadow: isHovered
          ? `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20, inset 0 0 30px ${glowColor}10`
          : `0 0 10px ${glowColor}20`,
      },
    };

    return base[variant] || base.default;
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    borderRadius: theme.borders.radius.lg,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    transform: hoverEffect && isHovered ? 'translateY(-4px)' : 'translateY(0)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...getVariantStyles(),
    ...style,
  };

  const headerStyles: React.CSSProperties = {
    padding: `${theme.spacing.md} ${paddingStyles[padding]}`,
    borderBottom: `1px solid ${variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceBorder}`,
  };

  const bodyStyles: React.CSSProperties = {
    padding: paddingStyles[padding],
    position: 'relative',
  };

  const footerStyles: React.CSSProperties = {
    padding: `${theme.spacing.md} ${paddingStyles[padding]}`,
    borderTop: `1px solid ${variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceBorder}`,
    background: variant === 'glass' ? 'rgba(0, 0, 0, 0.2)' : theme.colors.surfaceHover,
  };

  return (
    <div
      style={containerStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated border effect */}
      {animatedBorder && isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
            backgroundSize: '200% 200%',
            animation: 'cardGradientShift 2s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Shine effect on hover for glass variant */}
      {variant === 'glass' && isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'cardShine 0.8s ease-out',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Top highlight for glass effect */}
      {variant === 'glass' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      {header && <div style={headerStyles}>{header}</div>}
      <div style={bodyStyles}>{children}</div>
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
});

Card.displayName = 'Card';
