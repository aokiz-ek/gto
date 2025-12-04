import React, { memo, useCallback, useMemo } from 'react';
import { theme } from '../styles/theme';
import { RANKS } from '@gto/core';
import type { RangeMatrix as RangeMatrixType } from '@gto/core';

export interface RangeMatrixProps {
  matrix: RangeMatrixType;
  onCellClick?: (row: number, col: number) => void;
  selectedCell?: { row: number; col: number } | null;
  highlightedCell?: { row: number; col: number } | null;
  showLabels?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: 'default' | 'action' | 'heatmap';
  interactive?: boolean;
  fullWidth?: boolean;
}

// Memoized cell component to prevent re-renders of all 169 cells
interface CellProps {
  row: number;
  col: number;
  value: number;
  cellSize: number;
  fontSize: string;
  colorScheme: 'default' | 'action' | 'heatmap';
  isSelected: boolean;
  isHighlighted: boolean;
  isPair: boolean;
  showLabels: boolean;
  interactive: boolean;
  onCellClick?: (row: number, col: number) => void;
  fullWidth?: boolean;
}

const getComboLabel = (row: number, col: number): string => {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];

  if (row === col) return `${rank1}${rank2}`;
  if (row < col) return `${rank1}${rank2}s`;
  return `${rank2}${rank1}o`;
};

const getCellColor = (value: number, colorScheme: string): string => {
  if (value === 0) return theme.colors.rangeEmpty;

  if (colorScheme === 'heatmap') {
    if (value < 0.33) return `rgba(239, 68, 68, ${0.3 + value * 0.7})`;
    if (value < 0.66) return `rgba(234, 179, 8, ${0.4 + value * 0.5})`;
    return `rgba(34, 197, 94, ${0.5 + value * 0.5})`;
  }

  if (colorScheme === 'action') {
    if (value < 0.25) return theme.colors.foldMuted;
    if (value < 0.5) return theme.colors.callMuted;
    if (value < 0.75) return `rgba(34, 197, 94, 0.5)`;
    return `rgba(34, 197, 94, 0.8)`;
  }

  return `rgba(34, 211, 191, ${0.2 + value * 0.7})`;
};

const MatrixCell = memo<CellProps>(({
  row,
  col,
  value,
  cellSize,
  fontSize,
  colorScheme,
  isSelected,
  isHighlighted,
  isPair,
  showLabels,
  interactive,
  onCellClick,
  fullWidth = false,
}) => {
  const handleClick = useCallback(() => {
    if (interactive && onCellClick) {
      onCellClick(row, col);
    }
  }, [interactive, onCellClick, row, col]);

  const cellStyles: React.CSSProperties = useMemo(() => ({
    width: fullWidth ? '100%' : cellSize,
    height: fullWidth ? '100%' : cellSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fullWidth ? 'clamp(8px, 1.2vw, 12px)' : fontSize,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamilyMono,
    background: isHighlighted ? 'rgba(245, 158, 11, 0.6)' : getCellColor(value, colorScheme),
    color: isHighlighted ? '#000' : (value > 0.5 ? theme.colors.background : theme.colors.textSecondary),
    cursor: interactive && onCellClick ? 'pointer' : 'default',
    border: isSelected
      ? `2px solid ${theme.colors.primary}`
      : isHighlighted
        ? '2px solid #f59e0b'
        : isPair
          ? `1px solid ${theme.colors.surfaceBorder}`
          : 'none',
    transition: `background ${theme.transitions.fast}`,
    position: 'relative',
    letterSpacing: '-0.5px',
    boxSizing: 'border-box',
    boxShadow: isHighlighted ? '0 0 8px rgba(245, 158, 11, 0.5)' : 'none',
  }), [cellSize, fontSize, value, colorScheme, isSelected, isHighlighted, isPair, interactive, onCellClick, fullWidth]);

  const label = useMemo(() => getComboLabel(row, col), [row, col]);

  return (
    <div
      style={cellStyles}
      onClick={handleClick}
      title={label}
    >
      {showLabels && label}
    </div>
  );
});

MatrixCell.displayName = 'MatrixCell';

export const RangeMatrix = memo<RangeMatrixProps>(({
  matrix,
  onCellClick,
  selectedCell,
  highlightedCell,
  showLabels = true,
  size = 'md',
  colorScheme = 'default',
  interactive = true,
  fullWidth = false,
}) => {
  const cellSizes: Record<string, number> = {
    xs: 20,
    sm: 31,
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

  const containerStyles: React.CSSProperties = useMemo(() => ({
    display: fullWidth ? 'block' : 'inline-block',
    background: fullWidth ? 'transparent' : theme.colors.background,
    borderRadius: fullWidth ? 0 : theme.borders.radius.md,
    padding: fullWidth ? 0 : '2px',
    width: fullWidth ? '100%' : 'auto',
    height: fullWidth ? '100%' : 'auto',
  }), [fullWidth]);

  const gridStyles: React.CSSProperties = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gridTemplateRows: fullWidth ? 'repeat(13, 1fr)' : undefined,
    gap: '1px',
    background: theme.colors.surfaceBorder,
    borderRadius: fullWidth ? theme.borders.radius.md : theme.borders.radius.sm,
    overflow: 'hidden',
    width: '100%',
    height: fullWidth ? '100%' : 'auto',
  }), [cellSize, fullWidth]);

  // For fullWidth mode, we use aspect-ratio to maintain square cells
  const cellStyles: React.CSSProperties = fullWidth ? {
    aspectRatio: '1',
    width: '100%',
  } : {};

  return (
    <div style={containerStyles}>
      <div style={gridStyles}>
        {matrix.matrix.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <MatrixCell
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              value={value}
              cellSize={fullWidth ? 0 : cellSize}
              fontSize={fontSize}
              colorScheme={colorScheme}
              isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
              isHighlighted={highlightedCell?.row === rowIndex && highlightedCell?.col === colIndex}
              isPair={rowIndex === colIndex}
              showLabels={showLabels}
              interactive={interactive}
              onCellClick={onCellClick}
              fullWidth={fullWidth}
            />
          ))
        )}
      </div>
    </div>
  );
});

RangeMatrix.displayName = 'RangeMatrix';
