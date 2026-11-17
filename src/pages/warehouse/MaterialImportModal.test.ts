import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MaterialImportModal from './MaterialImportModal';
import { materialsService } from '../../services/materialsService';
import type { MaterialImportParseResultDto } from '../../types/api/materialImportApi';

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    downloadImportTemplate: vi.fn(),
    parseImportFile: vi.fn(),
    importBatch: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

describe('MaterialImportModal Sheet Selection', () => {
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

  it('renders sheet dropdown when availableSheets has multiple sheets and allows sheet switching', async () => {
    const mockMultiSheetResult: MaterialImportParseResultDto = {
      totalRows: 2,
      validRowCount: 2,
      existingRowCount: 0,
      errorRowCount: 0,
      availableSheets: ['KHMH', 'Tong Hop Du An', 'Ghi Chu'],
      selectedSheet: 'KHMH',
      errors: [],
      rows: [
        {
          rowNumber: 2,
          materialCode: 'VT-KHMH-001',
          materialName: 'Vật tư KHMH',
          unit: 'Cái',
          isConsumable: false,
          isValid: true,
          isExisting: false,
          isNewCategory: false,
          errors: [],
          warnings: [],
        },
      ],
    };

    const mockSecondSheetResult: MaterialImportParseResultDto = {
      totalRows: 1,
      validRowCount: 1,
      existingRowCount: 0,
      errorRowCount: 0,
      availableSheets: ['KHMH', 'Tong Hop Du An', 'Ghi Chu'],
      selectedSheet: 'Tong Hop Du An',
      errors: [],
      rows: [
        {
          rowNumber: 2,
          materialCode: 'VT-TONGHOP-001',
          materialName: 'Vật tư tổng hợp',
          unit: 'Bộ',
          isConsumable: false,
          isValid: true,
          isExisting: false,
          isNewCategory: false,
          errors: [],
          warnings: [],
        },
      ],
    };

    vi.mocked(materialsService.parseImportFile)
      .mockResolvedValueOnce(mockMultiSheetResult)
      .mockResolvedValueOnce(mockSecondSheetResult);

    await act(async () => {
      root.render(
        createElement(MaterialImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onSuccess: vi.fn(),
        }),
      );
    });

    // Simulate file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: true,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check that parseImportFile was called with targetSheet undefined on initial load
    expect(materialsService.parseImportFile).toHaveBeenCalledWith(file, undefined);

    // Check that the sheet selector dropdown is rendered
    const select = document.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe('KHMH');
    expect(select.options[1].value).toBe('Tong Hop Du An');
    expect(select.options[2].value).toBe('Ghi Chu');
    expect(select.value).toBe('KHMH');

    // Check footer displays [KHMH]
    expect(document.body.textContent).toContain('[KHMH]');

    // Now change sheet to 'Tong Hop Du An'
    await act(async () => {
      select.value = 'Tong Hop Du An';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check that parseImportFile was re-invoked with the new sheet name
    expect(materialsService.parseImportFile).toHaveBeenCalledWith(file, 'Tong Hop Du An');
  });
});
