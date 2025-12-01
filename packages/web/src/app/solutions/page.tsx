'use client';

import { useState, useMemo } from 'react';
import { RANKS, GTO_RANGES, GTO_VS_RFI_RANGES, GTO_RANGES_100BB, getGTOStrategy, getStrategyByStackDepth, ALL_HANDS } from '@gto/core';
import type { Position, GTOStrategy, GTOHandStrategy, GameType, StackDepth } from '@gto/core';

// Action line types
type ActionLine = 'rfi' | 'vs_rfi';

// Filter types
type ActionFilter = 'all' | 'raise' | 'call' | 'fold' | 'mixed';
type HandTypeFilter = 'all' | 'pairs' | 'suited' | 'offsuit';

// Action colors matching GTO Wizard exactly
const ACTION_COLORS = {
  fold: '#4a7c9b',
  call: '#4ecdc4',
  raise: '#c23b3b',
  allin: '#6b1f1f',
};

// Scenario Configuration Component
function ScenarioConfig({
  gameType,
  stackDepth,
  position,
  actionLine,
  vsPosition,
  onGameTypeChange,
  onStackDepthChange,
  onPositionChange,
  onActionLineChange,
  onVsPositionChange,
}: {
  gameType: GameType;
  stackDepth: StackDepth;
  position: Position;
  actionLine: ActionLine;
  vsPosition: Position;
  onGameTypeChange: (v: GameType) => void;
  onStackDepthChange: (v: StackDepth) => void;
  onPositionChange: (v: Position) => void;
  onActionLineChange: (v: ActionLine) => void;
  onVsPositionChange: (v: Position) => void;
}) {
  const gameTypes: { value: GameType; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'mtt', label: 'MTT' },
    { value: 'sng', label: 'SNG' },
    { value: 'spin', label: 'Spin' },
  ];

  const stackDepths: StackDepth[] = [20, 50, 100, 200];

  // RFI positions (who can raise first)
  const rfiPositions: { pos: Position; available: boolean }[] = [
    { pos: 'UTG', available: true },
    { pos: 'HJ', available: true },
    { pos: 'CO', available: true },
    { pos: 'BTN', available: true },
    { pos: 'SB', available: true },
    { pos: 'BB', available: false },
  ];

  // vs RFI positions (who faces the raise)
  const vsRFIPositions: { pos: Position; available: boolean; vs: Position[] }[] = [
    { pos: 'BB', available: true, vs: ['UTG', 'HJ', 'CO', 'BTN', 'SB'] },
    { pos: 'SB', available: false, vs: ['UTG', 'HJ', 'CO', 'BTN'] },
    { pos: 'BTN', available: false, vs: ['UTG', 'HJ', 'CO'] },
    { pos: 'CO', available: false, vs: ['UTG', 'HJ'] },
    { pos: 'HJ', available: false, vs: ['UTG'] },
  ];

  const positions = actionLine === 'rfi' ? rfiPositions : vsRFIPositions;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '40px',
      minHeight: '40px',
      padding: '0 8px',
      background: '#222',
      borderBottom: '1px solid #333',
      gap: '2px',
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {/* Left icons */}
      <button style={{ background: 'transparent', border: 'none', color: '#777', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>

      {/* Game Type Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
        {gameTypes.map((gt) => (
          <button
            key={gt.value}
            onClick={() => onGameTypeChange(gt.value)}
            style={{
              padding: '6px 12px',
              background: gameType === gt.value ? '#3a5a4a' : '#2a2a2a',
              border: gameType === gt.value ? '1px solid #4a7a5a' : '1px solid transparent',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: gameType === gt.value ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            {gt.label}
          </button>
        ))}
      </div>

      {/* Stack Depth Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '12px' }}>
        {stackDepths.map((depth) => (
          <button
            key={depth}
            onClick={() => onStackDepthChange(depth)}
            style={{
              padding: '6px 10px',
              background: stackDepth === depth ? '#3a5a4a' : '#2a2a2a',
              border: stackDepth === depth ? '1px solid #4a7a5a' : '1px solid transparent',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: stackDepth === depth ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            {depth}bb
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', background: '#444', margin: '0 12px' }} />

      {/* Action Line Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={() => onActionLineChange('rfi')}
          style={{
            padding: '6px 12px',
            background: actionLine === 'rfi' ? '#3a5a4a' : '#2a2a2a',
            border: actionLine === 'rfi' ? '1px solid #4a7a5a' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: actionLine === 'rfi' ? '#fff' : '#888',
            cursor: 'pointer',
          }}
        >
          RFI
        </button>
        <button
          onClick={() => {
            onActionLineChange('vs_rfi');
            onPositionChange('BB');
            onVsPositionChange('BTN');
          }}
          style={{
            padding: '6px 12px',
            background: actionLine === 'vs_rfi' ? '#3a5a4a' : '#2a2a2a',
            border: actionLine === 'vs_rfi' ? '1px solid #4a7a5a' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: actionLine === 'vs_rfi' ? '#fff' : '#888',
            cursor: 'pointer',
          }}
        >
          vs RFI
        </button>
      </div>

      <div style={{ width: '1px', height: '20px', background: '#444', margin: '0 12px' }} />

      {/* Position tabs - different for RFI and vs RFI */}
      {actionLine === 'rfi' ? (
        // RFI position selection
        positions.map((p) => (
          <div
            key={p.pos}
            onClick={() => p.available && onPositionChange(p.pos)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: p.pos === position ? '#2d4a3a' : 'transparent',
              border: p.pos === position ? '1px solid #3d6a4a' : '1px solid transparent',
              borderRadius: '4px',
              cursor: p.available ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              opacity: p.available ? 1 : 0.5,
            }}
          >
            <span style={{
              background: p.pos === position ? '#4a9a6a' : '#444',
              padding: '2px 8px',
              borderRadius: '3px',
              fontWeight: 600,
              fontSize: '12px',
            }}>
              {p.pos}
            </span>
            <span style={{ color: '#aaa' }}>{stackDepth}</span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {p.pos === position ? 'RFI' : p.available ? '' : ''}
            </span>
          </div>
        ))
      ) : (
        // vs RFI: Show "BB vs X" format
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#4a9a6a',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '13px',
          }}>
            BB
          </span>
          <span style={{ color: '#888', fontSize: '13px' }}>vs</span>
          {/* Raiser position selector */}
          {['UTG', 'HJ', 'CO', 'BTN', 'SB'].map((vs) => (
            <button
              key={vs}
              onClick={() => onVsPositionChange(vs as Position)}
              style={{
                padding: '4px 10px',
                background: vsPosition === vs ? '#c23b3b' : '#333',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fff',
                cursor: vs === 'BTN' ? 'pointer' : 'not-allowed',
                opacity: vs === 'BTN' ? 1 : 0.5,
              }}
            >
              {vs}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Right side info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#888', fontSize: '13px', paddingRight: '8px' }}>
        <span>{actionLine === 'rfi' ? '1.5 BB' : '3.5 BB'}</span>
        <span>底池赔率: {actionLine === 'rfi' ? '40%' : '28%'}</span>
      </div>
    </div>
  );
}

// Matrix Cell
function MatrixCell({ hand, strategy, isSelected, onClick, actionLine, isFiltered }: {
  hand: string;
  strategy?: GTOHandStrategy;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  actionLine: ActionLine;
  isFiltered: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getCellBackground = () => {
    if (!strategy) return ACTION_COLORS.fold;

    const raiseAction = strategy.actions.find(a => a.action === 'raise');
    const callAction = strategy.actions.find(a => a.action === 'call');
    const foldAction = strategy.actions.find(a => a.action === 'fold');
    const allinAction = strategy.actions.find(a => a.action === 'allin');

    const raiseFreq = raiseAction?.frequency || 0;
    const callFreq = callAction?.frequency || 0;
    const foldFreq = foldAction?.frequency || 0;
    const allinFreq = allinAction?.frequency || 0;

    // For vs RFI, we have raise (3-bet), call, fold
    if (actionLine === 'vs_rfi') {
      if (foldFreq >= 100) return ACTION_COLORS.fold;
      if (callFreq >= 100) return ACTION_COLORS.call;
      if (raiseFreq >= 70) return ACTION_COLORS.raise;

      // Mixed strategies
      let gradient = 'linear-gradient(to right';
      let position = 0;
      if (raiseFreq > 0) {
        gradient += `, ${ACTION_COLORS.raise} ${position}%, ${ACTION_COLORS.raise} ${position + raiseFreq}%`;
        position += raiseFreq;
      }
      if (callFreq > 0) {
        gradient += `, ${ACTION_COLORS.call} ${position}%, ${ACTION_COLORS.call} ${position + callFreq}%`;
        position += callFreq;
      }
      if (foldFreq > 0) {
        gradient += `, ${ACTION_COLORS.fold} ${position}%, ${ACTION_COLORS.fold} ${position + foldFreq}%`;
      }
      gradient += ')';
      return gradient;
    }

    // For RFI, we have raise, fold (no call)
    if (allinFreq >= 50) return ACTION_COLORS.allin;
    if (raiseFreq >= 70) return ACTION_COLORS.raise;
    if (foldFreq >= 100) return ACTION_COLORS.fold;
    if (raiseFreq > 0 && foldFreq > 0) {
      return `linear-gradient(to right, ${ACTION_COLORS.raise} ${raiseFreq}%, ${ACTION_COLORS.fold} ${raiseFreq}%)`;
    }
    return ACTION_COLORS.fold;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: getCellBackground(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(10px, 1.5vw, 14px)',
        fontWeight: 600,
        color: '#fff',
        cursor: 'pointer',
        border: isSelected ? '2px solid #4ade80' : 'none',
        boxSizing: 'border-box',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        filter: isFiltered ? 'brightness(0.3) grayscale(0.5)' : (isHovered ? 'brightness(1.3)' : 'brightness(1)'),
        opacity: isFiltered ? 0.6 : 1,
        transition: 'filter 0.15s ease, opacity 0.15s ease',
      }}
    >
      {hand}
    </div>
  );
}

// Enlarged detail card for selected hand with EV info
function HandDetailCard({ hand, strategy, onClose }: {
  hand: string;
  strategy?: GTOHandStrategy;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 触发入场动画
  useState(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  });

  // 处理关闭，先播放动画再调用 onClose
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const raiseAction = strategy?.actions.find(a => a.action === 'raise');
  const foldAction = strategy?.actions.find(a => a.action === 'fold');
  const allinAction = strategy?.actions.find(a => a.action === 'allin');

  const raiseFreq = raiseAction?.frequency || 0;
  const foldFreq = foldAction?.frequency || 0;
  const allinFreq = allinAction?.frequency || 0;
  const raiseEV = raiseAction?.ev || 0;
  const raiseSize = raiseAction?.size || 2.5;

  const getCellBackground = () => {
    if (!strategy) return ACTION_COLORS.fold;
    if (allinFreq >= 50) return ACTION_COLORS.allin;
    if (raiseFreq >= 70) return ACTION_COLORS.raise;
    if (foldFreq >= 100) return ACTION_COLORS.fold;
    if (raiseFreq > 0 && foldFreq > 0) {
      return `linear-gradient(to right, ${ACTION_COLORS.raise} ${raiseFreq}%, ${ACTION_COLORS.fold} ${raiseFreq}%)`;
    }
    return ACTION_COLORS.fold;
  };

  return (
    <div
      onClick={handleClose}
      style={{
        background: getCellBackground(),
        border: '3px solid #4ade80',
        borderRadius: '8px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        position: 'relative',
        transformOrigin: 'top left',
        transform: isVisible ? 'scale(1)' : 'scale(0.3)',
        opacity: isVisible ? 1 : 0,
        transition: isClosing
          ? 'transform 0.15s ease-in, opacity 0.15s ease-in'
          : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease-out',
        cursor: 'pointer',
      }}
    >
      {/* Hand name and equity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          {hand}
        </div>
        {strategy && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '13px',
          }}>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>{strategy.equity.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Action table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '8px 16px',
        fontSize: '14px',
        alignItems: 'center',
      }}>
        {/* Header row */}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>行动</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'right' }}>期望值</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'right' }}>频率</div>

        {/* Allin row */}
        {allinFreq > 0 && (
          <>
            <div style={{ color: '#fff', fontWeight: 500 }}>全下</div>
            <div style={{ color: '#4ade80', textAlign: 'right' }}>-</div>
            <div style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{allinFreq}%</div>
          </>
        )}

        {/* Raise row */}
        <div style={{ color: '#fff', fontWeight: 500 }}>加注 {raiseSize}x</div>
        <div style={{ color: '#4ade80', textAlign: 'right' }}>{raiseEV.toFixed(2)}bb</div>
        <div style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{raiseFreq}%</div>

        {/* Fold row */}
        <div style={{ color: '#fff', fontWeight: 500 }}>弃牌</div>
        <div style={{ color: '#888', textAlign: 'right' }}>0.00bb</div>
        <div style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{foldFreq}%</div>
      </div>

      {/* Combos info */}
      {strategy && (
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>组合数</span>
          <span style={{ color: '#fff', fontWeight: 500 }}>{strategy.totalCombos}</span>
        </div>
      )}
    </div>
  );
}

