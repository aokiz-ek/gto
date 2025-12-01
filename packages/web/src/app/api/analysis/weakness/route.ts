import { NextRequest, NextResponse } from 'next/server';

// Weakness categories
type WeaknessCategory = 'position' | 'street' | 'scenario' | 'hand_type' | 'action_type';

interface WeaknessData {
  category: WeaknessCategory;
  name: string;
  nameZh: string;
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number;
  evLossBB: number;
  trend: 'improving' | 'declining' | 'stable';
  severity: 'critical' | 'major' | 'minor' | 'none';
}

interface WeaknessReport {
  success: boolean;
  userId: string;
  generatedAt: string;
  summary: {
    totalDecisions: number;
    overallAccuracy: number;
    totalEvLossBB: number;
    avgEvLossPerDecision: number;
    overallRating: string;
    overallRatingEn: string;
    improvementFromLastWeek?: number;
  };
  weaknesses: {
    critical: WeaknessData[];
    major: WeaknessData[];
    minor: WeaknessData[];
  };
  strengths: WeaknessData[];
  recommendations: {
    priority: number;
    category: WeaknessCategory;
    targetArea: string;
    targetAreaZh: string;
    description: string;
    descriptionZh: string;
    suggestedPractice: string;
    suggestedPracticeZh: string;
    practiceUrl?: string;
  }[];
  byPosition: WeaknessData[];
  byStreet: WeaknessData[];
  byScenario: WeaknessData[];
  byHandType: WeaknessData[];
  recentTrend: {
    date: string;
    accuracy: number;
    evLossBB: number;
  }[];
}

