import type { Stocktake } from '../types';

export const stocktakes: Stocktake[] = [
  {
    id: 'st-001', voucherCode: 'KK-001529', date: '27/05/2026',
    createdBy: 'Trần Huy Hoàng', status: 'pending',
    warehouseId: 'wh-002', warehouseName: 'BÌNH DƯƠNG',
    condition: 'counting', isFrozen: true, note: 'Kiểm kê cuối tháng 5',
    items: [
      { productId: 'p-001', sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', systemQty: 15, actualQty: 14, diff: -1 },
      { productId: 'p-004', sku: 'MNK-PT-3', name: 'Máy nén khí piston 3HP', systemQty: 30, actualQty: 30, diff: 0 },
    ],
  },
  {
    id: 'st-002', voucherCode: 'KK-001528', date: '25/05/2026',
    createdBy: 'Ái Du', status: 'approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    condition: 'completed', isFrozen: false, note: '',
    items: [
      { productId: 'p-001', sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', systemQty: 45, actualQty: 45, diff: 0 },
      { productId: 'p-002', sku: 'MNK-SC-15', name: 'Máy nén khí trục vít 15HP', systemQty: 22, actualQty: 21, diff: -1 },
    ],
  },
  {
    id: 'st-003', voucherCode: 'KK-001527', date: '23/05/2026',
    createdBy: 'Ái Du', status: 'approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    condition: 'completed', isFrozen: false, note: 'Kiểm kê đột xuất',
    items: [],
  },
  {
    id: 'st-004', voucherCode: 'KK-001526', date: '22/05/2026',
    createdBy: 'Ái Du', status: 'approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    condition: 'completed', isFrozen: false, note: '',
    items: [],
  },
  {
    id: 'st-005', voucherCode: 'KK-001520', date: '21/05/2026',
    createdBy: 'Ái Du', status: 'approved',
    warehouseId: 'wh-001', warehouseName: 'HỒ CHÍ MINH',
    condition: 'completed', isFrozen: false, note: '',
    items: [],
  },
];
