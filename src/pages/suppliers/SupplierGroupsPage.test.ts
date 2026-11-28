import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '../../components/ui/Toast';
import {
  useCreateSupplierGroup,
  useDeleteSupplierGroup,
  useSetSupplierGroupMembers,
  useSupplierGroupMembers,
  useSupplierGroups,
  useUpdateSupplierGroup,
} from '../../hooks/useSupplierDirectory';
import { useSuppliers } from '../../hooks/useSuppliers';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';
import SupplierGroupsPage from './SupplierGroupsPage';

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../hooks/useSupplierDirectory', () => ({
  useSupplierGroups: vi.fn(),
  useCreateSupplierGroup: vi.fn(),
  useUpdateSupplierGroup: vi.fn(),
  useDeleteSupplierGroup: vi.fn(),
  useSetSupplierGroupMembers: vi.fn(),
  useSupplierGroupMembers: vi.fn(),
}));

vi.mock('../../hooks/useSuppliers', () => ({
  useSuppliers: vi.fn(),
}));

const hierarchicalGroups: SupplierGroupApiDto[] = [
  {
    id: 1,
    name: 'Vật tư Điện',
    description: 'Thiết bị điện',
    supplierCount: 0,
    parentGroupId: null,
    parentGroupName: null,
    childCount: 2,
  },
  {
    id: 11,
    name: 'Dây cáp điện',
    description: 'Cáp hạ thế',
    supplierCount: 3,
    parentGroupId: 1,
    parentGroupName: 'Vật tư Điện',
    childCount: 0,
  },
  {
    id: 12,
    name: 'Đèn chiếu sáng',
    description: null,
    supplierCount: 1,
    parentGroupId: 1,
    parentGroupName: 'Vật tư Điện',
    childCount: 0,
  },
  {
    id: 2,
    name: 'Bảo hộ lao động',
    description: 'Nhóm độc lập',
    supplierCount: 2,
    parentGroupId: null,
    parentGroupName: null,
    childCount: 0,
  },
];

let container: HTMLDivElement;
let root: Root;

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();
const setMembersMutateAsync = vi.fn();

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 15));
  });
}

