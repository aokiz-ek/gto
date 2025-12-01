import type { RangeMatrix, HandCombo, Action } from '../types';
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
