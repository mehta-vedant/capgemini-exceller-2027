import { describe, expect, it } from 'vitest';
import { academyUnits, compactPlanDays, unitByDay } from '../src/data/academy';
import { academyDepth } from '../src/data/academy-depth';

describe('academy curriculum', () => {
  it('provides 30 unique daily units with complete learning structure', () => {
    expect(academyUnits).toHaveLength(30);
    expect(new Set(academyUnits.map((unit) => unit.day)).size).toBe(30);
    for (const unit of academyUnits) {
      expect(unit.blocks.length).toBeGreaterThanOrEqual(3);
      expect(unit.blocks.length).toBeLessThanOrEqual(5);
      expect(unit.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(unit.checks).toHaveLength(2);
      expect(unit.revision.length).toBeGreaterThanOrEqual(3);
      expect(unit.visual.items.length).toBeGreaterThan(0);
      expect(unit.references.length).toBeGreaterThan(0);
      expect(academyDepth[unit.day].walkthrough).toHaveLength(4);
      expect(academyDepth[unit.day].recall).toHaveLength(3);
      expect(academyDepth[unit.day].protocol).toHaveLength(4);
    }
  });
  it('uses curated compressed plans while preserving the 30-day source path', () => {
    expect(compactPlanDays(30)).toHaveLength(30);
    expect(compactPlanDays(14)).toHaveLength(14);
    expect(compactPlanDays(7)).toHaveLength(7);
    expect(unitByDay(1).title).toMatch(/AI, ML/);
    expect(unitByDay(30).title).toMatch(/Final readiness/);
  });
});
