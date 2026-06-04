import type { Export } from '../types';

export const exports: Export[] = [
  {
    id: 'ex-001', voucherCode: 'XK-001892', date: '27/05/2026',
    soCode: 'SO-003456', customer: 'CÔNG TY TNHH CƠ KHÍ THÀNH ĐẠT',
    warehouseId: 'wh-001', warehouseName: 'Kho Hồ Chí Minh',
    items: [{ productId: 'p-001', sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', qty: 2, unit: 'Cái' }],
    status: 'completed', createdBy: 'Phan Văn Vỹ', note: 'Giao hàng theo SO',
  },
  {
    id: 'ex-002', voucherCode: 'XK-001891', date: '26/05/2026',
    soCode: 'SO-003455', customer: 'CÔNG TY CP SẢN XUẤT MINH PHÁT',
    warehouseId: 'wh-001', warehouseName: 'Kho Hồ Chí Minh',
    items: [{ productId: 'p-003', sku: 'MNK-SC-20', name: 'Máy nén khí trục vít 20HP', qty: 1, unit: 'Cái' }],
    status: 'approved', createdBy: 'Phan Văn Vỹ', note: '',
  },
  {
    id: 'ex-003', voucherCode: 'XK-001890', date: '25/05/2026',
    soCode: 'SO-003450', customer: 'CÔNG TY TNHH THÉP VIỆT Á',
    warehouseId: 'wh-003', warehouseName: 'Kho Hà Nội',
    items: [
      { productId: 'p-005', sku: 'MNK-PT-5', name: 'Máy nén khí piston 5HP', qty: 3, unit: 'Cái' },
      { productId: 'p-006', sku: 'BLK-500', name: 'Bình chứa khí nén 500L', qty: 3, unit: 'Cái' },
    ],
    status: 'pending', createdBy: 'Nguyễn Minh Tuấn', note: 'Chờ xác nhận xuất',
  },
];
