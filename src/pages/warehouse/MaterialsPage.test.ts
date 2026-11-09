import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { materialsService } from '../../services/materialsService';
import type { MaterialApiDto } from '../../types/wms';
import MaterialsPageRoute from './MaterialsPage';

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
    getByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    discontinue: vi.fn(),
  },
}));

vi.mock('../../hooks/useCategories', () => ({
  useCategoryCascade: () => ({
    categories: [],
    optionsByLevel: [[], [], [], [], []],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/useMaterialRegions', () => ({
  useMaterialRegions: () => ({
    data: ['G7', 'EU', 'ĐNA'],
  }),
}));

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockMaterials: MaterialApiDto[] = [
  {
    materialCode: 'BH-BHN-HT20-120 tubex3000',
    materialName: 'Bộ hâm',
    categoryId: 1,
    isConsumable: false,
    unit: 'Bộ',
    origin: 'Wilo • Đức (G7)',
    technicalSpec: 'HT20',
    generalTechnicalSpec: '120 tubex3000',
    qualityStandard: 'DIN 17175',
    isActive: true,
    categoryPath: {
      danhMuc: 'Cơ khí',
      nhomVatTu: 'Bộ hâm',
      loaiVatTu: 'HT20',
      phanLoai: null,
      kieu: null,
    },
  },
  {
    materialCode: 'BÔ-BOC-Hoa sen-1200x0.4mmx1000-NGOC',
    materialName: 'Bảo ôn',
    categoryId: 2,
    isConsumable: false,
    unit: 'Cuộn',
    origin: 'Hoa Sen • Việt Nam (ĐNA)',
    technicalSpec: '1200x0.4mmx1000',
    generalTechnicalSpec: null,
    qualityStandard: null,
    isActive: true,
    categoryPath: {
      danhMuc: 'Vật tư phụ',
      nhomVatTu: 'Bảo ôn',
      loaiVatTu: 'Hoa Sen',
      phanLoai: null,
      kieu: null,
    },
  },
  {
    materialCode: 'BDB-',
    materialName: 'Bể dập bụi',
    categoryId: 3,
    isConsumable: false,
    unit: 'Cái',
    origin: 'Việt Nam',
    technicalSpec: null,
    generalTechnicalSpec: null,
    qualityStandard: null,
    isActive: false,
    categoryPath: {
      danhMuc: 'Môi trường',
      nhomVatTu: 'Bể dập bụi',
      loaiVatTu: null,
      phanLoai: null,
      kieu: null,
    },
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(materialsService.list).mockResolvedValue({
    items: mockMaterials,
    totalCount: mockMaterials.length,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

async function flushQueries() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
}

async function renderPage() {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(MaterialsPageRoute)),
      ),
    );
  });
  await flushQueries();
}

describe('MaterialsPage Table Rendering & Standards', () => {
  it('renders table headers with exactly 8 separate columns matching spec', async () => {
    await renderPage();

    const headers = [...container.querySelectorAll('thead th')].map(th =>
      th.textContent?.trim(),
    );

    expect(headers).toEqual([
      'Ảnh',
      'Mã vật tư',
      'Tên vật tư',
      'Phân cấp danh mục',
      'ĐVT',
      'Quy cách / Thông số chính',
      'Hãng',
      'Xuất xứ',
    ]);

    expect(headers).not.toContain('Mã & Tên vật tư');
    expect(headers).not.toContain('Hãng & Xuất xứ');
  });

  it('renders first row with separated materialCode, chips, brand and origin tags, materialName, brand and origin', async () => {
    await renderPage();

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll('td');
    expect(cells.length).toBe(8);

    // Cột 2: Mã vật tư (badge + chips phân đoạn + chips Hãng & Xuất xứ)
    const codeCell = cells[1];
    const badge = codeCell.querySelector('.mat-code-cell__badge');
    expect(badge?.textContent?.trim()).toBe('BH-BHN-HT20-120 tubex3000');

    const chips = [...codeCell.querySelectorAll('.mat-code-cell__part')].map(p =>
      p.textContent?.trim(),
    );
    expect(chips).toEqual(['BH', 'BHN', 'HT20', '120 tubex3000']);

    // Chip Hãng & Xuất xứ hiển thị dưới mã vật tư
    expect(codeCell.textContent).toContain('Hãng:');
    expect(codeCell.textContent).toContain('Wilo');
    expect(codeCell.textContent).toContain('XX:');
    expect(codeCell.textContent).toContain('Đức');
    expect(codeCell.textContent).toContain('G7');

    // Cột 3: Tên vật tư độc lập
    const nameCell = cells[2];
    const nameTitle = nameCell.querySelector('.mat-name-cell__title');
    expect(nameTitle?.textContent?.trim()).toBe('Bộ hâm');

    // Cột 7: Hãng
    const brandCell = cells[6];
    expect(brandCell.textContent?.trim()).toBe('Wilo');

    // Cột 8: Xuất xứ (Đức + badge G7)
    const originCell = cells[7];
    expect(originCell.textContent).toContain('Đức');
    expect(originCell.textContent).toContain('G7');
  });

  it('renders inactive item (BDB-) with badge Ngừng SD and origin chip', async () => {
    await renderPage();

    const rows = container.querySelectorAll('tbody tr');
    const thirdRow = rows[2];
    const cells = thirdRow.querySelectorAll('td');

    // Cột 2: Mã vật tư của BDB-
    const codeCell = cells[1];
    const badge = codeCell.querySelector('.mat-code-cell__badge');
    expect(badge?.textContent?.trim()).toBe('BDB-');

    // Phải hiển thị badge Ngừng SD
    const inactiveBadge = codeCell.querySelector('.badge-warning');
    expect(inactiveBadge?.textContent?.trim()).toBe('Ngừng SD');

    // Chip Xuất xứ Việt Nam trong cột Mã vật tư
    expect(codeCell.textContent).toContain('XX:');
    expect(codeCell.textContent).toContain('Việt Nam');

    // Tên vật tư độc lập
    const nameCell = cells[2];
    expect(nameCell.querySelector('.mat-name-cell__title')?.textContent?.trim()).toBe('Bể dập bụi');

    // Cột 7: Hãng không có nên hiển thị -
    const brandCell = cells[6];
    expect(brandCell.textContent?.trim()).toBe('-');

    // Cột 8: Xuất xứ hiển thị Việt Nam
    const originCell = cells[7];
    expect(originCell.textContent?.trim()).toBe('Việt Nam');
  });
});
