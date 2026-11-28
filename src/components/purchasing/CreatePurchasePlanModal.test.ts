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
import { formatCurrencyFull } from '../../utils/formatCurrency';
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

  it('does not fetch modal catalog or project lists when open is false', async () => {
    await renderModal({ open: false });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(projectsService.list).not.toHaveBeenCalled();
    expect(suppliersService.list).not.toHaveBeenCalled();
    expect(materialsService.list).not.toHaveBeenCalled();
    expect(serviceExpenseItemsService.list).not.toHaveBeenCalled();
  });

  it('ignores null materialCode or service code entries when open is true', async () => {
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [{ ...sampleMaterials[0], materialCode: null }, sampleMaterials[0]] as never,
      totalCount: 2,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });
    vi.mocked(serviceExpenseItemsService.list).mockResolvedValue({
      items: [{ ...sampleServices[0], code: null }, sampleServices[0]] as never,
      total: 2,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });

    await renderModal({ open: true });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo kế hoạch mua hàng');
  });

  it('preserves exact Excel amounts and displayed VND totals on import and create without auto-recalculation', async () => {
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [
        {
          ...sampleMaterials[0],
          materialCode: 'VT-INOX-304',
          materialName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
        },
        {
          ...sampleMaterials[0],
          materialCode: 'VT-THEP-TAM',
          materialName: 'Thép tấm A515 dày 20mm',
          unit: 'Tấm',
        },
      ] as never,
      totalCount: 2,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });

    const previewWithExactAmounts: PurchasePlanImportPreviewApiDto = {
      projectCode: 'DA-CRM2',
      sheetName: 'KHMH_INOX',
      totalRows: 2,
      validRowCount: 2,
      errorRowCount: 0,
      mappedColumns: [],
      errors: [],
      lines: [
        {
          rowNumber: 2,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          budgetUnitPrice: 928_000,
          budgetAmount: 180_032_000,
          proposalKgPerUnit: 194,
          proposalUnitPrice: 13_916_000,
          proposalAmount: 222_656_000,
          purchaseKgPerUnit: 194,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          selectedUnitPrice: 13_916_000,
          selectedAmount: 222_656_000,
          quotes: [],
        },
        {
          rowNumber: 3,
          lineNo: 2,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-THEP-TAM',
          productName: 'Thép tấm A515 dày 20mm',
          unit: 'Tấm',
          quantity: 1,
          kgPerUnit: 2434,
          budgetUnitPrice: 26_000,
          budgetAmount: 63_284_000,
          proposalKgPerUnit: 2434,
          proposalUnitPrice: 26_681.56,
          proposalAmount: 64_942_909,
          purchaseKgPerUnit: 2434,
          purchaseUnitPrice: 64_046_455,
          purchaseAmount: 64_046_455,
          selectedUnitPrice: 26_681.56,
          selectedAmount: 64_942_909,
          quotes: [],
        },
      ],
    };
    vi.mocked(purchasePlansService.importPreview).mockResolvedValue(previewWithExactAmounts);

    await renderModal({});

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    await act(async () => {
      setSelectValue(projectSelect, 'DA-CRM2');
    });

    const fileInput = dialog.querySelector('input[aria-label="File Excel KHMH"]') as HTMLInputElement;
    const excelFile = new File(['excel-bytes'], 'khmh_inox.xlsx', {
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

    const tfoot = dialog.querySelector('table.pur-create-plan__table tfoot') as HTMLElement;
    const subtotals = dialog.querySelector('.pur-create-plan__subtotals') as HTMLElement;
    expect(tfoot.textContent).toContain(formatCurrencyFull(243_316_000));
    expect(subtotals.textContent).toContain(`Đề xuất: ${formatCurrencyFull(287_598_909)}`);
    expect(subtotals.textContent).toContain(`Mua hàng: ${formatCurrencyFull(287_598_909)}`);

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
        lines: [
          expect.objectContaining({
            materialCode: 'VT-INOX-304',
            quantity: 16,
            kgPerUnit: 194,
            budgetAmount: 180_032_000,
            proposalAmount: 222_656_000,
            purchaseAmount: 219_600_000,
            selectedAmount: 222_656_000,
          }),
          expect.objectContaining({
            materialCode: 'VT-THEP-TAM',
            quantity: 1,
            kgPerUnit: 2434,
            budgetAmount: 63_284_000,
            proposalAmount: 64_942_909,
            purchaseAmount: 64_046_455,
            selectedAmount: 64_942_909,
          }),
        ],
      }),
    );
  });

  it('unlocks only budgetAmount when quantity changes on an imported line while keeping proposal/purchase/selected locked', async () => {
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [
        {
          ...sampleMaterials[0],
          materialCode: 'VT-INOX-304',
          materialName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
        },
      ] as never,
      totalCount: 1,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });

    vi.mocked(purchasePlansService.importPreview).mockResolvedValue({
      projectCode: 'DA-CRM2',
      sheetName: 'KHMH_INOX',
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
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          budgetUnitPrice: 58_000,
          budgetAmount: 180_032_000,
          proposalUnitPrice: 13_916_000,
          proposalAmount: 222_656_000,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          selectedUnitPrice: 13_916_000,
          selectedAmount: 222_656_000,
          quotes: [],
        },
      ],
    });

    await renderModal({});

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    await act(async () => {
      setSelectValue(projectSelect, 'DA-CRM2');
    });

    const fileInput = dialog.querySelector('input[aria-label="File Excel KHMH"]') as HTMLInputElement;
    const excelFile = new File(['excel-bytes'], 'khmh_inox.xlsx', {
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

    // Change quantity from 16 -> 20
    const qtyInput = dialog.querySelector('input[aria-label="Số lượng dòng 1"]') as HTMLInputElement;
    expect(qtyInput).not.toBeNull();
    await act(async () => {
      setInputValue(qtyInput, '20');
    });

    const submitBtn = [...dialog.querySelectorAll('.md-dialog__footer button')].find(
      b => b.textContent?.includes('Tạo KHMH'),
    ) as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();

    expect(purchasePlansService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            materialCode: 'VT-INOX-304',
            quantity: 20,
            // Budget recalculated for new qty: 20 * 194 * 58_000 = 225_040_000
            budgetAmount: 225_040_000,
            // Proposal, purchase, selected remain locked to Excel verbatim amounts
            proposalAmount: 222_656_000,
            purchaseAmount: 219_600_000,
            selectedAmount: 222_656_000,
          }),
        ],
      }),
    );
  });

  it('switches between Dùng giá Excel and Dùng giá Web tính, updating displayed totals and submitted payload with stage-isolated KG/ĐVT', async () => {
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [
        {
          ...sampleMaterials[0],
          materialCode: 'VT-INOX-304',
          materialName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
        },
        {
          ...sampleMaterials[0],
          materialCode: 'VT-VAN-BI',
          materialName: 'Van bi mặt bích DN100',
          unit: 'Cái',
        },
      ] as never,
      totalCount: 2,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });

    vi.mocked(purchasePlansService.importPreview).mockResolvedValue({
      projectCode: 'DA-CRM2',
      sheetName: 'KHMH_RECONCILE',
      totalRows: 2,
      validRowCount: 2,
      errorRowCount: 0,
      mappedColumns: [],
      errors: [],
      lines: [
        {
          rowNumber: 4,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          budgetUnitPrice: 58_000,
          budgetAmount: 180_032_000,
          proposalKgPerUnit: null,
          proposalUnitPrice: 58_000,
          proposalAmount: 180_032_000, // Excel multiplied by 194, Web computes 16 * 58.000 = 928.000
          purchaseKgPerUnit: null,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          selectedUnitPrice: 13_725_000,
          selectedAmount: 219_600_000,
          quotes: [],
        },
        {
          rowNumber: 5,
          lineNo: 2,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-VAN-BI',
          productName: 'Van bi mặt bích DN100',
          unit: 'Cái',
          quantity: 10,
          budgetUnitPrice: 500_000,
          budgetAmount: 4_500_000, // Excel discounted 4.5M vs Web 10 * 500k = 5M
          quotes: [],
        },
      ],
    });

    await renderModal({});

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const projectSelect = dialog.querySelector('select[aria-label="Dự án"]') as HTMLSelectElement;
    await act(async () => {
      setSelectValue(projectSelect, 'DA-CRM2');
    });

    const fileInput = dialog.querySelector('input[aria-label="File Excel KHMH"]') as HTMLInputElement;
    const excelFile = new File(['excel-bytes'], 'khmh_reconcile.xlsx', {
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

    // Reconciliation summary is visible with mismatch info
    const reconcilePanel = dialog.querySelector('.pur-create-plan__reconcile') as HTMLElement;
    expect(reconcilePanel).not.toBeNull();
    expect(reconcilePanel.textContent).toContain('Lệch 2 dòng (2 mục)');

    // Default mode is Dùng giá Excel
    const tfoot = dialog.querySelector('table.pur-create-plan__table tfoot') as HTMLElement;
    const subtotals = dialog.querySelector('.pur-create-plan__subtotals') as HTMLElement;
    expect(tfoot.textContent).toContain(formatCurrencyFull(184_532_000));
    expect(subtotals.textContent).toContain(`Đề xuất: ${formatCurrencyFull(180_032_000)}`);

    // Switch to Dùng giá Web tính
    const webModeBtn = [...reconcilePanel.querySelectorAll('button[role="radio"]')].find(
      b => b.textContent?.trim() === 'Dùng giá Web tính',
    ) as HTMLButtonElement;
    expect(webModeBtn).toBeTruthy();
    await act(async () => {
      webModeBtn.click();
    });

    expect(webModeBtn.getAttribute('aria-checked')).toBe('true');
    expect(tfoot.textContent).toContain(formatCurrencyFull(185_032_000));
    expect(subtotals.textContent).toContain(`Đề xuất: ${formatCurrencyFull(928_000)}`);

    // Also verify KG/ĐVT đề xuất & KG/ĐVT mua hàng inputs exist inside expanded detail row
    const expandBtn = dialog.querySelector('button[aria-label="Mở chi tiết"]') as HTMLButtonElement;
    await act(async () => {
      expandBtn.click();
    });
    expect(dialog.querySelector('input[aria-label="KG/ĐVT đề xuất"]')).not.toBeNull();
    expect(dialog.querySelector('input[aria-label="KG/ĐVT mua hàng"]')).not.toBeNull();

    // Submit while in Web mode -> payload carries Web-calculated amounts
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
        lines: [
          expect.objectContaining({
            materialCode: 'VT-INOX-304',
            budgetAmount: 180_032_000,
            proposalAmount: 928_000,
            purchaseAmount: 219_600_000,
            selectedAmount: 219_600_000,
          }),
          expect.objectContaining({
            materialCode: 'VT-VAN-BI',
            budgetAmount: 5_000_000,
          }),
        ],
      }),
    );
  });
});