async function renderPage() {
  await act(async () => {
    root.render(
      createElement(MemoryRouter, null, createElement(SupplierGroupsPage)),
    );
  });
  await flush();
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();

  createMutateAsync.mockResolvedValue(hierarchicalGroups[0]);
  updateMutateAsync.mockResolvedValue(hierarchicalGroups[0]);
  deleteMutateAsync.mockResolvedValue(undefined);
  setMembersMutateAsync.mockResolvedValue([]);

  vi.mocked(useSupplierGroups).mockReturnValue({
    data: {
      items: hierarchicalGroups,
      totalCount: hierarchicalGroups.length,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useSupplierGroups>);

  vi.mocked(useCreateSupplierGroup).mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateSupplierGroup>);

  vi.mocked(useUpdateSupplierGroup).mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateSupplierGroup>);

  vi.mocked(useDeleteSupplierGroup).mockReturnValue({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteSupplierGroup>);

  vi.mocked(useSetSupplierGroupMembers).mockReturnValue({
    mutateAsync: setMembersMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSetSupplierGroupMembers>);

  vi.mocked(useSupplierGroupMembers).mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useSupplierGroupMembers>);

  vi.mocked(useSuppliers).mockReturnValue({
    data: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 },
    isLoading: false,
  } as unknown as ReturnType<typeof useSuppliers>);

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SupplierGroupsPage 2-level hierarchy', () => {
  it('loads pageSize 500, renders parent and expanded child rows, and protects parents with children from assign/delete', async () => {
    await renderPage();

    expect(useSupplierGroups).toHaveBeenCalledWith({ search: '', page: 1, pageSize: 500 });
    expect(container.textContent).toContain('Tạo nhóm');
    expect(container.textContent).toContain('Vật tư Điện');
    expect(container.textContent).toContain('2 mô tả');
    expect(container.textContent).toContain('Dây cáp điện');
    expect(container.textContent).toContain('Đèn chiếu sáng');
    expect(container.textContent).toContain('Bảo hộ lao động');

    const parentRow = container.querySelector('tr.supplier-groups-row--parent:nth-of-type(2)') ??
      [...container.querySelectorAll('tr.supplier-groups-row--parent')].find(tr =>
        tr.textContent?.includes('Vật tư Điện'),
      )!;
    const childRows = [...container.querySelectorAll('tr.supplier-groups-row--child')];
    expect(childRows).toHaveLength(2);
    expect(childRows[0]!.textContent).toContain('2.1');
    expect(childRows[0]!.textContent).toContain('Cáp hạ thế');
    expect(childRows[1]!.textContent).toContain('2.2');
    expect(childRows[1]!.querySelector('.supplier-groups-col-desc')?.textContent?.trim()).toBe('—');
    expect(childRows[1]!.textContent).not.toContain('Chưa có mô tả');

    const assignParentBtn = parentRow.querySelector(
      'button[aria-label="Gán nhà cung cấp cho nhóm Vật tư Điện"]',
    ) as HTMLButtonElement;
    const deleteParentBtn = parentRow.querySelector(
      'button[aria-label="Xóa nhóm Vật tư Điện"]',
    ) as HTMLButtonElement;
    expect(assignParentBtn.disabled).toBe(true);
    expect(deleteParentBtn.disabled).toBe(true);

    // Toggle collapse all / expand all
    const collapseAllBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Thu gọn tất cả'),
    ) as HTMLButtonElement;
    expect(collapseAllBtn).toBeDefined();

    await act(async () => {
      collapseAllBtn.click();
    });
    expect(container.querySelectorAll('tr.supplier-groups-row--child')).toHaveLength(0);

    const expandAllBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Mở rộng tất cả'),
    ) as HTMLButtonElement;
    await act(async () => {
      expandAllBtn.click();
    });
    expect(container.querySelectorAll('tr.supplier-groups-row--child')).toHaveLength(2);
  });

  it('shows muted child-summary text on parent row when parent description is null and has children', async () => {
    const parentNoDesc: SupplierGroupApiDto[] = [
      {
        id: 1,
        name: 'Bảo Ôn',
        description: null,
        supplierCount: 0,
        parentGroupId: null,
        parentGroupName: null,
        childCount: 2,
      },
      {
        id: 11,
        name: 'Cung cấp vật tư',
        description: null,
        supplierCount: 1,
        parentGroupId: 1,
        parentGroupName: 'Bảo Ôn',
        childCount: 0,
      },
      {
        id: 12,
        name: 'Lắp đặt',
        description: null,
        supplierCount: 0,
        parentGroupId: 1,
        parentGroupName: 'Bảo Ôn',
        childCount: 0,
      },
    ];
    vi.mocked(useSupplierGroups).mockReturnValue({
      data: {
        items: parentNoDesc,
        totalCount: parentNoDesc.length,
        page: 1,
        pageSize: 500,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSupplierGroups>);

    await renderPage();

    const parentRow = container.querySelector('tr.supplier-groups-row--parent')!;
    expect(parentRow.querySelector('.supplier-groups-col-desc')?.textContent).toContain(
      'Gồm 2 mô tả con bên dưới',
    );
  });

  it('opens contextual single-field create-child modal with parent context banner and NO select/textarea, edits child preserving legacy description, and edits parent without parent select', async () => {
    await renderPage();

    const addChildBtn = container.querySelector(
      'button[aria-label="Thêm mô tả con cho Vật tư Điện"]',
    ) as HTMLButtonElement;
    expect(addChildBtn).not.toBeNull();

    await act(async () => {
      addChildBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Thêm mô tả cho nhóm');
    expect(dialog.querySelector('select')).toBeNull();
    expect(dialog.querySelector('textarea')).toBeNull();
    const parentContext = dialog.querySelector('.supplier-group-form__parent-context');
    expect(parentContext).not.toBeNull();
    expect(parentContext?.textContent).toContain('Thuộc nhóm: Vật tư Điện');
    expect(dialog.querySelectorAll('input.form-input')).toHaveLength(1);

    const nameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    expect(nameInput.placeholder).toBe('VD: Lắp đặt, Cung cấp vật tư, Gia công…');
    await act(async () => {
      setInputValue(nameInput, 'Tủ điện công nghiệp');
    });

    const form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Tủ điện công nghiệp',
      description: null,
      parentGroupId: 1,
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã thêm mô tả con');

    // Edit existing child with legacy description -> NO select/textarea, shows parent context, preserves legacy description
    const editChildBtn = container.querySelector(
      'button[aria-label="Sửa mô tả Dây cáp điện"]',
    ) as HTMLButtonElement;
    await act(async () => {
      editChildBtn.click();
    });
    await flush();

    const editChildDialog = document.body.querySelector('[role="dialog"]')!;
    expect(editChildDialog.textContent).toContain('Sửa mô tả con');
    expect(editChildDialog.querySelector('select')).toBeNull();
    expect(editChildDialog.querySelector('textarea')).toBeNull();
    expect(
      editChildDialog.querySelector('.supplier-group-form__parent-context')?.textContent,
    ).toContain('Thuộc nhóm: Vật tư Điện');
    expect(editChildDialog.querySelectorAll('input.form-input')).toHaveLength(1);
    const editChildInput = editChildDialog.querySelector('input.form-input') as HTMLInputElement;
    expect(editChildInput.value).toBe('Dây cáp điện');
    await act(async () => {
      setInputValue(editChildInput, 'Dây cáp động lực');
    });
    const editChildForm = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      editChildForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 11,
      body: {
        name: 'Dây cáp động lực',
        description: 'Cáp hạ thế',
        parentGroupId: 1,
      },
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã cập nhật mô tả con');

    // Edit parent -> NO parent select ("Nhóm (Cấp cha)"), renders Tên nhóm, Mô tả chung, and Danh sách mô tả bên trong
    const editParentBtn = container.querySelector(
      'button[aria-label="Sửa nhóm Vật tư Điện"]',
    ) as HTMLButtonElement;
    await act(async () => {
      editParentBtn.click();
    });
    await flush();

    const editDialog = document.body.querySelector('[role="dialog"]')!;
    expect(editDialog.textContent).toContain('Sửa nhóm nhà cung cấp');
    expect(editDialog.querySelector('select')).toBeNull();
    expect(editDialog.querySelector('.supplier-group-form__parent-context')).toBeNull();
    expect(editDialog.textContent).not.toContain('Nhóm (Cấp cha)');
    expect(editDialog.textContent).toContain('Tên nhóm');
    expect(editDialog.textContent).toContain('Mô tả chung');
    expect(editDialog.querySelector('textarea')).not.toBeNull();
    expect(editDialog.textContent).toContain('Danh sách mô tả bên trong (tùy chọn)');
  });

  it('creates a group with 2 single-input child descriptions in a single request and focuses newly added rows', async () => {
    await renderPage();

    const createRootBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.trim() === 'Tạo nhóm',
    ) as HTMLButtonElement;
    await act(async () => {
      createRootBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('select')).toBeNull();
    expect(dialog.querySelector('.supplier-group-form__parent-context')).toBeNull();
    expect(dialog.textContent).not.toContain('Nhóm (Cấp cha)');
    expect(dialog.textContent).toContain('Tên nhóm');
    expect(dialog.textContent).toContain('Mô tả chung');
    expect(dialog.querySelector('textarea')).not.toBeNull();
    expect(dialog.textContent).toContain('Danh sách mô tả bên trong (tùy chọn)');

    const parentNameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    expect(parentNameInput.placeholder).toBe('VD: Bảo Ôn, Thiết bị điện');
    await act(async () => {
      setInputValue(parentNameInput, 'Bảo ôn & Cách nhiệt');
    });

    const addSubBtn = [...dialog.querySelectorAll('button')].find(b =>
      b.textContent?.includes('+ Thêm mô tả'),
    ) as HTMLButtonElement;
    expect(addSubBtn).toBeDefined();

    await act(async () => {
      addSubBtn.click();
    });
    await flush();
    const subName1 = dialog.querySelector(
      'input[aria-label="Mô tả con #1"]',
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(subName1);

    await act(async () => {
      addSubBtn.click();
    });
    await flush();
    const subName2 = dialog.querySelector(
      'input[aria-label="Mô tả con #2"]',
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(subName2);

    // Each child row has strictly 1 input box and uses single-column layout class
    const subRows = [...dialog.querySelectorAll('.supplier-group-form__sub-row')];
    expect(subRows).toHaveLength(2);
    expect(subRows[0]!.querySelectorAll('input')).toHaveLength(1);
    expect(subRows[1]!.querySelectorAll('input')).toHaveLength(1);
    expect(subRows[0]!.querySelector('.supplier-group-form__sub-inputs--single')).not.toBeNull();

    await act(async () => {
      setInputValue(subName1, 'Cung cấp vật tư');
      setInputValue(subName2, 'Thi công lắp đặt');
    });

    // Adding a completely blank 3rd draft row should be ignored cleanly on submit
    await act(async () => {
      addSubBtn.click();
    });
    await flush();

    const form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(createMutateAsync).toHaveBeenCalledTimes(1);
    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Bảo ôn & Cách nhiệt',
      description: null,
      parentGroupId: null,
      subGroups: [
        { id: null, name: 'Cung cấp vật tư', description: null },
        { id: null, name: 'Thi công lắp đặt', description: null },
      ],
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã tạo nhóm và 2 mô tả con');
  });

  it('displays non-blocking anti-repetition warning when child description matches parent name (with diacritic/case folding)', async () => {
    await renderPage();

    const addChildBtn = container.querySelector(
      'button[aria-label="Thêm mô tả con cho Vật tư Điện"]',
    ) as HTMLButtonElement;
    await act(async () => {
      addChildBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('.supplier-group-form__hint')?.textContent).toContain(
      'Nhập mô tả / hạng mục con cụ thể trong nhóm (không cần lặp lại tên nhóm).',
    );

    const nameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'vat tu dien');
    });

    const warn = dialog.querySelector('.supplier-group-form__warn');
    expect(warn).not.toBeNull();
    expect(warn?.textContent).toContain('Không cần lặp lại tên nhóm "Vật tư Điện"');
    expect(warn?.textContent).toContain('Vật tư Điện › Vật tư Điện');

    // Changing to a distinct valid description clears the warning and submits cleanly
    await act(async () => {
      setInputValue(nameInput, 'Máy biến áp');
    });
    expect(dialog.querySelector('.supplier-group-form__warn')).toBeNull();

    const form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Máy biến áp',
      description: null,
      parentGroupId: 1,
    });

    // Warning itself is strictly non-blocking if user intentionally keeps the text
    await act(async () => {
      addChildBtn.click();
    });
    await flush();
    const reopenDialog = document.body.querySelector('[role="dialog"]')!;
    const reopenInput = reopenDialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(reopenInput, 'vat tu dien');
    });
    expect(reopenDialog.querySelector('.supplier-group-form__warn')).not.toBeNull();
    const reopenForm = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      reopenForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(createMutateAsync).toHaveBeenLastCalledWith({
      name: 'vat tu dien',
      description: null,
      parentGroupId: 1,
    });
  });

  it('shows live inline duplicate errors and blocks submit for duplicate siblings and duplicate batch child rows', async () => {
    await renderPage();

    // 1. Single-child sibling duplicate
    const addChildBtn = container.querySelector(
      'button[aria-label="Thêm mô tả con cho Vật tư Điện"]',
    ) as HTMLButtonElement;
    await act(async () => {
      addChildBtn.click();
    });
    await flush();

    let dialog = document.body.querySelector('[role="dialog"]')!;
    const childNameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(childNameInput, '  dây cáp điện  ');
    });
    expect(dialog.textContent).toContain(
      'Mô tả "dây cáp điện" đã tồn tại trong nhóm "Vật tư Điện".',
    );

    let form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(createMutateAsync).not.toHaveBeenCalled();

    const cancelBtn = [...dialog.querySelectorAll('button')].find(b =>
      b.textContent?.trim() === 'Hủy',
    ) as HTMLButtonElement;
    await act(async () => {
      cancelBtn.click();
    });
    await flush();

    // 2. Batch mode: duplicate root and duplicate inline child rows
    const createRootBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.trim() === 'Tạo nhóm',
    ) as HTMLButtonElement;
    await act(async () => {
      createRootBtn.click();
    });
    await flush();

    dialog = document.body.querySelector('[role="dialog"]')!;
    const rootNameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(rootNameInput, 'vật tư điện');
    });
    expect(dialog.textContent).toContain('Nhóm "vật tư điện" đã tồn tại.');

    await act(async () => {
      setInputValue(rootNameInput, 'Cơ điện lạnh');
    });

    const addSubBtn = [...dialog.querySelectorAll('button')].find(b =>
      b.textContent?.includes('+ Thêm mô tả'),
    ) as HTMLButtonElement;
    await act(async () => {
      addSubBtn.click();
      addSubBtn.click();
    });
    await flush();

    const sub1 = dialog.querySelector('input[aria-label="Mô tả con #1"]') as HTMLInputElement;
    const sub2 = dialog.querySelector('input[aria-label="Mô tả con #2"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(sub1, 'Cung cấp vật tư');
      setInputValue(sub2, 'cung cấp vật tư');
    });

    const rowErrors = [...dialog.querySelectorAll('.supplier-group-form__row-error')];
    expect(rowErrors.length).toBe(2);
    expect(rowErrors[0]!.textContent).toBe('Mô tả con bị trùng trong danh sách.');

    // Anti-repetition warning on sub-row matching parent name (non-blocking if distinct from sibling)
    await act(async () => {
      setInputValue(sub2, 'co dien lanh');
    });
    expect(dialog.querySelector('.supplier-group-form__row-error')).toBeNull();
    expect(dialog.querySelector('.supplier-group-form__warn')?.textContent).toContain(
      'Không cần lặp lại tên nhóm "Cơ điện lạnh"',
    );

    // Put duplicate back and verify submit is blocked
    await act(async () => {
      setInputValue(sub2, 'cung cấp vật tư');
    });
    form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(createMutateAsync).not.toHaveBeenCalled();

    // Remove duplicate draft row -> submit succeeds with 1 valid child description
    const removeBtn = dialog.querySelector(
      'button[aria-label="Xóa dòng mô tả #2"]',
    ) as HTMLButtonElement;
    await act(async () => {
      removeBtn.click();
    });
    await flush();

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Cơ điện lạnh',
      description: null,
      parentGroupId: null,
      subGroups: [{ id: null, name: 'Cung cấp vật tư', description: null }],
    });
  });

  it('editing an existing group preloads saved child descriptions inline as single-input rows, preserves legacy descriptions, and submits updateMutateAsync', async () => {
    await renderPage();

    const editParentBtn = container.querySelector(
      'button[aria-label="Sửa nhóm Vật tư Điện"]',
    ) as HTMLButtonElement;
    await act(async () => {
      editParentBtn.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    const subRows = [...dialog.querySelectorAll('.supplier-group-form__sub-row')];
    expect(subRows).toHaveLength(2);
    expect(subRows[0]!.querySelectorAll('input')).toHaveLength(1);
    expect(subRows[1]!.querySelectorAll('input')).toHaveLength(1);
    expect(subRows[0]!.textContent).toContain('Đã lưu');
    expect(subRows[1]!.textContent).toContain('Đã lưu');
    expect(dialog.querySelector('button[aria-label="Xóa dòng mô tả #1"]')).toBeNull();
    expect(dialog.querySelector('button[aria-label="Xóa dòng mô tả #2"]')).toBeNull();

    const firstChildInput = dialog.querySelector(
      'input[aria-label="Mô tả con #1"]',
    ) as HTMLInputElement;
    expect(firstChildInput.value).toBe('Dây cáp điện');

    // Clearing a saved child's description shows inline error and blocks submit
    await act(async () => {
      setInputValue(firstChildInput, '   ');
    });
    expect(dialog.querySelector('.supplier-group-form__row-error')?.textContent).toBe(
      'Vui lòng nhập mô tả con hoặc xóa dòng trống.',
    );
    const form = document.getElementById('supplier-group-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(updateMutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      setInputValue(firstChildInput, 'Dây cáp điện lực');
    });

    const addSubBtn = [...dialog.querySelectorAll('button')].find(b =>
      b.textContent?.includes('+ Thêm mô tả'),
    ) as HTMLButtonElement;
    await act(async () => {
      addSubBtn.click();
    });
    await flush();

    const newChildInput = dialog.querySelector(
      'input[aria-label="Mô tả con #3"]',
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(newChildInput);
    expect(dialog.querySelectorAll('.supplier-group-form__sub-row')[2]!.querySelectorAll('input')).toHaveLength(1);

    await act(async () => {
      setInputValue(newChildInput, 'Tủ điện trung thế');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 1,
      body: {
        name: 'Vật tư Điện',
        description: 'Thiết bị điện',
        parentGroupId: null,
        subGroups: [
          { id: 11, name: 'Dây cáp điện lực', description: 'Cáp hạ thế' },
          { id: 12, name: 'Đèn chiếu sáng', description: null },
          { id: null, name: 'Tủ điện trung thế', description: null },
        ],
      },
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã cập nhật nhóm và danh sách mô tả con');
  });
});
