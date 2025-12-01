import { NextRequest, NextResponse } from 'next/server';

// Types for postflop scenarios
type BoardTexture = 'dry' | 'wet' | 'monotone' | 'paired' | 'connected' | 'high' | 'low' | 'ace_high';
type HandStrength = 'nuts' | 'strong' | 'medium' | 'marginal' | 'weak' | 'draw' | 'air';
type ScenarioType = 'cbet_ip' | 'cbet_oop' | 'facing_cbet' | 'check_raise' | 'donk_bet' | 'probe_bet' | 'turn_barrel' | 'river_value';
type Street = 'flop' | 'turn' | 'river';
type SPRCategory = 'micro' | 'small' | 'medium' | 'large' | 'deep';

interface PostflopAction {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  frequency: number;
  size?: number;
  ev: number;
}

interface PostflopScenario {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  scenarioType: ScenarioType;
  street: Street;
  boardTexture: BoardTexture;
  hasPosition: boolean;
  sprCategory: SPRCategory;
  strategies: Record<HandStrength, PostflopAction[]>;
  tips: { en: string; zh: string }[];
}

// Scenario type labels
const SCENARIO_TYPE_LABELS: Record<ScenarioType, { en: string; zh: string }> = {
  cbet_ip: { en: 'C-Bet (In Position)', zh: 'C-Bet（有位置）' },
  cbet_oop: { en: 'C-Bet (Out of Position)', zh: 'C-Bet（无位置）' },
  facing_cbet: { en: 'Facing C-Bet', zh: '面对C-Bet' },
  check_raise: { en: 'Check-Raise', zh: '过牌加注' },
  donk_bet: { en: 'Donk Bet', zh: '抢先下注' },
  probe_bet: { en: 'Probe Bet', zh: '探测下注' },
  turn_barrel: { en: 'Turn Barrel', zh: '转牌连续下注' },
  river_value: { en: 'River Value Bet', zh: '河牌价值下注' },
};

// Board texture labels
const BOARD_TEXTURE_LABELS: Record<BoardTexture, { en: string; zh: string }> = {
  dry: { en: 'Dry', zh: '干燥面' },
  wet: { en: 'Wet', zh: '湿润面' },
  monotone: { en: 'Monotone', zh: '单花面' },
  paired: { en: 'Paired', zh: '对子面' },
  connected: { en: 'Connected', zh: '连接面' },
  high: { en: 'High Card', zh: '高牌面' },
  low: { en: 'Low Card', zh: '低牌面' },
  ace_high: { en: 'Ace High', zh: 'A高面' },
};

// SPR labels
const SPR_LABELS: Record<SPRCategory, { en: string; zh: string; range: string }> = {
  micro: { en: 'Micro', zh: '极小', range: '< 2' },
  small: { en: 'Small', zh: '小', range: '2-4' },
  medium: { en: 'Medium', zh: '中等', range: '4-8' },
  large: { en: 'Large', zh: '大', range: '8-13' },
  deep: { en: 'Deep', zh: '深', range: '> 13' },
};

