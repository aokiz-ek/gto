import React, { memo, useCallback, useMemo, useState } from 'react';
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
  // New lock/unlock props
  lockedCells?: boolean[][];
  onCellLock?: (row: number, col: number, locked: boolean) => void;
  onCellRightClick?: (row: number, col: number) => void;
  // Category selection props
  showCategoryPanel?: boolean;
  onCategorySelect?: (category: string, indices: {row: number, col: number}[]) => void;
}

export type HandCategory =
  | 'all-pairs'
  | 'all-suited'
  | 'all-offsuit'
  | 'broadway'
  | 'suited-connectors'
  | 'suited-aces'
  | 'premium-pairs'
  | 'strong-pairs'
  | 'medium-pairs'
  | 'small-pairs';

type HandCategoryType = HandCategory;

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
  isLocked: boolean;
  showLabels: boolean;
  interactive: boolean;
  onCellClick?: (row: number, col: number) => void;
  onCellRightClick?: (row: number, col: number) => void;
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

// Lock icon SVG
const LockIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: '2px', right: '2px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
  >
    <path
      d="M17 11V7C17 4.79086 15.2091 3 13 3H11C8.79086 3 7 4.79086 7 7V11M8 11H16C17.1046 11 18 11.8954 18 13V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V13C6 11.8954 6.89543 11 8 11Z"
      stroke={theme.colors.primary}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

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
  isLocked,
  showLabels,
  interactive,
  onCellClick,
  onCellRightClick,
  fullWidth = false,
}) => {
  const handleClick = useCallback(() => {
    if (interactive && onCellClick) {
      onCellClick(row, col);
    }
  }, [interactive, onCellClick, row, col]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (interactive && onCellRightClick) {
      onCellRightClick(row, col);
    }
  }, [interactive, onCellRightClick, row, col]);

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
    boxShadow: isHighlighted ? '0 0 8px rgba(245, 158, 11, 0.5)' : isLocked ? `0 0 4px ${theme.colors.primary}` : 'none',
  }), [cellSize, fontSize, value, colorScheme, isSelected, isHighlighted, isPair, isLocked, interactive, onCellClick, fullWidth]);

  const label = useMemo(() => getComboLabel(row, col), [row, col]);

  return (
    <div
      style={cellStyles}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={label}
    >
      {showLabels && label}
      {isLocked && <LockIcon size={fullWidth ? 8 : 10} />}
    </div>
  );
});

MatrixCell.displayName = 'MatrixCell';

// Category selection functions
const getCategoryIndices = (category: HandCategoryType): {row: number, col: number}[] => {
  const indices: {row: number, col: number}[] = [];
  const isBroadway = (rankIndex: number) => rankIndex <= 4; // A, K, Q, J, T

  switch (category) {
    case 'all-pairs':
      // Diagonal: AA, KK, QQ, ... 22
      for (let i = 0; i < 13; i++) {
        indices.push({ row: i, col: i });
      }
      break;

    case 'all-suited':
      // Upper triangle: suited hands
      for (let row = 0; row < 13; row++) {
        for (let col = row + 1; col < 13; col++) {
          indices.push({ row, col });
        }
      }
      break;

    case 'all-offsuit':
      // Lower triangle: offsuit hands
      for (let row = 1; row < 13; row++) {
        for (let col = 0; col < row; col++) {
          indices.push({ row, col });
        }
      }
      break;

    case 'broadway':
      // Hands with both cards T or higher
      for (let row = 0; row <= 4; row++) {
        for (let col = 0; col <= 4; col++) {
          indices.push({ row, col });
        }
      }
      break;

    case 'suited-connectors':
      // Suited adjacent ranks (upper triangle only)
      for (let row = 0; row < 12; row++) {
        const col = row + 1; // Adjacent rank
        indices.push({ row, col });
      }
      break;

    case 'suited-aces':
      // A2s through AKs (row 0, columns 1-12 in upper triangle)
      for (let col = 1; col < 13; col++) {
        indices.push({ row: 0, col });
      }
      break;

    case 'premium-pairs':
      // AA, KK, QQ
      for (let i = 0; i <= 2; i++) {
        indices.push({ row: i, col: i });
      }
      break;

    case 'strong-pairs':
      // JJ, TT, 99
      for (let i = 3; i <= 5; i++) {
        indices.push({ row: i, col: i });
      }
      break;

    case 'medium-pairs':
      // 88, 77, 66, 55
      for (let i = 6; i <= 9; i++) {
        indices.push({ row: i, col: i });
      }
      break;

    case 'small-pairs':
      // 44, 33, 22
      for (let i = 10; i <= 12; i++) {
        indices.push({ row: i, col: i });
      }
      break;
  }

  return indices;
};

