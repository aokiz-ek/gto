import { describe, it, expect } from 'vitest';
import {
  STACK_DEPTHS,
  TOURNAMENT_TYPES,
  TOURNAMENT_STAGES,
  TOURNAMENT_SCENARIOS,
  getStackDepth,
  getNearestStackDepth,
  getTournamentType,
  getTournamentStage,
  getTournamentScenario,
  filterScenarios,
  calculateICMFactor,
  calculateBountyEV,
} from './tournament';

describe('Tournament Configuration', () => {
  describe('STACK_DEPTHS', () => {
    it('should have all required stack depth entries', () => {
      expect(STACK_DEPTHS.length).toBeGreaterThan(0);

      // Check for micro stacks
      const microStacks = STACK_DEPTHS.filter(s => s.category === 'micro');
      expect(microStacks.length).toBeGreaterThan(0);

      // Check for short stacks
      const shortStacks = STACK_DEPTHS.filter(s => s.category === 'short');
      expect(shortStacks.length).toBeGreaterThan(0);

      // Check for medium stacks
      const mediumStacks = STACK_DEPTHS.filter(s => s.category === 'medium');
      expect(mediumStacks.length).toBeGreaterThan(0);

      // Check for deep stacks
      const deepStacks = STACK_DEPTHS.filter(s => s.category === 'deep');
      expect(deepStacks.length).toBeGreaterThan(0);
    });

    it('should have unique ids', () => {
      const ids = STACK_DEPTHS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid bb values', () => {
      STACK_DEPTHS.forEach(stack => {
        expect(stack.bb).toBeGreaterThan(0);
        expect(typeof stack.bb).toBe('number');
      });
    });
  });

  describe('TOURNAMENT_TYPES', () => {
    it('should have all main tournament types', () => {
      const typeIds = TOURNAMENT_TYPES.map(t => t.id);
      expect(typeIds).toContain('mtt');
      expect(typeIds).toContain('sng');
      expect(typeIds).toContain('pko');
      expect(typeIds).toContain('spin');
      expect(typeIds).toContain('satellite');
    });

    it('should have valid stages for each type', () => {
      TOURNAMENT_TYPES.forEach(type => {
        expect(type.stages.length).toBeGreaterThan(0);
        type.stages.forEach(stage => {
          expect(Object.keys(TOURNAMENT_STAGES)).toContain(stage);
        });
      });
    });

    it('should have Chinese names', () => {
      TOURNAMENT_TYPES.forEach(type => {
        expect(type.nameCn).toBeDefined();
        expect(type.nameCn.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TOURNAMENT_STAGES', () => {
    it('should have all required stages', () => {
      expect(TOURNAMENT_STAGES).toHaveProperty('early');
      expect(TOURNAMENT_STAGES).toHaveProperty('middle');
      expect(TOURNAMENT_STAGES).toHaveProperty('bubble');
      expect(TOURNAMENT_STAGES).toHaveProperty('itm');
      expect(TOURNAMENT_STAGES).toHaveProperty('final_table');
    });

    it('should have valid ICM factors (0-1)', () => {
      Object.values(TOURNAMENT_STAGES).forEach(stage => {
        expect(stage.icmFactor).toBeGreaterThanOrEqual(0);
        expect(stage.icmFactor).toBeLessThanOrEqual(1);
      });
    });

    it('should have higher ICM factor for bubble than early', () => {
      expect(TOURNAMENT_STAGES.bubble.icmFactor).toBeGreaterThan(
        TOURNAMENT_STAGES.early.icmFactor
      );
    });
  });

  describe('TOURNAMENT_SCENARIOS', () => {
    it('should have scenarios', () => {
      expect(TOURNAMENT_SCENARIOS.length).toBeGreaterThan(0);
    });

    it('should have unique scenario ids', () => {
      const ids = TOURNAMENT_SCENARIOS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid references', () => {
      TOURNAMENT_SCENARIOS.forEach(scenario => {
        // Valid tournament type
        const typeIds = TOURNAMENT_TYPES.map(t => t.id);
        expect(typeIds).toContain(scenario.type);

        // Valid stage
        expect(Object.keys(TOURNAMENT_STAGES)).toContain(scenario.stage);

        // Valid stack depth
        const stackDepth = getStackDepth(scenario.stackDepth);
        expect(stackDepth).toBeDefined();
      });
    });

    it('should have ICM adjustment between 0 and 1', () => {
      TOURNAMENT_SCENARIOS.forEach(scenario => {
        expect(scenario.icmAdjustment).toBeGreaterThanOrEqual(0);
        expect(scenario.icmAdjustment).toBeLessThanOrEqual(1);
      });
    });

    it('should have strategy notes in both languages', () => {
      TOURNAMENT_SCENARIOS.forEach(scenario => {
        expect(scenario.strategyNotes.length).toBeGreaterThan(0);
        expect(scenario.strategyNotesCn.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStackDepth', () => {
    it('should return correct stack depth by id', () => {
      const stack = getStackDepth('30bb');
      expect(stack).toBeDefined();
      expect(stack?.bb).toBe(30);
      expect(stack?.category).toBe('medium');
    });

    it('should return undefined for invalid id', () => {
      const stack = getStackDepth('invalid');
      expect(stack).toBeUndefined();
    });
  });

  describe('getNearestStackDepth', () => {
    it('should return exact match', () => {
      const stack = getNearestStackDepth(30);
      expect(stack.bb).toBe(30);
    });

    it('should return nearest for non-exact values', () => {
      const stack = getNearestStackDepth(32);
      expect(stack.bb).toBe(30); // 30 is closer than 35
    });

    it('should handle edge cases', () => {
      const stackLow = getNearestStackDepth(1);
      expect(stackLow).toBeDefined();

      const stackHigh = getNearestStackDepth(500);
      expect(stackHigh).toBeDefined();
    });
  });

  describe('getTournamentType', () => {
    it('should return correct type', () => {
      const mtt = getTournamentType('mtt');
      expect(mtt).toBeDefined();
      expect(mtt?.name).toBe('MTT');
    });

    it('should return undefined for invalid type', () => {
      const invalid = getTournamentType('invalid' as any);
      expect(invalid).toBeUndefined();
    });
  });

  describe('getTournamentStage', () => {
    it('should return correct stage config', () => {
      const bubble = getTournamentStage('bubble');
      expect(bubble).toBeDefined();
      expect(bubble.nameCn).toBe('泡沫期');
    });
  });

  describe('getTournamentScenario', () => {
    it('should return correct scenario', () => {
      const scenario = getTournamentScenario('mtt_bubble_25bb');
      expect(scenario).toBeDefined();
      expect(scenario?.type).toBe('mtt');
      expect(scenario?.stage).toBe('bubble');
    });

    it('should return undefined for invalid id', () => {
      const scenario = getTournamentScenario('invalid');
      expect(scenario).toBeUndefined();
    });
  });

  describe('filterScenarios', () => {
    it('should filter by tournament type', () => {
      const mttScenarios = filterScenarios({ type: 'mtt' });
      expect(mttScenarios.length).toBeGreaterThan(0);
      mttScenarios.forEach(s => {
        expect(s.type).toBe('mtt');
      });
    });

    it('should filter by stage', () => {
      const bubbleScenarios = filterScenarios({ stage: 'bubble' });
      expect(bubbleScenarios.length).toBeGreaterThan(0);
      bubbleScenarios.forEach(s => {
        expect(s.stage).toBe('bubble');
      });
    });

    it('should filter by multiple criteria', () => {
      const filtered = filterScenarios({ type: 'mtt', stage: 'bubble' });
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(s => {
        expect(s.type).toBe('mtt');
        expect(s.stage).toBe('bubble');
      });
    });

    it('should return all scenarios with no filters', () => {
      const all = filterScenarios({});
      expect(all.length).toBe(TOURNAMENT_SCENARIOS.length);
    });

    it('should filter by stack category', () => {
      const shortStackScenarios = filterScenarios({ stackCategory: 'short' });
      shortStackScenarios.forEach(s => {
        const stack = getStackDepth(s.stackDepth);
        expect(stack?.category).toBe('short');
      });
    });
  });

  describe('calculateICMFactor', () => {
    it('should return higher factor for bubble', () => {
      const bubbleFactor = calculateICMFactor('mtt', 'bubble', 100, 90);
      const earlyFactor = calculateICMFactor('mtt', 'early', 1000, 100);

      expect(bubbleFactor).toBeGreaterThan(earlyFactor);
    });

    it('should return 0 for satellite when seat secured', () => {
      const factor = calculateICMFactor('satellite', 'itm', 4, 5);
      expect(factor).toBe(0);
    });

    it('should return high factor for satellite bubble', () => {
      const factor = calculateICMFactor('satellite', 'bubble', 6, 5);
      expect(factor).toBeGreaterThan(0.9);
    });

    it('should handle final table 3-handed', () => {
      const factor = calculateICMFactor('mtt', 'final_table', 3, 3);
      expect(factor).toBeGreaterThan(0.9);
    });
  });

  describe('calculateBountyEV', () => {
    it('should calculate bounty value when covering', () => {
      const result = calculateBountyEV(100, 200, 500, 600);
      expect(result.adjustedEV).toBe(100);
      expect(result.bountyValue).toBeGreaterThan(0);
    });

    it('should return 0 bounty when not covering', () => {
      const result = calculateBountyEV(100, 200, 600, 500);
      expect(result.adjustedEV).toBe(0);
    });

    it('should calculate correct bounty ratio', () => {
      const result = calculateBountyEV(100, 100, 500, 600);
      // Bounty is 100, pot is 100, total is 200
      // Bounty ratio = 100 / 200 = 0.5
      expect(result.bountyValue).toBe(0.5);
    });
  });
});
