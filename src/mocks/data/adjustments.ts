import type { Adjustment } from '../types';

export const adjustments: Adjustment[] = [
  {
    id: 'adj-001', voucherCode: 'ĐCT-001452', date: '27/05/2026',
    stocktakeCode: 'KK-001529', type: 'increase',
    createdBy: 'Trần Huy Hoàng', condition: 'exported',
    warehouseId: 'wh-002', warehouseName: 'BÌNH DƯƠNG',
    note: '', isNew: true,
    items: [{ productId: 'p-006', sku: 'BLK-500', name: 'Bình chứa khí nén 500L', adjustQty: 2, reason: 'Thừa khi kiểm kê' }],
  },
  {
    id: 'adj-002', voucherCode: 'ĐCT-001451', date: '25/05/2026',
    stocktakeCode: 'KK-001528', type: 'increase',
    createdBy: 'Ái Du', condition: 'warehouse_approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    note: '', isNew: true,
    items: [{ productId: 'p-010', sku: 'DK-OIL-20L', name: 'Dầu máy nén khí 20L', adjustQty: 5, reason: 'Thừa khi kiểm kê' }],
  },
  {
    id: 'adj-003', voucherCode: 'ĐCT-001450', date: '23/05/2026',
    stocktakeCode: 'KK-001527', type: 'increase',
    createdBy: 'Ái Du', condition: 'warehouse_approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    note: '', isNew: true,
    items: [],
  },
  {
    id: 'adj-004', voucherCode: 'ĐCT-001449', date: '22/05/2026',
    stocktakeCode: 'KK-001526', type: 'increase',
    createdBy: 'Ái Du', condition: 'warehouse_approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    note: '', isNew: true,
    items: [],
  },
  {
    id: 'adj-005', voucherCode: 'ĐCT-001444', date: '21/05/2026',
    stocktakeCode: 'KK-001520', type: 'increase',
    createdBy: 'Ái Du', condition: 'exported',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    note: '', isNew: false,
    items: [],
  },
];
