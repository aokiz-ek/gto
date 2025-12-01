import { NextRequest, NextResponse } from 'next/server';

// Course types
type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type CourseCategory = 'preflop' | 'postflop' | 'tournament' | 'mental_game';
type LessonType = 'theory' | 'quiz' | 'practice' | 'video';

interface Quiz {
  id: string;
  question: string;
  questionZh: string;
  options: { label: string; labelZh: string; isCorrect: boolean }[];
  explanation: string;
  explanationZh: string;
}

interface Lesson {
  id: string;
  title: string;
  titleZh: string;
  type: LessonType;
  duration: number; // minutes
  content?: string;
  contentZh?: string;
  quizzes?: Quiz[];
  practiceConfig?: {
    scenario: string;
    questionCount: number;
    targetAccuracy: number;
  };
}

interface Module {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  lessons: Lesson[];
  unlockRequirement?: {
    moduleId: string;
    completionPercent: number;
  };
}

interface Course {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  level: CourseLevel;
  category: CourseCategory;
  estimatedHours: number;
  modules: Module[];
  prerequisites?: string[];
  objectives: { en: string; zh: string }[];
  tags: string[];
  isFree: boolean;
}

// Course level labels
const LEVEL_LABELS: Record<CourseLevel, { en: string; zh: string; color: string }> = {
  beginner: { en: 'Beginner', zh: '入门', color: '#22c55e' },
  intermediate: { en: 'Intermediate', zh: '进阶', color: '#3b82f6' },
  advanced: { en: 'Advanced', zh: '高级', color: '#a855f7' },
  expert: { en: 'Expert', zh: '专家', color: '#ef4444' },
};

// Category labels
const CATEGORY_LABELS: Record<CourseCategory, { en: string; zh: string; icon: string }> = {
  preflop: { en: 'Preflop', zh: '翻牌前', icon: '🃏' },
  postflop: { en: 'Postflop', zh: '翻牌后', icon: '🎯' },
  tournament: { en: 'Tournament', zh: '锦标赛', icon: '🏆' },
  mental_game: { en: 'Mental Game', zh: '心态', icon: '🧠' },
};

