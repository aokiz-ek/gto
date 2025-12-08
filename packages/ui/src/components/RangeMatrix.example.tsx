/**
 * RangeMatrix Usage Examples
 *
 * This file demonstrates how to use the enhanced RangeMatrix component
 * with category selection and lock/unlock functionality.
 */

import React, { useState, useCallback } from 'react';
import { RangeMatrix, getCategoryIndices, type HandCategory } from './RangeMatrix';
import type { RangeMatrix as RangeMatrixType } from '@gto/core';

// Example 1: Basic usage (backward compatible)
export const BasicExample: React.FC = () => {
  const [matrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  return (
    <RangeMatrix
      matrix={matrix}
      size="md"
      showLabels={true}
    />
  );
};

// Example 2: With category selection panel
export const CategorySelectionExample: React.FC = () => {
  const [matrix, setMatrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  const handleCategorySelect = useCallback((
    category: string,
    indices: { row: number; col: number }[]
  ) => {
    setMatrix(prev => {
      const newMatrix = prev.matrix.map(row => [...row]);
      indices.forEach(({ row, col }) => {
        newMatrix[row][col] = 1.0; // Set to 100%
      });
      return { matrix: newMatrix };
    });
  }, []);

  return (
    <RangeMatrix
      matrix={matrix}
      showCategoryPanel={true}
      onCategorySelect={handleCategorySelect}
      size="md"
    />
  );
};

// Example 3: With lock/unlock functionality
export const LockUnlockExample: React.FC = () => {
  const [matrix, setMatrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  const [lockedCells, setLockedCells] = useState<boolean[][]>(
    Array(13).fill(null).map(() => Array(13).fill(false))
  );

  const handleCellClick = useCallback((row: number, col: number) => {
    setMatrix(prev => {
      const newMatrix = prev.matrix.map(row => [...row]);
      newMatrix[row][col] = newMatrix[row][col] === 0 ? 1.0 : 0;
      return { matrix: newMatrix };
    });
  }, []);

  const handleCellLock = useCallback((row: number, col: number, locked: boolean) => {
    setLockedCells(prev => {
      const newLocks = prev.map(row => [...row]);
      newLocks[row][col] = locked;
      return newLocks;
    });
  }, []);

  return (
    <div>
      <p style={{ marginBottom: '16px', color: '#b3b3b3' }}>
        Right-click cells to lock/unlock them. Locked cells show a lock icon.
      </p>
      <RangeMatrix
        matrix={matrix}
        lockedCells={lockedCells}
        onCellClick={handleCellClick}
        onCellLock={handleCellLock}
        size="md"
      />
    </div>
  );
};

// Example 4: Full featured with category selection and locking
export const FullFeaturedExample: React.FC = () => {
  const [matrix, setMatrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  const [lockedCells, setLockedCells] = useState<boolean[][]>(
    Array(13).fill(null).map(() => Array(13).fill(false))
  );

  const handleCellClick = useCallback((row: number, col: number) => {
    setMatrix(prev => {
      const newMatrix = prev.matrix.map(row => [...row]);
      newMatrix[row][col] = newMatrix[row][col] === 0 ? 1.0 : 0;
      return { matrix: newMatrix };
    });
  }, []);

  const handleCellLock = useCallback((row: number, col: number, locked: boolean) => {
    setLockedCells(prev => {
      const newLocks = prev.map(row => [...row]);
      newLocks[row][col] = locked;
      return newLocks;
    });
  }, []);

  const handleCategorySelect = useCallback((
    category: string,
    indices: { row: number; col: number }[]
  ) => {
    setMatrix(prev => {
      const newMatrix = prev.matrix.map(row => [...row]);

      // Only modify unlocked cells
      indices.forEach(({ row, col }) => {
        if (!lockedCells[row][col]) {
          newMatrix[row][col] = 1.0;
        }
      });

      return { matrix: newMatrix };
    });
  }, [lockedCells]);

  const clearAll = useCallback(() => {
    setMatrix(prev => {
      const newMatrix = prev.matrix.map((row, rowIndex) =>
        row.map((value, colIndex) =>
          lockedCells[rowIndex][colIndex] ? value : 0
        )
      );
      return { matrix: newMatrix };
    });
  }, [lockedCells]);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={clearAll}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Clear All (Except Locked)
        </button>
      </div>

      <RangeMatrix
        matrix={matrix}
        lockedCells={lockedCells}
        showCategoryPanel={true}
        onCellClick={handleCellClick}
        onCellLock={handleCellLock}
        onCategorySelect={handleCategorySelect}
        size="md"
      />
    </div>
  );
};

// Example 5: Programmatic category selection
export const ProgrammaticExample: React.FC = () => {
  const [matrix, setMatrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  const selectCategory = useCallback((category: HandCategory) => {
    const indices = getCategoryIndices(category);
    setMatrix(prev => {
      const newMatrix = prev.matrix.map(row => [...row]);
      indices.forEach(({ row, col }) => {
        newMatrix[row][col] = 1.0;
      });
      return { matrix: newMatrix };
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => selectCategory('premium-pairs')}>Premium Pairs</button>
        <button onClick={() => selectCategory('suited-aces')}>Suited Aces</button>
        <button onClick={() => selectCategory('broadway')}>Broadway</button>
      </div>

      <RangeMatrix
        matrix={matrix}
        size="md"
      />
    </div>
  );
};

// Example 6: Custom category logic
export const CustomCategoryExample: React.FC = () => {
  const [matrix, setMatrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  });

  // Select custom range: Top 10% hands
  const selectTop10Percent = useCallback(() => {
    const topHands = [
      // Premium pairs and AK
      [0, 0], [1, 1], [2, 2], [3, 3], // AA, KK, QQ, JJ
      [0, 1], [0, 2], // AKs, AQs
    ];

    setMatrix(prev => {
      const newMatrix = Array(13).fill(null).map(() => Array(13).fill(0));
      topHands.forEach(([row, col]) => {
        newMatrix[row][col] = 1.0;
      });
      return { matrix: newMatrix };
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={selectTop10Percent}>
          Select Top 10% Hands
        </button>
      </div>

      <RangeMatrix
        matrix={matrix}
        size="md"
      />
    </div>
  );
};

// Example 7: With different color schemes
export const ColorSchemeExample: React.FC = () => {
  const [matrix] = useState<RangeMatrixType>({
    matrix: Array(13).fill(null).map(() =>
      Array(13).fill(0).map(() => Math.random())
    ),
  });

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div>
        <h3>Default</h3>
        <RangeMatrix matrix={matrix} size="sm" colorScheme="default" />
      </div>
      <div>
        <h3>Action</h3>
        <RangeMatrix matrix={matrix} size="sm" colorScheme="action" />
      </div>
      <div>
        <h3>Heatmap</h3>
        <RangeMatrix matrix={matrix} size="sm" colorScheme="heatmap" />
      </div>
    </div>
  );
};
