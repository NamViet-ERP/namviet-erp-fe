import { act, createElement } from 'react';
import type React from 'react';
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
    uploadImage: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
    discontinue: vi.fn(),
  },
}));

vi.mock('../../hooks/useCategories', () => ({
  useCategoryCascade: () => ({
    categories: [],
    optionsByLevel: [[], [], [], [], []],
    isLoading: false,
  }),
  useCategoryTree: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/useMaterialRegions', () => ({
  useMaterialRegions: () => ({
    data: ['G7', 'EU', 'ĐNA'],
  }),
}));

vi.mock('../../hooks/useMaterialUnits', () => ({
  useMaterialUnits: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/useMaterialOrigins', () => ({
  useMaterialOrigins: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/useMaterialBrands', () => ({
  useMaterialBrands: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockSessionUser = vi.fn<() => {
  user?: { id: string; username: string; role: string };
  permissions: string[];
  refresh: () => void;
}>(() => ({
  user: { id: 'usr-staff', username: 'staff1', role: 'staff' },
  permissions: ['wms.materials.view:all'],
  refresh: vi.fn(),
}));

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => mockSessionUser(),
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
  mockSessionUser.mockReturnValue({
    user: { id: 'usr-staff', username: 'staff1', role: 'staff' },
    permissions: ['wms.materials.view:all'],
    refresh: vi.fn(),
  });
  vi.mocked(materialsService.list).mockResolvedValue({
    items: mockMaterials,
    totalCount: mockMaterials.length,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });
  vi.mocked(materialsService.getByCode).mockImplementation(async (code: string) => {
    const item = mockMaterials.find(m => m.materialCode === code);
    return item ?? mockMaterials[0];
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

async function renderPage(initialEntries?: (string | { pathname: string; state?: unknown; search?: string })[], initialIndex?: number) {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          initialEntries ? { initialEntries, initialIndex } : null,
          createElement(MaterialsPageRoute),
        ),
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
    expect(headers).not.toContain('Thao tác');

    const clearButton = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Dọn sạch danh mục'),
    );
    expect(clearButton).toBeUndefined();
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

  it('renders 9 columns with "Thao tác", "Dọn sạch danh mục" button, and row delete buttons when user is admin', async () => {
    mockSessionUser.mockReturnValue({
      user: { id: 'usr-admin', username: 'admin', role: 'admin' },
      permissions: ['wms.materials.view:all', 'wms.materials.delete'],
      refresh: vi.fn(),
    });

    await renderPage();

    // Headers có 9 cột bao gồm 'Thao tác'
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
      'Thao tác',
    ]);
    expect(headers).toHaveLength(9);

    // Nút "Dọn sạch danh mục" CÓ hiển thị
    const clearButton = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Dọn sạch danh mục'),
    );
    expect(clearButton).toBeDefined();

    // Nút thùng rác xóa từng dòng CÓ hiển thị
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBe(9);
      const actionCell = cells[8];
      const deleteBtn = actionCell.querySelector(
        `button[title="Xóa vật tư ${mockMaterials[idx].materialCode}"]`,
      );
      expect(deleteBtn).not.toBeNull();
    });
  });
});

describe('MaterialsPage URL SearchParams & Navigation Synchronisation', () => {
  it('renders MaterialDetailView when route contains ?code= query parameter', async () => {
    await renderPage(['/operations/materials?code=BH-BHN-HT20-120%20tubex3000']);

    // Should render detail view with the material code and title
    expect(container.textContent).toContain('Mã vật tư: BH-BHN-HT20-120 tubex3000');
    expect(container.textContent).toContain('Bộ hâm');
    // Table should not be rendered
    expect(container.querySelector('table.mat-catalog-table')).toBeNull();
    // Back button should be present
    expect(container.querySelector('.page-header__back')).not.toBeNull();
  });

  it('navigates to detail view when clicking a row, and returns to list when clicking Back', async () => {
    await renderPage(['/operations/materials']);

    // Initially in table list
    expect(container.querySelector('table.mat-catalog-table')).not.toBeNull();
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Click on the second row (BÔ-BOC-Hoa sen-1200x0.4mmx1000-NGOC)
    const secondRow = rows[1] as HTMLTableRowElement;
    await act(async () => {
      secondRow.click();
    });
    await flushQueries();

    // Now in detail view
    expect(container.querySelector('table.mat-catalog-table')).toBeNull();
    expect(container.textContent).toContain('Mã vật tư: BÔ-BOC-Hoa sen-1200x0.4mmx1000-NGOC');
    expect(container.textContent).toContain('Bảo ôn');

    // Click Back button
    const backBtn = container.querySelector('.page-header__back') as HTMLButtonElement;
    expect(backBtn).not.toBeNull();
    await act(async () => {
      backBtn.click();
    });
    await flushQueries();

    // Back to table list
    expect(container.querySelector('table.mat-catalog-table')).not.toBeNull();
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('synchronizes detail view when location.state has highlightCode', async () => {
    await renderPage([{ pathname: '/operations/materials', state: { highlightCode: 'BDB-' } }]);

    // Detail view should render for BDB-
    expect(container.querySelector('table.mat-catalog-table')).toBeNull();
    expect(container.textContent).toContain('Mã vật tư: BDB-');
    expect(container.textContent).toContain('Bể dập bụi');

    // Click Back
    const backBtn = container.querySelector('.page-header__back') as HTMLButtonElement;
    expect(backBtn).not.toBeNull();
    await act(async () => {
      backBtn.click();
    });
    await flushQueries();

    // Returns to table list
    expect(container.querySelector('table.mat-catalog-table')).not.toBeNull();
  });
});

describe('MaterialsPage Create Material Modal', () => {
  it('opens "Tạo mã vật tư mới" modal with required sections and shows validation errors on empty submit', async () => {
    await renderPage();

    const createTrigger = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Tạo mã vật tư'),
    );
    expect(createTrigger).toBeDefined();

    await act(async () => {
      createTrigger!.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Tạo mã vật tư mới');
    expect(dialog?.textContent).toContain('Mã vật tư');
    expect(dialog?.textContent).toContain('Tên vật tư');
    expect(dialog?.textContent).toContain('Xuất xứ & Nhãn hiệu');

    const submitButton = [...dialog!.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Tạo mới',
    );
    expect(submitButton).toBeDefined();

    await act(async () => {
      submitButton!.click();
    });

    expect(dialog?.textContent).toContain('Vui lòng chọn danh mục');
    expect(dialog?.textContent).toContain('Vui lòng chọn nhóm vật tư');
    expect(dialog?.textContent).toContain('Vui lòng nhập mã vật tư');
    expect(dialog?.textContent).toContain('Vui lòng nhập tên vật tư');
    expect(dialog?.textContent).toContain('Vui lòng chọn đơn vị tính');
    expect(materialsService.create).not.toHaveBeenCalled();
  });
});
