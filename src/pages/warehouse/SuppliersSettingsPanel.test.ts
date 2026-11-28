import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupplierApiDto } from '../../services/suppliersService';
import { suppliersService } from '../../services/suppliersService';
import { supplierGroupsService } from '../../services/supplierDirectoryService';
import {
  useApproveSupplier,
  useCreateSupplier,
  useDeleteSupplier,
  useRejectSupplier,
  useSuppliers,
  useUpdateSupplier,
} from '../../hooks/useSuppliers';
import {
  useAddSupplierToBlacklist,
  useCreateSupplierContact,
  useSupplierContacts,
  useSupplierGroups,
} from '../../hooks/useSupplierDirectory';
import { showToast } from '../../components/ui/Toast';
import type { SupplierContactApiDto, SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';
import SuppliersSettingsPanel from './SuppliersSettingsPanel';

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'usr-director', username: 'giamdoc', role: 'director' },
    permissions: ['wms.suppliers.view', 'wms.suppliers.approve'],
    refresh: vi.fn(),
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../services/suppliersService', () => ({
  suppliersService: {
    nextCode: vi.fn(),
    getSourcingKpi: vi.fn(),
    uploadAttachment: vi.fn(),
    listAttachments: vi.fn(),
    downloadAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
  },
}));

vi.mock('../../services/supplierDirectoryService', () => ({
  supplierGroupsService: {
    groupsOfSupplier: vi.fn(),
    setGroupsOfSupplier: vi.fn(),
  },
}));

vi.mock('../../hooks/useSuppliers', () => ({
  useSuppliers: vi.fn(),
  useCreateSupplier: vi.fn(),
  useUpdateSupplier: vi.fn(),
  useDeleteSupplier: vi.fn(),
  useApproveSupplier: vi.fn(),
  useRejectSupplier: vi.fn(),
}));

vi.mock('../../hooks/useSupplierDirectory', () => ({
  useSupplierGroups: vi.fn(),
  useSupplierContacts: vi.fn(),
  useCreateSupplierContact: vi.fn(),
  useAddSupplierToBlacklist: vi.fn(),
}));

const mockSuppliers: SupplierApiDto[] = [
  {
    id: 101,
    supplierCode: 'NCC-001',
    supplierName: 'Công ty TNHH Thép Hòa Phát Miền Nam',
    taxCode: '0301234567',
    contactPhone: '0909123456',
    supplierType: 'Nhà sản xuất',
    scope: 'Trong nước',
    website: 'https://hoaphat.com.vn',
    maxDebtDays: 30,
    creditLimit: 500000000,
    paymentTerms: 'Thanh toán 30 ngày sau giao hàng',
    rating: 'B',
    approvalStatus: 'approved',
    isBlacklisted: false,
    purchasedRevenue: 1250000000,
    industryGroups: ['Thép hình', 'Thép tấm', 'Phụ kiện hàn', 'Bu lông neo'],
    contactCount: 2,
    primaryContact: {
      id: 501,
      fullName: 'Nguyễn Minh Tuấn',
      position: 'Trưởng phòng Kinh doanh',
      phone: '0909123456',
      email: 'tuan.nguyen@hoaphat.com.vn',
      role: 'primary',
    },
    attachments: [],
    latestEvaluation: {
      period: 'Q3/2026',
      score: 86,
      grade: 'B',
      gradeLabel: 'Hạng B',
      evaluatedAt: '2026-10-01',
    },
  },
  {
    id: 102,
    supplierCode: 'NCC-002',
    supplierName: 'Công ty CP Dây Cáp Điện Cadivi',
    taxCode: '0309876543',
    contactPhone: '0918654321',
    supplierType: 'Nhà phân phối',
    scope: 'Trong nước',
    website: null,
    maxDebtDays: 15,
    creditLimit: null,
    paymentTerms: 'Chuyển khoản khi nhận hàng',
    rating: 'D',
    approvalStatus: 'new',
    isBlacklisted: false,
    purchasedRevenue: 0,
    industryGroups: ['Cáp điện'],
    contactCount: 0,
    primaryContact: null,
    attachments: [],
  },
];

