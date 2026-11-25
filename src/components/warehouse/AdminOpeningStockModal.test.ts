import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminOpeningStockModal from './AdminOpeningStockModal';
import { stockService } from '../../services/stockService';
import { projectsService } from '../../services/projectsService';
import { showToast } from '../ui/Toast';
import type { OpeningStockPreviewResponseDto } from '../../types/wms';

vi.mock('../../services/stockService', () => ({
  stockService: {
    downloadOpeningStockTemplate: vi.fn(),
    previewOpeningStock: vi.fn(),
    importOpeningStock: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
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

describe('AdminOpeningStockModal characterization', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [{ projectCode: 'DA-01', projectName: 'Lò Hơi A' } as never],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.clearAllMocks();
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [{ projectCode: 'DA-01', projectName: 'Lò Hơi A' } as never],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads template, previews Excel file with stats and error details modal, and imports into selected warehouse', async () => {
    vi.mocked(stockService.downloadOpeningStockTemplate).mockResolvedValueOnce(true);
    const preview: OpeningStockPreviewResponseDto = {
      totalRows: 2,
      validRows: 1,
      errorRows: 1,
      totalQty: 10,
      totalAmount: 500000,
      items: [
        {
          materialCode: 'VT-01',
          materialName: 'Ống thép đúc',
          unit: 'Mét',
          qty: 10,
          unitPrice: 50000,
          totalAmount: 500000,
          isValid: true,
        },
        {
          materialCode: 'VT-ERR',
          materialName: 'Mã sai',
          unit: 'Cái',
          qty: 0,
          unitPrice: 0,
          totalAmount: 0,
          isValid: false,
          error: 'Không tìm thấy mã vật tư',
        },
      ],
    };
    vi.mocked(stockService.previewOpeningStock).mockResolvedValueOnce(preview);
    vi.mocked(stockService.importOpeningStock).mockResolvedValueOnce({
      message: 'Thành công',
      ticketCode: 'NK-DK-001',
      importedCount: 1,
    } as never);

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(AdminOpeningStockModal, { isOpen: true, onClose, onSuccess }),
        ),
      );
    });
    await flush();

    const downloadBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Tải file mẫu Excel'),
    )!;
    await act(async () => {
      downloadBtn.click();
    });
    expect(stockService.downloadOpeningStockTemplate).toHaveBeenCalledTimes(1);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fakeFile = new File(['xlsx'], 'ton-dau-ky.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], writable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();

    expect(stockService.previewOpeningStock).toHaveBeenCalledWith(fakeFile, undefined);
    expect(document.body.textContent).toContain('VT-01');
    expect(document.body.textContent).toContain('VT-ERR');

    const errorDetailBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xem chi tiết & Sao chép danh sách lỗi'),
    )!;
    await act(async () => {
      errorDetailBtn.click();
    });
    expect(document.body.textContent).toContain('Chi tiết lỗi đối soát tồn kho đầu kỳ');

    const closeErrBtn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Đóng',
    )!;
    await act(async () => {
      closeErrBtn.click();
    });

    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xác nhận nhập (1 vật tư)'),
    )!;
    await act(async () => {
      confirmBtn.click();
    });
    await flush();

    expect(stockService.importOpeningStock).toHaveBeenCalledWith(fakeFile, undefined);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalled();
  });

  it('switches to project destination, renders SelectField, and re-previews when changing project', async () => {
    const preview: OpeningStockPreviewResponseDto = {
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      totalQty: 5,
      totalAmount: 250000,
      items: [
        {
          materialCode: 'VT-01',
          materialName: 'Ống thép đúc',
          unit: 'Mét',
          qty: 5,
          unitPrice: 50000,
          totalAmount: 250000,
          isValid: true,
        },
      ],
    };
    vi.mocked(stockService.previewOpeningStock).mockResolvedValue(preview);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(AdminOpeningStockModal, {
            isOpen: true,
            onClose: vi.fn(),
            onSuccess: vi.fn(),
          }),
        ),
      );
    });
    await flush();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fakeFile = new File(['xlsx'], 'ton-kho-da01.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], writable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();

    const projectTabBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Kho Dự Án'),
    )!;
    await act(async () => {
      projectTabBtn.click();
    });

    const selectEl = document.querySelector('select[aria-label="Chọn dự án nhận tồn kho"]') as HTMLSelectElement;
    expect(selectEl).not.toBeNull();
    expect(selectEl.textContent).toContain('DA-01 — Lò Hơi A');

    await act(async () => {
      selectEl.value = 'DA-01';
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();

    expect(stockService.previewOpeningStock).toHaveBeenLastCalledWith(fakeFile, 'DA-01');
  });
});
