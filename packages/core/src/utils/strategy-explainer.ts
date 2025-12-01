// Strategy Explainer - Explains GTO recommendations in human-readable format
// Provides context and reasoning for why certain actions are optimal

import type { Position, Card, ActionType } from '../types';
import type {
  BoardTexture,
  HandStrength,
  PostflopAction,
  PostflopScenario,
  SPRCategory,
  DrawType,
  PlayerCount,
} from '../data/gto-postflop-ranges';

// Explanation structure
export interface StrategyExplanation {
  summary: string;           // One-line summary
  reasoning: string[];       // Bullet points explaining why
  factors: StrategyFactor[]; // Contributing factors
  evEstimate?: number;       // Expected value if available
  alternatives?: AlternativeAction[]; // Other viable options
  tips?: string[];           // Additional tips for the player
}

export interface StrategyFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-10
  description: string;
}

export interface AlternativeAction {
  action: string;
  frequency: number;
  reasoning: string;
}

// Preflop explanation context
export interface PreflopContext {
  position: Position;
  hand: string;
  actionFacing: 'open' | 'vs_raise' | 'vs_3bet' | 'vs_4bet';
  stackDepth?: number;
  villainPosition?: Position;
}

// Postflop explanation context
export interface PostflopContext {
  street: 'flop' | 'turn' | 'river';
  scenario: PostflopScenario;
  boardTexture: BoardTexture;
  handStrength: HandStrength;
  drawType?: DrawType;
  spr?: SPRCategory;
  playerCount?: PlayerCount;
  potSize?: number;
  stackSize?: number;
  isInPosition: boolean;
}

// Position-based reasoning
const POSITION_EXPLANATIONS: Record<Position, string> = {
  UTG: 'From UTG (Under the Gun), you face action from 8 players, requiring the tightest range.',
  UTG1: 'UTG1 is second earliest position, still requiring a tight range with 7 players to act.',
  UTG2: 'From UTG2, the range opens slightly but remains quite tight with 6 players behind.',
  LJ: 'The Lojack (LJ) is middle position where ranges start to widen, but still face 5 players.',
  HJ: 'From the Hijack (HJ), you can play more hands as only 4 players act after you.',
  CO: 'The Cutoff (CO) is a strong stealing position with only the button and blinds to act.',
  BTN: 'The Button is the best position - you act last postflop and can play the widest range.',
  SB: 'Small Blind acts first postflop and must call half the blind, often playing cautiously.',
  BB: 'Big Blind gets to close the action preflop and defends wider due to pot odds.',
};

// Hand strength explanations
const HAND_STRENGTH_EXPLANATIONS: Record<HandStrength, string> = {
  nuts: 'You have the best possible hand or close to it. This is a value betting opportunity.',
  strong: 'Your hand is very strong (two pair+, strong overpair). Build the pot for value.',
  medium: 'Medium strength hand (top pair good kicker, overpair). Balance protection and pot control.',
  marginal: 'Marginal hand (top pair weak kicker, middle pair). Exercise caution and pot control.',
  weak: 'Weak made hand. Usually best to check and minimize losses.',
  draw: 'Drawing hand with good potential. Consider pot odds and implied odds.',
  air: 'No made hand or draw. Bluff selectively or give up.',
};

// Board texture explanations
const BOARD_TEXTURE_EXPLANATIONS: Record<BoardTexture, string> = {
  dry: 'Dry board with few draws. Ranges are more defined, small bets are effective.',
  wet: 'Wet board with many draws. Bet larger to charge draws and protect your hand.',
  monotone: 'Three cards of one suit. Flush draws are live; play cautiously without a flush.',
  paired: 'Paired board reduces possible hand combinations. Bluffs can be more effective.',
  connected: 'Connected board with straight possibilities. Many draws are present.',
  high: 'High card board that favors the preflop aggressor\'s range.',
  low: 'Low card board that favors the caller\'s range with more small pairs.',
  ace_high: 'Ace-high board heavily favors the preflop aggressor\'s range.',
};

