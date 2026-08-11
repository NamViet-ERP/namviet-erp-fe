import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../constants/systemUsers', () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from '../../constants/systemUsers';
import { canViewWmsPrices } from './priceVisibility';

describe('canViewWmsPrices', () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReturnValue(undefined);
  });

  it('allows admin', () => {
    expect(canViewWmsPrices(['wms.prices.view'], 'admin')).toBe(true);
    expect(canViewWmsPrices([], 'admin')).toBe(true);
  });

  it('denies storekeeper even with prices claim', () => {
    expect(canViewWmsPrices(['wms.prices.view'], 'storekeeper')).toBe(false);
  });

  it('allows other roles with wms.prices.view', () => {
    expect(canViewWmsPrices(['wms.prices.view'], 'procurement')).toBe(true);
  });

  it('denies other roles without claim', () => {
    expect(canViewWmsPrices([], 'procurement')).toBe(false);
  });
});
