/**
 * ICM (Independent Chip Model) Calculator
 *
 * ICM calculates the dollar value ($EV) of a player's chip stack in a tournament
 * based on the payout structure and remaining players' stacks.
 *
 * The algorithm uses the Malmuth-Harville formula to calculate the probability
 * of each player finishing in each position.
 */

// ============================================================================
// Types
// ============================================================================

export interface ICMPlayer {
  id: string;
  name?: string;
  chips: number;
}

export interface ICMPayoutStructure {
  places: number[];  // Payout percentages or amounts for each place
  isPercentage: boolean;  // true if payouts are percentages, false if absolute amounts
  totalPrizePool?: number;  // Required if isPercentage is true
}

export interface ICMResult {
  playerId: string;
  chips: number;
  chipPercentage: number;
  icmEquity: number;  // Dollar value
  icmPercentage: number;  // Percentage of prize pool
  finishProbabilities: number[];  // Probability of finishing 1st, 2nd, 3rd, etc.
}

export interface ICMCalculation {
  players: ICMResult[];
  totalPrizePool: number;
  payouts: number[];  // Actual payout amounts
}

export interface PushFoldScenario {
  heroChips: number;
  heroPosition: number;  // 0 = BTN, 1 = SB, 2 = BB, etc.
  villainChips: number[];
  blinds: { sb: number; bb: number; ante?: number };
  payouts: number[];
}

export interface PushFoldResult {
  hand: string;
  action: 'push' | 'fold';
  evPush: number;
  evFold: number;
  evDiff: number;
  frequency?: number;  // For mixed strategies
}

// ============================================================================
// Common Payout Structures
// ============================================================================

export const COMMON_PAYOUTS = {
  // SNG Payouts (percentage of prize pool)
  SNG_3_HANDED: [100],  // Winner takes all at 3-handed
  SNG_6_MAX: [65, 35],
  SNG_9_MAX: [50, 30, 20],
  SNG_10_MAX: [50, 30, 20],
  SNG_18_MAX: [40, 30, 20, 10],
  SNG_27_MAX: [40, 30, 20, 10],
  SNG_45_MAX: [35, 25, 18, 12, 10],

  // MTT Standard Payouts (top 15%)
  MTT_FINAL_TABLE_9: [30, 20, 14, 10.5, 8, 6.5, 5, 3.5, 2.5],
  MTT_FINAL_TABLE_6: [35, 25, 18, 12, 7, 3],

  // Heads Up
  HEADS_UP: [100],
  HEADS_UP_SPLIT: [60, 40],

  // Spin & Go / Hyper
  SPIN_3_HANDED: [80, 20],  // Typical 2x multiplier
} as const;

// ============================================================================
// Core ICM Calculation
// ============================================================================

/**
 * Calculate ICM equity for all players
 * Uses the Malmuth-Harville model
 */
export function calculateICM(
  players: ICMPlayer[],
  payouts: ICMPayoutStructure
): ICMCalculation {
  const activePlayers = players.filter(p => p.chips > 0);
  const n = activePlayers.length;

  if (n === 0) {
    throw new Error('No active players');
  }

  // Calculate total chips
  const totalChips = activePlayers.reduce((sum, p) => sum + p.chips, 0);

  // Determine actual payout amounts
  let payoutAmounts: number[];
  let totalPrizePool: number;

  if (payouts.isPercentage) {
    if (!payouts.totalPrizePool) {
      throw new Error('Total prize pool required for percentage payouts');
    }
    totalPrizePool = payouts.totalPrizePool;
    payoutAmounts = payouts.places.map(p => (p / 100) * totalPrizePool);
  } else {
    payoutAmounts = [...payouts.places];
    totalPrizePool = payoutAmounts.reduce((sum, p) => sum + p, 0);
  }

  // Ensure we have enough payout places
  while (payoutAmounts.length < n) {
    payoutAmounts.push(0);
  }

  // Calculate finish probabilities for each player
  const results: ICMResult[] = activePlayers.map(player => {
    const finishProbs = calculateFinishProbabilities(
      player,
      activePlayers,
      totalChips,
      n
    );

    // Calculate ICM equity (expected value)
    let icmEquity = 0;
    for (let place = 0; place < n; place++) {
      icmEquity += finishProbs[place] * payoutAmounts[place];
    }

    return {
      playerId: player.id,
      chips: player.chips,
      chipPercentage: (player.chips / totalChips) * 100,
      icmEquity,
      icmPercentage: (icmEquity / totalPrizePool) * 100,
      finishProbabilities: finishProbs,
    };
  });

  return {
    players: results,
    totalPrizePool,
    payouts: payoutAmounts.slice(0, n),
  };
}