// SPR explanations
const SPR_EXPLANATIONS: Record<SPRCategory, string> = {
  micro: 'Very low SPR (<2). Commit with good hands or fold; no room for maneuver.',
  small: 'Small SPR (2-4). One bet can commit stacks. Play straightforwardly.',
  medium: 'Medium SPR (4-8). Two streets of betting available. Balance value and bluffs.',
  large: 'Large SPR (8-13). Standard cash game situation. Play ranges normally.',
  deep: 'Deep SPR (>13). Multiple streets of betting. Pot control becomes important.',
};

// Scenario explanations
const SCENARIO_EXPLANATIONS: Record<PostflopScenario, string> = {
  cbet_ip: 'Continuation betting in position. Leverage position and initiative.',
  cbet_oop: 'Continuation betting out of position. Be more selective and polarized.',
  facing_cbet: 'Defending against a continuation bet. Consider equity and position.',
  check_raise: 'Check-raising as OOP defender. Balance value hands and bluffs.',
  probe_bet: 'Probe betting after IP checks back. Attack capped ranges.',
  donk_bet: 'Donk betting into the preflop aggressor. Use sparingly on specific boards.',
  turn_barrel: 'Second barrel on the turn. Continue value and semi-bluffs.',
  river_value: 'River value betting. Maximize with strong hands.',
  facing_turn_bet: 'Facing a turn bet. Narrow your range and consider odds.',
  facing_river_bet: 'Facing a river bet. Make exploitative decisions based on sizing.',
};

// Generate explanation for preflop action
export function explainPreflopAction(
  context: PreflopContext,
  recommendedAction: ActionType,
  frequency: number
): StrategyExplanation {
  const factors: StrategyFactor[] = [];
  const reasoning: string[] = [];
  const tips: string[] = [];

  // Position factor
  factors.push({
    factor: 'Position',
    impact: ['BTN', 'CO', 'HJ'].includes(context.position) ? 'positive' :
            ['UTG', 'UTG1', 'UTG2'].includes(context.position) ? 'negative' : 'neutral',
    weight: 8,
    description: POSITION_EXPLANATIONS[context.position],
  });

  // Hand category factor
  const handCategory = categorizeHand(context.hand);
  factors.push({
    factor: 'Hand Strength',
    impact: handCategory.isPremium ? 'positive' : handCategory.isPlayable ? 'neutral' : 'negative',
    weight: 9,
    description: handCategory.description,
  });

  // Stack depth factor
  if (context.stackDepth) {
    const stackFactor = context.stackDepth >= 100 ? 'positive' :
                        context.stackDepth >= 50 ? 'neutral' : 'negative';
    factors.push({
      factor: 'Stack Depth',
      impact: stackFactor,
      weight: 5,
      description: `With ${context.stackDepth}BB effective, ${
        context.stackDepth >= 100 ? 'you have full flexibility in postflop play.' :
        context.stackDepth >= 50 ? 'you have moderate postflop flexibility.' :
        'stack depth limits postflop maneuverability.'
      }`,
    });
  }

  // Generate reasoning based on action
  switch (recommendedAction) {
    case 'raise':
      reasoning.push(`${context.hand} is strong enough to open from ${context.position}.`);
      if (handCategory.isPremium) {
        reasoning.push('Premium hands should always be raised for value.');
      }
      if (['BTN', 'CO', 'HJ'].includes(context.position)) {
        reasoning.push('Late position allows wider opening ranges.');
      }
      tips.push('Size your raise consistently to avoid giving away information.');
      break;

    case 'call':
      reasoning.push(`${context.hand} has implied odds but not enough value to raise.`);
      reasoning.push('Calling keeps weaker hands in and doesn\'t bloat the pot.');
      tips.push('Be prepared to fold to aggression without improvement.');
      break;

    case 'fold':
      reasoning.push(`${context.hand} doesn't have enough equity from ${context.position}.`);
      if (['UTG', 'UTG1', 'UTG2'].includes(context.position)) {
        reasoning.push('Early position requires much tighter ranges.');
      }
      tips.push('Folding weak hands preserves your stack for better spots.');
      break;

    case 'all-in':
      reasoning.push(`With ${context.stackDepth || 'short'} BBs, ${context.hand} is a shove.`);
      reasoning.push('Push-fold strategy is optimal with short stacks.');
      break;
  }

  // Summary
  const summary = frequency >= 70
    ? `${recommendedAction.toUpperCase()} with ${context.hand} from ${context.position} (${frequency}% frequency)`
    : `Mixed strategy: ${recommendedAction} ${frequency}% of the time with ${context.hand}`;

  return {
    summary,
    reasoning,
    factors,
    tips,
  };
}