// Generate postflop scenarios database
function generateScenarios(): PostflopScenario[] {
  const scenarios: PostflopScenario[] = [];
  let id = 1;

  // C-Bet IP scenarios
  const boardTextures: BoardTexture[] = ['dry', 'wet', 'monotone', 'paired', 'connected', 'ace_high'];

  for (const texture of boardTextures) {
    scenarios.push({
      id: `cbet_ip_${texture}_${id++}`,
      name: `C-Bet IP on ${texture} board`,
      nameZh: `${BOARD_TEXTURE_LABELS[texture].zh}有位置C-Bet`,
      description: `Continuation betting strategy when in position on a ${texture} flop texture.`,
      descriptionZh: `在${BOARD_TEXTURE_LABELS[texture].zh}翻牌面有位置时的持续下注策略。`,
      scenarioType: 'cbet_ip',
      street: 'flop',
      boardTexture: texture,
      hasPosition: true,
      sprCategory: 'large',
      strategies: generateCBetIPStrategy(texture),
      tips: getCBetTips(texture, true),
    });
  }

  // C-Bet OOP scenarios
  for (const texture of boardTextures) {
    scenarios.push({
      id: `cbet_oop_${texture}_${id++}`,
      name: `C-Bet OOP on ${texture} board`,
      nameZh: `${BOARD_TEXTURE_LABELS[texture].zh}无位置C-Bet`,
      description: `Continuation betting strategy when out of position on a ${texture} flop texture.`,
      descriptionZh: `在${BOARD_TEXTURE_LABELS[texture].zh}翻牌面无位置时的持续下注策略。`,
      scenarioType: 'cbet_oop',
      street: 'flop',
      boardTexture: texture,
      hasPosition: false,
      sprCategory: 'large',
      strategies: generateCBetOOPStrategy(texture),
      tips: getCBetTips(texture, false),
    });
  }

  // Facing C-Bet scenarios
  for (const texture of boardTextures) {
    scenarios.push({
      id: `facing_cbet_${texture}_${id++}`,
      name: `Facing C-Bet on ${texture} board`,
      nameZh: `${BOARD_TEXTURE_LABELS[texture].zh}面对C-Bet`,
      description: `Defense strategy when facing a continuation bet on a ${texture} flop.`,
      descriptionZh: `在${BOARD_TEXTURE_LABELS[texture].zh}翻牌面面对持续下注的防守策略。`,
      scenarioType: 'facing_cbet',
      street: 'flop',
      boardTexture: texture,
      hasPosition: true,
      sprCategory: 'large',
      strategies: generateFacingCBetStrategy(texture),
      tips: getFacingCBetTips(texture),
    });
  }

  // Check-Raise scenarios
  for (const texture of ['dry', 'wet', 'monotone'] as BoardTexture[]) {
    scenarios.push({
      id: `check_raise_${texture}_${id++}`,
      name: `Check-Raise on ${texture} board`,
      nameZh: `${BOARD_TEXTURE_LABELS[texture].zh}过牌加注`,
      description: `Check-raise strategy on ${texture} flop textures.`,
      descriptionZh: `在${BOARD_TEXTURE_LABELS[texture].zh}翻牌面的过牌加注策略。`,
      scenarioType: 'check_raise',
      street: 'flop',
      boardTexture: texture,
      hasPosition: false,
      sprCategory: 'large',
      strategies: generateCheckRaiseStrategy(texture),
      tips: getCheckRaiseTips(texture),
    });
  }

  // Turn Barrel scenario
  scenarios.push({
    id: `turn_barrel_${id++}`,
    name: 'Turn Barrel Strategy',
    nameZh: '转牌连续下注策略',
    description: 'When and how to continue betting on the turn after a flop C-bet.',
    descriptionZh: '翻牌C-bet后转牌继续下注的时机和方法。',
    scenarioType: 'turn_barrel',
    street: 'turn',
    boardTexture: 'dry',
    hasPosition: true,
    sprCategory: 'medium',
    strategies: generateTurnBarrelStrategy(),
    tips: [
      { en: 'Barrel more on cards that improve your range', zh: '在有利于你范围的转牌继续下注' },
      { en: 'Check back marginal made hands for pot control', zh: '边缘成手牌过牌控池' },
      { en: 'Continue with draws that picked up equity', zh: '听牌增加权益时继续下注' },
    ],
  });

  // River Value scenario
  scenarios.push({
    id: `river_value_${id++}`,
    name: 'River Value Betting',
    nameZh: '河牌价值下注',
    description: 'Extracting value on the river with strong hands.',
    descriptionZh: '河牌用强牌榨取价值的策略。',
    scenarioType: 'river_value',
    street: 'river',
    boardTexture: 'dry',
    hasPosition: true,
    sprCategory: 'small',
    strategies: generateRiverValueStrategy(),
    tips: [
      { en: 'Size based on opponent calling range', zh: '根据对手跟注范围选择下注尺度' },
      { en: 'Thin value bet when you beat their calling range', zh: '当你能打败对手跟注范围时薄价值下注' },
      { en: "Don't value bet if you only get called by better", zh: '如果只会被更好的牌跟注就不要价值下注' },
    ],
  });

  // Probe Bet scenario
  scenarios.push({
    id: `probe_bet_${id++}`,
    name: 'Probe Bet Strategy',
    nameZh: '探测下注策略',
    description: 'Betting into the preflop aggressor when they check back flop.',
    descriptionZh: '当翻前激进者过牌后在转牌下注的策略。',
    scenarioType: 'probe_bet',
    street: 'turn',
    boardTexture: 'dry',
    hasPosition: false,
    sprCategory: 'medium',
    strategies: generateProbeBetStrategy(),
    tips: [
      { en: 'Probe with made hands for value', zh: '用成手牌探测获取价值' },
      { en: 'Probe with equity denial hands', zh: '用需要否定权益的牌探测' },
      { en: 'Check strong hands sometimes for deception', zh: '有时过牌强牌制造迷惑' },
    ],
  });

  // Donk Bet scenario
  scenarios.push({
    id: `donk_bet_${id++}`,
    name: 'Donk Bet Strategy',
    nameZh: '抢先下注策略',
    description: 'Leading into the preflop aggressor on the flop.',
    descriptionZh: '翻牌抢先对翻前激进者下注的策略。',
    scenarioType: 'donk_bet',
    street: 'flop',
    boardTexture: 'low',
    hasPosition: false,
    sprCategory: 'large',
    strategies: generateDonkBetStrategy(),
    tips: [
      { en: 'Donk on boards that favor your range', zh: '在有利于你范围的牌面抢先下注' },
      { en: 'Use small sizing on low boards from BB', zh: '大盲位在低牌面用小尺度' },
      { en: 'Mix donks with checks to stay balanced', zh: '混合抢先下注和过牌保持平衡' },
    ],
  });

  return scenarios;
}

