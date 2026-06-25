export interface ExpectedItem {
  id: string;
  project: string;
  sku: string;
  name: string;
  qty: number;
  surplus: number;
  unit: string;
  date: string;
}

export interface Requirement {
  sku: string;
  name: string;
  needed: number;
}

export interface TargetProject {
  id: string;
  name: string;
  requirements: Requirement[];
}

export interface ScanSource {
  project: string;
  surplusAvailable: number;
  id: string;
}

export interface ScanResult {
  sku: string;
  name: string;
  needed: number;
  availableSurplus: number;
  allocated: number;
  sources: ScanSource[];
}

export const initialExpectedData: ExpectedItem[] = [
  { id: 'exp-1', project: 'Dự án 1 - Khách sạn Mường Thanh', sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', qty: 10, surplus: 3, unit: 'Cái', date: '10/06/2026' },
  { id: 'exp-2', project: 'Dự án 1 - Khách sạn Mường Thanh', sku: 'BCK-1000', name: 'Bình chứa khí 1000L', qty: 5, surplus: 1, unit: 'Cái', date: '12/06/2026' },
  { id: 'exp-3', project: 'Dự án 2 - Nhà máy Dệt Nam Định', sku: 'MSK-TNL-30', name: 'Máy sấy khí tác nhân lạnh', qty: 8, surplus: 2, unit: 'Bộ', date: '08/06/2026' },
  { id: 'exp-4', project: 'Dự án 3 - Hóa dầu Nghi Sơn', sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', qty: 120, surplus: 35, unit: 'Mét', date: '15/06/2026' },
  { id: 'exp-5', project: 'Dự án 4 - Nhà máy Bia Heineken', sku: 'MNK-TV-50', name: 'Máy nén khí trục vít 50HP', qty: 4, surplus: 0, unit: 'Cái', date: '18/06/2026' },
  { id: 'exp-6', project: 'Dự án 4 - Nhà máy Bia Heineken', sku: 'LCK-02', name: 'Bộ lọc khí thô đường ống', qty: 30, surplus: 10, unit: 'Bộ', date: '18/06/2026' },
];

export const targetProjects: TargetProject[] = [
  {
    id: 'proj-5',
    name: 'Dự án 5 - Chung cư Vinhomes Grand Park',
    requirements: [
      { sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', needed: 2 },
      { sku: 'BCK-1000', name: 'Bình chứa khí 1000L', needed: 1 },
      { sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', needed: 10 },
    ],
  },
  {
    id: 'proj-6',
    name: 'Dự án 6 - Sân bay Long Thành',
    requirements: [
      { sku: 'MSK-TNL-30', name: 'Máy sấy khí tác nhân lạnh', needed: 1 },
      { sku: 'LCK-02', name: 'Bộ lọc khí thô đường ống', needed: 5 },
      { sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', needed: 20 },
    ],
  },
];
