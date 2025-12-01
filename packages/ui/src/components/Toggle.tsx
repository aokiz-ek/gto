import React from 'react';
import { theme } from '../styles/theme';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const trackStyles: React.CSSProperties = {
    position: 'relative',
    width: '48px',
    height: '24px',
    background: checked ? theme.colors.primary : theme.colors.surface,
    borderRadius: theme.borders.radius.full,
    border: `2px solid ${checked ? theme.colors.primary : theme.colors.surfaceLight}`,
    transition: `all ${theme.transitions.normal}`,
    boxShadow: checked ? theme.shadows.glow : 'none',
  };

  const thumbStyles: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: checked ? '24px' : '2px',
    width: '16px',
    height: '16px',
    background: checked ? theme.colors.background : theme.colors.textMuted,
    borderRadius: '50%',
    transition: `all ${theme.transitions.normal}`,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  };

  return (
    <label style={containerStyles}>
      <div style={trackStyles} onClick={() => !disabled && onChange(!checked)}>
        <div style={thumbStyles} />
      </div>
      {label && <span style={labelStyles}>{label}</span>}
    </label>
  );
};