// Generate explanation for postflop action
export function explainPostflopAction(
  context: PostflopContext,
  recommendedAction: PostflopAction
): StrategyExplanation {
  const factors: StrategyFactor[] = [];
  const reasoning: string[] = [];
  const tips: string[] = [];
  const alternatives: AlternativeAction[] = [];

  // Hand strength factor
  factors.push({
    factor: 'Hand Strength',
    impact: ['nuts', 'strong'].includes(context.handStrength) ? 'positive' :
            ['weak', 'air'].includes(context.handStrength) ? 'negative' : 'neutral',
    weight: 10,
    description: HAND_STRENGTH_EXPLANATIONS[context.handStrength],
  });

  // Board texture factor
  factors.push({
    factor: 'Board Texture',
    impact: 'neutral',
    weight: 7,
    description: BOARD_TEXTURE_EXPLANATIONS[context.boardTexture],
  });

  // Position factor
  factors.push({
    factor: 'Position',
    impact: context.isInPosition ? 'positive' : 'negative',
    weight: 8,
    description: context.isInPosition
      ? 'Acting last gives you information advantage and allows you to control the pot.'
      : 'Acting first puts you at an information disadvantage. Play more straightforwardly.',
  });

  // SPR factor
  if (context.spr) {
    factors.push({
      factor: 'Stack-to-Pot Ratio',
      impact: context.spr === 'large' || context.spr === 'medium' ? 'neutral' :
              context.spr === 'micro' ? 'negative' : 'neutral',
      weight: 6,
      description: SPR_EXPLANATIONS[context.spr],
    });
  }

  // Draw factor
  if (context.drawType && context.drawType !== 'no_draw') {
    factors.push({
      factor: 'Draw Potential',
      impact: ['combo_draw', 'flush_draw', 'oesd'].includes(context.drawType) ? 'positive' : 'neutral',
      weight: 5,
      description: getDrawDescription(context.drawType),
    });
  }

  // Generate reasoning based on action and context
  reasoning.push(SCENARIO_EXPLANATIONS[context.scenario]);

  switch (recommendedAction.action) {
    case 'bet':
      if (['nuts', 'strong'].includes(context.handStrength)) {
        reasoning.push(`Betting ${recommendedAction.size}% pot for value with a strong hand.`);
        reasoning.push('Build the pot while extracting value from weaker holdings.');
      } else if (context.handStrength === 'draw') {
        reasoning.push(`Semi-bluffing with ${recommendedAction.size}% pot bet.`);
        reasoning.push('Betting gives you two ways to win: fold equity and card equity.');
      } else if (context.handStrength === 'air') {
        reasoning.push(`Bluffing with ${recommendedAction.size}% pot as part of balanced strategy.`);
        reasoning.push('Include some bluffs to make your value bets more profitable.');
      } else {
        reasoning.push(`Betting ${recommendedAction.size}% pot with ${context.handStrength} hand.`);
        reasoning.push('Thin value bet or protection bet depending on opponents.');
      }

      if (context.boardTexture === 'wet' || context.boardTexture === 'connected') {
        tips.push('On draw-heavy boards, bet larger to charge draws.');
      } else if (context.boardTexture === 'dry') {
        tips.push('On dry boards, smaller bets achieve similar fold equity.');
      }
      break;

    case 'check':
      if (['nuts', 'strong'].includes(context.handStrength)) {
        reasoning.push('Checking to trap or slowplay a strong hand.');
        reasoning.push('Balance your checking range with value hands.');
      } else if (context.handStrength === 'medium') {
        reasoning.push('Checking for pot control with medium strength.');
        reasoning.push('Avoid building a big pot without a big hand.');
      } else {
        reasoning.push('Checking as the default play with a weak holding.');
        reasoning.push('See cheap cards or set up a check-raise.');
      }

      if (!context.isInPosition) {
        tips.push('Out of position, checking is often correct to see opponent\'s action.');
      }
      break;

    case 'raise':
      reasoning.push(`Raising to ${recommendedAction.size}% of the bet.`);
      if (context.handStrength === 'nuts' || context.handStrength === 'strong') {
        reasoning.push('Raise for value with your strong hand.');
      } else if (context.handStrength === 'draw') {
        reasoning.push('Semi-bluff raise with fold equity and drawing equity.');
      } else {
        reasoning.push('Bluff raise as part of balanced strategy.');
      }
      tips.push('Choose raise sizing based on board texture and opponent tendencies.');
      break;

    case 'call':
      reasoning.push('Calling to see the next card or showdown.');
      if (context.handStrength === 'draw') {
        reasoning.push('Call is correct if pot odds justify the draw.');
      } else {
        reasoning.push('Calling keeps bluffs in and catches weaker value bets.');
      }
      tips.push('Consider implied odds when calling with draws.');
      break;

    case 'fold':
      reasoning.push('Folding is the correct play with insufficient equity.');
      reasoning.push('Preserve your stack for better opportunities.');
      if (context.handStrength === 'weak' || context.handStrength === 'air') {
        tips.push('Don\'t hero call without reads suggesting bluffs.');
      }
      break;

    case 'allin':
      reasoning.push('All-in commits your remaining stack.');
      if (context.spr === 'micro' || context.spr === 'small') {
        reasoning.push('With low SPR, shoving is often mathematically correct.');
      }
      tips.push('Ensure you have the equity or fold equity to justify the all-in.');
      break;
  }

  // Add EV context
  const evContext = recommendedAction.ev >= 0
    ? `This action has positive expected value (+${recommendedAction.ev.toFixed(2)} BB).`
    : `This action minimizes losses (${recommendedAction.ev.toFixed(2)} BB EV).`;
  reasoning.push(evContext);

  // Summary
  const actionDesc = recommendedAction.action === 'bet' || recommendedAction.action === 'raise'
    ? `${recommendedAction.action} ${recommendedAction.size}% pot`
    : recommendedAction.action;

  const summary = recommendedAction.frequency >= 70
    ? `${actionDesc.toUpperCase()} with ${context.handStrength} hand on ${context.boardTexture} board`
    : `Mixed strategy: ${actionDesc} ${recommendedAction.frequency}% of the time`;

  return {
    summary,
    reasoning,
    factors,
    evEstimate: recommendedAction.ev,
    alternatives,
    tips,
  };
}

