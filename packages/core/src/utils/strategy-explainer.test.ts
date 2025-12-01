import { describe, it, expect } from 'vitest';
import {
  explainPreflopAction,
  explainPostflopAction,
  generateFullAnalysis,
  formatExplanationForDisplay,
} from './strategy-explainer';
import type { PreflopContext, PostflopContext, StrategyExplanation, StrategyFactor } from './strategy-explainer';

describe('strategy-explainer', () => {
  describe('explainPreflopAction', () => {
    it('should explain raise action from BTN', () => {
      const context: PreflopContext = {
        position: 'BTN',
        hand: 'AKs',
        actionFacing: 'open',
      };

      const explanation = explainPreflopAction(context, 'raise', 100);

      expect(explanation.summary).toBeDefined();
      expect(explanation.reasoning.length).toBeGreaterThan(0);
      expect(explanation.factors.length).toBeGreaterThan(0);
    });

    it('should explain fold action from UTG', () => {
      const context: PreflopContext = {
        position: 'UTG',
        hand: 'T9o',
        actionFacing: 'open',
      };

      const explanation = explainPreflopAction(context, 'fold', 100);

      expect(explanation.summary).toBeDefined();
      expect(explanation.reasoning.length).toBeGreaterThan(0);
    });

    it('should include position factor', () => {
      const context: PreflopContext = {
        position: 'CO',
        hand: 'QJs',
        actionFacing: 'open',
      };

      const explanation = explainPreflopAction(context, 'raise', 85);

      const positionFactor = explanation.factors.find(f => f.factor === 'Position');
      expect(positionFactor).toBeDefined();
      expect(positionFactor?.impact).toBe('positive'); // CO is late position
    });

    it('should include hand strength factor', () => {
      const context: PreflopContext = {
        position: 'BTN',
        hand: 'AA',
        actionFacing: 'open',
      };

      const explanation = explainPreflopAction(context, 'raise', 100);

      const handFactor = explanation.factors.find(f => f.factor === 'Hand Strength');
      expect(handFactor).toBeDefined();
      expect(handFactor?.impact).toBe('positive'); // AA is premium
    });

    it('should explain call vs 3bet', () => {
      const context: PreflopContext = {
        position: 'BTN',
        hand: 'JJ',
        actionFacing: 'vs_3bet',
      };

      const explanation = explainPreflopAction(context, 'call', 70);

      expect(explanation.summary).toBeDefined();
      expect(explanation.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('explainPostflopAction', () => {
    it('should explain c-bet with value hand', () => {
      const context: PostflopContext = {
        street: 'flop',
        scenario: 'cbet_ip',
        boardTexture: 'dry',
        handStrength: 'strong',
        isInPosition: true,
      };

      const recommendation = {
        action: 'bet' as const,
        frequency: 85,
        size: 33,
        ev: 1.5,
      };

      const explanation = explainPostflopAction(context, recommendation);

      expect(explanation.summary).toBeDefined();
      expect(explanation.reasoning.length).toBeGreaterThan(0);
      expect(explanation.factors.some(f => f.factor.includes('Board'))).toBe(true);
    });

    it('should explain check with weak hand', () => {
      const context: PostflopContext = {
        street: 'flop',
        scenario: 'cbet_ip',
        boardTexture: 'connected',
        handStrength: 'weak',
        isInPosition: true,
      };

      const recommendation = {
        action: 'check' as const,
        frequency: 80,
        ev: 0.0,
      };

      const explanation = explainPostflopAction(context, recommendation);

      expect(explanation.summary).toBeDefined();
      expect(explanation.reasoning.length).toBeGreaterThan(0);
    });

    it('should explain raise with draw', () => {
      const context: PostflopContext = {
        street: 'flop',
        scenario: 'check_raise',
        boardTexture: 'wet',
        handStrength: 'draw',
        isInPosition: false,
      };

      const recommendation = {
        action: 'raise' as const,
        frequency: 25,
        size: 100,
        ev: 0.8,
      };

      const explanation = explainPostflopAction(context, recommendation);

      expect(explanation.summary).toBeDefined();
      expect(explanation.factors.some(f => f.factor.includes('Hand'))).toBe(true);
    });

    it('should include SPR considerations when provided', () => {
      const context: PostflopContext = {
        street: 'flop',
        scenario: 'cbet_ip',
        boardTexture: 'dry',
        handStrength: 'strong',
        isInPosition: true,
        spr: 'micro', // Low SPR
      };

      const recommendation = {
        action: 'bet' as const,
        frequency: 90,
        size: 75,
        ev: 2.0,
      };

      const explanation = explainPostflopAction(context, recommendation);

      // Should have factors - SPR factor name may be 'Stack-to-Pot Ratio' not 'SPR'
      expect(explanation.factors.length).toBeGreaterThan(0);
      // Check if any factor relates to stack depth or SPR
      const hasSPRRelatedFactor = explanation.factors.some(f =>
        f.factor.includes('SPR') ||
        f.factor.includes('Stack') ||
        f.description?.includes('SPR')
      );
      expect(hasSPRRelatedFactor).toBe(true);
    });

    it('should include draw factor when draw type provided', () => {
      const context: PostflopContext = {
        street: 'flop',
        scenario: 'cbet_ip',
        boardTexture: 'wet',
        handStrength: 'draw',
        isInPosition: true,
        drawType: 'flush_draw',
      };

      const recommendation = {
        action: 'bet' as const,
        frequency: 70,
        size: 75,
        ev: 0.5,
      };

      const explanation = explainPostflopAction(context, recommendation);

      const drawFactor = explanation.factors.find(f => f.factor.includes('Draw'));
      expect(drawFactor).toBeDefined();
    });
  });

  describe('generateFullAnalysis', () => {
    it('should generate preflop-only analysis', () => {
      const analysis = generateFullAnalysis(
        {
          position: 'CO',
          hand: 'AQs',
          actionFacing: 'open',
        },
        undefined,
        {
          preflop: { action: 'raise', frequency: 100 },
        }
      );

      expect(analysis.preflop).toBeDefined();
      expect(analysis.postflop).toBeUndefined();
      expect(analysis.overallSummary).toBeDefined();
      expect(analysis.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('should generate full analysis with postflop', () => {
      const analysis = generateFullAnalysis(
        {
          position: 'BTN',
          hand: 'AKs',
          actionFacing: 'open',
        },
        {
          street: 'flop',
          scenario: 'cbet_ip',
          boardTexture: 'dry',
          handStrength: 'medium',
          isInPosition: true,
        },
        {
          preflop: { action: 'raise', frequency: 100 },
          postflop: {
            action: 'bet',
            frequency: 75,
            size: 33,
            ev: 0.8,
          },
        }
      );

      expect(analysis.preflop).toBeDefined();
      expect(analysis.postflop).toBeDefined();
      expect(analysis.overallSummary).toBeDefined();
      expect(analysis.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('should return no preflop explanation without preflop action', () => {
      const analysis = generateFullAnalysis(
        {
          position: 'UTG',
          hand: 'AA',
          actionFacing: 'open',
        },
        undefined,
        {} // No recommended actions
      );

      expect(analysis.preflop).toBeUndefined();
      expect(analysis.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('should provide meaningful key takeaways', () => {
      const analysis = generateFullAnalysis(
        {
          position: 'UTG',
          hand: 'AA',
          actionFacing: 'open',
        },
        undefined,
        {
          preflop: { action: 'raise', frequency: 100 },
        }
      );

      expect(analysis.keyTakeaways.length).toBeGreaterThanOrEqual(1);
      analysis.keyTakeaways.forEach(takeaway => {
        expect(takeaway.length).toBeGreaterThan(10);
      });
    });
  });

  describe('formatExplanationForDisplay', () => {
    it('should format explanation as readable string', () => {
      const explanation: StrategyExplanation = {
        summary: 'Raise for value',
        reasoning: ['Strong hand', 'Good position'],
        factors: [
          { factor: 'Hand Strength', value: 'Strong', impact: 'positive', weight: 9, description: 'Premium hand' },
          { factor: 'Position', value: 'BTN', impact: 'positive', weight: 8, description: 'Best position' },
        ] as StrategyFactor[],
        evEstimate: 1.5,
        tips: ['Keep betting for value on safe runouts'],
      };

      const formatted = formatExplanationForDisplay(explanation);

      expect(formatted).toContain('Raise for value');
      expect(formatted).toContain('Strong hand');
      expect(formatted).toContain('Good position');
      expect(formatted).toContain('Hand Strength');
      expect(formatted).toContain('Position');
    });

    it('should handle explanation without optional fields', () => {
      const explanation: StrategyExplanation = {
        summary: 'Fold weak hand',
        reasoning: ['No equity'],
        factors: [],
      };

      const formatted = formatExplanationForDisplay(explanation);

      expect(formatted).toContain('Fold weak hand');
      expect(formatted).toContain('No equity');
    });

    it('should include EV estimate when provided', () => {
      const explanation: StrategyExplanation = {
        summary: 'Value bet',
        reasoning: ['Ahead of range'],
        factors: [],
        evEstimate: 2.5,
      };

      const formatted = formatExplanationForDisplay(explanation);

      expect(formatted).toContain('2.50');
    });

    it('should include tips when provided', () => {
      const explanation: StrategyExplanation = {
        summary: 'C-bet',
        reasoning: ['Value and protection'],
        factors: [],
        tips: ['Size down on dry boards', 'Size up on wet boards'],
      };

      const formatted = formatExplanationForDisplay(explanation);

      expect(formatted).toContain('Size down');
      expect(formatted).toContain('Size up');
    });
  });
});