/**
 * Calculate the probability of a player finishing in each position
 * Uses Malmuth-Harville recursive formula
 */
function calculateFinishProbabilities(
  player: ICMPlayer,
  allPlayers: ICMPlayer[],
  totalChips: number,
  numPlaces: number
): number[] {
  const probs: number[] = new Array(numPlaces).fill(0);

  // Probability of finishing 1st = chip proportion
  probs[0] = player.chips / totalChips;

  // For positions 2nd and beyond, use recursive calculation
  if (numPlaces > 1) {
    const otherPlayers = allPlayers.filter(p => p.id !== player.id);

    for (let place = 1; place < numPlaces; place++) {
      probs[place] = calculatePlaceProb(
        player,
        allPlayers,
        otherPlayers,
        totalChips,
        place
      );
    }
  }

  return probs;
}

/**
 * Calculate probability of finishing in a specific place (2nd or later)
 * P(player finishes Nth) = Sum over all other players i of:
 *   P(i finishes 1st) * P(player finishes (N-1)th | i already out)
 */
function calculatePlaceProb(
  player: ICMPlayer,
  allPlayers: ICMPlayer[],
  otherPlayers: ICMPlayer[],
  totalChips: number,
  place: number,
  memo: Map<string, number> = new Map()
): number {
  // Memoization key
  const key = `${player.id}-${place}-${otherPlayers.map(p => p.id).sort().join(',')}`;
  if (memo.has(key)) {
    return memo.get(key)!;
  }

  if (place === 0) {
    return player.chips / totalChips;
  }

  if (otherPlayers.length === 0) {
    return place === 0 ? 1 : 0;
  }

  let prob = 0;

  for (const other of otherPlayers) {
    // Probability that 'other' finishes 1st
    const pOtherFirst = other.chips / totalChips;

    // Remaining players after 'other' is eliminated
    const remaining = otherPlayers.filter(p => p.id !== other.id);
    const newTotalChips = totalChips - other.chips;

    if (newTotalChips > 0 && remaining.length >= place) {
      // Probability that 'player' finishes (place)th among remaining
      const pPlayerPlace = calculatePlaceProbRecursive(
        player,
        [player, ...remaining],
        remaining,
        newTotalChips,
        place - 1,
        memo
      );

      prob += pOtherFirst * pPlayerPlace;
    }
  }

  memo.set(key, prob);
  return prob;
}

function calculatePlaceProbRecursive(
  player: ICMPlayer,
  allPlayers: ICMPlayer[],
  otherPlayers: ICMPlayer[],
  totalChips: number,
  place: number,
  memo: Map<string, number>
): number {
  if (place === 0) {
    return player.chips / totalChips;
  }

  if (otherPlayers.length < place) {
    return 0;
  }

  const key = `${player.id}-${place}-${otherPlayers.map(p => p.id).sort().join(',')}`;
  if (memo.has(key)) {
    return memo.get(key)!;
  }

  let prob = 0;

  for (const other of otherPlayers) {
    const pOtherFirst = other.chips / totalChips;
    const remaining = otherPlayers.filter(p => p.id !== other.id);
    const newTotalChips = totalChips - other.chips;

    if (newTotalChips > 0) {
      const pPlayerPlace = calculatePlaceProbRecursive(
        player,
        [player, ...remaining],
        remaining,
        newTotalChips,
        place - 1,
        memo
      );

      prob += pOtherFirst * pPlayerPlace;
    }
  }

  memo.set(key, prob);
  return prob;
}

// ============================================================================
// ICM Utility Functions
// ============================================================================

