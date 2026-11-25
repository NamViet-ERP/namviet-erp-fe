import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import { suppliersService } from '../../services/suppliersService';
import { materialsService } from '../../services/materialsService';
import { serviceExpenseItemsService } from '../../services/serviceExpenseItemsService';
import { purchasePlansService } from '../../services/purchasePlansService';
import { showToast } from '../ui/Toast';
import type { PurchasePlanDetailApiDto, PurchasePlanImportPreviewApiDto } from '../../types/api/purchasingApi';
import CreatePurchasePlanModal from './CreatePurchasePlanModal';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/suppliersService', async () => {
  const actual = await vi.importActual<typeof import('../../services/suppliersService')>('../../services/suppliersService');
  return {
    ...actual,
    suppliersService: {
      ...actual.suppliersService,
      list: vi.fn(),
    },
  };
});

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/serviceExpenseItemsService', () => ({
  serviceExpenseItemsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/purchasePlansService', () => ({
  purchasePlansService: {
    getByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    importPreview: vi.fn(),
    downloadImportTemplate: vi.fn(),
    lookupSupplierMaterialRisks: vi.fn(),
  },
}));

vi.mock('../ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleProjects = [
  {
    projectCode: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    projectType: 'EPC',
    pmId: 'pm-1',
    pmName: 'Nguyễn Hữu Phước',
    startDate: '2026-01-10T00:00:00Z',
    endDate: null,
    materialBudget: 2_000_000_000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    scMembers: null,
    stockActualQty: 0,
    stockPlannedQty: 0,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 0,
    materialBudgetRemaining: 2_000_000_000,
    warehouseKeepers: [],
    stage: null,
  },
];

const sampleSuppliers = [
  {
    id: 1,
    supplierCode: 'NCC-HOA-PHAT',
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    taxCode: '0900189284',
    contactPhone: '02436282011',
    maxDebtDays: 30,
    rating: 'A',
    approvalStatus: 'Approved',
    isBlacklisted: false,
    purchasedRevenue: 1_200_000_000,
    industryGroups: ['Thép kết cấu'],
  },
];

const sampleMaterials = [
  {
    materialCode: 'VT-THEP-H300',
    materialName: 'Thép hình H300x300',
    categoryId: 1,
    categoryName: 'Thép kết cấu',
    categoryPath: { danhMuc: 'Vật tư chính', nhomVatTu: 'Thép hình' },
    unit: 'Cây',
    isConsumable: false,
    isActive: true,
    origin: 'Việt Nam',
    ceilingPrice: 4_500_000,
  },
];

const sampleServices = [
  {
    id: 10,
    code: 'DV-VC-01',
    name: 'Vận chuyển thiết bị siêu trường',
    type: 'service' as const,
    unit: 'Chuyến',
    referencePrice: 25_000_000,
    isActive: true,
  },
];

