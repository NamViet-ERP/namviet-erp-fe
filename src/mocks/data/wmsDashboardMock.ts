export interface TopProductMockRow {
  sku: string;
  name: string;
  qty: number;
  value: number;
}

export const MOCK_TOP_PRODUCTS: TopProductMockRow[] = [
  { sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', qty: 48, value: 2_160_000_000 },
  { sku: 'BLK-500', name: 'Bình chứa khí nén 500L', qty: 36, value: 306_000_000 },
  { sku: 'LLK-10', name: 'Lọc khí công nghiệp 10μm', qty: 120, value: 23_400_000 },
  { sku: 'DK-OIL-20L', name: 'Dầu máy nén khí 20L', qty: 65, value: 97_500_000 },
  { sku: 'MNK-SC-15', name: 'Máy nén khí trục vít 15HP', qty: 12, value: 720_000_000 },
];

export const MOCK_TOP_MATERIALS: TopProductMockRow[] = [
  { sku: 'LLK-10', name: 'Lọc khí công nghiệp 10μm', qty: 120, value: 23_400_000 },
  { sku: 'DK-OIL-20L', name: 'Dầu máy nén khí 20L', qty: 65, value: 97_500_000 },
  { sku: 'BLK-500', name: 'Bình chứa khí nén 500L', qty: 36, value: 306_000_000 },
  { sku: 'MNK-PT-3', name: 'Máy nén khí piston 3HP', qty: 22, value: 198_000_000 },
  { sku: 'MNK-SC-7.5', name: 'Máy nén khí trục vít 7.5HP', qty: 48, value: 2_160_000_000 },
];
