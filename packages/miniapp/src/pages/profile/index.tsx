import { useState } from 'react';
import { View, Text, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Profile() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFrequencies, setShowFrequencies] = useState(true);

  const stats = {
    totalSessions: 42,
    accuracy: 68,
    streakDays: 7,
    totalHands: 1250,
  };

  const handleLogin = () => {
    Taro.showToast({
      title: 'Coming soon',
      icon: 'none',
    });
  };

  return (
    <View className="profile-container">
      {/* User Section */}
      <View className="user-section">
        <View className="avatar">
          <Text>G</Text>
        </View>
        <View className="user-info">
          <Text className="user-name">Guest User</Text>
          <Text className="user-plan">Free Plan</Text>
        </View>
        <View className="login-btn" onClick={handleLogin}>
          <Text>Login</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="section">
        <Text className="section-title">Statistics</Text>
        <View className="stats-grid">
          <View className="stat-item">
            <Text className="stat-value">{stats.totalSessions}</Text>
            <Text className="stat-label">Sessions</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{stats.accuracy}%</Text>
            <Text className="stat-label">Accuracy</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{stats.streakDays}</Text>
            <Text className="stat-label">Streak Days</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{stats.totalHands}</Text>
            <Text className="stat-label">Hands</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View className="section">
        <Text className="section-title">Settings</Text>
        <View className="settings-list">
          <View className="setting-item">
            <View className="setting-info">
              <Text className="setting-label">Sound Effects</Text>
              <Text className="setting-desc">Play sounds for actions</Text>
            </View>
            <Switch
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.detail.value)}
              color="#00f5d4"
            />
          </View>
          <View className="setting-item">
            <View className="setting-info">
              <Text className="setting-label">Show Frequencies</Text>
              <Text className="setting-desc">Display GTO frequencies</Text>
            </View>
            <Switch
              checked={showFrequencies}
              onChange={(e) => setShowFrequencies(e.detail.value)}
              color="#00f5d4"
            />
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View className="section">
        <Text className="section-title">Upgrade</Text>
        <View className="upgrade-card">
          <Text className="upgrade-title">Aokiz GTO Pro</Text>
          <Text className="upgrade-desc">
            Unlock all features including advanced analysis, full range charts, and custom scenarios
          </Text>
          <View className="upgrade-btn">
            <Text>Upgrade Now</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View className="section">
        <Text className="section-title">About</Text>
        <View className="about-info">
          <Text className="version">Version 0.1.0</Text>
          <Text className="copyright">Aokiz GTO - Master the Game</Text>
        </View>
      </View>
    </View>
  );
}
