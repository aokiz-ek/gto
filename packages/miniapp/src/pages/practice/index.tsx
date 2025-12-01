import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  createDeck,
  shuffleDeck,
  handToDisplayString,
  HAND_CATEGORIES,
  SUIT_SYMBOLS,
} from '@gto/core';
import type { Card, Hand, Position, ActionType } from '@gto/core';
import './index.scss';

interface PracticeScenario {
  heroHand: Hand;
  heroPosition: Position;
  correctAction: ActionType;
}

function generateScenario(): PracticeScenario {
  const deck = shuffleDeck(createDeck());
  const heroHand: Hand = [deck[0], deck[1]];

  const positions: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const heroPosition = positions[Math.floor(Math.random() * positions.length)];

  const handStr = handToDisplayString(heroHand);
  let correctAction: ActionType = 'fold';

  if (HAND_CATEGORIES.PREMIUM.includes(handStr)) {
    correctAction = 'raise';
  } else if (HAND_CATEGORIES.STRONG.includes(handStr)) {
    correctAction = 'raise';
  } else if (HAND_CATEGORIES.PLAYABLE.includes(handStr)) {
    correctAction = ['BTN', 'CO', 'HJ'].includes(heroPosition) ? 'raise' : 'call';
  } else if (HAND_CATEGORIES.SPECULATIVE.includes(handStr)) {
    correctAction = ['BTN', 'SB'].includes(heroPosition) ? 'raise' : 'fold';
  }

  return { heroHand, heroPosition, correctAction };
}

export default function Practice() {
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setScenario(generateScenario());
  }, []);

  const handleAction = (action: ActionType) => {
    if (showResult || !scenario) return;

    setSelectedAction(action);
    setShowResult(true);

    const isCorrect = action === scenario.correctAction;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (isCorrect) {
      Taro.vibrateShort({ type: 'light' });
    } else {
      Taro.vibrateShort({ type: 'heavy' });
    }
  };

  const nextScenario = () => {
    setScenario(generateScenario());
    setSelectedAction(null);
    setShowResult(false);
  };

  const getSuitColor = (suit: string) => {
    return suit === 'h' || suit === 'd' ? '#ff6b6b' : '#ffffff';
  };

  if (!scenario) {
    return (
      <View className="practice-container">
        <Text>Loading...</Text>
      </View>
    );
  }

  const isCorrect = selectedAction === scenario.correctAction;
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <View className="practice-container">
      {/* Stats */}
      <View className="stats-bar">
        <View className="stat">
          <Text className="stat-value">{stats.correct}/{stats.total}</Text>
          <Text className="stat-label">Score</Text>
        </View>
        <View className="stat">
          <Text className="stat-value">{accuracy}%</Text>
          <Text className="stat-label">Accuracy</Text>
        </View>
      </View>

      {/* Scenario Card */}
      <View className="scenario-card">
        <View className="position-info">
          <Text className="position-label">Position</Text>
          <View className="position-badge">
            <Text>{scenario.heroPosition}</Text>
          </View>
        </View>

        {/* Cards */}
        <View className="hand-display">
          {scenario.heroHand.map((card, i) => (
            <View key={i} className="poker-card">
              <Text className="card-rank" style={{ color: getSuitColor(card.suit) }}>
                {card.rank}
              </Text>
              <Text className="card-suit" style={{ color: getSuitColor(card.suit) }}>
                {SUIT_SYMBOLS[card.suit]}
              </Text>
            </View>
          ))}
        </View>

        {/* Hand Name */}
        <View className="hand-name">
          <Text>{handToDisplayString(scenario.heroHand)}</Text>
        </View>

        {/* Action Buttons */}
        <View className="actions">
          <View
            className={`action-btn fold ${selectedAction === 'fold' ? 'selected' : ''}`}
            onClick={() => handleAction('fold')}
          >
            <Text className="action-text">FOLD</Text>
          </View>
          <View
            className={`action-btn call ${selectedAction === 'call' ? 'selected' : ''}`}
            onClick={() => handleAction('call')}
          >
            <Text className="action-text">CALL</Text>
          </View>
          <View
            className={`action-btn raise ${selectedAction === 'raise' ? 'selected' : ''}`}
            onClick={() => handleAction('raise')}
          >
            <Text className="action-text">RAISE</Text>
          </View>
        </View>

        {/* Result */}
        {showResult && (
          <View className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
            <Text className="result-text">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </Text>
            <Text className="result-answer">
              GTO: {scenario.correctAction.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Next Button */}
        {showResult && (
          <View className="next-btn" onClick={nextScenario}>
            <Text>Next Hand</Text>
          </View>
        )}
      </View>
    </View>
  );
}
