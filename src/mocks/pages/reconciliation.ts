export interface ReconciliationItem {
  sku: string;
  name: string;
  estPrice: number;
  poPrice: number;
  ordered: number;
  received: number;
  unit: string;
}

export interface PoRecord {
  code: string;
  project: string;
  supplier: string;
  date: string;
  items: ReconciliationItem[];
}

export const mockReconciliationData: Record<string, PoRecord> = {
  'PO-2026-001': {
    code: 'PO-2026-001',
    project: 'Dự án 1 - Khách sạn Mường Thanh',
    supplier: 'Công ty TNHH Thép Việt Nhật',
    date: '02/06/2026',
    items: [
      { sku: 'THEP-D10', name: 'Thép cuộn Phi 10 Hòa Phát', estPrice: 15000, poPrice: 16200, ordered: 5000, received: 5000, unit: 'kg' },
      { sku: 'XI-MANG-40', name: 'Xi măng PCB40 Hoàng Long', estPrice: 85000, poPrice: 86000, ordered: 200, received: 200, unit: 'Bao' },
      { sku: 'CAT-VANG', name: 'Cát vàng xây dựng hạt thô', estPrice: 320000, poPrice: 315000, ordered: 50, received: 50, unit: 'm3' },
    ],
  },
  'PO-2026-002': {
    code: 'PO-2026-002',
    project: 'Dự án 2 - Nhà máy Dệt Nam Định',
    supplier: 'Tổng kho Điện lạnh Hải Phòng',
    date: '01/06/2026',
    items: [
      { sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', estPrice: 45000000, poPrice: 45500000, ordered: 2, received: 2, unit: 'Cái' },
      { sku: 'BCK-1000', name: 'Bình chứa khí 1000L', estPrice: 18000000, poPrice: 18000000, ordered: 1, received: 1, unit: 'Cái' },
    ],
  },
  'PO-2026-003': {
    code: 'PO-2026-003',
    project: 'Dự án 5 - Vinhomes Grand Park',
    supplier: 'Nhà phân phối Cáp CADIVI',
    date: '28/05/2026',
    items: [
      { sku: 'CAP-CV-16', name: 'Cáp điện CADIVI 16mm2', estPrice: 22000, poPrice: 23800, ordered: 1500, received: 1500, unit: 'm' },
      { sku: 'ONG-LUON-20', name: 'Ống luồn dây điện Phi 20', estPrice: 12000, poPrice: 12000, ordered: 300, received: 300, unit: 'm' },
    ],
  },
};