// Category button component
interface CategoryButtonProps {
  label: string;
  category: HandCategoryType;
  onSelect: (category: HandCategoryType) => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ label, category, onSelect, variant = 'outline' }) => {
  const buttonStyles: React.CSSProperties = useMemo(() => {
    const baseStyles = {
      padding: '6px 12px',
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      borderRadius: theme.borders.radius.md,
      cursor: 'pointer',
      transition: theme.transitions.fast,
      border: 'none',
      whiteSpace: 'nowrap' as const,
    };

    if (variant === 'primary') {
      return {
        ...baseStyles,
        background: theme.colors.primary,
        color: theme.colors.background,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyles,
        background: theme.colors.secondary,
        color: theme.colors.text,
      };
    }

    return {
      ...baseStyles,
      background: theme.colors.surface,
      color: theme.colors.textSecondary,
      border: `1px solid ${theme.colors.surfaceBorder}`,
    };
  }, [variant]);

  const handleClick = useCallback(() => {
    onSelect(category);
  }, [category, onSelect]);

  return (
    <button
      style={buttonStyles}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = variant === 'primary'
          ? theme.colors.primaryHover
          : variant === 'secondary'
            ? theme.colors.secondaryHover
            : theme.colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variant === 'primary'
          ? theme.colors.primary
          : variant === 'secondary'
            ? theme.colors.secondary
            : theme.colors.surface;
      }}
    >
      {label}
    </button>
  );
};

// Category panel component
const CategoryPanel: React.FC<{ onCategorySelect: (category: HandCategoryType, indices: {row: number, col: number}[]) => void }> = ({
  onCategorySelect
}) => {
  const handleSelect = useCallback((category: HandCategoryType) => {
    const indices = getCategoryIndices(category);
    onCategorySelect(category, indices);
  }, [onCategorySelect]);

  const panelStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    background: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    border: `1px solid ${theme.colors.surfaceBorder}`,
  };

  const sectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  };

  const buttonGroupStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  };

  return (
    <div style={panelStyles}>
      <div style={sectionStyles}>
        <div style={titleStyles}>Basic Categories</div>
        <div style={buttonGroupStyles}>
          <CategoryButton label="All Pairs" category="all-pairs" onSelect={handleSelect} />
          <CategoryButton label="All Suited" category="all-suited" onSelect={handleSelect} />
          <CategoryButton label="All Offsuit" category="all-offsuit" onSelect={handleSelect} />
          <CategoryButton label="Broadway" category="broadway" onSelect={handleSelect} />
        </div>
      </div>

      <div style={sectionStyles}>
        <div style={titleStyles}>Suited Hands</div>
        <div style={buttonGroupStyles}>
          <CategoryButton label="Suited Aces" category="suited-aces" onSelect={handleSelect} />
          <CategoryButton label="Suited Connectors" category="suited-connectors" onSelect={handleSelect} />
        </div>
      </div>

      <div style={sectionStyles}>
        <div style={titleStyles}>Pocket Pairs</div>
        <div style={buttonGroupStyles}>
          <CategoryButton label="Premium (AA-QQ)" category="premium-pairs" onSelect={handleSelect} variant="primary" />
          <CategoryButton label="Strong (JJ-99)" category="strong-pairs" onSelect={handleSelect} variant="secondary" />
          <CategoryButton label="Medium (88-55)" category="medium-pairs" onSelect={handleSelect} />
          <CategoryButton label="Small (44-22)" category="small-pairs" onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
};

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
  lockedCells,
  onCellLock,
  onCellRightClick,
  showCategoryPanel = false,
  onCategorySelect,
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

  // Handle right-click for lock/unlock
  const handleCellRightClick = useCallback((row: number, col: number) => {
    if (onCellLock && lockedCells) {
      const isLocked = lockedCells[row]?.[col] || false;
      onCellLock(row, col, !isLocked);
    }

    if (onCellRightClick) {
      onCellRightClick(row, col);
    }
  }, [onCellLock, onCellRightClick, lockedCells]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: HandCategoryType, indices: {row: number, col: number}[]) => {
    if (onCategorySelect) {
      onCategorySelect(category, indices);
    }
  }, [onCategorySelect]);

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

  const wrapperStyles: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  }), []);

  return (
    <div style={wrapperStyles}>
      {showCategoryPanel && onCategorySelect && (
        <CategoryPanel onCategorySelect={handleCategorySelect} />
      )}

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
                isLocked={lockedCells?.[rowIndex]?.[colIndex] || false}
                showLabels={showLabels}
                interactive={interactive}
                onCellClick={onCellClick}
                onCellRightClick={handleCellRightClick}
                fullWidth={fullWidth}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

RangeMatrix.displayName = 'RangeMatrix';

// Export helper function for use in other components
export { getCategoryIndices };