/**
 * Calculate ICM pressure (how much a player has to lose vs gain)
 * Higher pressure means more risk-averse play is correct
 */
export function calculateICMPressure(
  player: ICMPlayer,
  players: ICMPlayer[],
  payouts: ICMPayoutStructure
): number {
  const result = calculateICM(players, payouts);
  const playerResult = result.players.find(p => p.playerId === player.id);

  if (!playerResult) return 0;

  // ICM pressure = ICM% - Chip%
  // Positive = playing for more than chip-fair share (chip leader)
  // Negative = playing for less (risk-averse situation)
  return playerResult.icmPercentage - playerResult.chipPercentage;
}

/**
 * Calculate the chip EV vs ICM EV difference for a decision
 */
export function calculateICMDiff(
  beforePlayers: ICMPlayer[],
  afterWinPlayers: ICMPlayer[],
  afterLosePlayers: ICMPlayer[],
  heroId: string,
  winProbability: number,
  payouts: ICMPayoutStructure
): { chipEV: number; icmEV: number; icmDiff: number } {
  const beforeICM = calculateICM(beforePlayers, payouts);
  const afterWinICM = calculateICM(afterWinPlayers, payouts);
  const afterLoseICM = calculateICM(afterLosePlayers, payouts);

  const heroBefore = beforeICM.players.find(p => p.playerId === heroId);
  const heroAfterWin = afterWinICM.players.find(p => p.playerId === heroId);
  const heroAfterLose = afterLoseICM.players.find(p => p.playerId === heroId);

  if (!heroBefore) {
    throw new Error('Hero not found in before state');
  }

  const heroWinICM = heroAfterWin?.icmEquity ?? 0;
  const heroLoseICM = heroAfterLose?.icmEquity ?? 0;

  // Expected ICM EV
  const icmEV = winProbability * heroWinICM + (1 - winProbability) * heroLoseICM;

  // Chip EV (linear with chips)
  const heroBefore_ = beforePlayers.find(p => p.id === heroId)!;
  const heroWin = afterWinPlayers.find(p => p.id === heroId);
  const heroLose = afterLosePlayers.find(p => p.id === heroId);

  const winChips = heroWin?.chips ?? 0;
  const loseChips = heroLose?.chips ?? 0;
  const expectedChips = winProbability * winChips + (1 - winProbability) * loseChips;

  // Convert chip EV to $ using current chip value
  const totalChips = beforePlayers.reduce((s, p) => s + p.chips, 0);
  const chipValue = beforeICM.totalPrizePool / totalChips;
  const chipEV = expectedChips * chipValue;

  return {
    chipEV,
    icmEV,
    icmDiff: icmEV - heroBefore.icmEquity,
  };
}

/**
 * Quick ICM calculation for simple scenarios (heads up, 3-handed)
 * Faster than full calculation for common situations
 */
export function quickICM(
  stacks: number[],
  payouts: number[]
): number[] {
  if (stacks.length === 1) {
    return [payouts[0] || 0];
  }

  if (stacks.length === 2) {
    return calculateHeadsUpICM(stacks, payouts);
  }

  // For 3+ players, use full calculation
  const players = stacks.map((chips, i) => ({
    id: `p${i}`,
    chips,
  }));

  const result = calculateICM(players, {
    places: payouts,
    isPercentage: false,
  });

  return result.players.map(p => p.icmEquity);
}

/**
 * Optimized ICM for heads-up (2 players)
 */
function calculateHeadsUpICM(stacks: number[], payouts: number[]): number[] {
  const total = stacks[0] + stacks[1];
  const p1Win = stacks[0] / total;
  const p2Win = stacks[1] / total;

  const first = payouts[0] || 0;
  const second = payouts[1] || 0;

  return [
    p1Win * first + p2Win * second,
    p2Win * first + p1Win * second,
  ];
}

// ============================================================================
// Push/Fold ICM
// ============================================================================

/**
 * Calculate whether pushing is +EV compared to folding using ICM
 */
