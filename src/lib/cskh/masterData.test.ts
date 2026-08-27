import { describe, expect, it } from 'vitest';
import {
  findCapacityBand,
  nextCatalogCode,
  scheduleRowTimeline,
  scheduleSpan,
  type CskhCapacityBand,
  type CskhScheduleCombo,
  type CskhScheduleRow,
} from './masterData';

function row(over: Partial<CskhScheduleRow> & Pick<CskhScheduleRow, 'id'>): CskhScheduleRow {
  return {
    name: over.name ?? over.id,
    days: over.days ?? 0,
    relation: over.relation ?? 'from_advance',
    dependsOnId: over.dependsOnId ?? null,
    offsetDays: over.offsetDays ?? 0,
    ...over,
  };
}

describe('cskh master data', () => {
  it('increments catalog codes by prefix', () => {
    expect(nextCatalogCode('BT', [])).toBe('BT-01');
    expect(nextCatalogCode('BT', ['BT-01', 'BT-04', 'XX-09'])).toBe('BT-05');
  });

  it('computes sequential after-end timeline', () => {
    const rows = [
      row({ id: 'a', days: 8, relation: 'from_advance' }),
      row({ id: 'b', days: 10, relation: 'after_end', dependsOnId: 'a' }),
      row({ id: 'c', days: 1, relation: 'after_end', dependsOnId: 'b' }),
    ];
    expect(scheduleSpan(rows)).toEqual({ timelineDays: 19, effortDays: 19 });
  });

  it('does not add parallel end-with items into timeline', () => {
    const rows = [
      row({ id: 'a', days: 50, relation: 'from_advance' }),
      row({ id: 'b', days: 10, relation: 'end_with', dependsOnId: 'a' }),
    ];
    expect(scheduleSpan(rows)).toEqual({ timelineDays: 50, effortDays: 60 });
  });

  it('applies offset on after-end', () => {
    const rows = [
      row({ id: 'a', days: 4, relation: 'from_advance' }),
      row({ id: 'b', days: 4, relation: 'after_end', dependsOnId: 'a', offsetDays: 8 }),
    ];
    expect(scheduleSpan(rows).timelineDays).toBe(16);
  });

  it('breaks cyclic depends without hanging', () => {
    const rows = [
      row({ id: 'a', days: 5, relation: 'after_end', dependsOnId: 'b' }),
      row({ id: 'b', days: 7, relation: 'after_end', dependsOnId: 'a' }),
    ];
    expect(scheduleSpan(rows).effortDays).toBe(12);
    expect(scheduleSpan(rows).timelineDays).toBeGreaterThanOrEqual(0);
  });

  it('picks the matching capacity band and row timeline', () => {
    const combo: CskhScheduleCombo = {
      boilerTypeId: 'cfb',
      priorityId: 'high',
      bands: [
        { id: 'small', minTon: null, maxTon: 10, rows: [] },
        { id: 'mid', minTon: 10, maxTon: 24, rows: [] },
      ] satisfies CskhCapacityBand[],
    };
    expect(findCapacityBand(combo, 12)?.id).toBe('mid');
    const rows = [
      row({ id: 'a', days: 8, relation: 'from_advance' }),
      row({ id: 'b', days: 10, relation: 'after_end', dependsOnId: 'a' }),
    ];
    expect(scheduleRowTimeline(rows)[1]).toEqual({ id: 'b', startDay: 8, endDay: 18 });
  });
});