// Strategy generation functions
function generateCBetIPStrategy(texture: BoardTexture): Record<HandStrength, PostflopAction[]> {
  const sizings = {
    dry: 33,
    wet: 75,
    monotone: 50,
    paired: 33,
    connected: 66,
    high: 50,
    low: 33,
    ace_high: 33,
  };

  const size = sizings[texture] || 50;
  const highFreq = texture === 'dry' ? 85 : texture === 'wet' ? 65 : 70;

  return {
    nuts: [
      { action: 'bet', frequency: highFreq + 10, size, ev: 2.5 },
      { action: 'check', frequency: 100 - highFreq - 10, ev: 1.8 },
    ],
    strong: [
      { action: 'bet', frequency: highFreq + 5, size, ev: 1.8 },
      { action: 'check', frequency: 100 - highFreq - 5, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: highFreq - 10, size, ev: 0.8 },
      { action: 'check', frequency: 100 - highFreq + 10, ev: 0.5 },
    ],
    marginal: [
      { action: 'bet', frequency: Math.max(40, highFreq - 30), size, ev: 0.3 },
      { action: 'check', frequency: Math.min(60, 100 - highFreq + 30), ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 70, ev: 0.1 },
      { action: 'bet', frequency: 30, size, ev: 0.0 },
    ],
    draw: [
      { action: 'bet', frequency: highFreq - 20, size, ev: 0.4 },
      { action: 'check', frequency: 100 - highFreq + 20, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 65, ev: -0.1 },
      { action: 'bet', frequency: 35, size, ev: -0.2 },
    ],
  };
}

function generateCBetOOPStrategy(texture: BoardTexture): Record<HandStrength, PostflopAction[]> {
  const sizings = {
    dry: 25,
    wet: 50,
    monotone: 33,
    paired: 25,
    connected: 50,
    high: 33,
    low: 25,
    ace_high: 25,
  };

  const size = sizings[texture] || 33;
  const highFreq = texture === 'dry' ? 75 : texture === 'wet' ? 50 : 60;

  return {
    nuts: [
      { action: 'bet', frequency: highFreq + 15, size, ev: 2.2 },
      { action: 'check', frequency: 100 - highFreq - 15, ev: 2.0 },
    ],
    strong: [
      { action: 'bet', frequency: highFreq + 10, size, ev: 1.5 },
      { action: 'check', frequency: 100 - highFreq - 10, ev: 1.2 },
    ],
    medium: [
      { action: 'bet', frequency: highFreq - 5, size, ev: 0.6 },
      { action: 'check', frequency: 100 - highFreq + 5, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'bet', frequency: 20, size, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: highFreq - 10, size, ev: 0.3 },
      { action: 'check', frequency: 100 - highFreq + 10, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 75, ev: -0.2 },
      { action: 'bet', frequency: 25, size, ev: -0.3 },
    ],
  };
}

