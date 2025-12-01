import React from 'react';
import { theme } from '../styles/theme';
import type { Position } from '@gto/core';

export interface PositionBadgeProps {
  position: Position;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  active?: boolean;
  onClick?: () => void;
}

const POSITION_FULL_NAMES: Record<Position, string> = {
  UTG: 'Under the Gun',
  UTG1: 'UTG+1',
  UTG2: 'UTG+2',
  LJ: 'Lojack',
  HJ: 'Hijack',
  CO: 'Cutoff',
  BTN: 'Button',
  SB: 'Small Blind',
  BB: 'Big Blind',
};

// Professional position colors - more subtle and consistent
const POSITION_BADGE_COLORS: Record<Position, string> = {
  UTG: '#6366f1',   // Indigo
  UTG1: '#8b5cf6',  // Violet
  UTG2: '#a855f7',  // Purple
  LJ: '#ec4899',    // Pink
  HJ: '#f43f5e',    // Rose
  CO: '#f97316',    // Orange
  BTN: '#22c55e',   // Green - dealer position
  SB: '#eab308',    // Yellow
  BB: '#14b8a6',    // Teal
};

export const PositionBadge: React.FC<PositionBadgeProps> = ({
  position,
  size = 'md',
  variant = 'default',
  active = false,
  onClick,
}) => {
  const sizeConfig = {
    xs: { padding: '2px 6px', fontSize: theme.typography.fontSize.xs, minWidth: '28px' },
    sm: { padding: '4px 8px', fontSize: theme.typography.fontSize.sm, minWidth: '36px' },
    md: { padding: '6px 12px', fontSize: theme.typography.fontSize.md, minWidth: '44px' },
    lg: { padding: '8px 16px', fontSize: theme.typography.fontSize.lg, minWidth: '52px' },
  };

  const color = POSITION_BADGE_COLORS[position];
  const { padding, fontSize, minWidth } = sizeConfig[size];

  const getVariantStyles = (): React.CSSProperties => {
    if (active) {
      return {
        background: color,
        border: `1px solid ${color}`,
        color: '#000000',
      };
    }

    switch (variant) {
      case 'filled':
        return {
          background: `${color}20`,
          border: '1px solid transparent',
          color: color,
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: `1px solid ${color}`,
          color: color,
        };
      default:
        return {
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          color: theme.colors.textSecondary,
        };
    }
  };

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding,
    minWidth,
    borderRadius: theme.borders.radius.md,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily,
    fontSize,
    whiteSpace: 'nowrap',
    cursor: onClick ? 'pointer' : 'default',
    transition: `all ${theme.transitions.fast}`,
    userSelect: 'none',
    ...getVariantStyles(),
  };

  return (
    <span
      style={badgeStyles}
      onClick={onClick}
      title={POSITION_FULL_NAMES[position]}
    >
      {position}
    </span>
  );
};