export default function SolutionsPage() {
  const [gameType, setGameType] = useState<GameType>('cash');
  const [stackDepth, setStackDepth] = useState<StackDepth>(200);
  const [selectedPosition, setSelectedPosition] = useState<Position>('HJ');
  const [actionLine, setActionLine] = useState<ActionLine>('rfi');
  const [vsPosition, setVsPosition] = useState<Position>('BTN');
  const [selectedHand, setSelectedHand] = useState<string | null>('AA');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'table' | 'equity'>('overview');
  const [selectedHandTab, setSelectedHandTab] = useState<'hands' | 'overview' | 'filter' | 'blockers'>('hands');
  const [detailCardPosition, setDetailCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Filter states
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [handTypeFilter, setHandTypeFilter] = useState<HandTypeFilter>('all');

  // Get real GTO data based on action line and stack depth
  const gtoStrategy = useMemo(() => {
    if (actionLine === 'rfi') {
      // Check if we have data for this stack depth
      if (stackDepth === 100) {
        const strategy100bb = getStrategyByStackDepth(100, selectedPosition);
        if (strategy100bb) return strategy100bb;
      }
      // Fallback to 200bb data
      return getGTOStrategy(selectedPosition);
    } else {
      // vs RFI: Use the selected position and vsPosition
      const key = `${selectedPosition}_vs_${vsPosition}`;
      return GTO_VS_RFI_RANGES[key] || GTO_VS_RFI_RANGES['BB_vs_BTN'];
    }
  }, [selectedPosition, actionLine, vsPosition, stackDepth]);

  const ranges = gtoStrategy?.ranges || {};
  const summary = gtoStrategy?.summary;

  const positions: { pos: Position; available: boolean }[] = [
    { pos: 'UTG', available: true },
    { pos: 'HJ', available: true },
    { pos: 'CO', available: true },
    { pos: 'BTN', available: true },
    { pos: 'SB', available: true },
    { pos: 'BB', available: false },
  ];

  const getHandLabel = (row: number, col: number): string => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    if (row === col) return rank1 + rank2;
    if (col > row) return rank1 + rank2 + 's';
    return rank1 + rank2 + 'o';
  };

  // Filter function for hands
  const shouldShowHand = (hand: string, strategy?: GTOHandStrategy): boolean => {
    // Hand type filter
    if (handTypeFilter !== 'all') {
      const isPair = hand.length === 2;
      const isSuited = hand.endsWith('s');
      const isOffsuit = hand.endsWith('o');

      if (handTypeFilter === 'pairs' && !isPair) return false;
      if (handTypeFilter === 'suited' && !isSuited) return false;
      if (handTypeFilter === 'offsuit' && !isOffsuit) return false;
    }

    // Action filter
    if (actionFilter !== 'all' && strategy) {
      const raiseAction = strategy.actions.find(a => a.action === 'raise');
      const callAction = strategy.actions.find(a => a.action === 'call');
      const foldAction = strategy.actions.find(a => a.action === 'fold');

      const raiseFreq = raiseAction?.frequency || 0;
      const callFreq = callAction?.frequency || 0;
      const foldFreq = foldAction?.frequency || 0;

      if (actionFilter === 'raise' && raiseFreq < 50) return false;
      if (actionFilter === 'call' && callFreq < 50) return false;
      if (actionFilter === 'fold' && foldFreq < 50) return false;
      if (actionFilter === 'mixed') {
        const hasMultiple = (raiseFreq > 0 ? 1 : 0) + (callFreq > 0 ? 1 : 0) + (foldFreq > 0 && foldFreq < 100 ? 1 : 0);
        if (hasMultiple < 2) return false;
      }
    }

    return true;
  };

  // Get selected hand strategy
  const selectedStrategy = selectedHand
    ? (ranges instanceof Map ? ranges.get(selectedHand) : ranges[selectedHand])
    : undefined;

  return (
    <div style={{ height: 'calc(100vh - 56px)', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Row 1: Scenario Configuration */}
      <ScenarioConfig
        gameType={gameType}
        stackDepth={stackDepth}
        position={selectedPosition}
        actionLine={actionLine}
        vsPosition={vsPosition}
        onGameTypeChange={setGameType}
        onStackDepthChange={setStackDepth}
        onPositionChange={setSelectedPosition}
        onActionLineChange={setActionLine}
        onVsPositionChange={setVsPosition}
      />

      {/* Row 2: Strategy tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        minHeight: '36px',
        padding: '0 8px',
        background: '#1e1e1e',
        borderBottom: '1px solid #333',
        gap: '4px',
        flexShrink: 0,
      }}>
        {/* Action Line indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: '#2a2a2a',
          borderRadius: '4px',
        }}>
          <span style={{ fontSize: '13px' }}>
            {actionLine === 'rfi'
              ? `${selectedPosition} RFI (率先加注)`
              : `BB vs ${vsPosition} (面对加注)`}
          </span>
        </div>

        <div style={{ width: '1px', height: '20px', background: '#444', margin: '0 8px' }} />

        {/* View tabs */}
        {['范围', 'Breakdown', '报告'].map((tab, i) => (
          <button
            key={tab}
            style={{
              padding: '6px 14px',
              background: i === 0 ? '#3a3a3a' : 'transparent',
              border: i === 0 ? '1px solid #555' : 'none',
              borderRadius: '4px',
              color: i === 0 ? '#fff' : '#888',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Summary stats */}
        {summary && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginRight: '8px' }}>
            <span style={{ color: '#888' }}>
              可打手牌: <span style={{ color: '#4ade80', fontWeight: 600 }}>{summary.playableHands}</span>
            </span>
            <span style={{ color: '#888' }}>
              平均EV: <span style={{ color: '#4ade80', fontWeight: 600 }}>{summary.avgEV.toFixed(2)}bb</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Range Matrix - 60% width */}
        <div
          style={{ flex: '0 0 60%', display: 'flex', overflow: 'hidden', position: 'relative' }}
          onClick={() => {
            setSelectedHand(null);
            setDetailCardPosition(null);
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 1fr)',
            gridTemplateRows: 'repeat(13, 1fr)',
            width: '100%',
            height: '100%',
            gap: '1px',
            background: '#1a1a1a',
          }}>
            {RANKS.map((_, row) =>
              RANKS.map((_, col) => {
                const hand = getHandLabel(row, col);
                const strategy = ranges instanceof Map ? ranges.get(hand) : ranges[hand];
                const isFiltered = !shouldShowHand(hand, strategy as GTOHandStrategy);
                return (
                  <MatrixCell
                    key={`${row}-${col}`}
                    hand={hand}
                    strategy={strategy}
                    isSelected={selectedHand === hand}
                    actionLine={actionLine}
                    isFiltered={isFiltered}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      if (selectedHand === hand) {
                        setSelectedHand(null);
                        setDetailCardPosition(null);
                      } else {
                        setSelectedHand(hand);
                        setDetailCardPosition({
                          x: rect.left,
                          y: rect.top,
                        });
                      }
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Floating detail card */}
          {selectedHand && detailCardPosition && (
            <div
              key={selectedHand}
              style={{
                position: 'fixed',
                left: detailCardPosition.x,
                top: detailCardPosition.y,
                zIndex: 1000,
              }}
            >
              <HandDetailCard
                hand={selectedHand}
                strategy={selectedStrategy}
                onClose={() => {
                  setSelectedHand(null);
                  setDetailCardPosition(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Right Panel - 40% width */}
        <div style={{ flex: '0 0 40%', background: '#1a1a1a', borderLeft: '1px solid #333', padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Top tabs */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px', flexShrink: 0 }}>
            {[
              { key: 'overview', label: '总览' },
              { key: 'table', label: '桌' },
              { key: 'equity', label: 'EV表格' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selectedTab === tab.key ? '#fff' : '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '0 0 6px 0',
                  borderBottom: selectedTab === tab.key ? '2px solid #22d3bf' : '2px solid transparent',
                  marginBottom: '-11px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table View - 牌桌可视化 */}
          {selectedTab === 'table' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              flexShrink: 0,
              marginBottom: '12px',
            }}>
              {/* 左侧牌桌 - 70% */}
              <div style={{
                flex: '0 0 70%',
                background: '#1e1e1e',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* 椭圆牌桌 */}
                <div style={{
                  width: '100%',
                  maxWidth: '280px',
                  height: '150px',
                  border: '3px solid #2a4035',
                  borderRadius: '80px',
                  position: 'relative',
                  background: 'linear-gradient(180deg, #1a2a22 0%, #162018 100%)',
                }}>
                  {/* 底池信息 */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>1.5 bb</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>底池赔率: 40%</div>
                  </div>

                  {/* 位置标记 - 6max布局 */}
                  {/* UTG - 左下 */}
                  <div style={{ position: 'absolute', bottom: '-12px', left: '12%', transform: 'translateX(-50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: selectedPosition === 'UTG' ? '#2d4a3a' : '#2a2a2a',
                      border: selectedPosition === 'UTG' ? '2px solid #4a9a6a' : '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                    }}>
                      <div style={{ fontWeight: 700, color: selectedPosition === 'UTG' ? '#4ade80' : '#fff' }}>UTG</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>{stackDepth}</div>
                    </div>
                  </div>

                  {/* HJ - 左侧 */}
                  <div style={{ position: 'absolute', top: '50%', left: '-12px', transform: 'translateY(-50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: selectedPosition === 'HJ' ? '#2d4a3a' : '#2a2a2a',
                      border: selectedPosition === 'HJ' ? '2px solid #4a9a6a' : '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                    }}>
                      <div style={{ fontWeight: 700, color: selectedPosition === 'HJ' ? '#4ade80' : '#fff' }}>HJ</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>{stackDepth}</div>
                    </div>
                  </div>

                  {/* CO - 左上 */}
                  <div style={{ position: 'absolute', top: '-12px', left: '12%', transform: 'translateX(-50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: selectedPosition === 'CO' ? '#2d4a3a' : '#2a2a2a',
                      border: selectedPosition === 'CO' ? '2px solid #4a9a6a' : '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                    }}>
                      <div style={{ fontWeight: 700, color: selectedPosition === 'CO' ? '#4ade80' : '#fff' }}>CO</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>{stackDepth}</div>
                    </div>
                  </div>

                  {/* BTN - 右上 */}
                  <div style={{ position: 'absolute', top: '-12px', right: '12%', transform: 'translateX(50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: selectedPosition === 'BTN' ? '#2d4a3a' : '#2a2a2a',
                      border: selectedPosition === 'BTN' ? '2px solid #4a9a6a' : '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                      position: 'relative',
                    }}>
                      <div style={{ fontWeight: 700, color: selectedPosition === 'BTN' ? '#4ade80' : '#fff' }}>BTN</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>{stackDepth}</div>
                      {/* D button */}
                      <div style={{
                        position: 'absolute',
                        right: '-10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        background: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#000',
                      }}>D</div>
                    </div>
                  </div>

                  {/* SB - 右侧 */}
                  <div style={{ position: 'absolute', top: '50%', right: '-12px', transform: 'translateY(-50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: selectedPosition === 'SB' ? '#2d4a3a' : '#2a2a2a',
                      border: selectedPosition === 'SB' ? '2px solid #4a9a6a' : '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                      position: 'relative',
                    }}>
                      <div style={{ fontWeight: 700, color: selectedPosition === 'SB' ? '#4ade80' : '#fff' }}>SB</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>199.5</div>
                      {/* SB chip */}
                      <div style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}>
                        <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                        <span style={{ fontSize: '8px', color: '#888' }}>0.5</span>
                      </div>
                    </div>
                  </div>

                  {/* BB - 右下 */}
                  <div style={{ position: 'absolute', bottom: '-12px', right: '12%', transform: 'translateX(50%)' }}>
                    <div style={{
                      padding: '5px 8px',
                      background: '#2a2a2a',
                      border: '2px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '10px',
                      textAlign: 'center',
                      minWidth: '36px',
                      position: 'relative',
                    }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>BB</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>199</div>
                      {/* BB chip */}
                      <div style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}>
                        <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                        <span style={{ fontSize: '8px', color: '#888' }}>1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧信息卡片 - 30% */}
              <div style={{
                flex: '0 0 30%',
                background: '#252525',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* 头部 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #333',
                }}>
                  <span style={{
                    color: '#4ade80',
                    fontSize: '16px',
                    fontWeight: 700
                  }}>{actionLine === 'rfi' ? selectedPosition : 'BB'}</span>
                  <span style={{
                    color: '#888',
                    fontSize: '12px',
                    background: '#333',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>{actionLine === 'rfi' ? 'RFI' : `vs ${vsPosition}`}</span>
                </div>

                {/* 统计数据 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>EV/底池</span>
                    <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>
                      {summary ? `${(summary.avgEV / 1.5 * 100).toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>权益</span>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>-</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>EQR</span>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>-</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>组合</span>
                    <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>
                      {summary ? `~${Math.round(summary.playableHands * 6)}` : '-'}
                    </span>
                  </div>
                </div>

                {/* 分隔线 */}
                <div style={{
                  height: '1px',
                  background: '#333',
                  margin: '16px 0'
                }} />

                {/* 行动频率 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: ACTION_COLORS.raise, borderRadius: '2px' }} />
                    <span style={{ color: '#888', fontSize: '11px', flex: 1 }}>{actionLine === 'rfi' ? 'Raise' : '3-Bet'}</span>
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                      {summary?.raiseFreq.toFixed(1)}%
                    </span>
                  </div>
                  {actionLine === 'vs_rfi' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', background: ACTION_COLORS.call, borderRadius: '2px' }} />
                      <span style={{ color: '#888', fontSize: '11px', flex: 1 }}>Call</span>
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                        {summary?.callFreq.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: ACTION_COLORS.fold, borderRadius: '2px' }} />
                    <span style={{ color: '#888', fontSize: '11px', flex: 1 }}>Fold</span>
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                      {summary?.foldFreq.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview tab - Position indicators */}
          {selectedTab === 'overview' && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexShrink: 0 }}>
              {positions.map(p => (
                <div
                  key={p.pos}
                  onClick={() => p.available && setSelectedPosition(p.pos)}
                  style={{
                    padding: '4px 6px',
                    background: p.pos === selectedPosition ? '#2d4a3a' : '#252525',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: p.pos === selectedPosition ? '#fff' : '#888',
                    textAlign: 'center',
                    flex: 1,
                    cursor: p.available ? 'pointer' : 'not-allowed',
                    opacity: p.available ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.pos}</div>
                  <div style={{ fontSize: '9px' }}>{stackDepth}</div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats when Overview tab is selected */}
          {selectedTab === 'overview' && summary && (
            <div style={{
              background: '#252525',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>范围统计</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: ACTION_COLORS.raise }}>{summary.raiseFreq}%</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Raise</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: ACTION_COLORS.fold }}>{summary.foldFreq}%</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Fold</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>{summary.avgEV.toFixed(2)}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Avg EV (bb)</div>
                </div>
              </div>
            </div>
          )}

          {/* Action header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>行动</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Action cards - 动态布局 */}
          {(() => {
            // 使用整体范围统计而非单手牌
            const raiseFreq = summary?.raiseFreq || 0;
            const callFreq = summary?.callFreq || 0;
            const foldFreq = summary?.foldFreq || 0;
            const allinFreq = summary?.allinFreq || 0;
            const totalCombos = 1326; // 总组合数

            // vs RFI 场景下显示 3-bet / Call / Fold
            if (actionLine === 'vs_rfi') {
              return (
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {/* 3-Bet */}
                    <div style={{ flex: 1, background: ACTION_COLORS.raise, borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>3-Bet 11bb</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{raiseFreq.toFixed(1)}%</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                          {((raiseFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                        </div>
                      </div>
                    </div>
                    {/* Call */}
                    <div style={{ flex: 1, background: ACTION_COLORS.call, borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Call</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{callFreq.toFixed(1)}%</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                          {((callFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                        </div>
                      </div>
                    </div>
                    {/* Fold */}
                    <div style={{ flex: 1, background: ACTION_COLORS.fold, borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Fold</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{foldFreq.toFixed(1)}%</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                          {((foldFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    {raiseFreq > 0 && <div style={{ width: `${raiseFreq}%`, background: ACTION_COLORS.raise }} />}
                    {callFreq > 0 && <div style={{ width: `${callFreq}%`, background: ACTION_COLORS.call }} />}
                    {foldFreq > 0 && <div style={{ width: `${foldFreq}%`, background: ACTION_COLORS.fold }} />}
                  </div>
                </div>
              );
            }

            // RFI 场景下显示 Allin / Raise / Fold
            return (
              <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {/* Allin */}
                  <div style={{ flex: 1, background: ACTION_COLORS.allin, borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Allin 200</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{allinFreq}%</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                        {((allinFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                      </div>
                    </div>
                  </div>
                  {/* Raise */}
                  <div style={{ flex: 1, background: ACTION_COLORS.raise, borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Raise 2.5</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{raiseFreq.toFixed(1)}%</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                        {((raiseFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                      </div>
                    </div>
                  </div>
                  {/* Fold */}
                  <div style={{ flex: 1, background: ACTION_COLORS.fold, borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Fold</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{foldFreq.toFixed(1)}%</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                        {((foldFreq / 100) * totalCombos).toFixed(0)}<br/>combos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  {allinFreq > 0 && <div style={{ width: `${allinFreq}%`, background: ACTION_COLORS.allin }} />}
                  {raiseFreq > 0 && <div style={{ width: `${raiseFreq}%`, background: ACTION_COLORS.raise }} />}
                  {foldFreq > 0 && <div style={{ width: `${foldFreq}%`, background: ACTION_COLORS.fold }} />}
                </div>
              </div>
            );
          })()}

          {/* Hand tabs */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px', flexShrink: 0 }}>
            {[
              { key: 'hands', label: '手牌组合' },
              { key: 'overview', label: '总览' },
              { key: 'filter', label: '筛选' },
              { key: 'blockers', label: '阻挡牌' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedHandTab(tab.key as typeof selectedHandTab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selectedHandTab === tab.key ? '#fff' : '#666',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '0 0 4px 0',
                  borderBottom: selectedHandTab === tab.key ? '2px solid #22d3bf' : '2px solid transparent',
                  marginBottom: '-9px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter tab content */}
          {selectedHandTab === 'filter' && (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0' }}>
              {/* 行动类型筛选 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>按行动筛选</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { key: 'all', label: '全部', color: '#666' },
                    { key: 'raise', label: actionLine === 'rfi' ? 'Raise' : '3-Bet', color: ACTION_COLORS.raise },
                    { key: 'call', label: 'Call', color: ACTION_COLORS.call },
                    { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
                    { key: 'mixed', label: '混合策略', color: '#9b5de5' },
                  ].filter(item => actionLine === 'rfi' ? item.key !== 'call' : true).map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActionFilter(item.key as ActionFilter)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: actionFilter === item.key ? `2px solid ${item.color}` : '2px solid #333',
                        background: actionFilter === item.key ? `${item.color}22` : '#252525',
                        color: actionFilter === item.key ? item.color : '#888',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 手牌类型筛选 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>按手牌类型</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'pairs', label: '对子 (AA-22)' },
                    { key: 'suited', label: '同花 (AKs...)' },
                    { key: 'offsuit', label: '不同花 (AKo...)' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setHandTypeFilter(item.key as HandTypeFilter)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: handTypeFilter === item.key ? '2px solid #22d3bf' : '2px solid #333',
                        background: handTypeFilter === item.key ? 'rgba(34, 211, 191, 0.15)' : '#252525',
                        color: handTypeFilter === item.key ? '#22d3bf' : '#888',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 筛选结果统计 */}
              <div style={{
                background: '#252525',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>筛选结果</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '14px' }}>符合条件的手牌</span>
                  <span style={{ color: '#4ade80', fontSize: '18px', fontWeight: 700 }}>
                    {Object.entries(ranges).filter(([hand, strategy]) => shouldShowHand(hand, strategy as GTOHandStrategy)).length}
                  </span>
                </div>
              </div>

              {/* 重置按钮 */}
              <button
                onClick={() => {
                  setActionFilter('all');
                  setHandTypeFilter('all');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#1e1e1e',
                  color: '#888',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                重置筛选条件
              </button>
            </div>
          )}

          {/* Blockers tab content */}
          {selectedHandTab === 'blockers' && (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0' }}>
              {selectedHand ? (
                <>
                  {/* 当前手牌 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#252525',
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {selectedHand}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      阻挡效果分析
                    </div>
                  </div>

                  {/* 阻挡分析说明 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>阻挡的强牌组合</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(() => {
                        const rank1 = selectedHand[0];
                        const rank2 = selectedHand.length > 2 ? selectedHand[1] : rank1;
                        const blockedHands: { hand: string; blocked: number; total: number; desc: string }[] = [];

                        // 检查阻挡的对子
                        if (rank1 === 'A') {
                          blockedHands.push({ hand: 'AA', blocked: 3, total: 6, desc: '阻挡3个AA组合' });
                        }
                        if (rank1 === 'K' || rank2 === 'K') {
                          blockedHands.push({ hand: 'KK', blocked: rank1 === rank2 ? 4 : 3, total: 6, desc: rank1 === rank2 ? '阻挡4个KK组合' : '阻挡3个KK组合' });
                        }
                        if (rank1 === 'A' || rank2 === 'A') {
                          blockedHands.push({ hand: 'AK', blocked: 4, total: 16, desc: '阻挡4个AK组合' });
                        }

                        // 如果没有明显阻挡
                        if (blockedHands.length === 0) {
                          return (
                            <div style={{
                              padding: '12px',
                              background: '#1e1e1e',
                              borderRadius: '6px',
                              color: '#666',
                              fontSize: '12px',
                            }}>
                              该手牌没有显著的阻挡效果
                            </div>
                          );
                        }

                        return blockedHands.map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: '#1e1e1e',
                            borderRadius: '6px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#c23b3b',
                                minWidth: '32px',
                              }}>{item.hand}</span>
                              <span style={{ fontSize: '12px', color: '#888' }}>{item.desc}</span>
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#4ade80',
                              fontWeight: 600,
                            }}>
                              {item.blocked}/{item.total}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* 阻挡效果评级 */}
                  <div style={{
                    background: '#252525',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>阻挡效果评级</div>
                    {(() => {
                      const rank1 = selectedHand[0];
                      const rank2 = selectedHand.length > 2 ? selectedHand[1] : rank1;
                      const hasAce = rank1 === 'A' || rank2 === 'A';
                      const hasKing = rank1 === 'K' || rank2 === 'K';
                      const hasBroadway = ['A', 'K', 'Q', 'J', 'T'].includes(rank1) || ['A', 'K', 'Q', 'J', 'T'].includes(rank2);

                      let rating = '低';
                      let color = '#666';
                      let desc = '该手牌的阻挡效果较弱';

                      if (hasAce && hasKing) {
                        rating = '极高';
                        color = '#4ade80';
                        desc = '同时阻挡AA、KK、AK，是最佳的阻挡组合';
                      } else if (hasAce) {
                        rating = '高';
                        color = '#22d3bf';
                        desc = '阻挡AA和AK，有较强的阻挡价值';
                      } else if (hasKing) {
                        rating = '中等';
                        color = '#f59e0b';
                        desc = '阻挡KK和AK，有一定阻挡价值';
                      } else if (hasBroadway) {
                        rating = '低-中';
                        color = '#888';
                        desc = '阻挡部分高牌组合';
                      }

                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color, marginBottom: '4px' }}>{rating}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{desc}</div>
                          </div>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            border: `3px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color }}>{rating === '极高' ? 'S' : rating === '高' ? 'A' : rating === '中等' ? 'B' : 'C'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 策略建议 */}
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(34, 211, 191, 0.1)',
                    border: '1px solid rgba(34, 211, 191, 0.3)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#22d3bf', marginBottom: '6px', fontWeight: 600 }}>策略提示</div>
                    <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.5 }}>
                      持有阻挡牌时，对手的价值范围变窄，这增加了我们诈唬的EV。但同时也需要考虑对手的弃牌频率和SPR。
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>选择一手牌查看阻挡牌分析</div>
                  <div style={{ fontSize: '12px' }}>点击左侧范围矩阵中的任意手牌</div>
                </div>
              )}
            </div>
          )}

          {/* Hand combos - 根据视图切换不同样式 */}
          {selectedHandTab !== 'filter' && selectedHandTab !== 'blockers' && (() => {
            const raiseAction = selectedStrategy?.actions.find(a => a.action === 'raise');
            const callAction = selectedStrategy?.actions.find(a => a.action === 'call');
            const foldAction = selectedStrategy?.actions.find(a => a.action === 'fold');
            const allinAction = selectedStrategy?.actions.find(a => a.action === 'allin');

            const raiseFreq = raiseAction?.frequency || 0;
            const callFreq = callAction?.frequency || 0;
            const foldFreq = foldAction?.frequency || 0;
            const allinFreq = allinAction?.frequency || 0;
            const raiseEV = raiseAction?.ev || 0;
            const raiseSize = raiseAction?.size || 2.5;

            // 根据选中手牌生成组合
            const getHandCombos = () => {
              if (!selectedHand) return [];
              const rank1 = selectedHand[0];
              const rank2 = selectedHand[1];
              const isPair = rank1 === rank2;
              const isSuited = selectedHand.endsWith('s');

              const suits = ['♠', '♥', '♦', '♣'];
              const suitColors: Record<string, string> = {
                '♠': '#ffffff',
                '♥': '#e53935',
                '♦': '#2196f3',
                '♣': '#4caf50',
              };

              const combos: { cards: string[]; c1: string; c2: string }[] = [];

              if (isPair) {
                for (let i = 0; i < 4; i++) {
                  for (let j = i + 1; j < 4; j++) {
                    combos.push({
                      cards: [`${rank1}${suits[i]}`, `${rank2}${suits[j]}`],
                      c1: suitColors[suits[i]],
                      c2: suitColors[suits[j]],
                    });
                  }
                }
              } else if (isSuited) {
                for (let i = 0; i < 4; i++) {
                  combos.push({
                    cards: [`${rank1}${suits[i]}`, `${rank2}${suits[i]}`],
                    c1: suitColors[suits[i]],
                    c2: suitColors[suits[i]],
                  });
                }
              } else {
                for (let i = 0; i < 4; i++) {
                  for (let j = 0; j < 4; j++) {
                    if (i !== j) {
                      combos.push({
                        cards: [`${rank1}${suits[i]}`, `${rank2}${suits[j]}`],
                        c1: suitColors[suits[i]],
                        c2: suitColors[suits[j]],
                      });
                    }
                  }
                }
              }
              return combos;
            };

            const combos = getHandCombos();

            // 计算背景色
            const getComboBackground = () => {
              if (allinFreq >= 50) return ACTION_COLORS.allin;
              if (raiseFreq >= 70) return ACTION_COLORS.raise;
              if (foldFreq >= 100) return ACTION_COLORS.fold;
              if (raiseFreq > 0 && foldFreq > 0) {
                return `linear-gradient(to right, ${ACTION_COLORS.raise} ${raiseFreq}%, ${ACTION_COLORS.fold} ${raiseFreq}%)`;
              }
              return ACTION_COLORS.fold;
            };

            // 桌视图使用列表样式
            if (selectedTab === 'table') {
              return (
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  {combos.length > 0 ? combos.map((combo, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0',
                      borderBottom: '1px solid #2a2a2a',
                    }}>
                      {/* 手牌标签 */}
                      <div style={{
                        display: 'inline-flex',
                        gap: '1px',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        minWidth: '48px',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: combo.c1 === '#ffffff' ? '#1a1a1a' : combo.c1 }}>{combo.cards[0]}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: combo.c2 === '#ffffff' ? '#1a1a1a' : combo.c2 }}>{combo.cards[1]}</span>
                      </div>

                      {/* 行动分布条 */}
                      <div style={{ flex: 1, display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                        {allinFreq > 0 && (
                          <div style={{
                            width: `${allinFreq}%`,
                            background: ACTION_COLORS.allin,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}>
                            {allinFreq >= 15 && `${allinFreq}%`}
                          </div>
                        )}
                        {raiseFreq > 0 && (
                          <div style={{
                            width: `${raiseFreq}%`,
                            background: ACTION_COLORS.raise,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}>
                            {raiseFreq >= 15 && `${raiseFreq}%`}
                          </div>
                        )}
                        {foldFreq > 0 && (
                          <div style={{
                            width: `${foldFreq}%`,
                            background: ACTION_COLORS.fold,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}>
                            {foldFreq >= 15 && `${foldFreq}%`}
                          </div>
                        )}
                      </div>

                      {/* EV */}
                      <div style={{
                        minWidth: '50px',
                        textAlign: 'right',
                        fontSize: '11px',
                        color: '#4ade80',
                        fontWeight: 600,
                      }}>
                        {raiseEV > 0 ? `+${raiseEV.toFixed(2)}` : raiseEV.toFixed(2)}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                      点击左侧矩阵选择一手牌查看详细组合
                    </div>
                  )}
                </div>
              );
            }

            // EV表格视图 - 显示所有手牌的EV排行
            if (selectedTab === 'equity') {
              // 获取所有手牌的EV数据并排序
              const allHandsEV = Object.entries(ranges)
                .map(([hand, strategy]) => {
                  const s = strategy as GTOHandStrategy;
                  const weightedEV = s.actions.reduce((sum, act) => sum + (act.frequency / 100) * act.ev, 0);
                  const raiseAct = s.actions.find(a => a.action === 'raise');
                  const callAct = s.actions.find(a => a.action === 'call');
                  const foldAct = s.actions.find(a => a.action === 'fold');
                  return {
                    hand,
                    ev: weightedEV,
                    raiseFreq: raiseAct?.frequency || 0,
                    raiseEV: raiseAct?.ev || 0,
                    callFreq: callAct?.frequency || 0,
                    callEV: callAct?.ev || 0,
                    foldFreq: foldAct?.frequency || 0,
                    equity: s.equity,
                    combos: s.totalCombos,
                  };
                })
                .filter(h => h.foldFreq < 100) // 只显示可玩手牌
                .sort((a, b) => b.ev - a.ev);

              return (
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  {/* 表头 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 70px 80px 80px 70px 60px',
                    gap: '8px',
                    padding: '8px 12px',
                    background: '#1a1a1a',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: '1px solid #333',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>手牌</span>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textAlign: 'right' }}>EV</span>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textAlign: 'right' }}>加注%</span>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textAlign: 'right' }}>跟注%</span>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textAlign: 'right' }}>弃牌%</span>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textAlign: 'right' }}>权益%</span>
                  </div>
                  {/* 表格内容 */}
                  {allHandsEV.map((h, idx) => (
                    <div
                      key={h.hand}
                      onClick={() => setSelectedHand(h.hand)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 70px 80px 80px 70px 60px',
                        gap: '8px',
                        padding: '10px 12px',
                        background: selectedHand === h.hand ? '#2a3a2a' : idx % 2 === 0 ? '#1e1e1e' : '#1a1a1a',
                        cursor: 'pointer',
                        borderLeft: selectedHand === h.hand ? '3px solid #22d3bf' : '3px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* 手牌 */}
                      <div style={{
                        display: 'inline-flex',
                        gap: '1px',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        width: 'fit-content',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: h.hand.includes('s') ? '#e53935' : '#1a1a1a' }}>{h.hand}</span>
                      </div>
                      {/* EV */}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: h.ev > 0 ? '#4ade80' : h.ev < 0 ? '#ef4444' : '#888',
                        textAlign: 'right',
                      }}>
                        {h.ev > 0 ? '+' : ''}{h.ev.toFixed(2)}
                      </span>
                      {/* 加注% */}
                      <span style={{ fontSize: '13px', color: h.raiseFreq > 0 ? '#c23b3b' : '#444', textAlign: 'right', fontWeight: h.raiseFreq > 50 ? 600 : 400 }}>
                        {h.raiseFreq > 0 ? `${h.raiseFreq}%` : '-'}
                      </span>
                      {/* 跟注% */}
                      <span style={{ fontSize: '13px', color: h.callFreq > 0 ? '#4ecdc4' : '#444', textAlign: 'right', fontWeight: h.callFreq > 50 ? 600 : 400 }}>
                        {h.callFreq > 0 ? `${h.callFreq}%` : '-'}
                      </span>
                      {/* 弃牌% */}
                      <span style={{ fontSize: '13px', color: h.foldFreq > 0 ? '#888' : '#444', textAlign: 'right' }}>
                        {h.foldFreq > 0 ? `${h.foldFreq}%` : '-'}
                      </span>
                      {/* 权益 */}
                      <span style={{ fontSize: '13px', color: '#888', textAlign: 'right' }}>
                        {h.equity.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {allHandsEV.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
                      没有可玩手牌数据
                    </div>
                  )}
                  {/* 统计摘要 */}
                  <div style={{
                    padding: '12px',
                    background: '#1a1a1a',
                    borderTop: '1px solid #333',
                    borderRadius: '0 0 8px 8px',
                    marginTop: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                      <span>可玩手牌: {allHandsEV.length}</span>
                      <span>平均EV: <span style={{ color: '#4ade80', fontWeight: 600 }}>
                        {allHandsEV.length > 0 ? (allHandsEV.reduce((s, h) => s + h.ev, 0) / allHandsEV.length).toFixed(2) : '0.00'}bb
                      </span></span>
                    </div>
                  </div>
                </div>
              );
            }

            // 总览视图使用网格样式
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', flex: 1, alignContent: 'start', overflowY: 'auto', minHeight: 0 }}>
                {combos.length > 0 ? combos.map((combo, idx) => (
                  <div key={idx} style={{ background: getComboBackground(), borderRadius: '8px', padding: '12px' }}>
                    {/* 手牌显示区域 - tag 样式 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        gap: '2px',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '4px',
                        padding: '3px 6px',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: combo.c1 === '#ffffff' ? '#1a1a1a' : combo.c1 }}>{combo.cards[0]}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: combo.c2 === '#ffffff' ? '#1a1a1a' : combo.c2 }}>{combo.cards[1]}</span>
                      </div>
                      {selectedStrategy && (
                        <span style={{ fontSize: '14px', color: '#4ade80', fontWeight: 700 }}>
                          {selectedStrategy.equity.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {/* 行动数据区域 */}
                    <div style={{ fontSize: '12px' }}>
                      {allinFreq > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>全下</span>
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{allinFreq}%</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>加注 {raiseSize}x</span>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{raiseFreq}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>期望值</span>
                        <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>{raiseEV.toFixed(2)}bb</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>弃牌</span>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{foldFreq}%</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '20px 0' }}>
                    点击左侧矩阵选择一手牌查看详细组合
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