const existingPlanDetail: PurchasePlanDetailApiDto = {
  code: 'KHMH-2026-015',
  projectCode: 'DA-CRM2',
  projectName: 'Cầu Rạch Miễu 2',
  kind: 'plan',
  status: 'draft',
  note: 'Đợt 1 sắt thép kết cấu',
  budgetTotal: 90_000_000,
  proposalTotal: 88_000_000,
  purchaseTotal: 0,
  paidTotal: 0,
  createdAt: '2026-11-10T08:00:00Z',
  updatedAt: '2026-11-10T08:00:00Z',
  lines: [
    {
      id: 501,
      lineNo: 1,
      lineType: 'material',
      materialCode: 'VT-THEP-H300',
      productName: 'Thép hình H300x300',
      unit: 'Cây',
      quantity: 20,
      orderedQty: 0,
      receivedQty: 0,
      defectQty: 0,
      remainingOrderableQty: 20,
      budgetUnitPrice: 4_500_000,
      requiredDate: '2026-12-01T00:00:00Z',
      quotes: [],
    },
  ],
};

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('CreatePurchasePlanModal characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
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

    vi.mocked(projectsService.list).mockResolvedValue({
      items: sampleProjects as never,
      totalCount: sampleProjects.length,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(suppliersService.list).mockResolvedValue({
      items: sampleSuppliers as never,
      totalCount: sampleSuppliers.length,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });
    vi.mocked(materialsService.list).mockResolvedValue({
      items: sampleMaterials as never,
      totalCount: sampleMaterials.length,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });
    vi.mocked(serviceExpenseItemsService.list).mockResolvedValue({
      items: sampleServices as never,
      total: sampleServices.length,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(existingPlanDetail);
    vi.mocked(purchasePlansService.create).mockResolvedValue({
      ...existingPlanDetail,
      code: 'KHMH-2026-101',
    });
    vi.mocked(purchasePlansService.update).mockResolvedValue(existingPlanDetail);
    vi.mocked(purchasePlansService.lookupSupplierMaterialRisks).mockResolvedValue([]);

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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function flushQueries() {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  async function renderModal(props: Partial<Parameters<typeof CreatePurchasePlanModal>[0]> = {}) {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(CreatePurchasePlanModal, {
            open: true,
            onClose: vi.fn(),
            ...props,
          }),
        ),
      );
    });
    await flushQueries();
  }

  it('selects project, picks a catalog item, adds/expands/removes lines, and creates plan', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    await renderModal({ onCreated, onClose });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo kế hoạch mua hàng');

    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    expect(projectSelect).not.toBeNull();
    await act(async () => {
      setSelectValue(projectSelect, 'DA-CRM2');
    });

    const noteInput = dialog.querySelector('input[aria-label="Ghi chú KHMH"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(noteInput, 'KHMH vật tư nhịp chính');
    });

    // Add a second line, then remove it
    const addLineBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Thêm dòng',
    ) as HTMLButtonElement;
    expect(addLineBtn).toBeTruthy();
    await act(async () => {
      addLineBtn.click();
    });
    expect(dialog.querySelectorAll('table.pur-create-plan__table tbody tr')).toHaveLength(2);

    const removeLine2Btn = dialog.querySelector('button[aria-label="Xóa dòng 2"]') as HTMLButtonElement;
    expect(removeLine2Btn).not.toBeNull();
    await act(async () => {
      removeLine2Btn.click();
    });
    expect(dialog.querySelectorAll('table.pur-create-plan__table tbody tr')).toHaveLength(1);

    // Pick material VT-THEP-H300 via PurchaseItemAutocomplete
    const itemInput = dialog.querySelector('table.pur-create-plan__table input[role="combobox"]') as HTMLInputElement;
    expect(itemInput).not.toBeNull();
    await act(async () => {
      itemInput.focus();
      setInputValue(itemInput, 'VT-THEP-H300');
    });
    const optionEl = [...document.body.querySelectorAll('[role="option"]')].find(
      el => el.textContent?.includes('VT-THEP-H300'),
    ) as HTMLElement;
    expect(optionEl).toBeTruthy();
    await act(async () => {
      optionEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    expect(dialog.textContent).toContain('VT-THEP-H300');

    // Expand detail row and inspect date controls
    const expandBtn = dialog.querySelector('button[aria-label="Mở chi tiết"]') as HTMLButtonElement;
    expect(expandBtn).not.toBeNull();
    await act(async () => {
      expandBtn.click();
    });
    const detailRow = dialog.querySelector('.pur-create-plan__detail-row');
    expect(detailRow).not.toBeNull();
    expect(detailRow?.textContent).toContain('Ngày cần hàng');
    expect(detailRow?.textContent).toContain('Ngày giao dự kiến');
    expect(detailRow?.textContent).toContain('Ngày nhận thực tế');

    // Submit create
    const submitBtn = [...dialog.querySelectorAll('.md-dialog__footer button')].find(
      b => b.textContent?.includes('Tạo KHMH'),
    ) as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();

    expect(purchasePlansService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectCode: 'DA-CRM2',
        note: 'KHMH vật tư nhịp chính',
        kind: 'plan',
        lines: expect.arrayContaining([
          expect.objectContaining({
            materialCode: 'VT-THEP-H300',
            unit: 'Cây',
            quantity: 1,
          }),
        ]),
      }),
    );
    expect(onCreated).toHaveBeenCalledWith('KHMH-2026-101');
  });

  it('hydrates existing plan in edit mode and submits update', async () => {
    const onSaved = vi.fn();
    await renderModal({ editCode: 'KHMH-2026-015', onSaved });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Sửa KHMH KHMH-2026-015');

    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    expect(projectSelect.value).toBe('DA-CRM2');
    expect(projectSelect.disabled).toBe(true);

    const noteInput = dialog.querySelector('input[aria-label="Ghi chú KHMH"]') as HTMLInputElement;
    expect(noteInput.value).toBe('Đợt 1 sắt thép kết cấu');
    expect(dialog.textContent).toContain('VT-THEP-H300');

    await act(async () => {
      setInputValue(noteInput, 'Đợt 1 sắt thép kết cấu (đã điều chỉnh)');
    });

    const saveBtn = [...dialog.querySelectorAll('.md-dialog__footer button')].find(
      b => b.textContent?.includes('Lưu thay đổi'),
    ) as HTMLButtonElement;
    await act(async () => {
      saveBtn.click();
    });
    await flushQueries();

    expect(purchasePlansService.update).toHaveBeenCalledWith(
      'KHMH-2026-015',
      expect.objectContaining({
        note: 'Đợt 1 sắt thép kết cấu (đã điều chỉnh)',
      }),
    );
    expect(onSaved).toHaveBeenCalledWith('KHMH-2026-015');
  });

  it('renders missing-material warning banner and blocks save when imported code is unknown', async () => {
    const previewWithUnknownCode: PurchasePlanImportPreviewApiDto = {
      projectCode: 'DA-CRM2',
      sheetName: 'KHMH_T11',
      totalRows: 1,
      validRowCount: 1,
      errorRowCount: 0,
      mappedColumns: [],
      errors: [],
      lines: [
        {
          rowNumber: 2,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-CHUA-KHAI-BAO',
          productName: 'Thép tấm chưa khai báo',
          unit: 'Tấm',
          quantity: 5,
          budgetUnitPrice: 12_000_000,
          quotes: [],
        },
      ],
    };
    vi.mocked(purchasePlansService.importPreview).mockResolvedValue(previewWithUnknownCode);

    await renderModal({});

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    await act(async () => {
      setSelectValue(projectSelect, 'DA-CRM2');
    });

    const fileInput = dialog.querySelector('input[aria-label="File Excel KHMH"]') as HTMLInputElement;
    const excelFile = new File(['excel-bytes'], 'khmh_crm2.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(fileInput, 'files', { value: [excelFile], configurable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const importBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Import',
    ) as HTMLButtonElement;
    await act(async () => {
      importBtn.click();
    });
    await flushQueries();

    expect(dialog.textContent).toContain('Phát hiện 1 dòng vật tư chưa có trong danh mục hệ thống:');
    expect(dialog.textContent).toContain('VT-CHUA-KHAI-BAO');
    expect(dialog.textContent).toContain('Thép tấm chưa khai báo');

    const submitBtn = [...dialog.querySelectorAll('.md-dialog__footer button')].find(
      b => b.textContent?.includes('Tạo KHMH'),
    ) as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(purchasePlansService.create).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('VT-CHUA-KHAI-BAO'),
    );
  });
});
