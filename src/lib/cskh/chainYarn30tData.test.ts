import { describe, expect, it } from 'vitest';
import {
  CHAIN_YARN_30T_WBS_ITEMS,
  SUMMARY_6_ITEMS,
  countWbsDescendants,
  rollupWbsProgress,
} from './chainYarn30tData';

describe('chainYarn30tData', () => {
  it('contains exactly 55 WBS items from the 30T Chain Yarn plan', () => {
    expect(CHAIN_YARN_30T_WBS_ITEMS).toHaveLength(55);
    const rootItem = CHAIN_YARN_30T_WBS_ITEMS.find(item => item.id === 'wbs-0');
    expect(rootItem).toBeDefined();
    expect(rootItem?.level).toBe(0);
    expect(rootItem?.isGroup).toBe(true);
  });

  it('contains exactly 6 summary items for macro view', () => {
    expect(SUMMARY_6_ITEMS).toHaveLength(6);
  });

  it('calculates descendant counts correctly', () => {
    const rootDescendants = countWbsDescendants(CHAIN_YARN_30T_WBS_ITEMS, 'wbs-0');
    expect(rootDescendants).toBe(54); // All other 54 items are descendants of root

    const leafDescendants = countWbsDescendants(CHAIN_YARN_30T_WBS_ITEMS, 'wbs-3');
    expect(leafDescendants).toBe(0);
  });

  it('rolls up progress from leaves to parent groups correctly', () => {
    const rolledUp = rollupWbsProgress(CHAIN_YARN_30T_WBS_ITEMS);
    expect(rolledUp).toHaveLength(55);

    const rootItem = rolledUp.find(item => item.id === 'wbs-0');
    expect(rootItem?.actualPct).toBeGreaterThanOrEqual(0);
    expect(rootItem?.actualPct).toBeLessThanOrEqual(100);
  });
});
