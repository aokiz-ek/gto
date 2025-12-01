/**
 * 锦标赛场景配置
 * 包括 MTT、SNG、PKO 等不同锦标赛类型的策略配置
 */

// ============ 类型定义 ============

export type TournamentType = 'mtt' | 'sng' | 'pko' | 'spin' | 'satellite';
export type TournamentStage = 'early' | 'middle' | 'bubble' | 'itm' | 'final_table';
export type StackCategory = 'micro' | 'short' | 'medium' | 'deep' | 'ultra_deep';

export interface StackDepth {
  id: string;
  bb: number;
  label: string;
  labelCn: string;
  category: StackCategory;
  description: string;
}

export interface TournamentScenario {
  id: string;
  type: TournamentType;
  stage: TournamentStage;
  stackDepth: string; // StackDepth id
  playersRemaining?: number;
  payoutSpots?: number;
  bountyMultiplier?: number; // For PKO
  description: string;
  descriptionCn: string;
  icmAdjustment: number; // ICM pressure factor 0-1
  strategyNotes: string[];
  strategyNotesCn: string[];
}

export interface TournamentTypeConfig {
  id: TournamentType;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  icon: string;
  stages: TournamentStage[];
  stackDepths: string[]; // StackDepth ids
  features: string[];
}

// ============ 筹码深度配置 ============

export const STACK_DEPTHS: StackDepth[] = [
  // Micro stacks (< 10bb)
  { id: '5bb', bb: 5, label: '5 BB', labelCn: '5大盲', category: 'micro', description: 'Push/Fold only' },
  { id: '8bb', bb: 8, label: '8 BB', labelCn: '8大盲', category: 'micro', description: 'Push/Fold zone' },

  // Short stacks (10-20bb)
  { id: '10bb', bb: 10, label: '10 BB', labelCn: '10大盲', category: 'short', description: 'Push/Fold or min-raise' },
  { id: '12bb', bb: 12, label: '12 BB', labelCn: '12大盲', category: 'short', description: 'Short stack play' },
  { id: '15bb', bb: 15, label: '15 BB', labelCn: '15大盲', category: 'short', description: 'Re-steal stacks' },
  { id: '18bb', bb: 18, label: '18 BB', labelCn: '18大盲', category: 'short', description: 'Squeeze possible' },
  { id: '20bb', bb: 20, label: '20 BB', labelCn: '20大盲', category: 'short', description: 'Standard short stack' },

  // Medium stacks (25-50bb)
  { id: '25bb', bb: 25, label: '25 BB', labelCn: '25大盲', category: 'medium', description: 'Opening flexibility' },
  { id: '30bb', bb: 30, label: '30 BB', labelCn: '30大盲', category: 'medium', description: 'Average MTT stack' },
  { id: '35bb', bb: 35, label: '35 BB', labelCn: '35大盲', category: 'medium', description: 'Above average' },
  { id: '40bb', bb: 40, label: '40 BB', labelCn: '40大盲', category: 'medium', description: '3-bet pots playable' },
  { id: '50bb', bb: 50, label: '50 BB', labelCn: '50大盲', category: 'medium', description: 'Full postflop play' },

  // Deep stacks (60-100bb)
  { id: '60bb', bb: 60, label: '60 BB', labelCn: '60大盲', category: 'deep', description: 'Deep stack dynamics' },
  { id: '75bb', bb: 75, label: '75 BB', labelCn: '75大盲', category: 'deep', description: 'Early MTT/Cash' },
  { id: '100bb', bb: 100, label: '100 BB', labelCn: '100大盲', category: 'deep', description: 'Standard cash game' },

  // Ultra deep (150bb+)
  { id: '150bb', bb: 150, label: '150 BB', labelCn: '150大盲', category: 'ultra_deep', description: 'Very deep' },
  { id: '200bb', bb: 200, label: '200 BB', labelCn: '200大盲', category: 'ultra_deep', description: 'Ultra deep' },
];

