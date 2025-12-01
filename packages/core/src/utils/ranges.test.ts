import { describe, it, expect } from 'vitest';
import {
  createEmptyMatrix,
  getMatrixIndices,
  indicesToCombo,
  setMatrixValue,
  getMatrixValue,
  countCombos,
  rangePercentage,
  combosToMatrix,
  getAllStartingHands,
} from './ranges';
import type { HandCombo } from '../types';

describe('ranges utility functions', () => {
  describe('createEmptyMatrix', () => {
    it('should create 13x13 matrix filled with zeros', () => {
      const matrix = createEmptyMatrix();
      expect(matrix.matrix).toHaveLength(13);
      expect(matrix.matrix[0]).toHaveLength(13);
      expect(matrix.matrix.every(row => row.every(v => v === 0))).toBe(true);
    });
  });

  describe('getMatrixIndices', () => {
    it('should get indices for pocket pairs', () => {
      expect(getMatrixIndices('AA')).toEqual([0, 0, false]);
      expect(getMatrixIndices('KK')).toEqual([1, 1, false]);
      expect(getMatrixIndices('22')).toEqual([12, 12, false]);
    });

    it('should get indices for suited hands', () => {
      // Suited hands go in upper triangle (row < col)
      expect(getMatrixIndices('AKs')).toEqual([0, 1, true]);
      expect(getMatrixIndices('AQs')).toEqual([0, 2, true]);
      expect(getMatrixIndices('T9s')).toEqual([4, 5, true]);
    });

    it('should get indices for offsuit hands', () => {
      // Offsuit hands go in lower triangle (row > col)
      expect(getMatrixIndices('AKo')).toEqual([1, 0, false]);
      expect(getMatrixIndices('KQo')).toEqual([2, 1, false]);
    });

    it('should throw for invalid combo', () => {
      expect(() => getMatrixIndices('XY')).toThrow('Invalid combo');
      expect(() => getMatrixIndices('1A')).toThrow('Invalid combo');
    });
  });

  describe('indicesToCombo', () => {
    it('should convert diagonal to pairs', () => {
      expect(indicesToCombo(0, 0)).toBe('AA');
      expect(indicesToCombo(1, 1)).toBe('KK');
      expect(indicesToCombo(12, 12)).toBe('22');
    });

    it('should convert upper triangle to suited hands', () => {
      expect(indicesToCombo(0, 1)).toBe('AKs');
      expect(indicesToCombo(0, 2)).toBe('AQs');
      expect(indicesToCombo(4, 5)).toBe('T9s');
    });

    it('should convert lower triangle to offsuit hands', () => {
      expect(indicesToCombo(1, 0)).toBe('AKo');
      expect(indicesToCombo(2, 1)).toBe('KQo');
    });

    it('should be inverse of getMatrixIndices', () => {
      const combos = ['AA', 'KK', 'AKs', 'AKo', 'T9s', '76o', '22'];
      for (const combo of combos) {
        const [row, col] = getMatrixIndices(combo);
        expect(indicesToCombo(row, col)).toBe(combo);
      }
    });
  });

  describe('setMatrixValue and getMatrixValue', () => {
    it('should set and get values correctly', () => {
      const matrix = createEmptyMatrix();

      setMatrixValue(matrix, 'AA', 1);
      expect(getMatrixValue(matrix, 'AA')).toBe(1);

      setMatrixValue(matrix, 'AKs', 0.5);
      expect(getMatrixValue(matrix, 'AKs')).toBe(0.5);
    });

    it('should clamp values between 0 and 1', () => {
      const matrix = createEmptyMatrix();

      setMatrixValue(matrix, 'AA', 1.5);
      expect(getMatrixValue(matrix, 'AA')).toBe(1);

      setMatrixValue(matrix, 'KK', -0.5);
      expect(getMatrixValue(matrix, 'KK')).toBe(0);
    });
  });

  describe('countCombos', () => {
    it('should count zero for empty matrix', () => {
      const matrix = createEmptyMatrix();
      expect(countCombos(matrix)).toBe(0);
    });

    it('should count 6 combos for a pair at 100%', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AA', 1);
      expect(countCombos(matrix)).toBe(6);
    });

    it('should count 4 combos for a suited hand at 100%', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AKs', 1);
      expect(countCombos(matrix)).toBe(4);
    });

    it('should count 12 combos for an offsuit hand at 100%', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AKo', 1);
      expect(countCombos(matrix)).toBe(12);
    });

    it('should handle partial frequencies', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AA', 0.5); // 6 * 0.5 = 3
      expect(countCombos(matrix)).toBe(3);
    });

    it('should count multiple hands', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AA', 1); // 6
      setMatrixValue(matrix, 'KK', 1); // 6
      setMatrixValue(matrix, 'AKs', 1); // 4
      setMatrixValue(matrix, 'AKo', 1); // 12
      expect(countCombos(matrix)).toBe(28);
    });
  });

  describe('rangePercentage', () => {
    it('should return 0 for empty range', () => {
      const matrix = createEmptyMatrix();
      expect(rangePercentage(matrix)).toBe(0);
    });

    it('should calculate correct percentage', () => {
      const matrix = createEmptyMatrix();
      setMatrixValue(matrix, 'AA', 1); // 6 combos
      // 6 / 1326 * 100 = 0.4525...
      expect(rangePercentage(matrix)).toBeCloseTo(0.4525, 2);
    });

    it('should return 100 for full range', () => {
      const matrix = createEmptyMatrix();
      // Set all hands to 100%
      for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
          matrix.matrix[i][j] = 1;
        }
      }
      expect(rangePercentage(matrix)).toBeCloseTo(100, 0);
    });
  });

  describe('combosToMatrix', () => {
    it('should convert hand combos to matrix', () => {
      const combos: HandCombo[] = [
        { hand: 'AA', actions: [{ action: 'raise', frequency: 1 }] },
        { hand: 'AKs', actions: [{ action: 'raise', frequency: 0.75 }] },
      ];

      const matrix = combosToMatrix(combos);

      expect(getMatrixValue(matrix, 'AA')).toBe(1);
      expect(getMatrixValue(matrix, 'AKs')).toBe(0.75);
      expect(getMatrixValue(matrix, 'KK')).toBe(0);
    });

    it('should use first action frequency', () => {
      const combos: HandCombo[] = [
        {
          hand: 'QQ',
          actions: [
            { action: 'raise', frequency: 0.8 },
            { action: 'call', frequency: 0.2 },
          ],
        },
      ];

      const matrix = combosToMatrix(combos);
      expect(getMatrixValue(matrix, 'QQ')).toBe(0.8);
    });
  });

  describe('getAllStartingHands', () => {
    it('should return 169 hands', () => {
      const hands = getAllStartingHands();
      expect(hands).toHaveLength(169);
    });

    it('should contain all pairs', () => {
      const hands = getAllStartingHands();
      const pairs = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'];
      for (const pair of pairs) {
        expect(hands).toContain(pair);
      }
    });

    it('should contain suited and offsuit versions', () => {
      const hands = getAllStartingHands();
      expect(hands).toContain('AKs');
      expect(hands).toContain('AKo');
      expect(hands).toContain('T9s');
      expect(hands).toContain('T9o');
    });

    it('should have unique hands', () => {
      const hands = getAllStartingHands();
      const uniqueHands = new Set(hands);
      expect(uniqueHands.size).toBe(169);
    });
  });
});
