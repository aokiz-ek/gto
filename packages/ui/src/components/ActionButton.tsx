import React from 'react';
import { theme } from '../styles/theme';
import type { ActionType } from '@gto/core';

export type ExtendedActionType = ActionType | 'bet';

export interface ActionButtonProps {
  action: ExtendedActionType;
  amount?: number;
  frequency?: number;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  showFrequencyBar?: boolean;
  onClick?: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  amount,
  frequency,
  selected = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  showFrequencyBar = false,
  onClick,
}) => {
  const actionConfig: Record<ExtendedActionType, { color: string; muted: string; label: string }> = {
    fold: { color: theme.colors.fold, muted: theme.colors.foldMuted, label: 'Fold' },
    check: { color: theme.colors.check, muted: theme.colors.checkMuted, label: 'Check' },
    call: { color: theme.colors.call, muted: theme.colors.callMuted, label: 'Call' },
    raise: { color: theme.colors.raise, muted: theme.colors.raiseMuted, label: 'Raise' },
    bet: { color: theme.colors.bet, muted: theme.colors.betMuted, label: 'Bet' },
    'all-in': { color: theme.colors.allIn, muted: theme.colors.allInMuted, label: 'All-In' },
  };

  const sizeConfig = {
    sm: { padding: '8px 12px', fontSize: theme.typography.fontSize.sm, minWidth: '70px' },
    md: { padding: '10px 16px', fontSize: theme.typography.fontSize.md, minWidth: '90px' },
    lg: { padding: '14px 24px', fontSize: theme.typography.fontSize.lg, minWidth: '120px' },
  };

  const { color, muted, label } = actionConfig[action];
  const { padding, fontSize, minWidth } = sizeConfig[size];

  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: variant === 'compact' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: variant === 'compact' ? theme.spacing.sm : theme.spacing.xs,
    padding: variant === 'minimal' ? theme.spacing.sm : padding,
    minWidth: variant === 'minimal' ? 'auto' : minWidth,
    background: selected ? color : theme.colors.surface,
    border: `1px solid ${selected ? color : theme.colors.surfaceBorder}`,
    borderRadius: theme.borders.radius.md,
    color: selected ? '#000000' : theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: `all ${theme.transitions.fast}`,
    position: 'relative',
    overflow: 'hidden',
  };

  const amountStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    opacity: selected ? 0.8 : 0.7,
  };

  const frequencyStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: selected ? 'rgba(0,0,0,0.6)' : theme.colors.textMuted,
    fontFamily: theme.typography.fontFamilyMono,
  };

  const frequencyBarStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    width: `${(frequency || 0) * 100}%`,
    background: color,
    transition: `width ${theme.transitions.normal}`,
  };

  return (
    <button
      style={buttonStyles}
      disabled={disabled}
      onClick={onClick}
    >
      <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>{label}</span>
      {amount !== undefined && variant !== 'minimal' && (
        <span style={amountStyles}>{amount.toLocaleString()}</span>
      )}
      {frequency !== undefined && variant !== 'minimal' && (
        <span style={frequencyStyles}>{(frequency * 100).toFixed(0)}%</span>
      )}
      {showFrequencyBar && frequency !== undefined && !selected && (
        <div style={frequencyBarStyles} />
      )}
    </button>
  );
};
