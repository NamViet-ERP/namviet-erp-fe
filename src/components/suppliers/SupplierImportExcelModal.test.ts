import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierImportExcelModal from './SupplierImportExcelModal';
import { suppliersService } from '../../services/suppliersService';
import type { SupplierImportPreviewResponseDto } from '../../types/wms';

vi.mock('../../services/suppliersService', () => ({
  suppliersService: {
    downloadTemplate: vi.fn(),
    previewImportExcel: vi.fn(),
    importExcel: vi.fn(),
  },
}));

vi.mock('../ui/Toast', () => ({
  showToast: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('SupplierImportExcelModal characterization', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('supports template download, multi-sheet switching, filtering, and Excel import confirmation', async () => {
    vi.mocked(suppliersService.downloadTemplate).mockResolvedValueOnce(true as never);
    const firstSheet: SupplierImportPreviewResponseDto = {
      totalRows: 2,
      validRows: 1,
      errorRows: 1,
      availableSheets: ['DanhSachNCC', 'GhiChu'],
      selectedSheet: 'DanhSachNCC',
      rows: [
        {
          supplierCode: 'NCC-01',
          supplierName: 'Công ty Thép Hòa Phát',
          taxCode: '0101248141',
          contactPhone: '02439747751',
          supplierType: 'Nhà sản xuất',
          scope: 'Nội địa',
          maxDebtDays: 30,
          industryGroups: 'Thép',
          isValid: true,
        },
        {
          supplierCode: '',
          supplierName: 'NCC Lỗi MST',
          taxCode: '123',
          maxDebtDays: 30,
          isValid: false,
          error: 'Mã số thuế không hợp lệ',
        },
      ],
    };
    const secondSheet: SupplierImportPreviewResponseDto = {
      ...firstSheet,
      selectedSheet: 'GhiChu',
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      rows: [firstSheet.rows[0]!],
    };
    vi.mocked(suppliersService.previewImportExcel)
      .mockResolvedValueOnce(firstSheet)
      .mockResolvedValueOnce(secondSheet);
    vi.mocked(suppliersService.importExcel).mockResolvedValueOnce({
      importedCount: 1,
      errors: [],
    } as never);

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(createElement(SupplierImportExcelModal, { isOpen: true, onClose, onSuccess }));
    });

    const downloadBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Tải file mẫu Excel'),
    )!;
    await act(async () => {
      downloadBtn.click();
    });
    expect(suppliersService.downloadTemplate).toHaveBeenCalledTimes(1);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fakeFile = new File(['xlsx'], 'ncc.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], writable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();

    expect(document.body.textContent).toContain('Công ty Thép Hòa Phát');
    const sheetSelect = document.querySelector('select') as HTMLSelectElement;
    expect(sheetSelect).not.toBeNull();
    await act(async () => {
      sheetSelect.value = 'GhiChu';
      sheetSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    expect(suppliersService.previewImportExcel).toHaveBeenLastCalledWith(fakeFile, 'GhiChu');

    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xác nhận nhập (1 NCC)'),
    )!;
    await act(async () => {
      confirmBtn.click();
    });
    await flush();

    expect(suppliersService.importExcel).toHaveBeenCalledWith(fakeFile, 'GhiChu');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
