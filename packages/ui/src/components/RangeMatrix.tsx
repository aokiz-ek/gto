import React from 'react';
import { theme } from '../styles/theme';
import { RANKS } from '@gto/core';
import type { RangeMatrix as RangeMatrixType } from '@gto/core';

export interface RangeMatrixProps {
  matrix: RangeMatrixType;
  onCellClick?: (row: number, col: number) => void;
  selectedCell?: { row: number; col: number } | null;
  showLabels?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: 'default' | 'action' | 'heatmap';
  interactive?: boolean;
}

export const RangeMatrix: React.FC<RangeMatrixProps> = ({
  matrix,
  onCellClick,
  selectedCell,
  showLabels = true,
  size = 'md',
  colorScheme = 'default',
  interactive = true,
}) => {
  const cellSizes: Record<string, number> = {
    xs: 20,
    sm: 26,
    md: 32,
    lg: 38,
  };

  const fontSizes: Record<string, string> = {
    xs: '7px',
    sm: '9px',
    md: '10px',
    lg: '11px',
  };

  const cellSize = cellSizes[size];
  const fontSize = fontSizes[size];

  const getComboLabel = (row: number, col: number): string => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];

    if (row === col) return `${rank1}${rank2}`;
    if (row < col) return `${rank1}${rank2}s`;
    return `${rank2}${rank1}o`;
  };

  const getCellColor = (value: number): string => {
    if (value === 0) return theme.colors.rangeEmpty;

    if (colorScheme === 'heatmap') {
      // Green to Yellow to Red gradient
      if (value < 0.33) return `rgba(239, 68, 68, ${0.3 + value * 0.7})`;
      if (value < 0.66) return `rgba(234, 179, 8, ${0.4 + value * 0.5})`;
      return `rgba(34, 197, 94, ${0.5 + value * 0.5})`;
    }

    if (colorScheme === 'action') {
      // Action-based colors
      if (value < 0.25) return theme.colors.foldMuted;
      if (value < 0.5) return theme.colors.callMuted;
      if (value < 0.75) return `rgba(34, 197, 94, 0.5)`;
      return `rgba(34, 197, 94, 0.8)`;
    }

    // Default: Single color with opacity
    return `rgba(34, 211, 191, ${0.2 + value * 0.7})`;
  };

  const containerStyles: React.CSSProperties = {
    display: 'inline-block',
    background: theme.colors.background,
    borderRadius: theme.borders.radius.md,
    padding: '2px',
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(13, ${cellSize}px)`,
    gap: '1px',
    background: theme.colors.surfaceBorder,
    borderRadius: theme.borders.radius.sm,
    overflow: 'hidden',
  };

  const getCellStyles = (row: number, col: number): React.CSSProperties => {
    const value = matrix.matrix[row][col];
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isPair = row === col;
    const isSuited = row < col;

    return {
      width: cellSize,
      height: cellSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      fontFamily: theme.typography.fontFamilyMono,
      background: getCellColor(value),
      color: value > 0.5 ? theme.colors.background : theme.colors.textSecondary,
      cursor: interactive && onCellClick ? 'pointer' : 'default',
      border: isSelected
        ? `2px solid ${theme.colors.primary}`
        : isPair
          ? `1px solid ${theme.colors.surfaceBorder}`
          : 'none',
      transition: `background ${theme.transitions.fast}`,
      position: 'relative',
      letterSpacing: '-0.5px',
    };
  };

  return (
    <div style={containerStyles}>
      <div style={gridStyles}>
        {matrix.matrix.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={getCellStyles(rowIndex, colIndex)}
              onClick={() => interactive && onCellClick?.(rowIndex, colIndex)}
              title={getComboLabel(rowIndex, colIndex)}
            >
              {showLabels && getComboLabel(rowIndex, colIndex)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