// Generate courses database
function generateCourses(): Course[] {
  return [
    // Beginner Preflop Course
    {
      id: 'preflop-fundamentals',
      title: 'Preflop Fundamentals',
      titleZh: '翻牌前基础',
      description: 'Master the basics of preflop play including starting hand selection, position, and basic opening ranges.',
      descriptionZh: '掌握翻牌前基础知识，包括起手牌选择、位置优势和基本开池范围。',
      level: 'beginner',
      category: 'preflop',
      estimatedHours: 3,
      isFree: true,
      tags: ['preflop', 'position', 'ranges', 'fundamentals'],
      objectives: [
        { en: 'Understand position advantage', zh: '理解位置优势' },
        { en: 'Learn basic opening ranges', zh: '学习基本开池范围' },
        { en: 'Know which hands to play', zh: '知道哪些牌可以玩' },
        { en: 'Avoid common beginner mistakes', zh: '避免常见新手错误' },
      ],
      modules: [
        {
          id: 'position-basics',
          title: 'Position Basics',
          titleZh: '位置基础',
          description: 'Learn why position is the most important concept in poker.',
          descriptionZh: '了解为什么位置是扑克中最重要的概念。',
          lessons: [
            {
              id: 'what-is-position',
              title: 'What is Position?',
              titleZh: '什么是位置？',
              type: 'theory',
              duration: 10,
              contentZh: `# 位置基础

## 什么是位置？

在德州扑克中，**位置**指的是你相对于庄家按钮的座位位置。位置决定了你在每轮下注中行动的顺序。

## 为什么位置重要？

1. **信息优势** - 后行动的玩家可以看到对手先行动
2. **控制底池** - 可以决定是否增大或控制底池
3. **诈唬机会** - 更容易识别诈唬机会
4. **价值最大化** - 更容易从强牌中获取价值

## 位置分类

### 前位 (Early Position)
- UTG (Under the Gun) - 枪口位
- UTG+1

### 中位 (Middle Position)
- MP (Middle Position)
- HJ (Hijack) - 劫位

### 后位 (Late Position)
- CO (Cutoff) - 切位
- BTN (Button) - 按钮位

### 盲注位
- SB (Small Blind) - 小盲位
- BB (Big Blind) - 大盲位

## 黄金法则

> "当有疑问时，位置越靠后，可以玩的牌越宽。"

在按钮位(BTN)，你可以玩约40%的起手牌。
在枪口位(UTG)，你只应该玩约15%的最强牌。`,
            },
            {
              id: 'position-quiz-1',
              title: 'Position Quiz',
              titleZh: '位置测验',
              type: 'quiz',
              duration: 5,
              quizzes: [
                {
                  id: 'q1',
                  question: 'Which position acts last after the flop?',
                  questionZh: '翻牌后哪个位置最后行动？',
                  options: [
                    { label: 'Big Blind', labelZh: '大盲位', isCorrect: false },
                    { label: 'Small Blind', labelZh: '小盲位', isCorrect: false },
                    { label: 'Button', labelZh: '按钮位', isCorrect: true },
                    { label: 'UTG', labelZh: '枪口位', isCorrect: false },
                  ],
                  explanation: 'The Button acts last on all postflop streets.',
                  explanationZh: '按钮位在所有翻牌后街道最后行动。',
                },
                {
                  id: 'q2',
                  question: 'Why is position an advantage?',
                  questionZh: '为什么位置是优势？',
                  options: [
                    { label: 'You get better cards', labelZh: '你会拿到更好的牌', isCorrect: false },
                    { label: 'You can see opponents act first', labelZh: '你可以先看到对手行动', isCorrect: true },
                    { label: 'You pay less blinds', labelZh: '你付更少盲注', isCorrect: false },
                    { label: 'The dealer is your friend', labelZh: '庄家是你朋友', isCorrect: false },
                  ],
                  explanation: 'Position lets you see your opponents act before you decide.',
                  explanationZh: '位置让你在做决定前先看到对手的行动。',
                },
              ],
            },
            {
              id: 'position-practice',
              title: 'Position Practice',
              titleZh: '位置练习',
              type: 'practice',
              duration: 15,
              practiceConfig: {
                scenario: 'rfi',
                questionCount: 20,
                targetAccuracy: 70,
              },
            },
          ],
        },
        {
          id: 'starting-hands',
          title: 'Starting Hand Selection',
          titleZh: '起手牌选择',
          description: 'Learn which hands to play and which to fold.',
          descriptionZh: '学习哪些牌可以玩，哪些应该弃掉。',
          lessons: [
            {
              id: 'hand-categories',
              title: 'Hand Categories',
              titleZh: '手牌分类',
              type: 'theory',
              duration: 12,
              contentZh: `# 起手牌分类

## 手牌类型

### 对子 (Pocket Pairs)
- **高对**: AA, KK, QQ - 最强起手牌
- **中对**: JJ, TT, 99, 88 - 强牌但需要谨慎
- **小对**: 77-22 - 主要打暗三

### 同花牌 (Suited Hands)
- **同花A**: AKs, AQs, AJs... - 同花A非常有价值
- **同花连张**: KQs, QJs, JTs, T9s... - 有很好的成牌潜力
- **同花小连张**: 98s, 87s, 76s... - 投机牌

### 非同花牌 (Offsuit Hands)
- **大牌**: AKo, AQo, KQo - 可以玩但不如同花
- **弱牌**: K9o, Q8o... - 通常应该弃掉

## 评估手牌价值

### 考虑因素
1. **牌力**: 对子 > 同花 > 非同花
2. **连接性**: 连续的牌更容易成顺
3. **高牌**: 包含A或K更有价值
4. **同花**: 同花可以成同花

## 实用技巧

> "如果不确定一手牌能不能玩，问问自己：这手牌在这个位置能不能打败对手的跟注/加注范围？"`,
            },
            {
              id: 'hands-quiz',
              title: 'Hand Selection Quiz',
              titleZh: '手牌选择测验',
              type: 'quiz',
              duration: 5,
              quizzes: [
                {
                  id: 'hq1',
                  question: 'Which hand is stronger preflop?',
                  questionZh: '哪手牌翻前更强？',
                  options: [
                    { label: 'AKs', labelZh: 'AKs', isCorrect: false },
                    { label: 'QQ', labelZh: 'QQ', isCorrect: true },
                    { label: 'JTs', labelZh: 'JTs', isCorrect: false },
                    { label: 'AQo', labelZh: 'AQo', isCorrect: false },
                  ],
                  explanation: 'QQ is a made hand and beats AK preflop about 55% of the time.',
                  explanationZh: 'QQ是成手牌，翻前对阵AK约55%胜率。',
                },
                {
                  id: 'hq2',
                  question: 'Why is AKs better than AKo?',
                  questionZh: '为什么AKs比AKo好？',
                  options: [
                    { label: 'Higher straight potential', labelZh: '顺子潜力更高', isCorrect: false },
                    { label: 'Can make flushes', labelZh: '可以成同花', isCorrect: true },
                    { label: 'Better against pairs', labelZh: '对抗对子更强', isCorrect: false },
                    { label: 'Easier to play', labelZh: '更容易打', isCorrect: false },
                  ],
                  explanation: 'Suited hands can make flushes, adding about 3% equity.',
                  explanationZh: '同花牌可以成同花，增加约3%的权益。',
                },
              ],
            },
          ],
        },
        {
          id: 'opening-ranges',
          title: 'Opening Ranges',
          titleZh: '开池范围',
          description: 'Learn GTO opening ranges for each position.',
          descriptionZh: '学习每个位置的GTO开池范围。',
          lessons: [
            {
              id: 'rfi-basics',
              title: 'Raise First In (RFI)',
              titleZh: '率先加注(RFI)',
              type: 'theory',
              duration: 15,
              contentZh: `# 开池范围 (RFI)

## 什么是RFI？

**RFI (Raise First In)** 是指在你之前没有人加注时，你选择加注进入底池。

## 各位置开池范围

### UTG (枪口位) - 约15%
- 对子: 22+
- 同花: ATs+, KQs, QJs, JTs
- 非同花: AQo+

### HJ (劫位) - 约20%
- 对子: 22+
- 同花: A2s+, KTs+, QTs+, JTs, T9s
- 非同花: AJo+, KQo

### CO (切位) - 约28%
- 对子: 22+
- 同花: A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+
- 非同花: ATo+, KJo+, QJo

### BTN (按钮位) - 约45%
- 对子: 22+
- 同花: A2s+, K2s+, Q2s+, J5s+, T6s+, 96s+, 86s+, 75s+, 65s, 54s
- 非同花: A2o+, K7o+, Q9o+, J9o+, T9o

### SB (小盲位) - 约40%
- 类似BTN但稍紧，因为大盲还在后面

## 开池尺度

- **标准**: 2.5BB
- **后位**: 2-2.5BB
- **前位**: 2.5-3BB

## 记忆技巧

> "位置越靠后，范围越宽。BTN是全桌最宽的开池位置。"`,
            },
            {
              id: 'rfi-practice',
              title: 'RFI Practice',
              titleZh: 'RFI练习',
              type: 'practice',
              duration: 20,
              practiceConfig: {
                scenario: 'rfi',
                questionCount: 30,
                targetAccuracy: 75,
              },
            },
          ],
        },
      ],
    },

    // Intermediate 3-Bet Course
    {
      id: '3bet-mastery',
      title: '3-Bet Mastery',
      titleZh: '3-Bet进阶',
      description: 'Learn when and how to 3-bet effectively for value and as a bluff.',
      descriptionZh: '学习何时以及如何有效地进行价值3-Bet和诈唬3-Bet。',
      level: 'intermediate',
      category: 'preflop',
      estimatedHours: 4,
      isFree: false,
      prerequisites: ['preflop-fundamentals'],
      tags: ['3bet', 'aggression', 'ranges', 'bluffing'],
      objectives: [
        { en: 'Understand 3-bet ranges by position', zh: '理解不同位置的3-Bet范围' },
        { en: 'Learn value vs bluff 3-bets', zh: '区分价值3-Bet和诈唬3-Bet' },
        { en: 'Master 3-bet sizing', zh: '掌握3-Bet尺度' },
        { en: 'Handle 4-bets correctly', zh: '正确应对4-Bet' },
      ],
      modules: [
        {
          id: '3bet-fundamentals',
          title: '3-Bet Fundamentals',
          titleZh: '3-Bet基础',
          description: 'Core concepts of 3-betting.',
          descriptionZh: '3-Bet的核心概念。',
          lessons: [
            {
              id: 'why-3bet',
              title: 'Why 3-Bet?',
              titleZh: '为什么要3-Bet？',
              type: 'theory',
              duration: 12,
              contentZh: `# 3-Bet的目的

## 什么是3-Bet？

**3-Bet**是指在有人加注后的再加注。

- 1-Bet: 大盲强制下注
- 2-Bet: 第一个加注（开池加注）
- 3-Bet: 对加注的再加注

## 3-Bet的目的

### 1. 价值3-Bet
用强牌3-Bet获取价值：
- AA, KK, QQ, AK等
- 对手跟注或4-Bet时你有最好的牌

### 2. 诈唬3-Bet
用投机牌3-Bet作为诈唬：
- 小同花A (A5s, A4s等)
- 同花连张 (87s, 76s等)
- 目标是让对手弃牌

### 3. 隔离
在多人底池中3-Bet隔离弱玩家

### 4. 位置优势
在有位置时3-Bet可以获得主动权

## 3-Bet的好处

1. **增大底池** - 用强牌赢更多
2. **减少对手** - 赶走边缘牌
3. **保持范围平衡** - 让对手难以判断
4. **抢夺主动权** - 成为进攻方`,
            },
            {
              id: '3bet-ranges',
              title: '3-Bet Ranges',
              titleZh: '3-Bet范围',
              type: 'theory',
              duration: 15,
              contentZh: `# 3-Bet范围详解

## 价值3-Bet范围

根据对手开池位置调整：

### vs UTG开池 (紧)
- QQ+, AKs, AKo

### vs CO开池 (中等)
- JJ+, AQs+, AKo

### vs BTN开池 (宽)
- TT+, AJs+, AQo+, KQs

## 诈唬3-Bet范围

选择有阻隔效应和后门权益的牌：

### 好的诈唬3-Bet
- A5s, A4s, A3s (阻隔AA, 同花可能)
- 87s, 76s (后门顺子和同花)
- K5s, Q5s (阻隔大对子)

### 不好的诈唬3-Bet
- K9o, Q8o (缺乏权益)
- 小对子 (对手4-Bet时很难打)

## 3-Bet尺度

### 有位置
- 原加注的3倍

### 没有位置
- 原加注的3.5-4倍

### vs 3x开池
- 有位置: 9BB
- 无位置: 10-12BB`,
            },
          ],
        },
        {
          id: 'facing-3bet',
          title: 'Facing 3-Bets',
          titleZh: '面对3-Bet',
          description: 'How to respond when you get 3-bet.',
          descriptionZh: '当被3-Bet时如何应对。',
          unlockRequirement: {
            moduleId: '3bet-fundamentals',
            completionPercent: 50,
          },
          lessons: [
            {
              id: 'vs-3bet-theory',
              title: 'Defending vs 3-Bets',
              titleZh: '3-Bet防守策略',
              type: 'theory',
              duration: 15,
              contentZh: `# 面对3-Bet的策略

## 决策框架

当被3-Bet时，你有三个选择：
1. **弃牌** - 放弃底池
2. **跟注** - 看翻牌
3. **4-Bet** - 再加注

## 影响因素

### 1. 你的手牌
- 最强的牌(QQ+, AK): 4-Bet
- 中等牌(TT-QQ, AQ): 跟注
- 弱牌: 弃牌

### 2. 位置
- 有位置: 可以更宽地跟注
- 无位置: 范围要更紧

### 3. 对手类型
- 紧手: 只用最强牌跟注
- 激进玩家: 可以宽跟或4-Bet诈唬

## 常见错误

### 错误1: 跟注太多边缘牌
KJo, QTo这类牌面对3-Bet应该弃牌

### 错误2: 小对子跟注
22-66面对3-Bet通常应该弃牌

### 错误3: 4-Bet过少
QQ+应该经常4-Bet而不是只跟注`,
            },
            {
              id: 'vs-3bet-practice',
              title: 'vs 3-Bet Practice',
              titleZh: '面对3-Bet练习',
              type: 'practice',
              duration: 20,
              practiceConfig: {
                scenario: 'vs_3bet',
                questionCount: 25,
                targetAccuracy: 70,
              },
            },
          ],
        },
      ],
    },

    // Postflop C-Bet Course
    {
      id: 'cbet-strategy',
      title: 'C-Bet Strategy',
      titleZh: 'C-Bet策略',
      description: 'Master continuation betting on different board textures.',
      descriptionZh: '掌握不同牌面质地的持续下注策略。',
      level: 'intermediate',
      category: 'postflop',
      estimatedHours: 5,
      isFree: false,
      tags: ['cbet', 'postflop', 'board-texture', 'sizing'],
      objectives: [
        { en: 'Understand board textures', zh: '理解牌面质地' },
        { en: 'Learn when to c-bet', zh: '知道何时C-Bet' },
        { en: 'Master c-bet sizing', zh: '掌握C-Bet尺度' },
        { en: 'Handle check-raises', zh: '应对过牌加注' },
      ],
      modules: [
        {
          id: 'board-texture',
          title: 'Board Texture Analysis',
          titleZh: '牌面质地分析',
          description: 'Learn to read board textures.',
          descriptionZh: '学习解读牌面质地。',
          lessons: [
            {
              id: 'texture-types',
              title: 'Board Texture Types',
              titleZh: '牌面质地类型',
              type: 'theory',
              duration: 15,
              contentZh: `# 牌面质地分类

## 干燥面 (Dry Board)

### 特征
- 没有同花听牌
- 没有顺子听牌
- 牌面分散

### 例子
- K72r (彩虹)
- A83r
- Q52r

### C-Bet策略
- 频率高 (70-80%)
- 尺度小 (25-33%)
- 范围宽

## 湿润面 (Wet Board)

### 特征
- 同花听牌可能
- 顺子听牌可能
- 牌面连接

### 例子
- Jh Th 8h (单花面)
- 9 8 7 (连接面)
- Ks Qs 5s (同花听牌)

### C-Bet策略
- 频率中等 (50-60%)
- 尺度大 (66-75%)
- 范围紧

## 单花面 (Monotone)

### 特征
- 三张同花

### C-Bet策略
- 需要同花阻隔牌
- 没有同花时多过牌
- 有坚果同花听牌激进下注`,
            },
            {
              id: 'texture-quiz',
              title: 'Board Texture Quiz',
              titleZh: '牌面质地测验',
              type: 'quiz',
              duration: 8,
              quizzes: [
                {
                  id: 'tq1',
                  question: 'Which board is considered "dry"?',
                  questionZh: '哪个牌面被认为是"干燥面"？',
                  options: [
                    { label: 'Jh Th 8h', labelZh: 'Jh Th 8h', isCorrect: false },
                    { label: 'Ks 7d 2c', labelZh: 'Ks 7d 2c', isCorrect: true },
                    { label: '9s 8s 7d', labelZh: '9s 8s 7d', isCorrect: false },
                    { label: 'Qh Jh 5h', labelZh: 'Qh Jh 5h', isCorrect: false },
                  ],
                  explanation: 'K72 rainbow is a dry board with no flush or straight draws.',
                  explanationZh: 'K72彩虹是干燥面，没有同花或顺子听牌。',
                },
                {
                  id: 'tq2',
                  question: 'What c-bet size is best on a dry board?',
                  questionZh: '在干燥面上最佳的C-Bet尺度是？',
                  options: [
                    { label: '25-33% pot', labelZh: '底池的25-33%', isCorrect: true },
                    { label: '66-75% pot', labelZh: '底池的66-75%', isCorrect: false },
                    { label: 'Full pot', labelZh: '全底池', isCorrect: false },
                    { label: 'Never c-bet', labelZh: '从不C-Bet', isCorrect: false },
                  ],
                  explanation: 'Small c-bets on dry boards are more efficient.',
                  explanationZh: '在干燥面上小尺度C-Bet更有效率。',
                },
              ],
            },
          ],
        },
        {
          id: 'cbet-sizing',
          title: 'C-Bet Sizing',
          titleZh: 'C-Bet尺度',
          description: 'Master c-bet sizing for different situations.',
          descriptionZh: '掌握不同情况下的C-Bet尺度。',
          lessons: [
            {
              id: 'sizing-theory',
              title: 'C-Bet Sizing Theory',
              titleZh: 'C-Bet尺度理论',
              type: 'theory',
              duration: 12,
              contentZh: `# C-Bet尺度选择

## 尺度选择原则

### 小尺度 (25-33% pot)
**适用场景:**
- 干燥面
- 范围优势明显
- 希望多频率下注

**例子:**
在K72r上，你有范围优势，可以用33%下注让对手难以弃牌且你仍然获利。

### 中尺度 (50% pot)
**适用场景:**
- 中等湿润度牌面
- 需要保护边缘价值

### 大尺度 (66-75% pot)
**适用场景:**
- 湿润面
- 需要收取死钱
- 阻止对手看便宜牌

## 尺度与范围

### 范围下注 vs 极化下注
- **范围下注**: 小尺度，高频率
- **极化下注**: 大尺度，低频率

## 实战技巧

1. 不要总用同一尺度
2. 根据牌面调整
3. 考虑对手弃牌频率
4. SPR影响尺度选择`,
            },
            {
              id: 'cbet-practice',
              title: 'C-Bet Practice',
              titleZh: 'C-Bet练习',
              type: 'practice',
              duration: 20,
              practiceConfig: {
                scenario: 'cbet_ip',
                questionCount: 25,
                targetAccuracy: 70,
              },
            },
          ],
        },
      ],
    },

    // Advanced River Play Course
    {
      id: 'river-mastery',
      title: 'River Mastery',
      titleZh: '河牌决策精通',
      description: 'Master the most critical street in poker with advanced river strategies.',
      descriptionZh: '掌握扑克中最关键的街道，学习高级河牌策略。',
      level: 'advanced',
      category: 'postflop',
      estimatedHours: 6,
      isFree: false,
      prerequisites: ['cbet-strategy'],
      tags: ['river', 'value-betting', 'bluffing', 'advanced'],
      objectives: [
        { en: 'Master river value betting', zh: '掌握河牌价值下注' },
        { en: 'Learn optimal bluffing frequency', zh: '学习最优诈唬频率' },
        { en: 'Handle river decisions correctly', zh: '正确处理河牌决策' },
        { en: 'Understand blockers and unblockers', zh: '理解阻隔牌效应' },
      ],
      modules: [
        {
          id: 'river-value',
          title: 'River Value Betting',
          titleZh: '河牌价值下注',
          description: 'Extract maximum value on the river.',
          descriptionZh: '在河牌最大化榨取价值。',
          lessons: [
            {
              id: 'value-theory',
              title: 'Value Betting Theory',
              titleZh: '价值下注理论',
              type: 'theory',
              duration: 15,
              contentZh: `# 河牌价值下注

## 核心概念

河牌是最重要的决策点，因为：
1. **底池最大** - 所有筹码都投入了
2. **没有发牌** - 不再有改变
3. **最终决战** - 决定谁赢

## 价值下注条件

### 基本条件
你需要被更差的牌跟注超过50%的时间

### 考虑因素
1. **对手范围** - 他们有什么牌？
2. **你的牌力** - 能打败什么？
3. **牌面** - 有多少强牌组合？

## 薄价值下注

### 定义
用中等强度的牌下注价值

### 例子
- 在K82A4上用AQ下注
- 对手可能有KJ, KT, 甚至AT跟注

### 风险
- 可能被加注
- 需要准确读人

## 尺度选择

### 大尺度 (75-100%)
- 坚果牌
- 想被跟注

### 小尺度 (33-50%)
- 薄价值
- 诱导跟注`,
            },
            {
              id: 'value-quiz',
              title: 'Value Betting Quiz',
              titleZh: '价值下注测验',
              type: 'quiz',
              duration: 8,
              quizzes: [
                {
                  id: 'vq1',
                  question: 'When should you value bet thin on the river?',
                  questionZh: '什么时候应该在河牌薄价值下注？',
                  options: [
                    { label: 'When you have the nuts', labelZh: '当你有坚果牌', isCorrect: false },
                    { label: 'When worse hands will call >50%', labelZh: '当更差的牌会跟注>50%', isCorrect: true },
                    { label: 'Always bet for value', labelZh: '总是价值下注', isCorrect: false },
                    { label: 'Never thin value bet', labelZh: '从不薄价值下注', isCorrect: false },
                  ],
                  explanation: 'Thin value bets require worse hands to call more than half the time.',
                  explanationZh: '薄价值下注需要更差的牌在超过一半的时间跟注。',
                },
              ],
            },
          ],
        },
        {
          id: 'river-bluff',
          title: 'River Bluffing',
          titleZh: '河牌诈唬',
          description: 'Learn when and how to bluff the river.',
          descriptionZh: '学习何时以及如何在河牌诈唬。',
          lessons: [
            {
              id: 'bluff-theory',
              title: 'River Bluffing Theory',
              titleZh: '河牌诈唬理论',
              type: 'theory',
              duration: 15,
              contentZh: `# 河牌诈唬

## 为什么要诈唬？

1. **平衡范围** - 防止对手只跟价值牌
2. **盈利机会** - 对手弃牌时直接获利
3. **表演形象** - 建立激进形象

## 选择诈唬牌

### 好的诈唬牌
- **错失听牌** - 没成的同花/顺子听牌
- **阻隔牌** - 阻隔对手的强牌
- **无摊牌价值** - 不能赢过任何牌

### 阻隔牌效应
- 有As时诈唬在同花面
- 有4连张阻隔牌诈唬在顺子面

## 诈唬频率

### GTO比例
- 价值:诈唬比例取决于下注尺度
- 1:1底池下注 → 2:1 价值:诈唬
- 0.5:1底池下注 → 3:1 价值:诈唬

## 常见错误

1. **过度诈唬** - 诈唬太频繁
2. **不当诈唬牌选择** - 用有摊牌价值的牌诈唬
3. **忽略阻隔牌** - 没考虑阻隔效应`,
            },
          ],
        },
      ],
    },

    // Tournament Strategy Course
    {
      id: 'mtt-strategy',
      title: 'MTT Strategy Fundamentals',
      titleZh: 'MTT锦标赛策略',
      description: 'Learn how to adjust your strategy for multi-table tournaments.',
      descriptionZh: '学习如何在多桌锦标赛中调整策略。',
      level: 'intermediate',
      category: 'tournament',
      estimatedHours: 5,
      isFree: false,
      tags: ['tournament', 'mtt', 'icm', 'bubble'],
      objectives: [
        { en: 'Understand tournament dynamics', zh: '理解锦标赛动态' },
        { en: 'Learn ICM basics', zh: '学习ICM基础' },
        { en: 'Master bubble play', zh: '掌握泡沫期策略' },
        { en: 'Adjust for stack sizes', zh: '根据筹码量调整' },
      ],
      modules: [
        {
          id: 'mtt-basics',
          title: 'Tournament Basics',
          titleZh: '锦标赛基础',
          description: 'Fundamental concepts for MTT play.',
          descriptionZh: '多桌锦标赛的基本概念。',
          lessons: [
            {
              id: 'mtt-intro',
              title: 'MTT Introduction',
              titleZh: 'MTT入门',
              type: 'theory',
              duration: 12,
              contentZh: `# 多桌锦标赛基础

## MTT vs 现金局

### 关键区别
1. **筹码不能兑换** - 筹码 ≠ 金钱
2. **盲注递增** - 必须不断赢筹码
3. **淘汰机制** - 输光即出局
4. **奖金结构** - 最终桌奖金最丰厚

## 锦标赛阶段

### 早期 (>50BB)
- 打法类似现金局
- 保守积累筹码
- 避免边缘全下

### 中期 (25-50BB)
- 开始调整范围
- 位置更重要
- 3-Bet更激进

### 后期 (<25BB)
- Push/Fold策略
- ICM影响加大
- 生存比筹码重要

## 筹码量概念

### M值
M = 筹码 / (小盲 + 大盲 + 前注)

- M>20: 正常打法
- M 10-20: 收紧范围
- M 5-10: Push/Fold开始
- M<5: 纯Push/Fold`,
            },
            {
              id: 'stack-quiz',
              title: 'Stack Size Quiz',
              titleZh: '筹码量测验',
              type: 'quiz',
              duration: 5,
              quizzes: [
                {
                  id: 'sq1',
                  question: 'At what M-value should you consider push/fold?',
                  questionZh: '在什么M值时应该考虑Push/Fold？',
                  options: [
                    { label: 'M > 20', labelZh: 'M > 20', isCorrect: false },
                    { label: 'M 15-20', labelZh: 'M 15-20', isCorrect: false },
                    { label: 'M < 10', labelZh: 'M < 10', isCorrect: true },
                    { label: 'Any M value', labelZh: '任何M值', isCorrect: false },
                  ],
                  explanation: 'When M drops below 10, push/fold becomes optimal.',
                  explanationZh: '当M低于10时，Push/Fold变得最优。',
                },
              ],
            },
          ],
        },
        {
          id: 'icm-basics',
          title: 'ICM Fundamentals',
          titleZh: 'ICM基础',
          description: 'Learn Independent Chip Model basics.',
          descriptionZh: '学习独立筹码模型基础。',
          lessons: [
            {
              id: 'icm-theory',
              title: 'What is ICM?',
              titleZh: '什么是ICM？',
              type: 'theory',
              duration: 15,
              contentZh: `# ICM独立筹码模型

## 什么是ICM？

**ICM (Independent Chip Model)** 是将锦标赛筹码转换为实际美元价值的模型。

## 核心概念

### 筹码不等于金钱
- 1000筹码的第一名价值 ≠ 两个500筹码
- 筹码越多，每个筹码价值越低

### ICM压力
- 淘汰的损失 > 赢筹码的收益
- 接近钱圈时尤为明显

## 泡沫期策略

### 大筹码
- 可以施压小筹码
- 激进开池

### 中等筹码
- 避免对抗大筹码
- 等待好机会

### 小筹码
- 寻找翻倍机会
- 利用其他小筹码的恐惧

## ICM调整

### 应该更紧的情况
- 泡沫期
- 最终桌早期
- 有小筹码在其他桌

### 可以更松的情况
- 远离钱圈
- 筹码领先者`,
            },
          ],
        },
      ],
    },

    // Mental Game Course
    {
      id: 'mental-game',
      title: 'Mental Game Mastery',
      titleZh: '心态修炼',
      description: 'Master the mental aspects of poker to play your A-game consistently.',
      descriptionZh: '掌握扑克的心理层面，持续发挥最佳状态。',
      level: 'beginner',
      category: 'mental_game',
      estimatedHours: 3,
      isFree: true,
      tags: ['mental', 'tilt', 'bankroll', 'mindset'],
      objectives: [
        { en: 'Control tilt', zh: '控制上头' },
        { en: 'Manage bankroll', zh: '管理资金' },
        { en: 'Develop winning mindset', zh: '培养赢家心态' },
        { en: 'Handle variance', zh: '应对波动' },
      ],
      modules: [
        {
          id: 'tilt-control',
          title: 'Tilt Control',
          titleZh: '上头控制',
          description: 'Learn to manage your emotions at the table.',
          descriptionZh: '学习在牌桌上管理情绪。',
          lessons: [
            {
              id: 'tilt-types',
              title: 'Understanding Tilt',
              titleZh: '理解上头',
              type: 'theory',
              duration: 12,
              contentZh: `# 理解和控制上头

## 什么是上头(Tilt)？

上头是指情绪影响你的决策质量。

## 上头类型

### 1. 愤怒型上头
- 被Bad Beat触发
- 输给"鱼"时生气
- 表现：激进、报复性加注

### 2. 沮丧型上头
- 连续输牌后
- 感觉运气不好
- 表现：放弃、消极玩法

### 3. 兴奋型上头
- 赢大底池后
- 过于自信
- 表现：玩太多牌

### 4. 疲劳型上头
- 长时间打牌
- 注意力下降
- 表现：懒惰决策

## 控制策略

### 认识触发点
1. 记录触发你上头的情况
2. 设置止损线
3. 规定休息时间

### 即时控制
- 深呼吸
- 暂时离桌
- 回顾决策过程

### 长期方法
- 冥想练习
- 规律作息
- 健康生活`,
            },
            {
              id: 'tilt-quiz',
              title: 'Tilt Quiz',
              titleZh: '上头测验',
              type: 'quiz',
              duration: 5,
              quizzes: [
                {
                  id: 'tlq1',
                  question: 'What should you do when you feel tilted?',
                  questionZh: '当你感觉上头时应该怎么做？',
                  options: [
                    { label: 'Play more hands to recover', labelZh: '多玩牌来恢复', isCorrect: false },
                    { label: 'Move up stakes to win back faster', labelZh: '升级来更快赢回', isCorrect: false },
                    { label: 'Take a break from the table', labelZh: '离开牌桌休息', isCorrect: true },
                    { label: 'Play tighter and wait', labelZh: '打紧等待', isCorrect: false },
                  ],
                  explanation: 'Taking a break is the best way to reset your mental state.',
                  explanationZh: '休息是重置心理状态的最佳方式。',
                },
              ],
            },
          ],
        },
        {
          id: 'bankroll',
          title: 'Bankroll Management',
          titleZh: '资金管理',
          description: 'Protect your poker bankroll.',
          descriptionZh: '保护你的扑克资金。',
          lessons: [
            {
              id: 'brm-basics',
              title: 'Bankroll Basics',
              titleZh: '资金管理基础',
              type: 'theory',
              duration: 10,
              contentZh: `# 资金管理基础

## 为什么资金管理重要？

1. **波动是正常的** - 即使赢家也会输
2. **避免破产** - 保护你的扑克生涯
3. **心理稳定** - 不担心输赢

## 推荐资金量

### 现金局
- 保守: 30-50个买入
- 激进: 20个买入

### 锦标赛
- 保守: 100-200个买入
- 激进: 50个买入

## 资金规则

### 升级条件
- 达到目标资金量
- 长期盈利证明
- 心理准备好

### 降级条件
- 资金低于阈值
- 连续大输
- 状态不好

## 实用建议

1. **分开资金** - 扑克钱和生活费分开
2. **记录跟踪** - 知道自己的盈亏
3. **诚实面对** - 承认能力边界
4. **慢慢来** - 不要急于升级`,
            },
          ],
        },
      ],
    },
  ];
}

