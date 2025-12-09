import type { TranslationKeys } from './en';

export const zhCN: TranslationKeys = {
  // Common
  common: {
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    search: '搜索',
    filter: '筛选',
    reset: '重置',
    apply: '应用',
    learnMore: '了解更多',
    viewAll: '查看全部',
    seeMore: '查看更多',
    showLess: '收起',
  },

  // Navigation
  nav: {
    home: '首页',
    solutions: '解决方案',
    analyzer: '分析器',
    practice: '练习',
    daily: '每日挑战',
    reports: '报告',
    icm: 'ICM',
    leaderboard: '排行榜',
    history: '历史记录',
    settings: '设置',
    profile: '个人资料',
    upgrade: '升级',
    upgradeToPro: '升级到专业版',
    login: '登录',
    signup: '注册',
    logout: '退出登录',
  },

  // Home page
  home: {
    heroBadge: '由先进的GTO算法驱动',
    heroTitle: '碾压你的',
    heroTitleHighlight: '对手',
    heroSubtitle: '学习和练习博弈论最优扑克策略的最佳方式。',
    ctaGetSolutions: '免费获取解决方案',
    ctaStartPractice: '开始练习',
    ctaGetStarted: '免费开始',

    // Stats
    activeUsers: '活跃用户',
    handsAnalyzed: '分析手牌',
    practiceSessions: '练习场次',
    gtoAccuracy: 'GTO准确率',

    // Features section
    featuresTitle: '掌握GTO所需的一切',
    featuresSubtitle: '全面的工具帮助你理解和应用博弈论最优策略。',

    // Feature cards
    dailyChallenge: '每日挑战',
    dailyChallengeDesc: '每日10题挑战，与全球玩家一起竞争，追踪你的进步。',
    practiceMode: '练习模式',
    practiceModeDesc: '通过互动练习和即时反馈训练你的GTO技能。',
    solutionsLibrary: '解决方案库',
    solutionsLibraryDesc: '访问数千个针对各种情况的预计算GTO解决方案。',
    handAnalyzer: '手牌分析器',
    handAnalyzerDesc: '实时分析任何手牌情况，获得GTO建议。',
    gtoCourses: 'GTO课程',
    gtoCoursesDesc: '系统学习GTO策略，从入门到精通的完整课程体系。',
    postflopStrategy: '翻牌后策略',
    postflopStrategyDesc: '翻牌后场景库，掌握C-bet、价值下注和诈唬策略。',

    // Range section
    rangeTitle: '可视化最优范围',
    rangeDesc: '我们的互动范围矩阵让学习GTO翻牌前策略变得简单。',
    rangeFeature1: '从UTG到BB的所有位置',
    rangeFeature2: '现金局、MTT和SNG格式',
    rangeFeature3: '20bb到100bb+的筹码深度',
    rangeFeature4: 'RFI、3-bet和对抗3-bet场景',

    // CTA section
    ctaTitle: '准备像职业玩家一样打牌？',
    ctaSubtitle: '加入数千名通过Aokiz GTO提升水平的玩家。',

    // Footer
    terms: '条款',
    privacy: '隐私',
    contact: '联系我们',
  },

  // Banner ads
  banner: {
    premiumTitle: '高级会员',
    premiumSubtitle: '无限访问所有GTO解决方案',
    premiumDesc: '通过我们的高级计划解锁10,000+翻牌前和翻牌后解决方案',
    premiumCta: '立即升级',

    postflopTitle: '新功能：翻牌后训练器',
    postflopSubtitle: '通过AI驱动的练习掌握每条街',
    postflopDesc: '练习翻牌、转牌和河牌决策，获得即时GTO反馈',
    postflopCta: '免费试用',

    tournamentTitle: '锦标赛特惠',
    tournamentSubtitle: 'MTT和SNG解决方案现已上线',
    tournamentDesc: '研究针对每种筹码深度和泡沫情况的ICM调整范围',
    tournamentCta: '探索',
  },

  // Practice page
  practice: {
    title: 'GTO练习',
    subtitle: '训练你的翻牌前决策',
    startPractice: '开始练习',
    newHand: '新手牌',
    showAnswer: '显示答案',
    yourPosition: '你的位置',
    action: '动作',
    stackSize: '筹码量',
    gameType: '游戏类型',
    difficulty: '难度',

    // Actions
    fold: '弃牌',
    call: '跟注',
    raise: '加注',
    allIn: '全下',
    check: '过牌',
    bet: '下注',

    // Game types
    cashGame: '现金局',
    tournament: '锦标赛',
    sng: 'SNG',

    // Difficulty levels
    easy: '简单',
    medium: '中等',
    hard: '困难',
    expert: '专家',

    // Results
    correct: '正确！',
    incorrect: '错误',
    gtoAction: 'GTO动作',
    yourAction: '你的动作',
    accuracy: '准确率',
    streak: '连胜',
    totalHands: '总手数',

    // Stats
    sessionStats: '本次统计',
    overallStats: '总体统计',
    todayProgress: '今日进度',

    // Extended practice strings
    today: '今日',
    accurate: '准确',
    targetedTraining: '针对训练',
    pkBattle: 'PK对战',
    filterSettings: '筛选设置',

    // Street names
    streets: {
      preflop: '翻前',
      flop: '翻牌',
      turn: '转牌',
      river: '河牌',
    },

    // Scenarios
    scenarios: {
      rfi: 'RFI',
      rfiOpen: 'RFI开池',
      vsRfi: '面对RFI',
      vs3bet: '面对3-Bet',
      rfiDesc: 'RFI (率先加注)',
      vsRfiDesc: '面对RFI (防守大盲)',
    },

    // Action ratings
    ratings: {
      perfect: '完美',
      good: '良好',
      smallMistake: '小失误',
      mistake: '错误',
      seriousMistake: '严重失误',
    },

    // Hand types
    handTypes: {
      pairs: '对子',
      suited: '同花',
      offsuit: '杂色',
    },

    // Position
    position: '位置',
    positionText: '位置',

    // Weak spot training
    weakSpots: {
      title: '需要加强的领域',
      description: '以下领域准确率低于 60%，建议针对练习：',
      targetedTraining: '针对训练',
    },

    // Menu items
    menu: {
      navigation: '导航',
      home: '首页',
      progressChart: '进度图表',
      handHistory: '手牌历史',
      ranges: '范围',
      achievements: '成就',
      otherModes: '其他训练模式',
      pushFoldTraining: 'Push/Fold 训练',
      pushFold: 'Push/Fold 训练',
      multitableTraining: '多桌训练',
      multitable: '多桌训练',
      tournamentTraining: '锦标赛训练',
      tournament: '锦标赛训练',
      rangeBuilderTraining: 'Range Builder 训练',
      rangeBuilder: 'Range Builder 训练',
      gtoReport: 'GTO 分析报告',
      reports: 'GTO 分析报告',
      icmCalculator: 'ICM 计算器',
      icm: 'ICM 计算器',
      settings: '设置',
      sound: '声音',
      tutorial: '新手教程',
      moreSettings: '更多设置',
      keyboardShortcuts: '快捷键',
      pressQuestionToViewAll: '按 ? 查看全部',
    },

    // AI Coach
    aiCoachAnalysis: 'AI 教练分析',

    // Results
    gtoScore: 'GTO得分',
    correctAction: '正确的行动',
    wrongAction: '错误的行动',
    repeatHand: '重复这一手',
    save: '保存',
    continueStreet: '继续下一街',
    viewSummary: '查看总结',
    nextHand: '下一手',
    aiCoach: 'AI 教练分析',

    // Scenario Details Modal
    scenarioDetails: {
      title: '场景详情',
      scenarioType: '场景类型',
      yourPosition: '你的位置',
      opponentPosition: '对手位置',
      effectiveStack: '有效筹码',
      currentPot: '当前底池',
      rfi: 'RFI（首次加注）',
      vsRfi: '面对 RFI（面对加注）',
      vs3bet: '面对 3-Bet（面对再加注）',
      positionAdvantage: '位置优势',
      inPosition: '有位置 (IP)',
      outOfPosition: '无位置 (OOP)',
      actionDescription: '行动描述',
      rfiDescription: '你在 {position} 位置率先行动，前面玩家全部弃牌。选择是弃牌还是加注开池。',
      vsRfiDescription: '{villainPosition} 位置开池加注到 2.5bb，你在 BB 位置面对这个加注。选择是弃牌、跟注还是3-Bet。',
      vs3betDescription: '你在 {heroPosition} 位置开池加注后，{villainPosition} 位置进行了3-Bet到 10bb。选择是弃牌、跟注还是4-Bet。',
    },

    // Toast messages
    savedToast: '已保存到手牌记录',
    savedToHistory: '已保存到手牌记录',
    achievementUnlocked: '成就解锁',
    achievementUnlock: '成就解锁',

    // Achievement modal
    achievementsTitle: '成就',

    // Session summary
    handSummary: '这手牌总结',
    streetPerformance: '各街表现',
    communityCards: '公共牌',
    saveThisHand: '保存这手牌',

    // Range view
    board: '公共牌',
    range: '范围',
    raiseHigh: 'Raise 高频',
    callHigh: 'Call 高频',
    raiseHighFreq: 'Raise 高频',
    callHighFreq: 'Call 高频',
    mixed: 'Mixed',
    currentHand: '当前手牌',

    // Stats object for progress chart
    stats: {
      totalDecisions: '总决策数',
      totalAccuracy: '总准确率',
      streakDays: '连续天数',
      last7Days: '最近7天练习',
      categoryBreakdown: '分类统计',
      byStreet: '按街道',
      byScenario: '按场景',
      byHandType: '按手牌类型',
      byPosition: '按位置',
    },

    // Progress chart (flat keys for backward compatibility)
    practiceProgress: '练习进度',
    totalDecisions: '总决策数',
    totalAccuracy: '总准确率',
    consecutiveDays: '连续天数',
    last7Days: '最近7天练习',
    categoryStats: '分类统计',
    byStreet: '按街道',
    byScenario: '按场景',
    byHand: '按手牌',
    byPosition: '按位置',
    hands: '手',

    // History object for hand history modal
    history: {
      noHands: '还没有保存的手牌',
      saveHint: '完成练习后点击"保存"按钮来记录手牌',
    },

    // Hand history modal (flat keys for backward compatibility)
    handHistoryTitle: '手牌历史',
    noSavedHands: '还没有保存的手牌',
    saveHintDesc: '完成练习后点击"保存"按钮来记录手牌',
    delete: '删除',

    // Shortcuts object for keyboard shortcuts modal
    shortcuts: {
      title: '快捷键',
      actions: '决策动作',
      fold: '弃牌',
      callCheck: '跟注/过牌',
      raise: '加注',
      bet: '下注',
      allin: '全下',
      nextHandStreet: '下一手/下一街',
      closeModal: '关闭弹窗',
      showHelp: '显示快捷键帮助',
    },

    // Keyboard shortcuts (flat keys for backward compatibility)
    keyboardShortcutsTitle: '快捷键',
    decisionActions: '决策动作',
    foldShortcut: '弃牌 (Fold)',
    callCheckShortcut: '跟注/过牌 (Call/Check)',
    raiseShortcut: '加注 (Raise)',
    betShortcut: '下注 (Bet)',
    allinShortcut: '全下 (All-in)',
    navigationSection: '导航',
    nextHandStreet: '下一手/下一街',
    closeModal: '关闭弹窗',
    showKeyboardHelp: '显示快捷键帮助',

    // Tutorial object
    tutorial: {
      previous: '上一步',
      next: '下一步',
      start: '开始练习!',
    },

    // Tutorial (flat keys for backward compatibility)
    tutorialTitle: '新手教程',
    tutorialWelcome: '欢迎来到GTO训练器!',
    tutorialWelcomeDesc: '这是一款帮助你学习博弈论最优(GTO)扑克策略的训练工具。通过反复练习，提高你的决策能力。',
    tutorialGoal: '目标',
    tutorialGoalText: '根据GTO策略选择最佳动作',
    tutorialUnderstand: '理解场景',
    tutorialUnderstandDesc: '每个练习场景包含:',
    tutorialYourHand: '你的手牌',
    tutorialYourHandDesc: '屏幕中央显示的两张牌',
    tutorialPosition: '位置',
    tutorialPositionDesc: '你在牌桌上的位置(UTG, HJ, CO, BTN, SB, BB)',
    tutorialScenarioType: '场景类型',
    tutorialScenarioTypeDesc: 'RFI(率先加注)、面对RFI、面对3-Bet',
    tutorialDecisions: '如何做决策',
    tutorialDecisionsDesc: '观察你的手牌和位置，然后选择动作:',
    tutorialTip: '使用键盘快捷键更高效: F/C/R/A',
    tutorialResults: '理解结果',
    tutorialResultsDesc: '选择后你会看到GTO最优策略的频率分布:',
    tutorialPerfect: '完美选择，该动作是唯一最优解',
    tutorialGood: '良好选择，是混合策略的一部分',
    tutorialImprove: '有待改进，不是主要选择',
    tutorialWrong: '错误选择，不在GTO范围内',
    tutorialAdvanced: '进阶功能',
    tutorialWeakSpot: '弱点练习',
    tutorialWeakSpotDesc: '专注于你表现较差的领域',
    tutorialTimer: '计时模式',
    tutorialTimerDesc: '限时决策，模拟真实比赛压力',
    tutorialAchievements: '成就系统',
    tutorialAchievementsDesc: '解锁成就，追踪进步',
    tutorialProgressChart: '进度图表',
    tutorialProgressChartDesc: '查看每日练习数据',
    tutorialDailyTip: '建议每天练习20-50手，持续提高!',
    tutorialPrevious: '上一步',
    tutorialNext: '下一步',
    tutorialStart: '开始练习!',

    // Filters object
    filters: {
      mode: '模式',
      fullHand: '完整',
      scenario: '场景',
      all: '全部',
      handType: '手牌类型',
      timer: '计时',
      on: '开',
      off: '关',
      seconds: '秒',
      avgDecision: '平均决策',
    },

    // Daily goal object
    dailyGoal: {
      title: '设置每日目标',
      description: '设置每天的练习目标，帮助你保持持续进步',
      handsPerDay: '手/天',
      custom: '自定义',
      todayCompleted: '今日已完成',
      todayAccuracy: '今日准确率',
      remaining: '距离目标还差',
      confirm: '确定',
    },

    // Filter panel (flat keys for backward compatibility)
    mode: '模式',
    preflopMode: '翻前',
    fullHandMode: '完整',
    scenario: '场景',
    all: '全部',
    hand: '手牌',
    timer: '计时',
    timerOn: '开',
    timerOff: '关',
    seconds: '秒',
    avgDecision: '平均决策',

    // Daily goal modal
    setDailyGoal: '设置每日目标',
    dailyGoalDesc: '设置每天的练习目标，帮助你保持持续进步',
    handsPerDay: '手/天',
    custom: '自定义',
    todayCompleted: '今日已完成',
    todayAccuracy: '今日准确率',
    remaining: '距离目标还差',
    confirm: '确定',

    // Days of week
    days: {
      sun: '日',
      mon: '一',
      tue: '二',
      wed: '三',
      thu: '四',
      fri: '五',
      sat: '六',
    },
  },

  // Analyzer page
  analyzer: {
    title: '手牌分析器',
    subtitle: '分析任何扑克手牌',
    analyzeHand: '分析手牌',
    clearHand: '清除手牌',

    // Setup
    heroPosition: '英雄位置',
    villainPosition: '对手位置',
    heroCards: '英雄手牌',
    board: '公共牌',
    potSize: '底池大小',
    effectiveStack: '有效筹码',

    // Analysis results
    analysisResults: '分析结果',
    evAnalysis: 'EV分析',
    rangeAnalysis: '范围分析',
    recommendedAction: '推荐动作',
    equity: '胜率',
    expectedValue: '期望值',

    // Actions
    selectCards: '选择手牌',
    selectPosition: '选择位置',

    // Extended analyzer strings
    yourPosition: '你的位置',
    opponentPosition: '对手位置',
    yourHand: '你的手牌',
    communityCards: '公共牌',
    history: '历史',
    clear: '清除',
    save: '保存',
    saved: '已保存',
    saving: '保存中...',
    saveToHistory: '保存到历史',
    analyze: '分析',
    analyzing: '分析中...',
    gtoAnalysisResults: 'GTO 分析结果',
    streetStrategy: '各街道策略',
    saveNotes: '保存笔记 (可选)',
    viewInHistory: '保存后可在"历史记录"页面查看',
    analysisHistory: '分析历史',
    noHistory: '暂无分析历史',

    // Step hints
    step1Position: '第1步：选择你和对手的位置',
    step2Hero: '第2步：选择你的两张手牌',
    step3Board: '第3步：选择公共牌',
    analysisComplete: '✓ 分析完成',

    // Prompts
    selectPositionFirst: '请先选择你和对手的位置',
    selectHeroCards: '请选择你的两张手牌',
    selectBoardCards: '请选择公共牌',
    clickAnalyze: '点击"分析"按钮开始分析',
    saveFailed: '保存失败，请先登录',
    saveNetworkError: '保存失败，请检查网络连接',

    // Range tooltip
    whatIsRange: '什么是对手范围？',
    rangeExplanation1: '对手范围是指基于对手位置和行动，推测其可能持有的所有起手牌组合。',
    rangeExplanation2: '矩阵中的颜色深浅表示该手牌在对手范围内的可能性：颜色越深，可能性越高。',
    rangePercent: '对手开牌范围百分比',
    combosCount: '范围内的手牌组合总数',
    equityVsRange: '你的手牌对抗此范围的胜率',

    // Card selector
    selectCard: '选择卡牌',
    heroHand: '手牌',
    quickInputPlaceholder: '快速输入: AhKs 或 AhKs QcJdTh',

    // Analysis stats
    potOdds: '底池赔率',
    spr: 'SPR',
    bestEv: '最佳EV',
    actionComparison: '行动对比 (EV损失)',
    evLoss: 'EV损失',
    range: '范围',
    vsRangeEquity: 'vs范围权益',
    combos: '组合',
    opponentRange: '对手范围',
    optimal: '最优',
    notesPlaceholder: '添加笔记，记录你的思考过程...',
    avgEquity: '平均权益',
  },

  // Solutions page
  solutions: {
    title: 'GTO解决方案',
    subtitle: '探索翻牌前范围',

    // Filters
    position: '位置',
    scenario: '场景',
    stackDepth: '筹码深度',

    // Scenarios
    rfi: 'RFI (首次加注)',
    vsRfi: '面对RFI',
    vs3bet: '对抗3-Bet',
    threeBet: '3-Bet',
    fourBet: '4-Bet',

    // Positions
    utg: 'UTG',
    utg1: 'UTG+1',
    utg2: 'UTG+2',
    lj: 'LJ',
    hj: 'HJ',
    co: 'CO',
    btn: 'BTN',
    sb: 'SB',
    bb: 'BB',

    // Game types
    cash: 'Cash',
    mtt: 'MTT',
    sng: 'SNG',
    spin: 'Spin',

    // Dynamic values
    potOdds: '底池赔率',
    raiseSize: '加注',
    threeBetSize: '3-Bet',
    pot: '底池',
    effectiveStack: '有效筹码',
    combos: '组合',

    // Actions in detail card
    action: '行动',
    expectedValue: '期望值',
    frequency: '频率',
    allin: '全下',
    bet: '下注',

    // Tabs
    range: '范围',
    report: '报告',
    overview: '总览',
    table: '桌',
    equityTable: 'EV表格',
    hands: '手牌组合',
    filter: '筛选',
    blockers: '阻挡牌',

    // Stats
    playableHands: '可打手牌',
    avgEV: '平均EV',
    rangeStats: '范围统计',

    // Action filter
    filterByAction: '按行动筛选',
    all: '全部',
    mixed: '混合策略',

    // Hand type filter
    filterByHandType: '按手牌类型',
    pairs: '对子 (AA-22)',
    suited: '同花 (AKs...)',
    offsuit: '不同花 (AKo...)',

    // Filter results
    filterResults: '筛选结果',
    matchingHands: '符合条件的手牌',
    resetFilters: '重置筛选条件',

    // Blocker analysis
    blockerEffect: '阻挡效果分析',
    blockedStrongHands: '阻挡的强牌组合',
    noBlockerEffect: '该手牌没有显著的阻挡效果',
    blockerRating: '阻挡效果评级',
    strategyTip: '策略提示',
    blockerTipText: '持有阻挡牌时，对手的价值范围变窄，这增加了我们诈唬的EV。但同时也需要考虑对手的弃牌频率和SPR。',
    selectHandForBlockers: '选择一手牌查看阻挡牌分析',
    clickMatrix: '点击左侧范围矩阵中的任意手牌',

    // Blocker ratings
    blockerRatings: {
      extreme: '极高',
      extremeDesc: '同时阻挡AA、KK、AK，是最佳的阻挡组合',
      high: '高',
      highDesc: '阻挡AA和AK，有较强的阻挡价值',
      medium: '中等',
      mediumDesc: '阻挡KK和AK，有一定阻挡价值',
      low: '低',
      lowDesc: '阻挡部分高牌组合',
      lowMedium: '低-中',
    },

    // Blocker descriptions
    blockerDescriptions: {
      aa3: '阻挡3个AA组合',
      kk3: '阻挡3个KK组合',
      kk4: '阻挡4个KK组合',
      ak4: '阻挡4个AK组合',
    },

    // Hand combos view
    clickToSelect: '点击左侧矩阵选择一手牌查看详细组合',
    noPlayableHands: '没有可玩手牌数据',

    // EV table headers
    hand: '手牌',
    raisePercent: '加注%',
    callPercent: '跟注%',
    foldPercent: '弃牌%',
    equityPercent: '权益%',

    // EV table summary
    evTableSummary: '可玩手牌',
    avgEvLabel: '平均EV',

    // Breakdown view
    rangeBreakdown: '范围分解',
    highPairs: '高对 (AA-TT)',
    middlePairs: '中对 (99-66)',
    lowPairs: '小对 (55-22)',
    avgRaiseFreq: '平均加注频率',
    suitedConnectors: '同花连张',
    broadwayCombos: 'Broadway 组合',

    // Report view
    strategyReport: '策略报告',
    overallStats: '总体统计',
    raiseFreq: '加注频率',
    callFreq: '跟注频率',
    foldFreq: '弃牌频率',
    strategyPoints: '策略要点',
    positionAnalysis: '位置分析',

    // Strategy descriptions
    strategyDesc: {
      rfiFrom: '从{position}位置开池加注，使用{size}x的加注尺寸',
      vsRfiFrom: '面对{position}的开池，使用{size}x的3-bet尺寸',
      avgEVPoint: '平均期望值: {ev}bb',
      stackPoint: '有效筹码: {stack}bb, SPR: {spr}',
      rfiPositionEarly: '较早',
      rfiPositionLate: '较晚',
      rfiRangeTight: '谨慎选择',
      rfiRangeLoose: '相对宽松',
      rfiAdvantageMore: '更多地利用位置优势进行价值下注和诈唬',
      rfiAdvantageStrong: '需要更强的牌力来进入底池',
      vsRfiPosition: '作为BB面对{position}的开池加注，我们有位置劣势',
      vsRfiRangeWide: '但面对按钮位的范围较宽',
      vsRfiRangeTight: '且对手范围较紧',
      vsRfiBalance: '需要通过混合策略平衡我们的3-bet和跟注范围，防止被剥削。',
    },

    // Position descriptions for report
    positionDescriptions: {
      rfi: '{position}是一个{timing}的位置。在此位置开池需要{range}的范围。位置优势意味着我们可以{advantage}。',
      vsRfi: '作为BB面对{position}的开池加注，我们有位置劣势{rangeNote}。{balance}',
    },
  },

  // Settings page
  settings: {
    title: '设置',

    // Sections
    general: '通用',
    appearance: '外观',
    notifications: '通知',
    account: '账户',
    language: '语言',

    // General settings
    soundEffects: '音效',
    animations: '动画',
    autoShowAnswer: '自动显示答案',

    // Theme
    theme: '主题',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    systemDefault: '跟随系统',

    // Language
    selectLanguage: '选择语言',
    english: 'English',
    chinese: '简体中文',

    // Account
    email: '邮箱',
    password: '密码',
    changePassword: '修改密码',
    deleteAccount: '删除账户',
  },

  // Auth pages
  auth: {
    login: '登录',
    signup: '注册',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码？',
    rememberMe: '记住我',
    orContinueWith: '或通过以下方式继续',
    noAccount: '还没有账户？',
    haveAccount: '已有账户？',
    createAccount: '创建账户',
    welcomeBack: '欢迎回来',
    getStarted: '免费开始',
  },

  // Poker terms
  poker: {
    hand: '手牌',
    hands: '手牌',
    card: '牌',
    cards: '牌',
    deck: '牌组',
    flop: '翻牌',
    turn: '转牌',
    river: '河牌',
    preflop: '翻牌前',
    postflop: '翻牌后',
    pot: '底池',
    stack: '筹码',
    blinds: '盲注',
    smallBlind: '小盲',
    bigBlind: '大盲',
    ante: '前注',
    position: '位置',
    inPosition: '有位置',
    outOfPosition: '无位置',

    // Hand categories
    pocketPair: '口袋对',
    suited: '同花',
    offsuit: '杂色',
    connector: '连牌',
    gapper: '缺口牌',

    // Hand strengths
    highCard: '高牌',
    pair: '一对',
    twoPair: '两对',
    threeOfAKind: '三条',
    straight: '顺子',
    flush: '同花',
    fullHouse: '葫芦',
    fourOfAKind: '四条',
    straightFlush: '同花顺',
    royalFlush: '皇家同花顺',
  },

  // Membership
  membership: {
    free: '免费版',
    premium: '高级版',
    pro: '专业版',
    unlimited: '无限制',
    currentPlan: '当前计划',
    upgradePlan: '升级计划',
    features: '功能',

    // Features
    basicRanges: '基础范围',
    allRanges: '所有范围',
    practiceMode: '练习模式',
    handAnalyzer: '手牌分析器',
    advancedStats: '高级统计',
    prioritySupport: '优先支持',
  },

  // Error messages
  errors: {
    genericError: '出了点问题，请重试。',
    networkError: '网络错误，请检查你的连接。',
    authError: '认证失败，请重新登录。',
    notFound: '页面未找到。',
    serverError: '服务器错误，请稍后重试。',
    invalidInput: '输入无效，请检查你的数据。',
  },
};
