import { useState } from 'react';
import { View, Text, Picker } from '@tarojs/components';
import { RANKS, SUITS, HAND_CATEGORIES } from '@gto/core';
import type { Position } from '@gto/core';
import './index.scss';

export default function Analyzer() {
  const [heroPosition, setHeroPosition] = useState<Position>('BTN');
  const [villainPosition, setVillainPosition] = useState<Position>('CO');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const positions: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  const handleCardSelect = (rank: string, suit: string) => {
    const cardStr = `${rank}${suit}`;
    if (selectedCards.includes(cardStr)) {
      setSelectedCards(selectedCards.filter(c => c !== cardStr));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, cardStr]);
    }
  };

  const getCardColor = (suit: string) => {
    return suit === 'h' || suit === 'd' ? '#ff6b6b' : '#ffffff';
  };

  return (
    <View className="analyzer-container">
      <View className="section">
        <Text className="section-title">Your Position</Text>
        <View className="positions">
          {positions.map(pos => (
            <View
              key={pos}
              className={`position-badge ${heroPosition === pos ? 'active' : ''}`}
              onClick={() => setHeroPosition(pos)}
            >
              <Text>{pos}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">Villain Position</Text>
        <View className="positions">
          {positions.filter(p => p !== heroPosition).map(pos => (
            <View
              key={pos}
              className={`position-badge ${villainPosition === pos ? 'active' : ''}`}
              onClick={() => setVillainPosition(pos)}
            >
              <Text>{pos}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">Select Cards ({selectedCards.length}/2)</Text>
        <View className="card-selector">
          {SUITS.map(suit => (
            <View key={suit} className="suit-row">
              {RANKS.map(rank => {
                const cardStr = `${rank}${suit}`;
                const isSelected = selectedCards.includes(cardStr);
                return (
                  <View
                    key={cardStr}
                    className={`card-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCardSelect(rank, suit)}
                    style={{ color: isSelected ? '#0a0a0f' : getCardColor(suit) }}
                  >
                    <Text>{rank}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">Analysis</Text>
        <View className="analysis-result">
          <View className="stat-row">
            <Text className="stat-label">Equity</Text>
            <Text className="stat-value">62.3%</Text>
          </View>
          <View className="stat-row">
            <Text className="stat-label">EV</Text>
            <Text className="stat-value">+3.2 BB</Text>
          </View>
        </View>
        <View className="actions">
          <View className="action-btn raise">
            <Text className="action-text">RAISE</Text>
            <Text className="action-freq">65%</Text>
          </View>
          <View className="action-btn call">
            <Text className="action-text">CALL</Text>
            <Text className="action-freq">25%</Text>
          </View>
          <View className="action-btn fold">
            <Text className="action-text">FOLD</Text>
            <Text className="action-freq">10%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
