import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { materialBrandsService } from '../../services/materialBrandsService';
import { materialOriginsService } from '../../services/materialOriginsService';
import { materialRegionsService } from '../../services/materialRegionsService';
import type {
  MaterialBrandApiDto,
  MaterialOriginApiDto,
  MaterialRegionApiDto,
} from '../../types/wms';
import MaterialOriginsSettingsPanel from './MaterialOriginsSettingsPanel';

vi.mock('../../services/materialBrandsService', () => ({
  materialBrandsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../services/materialOriginsService', () => ({
  materialOriginsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../services/materialRegionsService', () => ({
  materialRegionsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockBrands: MaterialBrandApiDto[] = [
  { id: 1, name: 'Wilo', country: 'Đức', description: 'Bơm công nghiệp', sortOrder: 1, isActive: true },
  { id: 2, name: 'Hòa Phát', country: 'Việt Nam', description: 'Ống thép', sortOrder: 2, isActive: false },
];

const mockOrigins: MaterialOriginApiDto[] = [
  { id: 11, name: 'Đức', region: 'G7', sortOrder: 1, isActive: true },
  { id: 12, name: 'Việt Nam', region: 'ĐNA', sortOrder: 2, isActive: true },
];

const mockRegions: MaterialRegionApiDto[] = [
  { id: 21, name: 'G7', description: 'Khối 7 nước công nghiệp', sortOrder: 1, isActive: true },
  { id: 22, name: 'ĐNA', description: 'Đông Nam Á', sortOrder: 2, isActive: true },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('MaterialOriginsSettingsPanel characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(materialBrandsService.list).mockResolvedValue(mockBrands);
    vi.mocked(materialOriginsService.list).mockResolvedValue(mockOrigins);
    vi.mocked(materialRegionsService.list).mockResolvedValue(mockRegions);

    vi.mocked(materialBrandsService.create).mockResolvedValue({
      id: 3,
      name: 'Ebara',
      country: 'Nhật Bản',
      description: null,
      sortOrder: 3,
      isActive: true,
    });
    vi.mocked(materialBrandsService.update).mockResolvedValue(mockBrands[0]);
    vi.mocked(materialBrandsService.remove).mockResolvedValue(undefined);

    vi.mocked(materialOriginsService.create).mockResolvedValue({
      id: 13,
      name: 'Nhật Bản',
      region: 'G7',
      sortOrder: 3,
      isActive: true,
    });
    vi.mocked(materialOriginsService.update).mockResolvedValue(mockOrigins[0]);
    vi.mocked(materialOriginsService.remove).mockResolvedValue(undefined);

    vi.mocked(materialRegionsService.create).mockResolvedValue({
      id: 23,
      name: 'EU',
      description: 'Liên minh Châu Âu',
      sortOrder: 3,
      isActive: true,
    });
    vi.mocked(materialRegionsService.update).mockResolvedValue(mockRegions[0]);
    vi.mocked(materialRegionsService.remove).mockResolvedValue(undefined);

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

  async function renderPanel() {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(MaterialOriginsSettingsPanel)),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  function clickButtonByText(text: string) {
    const btn = [...document.body.querySelectorAll('button')].find(
      b => b.textContent?.includes(text),
    );
    expect(btn).toBeDefined();
    btn!.click();
  }

  it('supports brands tab search filter, create, edit modal, and delete confirm dialog', async () => {
    await renderPanel();

    expect(container.textContent).toContain('Nhãn hiệu / Hãng (2)');
    expect(container.textContent).toContain('Nước sản xuất (2)');
    expect(container.textContent).toContain('Nhóm nước (2)');
    expect(container.textContent).toContain('Wilo');
    expect(container.textContent).toContain('Hòa Phát');

    // Search filter
    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    await act(async () => {
      setInputValue(searchInput, 'Wilo');
    });
    const gridAfterFilter = container.querySelector('.hrm-recruitment-positions-grid') as HTMLElement;
    expect(gridAfterFilter.textContent).toContain('Wilo');
    expect(gridAfterFilter.textContent).not.toContain('Hòa Phát');

    await act(async () => {
      setInputValue(searchInput, '');
    });

    // Create brand
    const nameInput = container.querySelector('input[placeholder*="Tên hãng/nhãn hiệu"]') as HTMLInputElement;
    const countryInput = container.querySelector('input[placeholder="Quốc gia (tuỳ chọn)"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'Ebara');
      setInputValue(countryInput, 'Nhật Bản');
    });
    await act(async () => {
      nameInput.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(materialBrandsService.create).toHaveBeenCalledWith({
      name: 'Ebara',
      country: 'Nhật Bản',
      isActive: true,
    });

    // Edit brand modal
    const editBtn = container.querySelector('button[aria-label="Sửa nhãn hiệu Wilo"]') as HTMLButtonElement;
    await act(async () => {
      editBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Sửa nhãn hiệu / hãng');
    const modalNameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(modalNameInput, 'Wilo SE');
    });
    await act(async () => {
      const saveBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu');
      saveBtn!.click();
    });
    expect(materialBrandsService.update).toHaveBeenCalledWith(1, {
      name: 'Wilo SE',
      country: 'Đức',
      description: 'Bơm công nghiệp',
      sortOrder: 1,
      isActive: true,
    });

    // Delete brand dialog
    const deleteBtn = container.querySelector('button[aria-label="Xóa nhãn hiệu Wilo"]') as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Xóa nhãn hiệu');
    await act(async () => {
      const confirmBtn = [...alertDialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Xóa');
      confirmBtn!.click();
    });
    expect(materialBrandsService.remove).toHaveBeenCalledWith(1);
  });

  it('switches to countries tab and supports search, create, edit, and delete', async () => {
    await renderPanel();

    await act(async () => {
      clickButtonByText('Nước sản xuất (2)');
    });

    expect(container.textContent).toContain('Đức');
    expect(container.textContent).toContain('Việt Nam');

    // Filter
    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(searchInput, 'Đức');
    });
    expect(container.textContent).toContain('Đức');
    expect(container.textContent).not.toContain('Việt Nam');
    await act(async () => {
      setInputValue(searchInput, '');
    });

    // Create origin
    const nameInput = container.querySelector('input[placeholder*="Tên quốc gia"]') as HTMLInputElement;
    const regionSelect = container.querySelector('select.hrm-field-select') as HTMLSelectElement;
    await act(async () => {
      setInputValue(nameInput, 'Nhật Bản');
      setSelectValue(regionSelect, 'G7');
    });
    await act(async () => {
      nameInput.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(materialOriginsService.create).toHaveBeenCalledWith({
      name: 'Nhật Bản',
      region: 'G7',
      isActive: true,
    });

    // Edit origin modal
    const editBtn = container.querySelector('button[aria-label="Sửa xuất xứ Đức"]') as HTMLButtonElement;
    await act(async () => {
      editBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Sửa nước sản xuất');
    const modalNameInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    await act(async () => {
      setInputValue(modalNameInput, 'CHLB Đức');
    });
    await act(async () => {
      const saveBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu');
      saveBtn!.click();
    });
    expect(materialOriginsService.update).toHaveBeenCalledWith(11, {
      name: 'CHLB Đức',
      region: 'G7',
      sortOrder: 1,
      isActive: true,
    });

    // Delete origin
    const deleteBtn = container.querySelector('button[aria-label="Xóa xuất xứ Đức"]') as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog.textContent).toContain('Xóa xuất xứ');
    await act(async () => {
      const confirmBtn = [...alertDialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Xóa');
      confirmBtn!.click();
    });
    expect(materialOriginsService.remove).toHaveBeenCalledWith(11);
  });

  it('switches to regions tab and supports search, create, edit, and delete', async () => {
    await renderPanel();

    await act(async () => {
      clickButtonByText('Nhóm nước (2)');
    });

    expect(container.textContent).toContain('G7');
    expect(container.textContent).toContain('ĐNA');

    // Filter
    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(searchInput, 'ĐNA');
    });
    const gridAfterFilter = container.querySelector('.hrm-recruitment-positions-grid') as HTMLElement;
    expect(gridAfterFilter.textContent).toContain('ĐNA');
    expect(gridAfterFilter.textContent).not.toContain('G7');
    await act(async () => {
      setInputValue(searchInput, '');
    });

    // Create region
    const nameInput = container.querySelector('input[placeholder*="Tên nhóm nước"]') as HTMLInputElement;
    const descInput = container.querySelector('input[placeholder*="Mô tả / Ghi chú"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'EU');
      setInputValue(descInput, 'Liên minh Châu Âu');
    });
    await act(async () => {
      nameInput.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(materialRegionsService.create).toHaveBeenCalledWith({
      name: 'EU',
      description: 'Liên minh Châu Âu',
      isActive: true,
    });

    // Edit region modal
    const editBtn = container.querySelector('button[aria-label="Sửa nhóm nước G7"]') as HTMLButtonElement;
    await act(async () => {
      editBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Sửa nhóm nước');
    const inputs = dialog.querySelectorAll('input.form-input') as NodeListOf<HTMLInputElement>;
    await act(async () => {
      setInputValue(inputs[1], 'Khối G7 cập nhật');
    });
    await act(async () => {
      const saveBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu');
      saveBtn!.click();
    });
    expect(materialRegionsService.update).toHaveBeenCalledWith(21, {
      name: 'G7',
      description: 'Khối G7 cập nhật',
      sortOrder: 1,
      isActive: true,
    });

    // Delete region
    const deleteBtn = container.querySelector('button[aria-label="Xóa nhóm nước G7"]') as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog.textContent).toContain('Xóa nhóm nước');
    await act(async () => {
      const confirmBtn = [...alertDialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Xóa');
      confirmBtn!.click();
    });
    expect(materialRegionsService.remove).toHaveBeenCalledWith(21);
  });
});