function generateFacingCBetStrategy(texture: BoardTexture): Record<HandStrength, PostflopAction[]> {
  return {
    nuts: [
      { action: 'raise', frequency: 60, size: 300, ev: 3.0 },
      { action: 'call', frequency: 40, ev: 2.5 },
    ],
    strong: [
      { action: 'call', frequency: 70, ev: 1.5 },
      { action: 'raise', frequency: 30, size: 250, ev: 1.8 },
    ],
    medium: [
      { action: 'call', frequency: 85, ev: 0.6 },
      { action: 'fold', frequency: 10, ev: 0.0 },
      { action: 'raise', frequency: 5, size: 250, ev: 0.4 },
    ],
    marginal: [
      { action: 'call', frequency: 55, ev: 0.2 },
      { action: 'fold', frequency: 45, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 80, ev: 0.0 },
      { action: 'call', frequency: 20, ev: -0.2 },
    ],
    draw: [
      { action: 'call', frequency: 70, ev: 0.3 },
      { action: 'raise', frequency: 20, size: 250, ev: 0.5 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 85, ev: 0.0 },
      { action: 'raise', frequency: 10, size: 300, ev: -0.1 },
      { action: 'call', frequency: 5, ev: -0.3 },
    ],
  };
}

function generateCheckRaiseStrategy(texture: BoardTexture): Record<HandStrength, PostflopAction[]> {
  const raiseFreq = texture === 'wet' ? 40 : texture === 'dry' ? 25 : 30;

  return {
    nuts: [
      { action: 'raise', frequency: raiseFreq + 30, size: 300, ev: 3.5 },
      { action: 'call', frequency: 100 - raiseFreq - 30, ev: 2.8 },
    ],
    strong: [
      { action: 'call', frequency: 60, ev: 1.8 },
      { action: 'raise', frequency: 40, size: 250, ev: 2.0 },
    ],
    medium: [
      { action: 'call', frequency: 85, ev: 0.6 },
      { action: 'raise', frequency: 5, size: 250, ev: 0.3 },
      { action: 'fold', frequency: 10, ev: 0.0 },
    ],
    marginal: [
      { action: 'call', frequency: 65, ev: 0.2 },
      { action: 'fold', frequency: 35, ev: 0.0 },
    ],
    weak: [
      { action: 'fold', frequency: 75, ev: 0.0 },
      { action: 'call', frequency: 25, ev: -0.1 },
    ],
    draw: [
      { action: 'raise', frequency: raiseFreq + 10, size: 300, ev: 0.6 },
      { action: 'call', frequency: 60 - raiseFreq / 2, ev: 0.4 },
      { action: 'fold', frequency: 30 - raiseFreq / 2, ev: 0.0 },
    ],
    air: [
      { action: 'fold', frequency: 70, ev: 0.0 },
      { action: 'raise', frequency: 20, size: 300, ev: -0.2 },
      { action: 'call', frequency: 10, ev: -0.4 },
    ],
  };
}

function generateTurnBarrelStrategy(): Record<HandStrength, PostflopAction[]> {
  return {
    nuts: [
      { action: 'bet', frequency: 90, size: 75, ev: 4.0 },
      { action: 'check', frequency: 10, ev: 3.5 },
    ],
    strong: [
      { action: 'bet', frequency: 80, size: 66, ev: 2.5 },
      { action: 'check', frequency: 20, ev: 1.8 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 50, ev: 0.8 },
      { action: 'check', frequency: 45, ev: 0.6 },
    ],
    marginal: [
      { action: 'check', frequency: 70, ev: 0.3 },
      { action: 'bet', frequency: 30, size: 33, ev: 0.2 },
    ],
    weak: [
      { action: 'check', frequency: 85, ev: 0.0 },
      { action: 'bet', frequency: 15, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 65, size: 75, ev: 0.5 },
      { action: 'check', frequency: 35, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 60, ev: -0.2 },
      { action: 'bet', frequency: 40, size: 66, ev: -0.3 },
    ],
  };
}

