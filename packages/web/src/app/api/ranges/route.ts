import { NextRequest, NextResponse } from 'next/server';
import { createEmptyMatrix, setMatrixValue, HAND_CATEGORIES } from '@gto/core';
import type { Position, RangeMatrix } from '@gto/core';

// Pre-defined opening ranges by position
// These would typically come from a database with solved GTO solutions
const OPENING_RANGES: Record<Position, string[]> = {
  UTG: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    'ATs', 'KQs', '99', '88',
  ],
  UTG1: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...['ATs', 'KQs', 'QJs', '99', '88', '77'],
  ],
  UTG2: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...['ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', '99', '88', '77'],
  ],
  LJ: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    'A8s', 'A7s', 'KTs', 'K9s', 'QTs', 'T9s', '66', '55',
  ],
  HJ: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    ...['A6s', 'A5s', 'A4s', 'K9s', 'K8s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '66', '55', '44'],
  ],
  CO: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    ...HAND_CATEGORIES.SPECULATIVE,
    'ATo', 'KJo', 'QJo', 'JTo',
  ],
  BTN: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    ...HAND_CATEGORIES.SPECULATIVE,
    'ATo', 'A9o', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo', 'T9o',
    'K7s', 'K6s', 'Q8s', 'J8s', 'T8s', '97s', '86s', '75s', '65s', '54s',
  ],
  SB: [
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    'A8s', 'A7s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '76s',
    'ATo', 'KJo', 'QJo',
  ],
  BB: [
    // BB defends wide
    ...HAND_CATEGORIES.PREMIUM,
    ...HAND_CATEGORIES.STRONG,
    ...HAND_CATEGORIES.PLAYABLE,
    ...HAND_CATEGORIES.SPECULATIVE,
    'K5s', 'K4s', 'K3s', 'K2s', 'Q7s', 'Q6s', 'J7s', 'T7s', '96s', '85s', '74s', '64s', '53s', '43s',
    'ATo', 'A9o', 'A8o', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo', 'T9o', '98o', '87o',
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const position = searchParams.get('position') as Position;

    if (!position || !OPENING_RANGES[position]) {
      return NextResponse.json(
        { error: 'Invalid position' },
        { status: 400 }
      );
    }

    const matrix = createEmptyMatrix();
    const hands = OPENING_RANGES[position];

    // Set frequencies for each hand
    hands.forEach(hand => {
      // Premium hands at 100%
      if (HAND_CATEGORIES.PREMIUM.includes(hand)) {
        setMatrixValue(matrix, hand, 1);
      }
      // Strong hands at 90%
      else if (HAND_CATEGORIES.STRONG.includes(hand)) {
        setMatrixValue(matrix, hand, 0.9);
      }
      // Playable hands at 70%
      else if (HAND_CATEGORIES.PLAYABLE.includes(hand)) {
        setMatrixValue(matrix, hand, 0.7);
      }
      // Speculative hands at 40%
      else if (HAND_CATEGORIES.SPECULATIVE.includes(hand)) {
        setMatrixValue(matrix, hand, 0.4);
      }
      // Other hands at varying frequencies
      else {
        setMatrixValue(matrix, hand, 0.5);
      }
    });

    // Calculate range statistics
    let totalCombos = 0;
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const freq = matrix.matrix[row][col];
        if (freq > 0) {
          if (row === col) {
            totalCombos += 6 * freq; // Pairs
          } else if (row < col) {
            totalCombos += 4 * freq; // Suited
          } else {
            totalCombos += 12 * freq; // Offsuit
          }
        }
      }
    }

    const rangePercentage = (totalCombos / 1326) * 100;

    return NextResponse.json({
      position,
      matrix,
      stats: {
        totalCombos: Math.round(totalCombos),
        rangePercentage: Math.round(rangePercentage * 10) / 10,
        totalHands: 1326,
      },
    });
  } catch (error) {
    console.error('Ranges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
