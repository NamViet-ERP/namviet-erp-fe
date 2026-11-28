import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';
import SupplierGroupTreePicker from './SupplierGroupTreePicker';

function makeGroup(
  overrides: Partial<SupplierGroupApiDto> & Pick<SupplierGroupApiDto, 'id' | 'name'>,
): SupplierGroupApiDto {
  return {
    description: null,
    supplierCount: 0,
    parentGroupId: null,
    parentGroupName: null,
    childCount: 0,
    ...overrides,
  };
}

const sampleGroups: SupplierGroupApiDto[] = [
  makeGroup({ id: 1, name: 'Vật tư Điện', description: 'Thiết bị điện', childCount: 2 }),
  makeGroup({
    id: 11,
    name: 'Dây cáp điện',
    description: 'Cáp hạ thế',
    parentGroupId: 1,
    parentGroupName: 'Vật tư Điện',
  }),
  makeGroup({
    id: 12,
    name: 'Đèn chiếu sáng',
    description: 'Đèn LED công nghiệp',
    parentGroupId: 1,
    parentGroupName: 'Vật tư Điện',
  }),
  makeGroup({ id: 2, name: 'Cơ khí & Thép', description: 'Vật tư thép', childCount: 2 }),
  makeGroup({
    id: 21,
    name: 'Thép hình',
    parentGroupId: 2,
    parentGroupName: 'Cơ khí & Thép',
  }),
  makeGroup({
    id: 22,
    name: 'Thép tấm',
    parentGroupId: 2,
    parentGroupName: 'Cơ khí & Thép',
  }),
  makeGroup({ id: 3, name: 'Bảo hộ lao động', description: 'PPE công trường', childCount: 0 }),
];

let container: HTMLDivElement;
let root: Root;

