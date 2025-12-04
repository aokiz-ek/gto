// GTO Core - Game Theory Optimal Poker Algorithms

export * from './types';
export * from './constants';
export * from './utils/cards';
export * from './utils/ranges';
export * from './utils/equity';

// GTO Data
export * from './data/gto-ranges';
export { GTO_VS_RFI_RANGES, GTO_RANGES_100BB, getStrategyByActionLine, getStrategyByStackDepth } from './data/gto-ranges';
export type { ActionLineKey } from './data/gto-ranges';

// vs 3-Bet Data
export { GTO_VS_3BET_RANGES, getVs3BetStrategy, getAvailableVs3BetScenarios } from './data/gto-vs-3bet-ranges';

// 3-Bet Ranges (How to construct 3-bet ranges)
export { GTO_3BET_RANGES, get3BetStrategy, getAvailable3BetScenarios } from './data/gto-3bet-ranges';

// Squeeze Ranges (3-betting after open + call)
export { GTO_SQUEEZE_RANGES, getSqueezeStrategy, getAvailableSqueezeScenarios } from './data/gto-squeeze-ranges';

// Postflop Data
export {
  // Strategy data
  FLOP_CBET_IP,
  FLOP_CBET_OOP,
  FACING_CBET,
  CHECK_RAISE_FLOP,
  PROBE_BET_TURN,
  DONK_BET_FLOP,
  TURN_BARREL,
  RIVER_VALUE,
  // Analysis functions
  analyzeBoardTexture,
  evaluateHandStrength,
  getPostflopStrategy,
  getRecommendedAction,
  getSPRCategory,
  analyzeDrawType,
  adjustForMultiway,
  adjustForSPR,
} from './data/gto-postflop-ranges';
export type {
  BoardTexture,
  DrawType,
  SPRCategory,
  PlayerCount,
  HandStrength,
  PostflopAction,
  PostflopStrategy,
  PostflopScenario,
} from './data/gto-postflop-ranges';

// Strategy Explainer - Human-readable explanations for GTO recommendations
export {
  explainPreflopAction,
  explainPostflopAction,
  generateFullAnalysis,
  formatExplanationForDisplay,
} from './utils/strategy-explainer';
export type {
  StrategyExplanation,
  StrategyFactor,
  AlternativeAction,
  PreflopContext as ExplainerPreflopContext,
  PostflopContext as ExplainerPostflopContext,
} from './utils/strategy-explainer';

// Hand History Parser - Parse hand histories from PokerStars, 888poker, etc.
export {
  parseHandHistory,
  parseMultipleHands,
  handHistoryToString,
} from './utils/handHistoryParser';
export type {
  ParsedHandHistory,
  ParsedPlayer,
  ParsedAction,
} from './utils/handHistoryParser';

// EV Calculator - Calculate Expected Value loss for poker decisions
export {
  normalizeAction,
  getErrorSeverity,
  getSeverityColor,
  getSeverityLabel,
  calculatePreflopEVLoss,
  calculatePostflopEVLoss,
  calculateAggregateStats,
} from './utils/evCalculator';
export type {
  NormalizedAction,
  ErrorSeverity,
  EVAnalysis,
  ActionRecommendation,
  EVBreakdown,
  PreflopContext,
  PostflopContext,
  AggregateEVStats,
} from './utils/evCalculator';