// Helper: Categorize a hand
function categorizeHand(hand: string): { isPremium: boolean; isPlayable: boolean; description: string } {
  const normalizedHand = hand.toUpperCase();

  // Premium hands
  const premiums = ['AA', 'KK', 'QQ', 'JJ', 'AKS', 'AKO', 'AQS'];
  if (premiums.some(p => normalizedHand.includes(p.replace('S', '').replace('O', '')))) {
    return {
      isPremium: true,
      isPlayable: true,
      description: `${hand} is a premium hand, always playable from any position.`,
    };
  }

  // Strong hands
  const strong = ['TT', '99', '88', 'AJS', 'ATS', 'KQS', 'AJO', 'KQO'];
  if (strong.some(s => normalizedHand.includes(s.replace('S', '').replace('O', '')))) {
    return {
      isPremium: false,
      isPlayable: true,
      description: `${hand} is a strong hand, playable from most positions.`,
    };
  }

  // Suited connectors and suited aces
  if (normalizedHand.includes('S') || normalizedHand.length === 3) {
    return {
      isPremium: false,
      isPlayable: true,
      description: `${hand} has good playability due to suit or connectivity.`,
    };
  }

  // Pairs
  if (normalizedHand.length === 2 && normalizedHand[0] === normalizedHand[1]) {
    return {
      isPremium: false,
      isPlayable: true,
      description: `${hand} is a pocket pair with set-mining potential.`,
    };
  }

  return {
    isPremium: false,
    isPlayable: false,
    description: `${hand} is a marginal hand, only playable in late position.`,
  };
}