const mockGroups: SupplierGroupApiDto[] = [
  { id: 1, name: 'Thép hình', description: 'Thép kết cấu', supplierCount: 4, childCount: 0 },
  { id: 2, name: 'Cáp điện', description: 'Cáp hạ thế & trung thế', supplierCount: 2, childCount: 0 },
];

const mockContacts: SupplierContactApiDto[] = [
  {
    id: 501,
    supplierId: 101,
    supplierName: 'Công ty TNHH Thép Hòa Phát Miền Nam',
    fullName: 'Nguyễn Minh Tuấn',
    position: 'Trưởng phòng Kinh doanh',
    phone: '0909123456',
    email: 'tuan.nguyen@hoaphat.com.vn',
    note: null,
    role: 'primary',
    roleLabel: 'Liên hệ chính',
  },
];

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();
const approveMutateAsync = vi.fn();
const rejectMutateAsync = vi.fn();
const blacklistMutateAsync = vi.fn();
const createContactMutateAsync = vi.fn();

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20));
  });
}

async function renderPanel(initialEntry = '/suppliers/list') {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          createElement(SuppliersSettingsPanel),
        ),
      ),
    );
  });
  await flush();
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  setter.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
  setter.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();

  vi.mocked(suppliersService.getSourcingKpi).mockResolvedValue({
    totalSuppliers: 2,
    totalNewThisMonth: 1,
    totalPromotedThisMonth: 0,
    gradeACount: 0,
    gradeBCount: 1,
    gradeCCount: 0,
    gradeDCount: 1,
    otherGradeCount: 0,
    promotionRatePercent: 0,
  });
  vi.mocked(suppliersService.nextCode)
    .mockResolvedValueOnce({ nextCode: 'NCC-003' })
    .mockResolvedValueOnce({ nextCode: 'NCC-004' });
  vi.mocked(supplierGroupsService.groupsOfSupplier).mockResolvedValue([{ id: 1, name: 'Thép hình' }]);
  vi.mocked(supplierGroupsService.setGroupsOfSupplier).mockResolvedValue([]);

  createMutateAsync.mockResolvedValue({ ...mockSuppliers[1], id: 103, supplierCode: 'NCC-003' });
  updateMutateAsync.mockResolvedValue(mockSuppliers[0]);
  deleteMutateAsync.mockResolvedValue(undefined);
  approveMutateAsync.mockResolvedValue({ ...mockSuppliers[1], approvalStatus: 'approved' });
  rejectMutateAsync.mockResolvedValue({ ...mockSuppliers[1], approvalStatus: 'rejected' });
  blacklistMutateAsync.mockResolvedValue(mockSuppliers[0]);
  createContactMutateAsync.mockResolvedValue(mockContacts[0]);

  vi.mocked(useSuppliers).mockReturnValue({
    data: {
      items: mockSuppliers,
      totalCount: mockSuppliers.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useSuppliers>);

  vi.mocked(useCreateSupplier).mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateSupplier>);

  vi.mocked(useUpdateSupplier).mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateSupplier>);

  vi.mocked(useDeleteSupplier).mockReturnValue({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteSupplier>);

  vi.mocked(useApproveSupplier).mockReturnValue({
    mutateAsync: approveMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useApproveSupplier>);

  vi.mocked(useRejectSupplier).mockReturnValue({
    mutateAsync: rejectMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useRejectSupplier>);

  vi.mocked(useSupplierGroups).mockReturnValue({
    data: {
      items: mockGroups,
      totalCount: mockGroups.length,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    },
  } as unknown as ReturnType<typeof useSupplierGroups>);

  vi.mocked(useSupplierContacts).mockReturnValue({
    data: {
      items: mockContacts,
      totalCount: mockContacts.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useSupplierContacts>);

  vi.mocked(useCreateSupplierContact).mockReturnValue({
    mutateAsync: createContactMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateSupplierContact>);

  vi.mocked(useAddSupplierToBlacklist).mockReturnValue({
    mutateAsync: blacklistMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useAddSupplierToBlacklist>);

  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SuppliersSettingsPanel characterization', () => {
  it('renders filter bar, table headers, and supplier rows with rating/approval badges and industry groups', async () => {
    await renderPanel();

    expect(container.querySelector('input[placeholder="Tìm mã NCC, tên nhà cung cấp…"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Hạng"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Trạng thái"]')).not.toBeNull();
    expect(container.textContent).toContain('Upload Excel NCC');
    expect(container.textContent).toContain('Thêm NCC');

    const headers = [...container.querySelectorAll('thead th')].map(th => th.textContent?.trim());
    expect(headers).toEqual([
      'Mã NCC',
      'Tên nhà cung cấp',
      'Người liên hệ',
      'Hạn công nợ',
      'Hạn mức',
      'Điều khoản thanh toán',
      'Nhóm ngành hàng',
      'Hạng',
      'Trạng thái',
      'Doanh số đã mua',
      'Đánh giá gần nhất',
      'Điểm KPI',
      'Tác vụ',
    ]);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);

    const firstRow = rows[0]!;
    expect(firstRow.textContent).toContain('NCC-001');
    expect(firstRow.textContent).toContain('Công ty TNHH Thép Hòa Phát Miền Nam');
    expect(firstRow.textContent).toContain('MST: 0301234567');
    expect(firstRow.textContent).toContain('Nguyễn Minh Tuấn');
    expect(firstRow.textContent).toContain('0909123456');
    expect(firstRow.textContent).toContain('Trưởng phòng Kinh doanh');
    expect(firstRow.textContent).toContain('Hạng B');
    expect(firstRow.textContent).toContain('Đã duyệt');
    expect(firstRow.textContent).toContain('Thép hình');
    expect(firstRow.textContent).toContain('Thép tấm');
    expect(firstRow.textContent).toContain('Phụ kiện hàn');
    expect(firstRow.textContent).toContain('+1');

    const secondRow = rows[1]!;
    expect(secondRow.textContent).toContain('NCC-002');
    expect(secondRow.textContent).toContain('0918654321');
    expect(secondRow.textContent).toContain('Chuyển khoản khi nhận hàng');
    expect(secondRow.textContent).toContain('Hạng D');
    expect(secondRow.textContent).toContain('Mới - chờ duyệt');
    expect(secondRow.textContent).toContain('Cáp điện');
  });

  it('opens detail modal with 360° Hub links and triggers useSupplierContacts when clicking a supplier name', async () => {
    await renderPanel();

    const nameButton = [...container.querySelectorAll('button.ncc-master-name')].find(btn =>
      btn.textContent?.includes('Công ty TNHH Thép Hòa Phát Miền Nam'),
    ) as HTMLButtonElement;
    expect(nameButton).toBeDefined();

    await act(async () => {
      nameButton.click();
    });
    await flush();

    expect(useSupplierContacts).toHaveBeenCalledWith({ supplierId: 101, pageSize: 50 });

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Chi tiết · NCC-001');
    expect(dialog.textContent).toContain('360° Hub:');
    expect(dialog.textContent).toContain('Xem bảng kê công nợ');
    expect(dialog.textContent).toContain('Xem đơn hàng PO');
    expect(dialog.textContent).toContain('Lịch sử đánh giá');
    expect(dialog.textContent).toContain('Danh sách Người liên hệ (1)');

    const hrefs = [...dialog.querySelectorAll('a')].map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/suppliers/debt?supplierId=101');
    expect(hrefs).toContain('/purchasing/orders?search=NCC-001');
    expect(hrefs).toContain('/suppliers/evaluations?supplierId=101');
    expect(hrefs).toContain('/suppliers/evaluations?supplierId=101&tab=kpi');
    expect(hrefs).toContain('/suppliers/contacts?supplierId=101');
  });

  it('opens create modal on Thêm NCC with supplier code field, Lấy mã gợi ý, and validates/submits', async () => {
    await renderPanel();

    const addBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thêm NCC'),
    ) as HTMLButtonElement;
    expect(addBtn).toBeDefined();

    await act(async () => {
      addBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Thêm nhà cung cấp');
    expect(dialog.textContent).toContain('Mã NCC');
    expect(dialog.textContent).toContain('Tên nhà cung cấp');
    expect(dialog.textContent).toContain('Loại hình đối tác');
    expect(dialog.textContent).toContain('Phạm vi hoạt động');
    expect(dialog.textContent).toContain('Mã số thuế (MST)');
    expect(dialog.textContent).toContain('Hạn công nợ (ngày)');
    expect(dialog.textContent).toContain('Điều khoản thanh toán');
    expect(suppliersService.nextCode).toHaveBeenCalledTimes(1);

    const codeInput = dialog.querySelector('input.form-input.font-mono.flex-1') as HTMLInputElement;
    expect(codeInput).not.toBeNull();
    expect(codeInput.value).toBe('NCC-003');

    const nextCodeBtn = [...dialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Lấy mã gợi ý'),
    ) as HTMLButtonElement;
    expect(nextCodeBtn).toBeDefined();

    await act(async () => {
      nextCodeBtn.click();
    });
    await flush();

    expect(suppliersService.nextCode).toHaveBeenCalledTimes(2);
    expect(codeInput.value).toBe('NCC-004');

    const form = document.getElementById('supplier-settings-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(dialog.textContent).toContain('Tên nhà cung cấp là bắt buộc.');
    expect(createMutateAsync).not.toHaveBeenCalled();

    const textInputs = [...form.querySelectorAll('input.form-input')];
    const nameInput = textInputs[1] as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'Công ty TNHH Vật Tư Đông Á');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierCode: 'NCC-004',
        supplierName: 'Công ty TNHH Vật Tư Đông Á',
        maxDebtDays: 30,
      }),
    );
    expect(supplierGroupsService.setGroupsOfSupplier).toHaveBeenCalledWith(103, { groupIds: [] });
    expect(showToast).toHaveBeenCalledWith(
      'success',
      'Đã thêm nhà cung cấp. Hạng D, chờ sếp duyệt mới đặt hàng được.',
    );
  });

  it('supports editing, approving, and blacklisting from the detail modal and confirm dialogs', async () => {
    await renderPanel();

    const secondNameBtn = [...container.querySelectorAll('button.ncc-master-name')].find(btn =>
      btn.textContent?.includes('Công ty CP Dây Cáp Điện Cadivi'),
    ) as HTMLButtonElement;

    await act(async () => {
      secondNameBtn.click();
    });
    await flush();

    const detailDialog = document.body.querySelector('[role="dialog"]')!;
    const approveBtn = [...detailDialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Duyệt NCC',
    ) as HTMLButtonElement;
    expect(approveBtn).toBeDefined();

    await act(async () => {
      approveBtn.click();
    });
    await flush();

    const approveConfirm = document.body.querySelector('[role="alertdialog"]')!;
    expect(approveConfirm.textContent).toContain('Duyệt nhà cung cấp?');
    const confirmApproveBtn = [...approveConfirm.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Duyệt',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmApproveBtn.click();
    });
    await flush();
    expect(approveMutateAsync).toHaveBeenCalledWith(102);

    const blacklistBtn = [...document.body.querySelectorAll('[role="dialog"] button')].find(btn =>
      btn.textContent?.trim() === 'Thêm vào blacklist',
    ) as HTMLButtonElement;
    await act(async () => {
      blacklistBtn.click();
    });
    await flush();

    const blacklistDialog = document.body.querySelector('[role="alertdialog"]')!;
    expect(blacklistDialog.textContent).toContain('Thêm vào blacklist?');
    const reasonTextarea = blacklistDialog.querySelector('textarea') as HTMLTextAreaElement;
    await act(async () => {
      setTextareaValue(reasonTextarea, 'Giao hàng chậm tiến độ nhiều lần');
    });
    const confirmBlacklistBtn = [...blacklistDialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Thêm vào blacklist',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmBlacklistBtn.click();
    });
    await flush();
    expect(blacklistMutateAsync).toHaveBeenCalledWith({
      id: 102,
      body: { reason: 'Giao hàng chậm tiến độ nhiều lần' },
    });

    // Re-open first supplier and click Sửa
    const firstNameBtn = [...container.querySelectorAll('button.ncc-master-name')].find(btn =>
      btn.textContent?.includes('Công ty TNHH Thép Hòa Phát Miền Nam'),
    ) as HTMLButtonElement;
    await act(async () => {
      firstNameBtn.click();
    });
    await flush();

    const editBtn = [...document.body.querySelectorAll('[role="dialog"] button')].find(btn =>
      btn.textContent?.trim() === 'Sửa',
    ) as HTMLButtonElement;
    await act(async () => {
      editBtn.click();
    });
    await flush();

    expect(supplierGroupsService.groupsOfSupplier).toHaveBeenCalledWith(101);
    const editDialog = document.body.querySelector('[role="dialog"]')!;
    expect(editDialog.textContent).toContain('Sửa nhà cung cấp');
    const editCodeInput = editDialog.querySelector('input.form-input.font-mono.flex-1') as HTMLInputElement;
    expect(editCodeInput.disabled).toBe(true);
    expect(editCodeInput.value).toBe('NCC-001');
  });

  it('validates duplicate code, invalid phone, invalid debt days, and supports reject and delete confirm dialogs', async () => {
    await renderPanel();

    // Open create modal and test duplicate code + invalid phone + invalid maxDebtDays
    const addBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thêm NCC'),
    ) as HTMLButtonElement;
    await act(async () => {
      addBtn.click();
    });
    await flush();

    const form = document.getElementById('supplier-settings-form') as HTMLFormElement;
    const codeInput = form.querySelector('input.form-input.font-mono.flex-1') as HTMLInputElement;
    const inputs = [...form.querySelectorAll('input.form-input')];
    const nameInput = inputs[1] as HTMLInputElement;
    const phoneInput = form.querySelector('input[autocomplete="tel"]') as HTMLInputElement;
    const debtInput = form.querySelector('input[placeholder="0 - 3650"]') as HTMLInputElement;

    await act(async () => {
      setInputValue(codeInput, 'NCC-001');
      setInputValue(nameInput, 'NCC Test Validate');
      setInputValue(phoneInput, '0912');
      setInputValue(debtInput, 'abc');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Mã nhà cung cấp đã tồn tại.');
    expect(dialog.textContent).toContain('SĐT không hợp lệ');
    expect(dialog.textContent).toContain('Hạn công nợ phải là số nguyên.');
    expect(createMutateAsync).not.toHaveBeenCalled();

    // Close create modal
    const cancelBtn = [...dialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Hủy',
    ) as HTMLButtonElement;
    await act(async () => {
      cancelBtn.click();
    });
    await flush();

    // Reject NCC-002 from detail modal
    const secondNameBtn = [...container.querySelectorAll('button.ncc-master-name')].find(btn =>
      btn.textContent?.includes('Công ty CP Dây Cáp Điện Cadivi'),
    ) as HTMLButtonElement;
    await act(async () => {
      secondNameBtn.click();
    });
    await flush();

    const detailDialog = document.body.querySelector('[role="dialog"]')!;
    const rejectBtn = [...detailDialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Từ chối',
    ) as HTMLButtonElement;
    await act(async () => {
      rejectBtn.click();
    });
    await flush();

    const rejectConfirm = document.body.querySelector('[role="alertdialog"]')!;
    expect(rejectConfirm.textContent).toContain('Từ chối nhà cung cấp?');
    const confirmRejectBtn = [...rejectConfirm.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Từ chối',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmRejectBtn.click();
    });
    await flush();
    expect(rejectMutateAsync).toHaveBeenCalledWith(102);

    // Close detail modal
    const closeDetailBtn = [...document.body.querySelectorAll('[role="dialog"] button')].find(btn =>
      btn.textContent?.trim() === 'Đóng',
    ) as HTMLButtonElement;
    await act(async () => {
      closeDetailBtn.click();
    });
    await flush();

    // Delete NCC-001 via row actions dropdown
    const actionButtons = [...container.querySelectorAll('tbody tr button')].filter(btn =>
      btn.textContent?.includes('Tác vụ'),
    ) as HTMLButtonElement[];
    await act(async () => {
      actionButtons[0]!.click();
    });
    await flush();

    const deleteMenuItem = [...document.body.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Xóa',
    ) as HTMLButtonElement;
    expect(deleteMenuItem).toBeDefined();
    await act(async () => {
      deleteMenuItem.click();
    });
    await flush();

    const deleteConfirm = document.body.querySelector('[role="alertdialog"]')!;
    expect(deleteConfirm.textContent).toContain('Xóa nhà cung cấp?');
    const confirmDeleteBtn = [...deleteConfirm.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Xóa',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmDeleteBtn.click();
    });
    await flush();
    expect(deleteMutateAsync).toHaveBeenCalledWith(101);
  });

  it('renders hierarchical SupplierGroupTreePicker inside SupplierFormModal and submits selected child group IDs', async () => {
    const hierarchicalGroups: SupplierGroupApiDto[] = [
      { id: 10, name: 'Vật tư Điện', description: 'Thiết bị điện', supplierCount: 0, childCount: 2 },
      {
        id: 11,
        name: 'Dây cáp điện',
        description: 'Cáp hạ thế',
        supplierCount: 2,
        parentGroupId: 10,
        parentGroupName: 'Vật tư Điện',
        childCount: 0,
      },
      {
        id: 12,
        name: 'Đèn chiếu sáng',
        description: null,
        supplierCount: 1,
        parentGroupId: 10,
        parentGroupName: 'Vật tư Điện',
        childCount: 0,
      },
    ];
    vi.mocked(useSupplierGroups).mockReturnValue({
      data: {
        items: hierarchicalGroups,
        totalCount: hierarchicalGroups.length,
        page: 1,
        pageSize: 500,
        totalPages: 1,
      },
    } as unknown as ReturnType<typeof useSupplierGroups>);

    await renderPanel();

    const addBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thêm NCC'),
    ) as HTMLButtonElement;
    await act(async () => {
      addBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('.supplier-group-picker')).not.toBeNull();
    expect(dialog.textContent).toContain('Vật tư Điện');
    expect(dialog.textContent).not.toContain('Dây cáp điện');

    const expandBtn = dialog.querySelector('button[aria-expanded][data-group-id="10"]') as HTMLButtonElement;
    expect(expandBtn).not.toBeNull();
    await act(async () => {
      expandBtn.click();
    });
    await flush();

    expect(dialog.textContent).toContain('Dây cáp điện');
    const cableLabel = [...dialog.querySelectorAll('label')].find(l =>
      l.textContent?.includes('Dây cáp điện'),
    )!;
    const cableCheckbox = cableLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      cableCheckbox.click();
    });
    await flush();

    expect(dialog.textContent).toContain('Vật tư Điện › Dây cáp điện');

    const form = document.getElementById('supplier-settings-form') as HTMLFormElement;
    const inputs = [...form.querySelectorAll('input.form-input')];
    const nameInput = inputs[1] as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'Công ty TNHH Điện Quang');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(supplierGroupsService.setGroupsOfSupplier).toHaveBeenCalledWith(103, { groupIds: [11] });
  });

  it('orders Nhóm ngành hàng filter dropdown in 2-level tree order and syncs ?groupId= URL param', async () => {
    const hierarchicalGroups: SupplierGroupApiDto[] = [
      { id: 20, name: 'Vật tư Điện', supplierCount: 0, childCount: 2 },
      {
        id: 21,
        name: 'Dây cáp điện',
        supplierCount: 2,
        parentGroupId: 20,
        parentGroupName: 'Vật tư Điện',
        childCount: 0,
      },
      {
        id: 22,
        name: 'Đèn chiếu sáng',
        supplierCount: 1,
        parentGroupId: 20,
        parentGroupName: 'Vật tư Điện',
        childCount: 0,
      },
      { id: 10, name: 'Cơ khí', supplierCount: 3, childCount: 0 },
    ];
    vi.mocked(useSupplierGroups).mockReturnValue({
      data: {
        items: hierarchicalGroups,
        totalCount: hierarchicalGroups.length,
        page: 1,
        pageSize: 500,
        totalPages: 1,
      },
    } as unknown as ReturnType<typeof useSupplierGroups>);

    await renderPanel('/suppliers/list?groupId=21');

    const groupSelect = container.querySelector('select[aria-label="Nhóm ngành hàng"]') as HTMLSelectElement;
    expect(groupSelect).not.toBeNull();
    expect(groupSelect.value).toBe('21');

    const optionLabels = [...groupSelect.options].map(opt => opt.textContent);
    expect(optionLabels).toEqual([
      'Tất cả nhóm ngành hàng',
      'Cơ khí',
      'Vật tư Điện',
      '↳ Dây cáp điện',
      '↳ Đèn chiếu sáng',
    ]);

    expect(useSuppliers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groupId: 21,
        page: 1,
      }),
    );

    await act(async () => {
      setSelectValue(groupSelect, '10');
    });
    await flush();

    expect(groupSelect.value).toBe('10');
    expect(useSuppliers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groupId: 10,
        page: 1,
      }),
    );
  });
});