// ============ 锦标赛类型配置 ============

export const TOURNAMENT_TYPES: TournamentTypeConfig[] = [
  {
    id: 'mtt',
    name: 'MTT',
    nameCn: '多桌锦标赛',
    description: 'Multi-Table Tournament with large fields',
    descriptionCn: '大型多桌锦标赛，玩家众多，奖池结构丰富',
    icon: '🏆',
    stages: ['early', 'middle', 'bubble', 'itm', 'final_table'],
    stackDepths: ['15bb', '20bb', '25bb', '30bb', '40bb', '50bb', '75bb', '100bb'],
    features: ['ICM调整', '泡沫压力', '支付结构', '最终桌动态'],
  },
  {
    id: 'sng',
    name: 'SNG',
    nameCn: '单桌赛/Sit & Go',
    description: 'Single table tournament with fixed structure',
    descriptionCn: '固定人数单桌赛，结构紧凑，ICM重要性高',
    icon: '🎯',
    stages: ['early', 'middle', 'bubble', 'itm'],
    stackDepths: ['10bb', '15bb', '20bb', '25bb', '30bb'],
    features: ['快速盲注结构', '高ICM压力', '泡沫策略', 'Push/Fold'],
  },
  {
    id: 'pko',
    name: 'PKO',
    nameCn: '赏金锦标赛',
    description: 'Progressive Knockout with bounty rewards',
    descriptionCn: '淘汰对手获得赏金，赏金递增制',
    icon: '💰',
    stages: ['early', 'middle', 'bubble', 'itm', 'final_table'],
    stackDepths: ['15bb', '20bb', '25bb', '30bb', '40bb', '50bb'],
    features: ['赏金价值计算', 'EV调整', '激进调用', '覆盖策略'],
  },
  {
    id: 'spin',
    name: 'Spin & Go',
    nameCn: '旋转赛',
    description: 'Fast 3-max hyper-turbo format',
    descriptionCn: '3人超快速赛制，随机奖池倍数',
    icon: '🎰',
    stages: ['early', 'middle', 'bubble'],
    stackDepths: ['5bb', '8bb', '10bb', '15bb', '20bb', '25bb'],
    features: ['超快盲注', 'Push/Fold为主', '3人博弈', '奖池倍数策略'],
  },
  {
    id: 'satellite',
    name: 'Satellite',
    nameCn: '卫星赛',
    description: 'Win seats to bigger tournaments',
    descriptionCn: '赢取大型赛事门票，特殊ICM考量',
    icon: '🛰️',
    stages: ['early', 'middle', 'bubble'],
    stackDepths: ['15bb', '20bb', '25bb', '30bb', '40bb'],
    features: ['名额保护', '泡沫极端ICM', '存活优先', '筹码保值'],
  },
];

// ============ 锦标赛阶段配置 ============

export const TOURNAMENT_STAGES: Record<TournamentStage, {
  name: string;
  nameCn: string;
  description: string;
  icmFactor: number;
  blindPressure: number;
}> = {
  early: {
    name: 'Early Stage',
    nameCn: '早期阶段',
    description: 'Deep stacks, low ICM pressure',
    icmFactor: 0.1,
    blindPressure: 0.2,
  },
  middle: {
    name: 'Middle Stage',
    nameCn: '中期阶段',
    description: 'Average stacks, increasing pressure',
    icmFactor: 0.3,
    blindPressure: 0.5,
  },
  bubble: {
    name: 'Bubble',
    nameCn: '泡沫期',
    description: 'Maximum ICM pressure before money',
    icmFactor: 0.9,
    blindPressure: 0.7,
  },
  itm: {
    name: 'In The Money',
    nameCn: '进钱圈',
    description: 'Secured min-cash, reduced ICM',
    icmFactor: 0.6,
    blindPressure: 0.8,
  },
  final_table: {
    name: 'Final Table',
    nameCn: '最终桌',
    description: 'Largest pay jumps, extreme ICM',
    icmFactor: 0.95,
    blindPressure: 0.9,
  },
};

