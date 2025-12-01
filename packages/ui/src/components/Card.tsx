import React from 'react';
import { theme } from '../styles/theme';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className,
  style,
  onClick,
  header,
  footer,
}) => {
  const paddingStyles: Record<string, string> = {
    none: '0',
    xs: theme.spacing.xs,
    sm: theme.spacing.sm,
    md: theme.spacing.lg,
    lg: theme.spacing.xl,
    xl: theme.spacing.xxl,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.surfaceBorder}`,
    },
    elevated: {
      background: theme.colors.surface,
      boxShadow: theme.shadows.lg,
    },
    outlined: {
      background: 'transparent',
      border: `1px solid ${theme.colors.surfaceBorder}`,
    },
    filled: {
      background: theme.colors.surfaceLight,
      border: 'none',
    },
  };

  const containerStyles: React.CSSProperties = {
    borderRadius: theme.borders.radius.lg,
    overflow: 'hidden',
    transition: `all ${theme.transitions.fast}`,
    cursor: onClick ? 'pointer' : 'default',
    ...variantStyles[variant],
    ...style,
  };

  const headerStyles: React.CSSProperties = {
    padding: `${theme.spacing.md} ${paddingStyles[padding]}`,
    borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
  };

  const bodyStyles: React.CSSProperties = {
    padding: paddingStyles[padding],
  };

  const footerStyles: React.CSSProperties = {
    padding: `${theme.spacing.md} ${paddingStyles[padding]}`,
    borderTop: `1px solid ${theme.colors.surfaceBorder}`,
    background: theme.colors.surfaceHover,
  };

  return (
    <div
      style={containerStyles}
      className={className}
      onClick={onClick}
    >
      {header && <div style={headerStyles}>{header}</div>}
      <div style={bodyStyles}>{children}</div>
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};
