'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { theme } from '../styles/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  /** Enable ripple effect on click */
  ripple?: boolean;
  /** Enable glow effect on hover */
  glow?: boolean;
  children: React.ReactNode;
}

// CSS keyframes for animations (injected once)
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes buttonRipple {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0.6;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }

      @keyframes buttonSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes buttonShine {
        0% { left: -100%; }
        100% { left: 200%; }
      }

      @keyframes buttonPulseGlow {
        0%, 100% { box-shadow: 0 0 5px rgba(34, 211, 191, 0.4), 0 0 20px rgba(34, 211, 191, 0.2); }
        50% { box-shadow: 0 0 20px rgba(34, 211, 191, 0.6), 0 0 40px rgba(34, 211, 191, 0.3); }
      }

      @keyframes buttonGradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  };
})();

interface RippleStyle {
  left: number;
  top: number;
  id: number;
}

export const Button = memo<ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ripple = true,
  glow = true,
  children,
  disabled,
  style,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<RippleStyle[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // Inject animation styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Handle ripple effect
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples(prev => [...prev, { left: x, top: y, id }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  }, [disabled, loading, ripple, onClick]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);
  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);

  const sizeStyles: Record<string, React.CSSProperties> = {
    xs: {
      padding: '6px 10px',
      fontSize: theme.typography.fontSize.xs,
      height: '28px',
    },
    sm: {
      padding: '8px 14px',
      fontSize: theme.typography.fontSize.sm,
      height: '32px',
    },
    md: {
      padding: '10px 18px',
      fontSize: theme.typography.fontSize.md,
      height: '38px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: theme.typography.fontSize.lg,
      height: '44px',
    },
  };

  // Enhanced variant styles with gradients
  const getVariantStyles = (): React.CSSProperties => {
    const base: Record<string, React.CSSProperties> = {
      primary: {
        background: isHovered
          ? 'linear-gradient(135deg, #14b8a6 0%, #22d3bf 50%, #2dd4bf 100%)'
          : 'linear-gradient(135deg, #22d3bf 0%, #14b8a6 100%)',
        backgroundSize: '200% 200%',
        color: theme.colors.background,
        border: 'none',
        boxShadow: isHovered && glow
          ? '0 0 20px rgba(34, 211, 191, 0.5), 0 4px 15px rgba(34, 211, 191, 0.3)'
          : '0 2px 8px rgba(34, 211, 191, 0.2)',
      },
      secondary: {
        background: isHovered
          ? 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)'
          : theme.colors.surface,
        color: theme.colors.text,
        border: `1px solid ${isHovered ? theme.colors.primary : theme.colors.surfaceBorder}`,
        boxShadow: isHovered && glow
          ? '0 0 15px rgba(34, 211, 191, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      ghost: {
        background: isHovered ? 'rgba(34, 211, 191, 0.1)' : 'transparent',
        color: isHovered ? theme.colors.primary : theme.colors.textSecondary,
        border: 'none',
        boxShadow: 'none',
      },
      outline: {
        background: isHovered ? 'rgba(34, 211, 191, 0.1)' : 'transparent',
        color: theme.colors.primary,
        border: `1px solid ${theme.colors.primary}`,
        boxShadow: isHovered && glow
          ? '0 0 15px rgba(34, 211, 191, 0.3), inset 0 0 10px rgba(34, 211, 191, 0.1)'
          : 'none',
      },
      danger: {
        background: isHovered
          ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        backgroundSize: '200% 200%',
        color: theme.colors.text,
        border: 'none',
        boxShadow: isHovered && glow
          ? '0 0 20px rgba(239, 68, 68, 0.5), 0 4px 15px rgba(239, 68, 68, 0.3)'
          : '0 2px 8px rgba(239, 68, 68, 0.2)',
      },
      success: {
        background: isHovered
          ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)'
          : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        backgroundSize: '200% 200%',
        color: theme.colors.background,
        border: 'none',
        boxShadow: isHovered && glow
          ? '0 0 20px rgba(34, 197, 94, 0.5), 0 4px 15px rgba(34, 197, 94, 0.3)'
          : '0 2px 8px rgba(34, 197, 94, 0.2)',
      },
      premium: {
        background: isHovered
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
        backgroundSize: '200% 200%',
        animation: isHovered ? 'buttonGradientShift 2s ease infinite' : 'none',
        color: '#000',
        border: 'none',
        boxShadow: isHovered && glow
          ? '0 0 25px rgba(245, 158, 11, 0.6), 0 4px 20px rgba(245, 158, 11, 0.4)'
          : '0 2px 10px rgba(245, 158, 11, 0.3)',
      },
    };

    return base[variant] || base.primary;
  };

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    border: 'none',
    borderRadius: theme.borders.radius.md,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transform: isPressed
      ? 'scale(0.97)'
      : isHovered
        ? 'translateY(-2px)'
        : 'translateY(0)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...sizeStyles[size],
    ...getVariantStyles(),
    ...style,
  };

  const spinnerSize = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;

  // Ripple color based on variant
  const getRippleColor = () => {
    if (variant === 'primary' || variant === 'success') return 'rgba(0, 0, 0, 0.2)';
    if (variant === 'danger') return 'rgba(255, 255, 255, 0.3)';
    if (variant === 'premium') return 'rgba(0, 0, 0, 0.15)';
    return 'rgba(34, 211, 191, 0.3)';
  };

  return (
    <button
      ref={buttonRef}
      style={baseStyles}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.left,
            top: r.top,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: getRippleColor(),
            animation: 'buttonRipple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Shine effect on hover */}
      {isHovered && !loading && variant !== 'ghost' && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'buttonShine 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Loading spinner */}
      {loading ? (
        <span
          style={{
            width: spinnerSize,
            height: spinnerSize,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'buttonSpin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : icon && iconPosition === 'left' ? (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {icon}
        </span>
      ) : null}

      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
          }}
        >
          {icon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
