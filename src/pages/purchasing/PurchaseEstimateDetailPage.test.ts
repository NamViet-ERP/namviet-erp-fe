import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { materialsService } from '../../services/materialsService';
import { purchaseEstimatesService } from '../../services/purchaseEstimatesService';
import { showToast } from '../../components/ui/Toast';
import type { PurchaseEstimateDetailApiDto } from '../../types/api/purchasingApi';
import PurchaseEstimateDetailPage from './PurchaseEstimateDetailPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchaseEstimatesService', () => ({
  purchaseEstimatesService: {
    getById: vi.fn(),
    update: vi.fn(),
    submitApproval: vi.fn(),
    approveL1: vi.fn(),
    reject: vi.fn(),
    convertPlan: vi.fn(),
    shareLink: vi.fn(),
  },
}));

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

function makeDetail(overrides: Partial<PurchaseEstimateDetailApiDto> = {}): PurchaseEstimateDetailApiDto {
  return {
    id: 'est-01',
    code: 'DT-2026-018',
    projectCode: 'DA-NHONTRACH-03',
    title: 'Dự toán ống thép tuyến hơi chính',
    status: 'draft',
    currentVersion: 2,
    viewedVersion: 2,
    createdAt: '2026-11-10T08:00:00Z',
    createdByName: 'Nguyễn Thị Mai Anh',
    updatedAt: '2026-11-12T09:30:00Z',
    updatedByName: 'Trần Minh Đức',
    versions: [
      {
        id: 'ver-1',
        versionNumber: 1,
        createdAt: '2026-11-10T08:00:00Z',
        updatedByName: 'Nguyễn Thị Mai Anh',
      },
      {
        id: 'ver-2',
        versionNumber: 2,
        createdAt: '2026-11-12T09:30:00Z',
        updatedByName: 'Trần Minh Đức',
      },
    ],
    lines: [
      {
        id: 'line-1',
        materialCode: 'VT-ONG-DN100',
        materialName: 'Ống thép đúc DN100 SCH40',
        categoryName: 'Hệ ống thép',
        unit: 'Cây',
        oldQty: 0,
        newQty: 120,
        estimateUnitPrice: 1_050_000,
      },
    ],
    proposals: [
      {
        id: 'prop-1',
        name: 'Khớp nối giãn nở DN100',
        spec: 'Inox 304 PN16',
        unit: 'Bộ',
        qty: 8,
        note: 'Bổ sung theo bản vẽ P&ID',
      },
    ],
    approvals: [],
    ...overrides,
  };
}

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findButton(rootEl: ParentNode, text: string): HTMLButtonElement {
  const btn = Array.from(rootEl.querySelectorAll('button')).find(
    b => b.textContent?.trim() === text || b.textContent?.includes(text),
  );
  if (!btn) throw new Error(`Button containing "${text}" not found`);
  return btn;
}

async function selectComboboxOption(input: HTMLInputElement, optionMatch: string) {
  await act(async () => {
    input.focus();
  });
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(el =>
    el.textContent?.includes(optionMatch),
  );
  expect(option, `Option matching "${optionMatch}" should exist`).toBeDefined();
  await act(async () => {
    option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  });
}

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
let clipboardWriteMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.resetAllMocks();
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{} as DOMRect] as unknown as DOMRectList);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 24,
    y: 120,
    top: 120,
    left: 24,
    right: 344,
    bottom: 160,
    width: 320,
    height: 40,
    toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });

  clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: clipboardWriteMock },
  });

  vi.mocked(materialsService.list).mockResolvedValue({
    items: [
      {
        materialCode: 'VT-ONG-DN100',
        materialName: 'Ống thép đúc DN100 SCH40',
        categoryId: 1,
        isConsumable: false,
        unit: 'Cây',
        isActive: true,
        categoryPath: {
          danhMuc: 'Hệ ống thép',
          nhomVatTu: null,
          loaiVatTu: null,
          phanLoai: null,
          kieu: null,
        },
      },
      {
        materialCode: 'VT-VAN-DN150',
        materialName: 'Van bướm tay gạt DN150 PN16',
        categoryId: 1,
        isConsumable: false,
        unit: 'Cái',
        isActive: true,
        categoryPath: {
          danhMuc: 'Hệ ống thép',
          nhomVatTu: null,
          loaiVatTu: null,
          phanLoai: null,
          kieu: null,
        },
      },
    ],
    totalCount: 2,
    page: 1,
    pageSize: 500,
    totalPages: 1,
  });

  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function flushQueries() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
  });
}

