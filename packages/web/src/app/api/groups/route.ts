import { NextRequest, NextResponse } from 'next/server';

// Types
interface GroupMember {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  weeklyQuestions: number;
  weeklyAccuracy: number;
}

interface GroupStats {
  totalMembers: number;
  weeklyActive: number;
  totalQuestions: number;
  avgAccuracy: number;
}

interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  questions: number;
  startTime: string;
  endTime: string;
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'mtt' | 'cash';
  isPublic: boolean;
  requireApproval: boolean;
  maxMembers: number;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  stats: GroupStats;
  members: GroupMember[];
  challenges: GroupChallenge[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Category labels
const categoryLabels: Record<string, { en: string; zh: string; icon: string; color: string }> = {
  beginner: { en: 'Beginner', zh: '入门', icon: '🌱', color: '#22c55e' },
  intermediate: { en: 'Intermediate', zh: '进阶', icon: '📈', color: '#3b82f6' },
  advanced: { en: 'Advanced', zh: '高级', icon: '🎯', color: '#8b5cf6' },
  mtt: { en: 'MTT', zh: 'MTT锦标赛', icon: '🏆', color: '#f59e0b' },
  cash: { en: 'Cash Game', zh: '现金局', icon: '💰', color: '#10b981' },
};

// Mock study groups data
const mockGroups: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'GTO入门学习营',
    description: '适合刚接触GTO理论的新手玩家，我们一起从基础开始学习！每周有固定的学习任务和讨论时间。',
    category: 'beginner',
    isPublic: true,
    requireApproval: false,
    maxMembers: 50,
    owner: {
      id: 'user-1',
      username: 'PokerMaster',
      avatar: undefined,
    },
    stats: {
      totalMembers: 38,
      weeklyActive: 28,
      totalQuestions: 15680,
      avgAccuracy: 62.5,
    },
    members: [
      {
        id: 'user-1',
        username: 'PokerMaster',
        level: 25,
        title: '小组创建者',
        role: 'owner',
        joinedAt: '2025-09-15T00:00:00Z',
        weeklyQuestions: 156,
        weeklyAccuracy: 78.2,
      },
      {
        id: 'user-2',
        username: 'CardShark',
        level: 18,
        title: '活跃成员',
        role: 'admin',
        joinedAt: '2025-09-20T00:00:00Z',
        weeklyQuestions: 142,
        weeklyAccuracy: 72.5,
      },
      {
        id: 'user-3',
        username: 'BluffKing',
        level: 12,
        role: 'member',
        joinedAt: '2025-10-01T00:00:00Z',
        weeklyQuestions: 89,
        weeklyAccuracy: 65.3,
      },
    ],
    challenges: [
      {
        id: 'challenge-1',
        title: '周末RFI特训',
        description: '专注于翻前加注策略的练习挑战',
        questions: 50,
        startTime: '2025-11-30T10:00:00Z',
        endTime: '2025-12-01T22:00:00Z',
        participants: 24,
        status: 'upcoming',
      },
    ],
    tags: ['新手友好', 'RFI', '基础'],
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2025-11-28T00:00:00Z',
  },
  {
    id: 'group-2',
    name: '3-Bet战士联盟',
    description: '专注于3-Bet和4-Bet策略的研究小组。我们深入分析各种位置的3-Bet范围，讨论最优防守策略。',
    category: 'intermediate',
    isPublic: true,
    requireApproval: true,
    maxMembers: 30,
    owner: {
      id: 'user-4',
      username: 'AggroPlayer',
    },
    stats: {
      totalMembers: 26,
      weeklyActive: 22,
      totalQuestions: 28450,
      avgAccuracy: 71.8,
    },
    members: [
      {
        id: 'user-4',
        username: 'AggroPlayer',
        level: 32,
        title: '3-Bet专家',
        role: 'owner',
        joinedAt: '2025-08-01T00:00:00Z',
        weeklyQuestions: 210,
        weeklyAccuracy: 82.5,
      },
    ],
    challenges: [
      {
        id: 'challenge-2',
        title: 'BTN vs BB 3-Bet挑战',
        description: '100题BTN vs BB的3-Bet场景',
        questions: 100,
        startTime: '2025-11-28T00:00:00Z',
        endTime: '2025-11-29T00:00:00Z',
        participants: 18,
        status: 'active',
      },
    ],
    tags: ['3-Bet', '4-Bet', '位置战', '进阶'],
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2025-11-29T00:00:00Z',
  },
  {
    id: 'group-3',
    name: 'MTT精英俱乐部',
    description: '为认真对待MTT的玩家打造的学习社群。讨论ICM、泡沫策略、最终桌打法等高级主题。',
    category: 'mtt',
    isPublic: true,
    requireApproval: true,
    maxMembers: 20,
    owner: {
      id: 'user-5',
      username: 'MTTCrusher',
    },
    stats: {
      totalMembers: 18,
      weeklyActive: 15,
      totalQuestions: 42300,
      avgAccuracy: 75.2,
    },
    members: [
      {
        id: 'user-5',
        username: 'MTTCrusher',
        level: 45,
        title: 'MTT专业玩家',
        role: 'owner',
        joinedAt: '2025-07-01T00:00:00Z',
        weeklyQuestions: 285,
        weeklyAccuracy: 85.3,
      },
    ],
    challenges: [],
    tags: ['MTT', 'ICM', '锦标赛', '高级'],
    createdAt: '2025-07-01T00:00:00Z',
    updatedAt: '2025-11-27T00:00:00Z',
  },
  {
    id: 'group-4',
    name: '翻后战场',
    description: '专注翻牌后打法的学习小组。Flop、Turn、River各街策略深入研究，C-bet、价值下注、诈唬时机全覆盖。',
    category: 'advanced',
    isPublic: true,
    requireApproval: false,
    maxMembers: 40,
    owner: {
      id: 'user-6',
      username: 'PostflopGuru',
    },
    stats: {
      totalMembers: 35,
      weeklyActive: 30,
      totalQuestions: 56780,
      avgAccuracy: 68.9,
    },
    members: [
      {
        id: 'user-6',
        username: 'PostflopGuru',
        level: 38,
        title: '翻后大师',
        role: 'owner',
        joinedAt: '2025-06-15T00:00:00Z',
        weeklyQuestions: 320,
        weeklyAccuracy: 79.8,
      },
    ],
    challenges: [
      {
        id: 'challenge-3',
        title: 'C-Bet策略周赛',
        description: '测试你的C-Bet决策能力',
        questions: 75,
        startTime: '2025-11-25T00:00:00Z',
        endTime: '2025-11-28T00:00:00Z',
        participants: 28,
        status: 'completed',
      },
    ],
    tags: ['翻牌后', 'C-Bet', '价值下注', '诈唬'],
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2025-11-29T00:00:00Z',
  },
  {
    id: 'group-5',
    name: '现金局研究所',
    description: '深度研究现金局策略的小组。100BB深筹策略、多桌技巧、bankroll管理等主题。',
    category: 'cash',
    isPublic: true,
    requireApproval: true,
    maxMembers: 25,
    owner: {
      id: 'user-7',
      username: 'CashKing',
    },
    stats: {
      totalMembers: 22,
      weeklyActive: 18,
      totalQuestions: 38900,
      avgAccuracy: 73.5,
    },
    members: [
      {
        id: 'user-7',
        username: 'CashKing',
        level: 42,
        title: '现金局老手',
        role: 'owner',
        joinedAt: '2025-05-01T00:00:00Z',
        weeklyQuestions: 198,
        weeklyAccuracy: 81.2,
      },
    ],
    challenges: [],
    tags: ['现金局', 'bankroll', '深筹', '盈利'],
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-11-28T00:00:00Z',
  },
];

