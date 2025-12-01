import { NextRequest, NextResponse } from 'next/server';

// Training recommendation types
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type FocusArea = 'position' | 'street' | 'scenario' | 'hand_type' | 'action';

interface TrainingRecommendation {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  focusArea: FocusArea;
  targetValue: string;
  targetValueZh: string;
  difficulty: DifficultyLevel;
  estimatedQuestions: number;
  priority: number;
  reason: string;
  reasonZh: string;
  practiceUrl: string;
}

interface LearningPath {
  currentLevel: DifficultyLevel;
  nextMilestone: string;
  nextMilestoneZh: string;
  progressPercent: number;
  totalSessionsCompleted: number;
  streak: number;
  recommendations: TrainingRecommendation[];
  dailyGoal: {
    target: number;
    completed: number;
    accuracy: number;
  };
}

// Simulated user weakness data (would come from database in production)
interface UserWeakness {
  area: string;
  areaZh: string;
  focusArea: FocusArea;
  accuracy: number;
  decisionsCount: number;
  evLossBB: number;
}

function getUserWeaknesses(userId: string): UserWeakness[] {
  // Simulated data - in production, fetch from practice_decisions table
  return [
    { area: 'UTG', areaZh: '枪口位', focusArea: 'position', accuracy: 52, decisionsCount: 45, evLossBB: 2.3 },
    { area: 'vs_3bet', areaZh: '面对3-Bet', focusArea: 'scenario', accuracy: 58, decisionsCount: 32, evLossBB: 1.8 },
    { area: 'river', areaZh: '河牌', focusArea: 'street', accuracy: 61, decisionsCount: 28, evLossBB: 1.5 },
    { area: 'small_pairs', areaZh: '小对子', focusArea: 'hand_type', accuracy: 63, decisionsCount: 40, evLossBB: 1.2 },
    { area: 'SB', areaZh: '小盲位', focusArea: 'position', accuracy: 65, decisionsCount: 35, evLossBB: 1.0 },
    { area: 'C-bet', areaZh: '持续下注', focusArea: 'scenario', accuracy: 68, decisionsCount: 50, evLossBB: 0.8 },
    { area: 'suited_connectors', areaZh: '同花连张', focusArea: 'hand_type', accuracy: 70, decisionsCount: 25, evLossBB: 0.6 },
  ];
}

function getDifficultyLabel(level: DifficultyLevel): { en: string; zh: string } {
  const labels: Record<DifficultyLevel, { en: string; zh: string }> = {
    beginner: { en: 'Beginner', zh: '入门' },
    intermediate: { en: 'Intermediate', zh: '进阶' },
    advanced: { en: 'Advanced', zh: '高级' },
    expert: { en: 'Expert', zh: '专家' },
  };
  return labels[level];
}

function calculateUserLevel(weaknesses: UserWeakness[]): DifficultyLevel {
  const avgAccuracy = weaknesses.reduce((sum, w) => sum + w.accuracy, 0) / weaknesses.length;

  if (avgAccuracy < 55) return 'beginner';
  if (avgAccuracy < 70) return 'intermediate';
  if (avgAccuracy < 85) return 'advanced';
  return 'expert';
}

