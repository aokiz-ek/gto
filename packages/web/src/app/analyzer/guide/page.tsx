'use client';

import Link from 'next/link';
import { useResponsive } from '@/hooks';

const COLORS = {
  primary: '#00f5d4',
  secondary: '#9b5de5',
  accent: '#f15bb5',
  warning: '#fbbf24',
  danger: '#ef4444',
  bgDark: '#0a0a0f',
  bgCard: '#12121a',
  bgSurface: '#1a1a24',
  border: '#2a2a3a',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
};

interface FeatureSection {
  title: string;
  icon: string;
  description: string;
  features: { name: string; desc: string }[];
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: '基础设置',
    icon: '🎮',
    description: '配置牌局的基本信息',
    features: [
      { name: '位置选择', desc: '选择你(Hero)和对手(Villain)的座位位置，支持6人桌常见位置：UTG、HJ、CO、BTN、SB、BB' },
      { name: '街道选择', desc: '选择当前分析的阶段：翻前(Preflop)、翻牌(Flop)、转牌(Turn)、河牌(River)' },
      { name: '底池/筹码配置', desc: '设置当前底池大小和有效筹码深度(以BB为单位)，自动计算SPR(筹码底池比)' },
    ],
  },
  {
    title: '手牌输入',
    icon: '🃏',
    description: '选择你的手牌和公共牌',
    features: [
      { name: '卡牌选择器', desc: '点击选择花色和点数，按顺序选择两张手牌和公共牌' },
      { name: '快速输入', desc: '使用文本格式快速输入，如"AhKs"或"AhKs QcJdTh"(手牌+公共牌)' },
      { name: '手牌历史导入', desc: '粘贴常见扑克软件的手牌记录，自动解析手牌和公共牌' },
    ],
  },
  {
    title: 'GTO分析结果',
    icon: '📊',
    description: '核心的博弈论最优策略分析',
    features: [
      { name: '权益(Equity)', desc: '你的手牌对抗对手范围的胜率' },
      { name: '底池赔率(Pot Odds)', desc: '跟注所需的最小胜率' },
      { name: 'SPR', desc: '筹码底池比，影响游戏深度和策略选择' },
      { name: '行动建议', desc: '显示每个行动(加注/跟注/弃牌等)的推荐频率和EV值' },
      { name: 'EV损失', desc: '相比最优行动的期望值损失' },
      { name: '各街道策略', desc: '从翻前到河牌的完整策略路径' },
    ],
  },
  {
    title: '范围分析',
    icon: '📈',
    description: '理解和调整手牌范围',
    features: [
      { name: '对手范围矩阵', desc: '基于对手位置显示其可能的起手牌范围，13x13矩阵展示169种起手牌组合' },
      { name: '范围探索器', desc: '交互式查看不同手牌在范围中的强度分布' },
      { name: '对手范围调整器', desc: '根据牌面纹理动态调整对手范围，更精确地分析' },
      { name: '范围百分比', desc: '显示范围占所有可能手牌的比例' },
      { name: '组合数', desc: '范围内有效的手牌组合总数' },
    ],
  },
  {
    title: '牌面分析',
    icon: '🎯',
    description: '分析公共牌的结构和影响',
    features: [
      { name: '牌面纹理', desc: '分析公共牌的连接性、花色分布和高低牌分布' },
      { name: '听牌识别', desc: '识别可能的顺子听牌和同花听牌' },
      { name: '下注尺寸建议', desc: '根据牌面纹理和手牌强度推荐最优下注尺寸' },
    ],
  },
  {
    title: '权益计算',
    icon: '🔢',
    description: '精确的胜率计算',
    features: [
      { name: '实时权益', desc: '计算你的手牌对抗对手范围的精确胜率' },
      { name: '后续牌分析', desc: '分析不同转牌/河牌对你权益的影响' },
      { name: '最优/最差牌', desc: '显示对你最有利和最不利的后续牌' },
    ],
  },
  {
    title: '策略工具',
    icon: '🧠',
    description: '辅助决策的高级工具',
    features: [
      { name: '策略解释器', desc: '用自然语言解释当前局面的GTO策略和背后逻辑' },
      { name: '行动过滤器', desc: '筛选特定行动查看对应的策略和频率' },
      { name: 'GTO报告', desc: '生成详细的分析报告，包括EV比较和策略建议' },
      { name: '策略笔记', desc: '记录和管理你的学习笔记，支持分类标签' },
    ],
  },
  {
    title: '下注尺寸',
    icon: '💰',
    description: '选择和分析下注尺寸',
    features: [
      { name: '预设尺寸', desc: '快速选择常用下注尺寸：33%、50%、66%、75%、100%、150%底池' },
      { name: '自定义尺寸', desc: '输入任意百分比的下注尺寸' },
      { name: '尺寸影响', desc: '不同尺寸会影响底池赔率和对手的决策' },
    ],
  },
];

