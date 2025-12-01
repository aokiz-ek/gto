import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'premium';
  createdAt: string;
}

// Detailed stats by category
interface CategoryStats {
  correct: number;
  total: number;
}

interface DailyStats {
  date: string;
  correct: number;
  total: number;
}

// Daily Challenge types
interface DailyChallengeResult {
  questionIndex: number;
  correct: boolean;
  score: number;
  action: string;
}

interface DailyChallengeProgress {
  date: string;
  completed: boolean;
  results: DailyChallengeResult[];
  totalScore: number;
  perfectCount: number;
}

// Hand History types
interface SavedHand {
  id: string;
  timestamp: string;
  heroHand: string;
  heroPosition: string;
  villainPosition: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  board: string[];
  results: {
    street: string;
    action: string;
    score: number;
    isCorrect: boolean;
  }[];
  totalScore: number;
  notes?: string;
}

// Achievement System types
export type AchievementId =
  | 'first_hand' | 'first_perfect' | 'streak_3' | 'streak_7' | 'streak_30'
  | 'decisions_100' | 'decisions_500' | 'decisions_1000'
  | 'accuracy_60' | 'accuracy_70' | 'accuracy_80'
  | 'master_preflop' | 'master_postflop'
  | 'position_master' | 'scenario_master'
  | 'daily_champion' | 'speed_demon';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface AchievementState {
  achievements: Record<AchievementId, Achievement>;
  unlockedCount: number;
  totalCount: number;
  recentUnlock?: AchievementId;
}

// Achievement definitions
export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlockedAt' | 'progress'>> = {
  first_hand: { id: 'first_hand', name: '初次尝试', description: '完成第一手牌练习', icon: '🎯', maxProgress: 1 },
  first_perfect: { id: 'first_perfect', name: '完美一击', description: '获得第一个100%得分', icon: '💯', maxProgress: 1 },
  streak_3: { id: 'streak_3', name: '初露锋芒', description: '连续练习3天', icon: '🔥', maxProgress: 3 },
  streak_7: { id: 'streak_7', name: '持之以恒', description: '连续练习7天', icon: '⚡', maxProgress: 7 },
  streak_30: { id: 'streak_30', name: '坚持不懈', description: '连续练习30天', icon: '👑', maxProgress: 30 },
  decisions_100: { id: 'decisions_100', name: '百战百胜', description: '完成100个决策', icon: '📊', maxProgress: 100 },
  decisions_500: { id: 'decisions_500', name: '经验丰富', description: '完成500个决策', icon: '📈', maxProgress: 500 },
  decisions_1000: { id: 'decisions_1000', name: 'GTO大师', description: '完成1000个决策', icon: '🏆', maxProgress: 1000 },
  accuracy_60: { id: 'accuracy_60', name: '入门选手', description: '总准确率达到60%', icon: '🥉', maxProgress: 60 },
  accuracy_70: { id: 'accuracy_70', name: '进阶玩家', description: '总准确率达到70%', icon: '🥈', maxProgress: 70 },
  accuracy_80: { id: 'accuracy_80', name: '高手', description: '总准确率达到80%', icon: '🥇', maxProgress: 80 },
  master_preflop: { id: 'master_preflop', name: '翻前大师', description: '翻前准确率达到75%（至少50手）', icon: '🃏', maxProgress: 75 },
  master_postflop: { id: 'master_postflop', name: '翻后大师', description: '翻后准确率达到70%（至少50手）', icon: '🎰', maxProgress: 70 },
  position_master: { id: 'position_master', name: '位置大师', description: '在所有位置准确率均超过65%', icon: '🧭', maxProgress: 1 },
  scenario_master: { id: 'scenario_master', name: '场景大师', description: '在所有场景准确率均超过65%', icon: '🎲', maxProgress: 1 },
  daily_champion: { id: 'daily_champion', name: '每日冠军', description: '在每日挑战中获得满分', icon: '🌟', maxProgress: 1 },
  speed_demon: { id: 'speed_demon', name: '闪电侠', description: '平均决策时间低于3秒（至少20手）', icon: '⏱️', maxProgress: 1 },
};

interface PracticeStats {
  totalSessions: number;
  correctDecisions: number;
  totalDecisions: number;
  streakDays: number;
  lastPractice: string | null;