function generateRiverValueStrategy(): Record<HandStrength, PostflopAction[]> {
  return {
    nuts: [
      { action: 'bet', frequency: 95, size: 100, ev: 5.0 },
      { action: 'check', frequency: 5, ev: 3.0 },
    ],
    strong: [
      { action: 'bet', frequency: 85, size: 75, ev: 3.0 },
      { action: 'check', frequency: 15, ev: 2.0 },
    ],
    medium: [
      { action: 'bet', frequency: 50, size: 50, ev: 0.8 },
      { action: 'check', frequency: 50, ev: 0.6 },
    ],
    marginal: [
      { action: 'check', frequency: 80, ev: 0.3 },
      { action: 'bet', frequency: 20, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 95, ev: 0.0 },
      { action: 'bet', frequency: 5, size: 33, ev: -0.2 },
    ],
    draw: [
      { action: 'check', frequency: 70, ev: -0.1 },
      { action: 'bet', frequency: 30, size: 75, ev: -0.2 },
    ],
    air: [
      { action: 'check', frequency: 55, ev: -0.2 },
      { action: 'bet', frequency: 45, size: 100, ev: -0.3 },
    ],
  };
}

function generateProbeBetStrategy(): Record<HandStrength, PostflopAction[]> {
  return {
    nuts: [
      { action: 'bet', frequency: 75, size: 66, ev: 3.5 },
      { action: 'check', frequency: 25, ev: 3.0 },
    ],
    strong: [
      { action: 'bet', frequency: 70, size: 50, ev: 2.0 },
      { action: 'check', frequency: 30, ev: 1.5 },
    ],
    medium: [
      { action: 'bet', frequency: 55, size: 33, ev: 0.7 },
      { action: 'check', frequency: 45, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 60, ev: 0.2 },
      { action: 'bet', frequency: 40, size: 33, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 75, ev: 0.0 },
      { action: 'bet', frequency: 25, size: 33, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 60, size: 50, ev: 0.4 },
      { action: 'check', frequency: 40, ev: 0.3 },
    ],
    air: [
      { action: 'check', frequency: 70, ev: -0.1 },
      { action: 'bet', frequency: 30, size: 50, ev: -0.2 },
    ],
  };
}

function generateDonkBetStrategy(): Record<HandStrength, PostflopAction[]> {
  return {
    nuts: [
      { action: 'bet', frequency: 40, size: 33, ev: 2.5 },
      { action: 'check', frequency: 60, ev: 2.8 },
    ],
    strong: [
      { action: 'bet', frequency: 45, size: 33, ev: 1.5 },
      { action: 'check', frequency: 55, ev: 1.4 },
    ],
    medium: [
      { action: 'bet', frequency: 50, size: 25, ev: 0.6 },
      { action: 'check', frequency: 50, ev: 0.5 },
    ],
    marginal: [
      { action: 'check', frequency: 65, ev: 0.2 },
      { action: 'bet', frequency: 35, size: 25, ev: 0.1 },
    ],
    weak: [
      { action: 'check', frequency: 80, ev: 0.0 },
      { action: 'bet', frequency: 20, size: 25, ev: -0.1 },
    ],
    draw: [
      { action: 'bet', frequency: 45, size: 33, ev: 0.3 },
      { action: 'check', frequency: 55, ev: 0.4 },
    ],
    air: [
      { action: 'check', frequency: 75, ev: -0.1 },
      { action: 'bet', frequency: 25, size: 25, ev: -0.2 },
    ],
  };
}