// ============ 锦标赛场景库 ============

export const TOURNAMENT_SCENARIOS: TournamentScenario[] = [
  // MTT Early Stage
  {
    id: 'mtt_early_100bb',
    type: 'mtt',
    stage: 'early',
    stackDepth: '100bb',
    description: 'MTT Early Stage - Deep Stacks',
    descriptionCn: 'MTT早期深筹码阶段',
    icmAdjustment: 0.05,
    strategyNotes: [
      'Play similar to cash game GTO',
      'Focus on skill edge over ICM',
      'Build chip lead through +EV spots',
    ],
    strategyNotesCn: [
      '策略接近现金桌GTO',
      '注重技术优势而非ICM',
      '通过正EV局面积累筹码',
    ],
  },
  {
    id: 'mtt_early_50bb',
    type: 'mtt',
    stage: 'early',
    stackDepth: '50bb',
    description: 'MTT Early Stage - Medium Deep',
    descriptionCn: 'MTT早期中深筹码',
    icmAdjustment: 0.1,
    strategyNotes: [
      'Still playing for chips',
      'Be selective with marginal spots',
      'Position is key',
    ],
    strategyNotesCn: [
      '仍以积累筹码为主',
      '边缘局面要谨慎选择',
      '位置优势很重要',
    ],
  },

  // MTT Middle Stage
  {
    id: 'mtt_middle_30bb',
    type: 'mtt',
    stage: 'middle',
    stackDepth: '30bb',
    description: 'MTT Middle Stage - Average Stack',
    descriptionCn: 'MTT中期平均筹码',
    icmAdjustment: 0.25,
    strategyNotes: [
      'Re-stealing becomes important',
      'Look for spots to accumulate',
      'Avoid marginal all-ins',
    ],
    strategyNotesCn: [
      '反偷盲变得重要',
      '寻找积累筹码的机会',
      '避免边缘的全压',
    ],
  },
  {
    id: 'mtt_middle_20bb',
    type: 'mtt',
    stage: 'middle',
    stackDepth: '20bb',
    description: 'MTT Middle Stage - Short',
    descriptionCn: 'MTT中期短筹码',
    icmAdjustment: 0.35,
    strategyNotes: [
      'Push/Fold or re-steal mode',
      'First-in aggression is key',
      'Avoid flat calling raises',
    ],
    strategyNotesCn: [
      'Push/Fold或反偷模式',
      '先手进攻很关键',
      '避免平跟加注',
    ],
  },

  // MTT Bubble
  {
    id: 'mtt_bubble_25bb',
    type: 'mtt',
    stage: 'bubble',
    stackDepth: '25bb',
    description: 'MTT Bubble - Medium Stack',
    descriptionCn: 'MTT泡沫期中等筹码',
    icmAdjustment: 0.85,
    strategyNotes: [
      'Target short stacks',
      'Avoid big stack confrontation',
      'ICM pressure is maximum',
    ],
    strategyNotesCn: [
      '瞄准短筹码玩家',
      '避免与大筹码正面冲突',
      'ICM压力达到最大',
    ],
  },
  {
    id: 'mtt_bubble_15bb',
    type: 'mtt',
    stage: 'bubble',
    stackDepth: '15bb',
    description: 'MTT Bubble - Short Stack',
    descriptionCn: 'MTT泡沫期短筹码',
    icmAdjustment: 0.9,
    strategyNotes: [
      'Wait for premium or risk ladder',
      'Fold equity is low vs big stacks',
      'Consider survival vs chip-up',
    ],
    strategyNotesCn: [
      '等待好牌或赌博升级',
      '对大筹码弃牌权益低',
      '权衡生存与积累',
    ],
  },

  // MTT ITM
  {
    id: 'mtt_itm_30bb',
    type: 'mtt',
    stage: 'itm',
    stackDepth: '30bb',
    description: 'MTT ITM - Average Stack',
    descriptionCn: 'MTT钱圈内平均筹码',
    icmAdjustment: 0.55,
    strategyNotes: [
      'Min-cash secured, play for wins',
      'Target short stacks',
      'Build for final table',
    ],
    strategyNotesCn: [
      '已确保最低奖金，追求更高',
      '瞄准短筹码',
      '为最终桌积累',
    ],
  },

  // MTT Final Table
  {
    id: 'mtt_ft_40bb',
    type: 'mtt',
    stage: 'final_table',
    stackDepth: '40bb',
    playersRemaining: 9,
    description: 'MTT Final Table - 9 Handed',
    descriptionCn: 'MTT最终桌9人',
    icmAdjustment: 0.9,
    strategyNotes: [
      'Pay jumps are significant',
      'Position relative to pay jumps',
      'Target medium stacks',
    ],
    strategyNotesCn: [
      '奖金跨度很大',
      '位置对奖金跨度有影响',
      '瞄准中等筹码',
    ],
  },
  {
    id: 'mtt_ft_25bb_3handed',
    type: 'mtt',
    stage: 'final_table',
    stackDepth: '25bb',
    playersRemaining: 3,
    description: 'MTT Final Table - 3 Handed',
    descriptionCn: 'MTT最终桌3人',
    icmAdjustment: 0.95,
    strategyNotes: [
      'Each elimination = huge pay jump',
      '3-way ICM dynamics',
      'Deal consideration',
    ],
    strategyNotesCn: [
      '每次淘汰=巨额奖金跨度',
      '三人ICM博弈',
      '考虑分奖金协议',
    ],
  },

  // SNG Scenarios
  {
    id: 'sng_bubble_15bb',
    type: 'sng',
    stage: 'bubble',
    stackDepth: '15bb',
    playersRemaining: 4,
    payoutSpots: 3,
    description: 'SNG Bubble - 4 Left, 3 Paid',
    descriptionCn: 'SNG泡沫4人剩3奖',
    icmAdjustment: 0.95,
    strategyNotes: [
      'ICM is everything',
      'Big stack advantage massive',
      'Short stack desperation',
    ],
    strategyNotesCn: [
      'ICM至关重要',
      '大筹码优势巨大',
      '短筹码绝望求生',
    ],
  },
  {
    id: 'sng_itm_20bb_3way',
    type: 'sng',
    stage: 'itm',
    stackDepth: '20bb',
    playersRemaining: 3,
    description: 'SNG ITM - 3 Handed',
    descriptionCn: 'SNG钱圈3人',
    icmAdjustment: 0.8,
    strategyNotes: [
      'All paid, play for 1st',
      '3-way push/fold important',
      'Stack size dynamics key',
    ],
    strategyNotesCn: [
      '都进钱圈，争第一',
      '三人push/fold很重要',
      '筹码量对比是关键',
    ],
  },

  // PKO Scenarios
  {
    id: 'pko_early_covered',
    type: 'pko',
    stage: 'early',
    stackDepth: '50bb',
    bountyMultiplier: 1.0,
    description: 'PKO Early - Covering Opponent',
    descriptionCn: 'PKO早期覆盖对手',
    icmAdjustment: 0.1,
    strategyNotes: [
      'Bounty adds calling equity',
      'Widen calling ranges vs short stacks',
      'Accumulate bounties + chips',
    ],
    strategyNotesCn: [
      '赏金增加跟注价值',
      '对短筹码放宽跟注范围',
      '同时积累赏金和筹码',
    ],
  },
  {
    id: 'pko_middle_big_bounty',
    type: 'pko',
    stage: 'middle',
    stackDepth: '30bb',
    bountyMultiplier: 2.0,
    description: 'PKO Middle - 2x Bounty Target',
    descriptionCn: 'PKO中期2倍赏金目标',
    icmAdjustment: 0.3,
    strategyNotes: [
      '2x bounty = significant EV boost',
      'Call wider to win bounty',
      'Risk-reward calculation changes',
    ],
    strategyNotesCn: [
      '2倍赏金显著提升EV',
      '放宽跟注范围赢取赏金',
      '风险收益计算有变化',
    ],
  },
  {
    id: 'pko_bubble_big_stack',
    type: 'pko',
    stage: 'bubble',
    stackDepth: '40bb',
    bountyMultiplier: 3.0,
    description: 'PKO Bubble - Big Stack with 3x Bounty',
    descriptionCn: 'PKO泡沫期大筹码3倍赏金',
    icmAdjustment: 0.75,
    strategyNotes: [
      'Bounty offsets some ICM',
      'Still respect bubble dynamics',
      'Target short stacks aggressively',
    ],
    strategyNotesCn: [
      '赏金部分抵消ICM',
      '仍需尊重泡沫动态',
      '激进瞄准短筹码',
    ],
  },

  // Spin & Go Scenarios
  {
    id: 'spin_early_25bb',
    type: 'spin',
    stage: 'early',
    stackDepth: '25bb',
    description: 'Spin Early - Full Stacks',
    descriptionCn: 'Spin早期满筹码',
    icmAdjustment: 0.2,
    strategyNotes: [
      '3-max dynamics apply',
      'Position is critical',
      'Fast pace expected',
    ],
    strategyNotesCn: [
      '3人博弈动态',
      '位置至关重要',
      '节奏快速',
    ],
  },
  {
    id: 'spin_middle_15bb',
    type: 'spin',
    stage: 'middle',
    stackDepth: '15bb',
    description: 'Spin Middle - Push/Fold Zone',
    descriptionCn: 'Spin中期Push/Fold区',
    icmAdjustment: 0.5,
    strategyNotes: [
      'Push/Fold becomes primary',
      '3-way equity important',
      'Stack size relative positions',
    ],
    strategyNotesCn: [
      'Push/Fold为主',
      '三人权益很重要',
      '相对筹码位置',
    ],
  },
  {
    id: 'spin_hu_10bb',
    type: 'spin',
    stage: 'bubble',
    stackDepth: '10bb',
    playersRemaining: 2,
    description: 'Spin Heads-Up - Winner Take All',
    descriptionCn: 'Spin单挑胜者全拿',
    icmAdjustment: 0.0,
    strategyNotes: [
      'No ICM, pure chip EV',
      'Hyper-aggressive HU strategy',
      'Wide pushing ranges',
    ],
    strategyNotesCn: [
      '无ICM，纯筹码EV',
      '超激进单挑策略',
      '宽泛推送范围',
    ],
  },

  // Satellite Scenarios
  {
    id: 'satellite_bubble_equal',
    type: 'satellite',
    stage: 'bubble',
    stackDepth: '20bb',
    playersRemaining: 6,
    payoutSpots: 5,
    description: 'Satellite Bubble - 6 Left, 5 Seats',
    descriptionCn: '卫星赛泡沫6人5席',
    icmAdjustment: 0.99,
    strategyNotes: [
      'Survival is everything',
      'All seats equal value',
      'Fold almost everything',
    ],
    strategyNotesCn: [
      '生存就是一切',
      '所有席位价值相同',
      '几乎弃掉所有牌',
    ],
  },
  {
    id: 'satellite_secure',
    type: 'satellite',
    stage: 'itm',
    stackDepth: '30bb',
    playersRemaining: 4,
    payoutSpots: 5,
    description: 'Satellite - Seat Secured',
    descriptionCn: '卫星赛席位已保',
    icmAdjustment: 0.0,
    strategyNotes: [
      'Seat secured, no need to play',
      'Fold everything',
      'Protect your seat',
    ],
    strategyNotesCn: [
      '席位已保，无需出战',
      '全部弃牌',
      '保护你的席位',
    ],
  },
];

