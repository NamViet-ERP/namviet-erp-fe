import { act, createElement, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PurchasePlanCreateImportBar from './PurchasePlanCreateImportBar';
import type { PurchasePlanImportPreviewApiDto } from '../../types/api/purchasingApi';

describe('PurchasePlanCreateImportBar with Error Details Modal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{} as DOMRect] as unknown as DOMRectList);
    vi.stubGlobal('scrollIntoView', vi.fn());
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
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

  const mockPreviewWithErrors: PurchasePlanImportPreviewApiDto = {
    projectCode: 'DA-2026-001',
    sheetName: 'KeHoachThang10',
    totalRows: 298,
    validRowCount: 235,
    errorRowCount: 63,
    mappedColumns: [],
    lines: [],
    errors: [
      { rowNumber: 9, field: 'itemCode', message: 'Thiếu mã vật tư' },
      { rowNumber: 9, field: 'quantity', message: 'Số lượng phải > 0' },
      { rowNumber: 15, field: 'unitName', message: 'Đơn vị tính không hợp lệ' },
      { rowNumber: 22, field: 'itemCode', message: 'Mã vật tư không tồn tại' },
      { rowNumber: 30, field: 'quantity', message: 'Số lượng không được để trống' },
      { rowNumber: 45, field: 'itemCode', message: 'Dòng tiêu đề phân nhóm không hợp lệ' },
      { rowNumber: 50, field: 'note', message: 'Ghi chú vượt quá ký tự' },
    ],
  };

  const defaultProps = {
    busy: false,
    file: new File([''], 'KHMH_T10_2026.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    preview: mockPreviewWithErrors,
    fileInputRef: createRef<HTMLInputElement | null>(),
    templatePending: false,
    previewPending: false,
    onDownloadTemplate: vi.fn(),
    onFileChange: vi.fn(),
    onImport: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders preview summary with error count and interactive button', async () => {
    await act(() => root.render(createElement(PurchasePlanCreateImportBar, defaultProps)));

    const errorCountSpan = container.querySelector('.pur-create-plan__preview-error');
    expect(errorCountSpan).toBeTruthy();
    expect(errorCountSpan?.textContent).toContain('63');

    const viewDetailBtn = container.querySelector('.pur-create-plan__preview-error button');
    expect(viewDetailBtn).toBeTruthy();
    expect(viewDetailBtn?.textContent).toContain('Xem chi tiết 7 lỗi');

    // 5 errors shown in list
    const errorItems = container.querySelectorAll('.pur-create-plan__preview-errors li');
    expect(errorItems.length).toBe(6); // 5 errors + 1 "more" button

    const moreButton = container.querySelector('.pur-create-plan__error-more button');
    expect(moreButton).toBeTruthy();
    expect(moreButton?.textContent).toContain('…và 2 lỗi khác (Bấm để xem chi tiết toàn bộ 7 lỗi)');
  });

  it('opens error details modal when clicking on more errors button', async () => {
    await act(() => root.render(createElement(PurchasePlanCreateImportBar, defaultProps)));

    const moreButton = container.querySelector('.pur-create-plan__error-more button') as HTMLButtonElement;
    expect(moreButton).toBeTruthy();

    await act(() => {
      moreButton.click();
    });

    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('Chi tiết lỗi Import Excel (7 lỗi trên 63 dòng)');
    expect(modal?.textContent).toContain('KHMH_T10_2026.xlsx');
    expect(modal?.textContent).toContain('KeHoachThang10');
    expect(modal?.textContent).toContain('Hệ thống đã tự động lọc bỏ các dòng lỗi này');

    // Check table rows inside modal (7 error rows)
    const tableRows = modal?.querySelectorAll('tbody tr');
    expect(tableRows?.length).toBe(7);
  });

  it('filters errors by search keyword in modal', async () => {
    await act(() => root.render(createElement(PurchasePlanCreateImportBar, defaultProps)));

    const viewDetailBtn = container.querySelector('.pur-create-plan__preview-error button') as HTMLButtonElement;
    await act(() => {
      viewDetailBtn.click();
    });

    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    // Filter by row number "45"
    await act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(searchInput, '45');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const modal = document.querySelector('[role="dialog"]');
    const tableRows = modal?.querySelectorAll('tbody tr');
    expect(tableRows?.length).toBe(1);
    expect(tableRows?.[0].textContent).toContain('Dòng 45');
    expect(tableRows?.[0].textContent).toContain('Dòng tiêu đề phân nhóm');
  });

  it('copies error list to clipboard when clicking copy button', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(() => root.render(createElement(PurchasePlanCreateImportBar, defaultProps)));

    const viewDetailBtn = container.querySelector('.pur-create-plan__preview-error button') as HTMLButtonElement;
    await act(() => {
      viewDetailBtn.click();
    });

    const copyBtn = document.querySelector('button[title*="Sao chép"]') as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      copyBtn.click();
    });

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain('Dòng 9: [itemCode] Thiếu mã vật tư');
  });

  it('closes modal when clicking close button', async () => {
    await act(() => root.render(createElement(PurchasePlanCreateImportBar, defaultProps)));

    const viewDetailBtn = container.querySelector('.pur-create-plan__preview-error button') as HTMLButtonElement;
    await act(() => {
      viewDetailBtn.click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeTruthy();

    const closeBtn = document.querySelector('.md-dialog__footer button') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.textContent).toContain('Đóng');

    await act(() => {
      closeBtn.click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
