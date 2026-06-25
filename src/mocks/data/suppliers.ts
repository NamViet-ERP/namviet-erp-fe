import type { SupplierApiDto } from '../../types/wms';

export const MOCK_SUPPLIERS: SupplierApiDto[] = [
  { id: 1, supplierCode: 'NCC-001', supplierName: 'Công ty TNHH Thép Việt Nam', contactPhone: '0901234567', maxDebtDays: 30, rating: 'A' },
  { id: 2, supplierCode: 'NCC-002', supplierName: 'Hòa Phát Group', contactPhone: '0912345678', maxDebtDays: 45, rating: 'A' },
  { id: 3, supplierCode: 'NCC-003', supplierName: 'Siemens Vietnam', contactPhone: null, maxDebtDays: 60, rating: 'B' },
];