export default function AnalyzerGuidePage() {
  const { isMobile, isMobileOrTablet } = useResponsive();

  return (
    <div className="guide-page">
      <style jsx>{`
        .guide-page {
          min-height: calc(100vh - 56px);
          background: ${COLORS.bgDark};
          padding: ${isMobile ? '16px' : '24px'};
        }

        .guide-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .guide-header {
          margin-bottom: ${isMobile ? '24px' : '32px'};
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: ${COLORS.textSecondary};
          font-size: 13px;
          text-decoration: none;
          margin-bottom: 16px;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: ${COLORS.primary};
        }

        .guide-title {
          font-size: ${isMobile ? '24px' : '32px'};
          font-weight: 700;
          color: ${COLORS.textPrimary};
          margin-bottom: 8px;
        }

        .guide-subtitle {
          font-size: ${isMobile ? '14px' : '16px'};
          color: ${COLORS.textSecondary};
          line-height: 1.6;
        }

        .section-grid {
          display: flex;
          flex-direction: column;
          gap: ${isMobile ? '16px' : '20px'};
        }

        .section-card {
          background: ${COLORS.bgCard};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          padding: ${isMobile ? '16px' : '20px'};
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .section-card:hover {
          border-color: ${COLORS.primary}40;
          box-shadow: 0 4px 20px rgba(0, 245, 212, 0.1);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .section-icon {
          font-size: ${isMobile ? '24px' : '28px'};
          flex-shrink: 0;
        }

        .section-title-group {
          flex: 1;
        }

        .section-title {
          font-size: ${isMobile ? '16px' : '18px'};
          font-weight: 600;
          color: ${COLORS.textPrimary};
          margin-bottom: 4px;
        }

        .section-description {
          font-size: ${isMobile ? '12px' : '13px'};
          color: ${COLORS.textSecondary};
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid ${COLORS.border};
        }

        .feature-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${COLORS.primary};
          flex-shrink: 0;
          margin-top: 7px;
        }

        .feature-content {
          flex: 1;
        }

        .feature-name {
          font-size: ${isMobile ? '13px' : '14px'};
          font-weight: 600;
          color: ${COLORS.textPrimary};
          margin-bottom: 2px;
        }

        .feature-desc {
          font-size: ${isMobile ? '12px' : '13px'};
          color: ${COLORS.textMuted};
          line-height: 1.5;
        }

        .tips-section {
          margin-top: ${isMobile ? '32px' : '40px'};
          padding: ${isMobile ? '20px' : '24px'};
          background: linear-gradient(135deg, ${COLORS.secondary}15, ${COLORS.primary}10);
          border: 1px solid ${COLORS.secondary}30;
          border-radius: 12px;
        }

        .tips-title {
          font-size: ${isMobile ? '16px' : '18px'};
          font-weight: 600;
          color: ${COLORS.secondary};
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tip-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .tip-number {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${COLORS.secondary}30;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tip-text {
          font-size: ${isMobile ? '13px' : '14px'};
          color: ${COLORS.textSecondary};
          line-height: 1.5;
        }

        .cta-section {
          margin-top: ${isMobile ? '32px' : '40px'};
          text-align: center;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: ${isMobile ? '12px 24px' : '14px 32px'};
          background: linear-gradient(135deg, ${COLORS.primary}, #1eb8a6);
          color: #000;
          font-size: ${isMobile ? '14px' : '15px'};
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px ${COLORS.primary}40;
        }
      `}</style>

      <div className="guide-container">
        <div className="guide-header">
          <Link href="/analyzer" className="back-link">
            <span>&#8592;</span> 返回分析器
          </Link>
          <h1 className="guide-title">手牌分析器功能说明</h1>
          <p className="guide-subtitle">
            手牌分析器是一个基于博弈论最优(GTO)策略的扑克分析工具。
            它可以帮助你分析特定牌局场景，理解最优策略，提升你的决策能力。
          </p>
        </div>

        <div className="section-grid">
          {FEATURE_SECTIONS.map((section, idx) => (
            <div key={idx} className="section-card">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <div className="section-title-group">
                  <h2 className="section-title">{section.title}</h2>
                  <p className="section-description">{section.description}</p>
                </div>
              </div>
              <div className="feature-list">
                {section.features.map((feature, fIdx) => (
                  <div key={fIdx} className="feature-item">
                    <span className="feature-dot" />
                    <div className="feature-content">
                      <div className="feature-name">{feature.name}</div>
                      <div className="feature-desc">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="tips-section">
          <h3 className="tips-title">
            <span>💡</span> 使用技巧
          </h3>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-number">1</span>
              <span className="tip-text">
                先选择位置，再输入手牌，最后选择公共牌。按照步骤提示操作可以更高效地完成分析。
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-number">2</span>
              <span className="tip-text">
                使用"快速输入"功能可以一次性输入手牌和公共牌，格式如"AhKs QcJdTh"。
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-number">3</span>
              <span className="tip-text">
                关注EV损失指标，它告诉你次优行动相比最优行动会损失多少期望值。
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-number">4</span>
              <span className="tip-text">
                根据实际对手的打法调整对手范围，可以得到更具针对性的分析结果。
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-number">5</span>
              <span className="tip-text">
                使用策略笔记功能记录重要的学习心得，方便日后复习。
              </span>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <Link href="/analyzer" className="cta-button">
            开始分析 <span>&#8594;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
