import type { RangeMatrix, HandCombo, Action, GTOStrategy, GTOHandStrategy } from '../types';
import { RANKS } from '../constants';

/**
 * Create an empty 13x13 range matrix
 */
export function createEmptyMatrix(): RangeMatrix {
  return {
    matrix: Array(13).fill(null).map(() => Array(13).fill(0)),
  };
}

/**
 * Get matrix indices for a hand combo string
 * e.g., "AKs" -> [0, 1], "QQ" -> [2, 2], "T9o" -> [4, 5]
 */
export function getMatrixIndices(combo: string): [number, number, boolean] {
  const rank1 = combo[0];
  const rank2 = combo[1];
  const isSuited = combo.length === 3 && combo[2] === 's';

  const row = RANKS.indexOf(rank1 as typeof RANKS[number]);
  const col = RANKS.indexOf(rank2 as typeof RANKS[number]);

  if (row === -1 || col === -1) {
    throw new Error(`Invalid combo: ${combo}`);
  }

  // For suited hands, row < col; for offsuit, row > col
  if (isSuited && row > col) {
    return [col, row, true];
  } else if (!isSuited && combo.length === 3 && row < col) {
    return [col, row, false];
  }

  return [row, col, isSuited];
}

/**
 * Convert matrix position to hand combo string
 */
export function indicesToCombo(row: number, col: number): string {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];

  if (row === col) {
    return `${rank1}${rank2}`; // Pair
  } else if (row < col) {
    return `${rank1}${rank2}s`; // Suited (upper triangle)
  } else {
    return `${rank2}${rank1}o`; // Offsuit (lower triangle)
  }
}

/**
 * Set a value in the range matrix
 */
export function setMatrixValue(
  matrix: RangeMatrix,
  combo: string,
  value: number
): void {
  const [row, col] = getMatrixIndices(combo);
  matrix.matrix[row][col] = Math.max(0, Math.min(1, value));
}

/**
 * Get a value from the range matrix
 */
export function getMatrixValue(matrix: RangeMatrix, combo: string): number {
  const [row, col] = getMatrixIndices(combo);
  return matrix.matrix[row][col];
}

/**
 * Calculate the total number of combos in a range
 */
export function countCombos(matrix: RangeMatrix): number {
  let total = 0;

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const freq = matrix.matrix[row][col];
      if (freq > 0) {
        if (row === col) {
          // Pairs: 6 combos
          total += 6 * freq;
        } else if (row < col) {
          // Suited: 4 combos
          total += 4 * freq;
        } else {
          // Offsuit: 12 combos
          total += 12 * freq;
        }
      }
    }
  }

  return total;
}

/**
 * Calculate range percentage (out of 1326 total combos)
 */
export function rangePercentage(matrix: RangeMatrix): number {
  return (countCombos(matrix) / 1326) * 100;
}

/**
 * Convert hand combos array to range matrix
 */
export function combosToMatrix(combos: HandCombo[]): RangeMatrix {
  const matrix = createEmptyMatrix();

  for (const combo of combos) {
    // Use frequency of first action as the matrix value
    const freq = combo.actions[0]?.frequency ?? 1;
    setMatrixValue(matrix, combo.hand, freq);
  }

  return matrix;
}

/**
 * Generate all 169 unique starting hands
 */
export function getAllStartingHands(): string[] {
  const hands: string[] = [];

  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      hands.push(indicesToCombo(i, j));
    }
  }

  return hands;
}

/**
 * Convert GTO strategy ranges to a range matrix
 * Uses the non-fold frequency as the matrix value (0-1)
 */
export function gtoStrategyToMatrix(
  ranges: Record<string, GTOHandStrategy> | Map<string, GTOHandStrategy>
): RangeMatrix {
  const matrix = createEmptyMatrix();

  const entries = ranges instanceof Map
    ? Array.from(ranges.entries())
    : Object.entries(ranges);

  for (const [hand, strategy] of entries) {
    // Calculate non-fold frequency (raise + call frequency)
    const nonFoldFreq = strategy.actions
      .filter(a => a.action !== 'fold')
      .reduce((sum, a) => sum + a.frequency, 0);

    // Convert from 0-100 to 0-1
    const value = nonFoldFreq / 100;

    try {
      setMatrixValue(matrix, hand, value);
    } catch {
      // Skip invalid hands
    }
  }

  return matrix;
}

/**
 * Calculate statistics for a range matrix
 */
export function calculateRangeStats(matrix: RangeMatrix): {
  rangePercent: number;
  combos: number;
  avgEquity: number;
} {
  const combos = countCombos(matrix);
  const rangePercent = rangePercentage(matrix);

  // Calculate weighted average (simplified - assumes linear equity distribution)
  let totalWeight = 0;
  let weightedEquity = 0;

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const freq = matrix.matrix[row][col];
      if (freq > 0) {
        // Estimate equity based on position in matrix (premium hands top-left)
        const handStrength = (26 - row - col) / 26;
        const baseEquity = 0.35 + handStrength * 0.35;

        let combosForHand: number;
        if (row === col) combosForHand = 6;
        else if (row < col) combosForHand = 4;
        else combosForHand = 12;

        const weight = combosForHand * freq;
        totalWeight += weight;
        weightedEquity += baseEquity * weight;
      }
    }
  }

  const avgEquity = totalWeight > 0 ? (weightedEquity / totalWeight) * 100 : 50;

  return {
    rangePercent: parseFloat(rangePercent.toFixed(1)),
    combos: Math.round(combos),
    avgEquity: parseFloat(avgEquity.toFixed(1)),
  };
}
