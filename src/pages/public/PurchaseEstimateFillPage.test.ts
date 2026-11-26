import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '../../components/ui/Toast';
import { purchaseEstimatesService } from '../../services/purchaseEstimatesService';
import type { PublicPurchaseEstimateApiDto } from '../../types/api/purchasingApi';
import PurchaseEstimateFillPage from './PurchaseEstimateFillPage';

vi.mock('../../services/purchaseEstimatesService', () => ({
  purchaseEstimatesService: {
    getPublic: vi.fn(),
    submitPublic: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  default: () => null,
  showToast: vi.fn(),
}));

function makeEstimateDto(overrides: Partial<PublicPurchaseEstimateApiDto> = {}): PublicPurchaseEstimateApiDto {
  return {
    code: 'DT-2026-019',
    title: 'Dự toán vật tư cơ điện tầng 3 - Dự án Nhà máy Nhơn Trạch',
    projectCode: 'DA-NT-2026',
    projectName: 'Nhà máy Nhơn Trạch',
    status: 'draft',
    canFill: true,
    preparerName: '',
    preparerDate: null,
    lines: [
      {
        materialCode: 'VT-CAP-001',
        materialName: 'Cáp điện Cadivi CVV 3x16+1x10',
        categoryName: 'Cáp & Dây dẫn',
        unit: 'mét',
        qty: 120,
      },
      {
        materialCode: 'VT-ONG-008',
        materialName: 'Ống luồn dây PVC D25 Sino',
        categoryName: 'Ống & Phụ kiện',
        unit: 'cây',
        qty: 0,
      },
    ],
    proposals: [],
    preparers: [
      {
        id: 'prep-01',
        name: 'Phạm Quốc Bảo',
        role: 'project_engineer',
        roleLabel: 'Kỹ sư Dự án',
      },
      {
        id: 'prep-02',
        name: 'Đỗ Thị Hạnh',
        role: 'production_lead',
        roleLabel: 'Quản lý Sản xuất',
      },
    ],
    ...overrides,
  };
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');

describe('PurchaseEstimateFillPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(purchaseEstimatesService.getPublic).mockResolvedValue(makeEstimateDto());
    vi.mocked(purchaseEstimatesService.submitPublic).mockResolvedValue(
      makeEstimateDto({ canFill: false, preparerName: 'Phạm Quốc Bảo - Kỹ sư Dự án' }),
    );

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

  async function renderPage(token = 'tok-nhon-trach-019') {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            MemoryRouter,
            { initialEntries: [`/public/purchase-estimates/${token}`] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/public/purchase-estimates/:token',
                element: createElement(PurchaseEstimateFillPage),
              }),
            ),
          ),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  it('renders read-only view when canFill is false', async () => {
    vi.mocked(purchaseEstimatesService.getPublic).mockResolvedValue(
      makeEstimateDto({ canFill: false }),
    );

    await renderPage();

    expect(container.textContent).toContain('Chỉ xem');
    expect(container.textContent).toContain('DT-2026-019');
    expect(container.textContent).toContain('VT-CAP-001');
    expect(container.querySelector('.erp-table-shell')).not.toBeNull();
    expect(container.querySelector('select')).toBeNull();
  });

  it('allows selecting preparer via SelectField, editing quantities, adding proposal rows in TableShell, and submitting in review step', async () => {
    await renderPage();

    expect(container.querySelectorAll('.erp-table-shell').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('button.btn-primary, button.btn-outline, button.btn-ghost')).toHaveLength(0);

    const preparerSelect = container.querySelector('select.form-select[aria-label="Người lập dự toán"]') as HTMLSelectElement;
    expect(preparerSelect).not.toBeNull();
    const fieldWrap = preparerSelect.closest('.form-field');
    expect(fieldWrap).not.toBeNull();
    expect(fieldWrap?.querySelectorAll('label')).toHaveLength(1);

    // Trying to review without preparer shows error toast
    const reviewBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Xem lại trước khi gửi'),
    ) as HTMLButtonElement;
    await act(async () => {
      reviewBtn.click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Vui lòng chọn người lập dự toán.');

    // Select preparer
    await act(async () => {
      preparerSelect.value = 'Phạm Quốc Bảo - Kỹ sư Dự án';
      preparerSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Update quantity for VT-ONG-008
    const ongQtyInput = container.querySelector('input[aria-label="Số lượng VT-ONG-008"]') as HTMLInputElement;
    expect(ongQtyInput).not.toBeNull();
    await act(async () => {
      setInputValue(ongQtyInput, '45');
    });

    // Add a proposal row
    const addProposalBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Thêm dòng đề xuất'),
    ) as HTMLButtonElement;
    await act(async () => {
      addProposalBtn.click();
    });

    const nameInput = container.querySelector('input[placeholder="Tên hàng đề xuất"]') as HTMLInputElement;
    const specInput = container.querySelector('input[placeholder="Thông số / quy cách"]') as HTMLInputElement;
    const unitInput = container.querySelector('input[placeholder="ĐVT"]') as HTMLInputElement;
    const proposalQtyInput = nameInput.closest('tr')?.querySelectorAll('input')[3] as HTMLInputElement;

    await act(async () => {
      setInputValue(nameInput, 'Tủ điện phân phối DB-3F');
      setInputValue(specInput, 'Vỏ sơn tĩnh điện IP54, 400x600x200');
      setInputValue(unitInput, 'tủ');
      setInputValue(proposalQtyInput, '2');
    });

    // Go to review step
    await act(async () => {
      reviewBtn.click();
    });

    expect(container.textContent).toContain('Bước 2 - Double check trước khi gửi');
    expect(container.textContent).toContain('Phạm Quốc Bảo - Kỹ sư Dự án');
    expect(container.textContent).toContain('Tủ điện phân phối DB-3F');

    // Confirm submit
    const confirmBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Xác nhận gửi dự toán'),
    ) as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
    });

    expect(purchaseEstimatesService.submitPublic).toHaveBeenCalledWith('tok-nhon-trach-019', {
      preparerName: 'Phạm Quốc Bảo - Kỹ sư Dự án',
      lines: [
        { materialCode: 'VT-CAP-001', newQty: 120, estimateUnitPrice: 0 },
        { materialCode: 'VT-ONG-008', newQty: 45, estimateUnitPrice: 0 },
      ],
      proposals: [
        {
          name: 'Tủ điện phân phối DB-3F',
          spec: 'Vỏ sơn tĩnh điện IP54, 400x600x200',
          unit: 'tủ',
          qty: 2,
          note: null,
        },
      ],
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã gửi dự toán thành công.');
  });

  it('keeps PurchaseEstimateFillPage and estimateFill views free of raw <select>, legacy btn classes, and arbitrary px text', () => {
    const files = [
      'src/pages/public/PurchaseEstimateFillPage.tsx',
      'src/pages/public/estimateFill/PublicEstimateReadOnlyView.tsx',
      'src/pages/public/estimateFill/PublicEstimateReviewStep.tsx',
      'src/pages/public/estimateFill/PublicEstimateEditStep.tsx',
    ];
    for (const rel of files) {
      const src = fs.readFileSync(path.join(repoRoot, rel), 'utf-8');
      expect(src, `${rel} must not contain raw <select>`).not.toMatch(/<select\b/);
      expect(src, `${rel} must not contain legacy btn-primary/btn-outline/btn-ghost`).not.toMatch(/btn-(?:primary|outline|ghost)\b/);
      expect(src, `${rel} must not contain text-[length:...]`).not.toMatch(/text-\[length:/);
    }
  });
});