  // Detailed breakdowns
  byStreet: {
    preflop: CategoryStats;
    flop: CategoryStats;
    turn: CategoryStats;
    river: CategoryStats;
  };
  byScenario: {
    rfi: CategoryStats;
    vs_rfi: CategoryStats;
    vs_3bet: CategoryStats;
  };
  byPosition: Record<string, CategoryStats>;
  byHandType: {
    pairs: CategoryStats;
    suited: CategoryStats;
    offsuit: CategoryStats;
  };
  dailyHistory: DailyStats[];
  weakSpots: string[]; // Identified weak areas
}

interface DetailedPracticeResult {
  correct: boolean;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  position: string;
  handType: 'pairs' | 'suited' | 'offsuit';
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  practiceStats: PracticeStats;
  dailyChallenge: DailyChallengeProgress | null;
  savedHands: SavedHand[];
  achievements: AchievementState;

  // Settings
  settings: {
    theme: 'dark' | 'light';
    soundEnabled: boolean;
    showFrequencies: boolean;
    defaultStackSize: number;
  };

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  updatePracticeStats: (correct: boolean) => void;
  updateDetailedStats: (result: DetailedPracticeResult) => void;
  resetStats: () => void;
  updateSettings: (settings: Partial<UserState['settings']>) => void;
  // Daily Challenge actions
  startDailyChallenge: () => void;
  recordDailyChallengeResult: (result: DailyChallengeResult) => void;
  completeDailyChallenge: () => void;
  // Hand History actions
  saveHand: (hand: Omit<SavedHand, 'id' | 'timestamp'>) => void;
  deleteHand: (id: string) => void;
  updateHandNotes: (id: string, notes: string) => void;
  // Achievement actions
  checkAchievements: () => AchievementId[];
  clearRecentUnlock: () => void;
}

const defaultCategoryStats = (): CategoryStats => ({ correct: 0, total: 0 });

const defaultPracticeStats: PracticeStats = {
  totalSessions: 0,
  correctDecisions: 0,
  totalDecisions: 0,
  streakDays: 0,
  lastPractice: null,
  byStreet: {
    preflop: defaultCategoryStats(),
    flop: defaultCategoryStats(),
    turn: defaultCategoryStats(),
    river: defaultCategoryStats(),
  },
  byScenario: {
    rfi: defaultCategoryStats(),
    vs_rfi: defaultCategoryStats(),
    vs_3bet: defaultCategoryStats(),
  },
  byPosition: {},
  byHandType: {
    pairs: defaultCategoryStats(),
    suited: defaultCategoryStats(),
    offsuit: defaultCategoryStats(),
  },
  dailyHistory: [],
  weakSpots: [],
};

// Default achievements state
const createDefaultAchievements = (): AchievementState => {
  const achievements = {} as Record<AchievementId, Achievement>;
  (Object.keys(ACHIEVEMENTS) as AchievementId[]).forEach(id => {
    achievements[id] = { ...ACHIEVEMENTS[id], progress: 0 };
  });
  return {
    achievements,
    unlockedCount: 0,
    totalCount: Object.keys(ACHIEVEMENTS).length,
  };
};

