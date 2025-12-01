'use client';

import { useState, forwardRef, ReactNode, CSSProperties, MouseEvent, TouchEvent } from 'react';

// ============================================
// Interactive Button Component
// ============================================
interface InteractiveButtonProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function InteractiveButton({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  style = {},
  className = '',
}: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const sizes = {
    sm: { padding: '8px 12px', fontSize: '13px' },
    md: { padding: '10px 16px', fontSize: '14px' },
    lg: { padding: '14px 20px', fontSize: '15px' },
  };

  const variants: Record<string, { base: CSSProperties; hover: CSSProperties }> = {
    default: {
      base: { background: '#1a1a1a', border: '1px solid #333333', color: '#ffffff' },
      hover: { background: '#242424', borderColor: '#22d3bf', boxShadow: '0 0 15px rgba(34, 211, 191, 0.2)' },
    },
    primary: {
      base: { background: '#22d3bf', border: 'none', color: '#000000' },
      hover: { background: '#14b8a6', boxShadow: '0 4px 15px rgba(34, 211, 191, 0.4)' },
    },
    secondary: {
      base: { background: '#3b82f6', border: 'none', color: '#ffffff' },
      hover: { background: '#2563eb', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' },
    },
    ghost: {
      base: { background: 'transparent', border: '1px solid #333333', color: '#ffffff' },
      hover: { background: 'rgba(255, 255, 255, 0.05)', borderColor: '#22d3bf' },
    },
    danger: {
      base: { background: '#ef4444', border: 'none', color: '#ffffff' },
      hover: { background: '#dc2626', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' },
    },
    success: {
      base: { background: '#22c55e', border: 'none', color: '#ffffff' },
      hover: { background: '#16a34a', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)' },
    },
  };

  const currentVariant = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        ...sizes[size],
        ...currentVariant.base,
        ...(isHovered && !disabled ? currentVariant.hover : {}),
        transform: disabled
          ? 'none'
          : isPressed
          ? 'scale(0.96)'
          : isHovered
          ? 'translateY(-2px)'
          : 'translateY(0)',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============================================
// Interactive Card Component
// ============================================
interface InteractiveCardProps {
  children: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
  className?: string;
}

export function InteractiveCard({
  children,
  onClick,
  hoverable = true,
  padding = 'md',
  style = {},
  className = '',
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const paddings = {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
  };

  return (
    <div
      onClick={onClick}
      className={className}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => onClick && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        background: '#1a1a1a',
        border: `1px solid ${isHovered ? '#22d3bf' : '#333333'}`,
        borderRadius: '12px',
        padding: paddings[padding],
        cursor: onClick ? 'pointer' : 'default',
        transform: hoverable
          ? isPressed
            ? 'scale(0.99)'
            : isHovered
            ? 'translateY(-4px)'
            : 'translateY(0)'
          : 'none',
        boxShadow: isHovered
          ? '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(34, 211, 191, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// Interactive Chip/Badge Component
// ============================================
interface InteractiveChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: CSSProperties;
}

export function InteractiveChip({
  children,
  active = false,
  onClick,
  color = 'default',
  size = 'md',
  style = {},
}: InteractiveChipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const colors: Record<string, { bg: string; activeBg: string; text: string }> = {
    default: { bg: '#1a1a1a', activeBg: '#22d3bf', text: '#22d3bf' },
    primary: { bg: 'rgba(34, 211, 191, 0.15)', activeBg: '#22d3bf', text: '#22d3bf' },
    secondary: { bg: 'rgba(59, 130, 246, 0.15)', activeBg: '#3b82f6', text: '#3b82f6' },
    success: { bg: 'rgba(34, 197, 94, 0.15)', activeBg: '#22c55e', text: '#22c55e' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', activeBg: '#f59e0b', text: '#f59e0b' },
    danger: { bg: 'rgba(239, 68, 68, 0.15)', activeBg: '#ef4444', text: '#ef4444' },
  };

  const sizes = {
    sm: { padding: '6px 10px', fontSize: '12px' },
    md: { padding: '8px 14px', fontSize: '13px' },
  };

  const c = colors[color];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '6px',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        ...sizes[size],
        background: active ? c.activeBg : c.bg,
        border: `1px solid ${active ? c.activeBg : isHovered ? c.text : '#333333'}`,
        color: active ? '#000000' : c.text,
        transform: isPressed ? 'scale(0.96)' : isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? `0 0 10px ${c.text}30` : 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============================================
// Interactive Icon Button Component
// ============================================
interface InteractiveIconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'primary';
  disabled?: boolean;
  style?: CSSProperties;
}

export function InteractiveIconButton({
  icon,
  onClick,
  size = 'md',
  variant = 'default',
  disabled = false,
  style = {},
}: InteractiveIconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  };

  const variants = {
    default: {
      bg: '#1a1a1a',
      hoverBg: '#242424',
      border: '1px solid #333333',
      hoverBorder: '1px solid #22d3bf',
    },
    ghost: {
      bg: 'transparent',
      hoverBg: 'rgba(34, 211, 191, 0.1)',
      border: 'none',
      hoverBorder: 'none',
    },
    primary: {
      bg: '#22d3bf',
      hoverBg: '#14b8a6',
      border: 'none',
      hoverBorder: 'none',
    },
  };

  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizes[size],
        height: sizes[size],
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: isHovered ? v.hoverBg : v.bg,
        border: isHovered ? v.hoverBorder : v.border,
        color: variant === 'primary' ? '#000000' : isHovered ? '#22d3bf' : '#ffffff',
        transform: isPressed ? 'scale(0.9)' : isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered && variant !== 'ghost' ? '0 0 15px rgba(34, 211, 191, 0.2)' : 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

// ============================================
// Interactive Input Component
// ============================================
interface InteractiveInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

export function InteractiveInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  style = {},
}: InteractiveInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: '#1a1a1a',
        border: `1px solid ${isFocused ? '#22d3bf' : isHovered ? '#444444' : '#333333'}`,
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '14px',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        boxShadow: isFocused ? '0 0 0 3px rgba(34, 211, 191, 0.15)' : 'none',
        transition: 'all 0.2s ease',
        ...style,
      }}
    />
  );
}

// ============================================
// Interactive List Item Component
// ============================================
interface InteractiveListItemProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  icon?: ReactNode;
  rightContent?: ReactNode;
  style?: CSSProperties;
}

