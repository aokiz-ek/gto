import React from 'react';
import { theme } from '../styles/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  disabled,
  style,
  ...props
}) => {
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

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.background,
    },
    secondary: {
      background: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.surfaceBorder}`,
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.textSecondary,
    },
    outline: {
      background: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
    },
    danger: {
      background: theme.colors.error,
      color: theme.colors.text,
    },
    success: {
      background: theme.colors.success,
      color: theme.colors.background,
    },
  };

  const baseStyles: React.CSSProperties = {
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
    transition: `all ${theme.transitions.fast}`,
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const spinnerSize = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;

  return (
    <button
      style={baseStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: spinnerSize,
            height: spinnerSize,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : icon && iconPosition === 'left' ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      )}
    </button>
  );
};
