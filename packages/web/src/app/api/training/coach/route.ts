import { NextRequest, NextResponse } from 'next/server';

// AI Coach feedback types
type ErrorSeverity = 'perfect' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
type FeedbackType = 'praise' | 'explanation' | 'correction' | 'tip' | 'common_mistake' | 'advanced';

interface CoachFeedback {
  severity: ErrorSeverity;
  severityLabel: { en: string; zh: string };
  severityColor: string;
  evLossBB: number;
  headline: string;
  headlineZh: string;
  explanation: string;
  explanationZh: string;
  gtoReasoning: string;
  gtoReasoningZh: string;
  tips: { en: string; zh: string }[];
  commonMistake?: { en: string; zh: string };
  advancedNote?: { en: string; zh: string };
  feedbackType: FeedbackType;
}

interface CoachRequest {
  handString: string;
  heroPosition: string;
  villainPosition?: string;
  scenario: 'rfi' | 'vs_rfi' | 'vs_3bet';
  street: 'preflop' | 'flop' | 'turn' | 'river';
  playerAction: string;
  gtoStrategy: { action: string; frequency: number }[];
  board?: string[];
  potSize?: number;
  isCorrect: boolean;
  accuracyScore: number;
}

// Severity thresholds based on EV loss
function getErrorSeverity(accuracyScore: number): ErrorSeverity {
  if (accuracyScore >= 100) return 'perfect';
  if (accuracyScore >= 80) return 'best';
  if (accuracyScore >= 50) return 'good';
  if (accuracyScore >= 20) return 'inaccuracy';
  if (accuracyScore >= 1) return 'mistake';
  return 'blunder';
}

function getSeverityLabel(severity: ErrorSeverity): { en: string; zh: string } {
  const labels: Record<ErrorSeverity, { en: string; zh: string }> = {
    perfect: { en: 'Perfect!', zh: '完美!' },
    best: { en: 'Best Play', zh: '最佳选择' },
    good: { en: 'Good', zh: '不错' },
    inaccuracy: { en: 'Inaccuracy', zh: '不够精准' },
    mistake: { en: 'Mistake', zh: '失误' },
    blunder: { en: 'Blunder', zh: '严重错误' },
  };
  return labels[severity];
}

function getSeverityColor(severity: ErrorSeverity): string {
  const colors: Record<ErrorSeverity, string> = {
    perfect: '#22c55e',    // Green
    best: '#4ade80',       // Light green
    good: '#a3e635',       // Lime
    inaccuracy: '#fbbf24', // Yellow
    mistake: '#f97316',    // Orange
    blunder: '#ef4444',    // Red
  };
  return colors[severity];
}

// Calculate EV loss in BB based on accuracy
function calculateEVLoss(accuracyScore: number): number {
  if (accuracyScore >= 100) return 0;
  if (accuracyScore >= 80) return 0.1;
  if (accuracyScore >= 50) return 0.5;
  if (accuracyScore >= 20) return 1.5;
  if (accuracyScore >= 1) return 3.0;
  return 5.0;
}

// Position Chinese names
const POSITION_NAMES: Record<string, string> = {
  'UTG': '枪口位',
  'UTG1': '枪口位+1',
  'UTG2': '枪口位+2',
  'LJ': '劫位',
  'HJ': '关煞位',
  'CO': '切位',
  'BTN': '按钮位',
  'SB': '小盲位',
  'BB': '大盲位',
};

// Action Chinese names
const ACTION_NAMES: Record<string, string> = {
  'fold': '弃牌',
  'call': '跟注',
  'check': '过牌',
  'raise': '加注',
  'allin': '全押',
  'all-in': '全押',
};

// Hand type helpers
function getHandType(handString: string): 'premium' | 'strong' | 'medium' | 'speculative' | 'weak' {
  const premiumHands = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
  const strongHands = ['JJ', 'TT', 'AQs', 'AQo', 'AJs', 'KQs'];
  const mediumHands = ['99', '88', 'ATs', 'AJo', 'KJs', 'QJs', 'JTs', 'KQo'];

  if (premiumHands.includes(handString)) return 'premium';
  if (strongHands.includes(handString)) return 'strong';
  if (mediumHands.includes(handString)) return 'medium';
  if (handString.endsWith('s') || handString.length === 2) return 'speculative';
  return 'weak';
}