// Helper to identify weak spots
function identifyWeakSpots(stats: PracticeStats): string[] {
  const weakSpots: string[] = [];
  const threshold = 0.6; // 60% accuracy threshold

  // Check streets
  Object.entries(stats.byStreet).forEach(([street, data]) => {
    if (data.total >= 10 && data.correct / data.total < threshold) {
      weakSpots.push(`${street}_street`);
    }
  });

  // Check scenarios
  Object.entries(stats.byScenario).forEach(([scenario, data]) => {
    if (data.total >= 10 && data.correct / data.total < threshold) {
      weakSpots.push(`${scenario}_scenario`);
    }
  });

  // Check positions
  Object.entries(stats.byPosition).forEach(([position, data]) => {
    if (data.total >= 10 && data.correct / data.total < threshold) {
      weakSpots.push(`${position}_position`);
    }
  });

  // Check hand types
  Object.entries(stats.byHandType).forEach(([handType, data]) => {
    if (data.total >= 10 && data.correct / data.total < threshold) {
      weakSpots.push(`${handType}_hands`);
    }
  });

  return weakSpots;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      practiceStats: defaultPracticeStats,
      dailyChallenge: null,
      savedHands: [],
      achievements: createDefaultAchievements(),
      settings: {
        theme: 'dark',
        soundEnabled: true,
        showFrequencies: true,
        defaultStackSize: 100,
      },

      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      logout: () => set({
        user: null,
        isAuthenticated: false
      }),

      updatePracticeStats: (correct) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = state.practiceStats.lastPractice?.split('T')[0];

        let streakDays = state.practiceStats.streakDays;
        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastDate === yesterday.toISOString().split('T')[0]) {
            streakDays += 1;
          } else if (lastDate !== today) {
            streakDays = 1;
          }
        }

        // Update daily history
        const dailyHistory = [...(state.practiceStats.dailyHistory || [])];
        const todayEntry = dailyHistory.find(d => d.date === today);
        if (todayEntry) {
          todayEntry.correct += correct ? 1 : 0;
          todayEntry.total += 1;
        } else {
          dailyHistory.push({ date: today, correct: correct ? 1 : 0, total: 1 });
          // Keep only last 30 days
          if (dailyHistory.length > 30) dailyHistory.shift();
        }

        return {
          practiceStats: {
            ...state.practiceStats,
            correctDecisions: state.practiceStats.correctDecisions + (correct ? 1 : 0),
            totalDecisions: state.practiceStats.totalDecisions + 1,
            streakDays,
            lastPractice: new Date().toISOString(),
            dailyHistory,
          },
        };
      }),

      updateDetailedStats: (result) => set((state) => {
        const { correct, street, scenario, position, handType } = result;
        const stats = { ...state.practiceStats };

        // Ensure byStreet exists with defaults
        const byStreet = stats.byStreet || defaultPracticeStats.byStreet;
        const streetStats = byStreet[street] || defaultCategoryStats();
        stats.byStreet = {
          ...byStreet,
          [street]: {
            correct: streetStats.correct + (correct ? 1 : 0),
            total: streetStats.total + 1,
          },
        };

        // Ensure byScenario exists with defaults
        const byScenario = stats.byScenario || defaultPracticeStats.byScenario;
        const scenarioStats = byScenario[scenario] || defaultCategoryStats();
        stats.byScenario = {
          ...byScenario,
          [scenario]: {
            correct: scenarioStats.correct + (correct ? 1 : 0),
            total: scenarioStats.total + 1,
          },
        };

        // Update by position
        const byPosition = stats.byPosition || {};
        const posStats = byPosition[position] || defaultCategoryStats();
        stats.byPosition = {
          ...byPosition,
          [position]: {
            correct: posStats.correct + (correct ? 1 : 0),
            total: posStats.total + 1,
          },
        };

        // Ensure byHandType exists with defaults
        const byHandType = stats.byHandType || defaultPracticeStats.byHandType;
        const handStats = byHandType[handType] || defaultCategoryStats();
        stats.byHandType = {
          ...byHandType,
          [handType]: {
            correct: handStats.correct + (correct ? 1 : 0),
            total: handStats.total + 1,
          },
        };

        // Identify weak spots
        stats.weakSpots = identifyWeakSpots(stats);

        return { practiceStats: stats };
      }),

      resetStats: () => set({ practiceStats: defaultPracticeStats }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      // Daily Challenge actions
      startDailyChallenge: () => set(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
          dailyChallenge: {
            date: today,
            completed: false,
            results: [],
            totalScore: 0,
            perfectCount: 0,
          },
        };
      }),

      recordDailyChallengeResult: (result) => set((state) => {
        if (!state.dailyChallenge) return state;
        const results = [...state.dailyChallenge.results, result];
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const perfectCount = results.filter(r => r.score >= 80).length;
        return {
          dailyChallenge: {
            ...state.dailyChallenge,
            results,
            totalScore,
            perfectCount,
          },
        };
      }),

      completeDailyChallenge: () => set((state) => {
        if (!state.dailyChallenge) return state;
        return {
          dailyChallenge: {
            ...state.dailyChallenge,
            completed: true,
          },
        };
      }),

      // Hand History actions
      saveHand: (hand) => set((state) => {
        const newHand: SavedHand = {
          ...hand,
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          timestamp: new Date().toISOString(),
        };
        return {
          savedHands: [newHand, ...state.savedHands].slice(0, 100), // Keep max 100 hands
        };
      }),

      deleteHand: (id) => set((state) => ({
        savedHands: state.savedHands.filter(h => h.id !== id),
      })),

      updateHandNotes: (id, notes) => set((state) => ({
        savedHands: state.savedHands.map(h =>
          h.id === id ? { ...h, notes } : h
        ),
      })),

      // Achievement actions
      checkAchievements: () => {
        const state = get();
        const { practiceStats, achievements, dailyChallenge } = state;
        const newUnlocks: AchievementId[] = [];
        const updatedAchievements = { ...achievements.achievements };
        const now = new Date().toISOString();

        // Helper to unlock achievement
        const unlock = (id: AchievementId) => {
          if (!updatedAchievements[id].unlockedAt) {
            updatedAchievements[id] = { ...updatedAchievements[id], unlockedAt: now };
            newUnlocks.push(id);
          }
        };

        // Helper to update progress
        const updateProgress = (id: AchievementId, progress: number) => {
          updatedAchievements[id] = { ...updatedAchievements[id], progress };
        };

        const totalDecisions = practiceStats.totalDecisions;
        const accuracy = totalDecisions > 0
          ? (practiceStats.correctDecisions / totalDecisions) * 100
          : 0;

        // First hand
        if (totalDecisions >= 1) {
          updateProgress('first_hand', 1);
          unlock('first_hand');
        }

        // Streak achievements
        updateProgress('streak_3', Math.min(practiceStats.streakDays, 3));
        updateProgress('streak_7', Math.min(practiceStats.streakDays, 7));
        updateProgress('streak_30', Math.min(practiceStats.streakDays, 30));
        if (practiceStats.streakDays >= 3) unlock('streak_3');
        if (practiceStats.streakDays >= 7) unlock('streak_7');
        if (practiceStats.streakDays >= 30) unlock('streak_30');

        // Decision count achievements
        updateProgress('decisions_100', Math.min(totalDecisions, 100));
        updateProgress('decisions_500', Math.min(totalDecisions, 500));
        updateProgress('decisions_1000', Math.min(totalDecisions, 1000));
        if (totalDecisions >= 100) unlock('decisions_100');
        if (totalDecisions >= 500) unlock('decisions_500');
        if (totalDecisions >= 1000) unlock('decisions_1000');

        // Accuracy achievements
        if (totalDecisions >= 20) {
          updateProgress('accuracy_60', Math.min(accuracy, 60));
          updateProgress('accuracy_70', Math.min(accuracy, 70));
          updateProgress('accuracy_80', Math.min(accuracy, 80));
          if (accuracy >= 60) unlock('accuracy_60');
          if (accuracy >= 70) unlock('accuracy_70');
          if (accuracy >= 80) unlock('accuracy_80');
        }

        // Preflop master
        const preflopStats = practiceStats.byStreet.preflop;
        if (preflopStats.total >= 50) {
          const preflopAcc = (preflopStats.correct / preflopStats.total) * 100;
          updateProgress('master_preflop', Math.min(preflopAcc, 75));
          if (preflopAcc >= 75) unlock('master_preflop');
        }

        // Postflop master (flop + turn + river combined)
        const postflopCorrect = practiceStats.byStreet.flop.correct +
          practiceStats.byStreet.turn.correct +
          practiceStats.byStreet.river.correct;
        const postflopTotal = practiceStats.byStreet.flop.total +
          practiceStats.byStreet.turn.total +
          practiceStats.byStreet.river.total;
        if (postflopTotal >= 50) {
          const postflopAcc = (postflopCorrect / postflopTotal) * 100;
          updateProgress('master_postflop', Math.min(postflopAcc, 70));
          if (postflopAcc >= 70) unlock('master_postflop');
        }

        // Scenario master - all scenarios above 65%
        const scenarios = Object.values(practiceStats.byScenario);
        const scenariosMet = scenarios.filter(s => s.total >= 10 && (s.correct / s.total) >= 0.65);
        if (scenarios.every(s => s.total >= 10) && scenariosMet.length === scenarios.length) {
          updateProgress('scenario_master', 1);
          unlock('scenario_master');
        }

        // Position master - all positions above 65%
        const positions = Object.values(practiceStats.byPosition);
        if (positions.length >= 6) {
          const positionsMet = positions.filter(p => p.total >= 5 && (p.correct / p.total) >= 0.65);
          if (positionsMet.length >= 6) {
            updateProgress('position_master', 1);
            unlock('position_master');
          }
        }

        // Daily champion
        if (dailyChallenge?.completed && dailyChallenge.totalScore >= 500) {
          updateProgress('daily_champion', 1);
          unlock('daily_champion');
        }

        const unlockedCount = Object.values(updatedAchievements).filter(a => a.unlockedAt).length;

        set({
          achievements: {
            achievements: updatedAchievements,
            unlockedCount,
            totalCount: Object.keys(ACHIEVEMENTS).length,
            recentUnlock: newUnlocks[0],
          },
        });

        return newUnlocks;
      },

      clearRecentUnlock: () => set((state) => ({
        achievements: {
          ...state.achievements,
          recentUnlock: undefined,
        },
      })),
    }),
    {
      name: 'gto-user-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        practiceStats: state.practiceStats,
        achievements: state.achievements,
        dailyChallenge: state.dailyChallenge,
        savedHands: state.savedHands,
        settings: state.settings,
      }),
    }
  )
);
