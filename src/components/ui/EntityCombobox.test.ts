import { act, createElement, Fragment } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';
import EntityCombobox from './EntityCombobox';
import MaterialAutocomplete from './MaterialAutocomplete';
import SupplierAutocomplete from './SupplierAutocomplete';
import Dropdown from './Dropdown';
import ProjectAutocomplete from '../purchasing/ProjectAutocomplete';
import PlanAutocomplete from '../purchasing/PlanAutocomplete';
import PoAutocomplete from '../purchasing/PoAutocomplete';
import PurchaseItemAutocomplete from '../purchasing/PurchaseItemAutocomplete';
import PurDateRangePicker from '../purchasing/PurDateRangePicker';
import type { MaterialApiDto, SupplierApiDto, WarehouseProjectApiDto } from '../../types/wms';
import type { PurchaseOrderApiDto, PurchasePlanApiDto } from '../../types/api/purchasingApi';
import type { ServiceExpenseItemApiDto } from '../../types/api/serviceExpenseItem';

interface CatalogMaterialFixture {
  code: string;
  name: string;
  unit: string;
}

const SAMPLE_MATERIALS: MaterialApiDto[] = [
  {
    materialCode: 'VT-THEP-001',
    materialName: 'Thép hình H300x300x10x15mm',
    categoryId: 1,
    categoryName: 'Thép kết cấu',
    categoryPath: {
      danhMuc: 'Vật tư chính',
      nhomVatTu: 'Thép',
      loaiVatTu: 'Thép hình',
      phanLoai: null,
      kieu: null,
    },
    unit: 'Cây',
    ceilingPrice: 12500000,
    isConsumable: false,
    isActive: true,
  },
  {
    materialCode: 'VT-XM-PCB40',
    materialName: 'Xi măng Hà Tiên PCB40 bao 50kg',
    categoryId: 2,
    categoryName: 'Xi măng',
    categoryPath: {
      danhMuc: 'Vật tư chính',
      nhomVatTu: 'Vật liệu rời',
      loaiVatTu: 'Xi măng',
      phanLoai: null,
      kieu: null,
    },
    unit: 'Bao',
    ceilingPrice: 92000,
    isConsumable: false,
    isActive: true,
  },
  {
    materialCode: 'VT-CAT-VG',
    materialName: 'Cát vàng bê tông sông Tiền',
    categoryId: 3,
    categoryName: 'Cát đá',
    categoryPath: {
      danhMuc: 'Vật tư chính',
      nhomVatTu: 'Vật liệu rời',
      loaiVatTu: 'Cát',
      phanLoai: null,
      kieu: null,
    },
    unit: 'm3',
    ceilingPrice: 365000,
    isConsumable: false,
    isActive: true,
  },
];

const SAMPLE_SUPPLIERS: SupplierApiDto[] = [
  {
    id: 1,
    supplierCode: 'NCC-MINHLONG',
    supplierName: 'Công ty TNHH VLXD Minh Long',
    contactPhone: '0908123456',
    maxDebtDays: 30,
    rating: 'A',
    approvalStatus: 'Approved',
    isBlacklisted: false,
    purchasedRevenue: 850000000,
    industryGroups: ['Vật liệu xây dựng'],
  },
  {
    id: 2,
    supplierCode: 'NCC-HOAPHAT',
    supplierName: 'Công ty CP Thép Hòa Phát Miền Nam',
    contactPhone: '0909456789',
    maxDebtDays: 45,
    rating: 'A',
    approvalStatus: 'Approved',
    isBlacklisted: false,
    purchasedRevenue: 1450000000,
    industryGroups: ['Thép kết cấu'],
  },
];

const SAMPLE_PROJECTS: WarehouseProjectApiDto[] = [
  {
    projectCode: 'DA-CRM2-2026',
    projectName: 'Dự án Cầu Rạch Miễu 2',
    projectType: 'EPC',
    pmId: '11111111-1111-1111-1111-111111111111',
    pmName: 'Nguyễn Minh Tuấn',
    startDate: '2026-01-15',
    materialBudget: 4500000000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    stockActualQty: 1200,
    stockPlannedQty: 1400,
    stockReservedQty: 150,
    stockMaterialCount: 18,
    approvedImportValue: 980000000,
    materialBudgetRemaining: 3520000000,
  },
];

const SAMPLE_ORDERS: PurchaseOrderApiDto[] = [
  {
    code: 'PO-2026-089',
    planCode: 'KHMH-2026-014',
    projectCode: 'DA-CRM2-2026',
    projectName: 'Dự án Cầu Rạch Miễu 2',
    supplierId: 1,
    supplierName: 'Công ty TNHH VLXD Minh Long',
    orderDate: '2026-10-12',
    createdAt: '2026-10-12T08:00:00Z',
    totalAmount: 245000000,
    approvalStatus: 'Approved',
    orderPlacementStatus: 'Ordered',
    deliveryStatus: 'Pending',
    paymentStatus: 'Unpaid',
    paymentWarning: false,
    supplierPaymentTermsDays: 30,
  },
];