// ============ 辅助函数 ============

/**
 * 获取筹码深度配置
 */
export function getStackDepth(id: string): StackDepth | undefined {
  return STACK_DEPTHS.find(s => s.id === id);
}

/**
 * 根据BB数获取最接近的筹码深度
 */
export function getNearestStackDepth(bb: number): StackDepth {
  let nearest = STACK_DEPTHS[0];
  let minDiff = Math.abs(bb - nearest.bb);

  for (const stack of STACK_DEPTHS) {
    const diff = Math.abs(bb - stack.bb);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = stack;
    }
  }

  return nearest;
}

/**
 * 获取锦标赛类型配置
 */
export function getTournamentType(id: TournamentType): TournamentTypeConfig | undefined {
  return TOURNAMENT_TYPES.find(t => t.id === id);
}

/**
 * 获取锦标赛阶段配置
 */
export function getTournamentStage(stage: TournamentStage) {
  return TOURNAMENT_STAGES[stage];
}

/**
 * 获取特定场景
 */
export function getTournamentScenario(id: string): TournamentScenario | undefined {
  return TOURNAMENT_SCENARIOS.find(s => s.id === id);
}

/**
 * 根据条件筛选场景
 */
export function filterScenarios(filters: {
  type?: TournamentType;
  stage?: TournamentStage;
  stackCategory?: StackCategory;
}): TournamentScenario[] {
  return TOURNAMENT_SCENARIOS.filter(scenario => {
    if (filters.type && scenario.type !== filters.type) return false;
    if (filters.stage && scenario.stage !== filters.stage) return false;
    if (filters.stackCategory) {
      const stack = getStackDepth(scenario.stackDepth);
      if (stack && stack.category !== filters.stackCategory) return false;
    }
    return true;
  });
}