// Cache courses
let cachedCourses: Course[] | null = null;

function getCourses(): Course[] {
  if (!cachedCourses) {
    cachedCourses = generateCourses();
  }
  return cachedCourses;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const courseId = searchParams.get('id');
    const level = searchParams.get('level') as CourseLevel | null;
    const category = searchParams.get('category') as CourseCategory | null;
    const freeOnly = searchParams.get('free') === 'true';

    let courses = getCourses();

    // Get single course by ID
    if (courseId) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        return NextResponse.json({
          success: true,
          course,
          labels: {
            levels: LEVEL_LABELS,
            categories: CATEGORY_LABELS,
          },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Filter courses
    if (level) {
      courses = courses.filter(c => c.level === level);
    }
    if (category) {
      courses = courses.filter(c => c.category === category);
    }
    if (freeOnly) {
      courses = courses.filter(c => c.isFree);
    }

    // Return course list (without full content)
    const courseList = courses.map(c => ({
      id: c.id,
      title: c.title,
      titleZh: c.titleZh,
      description: c.description,
      descriptionZh: c.descriptionZh,
      level: c.level,
      category: c.category,
      estimatedHours: c.estimatedHours,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      objectives: c.objectives,
      tags: c.tags,
      isFree: c.isFree,
    }));

    return NextResponse.json({
      success: true,
      total: courseList.length,
      courses: courseList,
      labels: {
        levels: LEVEL_LABELS,
        categories: CATEGORY_LABELS,
      },
    });
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json(
      { success: false, error: '获取课程失败' },
      { status: 500 }
    );
  }
}