const SAMPLE_PLANS: PurchasePlanApiDto[] = [
  {
    code: 'KHMH-2026-014',
    projectCode: 'DA-CRM2-2026',
    projectName: 'Dự án Cầu Rạch Miễu 2',
    createdAt: '2026-10-01T08:00:00Z',
    budgetTotal: 320000000,
    proposalTotal: 310000000,
    purchaseTotal: 295000000,
    paidTotal: 0,
    status: 'Approved',
    kind: 'plan',
    note: 'Đợt 2 thép hình và xi măng',
  },
];

const SAMPLE_SERVICES: ServiceExpenseItemApiDto[] = [
  {
    id: 10,
    code: 'DV-CAUHANG-01',
    name: 'Dịch vụ cẩu lắp đặt dầm thép',
    type: 'service',
    unit: 'Ca',
    referencePrice: 6500000,
    description: 'Cẩu 50 tấn phục vụ lắp dầm',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 11,
    code: 'CP-VANCHUYEN-02',
    name: 'Chi phí vận chuyển đường thủy',
    type: 'expense',
    unit: 'Chuyến',
    referencePrice: 12000000,
    description: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  },
];

function setInputValue(input: HTMLInputElement, nextValue: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, nextValue);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('EntityCombobox, wrappers, and dialogStack overlays', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
      [{} as DOMRect] as unknown as DOMRectList,
    );
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
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function dispatchKey(target: EventTarget, key: string, shiftKey = false) {
    const event = new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    await act(() => target.dispatchEvent(event));
    return event;
  }

  describe('EntityCombobox core interactions', () => {
    const items: CatalogMaterialFixture[] = [
      { code: 'VT-THEP-001', name: 'Thép hình H300', unit: 'Cây' },
      { code: 'VT-XM-PCB40', name: 'Xi măng Hà Tiên PCB40', unit: 'Bao' },
      { code: 'VT-CAT-VG', name: 'Cát vàng bê tông', unit: 'm3' },
    ];

    it('filters options by query and selects highlighted option via ArrowDown/ArrowUp + Enter', async () => {
      const onChange = vi.fn();
      const onSelectItem = vi.fn();
      await act(() =>
        root.render(
          createElement(EntityCombobox<CatalogMaterialFixture>, {
            items,
            getKey: m => m.code,
            getLabel: m => `${m.code} — ${m.name}`,
            value: '',
            onChange,
            onSelectItem,
            placeholder: 'Chọn vật tư kho…',
          }),
        ),
      );

      const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      await act(() => input.focus());

      let options = document.querySelectorAll('[role="option"]');
      expect(options).toHaveLength(3);

      await act(() => setInputValue(input, 'H300'));
      options = document.querySelectorAll('[role="option"]');
      expect(options).toHaveLength(1);
      expect(options[0].textContent).toContain('Thép hình H300');

      await act(() => setInputValue(input, ''));
      await dispatchKey(input, 'ArrowDown');
      await dispatchKey(input, 'ArrowDown');
      await dispatchKey(input, 'ArrowUp');
      await dispatchKey(input, 'Enter');

      expect(onChange).toHaveBeenCalledWith('VT-XM-PCB40');
      expect(onSelectItem).toHaveBeenCalledWith(items[1]);
      expect(document.querySelector('[role="listbox"]')).toBeNull();
    });

    it('commits free-text values when allowFreeText is enabled without overwriting selected items', async () => {
      const onChange = vi.fn();
      await act(() =>
        root.render(
          createElement(SupplierAutocomplete, {
            value: '',
            suppliers: SAMPLE_SUPPLIERS,
            onChange,
          }),
        ),
      );

      const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      await act(() => input.focus());
      await act(() => setInputValue(input, 'Công ty TNHH Vận tải Sông Tiền'));
      await dispatchKey(input, 'Enter');

      expect(onChange).toHaveBeenLastCalledWith('Công ty TNHH Vận tải Sông Tiền');
      expect(input.getAttribute('aria-expanded')).toBe('false');

      // Selecting an existing supplier on mousedown should preserve the chosen supplier name on blur
      await act(() => input.focus());
      await act(() => setInputValue(input, 'Minh Long'));
      const option = document.querySelector<HTMLElement>('[role="option"]')!;
      await act(() =>
        option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })),
      );
      expect(onChange).toHaveBeenLastCalledWith('Công ty TNHH VLXD Minh Long');
    });

    it('dismisses ONLY the combobox on Escape inside a Modal, then closes Modal on second Escape', async () => {
      const onModalClose = vi.fn();
      await act(() =>
        root.render(
          createElement(Modal, {
            isOpen: true,
            title: 'Phiếu nhập kho Dự án Cầu Rạch Miễu 2',
            onClose: onModalClose,
            children: createElement(MaterialAutocomplete, {
              value: '',
              materials: SAMPLE_MATERIALS,
              onChange: vi.fn(),
            }),
          }),
        ),
      );

      const input = document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      await act(() => input.focus());
      expect(document.querySelector('[role="listbox"]')).not.toBeNull();

      // Escape on input dismisses only combobox
      await dispatchKey(input, 'Escape');
      expect(onModalClose).not.toHaveBeenCalled();
      expect(document.querySelector('[role="listbox"]')).toBeNull();

      // Escape via document (when focus moved away from input while open) also dismisses only combobox
      const chevron = document.querySelector<HTMLButtonElement>('.search-autocomplete__chevron')!;
      await act(() => chevron.click());
      expect(document.querySelector('[role="listbox"]')).not.toBeNull();
      (document.activeElement as HTMLElement | null)?.blur();
      await dispatchKey(document, 'Escape');
      expect(onModalClose).not.toHaveBeenCalled();
      expect(document.querySelector('[role="listbox"]')).toBeNull();

      // Second Escape closes enclosing Modal
      await dispatchKey(document, 'Escape');
      expect(onModalClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refactored autocomplete wrappers', () => {
    it('MaterialAutocomplete renders error badge and alert message with semantic classes', async () => {
      await act(() =>
        root.render(
          createElement(MaterialAutocomplete, {
            value: 'VT-KHONG-TON-TAI',
            materials: SAMPLE_MATERIALS,
            onChange: vi.fn(),
            hasError: true,
            errorMessage: 'Mã vật tư chưa có trong danh mục',
          }),
        ),
      );
      const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(container.querySelector('.search-autocomplete__error-badge')).not.toBeNull();
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Mã vật tư chưa có trong danh mục');
    });

    it('PoAutocomplete supports allowClear option to clear PO selection', async () => {
      const onChange = vi.fn();
      await act(() =>
        root.render(
          createElement(PoAutocomplete, {
            value: 'PO-2026-089',
            orders: SAMPLE_ORDERS,
            allowClear: true,
            onChange,
          }),
        ),
      );

      const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      expect(input.value).toContain('PO-2026-089');
      await act(() => input.focus());

      const clearOption = document.querySelector<HTMLElement>('.search-autocomplete__clear-option')!;
      expect(clearOption.textContent).toContain('Không gắn PO (Bỏ chọn)');
      await act(() =>
        clearOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })),
      );
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('ProjectAutocomplete and PlanAutocomplete preserve option layouts and empty states', async () => {
      const onPlanChange = vi.fn();
      await act(() =>
        root.render(
          createElement(Fragment, null,
            createElement(ProjectAutocomplete, {
              value: '',
              projects: SAMPLE_PROJECTS,
              compact: true,
              onChange: vi.fn(),
            }),
            createElement(PlanAutocomplete, {
              value: '',
              plans: [],
              onChange: vi.fn(),
            }),
            createElement(PlanAutocomplete, {
              value: '',
              plans: SAMPLE_PLANS,
              onChange: onPlanChange,
            }),
          ),
        ),
      );

      const inputs = container.querySelectorAll<HTMLInputElement>('input[role="combobox"]');
      await act(() => inputs[0].focus());
      expect(document.querySelector('[role="option"]')?.textContent).toContain('[DA-CRM2-2026]');
      expect(document.querySelector('[role="option"]')?.textContent).toContain('Ban QLDA Mỹ Thuận');
      await dispatchKey(inputs[0], 'Escape');

      await act(() => inputs[1].focus());
      expect(document.querySelector('.search-autocomplete__empty')?.textContent).toBe(
        'Không còn kế hoạch nào còn SL đặt được.',
      );
      await dispatchKey(inputs[1], 'Escape');

      await act(() => inputs[2].focus());
      expect(document.querySelector('[role="option"]')?.textContent).toContain('KHMH-2026-014');
      await dispatchKey(inputs[2], 'Enter');
      expect(onPlanChange).toHaveBeenCalledWith('KHMH-2026-014');
    });

    it('PurchaseItemAutocomplete slices to 100 options, renders lineType badges, and triggers onSelect/onClear', async () => {
      const manyMaterials: MaterialApiDto[] = Array.from({ length: 105 }, (_, i) => ({
        ...SAMPLE_MATERIALS[0],
        materialCode: `VT-THEP-${String(i + 1).padStart(3, '0')}`,
        materialName: `Thép hình H300 lô ${i + 1}`,
      }));
      const onSelect = vi.fn();
      const onClear = vi.fn();

      await act(() =>
        root.render(
          createElement(PurchaseItemAutocomplete, {
            value: 'VT-THEP-001',
            materials: manyMaterials,
            serviceItems: SAMPLE_SERVICES,
            onSelect,
            onClear,
          }),
        ),
      );

      const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      await act(() => input.focus());

      const options = document.querySelectorAll('[role="option"]');
      expect(options).toHaveLength(100);

      await act(() => setInputValue(input, 'cẩu lắp'));
      const filtered = document.querySelectorAll<HTMLElement>('[role="option"]');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].querySelector('.pur-item-badge--service')?.textContent).toBe('Dịch vụ');

      await act(() =>
        filtered[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })),
      );
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'DV-CAUHANG-01', lineType: 'service' }),
      );

      await act(() => setInputValue(input, ''));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('PurDateRangePicker & Dropdown dialogStack integration', () => {
    it('opens PurDateRangePicker, selects range and confirms value', async () => {
      const onChange = vi.fn();
      await act(() =>
        root.render(
          createElement(PurDateRangePicker, {
            value: { from: '2026-10-05', to: '2026-10-10' },
            onChange,
          }),
        ),
      );

      const trigger = container.querySelector<HTMLButtonElement>('.pur-daterange__trigger')!;
      expect(trigger.textContent).toContain('05/10/2026 - 10/10/2026');
      await act(() => trigger.click());

      const dialog = document.querySelector<HTMLElement>('.pur-daterange__popover')!;
      expect(dialog).not.toBeNull();
      const days = Array.from(dialog.querySelectorAll<HTMLButtonElement>('.pur-daterange__day:not(.pur-daterange__day--empty)'));
      const day12 = days.find(btn => btn.textContent === '12')!;
      const day14 = days.find(btn => btn.textContent === '14')!;
      const day20 = days.find(btn => btn.textContent === '20')!;

      // With an existing range loaded, the first pick completes/updates the end, then next two picks set a new [from, to]
      await act(() => day12.click());
      await act(() => day14.click());
      await act(() => day20.click());
      const confirmBtn = dialog.querySelector<HTMLButtonElement>('.pur-daterange__btn--primary')!;
      await act(() => confirmBtn.click());

      expect(onChange).toHaveBeenCalledWith({ from: '2026-10-14', to: '2026-10-20' });
      expect(document.querySelector('.pur-daterange__popover')).toBeNull();
    });

    it('dismisses ONLY PurDateRangePicker on Escape inside Modal, restores focus, and keeps Modal Tab trap intact', async () => {
      const onModalClose = vi.fn();
      await act(() =>
        root.render(
          createElement(Modal, {
            isOpen: true,
            title: 'Lọc chứng từ mua hàng',
            onClose: onModalClose,
            children: createElement(Fragment, null,
              createElement(PurDateRangePicker, { value: null, onChange: vi.fn() }),
              createElement('button', { id: 'next-action', type: 'button' }, 'Áp dụng'),
            ),
          }),
        ),
      );

      const trigger = document.querySelector<HTMLButtonElement>('.pur-daterange__trigger')!;
      await act(() => trigger.click());
      expect(document.querySelector('.pur-daterange__popover')).not.toBeNull();

      // Tab trapping inside parent Modal must continue working while picker is open
      const nextBtn = document.getElementById('next-action')!;
      nextBtn.focus();
      const tabEvent = await dispatchKey(nextBtn, 'Tab');
      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.querySelector('[data-modal-focus]')?.contains(document.activeElement)).toBe(true);

      // Escape dismisses only PurDateRangePicker and restores focus to trigger
      await dispatchKey(document, 'Escape');
      expect(onModalClose).not.toHaveBeenCalled();
      expect(document.querySelector('.pur-daterange__popover')).toBeNull();
      expect(document.activeElement).toBe(trigger);

      // Second Escape closes Modal
      await dispatchKey(trigger, 'Escape');
      expect(onModalClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses ONLY Dropdown on Escape inside Modal before closing Modal', async () => {
      const onModalClose = vi.fn();
      await act(() =>
        root.render(
          createElement(Modal, {
            isOpen: true,
            title: 'Chi tiết kế hoạch KHMH-2026-014',
            onClose: onModalClose,
            children: createElement(Dropdown, {
              trigger: 'Tác vụ',
              items: [{ label: 'Xuất PDF', onClick: vi.fn() }],
            }),
          }),
        ),
      );

      const trigger = document.querySelector<HTMLButtonElement>('.nv-dropdown__trigger')!;
      await act(() => trigger.click());
      expect(document.querySelector('[role="menu"]')).not.toBeNull();

      await dispatchKey(trigger, 'Escape');
      expect(onModalClose).not.toHaveBeenCalled();
      expect(document.querySelector('[role="menu"]')).toBeNull();

      await dispatchKey(trigger, 'Escape');
      expect(onModalClose).toHaveBeenCalledTimes(1);
    });
  });
});