/**
 * 计算 ICM 调整因子
 */
export function calculateICMFactor(
  tournamentType: TournamentType,
  stage: TournamentStage,
  playersRemaining: number,
  payoutSpots: number
): number {
  const stageConfig = TOURNAMENT_STAGES[stage];
  let baseFactor = stageConfig.icmFactor;

  // 泡沫调整
  if (stage === 'bubble') {
    const bubbleRatio = payoutSpots / playersRemaining;
    baseFactor *= (1 + (1 - bubbleRatio));
  }

  // 最终桌调整
  if (stage === 'final_table' && playersRemaining <= 3) {
    baseFactor = Math.min(baseFactor * 1.1, 1);
  }

  // 卫星赛特殊处理
  if (tournamentType === 'satellite') {
    if (playersRemaining <= payoutSpots) {
      return 0; // 席位已保
    }
    baseFactor = Math.min(baseFactor * 1.5, 1);
  }

  return Math.round(baseFactor * 100) / 100;
}

/**
 * 获取 PKO 赏金 EV 调整
 */
export function calculateBountyEV(
  bountyAmount: number,
  potSize: number,
  stackToWin: number,
  ourStack: number
): { adjustedEV: number; bountyValue: number } {
  // 只有当我们覆盖对手时才能赢得赏金
  const canWinBounty = ourStack >= stackToWin;
  const bountyValue = canWinBounty ? bountyAmount : 0;

  // 赏金占底池的比例
  const bountyRatio = bountyValue / (potSize + bountyValue);

  return {
    adjustedEV: bountyValue,
    bountyValue: bountyRatio,
  };
}

export default {
  STACK_DEPTHS,
  TOURNAMENT_TYPES,
  TOURNAMENT_STAGES,
  TOURNAMENT_SCENARIOS,
  getStackDepth,
  getNearestStackDepth,
  getTournamentType,
  getTournamentStage,
  getTournamentScenario,
  filterScenarios,
  calculateICMFactor,
  calculateBountyEV,
};