// Tips generators
function getCBetTips(texture: BoardTexture, hasPosition: boolean): { en: string; zh: string }[] {
  const tips: { en: string; zh: string }[] = [];

  if (texture === 'dry') {
    tips.push({ en: 'Use smaller sizing (25-33%) on dry boards', zh: '在干燥面用小尺度(25-33%)' });
    tips.push({ en: 'C-bet range can be wide as equity distribution is even', zh: 'C-bet范围可以宽因为权益分布均匀' });
  } else if (texture === 'wet') {
    tips.push({ en: 'Use larger sizing (66-75%) on wet boards', zh: '在湿润面用大尺度(66-75%)' });
    tips.push({ en: 'Be more selective with your c-betting range', zh: 'C-bet范围要更有选择性' });
  } else if (texture === 'monotone') {
    tips.push({ en: 'Check more often without a flush blocker', zh: '没有同花阻隔牌时多过牌' });
    tips.push({ en: 'Barrel aggressively with the nut flush draw', zh: '有坚果同花听牌时激进连续下注' });
  }

  if (hasPosition) {
    tips.push({ en: 'Position allows you to control pot size', zh: '有位置可以控制底池大小' });
  } else {
    tips.push({ en: 'Mix checks with strong hands for protection', zh: '用强牌混合过牌以保护范围' });
  }

  return tips;
}

function getFacingCBetTips(texture: BoardTexture): { en: string; zh: string }[] {
  const tips: { en: string; zh: string }[] = [
    { en: 'Defend wider vs small c-bets', zh: '面对小尺度C-bet防守更宽' },
    { en: 'Mix raises with draws and made hands', zh: '用听牌和成手牌混合加注' },
  ];

  if (texture === 'wet') {
    tips.push({ en: 'Raise more draws on wet boards', zh: '在湿润面多加注听牌' });
  }

  return tips;
}

function getCheckRaiseTips(texture: BoardTexture): { en: string; zh: string }[] {
  return [
    { en: 'Balance check-raises with value and bluffs', zh: '用价值牌和诈唬平衡过牌加注' },
    { en: 'Check-raise more on boards favoring your range', zh: '在有利于你范围的牌面多过牌加注' },
    { en: 'Use larger sizing when polarizing', zh: '极化时用更大尺度' },
  ];
}

// Cache scenarios
let cachedScenarios: PostflopScenario[] | null = null;

function getScenarios(): PostflopScenario[] {
  if (!cachedScenarios) {
    cachedScenarios = generateScenarios();
  }
  return cachedScenarios;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const scenarioType = searchParams.get('type') as ScenarioType | null;
    const street = searchParams.get('street') as Street | null;
    const texture = searchParams.get('texture') as BoardTexture | null;
    const hasPosition = searchParams.get('position');
    const id = searchParams.get('id');

    let scenarios = getScenarios();

    // Get single scenario by ID
    if (id) {
      const scenario = scenarios.find(s => s.id === id);
      if (scenario) {
        return NextResponse.json({
          success: true,
          scenario,
          labels: {
            scenarioTypes: SCENARIO_TYPE_LABELS,
            boardTextures: BOARD_TEXTURE_LABELS,
            sprCategories: SPR_LABELS,
          },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Filter scenarios
    if (scenarioType) {
      scenarios = scenarios.filter(s => s.scenarioType === scenarioType);
    }
    if (street) {
      scenarios = scenarios.filter(s => s.street === street);
    }
    if (texture) {
      scenarios = scenarios.filter(s => s.boardTexture === texture);
    }
    if (hasPosition !== null) {
      scenarios = scenarios.filter(s => s.hasPosition === (hasPosition === 'true'));
    }

    return NextResponse.json({
      success: true,
      total: scenarios.length,
      scenarios,
      labels: {
        scenarioTypes: SCENARIO_TYPE_LABELS,
        boardTextures: BOARD_TEXTURE_LABELS,
        sprCategories: SPR_LABELS,
      },
    });
  } catch (error) {
    console.error('Postflop scenarios error:', error);
    return NextResponse.json(
      { success: false, error: '获取场景失败' },
      { status: 500 }
    );
  }
}