async function renderDetail(id = 'est-01') {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [`/purchasing/estimate-procurement/${id}`] },
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: '/purchasing/estimate-procurement/:id',
              element: createElement(PurchaseEstimateDetailPage),
            }),
          ),
        ),
      ),
    );
  });
  await flushQueries();
}

describe('PurchaseEstimateDetailPage characterization', () => {
  it('switches versions in sidebar and hides edit/submit/share actions when viewing an older version', async () => {
    vi.mocked(purchaseEstimatesService.getById).mockImplementation(async (_id, version) => {
      if (version === 1) {
        return makeDetail({
          viewedVersion: 1,
          lines: [
            {
              id: 'line-v1',
              materialCode: 'VT-ONG-DN100',
              materialName: 'Ống thép đúc DN100 SCH40',
              categoryName: 'Hệ ống thép',
              unit: 'Cây',
              oldQty: 0,
              newQty: 80,
              estimateUnitPrice: 980_000,
            },
          ],
        });
      }
      return makeDetail();
    });

    await renderDetail();

    expect(container.textContent).toContain('DT-2026-018 · Dự toán ống thép tuyến hơi chính');
    expect(container.textContent).toContain('120');
    expect(container.textContent).toContain('Khớp nối giãn nở DN100');
    expect(findButton(container, 'Sửa dòng vật tư')).toBeTruthy();
    expect(findButton(container, 'Gửi duyệt')).toBeTruthy();

    const ver1Btn = [...container.querySelectorAll<HTMLButtonElement>('.pur-estimate-detail__ver')].find(
      b => b.textContent?.includes('Ver 1'),
    );
    expect(ver1Btn).toBeDefined();
    await act(async () => {
      ver1Btn!.click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.getById).toHaveBeenCalledWith('est-01', 1);
    expect(container.textContent).toContain('980.000 VNĐ');
    expect(container.querySelector('button')?.textContent).not.toContain('Sửa dòng vật tư');
    const allBtnsWhileV1 = Array.from(container.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(allBtnsWhileV1).not.toContain('Sửa dòng vật tư');
    expect(allBtnsWhileV1).not.toContain('Gửi duyệt');
  });

  it('toggles edit mode, adds/removes lines, validates inputs, and saves a new version', async () => {
    vi.mocked(purchaseEstimatesService.getById).mockResolvedValue(makeDetail());
    vi.mocked(purchaseEstimatesService.update).mockResolvedValue(makeDetail({ currentVersion: 3, viewedVersion: 3 }));

    await renderDetail();

    await act(async () => {
      findButton(container, 'Sửa dòng vật tư').click();
    });

    const titleInput = container.querySelector<HTMLInputElement>('.pur-estimate-edit input.form-input')!;
    await act(async () => {
      setInputValue(titleInput, 'Dự toán ống thép tuyến hơi chính (Cập nhật)');
    });

    // Clear the only line -> validation error on save
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Xóa dòng 1"]')!.click();
    });
    await act(async () => {
      findButton(container, 'Lưu chỉnh sửa').click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Giữ ít nhất một dòng vật tư.');

    // Pick material with 0 qty -> validation error on save
    const matInput1 = container.querySelector<HTMLInputElement>('input[placeholder="Gõ mã hoặc tên vật tư…"]')!;
    await selectComboboxOption(matInput1, 'VT-VAN-DN150');
    await act(async () => {
      findButton(container, 'Lưu chỉnh sửa').click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0.');

    // Add a second line, remove it, fill valid qty/price, and save
    await act(async () => {
      findButton(container, 'Thêm vật tư').click();
    });
    expect(container.querySelectorAll('.pur-estimate-edit__table tbody tr').length).toBe(2);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Xóa dòng 2"]')!.click();
    });
    expect(container.querySelectorAll('.pur-estimate-edit__table tbody tr').length).toBe(1);

    const qtyInput = container.querySelector<HTMLInputElement>('input[aria-label="Số lượng dòng 1"]')!;
    const priceInput = container.querySelector<HTMLInputElement>('.pur-estimate-edit__table input[inputmode="numeric"]')!;
    await act(async () => {
      setInputValue(qtyInput, '15');
      setInputValue(priceInput, '2200000');
    });

    await act(async () => {
      findButton(container, 'Lưu chỉnh sửa').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.update).toHaveBeenCalledWith('est-01', {
      title: 'Dự toán ống thép tuyến hơi chính (Cập nhật)',
      lines: [
        {
          materialCode: 'VT-VAN-DN150',
          newQty: 15,
          estimateUnitPrice: 2_200_000,
        },
      ],
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã lưu Ver 3.');
  });

  it('handles share link copy and draft submit', async () => {
    vi.mocked(purchaseEstimatesService.getById).mockResolvedValue(makeDetail());
    vi.mocked(purchaseEstimatesService.shareLink).mockResolvedValue({
      token: 'tok-abc-123',
      path: '/public/estimates/tok-abc-123',
      expiresAt: '2026-12-01T00:00:00Z',
    });
    vi.mocked(purchaseEstimatesService.submitApproval).mockResolvedValue(makeDetail({ status: 'pending_approval' }));

    await renderDetail();

    await act(async () => {
      findButton(container, 'Lấy link xem').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.shareLink).toHaveBeenCalledWith('est-01');
    expect(clipboardWriteMock).toHaveBeenCalledWith(`${window.location.origin}/public/estimates/tok-abc-123`);
    expect(showToast).toHaveBeenCalledWith('success', 'Đã copy link xem Ver mới nhất.');

    await act(async () => {
      findButton(container, 'Gửi duyệt').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.submitApproval).toHaveBeenCalledWith('est-01');
    expect(showToast).toHaveBeenCalledWith('success', 'Đã gửi duyệt (Trưởng dự án).');
  });

  it('supports approve and reject decisions on pending_approval estimate', async () => {
    vi.mocked(purchaseEstimatesService.getById).mockResolvedValue(
      makeDetail({
        status: 'pending_approval',
        approvals: [
          {
            id: 'app-1',
            level: 1,
            name: 'Trưởng dự án',
            status: 'pending',
          },
        ],
      }),
    );
    vi.mocked(purchaseEstimatesService.approveL1).mockResolvedValue(makeDetail({ status: 'approved' }));
    vi.mocked(purchaseEstimatesService.reject).mockResolvedValue(makeDetail({ status: 'rejected' }));

    await renderDetail();

    expect(container.textContent).toContain('Quyết định duyệt');
    const noteBox = container.querySelector<HTMLTextAreaElement>('.pur-estimate-decide textarea')!;
    await act(async () => {
      setInputValue(noteBox, 'Đơn giá phù hợp ngân sách Nhơn Trạch 3');
    });

    await act(async () => {
      findButton(container, 'Duyệt').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.approveL1).toHaveBeenCalledWith('est-01', {
      note: 'Đơn giá phù hợp ngân sách Nhơn Trạch 3',
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã duyệt dự toán.');

    await act(async () => {
      setInputValue(noteBox, 'Cần bổ sung báo giá cạnh tranh');
    });
    await act(async () => {
      findButton(container, 'Từ chối').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.reject).toHaveBeenCalledWith('est-01', {
      note: 'Cần bổ sung báo giá cạnh tranh',
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã từ chối dự toán.');
  });

  it('converts approved estimate to plan and navigates to the created plan', async () => {
    vi.mocked(purchaseEstimatesService.getById).mockResolvedValue(
      makeDetail({
        status: 'approved',
        convertedPlanCode: null,
        approvals: [
          {
            id: 'app-1',
            level: 1,
            name: 'Trưởng dự án',
            status: 'approved',
            actionByName: 'Trần Minh Đức',
            actionAt: '2026-11-12T10:00:00Z',
            note: 'Đồng ý',
          },
        ],
      }),
    );
    vi.mocked(purchaseEstimatesService.convertPlan).mockResolvedValue({ planCode: 'KHMH-2026-091' });

    await renderDetail();

    await act(async () => {
      findButton(container, 'Tạo kế hoạch mua hàng').click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.convertPlan).toHaveBeenCalledWith('est-01');
    expect(showToast).toHaveBeenCalledWith('success', 'Đã tạo kế hoạch KHMH-2026-091.');
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/plans/KHMH-2026-091');
  });
});