export function InteractiveListItem({
  children,
  onClick,
  active = false,
  icon,
  rightContent,
  style = {},
}: InteractiveListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        background: active ? '#1a1a1a' : isHovered ? 'rgba(34, 211, 191, 0.05)' : 'transparent',
        border: `1px solid ${active ? '#22d3bf' : 'transparent'}`,
        transform: isPressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {icon && (
        <span style={{
          display: 'flex',
          opacity: active ? 1 : isHovered ? 0.9 : 0.7,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          color: active || isHovered ? '#22d3bf' : '#b3b3b3',
          transition: 'all 0.15s ease',
        }}>
          {icon}
        </span>
      )}
      <span style={{
        flex: 1,
        color: active || isHovered ? '#ffffff' : '#b3b3b3',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'color 0.15s ease',
      }}>
        {children}
      </span>
      {rightContent}
    </div>
  );
}

// ============================================
// Ripple Effect Component
// ============================================
interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function RippleButton({ children, onClick, style = {}, className = '' }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples([...ripples, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '10px',
            height: '10px',
            marginLeft: '-5px',
            marginTop: '-5px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            animation: 'ripple 0.6s linear',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
}

// ============================================
// Animated Counter Component
// ============================================
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: CSSProperties;
}

export function AnimatedCounter({ value, duration = 500, style = {} }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useState(() => {
    let start = 0;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });

  return <span style={style}>{displayValue}</span>;
}

// ============================================
// Tooltip Component
// ============================================
interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions: Record<string, CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            ...positions[position],
            padding: '8px 12px',
            background: '#333333',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            opacity: isVisible ? 1 : 0,
            animation: 'fadeIn 0.15s ease, slideUp 0.15s ease',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