// Simulated practice data analysis (would fetch from Supabase in production)
function analyzePracticeData(userId: string): WeaknessReport {
  // Generate sample data for demonstration
  // In production, this would query the practice_decisions table

  const positions = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const streets = ['preflop', 'flop', 'turn', 'river'];
  const scenarios = ['RFI', 'vs_RFI', '3-Bet', 'vs_3-Bet', 'C-bet', 'Facing C-bet'];
  const handTypes = ['Premium pairs (AA-QQ)', 'Medium pairs (JJ-88)', 'Small pairs (77-22)',
                     'Broadway suited', 'Broadway offsuit', 'Suited connectors',
                     'Suited aces', 'Other suited', 'Offsuit hands'];

  // Simulate position stats
  const byPosition: WeaknessData[] = positions.map(pos => ({
    category: 'position' as WeaknessCategory,
    name: pos,
    nameZh: pos === 'UTG' ? '枪口' :
            pos === 'LJ' ? '劫位' :
            pos === 'HJ' ? '关煞位' :
            pos === 'CO' ? '切位' :
            pos === 'BTN' ? '按钮位' :
            pos === 'SB' ? '小盲' :
            pos === 'BB' ? '大盲' : pos,
    totalDecisions: Math.floor(Math.random() * 100) + 20,
    correctDecisions: 0,
    accuracy: Math.random() * 40 + 50, // 50-90%
    evLossBB: Math.random() * 2,
    trend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as 'improving' | 'declining' | 'stable',
    severity: 'none' as 'critical' | 'major' | 'minor' | 'none',
  })).map(d => ({
    ...d,
    correctDecisions: Math.floor(d.totalDecisions * d.accuracy / 100),
    severity: d.accuracy < 55 ? 'critical' :
              d.accuracy < 65 ? 'major' :
              d.accuracy < 75 ? 'minor' : 'none',
  }));

  // Simulate street stats
  const byStreet: WeaknessData[] = streets.map((street, i) => ({
    category: 'street' as WeaknessCategory,
    name: street,
    nameZh: street === 'preflop' ? '翻前' :
            street === 'flop' ? '翻牌' :
            street === 'turn' ? '转牌' : '河牌',
    totalDecisions: Math.floor(Math.random() * 150) + 50,
    correctDecisions: 0,
    accuracy: i === 0 ? 75 + Math.random() * 15 : // Preflop usually better
              60 + Math.random() * 20, // Postflop more variable
    evLossBB: Math.random() * 3,
    trend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as 'improving' | 'declining' | 'stable',
    severity: 'none' as 'critical' | 'major' | 'minor' | 'none',
  })).map(d => ({
    ...d,
    correctDecisions: Math.floor(d.totalDecisions * d.accuracy / 100),
    severity: d.accuracy < 55 ? 'critical' :
              d.accuracy < 65 ? 'major' :
              d.accuracy < 75 ? 'minor' : 'none',
  }));

  // Simulate scenario stats
  const byScenario: WeaknessData[] = scenarios.map(scenario => ({
    category: 'scenario' as WeaknessCategory,
    name: scenario,
    nameZh: scenario === 'RFI' ? '率先加注' :
            scenario === 'vs_RFI' ? '面对加注' :
            scenario === '3-Bet' ? '3-Bet' :
            scenario === 'vs_3-Bet' ? '面对3-Bet' :
            scenario === 'C-bet' ? '持续下注' : '面对C-bet',
    totalDecisions: Math.floor(Math.random() * 80) + 20,
    correctDecisions: 0,
    accuracy: Math.random() * 35 + 55,
    evLossBB: Math.random() * 2.5,
    trend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as 'improving' | 'declining' | 'stable',
    severity: 'none' as 'critical' | 'major' | 'minor' | 'none',
  })).map(d => ({
    ...d,
    correctDecisions: Math.floor(d.totalDecisions * d.accuracy / 100),
    severity: d.accuracy < 55 ? 'critical' :
              d.accuracy < 65 ? 'major' :
              d.accuracy < 75 ? 'minor' : 'none',
  }));

  // Simulate hand type stats
  const byHandType: WeaknessData[] = handTypes.map(ht => ({
    category: 'hand_type' as WeaknessCategory,
    name: ht,
    nameZh: ht === 'Premium pairs (AA-QQ)' ? '高级对子(AA-QQ)' :
            ht === 'Medium pairs (JJ-88)' ? '中等对子(JJ-88)' :
            ht === 'Small pairs (77-22)' ? '小对子(77-22)' :
            ht === 'Broadway suited' ? '大牌同花' :
            ht === 'Broadway offsuit' ? '大牌杂色' :
            ht === 'Suited connectors' ? '同花连张' :
            ht === 'Suited aces' ? '同花A' :
            ht === 'Other suited' ? '其他同花' : '杂色牌',
    totalDecisions: Math.floor(Math.random() * 60) + 10,
    correctDecisions: 0,
    accuracy: Math.random() * 40 + 50,
    evLossBB: Math.random() * 2,
    trend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as 'improving' | 'declining' | 'stable',
    severity: 'none' as 'critical' | 'major' | 'minor' | 'none',
  })).map(d => ({
    ...d,
    correctDecisions: Math.floor(d.totalDecisions * d.accuracy / 100),
    severity: d.accuracy < 55 ? 'critical' :
              d.accuracy < 65 ? 'major' :
              d.accuracy < 75 ? 'minor' : 'none',
  }));

  // Aggregate all weaknesses
  const allWeaknesses = [...byPosition, ...byStreet, ...byScenario, ...byHandType];

  const critical = allWeaknesses.filter(w => w.severity === 'critical').sort((a, b) => a.accuracy - b.accuracy);
  const major = allWeaknesses.filter(w => w.severity === 'major').sort((a, b) => a.accuracy - b.accuracy);
  const minor = allWeaknesses.filter(w => w.severity === 'minor').sort((a, b) => a.accuracy - b.accuracy);
  const strengths = allWeaknesses.filter(w => w.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);

  // Calculate summary
  const totalDecisions = allWeaknesses.reduce((sum, w) => sum + w.totalDecisions, 0) / 4; // Divide by 4 categories
  const overallAccuracy = allWeaknesses.reduce((sum, w) => sum + w.accuracy, 0) / allWeaknesses.length;
  const totalEvLossBB = allWeaknesses.reduce((sum, w) => sum + w.evLossBB, 0);
  const avgEvLossPerDecision = totalEvLossBB / totalDecisions;

  let overallRating = 'GTO大师';
  let overallRatingEn = 'GTO Master';
  if (overallAccuracy < 60) {
    overallRating = '需要加强';
    overallRatingEn = 'Needs Work';
  } else if (overallAccuracy < 70) {
    overallRating = '继续练习';
    overallRatingEn = 'Keep Practicing';
  } else if (overallAccuracy < 80) {
    overallRating = '进步中';
    overallRatingEn = 'Improving';
  } else if (overallAccuracy < 90) {
    overallRating = '优秀';
    overallRatingEn = 'Excellent';
  }

  // Generate recommendations
  const recommendations: WeaknessReport['recommendations'] = [];

  // Priority 1: Critical weaknesses
  critical.slice(0, 2).forEach((w, i) => {
    recommendations.push({
      priority: i + 1,
      category: w.category,
      targetArea: w.name,
      targetAreaZh: w.nameZh,
      description: `Your accuracy in ${w.name} situations is only ${w.accuracy.toFixed(0)}%, significantly below optimal.`,
      descriptionZh: `您在${w.nameZh}场景的准确率仅为${w.accuracy.toFixed(0)}%，明显低于理想水平。`,
      suggestedPractice: `Focus on ${w.name} scenarios in Practice Mode for the next week.`,
      suggestedPracticeZh: `建议在接下来一周专注练习${w.nameZh}相关场景。`,
      practiceUrl: `/practice?focus=${encodeURIComponent(w.name.toLowerCase())}`,
    });
  });

  // Priority 2-3: Major weaknesses
  major.slice(0, 2).forEach((w, i) => {
    recommendations.push({
      priority: recommendations.length + 1,
      category: w.category,
      targetArea: w.name,
      targetAreaZh: w.nameZh,
      description: `Room for improvement in ${w.name} with ${w.accuracy.toFixed(0)}% accuracy.`,
      descriptionZh: `${w.nameZh}的准确率为${w.accuracy.toFixed(0)}%，有提升空间。`,
      suggestedPractice: `Review GTO strategies for ${w.name} and practice weekly.`,
      suggestedPracticeZh: `复习${w.nameZh}的GTO策略，每周进行专项练习。`,
      practiceUrl: `/practice?focus=${encodeURIComponent(w.name.toLowerCase())}`,
    });
  });

  // Generate recent trend (last 7 days)
  const recentTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      accuracy: 60 + Math.random() * 25 + i * 2, // Slight upward trend
      evLossBB: 2 - i * 0.15 + Math.random() * 0.5, // Slight downward trend
    };
  });

  return {
    success: true,
    userId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalDecisions: Math.round(totalDecisions),
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
      totalEvLossBB: Math.round(totalEvLossBB * 100) / 100,
      avgEvLossPerDecision: Math.round(avgEvLossPerDecision * 1000) / 1000,
      overallRating,
      overallRatingEn,
      improvementFromLastWeek: Math.round((Math.random() * 10 - 3) * 10) / 10, // -3% to +7%
    },
    weaknesses: {
      critical,
      major,
      minor,
    },
    strengths,
    recommendations,
    byPosition,
    byStreet,
    byScenario,
    byHandType,
    recentTrend,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params (or auth in production)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const report = analyzePracticeData(userId);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Weakness analysis error:', error);
    return NextResponse.json(
      { success: false, error: '生成报告失败' },
      { status: 500 }
    );
  }
}