async function renderPicker(props: {
  groups?: SupplierGroupApiDto[];
  selectedIds: number[];
  onChange?: (nextIds: number[]) => void;
  emptyMessage?: string;
}) {
  const onChange = props.onChange ?? vi.fn();
  await act(async () => {
    root.render(
      createElement(SupplierGroupTreePicker, {
        groups: props.groups ?? sampleGroups,
        selectedIds: props.selectedIds,
        onChange,
        emptyMessage: props.emptyMessage,
      }),
    );
  });
  return onChange;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
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

describe('SupplierGroupTreePicker', () => {
  it('renders EmptyState when groups list is empty', async () => {
    await renderPicker({
      groups: [],
      selectedIds: [],
      emptyMessage: 'Chưa có nhóm ngành hàng.',
    });

    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.textContent).toContain('Chưa có nhóm ngành hàng.');
  });

  it('expands only parents with selected children initially and allows accordion expand/collapse', async () => {
    await renderPicker({ selectedIds: [21] });

    // Cơ khí & Thép has child 21 selected -> expanded; Vật tư Điện unselected -> collapsed
    expect(container.textContent).toContain('Thép hình');
    expect(container.textContent).toContain('Thép tấm');
    expect(container.textContent).not.toContain('Dây cáp điện');

    const electricExpandBtn = container.querySelector(
      'button[aria-expanded][data-group-id="1"]',
    ) as HTMLButtonElement ?? [...container.querySelectorAll('button[aria-expanded]')].find(b =>
      b.textContent?.includes('Vật tư Điện'),
    ) as HTMLButtonElement;

    expect(electricExpandBtn).toBeDefined();
    expect(electricExpandBtn.getAttribute('aria-expanded')).toBe('false');
    expect(electricExpandBtn.textContent).toContain('2 mô tả');

    const steelExpandBtn = [...container.querySelectorAll('button[aria-expanded]')].find(b =>
      b.textContent?.includes('Cơ khí & Thép'),
    ) as HTMLButtonElement;
    expect(steelExpandBtn.getAttribute('aria-expanded')).toBe('true');
    expect(steelExpandBtn.textContent).toContain('1/2 đã chọn');

    await act(async () => {
      electricExpandBtn.click();
    });

    expect(electricExpandBtn.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Dây cáp điện');
    expect(container.textContent).toContain('Đèn chiếu sáng');

    await act(async () => {
      electricExpandBtn.click();
    });
    expect(electricExpandBtn.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).not.toContain('Dây cáp điện');
  });

  it('shows summary chips with Parent › Child paths, supports chip removal and Bỏ chọn tất cả', async () => {
    const onChange = await renderPicker({ selectedIds: [21, 3] });

    expect(container.textContent).toContain('Cơ khí & Thép › Thép hình');
    expect(container.textContent).toContain('Bảo hộ lao động');

    const removeFirstChip = container.querySelector(
      'button[aria-label="Bỏ chọn Cơ khí & Thép › Thép hình"]',
    ) as HTMLButtonElement;
    expect(removeFirstChip).not.toBeNull();

    await act(async () => {
      removeFirstChip.click();
    });
    expect(onChange).toHaveBeenCalledWith([3]);

    const clearAllBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Bỏ chọn tất cả'),
    ) as HTMLButtonElement;
    expect(clearAllBtn).toBeDefined();

    await act(async () => {
      clearAllBtn.click();
    });
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('sets 3-state parent checkbox (indeterminate/checked) and toggles all children + strips legacy parent', async () => {
    const onChange = await renderPicker({ selectedIds: [21] });

    const steelCheckbox = container.querySelector(
      'input[type="checkbox"][aria-label="Chọn tất cả mô tả trong Cơ khí & Thép"]',
    ) as HTMLInputElement;
    expect(steelCheckbox).not.toBeNull();
    expect(steelCheckbox.checked).toBe(false);
    expect(steelCheckbox.indeterminate).toBe(true);

    // Click indeterminate parent checkbox -> selects all children of Cơ khí & Thép
    await act(async () => {
      steelCheckbox.click();
    });
    expect(onChange).toHaveBeenCalledWith([21, 22]);

    // Re-render with all children selected -> checked state, clicking unselects all
    const onChangeAll = await renderPicker({ selectedIds: [21, 22, 3] });
    const steelCheckboxChecked = container.querySelector(
      'input[type="checkbox"][aria-label="Chọn tất cả mô tả trong Cơ khí & Thép"]',
    ) as HTMLInputElement;
    expect(steelCheckboxChecked.checked).toBe(true);
    expect(steelCheckboxChecked.indeterminate).toBe(false);

    await act(async () => {
      steelCheckboxChecked.click();
    });
    expect(onChangeAll).toHaveBeenCalledWith([3]);
  });

  it('auto-expands legacy bare-parent group, shows helper pill, and strips bare parent when ticking child', async () => {
    const onChange = await renderPicker({ selectedIds: [1] });

    expect(container.textContent).toContain('Đang gán nhóm chung — hãy tick mô tả cụ thể');
    expect(container.textContent).toContain('Dây cáp điện');

    const childLabel = [...container.querySelectorAll('label')].find(l =>
      l.textContent?.includes('Dây cáp điện'),
    )!;
    const childCheckbox = childLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      childCheckbox.click();
    });

    expect(onChange).toHaveBeenCalledWith([11]);
  });

  it('filters tree with Vietnamese diacritics normalization and auto-expands matching parents', async () => {
    await renderPicker({ selectedIds: [] });

    const searchInput = container.querySelector(
      'input[placeholder="Tìm nhóm hoặc mô tả…"]',
    ) as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    await act(async () => {
      setInputValue(searchInput, 'den chieu');
    });

    expect(container.textContent).toContain('Vật tư Điện');
    expect(container.textContent).toContain('Đèn chiếu sáng');
    expect(container.textContent).not.toContain('Dây cáp điện');
    expect(container.textContent).not.toContain('Cơ khí & Thép');

    await act(async () => {
      setInputValue(searchInput, 'khong-ton-tai');
    });
    expect(container.querySelector('.empty-state')).not.toBeNull();
  });
});