// Leaderboard data for groups
interface GroupLeaderboardEntry {
  rank: number;
  member: GroupMember;
  weeklyQuestions: number;
  weeklyAccuracy: number;
  weeklyScore: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('id');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Single group fetch
  if (groupId) {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // Generate leaderboard for this group
    const leaderboard: GroupLeaderboardEntry[] = group.members
      .map((member, index) => ({
        rank: index + 1,
        member,
        weeklyQuestions: member.weeklyQuestions,
        weeklyAccuracy: member.weeklyAccuracy,
        weeklyScore: Math.round(member.weeklyQuestions * member.weeklyAccuracy / 100),
      }))
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return NextResponse.json({
      success: true,
      group,
      leaderboard,
      labels: {
        categories: categoryLabels,
      },
    });
  }

  // List groups with filtering
  let filteredGroups = [...mockGroups];

  // Filter by category
  if (category && category !== 'all') {
    filteredGroups = filteredGroups.filter(g => g.category === category);
  }

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredGroups = filteredGroups.filter(g =>
      g.name.toLowerCase().includes(searchLower) ||
      g.description.toLowerCase().includes(searchLower) ||
      g.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Sort by member count
  filteredGroups.sort((a, b) => b.stats.totalMembers - a.stats.totalMembers);

  // Pagination
  const total = filteredGroups.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedGroups = filteredGroups.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    groups: paginatedGroups,
    labels: {
      categories: categoryLabels,
    },
    total,
    page,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, groupId, userId } = body;

  // Handle different actions
  switch (action) {
    case 'create':
      // Create new group
      const newGroup: StudyGroup = {
        id: `group-${Date.now()}`,
        name: body.name,
        description: body.description,
        category: body.category || 'beginner',
        isPublic: body.isPublic ?? true,
        requireApproval: body.requireApproval ?? false,
        maxMembers: body.maxMembers || 50,
        owner: {
          id: 'current-user',
          username: 'CurrentUser',
        },
        stats: {
          totalMembers: 1,
          weeklyActive: 1,
          totalQuestions: 0,
          avgAccuracy: 0,
        },
        members: [
          {
            id: 'current-user',
            username: 'CurrentUser',
            level: 10,
            role: 'owner',
            joinedAt: new Date().toISOString(),
            weeklyQuestions: 0,
            weeklyAccuracy: 0,
          },
        ],
        challenges: [],
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, group: newGroup });

    case 'join':
      // Join a group
      return NextResponse.json({
        success: true,
        message: body.requireApproval ? '申请已提交，等待审核' : '成功加入小组'
      });

    case 'leave':
      // Leave a group
      return NextResponse.json({ success: true, message: '已退出小组' });

    case 'create_challenge':
      // Create a group challenge
      const newChallenge: GroupChallenge = {
        id: `challenge-${Date.now()}`,
        title: body.title,
        description: body.description,
        questions: body.questions || 50,
        startTime: body.startTime,
        endTime: body.endTime,
        participants: 0,
        status: 'upcoming',
      };
      return NextResponse.json({ success: true, challenge: newChallenge });

    case 'join_challenge':
      // Join a challenge
      return NextResponse.json({ success: true, message: '已加入挑战' });

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