export function calculatePushFoldICM(
  heroChips: number,
  villainChips: number,
  otherStacks: number[],
  payouts: number[],
  blinds: { sb: number; bb: number; ante?: number },
  heroEquityVsRange: number,  // Hero's equity vs villain calling range (0-1)
  villainCallFreq: number,    // How often villain calls (0-1)
  heroPosition: 'sb' | 'bb' | 'btn'
): { evPush: number; evFold: number; shouldPush: boolean } {
  const ante = blinds.ante || 0;
  const totalAnte = ante * (2 + otherStacks.length);

  // Current stacks (before action)
  const allStacks = [heroChips, villainChips, ...otherStacks];
  const players = allStacks.map((chips, i) => ({ id: `p${i}`, chips }));

  // Calculate current ICM
  const currentICM = calculateICM(players, { places: payouts, isPercentage: false });
  const heroCurrentICM = currentICM.players[0].icmEquity;

  // === FOLD EV ===
  // Hero loses SB (if in SB) or nothing (if in BB being pushed on)
  let foldLoss = 0;
  if (heroPosition === 'sb') {
    foldLoss = blinds.sb;
  } else if (heroPosition === 'btn') {
    foldLoss = 0;
  }
  // In BB facing push, folding loses BB
  if (heroPosition === 'bb') {
    foldLoss = blinds.bb;
  }

  const foldStacks = [...allStacks];
  foldStacks[0] -= foldLoss + ante;
  foldStacks[1] += blinds.sb + blinds.bb + totalAnte;  // Villain wins blinds

  const foldICM = calculateICM(
    foldStacks.map((chips, i) => ({ id: `p${i}`, chips })),
    { places: payouts, isPercentage: false }
  );
  const evFold = foldICM.players[0].icmEquity;

  // === PUSH EV ===
  // Two scenarios: villain folds or villain calls
  const pot = blinds.sb + blinds.bb + totalAnte;

  // Villain folds: hero wins blinds + antes
  const villainFoldStacks = [...allStacks];
  villainFoldStacks[0] += pot - ante;
  villainFoldStacks[1] -= blinds.bb;  // Villain was BB or loses blind

  const foldedToICM = calculateICM(
    villainFoldStacks.map((chips, i) => ({ id: `p${i}`, chips })),
    { places: payouts, isPercentage: false }
  );
  const evVillainFolds = foldedToICM.players[0].icmEquity;

  // Villain calls: all-in showdown
  const allInPot = Math.min(heroChips, villainChips) * 2 + pot;
  const effectiveStack = Math.min(heroChips, villainChips);

  // Hero wins
  const winStacks = [...allStacks];
  winStacks[0] = heroChips + effectiveStack + pot;
  winStacks[1] = villainChips - effectiveStack;
  if (winStacks[1] <= 0) {
    // Villain eliminated
    winStacks.splice(1, 1);
  }

  // Hero loses
  const loseStacks = [...allStacks];
  loseStacks[0] = heroChips - effectiveStack;
  loseStacks[1] = villainChips + effectiveStack + pot;

  let evWin: number;
  let evLose: number;

  if (loseStacks[0] <= 0) {
    // Hero busted
    evLose = payouts[payouts.length - 1] || 0;
  } else {
    const loseICM = calculateICM(
      loseStacks.filter(s => s > 0).map((chips, i) => ({ id: `p${i}`, chips })),
      { places: payouts, isPercentage: false }
    );
    evLose = loseICM.players[0].icmEquity;
  }

  const winICM = calculateICM(
    winStacks.filter(s => s > 0).map((chips, i) => ({ id: `p${i}`, chips })),
    { places: payouts, isPercentage: false }
  );
  evWin = winICM.players[0].icmEquity;

  // EV when called
  const evCalled = heroEquityVsRange * evWin + (1 - heroEquityVsRange) * evLose;

  // Total push EV
  const evPush = (1 - villainCallFreq) * evVillainFolds + villainCallFreq * evCalled;

  return {
    evPush,
    evFold,
    shouldPush: evPush > evFold,
  };
}

// ============================================================================
// Nash Push/Fold Ranges (Precomputed for common spots)
// ============================================================================

/**
 * Get Nash equilibrium push range for a given stack size
 * Returns array of hands that should be pushed
 */
