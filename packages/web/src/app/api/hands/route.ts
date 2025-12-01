import { NextRequest, NextResponse } from 'next/server';

// Types
interface HandAuthor {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
}

interface HandAction {
  player: string;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
  isHero?: boolean;
}

interface HandStreet {
  name: 'preflop' | 'flop' | 'turn' | 'river';
  board?: string[];
  pot: number;
  actions: HandAction[];
}

interface SharedHand {
  id: string;
  title: string;
  description: string;
  author: HandAuthor;
  // Hand data
  heroHand: string[];
  heroPosition: string;
  blinds: string;
  effectiveStack: number;
  streets: HandStreet[];
  result: {
    won: boolean;
    amount: number;
    showdown: boolean;
  };
  // Analysis
  keyDecision?: {
    street: string;
    action: string;
    description: string;
    isCorrect?: boolean;
  };
  tags: string[];
  // Social
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HandComment {
  id: string;
  handId: string;
  author: HandAuthor;
  content: string;
  likes: number;
  createdAt: string;
  replies?: HandComment[];
}

// Mock shared hands data
const mockHands: SharedHand[] = [
  {
    id: 'hand-1',
    title: 'BTN vs BB 3-Bet Pot - 河牌困难决策',
    description: '我在BTN用AKo开池，BB 3-bet，我4-bet后他call。这手牌在河牌面临一个很困难的决策，想请教大家的看法。',
    author: {
      id: 'user-1',
      username: 'PokerMaster',
      level: 28,
      title: 'GTO专家',
    },
    heroHand: ['As', 'Kh'],
    heroPosition: 'BTN',
    blinds: '1/2',
    effectiveStack: 100,
    streets: [
      {
        name: 'preflop',
        pot: 3,
        actions: [
          { player: 'BTN', action: 'raise', amount: 5, isHero: true },
          { player: 'BB', action: 'raise', amount: 16 },
          { player: 'BTN', action: 'raise', amount: 42, isHero: true },
          { player: 'BB', action: 'call', amount: 26 },
        ],
      },
      {
        name: 'flop',
        board: ['Kd', '7c', '3s'],
        pot: 84,
        actions: [
          { player: 'BB', action: 'check' },
          { player: 'BTN', action: 'bet', amount: 28, isHero: true },
          { player: 'BB', action: 'call', amount: 28 },
        ],
      },
      {
        name: 'turn',
        board: ['Kd', '7c', '3s', '9h'],
        pot: 140,
        actions: [
          { player: 'BB', action: 'check' },
          { player: 'BTN', action: 'bet', amount: 65, isHero: true },
          { player: 'BB', action: 'call', amount: 65 },
        ],
      },
      {
        name: 'river',
        board: ['Kd', '7c', '3s', '9h', 'Qd'],
        pot: 270,
        actions: [
          { player: 'BB', action: 'bet', amount: 200 },
          { player: 'BTN', action: 'call', amount: 200, isHero: true },
        ],
      },
    ],
    result: {
      won: false,
      amount: -335,
      showdown: true,
    },
    keyDecision: {
      street: 'river',
      action: 'call',
      description: '河牌面对超池大注，我的顶对顶踢应该跟注还是弃牌？',
      isCorrect: false,
    },
    tags: ['3-Bet Pot', '河牌', 'AK', 'BTN vs BB'],
    likes: 42,
    comments: 18,
    views: 856,
    isHot: true,
    isFeatured: false,
    createdAt: '2025-11-28T10:30:00Z',
    updatedAt: '2025-11-29T08:15:00Z',
  },
  {
    id: 'hand-2',
    title: 'CO vs BTN - 翻牌Set的最优打法',
    description: '翻牌中了Set，但牌面比较连接，请问各位大神这种情况应该怎么最大化价值？',
    author: {
      id: 'user-2',
      username: 'SetMiner',
      level: 22,
      title: '深筹玩家',
    },
    heroHand: ['7s', '7h'],
    heroPosition: 'CO',
    blinds: '2/5',
    effectiveStack: 200,
    streets: [
      {
        name: 'preflop',
        pot: 7,
        actions: [
          { player: 'CO', action: 'raise', amount: 15, isHero: true },
          { player: 'BTN', action: 'call', amount: 15 },
        ],
      },
      {
        name: 'flop',
        board: ['7d', '8c', '9s'],
        pot: 37,
        actions: [
          { player: 'CO', action: 'bet', amount: 25, isHero: true },
          { player: 'BTN', action: 'raise', amount: 75 },
          { player: 'CO', action: 'call', amount: 50, isHero: true },
        ],
      },
      {
        name: 'turn',
        board: ['7d', '8c', '9s', '2h'],
        pot: 187,
        actions: [
          { player: 'CO', action: 'check', isHero: true },
          { player: 'BTN', action: 'bet', amount: 120 },
          { player: 'CO', action: 'raise', amount: 310, isHero: true },
          { player: 'BTN', action: 'all-in', amount: 600 },
          { player: 'CO', action: 'call', amount: 290, isHero: true },
        ],
      },
    ],
    result: {
      won: true,
      amount: 897,
      showdown: true,
    },
    keyDecision: {
      street: 'flop',
      action: 'call',
      description: '翻牌对手加注后，是否应该直接3-bet还是平跟等Turn再加注？',
    },
    tags: ['Set', '连接牌面', 'CO vs BTN', '深筹'],
    likes: 67,
    comments: 31,
    views: 1243,
    isHot: true,
    isFeatured: true,
    createdAt: '2025-11-27T14:20:00Z',
    updatedAt: '2025-11-29T06:30:00Z',
  },
  {
    id: 'hand-3',
    title: 'MTT泡沫期 - ICM压力下的推注决策',
    description: 'MTT即将进钱圈，面对大盲位的3-bet，我的口袋Q应该怎么处理？',
    author: {
      id: 'user-3',
      username: 'MTTGrinder',
      level: 35,
      title: 'MTT玩家',
    },
    heroHand: ['Qd', 'Qc'],
    heroPosition: 'HJ',
    blinds: '400/800/100',
    effectiveStack: 25,
    streets: [
      {
        name: 'preflop',
        pot: 2100,
        actions: [
          { player: 'HJ', action: 'raise', amount: 1600, isHero: true },
          { player: 'BB', action: 'raise', amount: 5200 },
          { player: 'HJ', action: 'all-in', amount: 20000, isHero: true },
          { player: 'BB', action: 'call', amount: 14800 },
        ],
      },
    ],
    result: {
      won: false,
      amount: -20000,
      showdown: true,
    },
    keyDecision: {
      street: 'preflop',
      action: 'all-in',
      description: '泡沫期25BB持有QQ面对3-bet，推还是弃？',
      isCorrect: true,
    },
    tags: ['MTT', 'ICM', '泡沫', 'QQ'],
    likes: 89,
    comments: 45,
    views: 2156,
    isHot: true,
    isFeatured: true,
    createdAt: '2025-11-26T09:45:00Z',
    updatedAt: '2025-11-28T20:00:00Z',
  },
  {
    id: 'hand-4',
    title: 'SB vs BB单挑 - 纯诈唬还是放弃？',
    description: '前位都弃牌后我在SB用边缘牌完成补盲，翻牌完全空气，这里的诈唬频率应该是多少？',
    author: {
      id: 'user-4',
      username: 'BluffMaster',
      level: 19,
    },
    heroHand: ['Jh', '6c'],
    heroPosition: 'SB',
    blinds: '1/2',
    effectiveStack: 100,
    streets: [
      {
        name: 'preflop',
        pot: 2,
        actions: [
          { player: 'SB', action: 'call', amount: 1, isHero: true },
          { player: 'BB', action: 'check' },
        ],
      },
      {
        name: 'flop',
        board: ['Ac', 'Kd', '8s'],
        pot: 4,
        actions: [
          { player: 'SB', action: 'check', isHero: true },
          { player: 'BB', action: 'bet', amount: 3 },
          { player: 'SB', action: 'raise', amount: 10, isHero: true },
          { player: 'BB', action: 'fold' },
        ],
      },
    ],
    result: {
      won: true,
      amount: 7,
      showdown: false,
    },
    keyDecision: {
      street: 'flop',
      action: 'raise',
      description: '这里check-raise作为诈唬是否是+EV的打法？',
    },
    tags: ['SB vs BB', '诈唬', 'check-raise', '单挑'],
    likes: 28,
    comments: 12,
    views: 567,
    isHot: false,
    isFeatured: false,
    createdAt: '2025-11-25T16:00:00Z',
    updatedAt: '2025-11-27T10:30:00Z',
  },
  {
    id: 'hand-5',
    title: '多人底池 - EP open，3个caller，怎么打？',
    description: '在EP用AQs开池，结果被3个人跟注。翻牌中了顶对弱踢，这种多人底池应该怎么控池？',
    author: {
      id: 'user-5',
      username: 'PositionKing',
      level: 24,
      title: '现金局玩家',
    },
    heroHand: ['Ah', 'Qh'],
    heroPosition: 'EP',
    blinds: '2/5',
    effectiveStack: 150,
    streets: [
      {
        name: 'preflop',
        pot: 7,
        actions: [
          { player: 'EP', action: 'raise', amount: 15, isHero: true },
          { player: 'MP', action: 'call', amount: 15 },
          { player: 'CO', action: 'call', amount: 15 },
          { player: 'BB', action: 'call', amount: 10 },
        ],
      },
      {
        name: 'flop',
        board: ['Qs', '9c', '5d'],
        pot: 62,
        actions: [
          { player: 'BB', action: 'check' },
          { player: 'EP', action: 'bet', amount: 30, isHero: true },
          { player: 'MP', action: 'call', amount: 30 },
          { player: 'CO', action: 'fold' },
          { player: 'BB', action: 'fold' },
        ],
      },
      {
        name: 'turn',
        board: ['Qs', '9c', '5d', 'Th'],
        pot: 122,
        actions: [
          { player: 'EP', action: 'check', isHero: true },
          { player: 'MP', action: 'bet', amount: 75 },
          { player: 'EP', action: 'call', amount: 75, isHero: true },
        ],
      },
      {
        name: 'river',
        board: ['Qs', '9c', '5d', 'Th', '2s'],
        pot: 272,
        actions: [
          { player: 'EP', action: 'check', isHero: true },
          { player: 'MP', action: 'bet', amount: 150 },
          { player: 'EP', action: 'fold', isHero: true },
        ],
      },
    ],
    result: {
      won: false,
      amount: -120,
      showdown: false,
    },
    keyDecision: {
      street: 'river',
      action: 'fold',
      description: '河牌面对3/4池下注，顶对弱踢是否应该弃牌？',
      isCorrect: true,
    },
    tags: ['多人底池', 'AQ', '顶对', '控池'],
    likes: 35,
    comments: 22,
    views: 789,
    isHot: false,
    isFeatured: false,
    createdAt: '2025-11-24T11:15:00Z',
    updatedAt: '2025-11-26T09:00:00Z',
  },
];

// Mock comments
const mockComments: HandComment[] = [
  {
    id: 'comment-1',
    handId: 'hand-1',
    author: {
      id: 'user-10',
      username: 'GTOExpert',
      level: 42,
      title: 'GTO大师',
    },
    content: '河牌这个spot确实很难。对手的betting line代表了很强的范围，超池大注基本就是极化范围。你的AK顶对在他的value range里基本都是输的，但是他可能会有一些bluff。考虑到pot odds大约是3:1，你需要有25%的胜率。我倾向于这是一个marginally -EV的call。',
    likes: 15,
    createdAt: '2025-11-28T12:00:00Z',
    replies: [
      {
        id: 'reply-1',
        handId: 'hand-1',
        author: {
          id: 'user-1',
          username: 'PokerMaster',
          level: 28,
          title: 'GTO专家',
        },
        content: '感谢分析！所以你觉得这里应该fold？还是说pot odds勉强可以call？',
        likes: 3,
        createdAt: '2025-11-28T12:30:00Z',
      },
    ],
  },
  {
    id: 'comment-2',
    handId: 'hand-1',
    author: {
      id: 'user-11',
      username: 'RiverMaster',
      level: 30,
    },
    content: 'Villain的line很像是拿着KQ或者QQ这种牌。河牌Q出来后他的value range变得更强了。我觉得这里fold是正确的。',
    likes: 8,
    createdAt: '2025-11-28T14:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handId = searchParams.get('id');
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort') || 'latest';
  const featured = searchParams.get('featured');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Single hand fetch
  if (handId) {
    const hand = mockHands.find(h => h.id === handId);
    if (!hand) {
      return NextResponse.json({ success: false, error: 'Hand not found' }, { status: 404 });
    }

    const comments = mockComments.filter(c => c.handId === handId);

    return NextResponse.json({
      success: true,
      hand,
      comments,
    });
  }

  // List hands with filtering
  let filteredHands = [...mockHands];

  // Filter by tag
  if (tag) {
    filteredHands = filteredHands.filter(h =>
      h.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  // Filter featured
  if (featured === 'true') {
    filteredHands = filteredHands.filter(h => h.isFeatured);
  }

  // Sort
  switch (sort) {
    case 'hot':
      filteredHands.sort((a, b) => {
        const scoreA = a.likes + a.comments * 2 + (a.isHot ? 100 : 0);
        const scoreB = b.likes + b.comments * 2 + (b.isHot ? 100 : 0);
        return scoreB - scoreA;
      });
      break;
    case 'top':
      filteredHands.sort((a, b) => b.likes - a.likes);
      break;
    case 'views':
      filteredHands.sort((a, b) => b.views - a.views);
      break;
    case 'latest':
    default:
      filteredHands.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Pagination
  const total = filteredHands.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedHands = filteredHands.slice(offset, offset + limit);

  // Get popular tags
  const tagCounts: Record<string, number> = {};
  mockHands.forEach(hand => {
    hand.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return NextResponse.json({
    success: true,
    hands: paginatedHands,
    popularTags,
    total,
    page,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'share':
      // Share a new hand
      const newHand: SharedHand = {
        id: `hand-${Date.now()}`,
        title: body.title,
        description: body.description,
        author: {
          id: 'current-user',
          username: 'CurrentUser',
          level: 10,
        },
        heroHand: body.heroHand,
        heroPosition: body.heroPosition,
        blinds: body.blinds,
        effectiveStack: body.effectiveStack,
        streets: body.streets,
        result: body.result,
        keyDecision: body.keyDecision,
        tags: body.tags || [],
        likes: 0,
        comments: 0,
        views: 0,
        isHot: false,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, hand: newHand });

    case 'like':
      return NextResponse.json({ success: true, message: '点赞成功' });

    case 'comment':
      const newComment: HandComment = {
        id: `comment-${Date.now()}`,
        handId: body.handId,
        author: {
          id: 'current-user',
          username: 'CurrentUser',
          level: 10,
        },
        content: body.content,
        likes: 0,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, comment: newComment });

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
