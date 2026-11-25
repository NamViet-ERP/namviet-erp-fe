import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServiceExpenseImportModal from './ServiceExpenseImportModal';
import { serviceExpenseItemsService } from '../../services/serviceExpenseItemsService';
import type {
  ServiceExpenseImportParseResultDto,
  ServiceExpenseImportRowDto,
} from '../../types/api/serviceExpenseItem';

vi.mock('../../services/serviceExpenseItemsService', () => ({
  serviceExpenseItemsService: {
    downloadImportTemplate: vi.fn(),
    parseImportFile: vi.fn(),
    importBatch: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

describe('ServiceExpenseImportModal Defensive Rendering', () => {
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
  });

  it('renders preview rows safely without crashing even if row.errors is undefined or backend format is raw', async () => {
    type RawImportRow = Omit<ServiceExpenseImportRowDto, 'errors' | 'warnings'> & {
      errors?: string[];
      warnings?: string[];
    };
    type RawParseResult = Omit<ServiceExpenseImportParseResultDto, 'rows'> & {
      rows: RawImportRow[];
    };
    const mockParseResult: RawParseResult = {
      totalRows: 2,
      validRowCount: 1,
      existingRowCount: 0,
      errorRowCount: 1,
      errors: [],
      rows: [
        {
          rowNumber: 2,
          code: 'DV-OK-01',
          name: 'Dịch vụ hợp lệ',
          type: 'service',
          unit: 'Chuyến',
          referencePrice: 1500000,
          description: 'Mô tả test',
          isValid: true,
          isExisting: false,
          // errors is intentionally undefined to test defensive rendering
        },
        {
          rowNumber: 3,
          code: 'DV-ERR-01',
          name: 'Dịch vụ lỗi',
          type: 'expense',
          unit: 'Gói',
          referencePrice: null,
          description: null,
          isValid: false,
          isExisting: false,
          errorMessage: 'Đơn vị tính không hợp lệ',
          // errors is intentionally undefined to simulate backend raw response
        },
      ],
    };

    vi.mocked(serviceExpenseItemsService.parseImportFile).mockResolvedValueOnce(
      mockParseResult as unknown as ServiceExpenseImportParseResultDto,
    );

    await act(async () => {
      root.render(
        createElement(ServiceExpenseImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onSuccess: vi.fn(),
        }),
      );
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const fakeFile = new File(['test'], 'dich-vu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Simulate selecting file
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [fakeFile],
        writable: true,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check that table rendered and did not crash
    expect(document.body.textContent).toContain('DV-OK-01');
    expect(document.body.textContent).toContain('DV-ERR-01');
    expect(document.body.textContent).toContain('Hợp lệ');
    expect(document.body.textContent).toContain('Lỗi');
    expect(document.body.textContent).toContain('Đơn vị tính không hợp lệ');

    // Confirm that statistics show 1 valid, 1 error
    expect(document.body.textContent).toContain('Xác nhận nhập (1 mục)');
  });
});
