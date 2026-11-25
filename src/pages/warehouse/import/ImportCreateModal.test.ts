import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportAttachment, Material } from '../../../types';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';
import ImportCreateModal from './ImportCreateModal';
import type { ImportCreateModalProps } from './ImportCreateModal.types';

vi.mock('../../../lib/wms/priceVisibility', () => ({
  useCanViewWmsPrices: () => true,
}));

vi.mock('../../../components/warehouse/PendingLocalEvidence', () => ({
  PendingPhotoGrid: () => null,
  PendingDocList: () => null,
  SavedImportPhotoGrid: () => createElement('div', { 'data-testid': 'saved-import-photos' }),
  SavedImportDocList: () => createElement('div', { 'data-testid': 'saved-import-docs' }),
}));

function setTextAreaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const sampleProjects: WarehouseProjectApiDto[] = [
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

const sampleSuppliers: SupplierApiDto[] = [
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

const sampleMaterials: Material[] = [
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
  },
];

const samplePoOptions: PurchaseOrderApiDto[] = [
  {
    code: 'PO-2026-088',
    planCode: 'KHMH-2026-012',
    projectCode: 'DA-CRM2',
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
  } as PurchaseOrderApiDto,
];

const samplePoLines: PoImportLinePreviewApiDto[] = [
  {
    poItemId: 101,
    name: 'Thép hình H300x300',
    materialCode: 'VT-THEP-H300',
    unit: 'Cây',
    ordered: 40,
    received: 10,
    reservedPending: 0,
    available: 30,
    unitPrice: 4_500_000,
    generalAvailableQty: 15,
  },
  {
    poItemId: 102,
    name: 'Bản mã thép SS400 dày 16mm',
    materialCode: 'VT-BM-16',
    unit: 'Tấm',
    ordered: 20,
    received: 20,
    reservedPending: 0,
    available: 0,
    unitPrice: 320_000,
    generalAvailableQty: 0,
  },
];

function findDialog(): HTMLElement {
  const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null;
  expect(dialog).not.toBeNull();
  return dialog!;
}

function findButton(rootEl: HTMLElement, text: string): HTMLButtonElement {
  const btn = [...rootEl.querySelectorAll('button')].find(b =>
    b.textContent?.replace(/\s+/g, ' ').trim().includes(text),
  ) as HTMLButtonElement | undefined;
  expect(btn, `Expected button containing "${text}"`).toBeDefined();
  return btn!;
}

describe('ImportCreateModal characterization', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderControlled(overrides: Partial<ImportCreateModalProps> = {}) {
    const onCreate = vi.fn();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const onApprove = vi.fn();
    const onItemsChangeSpy = vi.fn();

    const {
      items: initialItems,
      projectCode: initialProjectCode,
      note: initialNote,
      ...restOverrides
    } = overrides;

    function Harness() {
      const [items, setItems] = useState<MaterialQtyPriceLine[]>(
        initialItems ?? [{ materialCode: '', qty: '', unitPrice: '' }],
      );
      const [projectCode, setProjectCode] = useState(initialProjectCode ?? 'DA-CRM2');
      const [note, setNote] = useState(initialNote ?? '');

      return createElement(ImportCreateModal, {
        isOpen: true,
        onClose,
        isPending: false,
        projects: sampleProjects,
        suppliers: sampleSuppliers,
        materials: sampleMaterials,
        projectCode,
        onProjectCodeChange: setProjectCode,
        defaultSupplier: 'Công ty Cổ phần Thép Hòa Phát',
        onDefaultSupplierChange: vi.fn(),
        referenceCode: 'PO-2026-088',
        onReferenceCodeChange: vi.fn(),
        note,
        onNoteChange: setNote,
        items,
        onItemsChange: next => {
          onItemsChangeSpy(next);
          setItems(next);
        },
        formGrandTotal: items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0),
        frozenByProjectCode: new Map(),
        onCreate,
        onSave,
        onApprove,
        materialUnit: code => sampleMaterials.find(m => m.materialCode === code)?.unit ?? '—',
        poOptions: samplePoOptions,
        selectedPoCode: 'PO-2026-088',
        poPreviewLines: samplePoLines,
        ...restOverrides,
      });
    }

    return {
      element: createElement(Harness),
      onCreate,
      onSave,
      onClose,
      onApprove,
      onItemsChangeSpy,
    };
  }

  it('PO-line mode auto-selects available lines, supports toggle-all, and submits selected poItems', async () => {
    const { element, onCreate, onItemsChangeSpy } = renderControlled();
    await act(async () => {
      root.render(element);
    });

    const dialog = findDialog();
    expect(dialog.textContent).toContain('Đã chọn 1 dòng');
    expect(onItemsChangeSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        materialCode: 'VT-THEP-H300',
        qty: '30',
        notes: 'poItem:101',
      }),
    ]);

    const selectAllCheckbox = dialog.querySelector(
      'input[type="checkbox"][aria-label="Chọn tất cả mặt hàng"]',
    ) as HTMLInputElement;
    expect(selectAllCheckbox.checked).toBe(true);

    await act(async () => {
      selectAllCheckbox.click();
    });
    expect(selectAllCheckbox.checked).toBe(false);
    expect(onItemsChangeSpy).toHaveBeenLastCalledWith([]);

    await act(async () => {
      selectAllCheckbox.click();
    });
    expect(selectAllCheckbox.checked).toBe(true);

    const submitBtn = findButton(dialog, 'Chốt dự kiến');
    await act(async () => {
      submitBtn.click();
    });

    expect(onCreate).toHaveBeenCalledWith('pending', {
      files: [],
      evaluation: '',
      poItems: [{ poItemId: 101, qty: 30 }],
    });
  });

  it('manual edit mode renders manual items table, allows adding rows, and saves changes', async () => {
    const { element, onSave } = renderControlled({
      selectedPoCode: '',
      poOptions: [],
      poPreviewLines: [],
      editVoucher: { code: 'NK-2026-019', receiptEvaluation: 'Hàng đạt chuẩn ban đầu', status: 'draft' },
      items: [
        {
          materialCode: 'VT-THEP-H300',
          materialName: 'Thép hình H300x300',
          unit: 'Cây',
          qty: '12',
          unitPrice: '4500000',
        },
      ],
    });

    await act(async () => {
      root.render(element);
    });

    const dialog = findDialog();
    expect(dialog.textContent).toContain('Sửa phiếu - NK-2026-019');
    expect(dialog.textContent).toContain('Chi tiết vật tư');

    const evalInput = dialog.querySelector('textarea[placeholder="Mô tả tình trạng hàng khi nhận…"]') as HTMLTextAreaElement;
    expect(evalInput.value).toBe('Hàng đạt chuẩn ban đầu');

    const addBtn = findButton(dialog, 'Thêm vật tư');
    await act(async () => {
      addBtn.click();
    });
    expect(dialog.querySelectorAll('tbody tr').length).toBe(2);

    const saveBtn = findButton(dialog, 'Lưu thay đổi');
    await act(async () => {
      saveBtn.click();
    });
    expect(onSave).toHaveBeenCalledWith({ evaluation: 'Hàng đạt chuẩn ban đầu' });
  });

  it('edit mode seeds/resets evaluation on open/close and validates evidence before tryApproveFromEdit', async () => {
    const onApprove = vi.fn();
    const baseProps: ImportCreateModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      isPending: false,
      projects: sampleProjects,
      suppliers: sampleSuppliers,
      materials: sampleMaterials,
      projectCode: 'DA-CRM2',
      onProjectCodeChange: vi.fn(),
      defaultSupplier: 'Công ty Cổ phần Thép Hòa Phát',
      onDefaultSupplierChange: vi.fn(),
      referenceCode: 'PO-2026-088',
      onReferenceCodeChange: vi.fn(),
      note: '',
      onNoteChange: vi.fn(),
      items: [{ materialCode: 'VT-THEP-H300', qty: '10', unitPrice: '4500000', notes: 'poItem:101' }],
      onItemsChange: vi.fn(),
      formGrandTotal: 45_000_000,
      frozenByProjectCode: new Map(),
      onCreate: vi.fn(),
      onSave: vi.fn(),
      materialUnit: () => 'Cây',
      poOptions: samplePoOptions,
      selectedPoCode: 'PO-2026-088',
      poPreviewLines: samplePoLines,
      editVoucher: { code: 'NK-2026-020', receiptEvaluation: '', status: 'pending' },
      editAttachments: [],
      canApprove: true,
      onApprove,
    };

    await act(async () => {
      root.render(createElement(ImportCreateModal, baseProps));
    });

    let dialog = findDialog();
    const approveBtn = findButton(dialog, 'Lưu SL thực nhận & Duyệt');
    await act(async () => {
      approveBtn.click();
    });

    expect(onApprove).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain('Vui lòng nhập đánh giá nhận hàng');
    expect(dialog.textContent).toContain('Vui lòng chọn ít nhất 1 ảnh nhận hàng');
    expect(dialog.textContent).toContain('Vui lòng chọn ít nhất 1 file chứng từ');

    // Close and re-open with seeded evaluation & required attachments
    await act(async () => {
      root.render(createElement(ImportCreateModal, { ...baseProps, isOpen: false }));
    });
    const fullAttachments: ImportAttachment[] = [
      { id: 'p1', kind: 'photo', fileName: 'anh-nhan.jpg', storageKey: 'k1', uploadedAt: '2026-11-25T08:00:00Z' },
      { id: 'd1', kind: 'document', fileName: 'bb-giao.pdf', storageKey: 'k2', uploadedAt: '2026-11-25T08:00:00Z' },
    ];
    await act(async () => {
      root.render(
        createElement(ImportCreateModal, {
          ...baseProps,
          isOpen: true,
          editVoucher: { code: 'NK-2026-021', receiptEvaluation: 'Đủ số lượng, nguyên vẹn', status: 'pending' },
          editAttachments: fullAttachments,
        }),
      );
    });

    dialog = findDialog();
    const evalInput = dialog.querySelector('textarea[placeholder="Mô tả tình trạng hàng khi nhận…"]') as HTMLTextAreaElement;
    expect(evalInput.value).toBe('Đủ số lượng, nguyên vẹn');

    await act(async () => {
      setTextAreaValue(evalInput, 'Đã kiểm đếm đủ 30 cây thép H300');
    });
    await act(async () => {
      findButton(dialog, 'Lưu SL thực nhận & Duyệt').click();
    });

    expect(onApprove).toHaveBeenCalledWith({ evaluation: 'Đã kiểm đếm đủ 30 cây thép H300' });
  });
});