export function getNashPushRange(
  stackInBB: number,
  position: 'btn' | 'sb' | 'bb',
  numPlayers: 2 | 3
): string[] {
  // Simplified Nash ranges based on stack size
  // In reality, these would be much more detailed

  const allHands = getAllHands();

  if (numPlayers === 2 && position === 'sb') {
    // Heads-up SB push ranges
    if (stackInBB <= 3) {
      return allHands; // Push any two
    } else if (stackInBB <= 5) {
      return allHands.filter(h => getHandStrength(h) >= 20);
    } else if (stackInBB <= 8) {
      return allHands.filter(h => getHandStrength(h) >= 30);
    } else if (stackInBB <= 12) {
      return allHands.filter(h => getHandStrength(h) >= 40);
    } else if (stackInBB <= 15) {
      return allHands.filter(h => getHandStrength(h) >= 50);
    } else {
      return allHands.filter(h => getHandStrength(h) >= 60);
    }
  }

  if (numPlayers === 3 && position === 'btn') {
    // 3-handed BTN push ranges (more conservative due to ICM)
    if (stackInBB <= 5) {
      return allHands.filter(h => getHandStrength(h) >= 25);
    } else if (stackInBB <= 8) {
      return allHands.filter(h => getHandStrength(h) >= 40);
    } else if (stackInBB <= 12) {
      return allHands.filter(h => getHandStrength(h) >= 50);
    } else {
      return allHands.filter(h => getHandStrength(h) >= 60);
    }
  }

  // Default: tighter range
  return allHands.filter(h => getHandStrength(h) >= 55);
}

/**
 * Get Nash equilibrium call range for a given stack size
 */
export function getNashCallRange(
  stackInBB: number,
  position: 'sb' | 'bb',
  numPlayers: 2 | 3,
  pusherPosition?: 'btn' | 'sb'
): string[] {
  const allHands = getAllHands();

  // Call ranges are generally tighter than push ranges
  // due to needing to beat the pushing range

  if (numPlayers === 2 && position === 'bb') {
    if (stackInBB <= 5) {
      return allHands.filter(h => getHandStrength(h) >= 40);
    } else if (stackInBB <= 10) {
      return allHands.filter(h => getHandStrength(h) >= 55);
    } else {
      return allHands.filter(h => getHandStrength(h) >= 65);
    }
  }

  // 3-handed calling is even tighter due to ICM
  return allHands.filter(h => getHandStrength(h) >= 70);
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAllHands(): string[] {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const hands: string[] = [];

  for (let i = 0; i < ranks.length; i++) {
    for (let j = i; j < ranks.length; j++) {
      if (i === j) {
        hands.push(ranks[i] + ranks[j]); // Pairs
      } else {
        hands.push(ranks[i] + ranks[j] + 's'); // Suited
        hands.push(ranks[i] + ranks[j] + 'o'); // Offsuit
      }
    }
  }

  return hands;
}

/**
 * Simple hand strength heuristic (0-100)
 * Used for Nash range approximations
 */
function getHandStrength(hand: string): number {
  const ranks = 'AKQJT98765432';

  // Parse hand
  const rank1 = hand[0];
  const rank2 = hand[1];
  const suited = hand.length === 3 && hand[2] === 's';
  const pair = rank1 === rank2;

  const r1 = ranks.indexOf(rank1);
  const r2 = ranks.indexOf(rank2);

  if (pair) {
    // Pairs: AA=100, 22=52
    return 100 - r1 * 4;
  }

  // Base strength from high card
  let strength = 85 - r1 * 3 - r2 * 2;

  // Suited bonus
  if (suited) {
    strength += 4;
  }

  // Connectedness bonus
  const gap = r2 - r1;
  if (gap === 1) strength += 3;
  else if (gap === 2) strength += 2;
  else if (gap === 3) strength += 1;

  // Broadway bonus (both cards T+)
  if (r1 <= 4 && r2 <= 4) {
    strength += 5;
  }

  return Math.max(0, Math.min(100, strength));
}

// ============================================================================
// Exports for Testing
// ============================================================================

export const _testing = {
  calculateFinishProbabilities,
  calculateHeadsUpICM,
  getHandStrength,
  getAllHands,
};