function isPair(handString: string): boolean {
  return handString.length === 2 || (handString.length === 3 && handString[0] === handString[1]);
}

function isSuited(handString: string): boolean {
  return handString.endsWith('s');
}

function isConnector(handString: string): boolean {
  const ranks = 'AKQJT98765432';
  const r1 = handString[0];
  const r2 = handString[1];
  const diff = Math.abs(ranks.indexOf(r1) - ranks.indexOf(r2));
  return diff === 1;
}

// Generate AI coaching feedback
function generateCoachFeedback(request: CoachRequest): CoachFeedback {
  const severity = getErrorSeverity(request.accuracyScore);
  const severityLabel = getSeverityLabel(severity);
  const severityColor = getSeverityColor(severity);
  const evLossBB = calculateEVLoss(request.accuracyScore);

  const positionZh = POSITION_NAMES[request.heroPosition] || request.heroPosition;
  const villainPosZh = request.villainPosition ? (POSITION_NAMES[request.villainPosition] || request.villainPosition) : '';
  const playerActionZh = ACTION_NAMES[request.playerAction.toLowerCase()] || request.playerAction;

  const handType = getHandType(request.handString);
  const isPairHand = isPair(request.handString);
  const isSuitedHand = isSuited(request.handString);
  const isConnectorHand = isConnector(request.handString);

  // Find the best GTO action
  const bestAction = request.gtoStrategy.reduce((a, b) => a.frequency > b.frequency ? a : b);
  const bestActionZh = ACTION_NAMES[bestAction.action.toLowerCase()] || bestAction.action;

  // Check if it's a mixed strategy
  const isMixedStrategy = request.gtoStrategy.filter(a => a.frequency >= 10).length > 1;

  let headline = '';
  let headlineZh = '';
  let explanation = '';
  let explanationZh = '';
  let gtoReasoning = '';
  let gtoReasoningZh = '';
  let feedbackType: FeedbackType = 'explanation';
  const tips: { en: string; zh: string }[] = [];
  let commonMistake: { en: string; zh: string } | undefined;
  let advancedNote: { en: string; zh: string } | undefined;

  // Generate feedback based on severity and context
  if (severity === 'perfect' || severity === 'best') {
    feedbackType = 'praise';

    if (isMixedStrategy) {
      headline = `Great read on this mixed frequency spot!`;
      headlineZh = `对混合频率点的准确把握！`;
      explanation = `${request.handString} is a hand that GTO plays with mixed frequencies. You correctly chose ${request.playerAction} which has ${bestAction.frequency}% frequency.`;
      explanationZh = `${request.handString} 是一手需要混合频率打法的牌。你选择${playerActionZh}是正确的，GTO频率为${bestAction.frequency}%。`;
    } else if (request.scenario === 'rfi') {
      headline = `Perfect open from ${request.heroPosition}!`;
      headlineZh = `${positionZh}完美的开池决策！`;
      explanation = `You correctly identified that ${request.handString} should ${request.playerAction} from ${request.heroPosition}.`;
      explanationZh = `你正确判断出${request.handString}应该在${positionZh}${playerActionZh}。`;
    } else if (request.scenario === 'vs_rfi') {
      headline = `Excellent defense!`;
      headlineZh = `出色的防守策略！`;
      explanation = `Your ${request.playerAction} against ${request.villainPosition}'s open is spot on.`;
      explanationZh = `面对${villainPosZh}的加注，你的${playerActionZh}决策非常准确。`;
    } else {
      headline = `Strong play facing 3-bet!`;
      headlineZh = `面对3-Bet的精准应对！`;
      explanation = `${request.handString} is correctly played as a ${request.playerAction} vs the 3-bet from ${request.villainPosition}.`;
      explanationZh = `面对${villainPosZh}的3-Bet，${request.handString}应该${playerActionZh}，你的判断正确。`;
    }

    if (handType === 'premium') {
      tips.push({
        en: 'Premium hands like this print money - keep maximizing value!',
        zh: '优质手牌要充分榨取价值！'
      });
    }

  } else if (severity === 'good') {
    feedbackType = 'explanation';
    headline = `Acceptable, but there's a better line`;
    headlineZh = `尚可，但有更优选择`;

    if (isMixedStrategy) {
      explanation = `This is a mixed strategy spot. Your ${request.playerAction} has some frequency (${request.gtoStrategy.find(a => a.action.toLowerCase() === request.playerAction.toLowerCase())?.frequency || 0}%), but ${bestAction.action} is preferred at ${bestAction.frequency}%.`;
      explanationZh = `这是一个混合策略场景。你的${playerActionZh}有一定频率(${request.gtoStrategy.find(a => a.action.toLowerCase() === request.playerAction.toLowerCase())?.frequency || 0}%)，但${bestActionZh}更优，频率为${bestAction.frequency}%。`;
    } else {
      explanation = `${request.handString} prefers ${bestAction.action} in this spot. Your ${request.playerAction} isn't terrible but leaves value on the table.`;
      explanationZh = `${request.handString}在这个位置更倾向于${bestActionZh}。你的${playerActionZh}不算糟糕，但损失了一些价值。`;
    }

    gtoReasoning = `The GTO strategy for ${request.handString} from ${request.heroPosition} is ${bestAction.action} ${bestAction.frequency}% of the time.`;
    gtoReasoningZh = `${request.handString}在${positionZh}的GTO策略是${bestAction.frequency}%${bestActionZh}。`;

  } else if (severity === 'inaccuracy') {
    feedbackType = 'correction';
    headline = `Room for improvement`;
    headlineZh = `需要改进`;

    explanation = `${request.playerAction} with ${request.handString} is an inaccuracy here. The optimal play is ${bestAction.action}.`;
    explanationZh = `用${request.handString}${playerActionZh}不够精准。最优打法是${bestActionZh}。`;

    // Position-specific reasoning
    if (request.scenario === 'rfi') {
      gtoReasoning = `From ${request.heroPosition}, your range should be tighter. ${request.handString} is ${bestAction.action === 'fold' ? 'too weak to open' : 'strong enough to raise'}.`;
      gtoReasoningZh = `在${positionZh}，开池范围应该更紧。${request.handString}${bestAction.action === 'fold' ? '不够强，应该弃牌' : '足够强，应该加注'}。`;
    } else if (request.scenario === 'vs_3bet') {
      gtoReasoning = `Facing a 3-bet, ${request.handString} should ${bestAction.action}. ${isPairHand ? 'Small-medium pairs often need to fold vs 3-bets.' : isSuitedHand ? 'Suited hands have good equity but may not call profitably here.' : 'Offsuit hands struggle against 3-bet ranges.'}`;
      gtoReasoningZh = `面对3-Bet，${request.handString}应该${bestActionZh}。${isPairHand ? '中小对子面对3-Bet经常需要弃牌。' : isSuitedHand ? '同花牌有一定底池权益但这里跟注可能不划算。' : '非同花牌面对3-Bet范围较难打。'}`;
    }

    tips.push({
      en: `Focus on your ${request.heroPosition} ranges - review the GTO charts`,
      zh: `重点复习${positionZh}的范围表`
    });

  } else if (severity === 'mistake') {
    feedbackType = 'correction';
    headline = `Significant error`;
    headlineZh = `明显失误`;

    explanation = `${request.playerAction} with ${request.handString} loses significant EV. You should ${bestAction.action} here.`;
    explanationZh = `用${request.handString}${playerActionZh}损失了较多EV。这里应该${bestActionZh}。`;

    gtoReasoning = `This spot is clear-cut: ${request.handString} from ${request.heroPosition} should always ${bestAction.action} (${bestAction.frequency}%).`;
    gtoReasoningZh = `这个场景很明确：${request.handString}在${positionZh}应该${bestActionZh}（频率${bestAction.frequency}%）。`;

    // Common mistake patterns
    if (request.playerAction.toLowerCase() === 'call' && bestAction.action.toLowerCase() === 'raise') {
      commonMistake = {
        en: 'Calling when you should raise is a common leak. Strong hands need to build pots!',
        zh: '该加注时跟注是常见漏洞。强牌需要构建底池！'
      };
    } else if (request.playerAction.toLowerCase() === 'call' && bestAction.action.toLowerCase() === 'fold') {
      commonMistake = {
        en: 'Calling too wide is a major leak. Discipline with marginal hands saves BB.',
        zh: '跟注范围过宽是重大漏洞。对边缘牌有纪律能节省BB。'
      };
    } else if (request.playerAction.toLowerCase() === 'fold' && bestAction.action.toLowerCase() === 'raise') {
      commonMistake = {
        en: 'Folding value hands is leaving money on the table. Trust your hand strength!',
        zh: '弃掉价值牌是把钱留在桌上。相信你的牌力！'
      };
    }

    tips.push({
      en: `Review ${request.handString} in the range viewer for ${request.heroPosition}`,
      zh: `在范围查看器中复习${positionZh}的${request.handString}打法`
    });

  } else { // blunder
    feedbackType = 'common_mistake';
    headline = `Major error - study this spot`;
    headlineZh = `严重错误 - 需要重点学习`;

    explanation = `${request.playerAction} with ${request.handString} is a significant blunder. The correct play is ${bestAction.action} at ${bestAction.frequency}% frequency.`;
    explanationZh = `用${request.handString}${playerActionZh}是严重错误。正确打法是${bestActionZh}，频率${bestAction.frequency}%。`;

    gtoReasoning = `This is a fundamental spot. ${request.handString} ${bestAction.action === 'fold' ? 'is too weak for this action' : bestAction.action === 'raise' ? 'is strong enough to always raise' : 'should be defended'}.`;
    gtoReasoningZh = `这是一个基本场景。${request.handString}${bestAction.action === 'fold' ? '太弱，不适合这个动作' : bestAction.action === 'raise' ? '足够强，应该总是加注' : '应该防守'}。`;

    commonMistake = {
      en: `This error pattern suggests gaps in ${request.scenario === 'rfi' ? 'opening ranges' : request.scenario === 'vs_rfi' ? 'defending strategy' : '3-bet defense'}. Consider dedicated study.`,
      zh: `这个错误模式表明在${request.scenario === 'rfi' ? '开池范围' : request.scenario === 'vs_rfi' ? '防守策略' : '面对3-Bet策略'}方面需要加强学习。`
    };

    tips.push({
      en: `Bookmark this hand and practice ${request.heroPosition} spots specifically`,
      zh: `收藏这手牌，专门练习${positionZh}的场景`
    });
    tips.push({
      en: 'Consider studying the fundamentals of preflop ranges',
      zh: '建议系统学习翻前范围基础知识'
    });
  }

  // Add advanced notes for certain situations
  if (isMixedStrategy && (severity === 'inaccuracy' || severity === 'good')) {
    advancedNote = {
      en: `This is a mixed strategy spot. In practice, you can simplify by ${bestAction.frequency > 70 ? `always choosing ${bestAction.action}` : 'using a randomizer or simplifying to pure strategy based on reads'}.`,
      zh: `这是混合策略场景。实战中可以简化：${bestAction.frequency > 70 ? `总是选择${bestActionZh}` : '使用随机器或根据对手读牌简化为纯策略'}。`
    };
  }

  if (isConnectorHand && isSuitedHand && (severity === 'mistake' || severity === 'blunder')) {
    advancedNote = {
      en: 'Suited connectors are position-dependent. They play well in late position but are often folds from early position.',
      zh: '同花连张是位置敏感型手牌。在后位表现良好，但在前位经常应该弃牌。'
    };
  }

  return {
    severity,
    severityLabel,
    severityColor,
    evLossBB,
    headline,
    headlineZh,
    explanation,
    explanationZh,
    gtoReasoning,
    gtoReasoningZh,
    tips,
    commonMistake,
    advancedNote,
    feedbackType,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CoachRequest;

    // Validate required fields
    if (!body.handString || !body.heroPosition || !body.playerAction || !body.gtoStrategy) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const feedback = generateCoachFeedback(body);

    return NextResponse.json({
      success: true,
      feedback,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Coach feedback error:', error);
    return NextResponse.json(
      { success: false, error: '生成AI点评失败' },
      { status: 500 }
    );
  }
}