// Helper: Get draw description
function getDrawDescription(drawType: DrawType): string {
  switch (drawType) {
    case 'combo_draw':
      return 'Combo draw (flush + straight draw) has high equity and two ways to improve.';
    case 'flush_draw':
      return 'Flush draw gives ~35% equity on flop, worth betting or calling.';
    case 'oesd':
      return 'Open-ended straight draw has ~32% equity and 8 outs twice.';
    case 'gutshot':
      return 'Gutshot straight draw has only 4 outs (~16% equity). Be selective.';
    case 'backdoor_flush':
      return 'Backdoor flush draw adds ~4% equity - a nice bonus but not primary.';
    case 'backdoor_straight':
      return 'Backdoor straight draw adds some equity for turns that improve.';
    default:
      return 'No significant draw present.';
  }
}

// Generate a complete analysis with explanation
export function generateFullAnalysis(
  preflopContext: PreflopContext,
  postflopContext?: PostflopContext,
  recommendedActions?: { preflop?: { action: ActionType; frequency: number }; postflop?: PostflopAction }
): {
  preflop?: StrategyExplanation;
  postflop?: StrategyExplanation;
  overallSummary: string;
  keyTakeaways: string[];
} {
  const keyTakeaways: string[] = [];
  let overallSummary = '';

  // Preflop explanation
  let preflopExplanation: StrategyExplanation | undefined;
  if (recommendedActions?.preflop) {
    preflopExplanation = explainPreflopAction(
      preflopContext,
      recommendedActions.preflop.action,
      recommendedActions.preflop.frequency
    );
    keyTakeaways.push(`Preflop: ${preflopExplanation.summary}`);
  }

  // Postflop explanation
  let postflopExplanation: StrategyExplanation | undefined;
  if (postflopContext && recommendedActions?.postflop) {
    postflopExplanation = explainPostflopAction(
      postflopContext,
      recommendedActions.postflop
    );
    keyTakeaways.push(`Postflop: ${postflopExplanation.summary}`);
  }

  // Overall summary
  if (preflopExplanation && postflopExplanation) {
    overallSummary = `${preflopContext.hand} from ${preflopContext.position}: ` +
      `${preflopExplanation.reasoning[0]} ` +
      `Postflop: ${postflopExplanation.reasoning[0]}`;
  } else if (preflopExplanation) {
    overallSummary = preflopExplanation.summary;
  } else if (postflopExplanation) {
    overallSummary = postflopExplanation.summary;
  }

  // Add strategic tips
  keyTakeaways.push('Remember: GTO strategies are balanced - mixing is key to being unexploitable.');
  keyTakeaways.push('Adjust these frequencies based on opponent tendencies for maximum EV.');

  return {
    preflop: preflopExplanation,
    postflop: postflopExplanation,
    overallSummary,
    keyTakeaways,
  };
}

// Format explanation for display
export function formatExplanationForDisplay(explanation: StrategyExplanation): string {
  let output = `## ${explanation.summary}\n\n`;

  output += '### Reasoning\n';
  explanation.reasoning.forEach(r => {
    output += `- ${r}\n`;
  });
  output += '\n';

  output += '### Key Factors\n';
  explanation.factors.forEach(f => {
    const impactIcon = f.impact === 'positive' ? '+' : f.impact === 'negative' ? '-' : '=';
    output += `- [${impactIcon}] **${f.factor}**: ${f.description}\n`;
  });
  output += '\n';

  if (explanation.evEstimate !== undefined) {
    output += `### Expected Value: ${explanation.evEstimate >= 0 ? '+' : ''}${explanation.evEstimate.toFixed(2)} BB\n\n`;
  }

  if (explanation.tips && explanation.tips.length > 0) {
    output += '### Tips\n';
    explanation.tips.forEach(t => {
      output += `- ${t}\n`;
    });
  }

  return output;
}
