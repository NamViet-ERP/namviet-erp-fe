import { describe, it, expect } from 'vitest';
import { availableExportQty, inventoryRow } from './exportUtils';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';
import type { Export } from '../../../types';

describe('exportUtils', () => {
  const mockInventory = [
    {
      projectCode: 'DA-2026-001',
      materialCode: 'MAT-01',
      materialName: 'Vật tư 1',
      unit: 'Cây',
      actualInventoryQty: 1,
      plannedImportQty: 0,
      plannedExportQty: 1, // Reserved by pending voucher
      pendingDefectQty: 0,
    },
    {
      projectCode: 'DA-2026-001',
      materialCode: 'MAT-02',
      materialName: 'Vật tư 2',
      unit: 'Cái',
      actualInventoryQty: 5,
      plannedImportQty: 0,
      plannedExportQty: 2,
      pendingDefectQty: 0,
    },
  ] as unknown as WarehouseProjectInventoryApiDto[];

  it('finds inventory row by material code', () => {
    expect(inventoryRow(mockInventory, 'MAT-01')?.materialName).toBe('Vật tư 1');
    expect(inventoryRow(mockInventory, 'NON_EXISTENT')).toBeUndefined();
  });

  it('calculates availableExportQty for new voucher (available is actual - planned)', () => {
    // MAT-01: actual 1, planned 1 -> available 0
    const availableMat1 = availableExportQty(mockInventory, 'MAT-01', [{ materialCode: 'MAT-01', qty: '1' }], 0);
    expect(availableMat1).toBe(0);

    // MAT-02: actual 5, planned 2 -> available 3
    const availableMat2 = availableExportQty(mockInventory, 'MAT-02', [{ materialCode: 'MAT-02', qty: '1' }], 0);
    expect(availableMat2).toBe(3);
  });

  it('restores original voucher quantity when editing an existing voucher', () => {
    const originalItems: Export['items'] = [
      { productId: 'MAT-01', sku: 'MAT-01', name: 'Vật tư 1', qty: 1, unit: 'Cây' },
    ];

    // When editing the voucher that reserved MAT-01 with qty 1:
    // Available should be (1 - 1) + 1 = 1
    const available = availableExportQty(
      mockInventory,
      'MAT-01',
      [{ materialCode: 'MAT-01', qty: '1' }],
      0,
      originalItems,
    );
    expect(available).toBe(1);
  });

  it('accounts for other lines of the same material in form', () => {
    const formItems = [
      { materialCode: 'MAT-02', qty: '1' },
      { materialCode: 'MAT-02', qty: '2' },
    ];

    // MAT-02 has 3 available total.
    // For line 0: line 1 used 2, so line 0 has 3 - 2 = 1 available.
    expect(availableExportQty(mockInventory, 'MAT-02', formItems, 0)).toBe(1);
    // For line 1: line 0 used 1, so line 1 has 3 - 1 = 2 available.
    expect(availableExportQty(mockInventory, 'MAT-02', formItems, 1)).toBe(2);
  });
});
