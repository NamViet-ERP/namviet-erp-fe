import type { Transfer } from '../types';

export const transfers: Transfer[] = [
  {
    id: 'tf-001', voucherCode: 'CK-000124', date: '27/05/2026',
    fromWarehouseId: 'wh-001', fromWarehouseName: 'Kho Hồ Chí Minh',
    toWarehouseId: 'wh-003', toWarehouseName: 'Kho Hà Nội',
    items: [
      { productId: 'p-001', sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', qty: 5, unit: 'Cái' },
      { productId: 'p-006', sku: 'BLK-500', name: 'Bình chứa khí nén 500L', qty: 10, unit: 'Cái' },
    ],
    status: 'completed', createdBy: 'Phan Văn Vỹ', note: 'Chuyển hàng bổ sung cho kho HN', approvedBy: 'Mỹ Chi',
  },
  {
    id: 'tf-002', voucherCode: 'CK-000123', date: '25/05/2026',
    fromWarehouseId: 'wh-001', fromWarehouseName: 'Kho Hồ Chí Minh',
    toWarehouseId: 'wh-005', toWarehouseName: 'Kho Đà Nẵng',
    items: [
      { productId: 'p-002', sku: 'MNK-SC-15', name: 'Máy nén khí trục vít 15HP', qty: 3, unit: 'Cái' },
    ],
    status: 'approved', createdBy: 'Phan Văn Vỹ', note: 'Chuyển theo yêu cầu chi nhánh ĐN', approvedBy: 'Mỹ Chi',
  },
  {
    id: 'tf-003', voucherCode: 'CK-000122', date: '23/05/2026',
    fromWarehouseId: 'wh-002', fromWarehouseName: 'Kho Bình Dương',
    toWarehouseId: 'wh-001', toWarehouseName: 'Kho Hồ Chí Minh',
    items: [
      { productId: 'p-004', sku: 'MNK-PT-3', name: 'Máy nén khí piston 3HP', qty: 8, unit: 'Cái' },
      { productId: 'p-010', sku: 'DK-OIL-20L', name: 'Dầu máy nén khí 20L', qty: 20, unit: 'Thùng' },
    ],
    status: 'draft', createdBy: 'Trần Huy Hoàng', note: '',
  },
  {
    id: 'tf-004', voucherCode: 'CK-000121', date: '20/05/2026',
    fromWarehouseId: 'wh-001', fromWarehouseName: 'Kho Hồ Chí Minh',
    toWarehouseId: 'wh-004', toWarehouseName: 'Kho Cần Thơ',
    items: [
      { productId: 'p-003', sku: 'MNK-SC-20', name: 'Máy nén khí trục vít 20HP', qty: 2, unit: 'Cái' },
    ],
    status: 'completed', createdBy: 'Phan Văn Vỹ', note: 'Bổ sung tồn kho Cần Thơ', approvedBy: 'Lê Thị Hồng',
  },
];
