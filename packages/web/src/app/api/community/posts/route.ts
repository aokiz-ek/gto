import { NextRequest, NextResponse } from 'next/server';

// Post types
type PostCategory = 'hand_analysis' | 'strategy' | 'question' | 'experience' | 'news';

interface Author {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
}

interface Comment {
  id: string;
  postId: string;
  author: Author;
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  author: Author;
  handData?: {
    heroHand: string;
    heroPosition: string;
    villainPosition: string;
    board?: string;
    action: string;
    pot: number;
  };
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category labels
const CATEGORY_LABELS: Record<PostCategory, { en: string; zh: string; icon: string; color: string }> = {
  hand_analysis: { en: 'Hand Analysis', zh: '手牌分析', icon: '🃏', color: '#3b82f6' },
  strategy: { en: 'Strategy', zh: '策略讨论', icon: '🎯', color: '#8b5cf6' },
  question: { en: 'Question', zh: '问题求助', icon: '❓', color: '#f59e0b' },
  experience: { en: 'Experience', zh: '心得分享', icon: '💡', color: '#22c55e' },
  news: { en: 'News', zh: '资讯公告', icon: '📢', color: '#ef4444' },
};

// Generate mock posts
function generateMockPosts(): Post[] {
  return [
    {
      id: 'post-1',
      title: 'BTN vs BB 3-Bet Pot: 这手AQs在湿润面应该怎么打？',
      content: `场景描述：
- 有效筹码 100BB
- Hero在BTN开池2.5BB，BB 3-Bet到9BB
- Hero跟注，底池19BB
- 翻牌: Jh 9h 7c
- BB下注6BB，Hero？

这个牌面我有两张高牌+后门同花听牌，面对66%的C-bet应该跟注还是弃牌？

我的想法是跟注，因为：
1. 有6张高牌可以做成顶对
2. 后门同花权益
3. 位置优势可以浮动

但担心的是对手的range在这个面很强，而且还有两张转牌会很难打。

各位觉得呢？`,
      category: 'hand_analysis',
      author: {
        id: 'user-1',
        username: 'PokerPro88',
        level: 15,
        title: '翻前大师',
      },
      handData: {
        heroHand: 'AhQd',
        heroPosition: 'BTN',
        villainPosition: 'BB',
        board: 'Jh9h7c',
        action: 'facing_cbet',
        pot: 19,
      },
      tags: ['3-bet pot', 'C-bet', 'postflop'],
      likes: 42,
      comments: 18,
      views: 356,
      isPinned: true,
      isHot: true,
      createdAt: '2025-11-29T08:30:00Z',
      updatedAt: '2025-11-29T10:15:00Z',
    },
    {
      id: 'post-2',
      title: '新手问：为什么位置这么重要？',
      content: `刚开始学GTO，看到大家都说位置很重要，但我不太理解具体是为什么？

比如说：
1. BTN开池范围比UTG宽很多，这是因为什么？
2. 为什么说"没有位置就要打紧"？
3. 有位置具体能带来什么优势？

希望有经验的大佬解答一下，谢谢！`,
      category: 'question',
      author: {
        id: 'user-2',
        username: 'NewbiePlayer',
        level: 3,
        title: '新手上路',
      },
      tags: ['新手', '位置', '基础'],
      likes: 28,
      comments: 12,
      views: 245,
      isPinned: false,
      isHot: false,
      createdAt: '2025-11-29T06:20:00Z',
      updatedAt: '2025-11-29T06:20:00Z',
    },
    {
      id: 'post-3',
      title: '分享：我从鱼到盈利玩家的3个关键转变',
      content: `打了两年多牌，终于在最近半年稳定盈利了。分享一下我觉得最关键的三个转变：

## 1. 停止追逐"炫酷"的打法

以前总想学习什么高级诈唬、超级读人，结果亏得一塌糊涂。后来才意识到，对于大部分玩家来说，做好基础的价值下注和正确弃牌就够了。

## 2. 开始认真学习GTO

以前觉得GTO是"机器人打法"，很无聊。但当我真正开始学习后，才发现GTO其实是一个思考框架，帮助你理解为什么某些打法是正确的。

## 3. 重视资金管理

这是最被低估的技能。以前我会因为一个下风期就情绪崩溃，然后升级打、追损，恶性循环。现在严格执行资金管理后，心态稳定多了。

希望对正在努力的玩家有所帮助！`,
      category: 'experience',
      author: {
        id: 'user-3',
        username: 'GrinderLife',
        level: 22,
        title: '稳定盈利',
      },
      tags: ['心得', '进阶', '资金管理'],
      likes: 156,
      comments: 34,
      views: 1203,
      isPinned: false,
      isHot: true,
      createdAt: '2025-11-28T14:00:00Z',
      updatedAt: '2025-11-28T14:00:00Z',
    },
    {
      id: 'post-4',
      title: '深度分析：SB vs BB单挑策略',
      content: `SB vs BB是最常见的对局场景之一，今天来深度分析一下GTO策略。

## 1. SB开池策略

SB面对BB，GTO策略并不是简单的"全开"或"limp"，而是根据SPR和对手倾向选择：

- **紧型BB**: 可以适当宽开
- **3-Bet频繁的BB**: 收紧开池范围

## 2. BB防守策略

面对SB的开池，BB需要考虑：

- **跟注范围**: 大部分可玩的牌都应该跟注
- **3-Bet范围**: 用强牌和部分诈唬牌构建

## 3. 翻牌后调整

因为SPR较高，翻牌后的决策更加复杂...

（篇幅有限，详细内容见我的课程笔记）`,
      category: 'strategy',
      author: {
        id: 'user-4',
        username: 'StrategyMaster',
        level: 30,
        title: 'GTO专家',
      },
      tags: ['SB', 'BB', 'heads-up', '深度分析'],
      likes: 89,
      comments: 21,
      views: 678,
      isPinned: false,
      isHot: false,
      createdAt: '2025-11-28T09:30:00Z',
      updatedAt: '2025-11-28T11:45:00Z',
    },
    {
      id: 'post-5',
      title: '【公告】GTO Play 1.5版本更新：课程系统上线！',
      content: `各位玩家好！

我们很高兴宣布 GTO Play 1.5 版本正式上线！

## 主要更新

### 1. 全新课程系统
- 6门完整课程，从入门到精通
- 包含翻前基础、3-Bet进阶、C-Bet策略等
- 互动测验和实战练习

### 2. 翻牌后场景库
- 8种场景类型
- 完整的GTO策略展示
- 按牌力分类的详细策略

### 3. AI教练系统
- 实时反馈
- 个性化训练推荐
- 弱点分析报告

感谢大家的支持，我们会继续努力！

GTO Play 团队`,
      category: 'news',
      author: {
        id: 'admin',
        username: 'GTO Play Official',
        level: 99,
        title: '官方',
      },
      tags: ['公告', '更新', '新功能'],
      likes: 234,
      comments: 56,
      views: 2341,
      isPinned: true,
      isHot: true,
      createdAt: '2025-11-29T00:00:00Z',
      updatedAt: '2025-11-29T00:00:00Z',
    },
    {
      id: 'post-6',
      title: 'CO vs BTN: 被3-Bet后的JJ应该4-Bet还是跟注？',
      content: `经典问题，CO开池被BTN 3-Bet，JJ应该怎么处理？

我的理解是：
- 4-Bet: 可以拿到更多弃牌权益
- 跟注: 保留对方诈唬范围

但不同的solver给出的结果好像不太一样，想听听大家的意见。`,
      category: 'hand_analysis',
      author: {
        id: 'user-5',
        username: 'SolverFan',
        level: 18,
        title: '中级玩家',
      },
      handData: {
        heroHand: 'JdJh',
        heroPosition: 'CO',
        villainPosition: 'BTN',
        action: 'vs_3bet',
        pot: 0,
      },
      tags: ['3-bet', 'JJ', 'CO vs BTN'],
      likes: 67,
      comments: 29,
      views: 534,
      isPinned: false,
      isHot: false,
      createdAt: '2025-11-27T16:45:00Z',
      updatedAt: '2025-11-27T18:30:00Z',
    },
  ];
}

// Generate mock comments
function generateMockComments(postId: string): Comment[] {
  const commentsMap: Record<string, Comment[]> = {
    'post-1': [
      {
        id: 'comment-1-1',
        postId: 'post-1',
        author: { id: 'user-4', username: 'StrategyMaster', level: 30, title: 'GTO专家' },
        content: '这手牌在GTO策略中是混合策略，跟注和弃牌频率大概是60/40。你的分析基本正确，但要注意对手的C-bet频率，如果对手C-bet很高，你可以更激进地跟注甚至加注。',
        likes: 23,
        createdAt: '2025-11-29T09:00:00Z',
        replies: [
          {
            id: 'comment-1-1-1',
            postId: 'post-1',
            author: { id: 'user-1', username: 'PokerPro88', level: 15, title: '翻前大师' },
            content: '谢谢大佬解答！请问如果转牌发一张红心，是否应该更激进？',
            likes: 5,
            createdAt: '2025-11-29T09:15:00Z',
          },
        ],
      },
      {
        id: 'comment-1-2',
        postId: 'post-1',
        author: { id: 'user-6', username: 'NLHPro', level: 25, title: '高级玩家' },
        content: '同意楼上。另外补充一点，这个牌面的同花听牌比较危险，如果对手是比较tight的玩家，他的C-bet范围里强牌比例会更高，这种情况下我可能会更倾向于弃牌。',
        likes: 18,
        createdAt: '2025-11-29T09:30:00Z',
      },
    ],
    'post-2': [
      {
        id: 'comment-2-1',
        postId: 'post-2',
        author: { id: 'user-3', username: 'GrinderLife', level: 22, title: '稳定盈利' },
        content: `好问题！位置重要主要因为：

1. **信息优势**：后行动可以看到对手的行动再做决定
2. **控制底池**：有位置更容易控制底池大小
3. **诈唬机会**：对手过牌时你有更多诈唬机会
4. **价值最大化**：有位置更容易从强牌中榨取价值

建议你先去看看课程里的"位置基础"，讲得很详细！`,
        likes: 15,
        createdAt: '2025-11-29T07:00:00Z',
      },
    ],
  };

  return commentsMap[postId] || [];
}

// Cache posts
let cachedPosts: Post[] | null = null;

function getPosts(): Post[] {
  if (!cachedPosts) {
    cachedPosts = generateMockPosts();
  }
  return cachedPosts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const postId = searchParams.get('id');
    const category = searchParams.get('category') as PostCategory | null;
    const sort = searchParams.get('sort') || 'latest'; // latest, hot, top
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const withComments = searchParams.get('comments') === 'true';

    let posts = getPosts();

    // Get single post with comments
    if (postId) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        const comments = withComments ? generateMockComments(postId) : [];
        return NextResponse.json({
          success: true,
          post,
          comments,
          labels: { categories: CATEGORY_LABELS },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Filter by category
    if (category) {
      posts = posts.filter(p => p.category === category);
    }

    // Sort posts
    switch (sort) {
      case 'hot':
        posts = [...posts].sort((a, b) => {
          const scoreA = a.likes + a.comments * 2 + (a.isHot ? 1000 : 0) + (a.isPinned ? 2000 : 0);
          const scoreB = b.likes + b.comments * 2 + (b.isHot ? 1000 : 0) + (b.isPinned ? 2000 : 0);
          return scoreB - scoreA;
        });
        break;
      case 'top':
        posts = [...posts].sort((a, b) => b.likes - a.likes);
        break;
      case 'latest':
      default:
        posts = [...posts].sort((a, b) => {
          // Pinned posts first
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    // Pagination
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    posts = posts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages,
      posts,
      labels: { categories: CATEGORY_LABELS },
    });
  } catch (error) {
    console.error('Posts error:', error);
    return NextResponse.json(
      { success: false, error: '获取帖子失败' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, handData } = body;

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: '标题、内容和分类不能为空' },
        { status: 400 }
      );
    }

    // Create new post (mock)
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title,
      content,
      category,
      author: {
        id: 'current-user',
        username: 'CurrentUser',
        level: 10,
        title: '活跃玩家',
      },
      handData,
      tags: tags || [],
      likes: 0,
      comments: 0,
      views: 0,
      isPinned: false,
      isHot: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, save to database
    if (cachedPosts) {
      cachedPosts.unshift(newPost);
    }

    return NextResponse.json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, error: '创建帖子失败' },
      { status: 500 }
    );
  }
}
