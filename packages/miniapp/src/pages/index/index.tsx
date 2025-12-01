import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { HAND_CATEGORIES, RANKS } from '@gto/core';
import type { Position } from '@gto/core';
import './index.scss';

export default function Index() {
  const [selectedPosition, setSelectedPosition] = useState<Position>('BTN');

  const positions: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  // Create simple range matrix visualization
  const getHandStrength = (row: number, col: number): string => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    let hand: string;

    if (row === col) {
      hand = `${rank1}${rank2}`;
    } else if (row < col) {
      hand = `${rank1}${rank2}s`;
    } else {
      hand = `${rank2}${rank1}o`;
    }

    if (HAND_CATEGORIES.PREMIUM.includes(hand)) return 'premium';
    if (HAND_CATEGORIES.STRONG.includes(hand)) return 'strong';
    if (HAND_CATEGORIES.PLAYABLE.includes(hand)) return 'playable';
    if (HAND_CATEGORIES.SPECULATIVE.includes(hand)) return 'speculative';
    return 'fold';
  };

  return (
    <View className="container">
      {/* Header */}
      <View className="header">
        <Text className="title">Aokiz GTO</Text>
        <Text className="subtitle">Game Theory Optimal</Text>
      </View>

      {/* Position Selector */}
      <View className="card">
        <Text className="card-title">Select Position</Text>
        <View className="positions">
          {positions.map(pos => (
            <View
              key={pos}
              className={`position-badge ${selectedPosition === pos ? 'active' : ''}`}
              onClick={() => setSelectedPosition(pos)}
            >
              <Text>{pos}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Range Matrix */}
      <View className="card">
        <Text className="card-title">Opening Range - {selectedPosition}</Text>
        <View className="matrix">
          {Array(13).fill(null).map((_, row) => (
            <View key={row} className="matrix-row">
              {Array(13).fill(null).map((__, col) => (
                <View
                  key={col}
                  className={`matrix-cell ${getHandStrength(row, col)}`}
                >
                  <Text className="cell-text">
                    {row === col
                      ? RANKS[row]
                      : row < col
                        ? `${RANKS[row]}${RANKS[col]}s`[0]
                        : `${RANKS[col]}${RANKS[row]}o`[0]
                    }
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="card">
        <Text className="card-title">Recommended Action</Text>
        <View className="actions">
          <View className="action-btn raise">
            <Text className="action-text">RAISE</Text>
            <Text className="action-freq">70%</Text>
          </View>
          <View className="action-btn call">
            <Text className="action-text">CALL</Text>
            <Text className="action-freq">20%</Text>
          </View>
          <View className="action-btn fold">
            <Text className="action-text">FOLD</Text>
            <Text className="action-freq">10%</Text>
          </View>
        </View>
      </View>

      {/* EV Display */}
      <View className="card ev-card">
        <Text className="ev-label">Expected Value</Text>
        <Text className="ev-value">+2.35 BB</Text>
      </View>
    </View>
  );
}
