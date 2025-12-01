import { NextRequest, NextResponse } from 'next/server';
import type { Card, Position, Street, ActionType } from '@gto/core';

interface AnalyzeRequest {
  heroHand: [Card, Card];
  board: Card[];
  heroPosition: Position;
  villainPosition: Position;
  street: Street;
  potSize: number;
  stackSize: number;
}

interface AnalyzeResponse {
  recommendedActions: Array<{
    action: ActionType;
    frequency: number;
    ev: number;
  }>;
  equity: number;
  handStrength: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    const {
      heroHand,
      board,
      heroPosition,
      villainPosition,
      street,
      potSize,
      stackSize,
    } = body;

    // Validate input
    if (!heroHand || heroHand.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid hero hand' },
        { status: 400 }
      );
    }

    // TODO: Implement actual GTO solver integration
    // For now, return mock analysis data

    // Simple heuristic based on hand strength
    const rank1Value = getRankValue(heroHand[0].rank);
    const rank2Value = getRankValue(heroHand[1].rank);
    const isPair = heroHand[0].rank === heroHand[1].rank;
    const isSuited = heroHand[0].suit === heroHand[1].suit;

    let equity = 0.5;
    let raiseFreq = 0.3;
    let callFreq = 0.3;
    let foldFreq = 0.4;

    // Premium hands
    if (isPair && rank1Value >= 12) {
      equity = 0.85;
      raiseFreq = 1.0;
      callFreq = 0;
      foldFreq = 0;
    } else if (isPair && rank1Value >= 10) {
      equity = 0.75;
      raiseFreq = 0.9;
      callFreq = 0.1;
      foldFreq = 0;
    } else if (rank1Value + rank2Value >= 25 && isSuited) {
      equity = 0.65;
      raiseFreq = 0.8;
      callFreq = 0.15;
      foldFreq = 0.05;
    } else if (rank1Value + rank2Value >= 23) {
      equity = 0.55;
      raiseFreq = 0.6;
      callFreq = 0.25;
      foldFreq = 0.15;
    } else if (isPair) {
      equity = 0.52;
      raiseFreq = 0.4;
      callFreq = 0.4;
      foldFreq = 0.2;
    }

    // Position adjustment
    const positionBonus = ['BTN', 'CO', 'HJ'].includes(heroPosition) ? 0.05 : 0;
    equity = Math.min(1, equity + positionBonus);

    const response: AnalyzeResponse = {
      recommendedActions: [
        { action: 'raise' as ActionType, frequency: raiseFreq, ev: raiseFreq * potSize * 0.5 },
        { action: 'call' as ActionType, frequency: callFreq, ev: callFreq * potSize * 0.2 },
        { action: 'fold' as ActionType, frequency: foldFreq, ev: 0 },
      ].sort((a, b) => b.frequency - a.frequency),
      equity,
      handStrength: getHandStrength(equity),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRankValue(rank: string): number {
  const values: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };
  return values[rank] || 0;
}

function getHandStrength(equity: number): string {
  if (equity >= 0.8) return 'Premium';
  if (equity >= 0.65) return 'Strong';
  if (equity >= 0.5) return 'Playable';
  if (equity >= 0.35) return 'Marginal';
  return 'Weak';
}