function generateRecommendations(weaknesses: UserWeakness[], userLevel: DifficultyLevel): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];

  // Sort weaknesses by severity (lowest accuracy first)
  const sortedWeaknesses = [...weaknesses].sort((a, b) => a.accuracy - b.accuracy);

  // Generate recommendations for top weaknesses
  sortedWeaknesses.slice(0, 5).forEach((weakness, index) => {
    const difficultyMap: Record<FocusArea, DifficultyLevel> = {
      position: userLevel,
      street: userLevel === 'beginner' ? 'beginner' : 'intermediate',
      scenario: userLevel === 'beginner' ? 'intermediate' : userLevel,
      hand_type: userLevel,
      action: userLevel === 'beginner' ? 'beginner' : 'intermediate',
    };

    const focusAreaLabels: Record<FocusArea, { en: string; zh: string }> = {
      position: { en: 'Position', zh: '位置' },
      street: { en: 'Street', zh: '街道' },
      scenario: { en: 'Scenario', zh: '场景' },
      hand_type: { en: 'Hand Type', zh: '手牌类型' },
      action: { en: 'Action', zh: '动作' },
    };

    const estimatedQuestions = weakness.accuracy < 60 ? 25 :
                               weakness.accuracy < 70 ? 20 : 15;

    recommendations.push({
      id: `rec-${index + 1}`,
      title: `${weakness.area} Training`,
      titleZh: `${weakness.areaZh}专项训练`,
      description: `Focus on improving your ${weakness.area} decisions. Current accuracy: ${weakness.accuracy}%`,
      descriptionZh: `专注提升您在${weakness.areaZh}的决策能力。当前准确率：${weakness.accuracy}%`,
      focusArea: weakness.focusArea,
      targetValue: weakness.area,
      targetValueZh: weakness.areaZh,
      difficulty: difficultyMap[weakness.focusArea],
      estimatedQuestions,
      priority: index + 1,
      reason: `Your accuracy in ${weakness.area} is ${weakness.accuracy}%, with ${weakness.evLossBB.toFixed(1)} BB EV loss.`,
      reasonZh: `您在${weakness.areaZh}的准确率为${weakness.accuracy}%，EV损失${weakness.evLossBB.toFixed(1)} BB。`,
      practiceUrl: `/practice?focus=${encodeURIComponent(weakness.area.toLowerCase())}&difficulty=${difficultyMap[weakness.focusArea]}`,
    });
  });

  // Add a general practice recommendation if user is doing well
  if (sortedWeaknesses[0]?.accuracy > 70) {
    recommendations.push({
      id: 'rec-general',
      title: 'Mixed Practice',
      titleZh: '综合练习',
      description: 'Practice a variety of scenarios to maintain your skills.',
      descriptionZh: '练习各种场景以保持技能水平。',
      focusArea: 'scenario',
      targetValue: 'mixed',
      targetValueZh: '综合',
      difficulty: userLevel,
      estimatedQuestions: 20,
      priority: recommendations.length + 1,
      reason: 'Great job! Keep practicing to maintain your edge.',
      reasonZh: '表现不错！继续练习保持优势。',
      practiceUrl: `/practice?mode=random&difficulty=${userLevel}`,
    });
  }

  return recommendations;
}

function generateDailyGoal(userLevel: DifficultyLevel): LearningPath['dailyGoal'] {
  const targets: Record<DifficultyLevel, number> = {
    beginner: 15,
    intermediate: 25,
    advanced: 35,
    expert: 50,
  };

  // Simulated completion data
  const completed = Math.floor(Math.random() * targets[userLevel]);
  const accuracy = 60 + Math.random() * 30;

  return {
    target: targets[userLevel],
    completed,
    accuracy: Math.round(accuracy * 10) / 10,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    // Get user weaknesses
    const weaknesses = getUserWeaknesses(userId);

    // Calculate user level
    const userLevel = calculateUserLevel(weaknesses);

    // Generate recommendations
    const recommendations = generateRecommendations(weaknesses, userLevel);

    // Generate learning path
    const learningPath: LearningPath = {
      currentLevel: userLevel,
      nextMilestone: userLevel === 'beginner' ? 'Reach 60% overall accuracy' :
                     userLevel === 'intermediate' ? 'Reach 75% overall accuracy' :
                     userLevel === 'advanced' ? 'Reach 90% overall accuracy' :
                     'Maintain GTO mastery',
      nextMilestoneZh: userLevel === 'beginner' ? '达到60%总体准确率' :
                       userLevel === 'intermediate' ? '达到75%总体准确率' :
                       userLevel === 'advanced' ? '达到90%总体准确率' :
                       '保持GTO大师水平',
      progressPercent: userLevel === 'beginner' ? 25 :
                       userLevel === 'intermediate' ? 50 :
                       userLevel === 'advanced' ? 75 : 95,
      totalSessionsCompleted: Math.floor(Math.random() * 50) + 10,
      streak: Math.floor(Math.random() * 14) + 1,
      recommendations,
      dailyGoal: generateDailyGoal(userLevel),
    };

    return NextResponse.json({
      success: true,
      userId,
      generatedAt: new Date().toISOString(),
      learningPath,
      levelLabel: getDifficultyLabel(userLevel),
    });
  } catch (error) {
    console.error('Training recommendation error:', error);
    return NextResponse.json(
      { success: false, error: '生成推荐失败' },
      { status: 500 }
    );
  }
}
