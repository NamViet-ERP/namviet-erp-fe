import type { Conversion } from '../types';

export const conversions: Conversion[] = [
  {
    id: 'cv-001', voucherCode: 'CDK-000056', date: '26/05/2026',
    fromWarehouseId: 'wh-001', fromWarehouseName: 'Kho Hồ Chí Minh',
    fromType: 'Kho tồn',
    toWarehouseId: 'wh-006', toWarehouseName: 'Kho hư lỗi HCM',
    toType: 'Kho hư lỗi',
    items: [
      { productId: 'p-004', sku: 'MNK-PT-3', name: 'Máy nén khí piston 3HP', qty: 2, unit: 'Cái', reason: 'Lỗi motor, cần sửa chữa' },
    ],
    status: 'approved', createdBy: 'Phan Văn Vỹ', approvedBy: 'Mỹ Chi', note: 'Phát hiện lỗi khi kiểm hàng',
  },
  {
    id: 'cv-002', voucherCode: 'CDK-000055', date: '24/05/2026',
    fromWarehouseId: 'wh-006', fromWarehouseName: 'Kho hư lỗi HCM',
    fromType: 'Kho hư lỗi',
    toWarehouseId: 'wh-007', toWarehouseName: 'Kho bảo hành HCM',
    toType: 'Kho bảo hành',
    items: [
      { productId: 'p-001', sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', qty: 1, unit: 'Cái', reason: 'Chuyển bảo hành hãng' },
    ],
    status: 'completed', createdBy: 'Phan Văn Vỹ', approvedBy: 'Mỹ Chi', note: 'Gửi bảo hành theo ticket BH-2026-089',
  },
  {
    id: 'cv-003', voucherCode: 'CDK-000054', date: '22/05/2026',
    fromWarehouseId: 'wh-007', fromWarehouseName: 'Kho bảo hành HCM',
    fromType: 'Kho bảo hành',
    toWarehouseId: 'wh-001', toWarehouseName: 'Kho Hồ Chí Minh',
    toType: 'Kho tồn',
    items: [
      { productId: 'p-002', sku: 'MNK-SC-15', name: 'Máy nén khí trục vít 15HP', qty: 1, unit: 'Cái', reason: 'Đã sửa xong, trả về kho tồn' },
    ],
    status: 'pending', createdBy: 'Mỹ Chi', note: 'Chờ kiểm tra chất lượng trước khi nhập lại',
  },
];
