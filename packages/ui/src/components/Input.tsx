import React from 'react';
import { theme } from '../styles/theme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  fullWidth = false,
  style,
  ...props
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  };

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: icon ? '12px 12px 12px 40px' : '12px 16px',
    background: theme.colors.surface,
    border: `2px solid ${error ? theme.colors.error : theme.colors.surfaceLight}`,
    borderRadius: theme.borders.radius.md,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily,
    transition: `all ${theme.transitions.fast}`,
    outline: 'none',
    ...style,
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    color: theme.colors.textMuted,
    pointerEvents: 'none',
  };

  const errorStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
  };

  return (
    <div style={containerStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={inputWrapperStyles}>
        {icon && <span style={iconStyles}>{icon}</span>}
        <input style={inputStyles} {...props} />
      </div>
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
};
