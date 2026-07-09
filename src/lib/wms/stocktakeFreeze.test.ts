import { describe, expect, it } from 'vitest';
import {
  buildFrozenProjectMap,
  formatFrozenProjectMessage,
  getFrozenProjectError,
  isProjectFrozen,
} from './stocktakeFreeze';
import type { Stocktake } from '../../types';

const stocktakes: Stocktake[] = [
  {
    id: '1',
    voucherCode: 'KK-0008',
    date: '07/09/2026',
    createdBy: 'Admin',
    status: 'pending',
    warehouseId: 'DA-2026-DEMO-012',
    warehouseName: 'Công trình demo Quảng Ninh',
    condition: 'counting',
    isFrozen: true,
    note: '',
    items: [],
  },
  {
    id: '2',
    voucherCode: 'KK-0009',
    date: '07/09/2026',
    createdBy: 'Admin',
    status: 'approved',
    warehouseId: 'DA-OTHER',
    warehouseName: 'Other',
    condition: 'completed',
    isFrozen: true,
    note: '',
    items: [],
  },
];

describe('stocktakeFreeze', () => {
  it('maps only pending frozen stocktakes', () => {
    const map = buildFrozenProjectMap(stocktakes);
    expect(map.size).toBe(1);
    expect(isProjectFrozen(map, 'DA-2026-DEMO-012')).toBe(true);
    expect(isProjectFrozen(map, 'da-2026-demo-012')).toBe(true);
    expect(isProjectFrozen(map, 'DA-OTHER')).toBe(false);
  });

  it('formats freeze message for inline field error', () => {
    const map = buildFrozenProjectMap(stocktakes);
    const message = getFrozenProjectError(map, 'DA-2026-DEMO-012');
    expect(message).toContain('KK-0008');
    expect(message).toContain('đóng băng kiểm kê');
    expect(formatFrozenProjectMessage(map.get('da-2026-demo-012')!)).toBe(message);
  });
});
