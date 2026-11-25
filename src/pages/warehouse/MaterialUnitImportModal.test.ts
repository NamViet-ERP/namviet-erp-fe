import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MaterialUnitImportModal from './MaterialUnitImportModal';
import { materialUnitsService } from '../../services/materialUnitsService';
import type { MaterialUnitImportParseResultDto, MaterialUnitImportResultDto } from '../../types/wms';

vi.mock('../../services/materialUnitsService', () => ({
  materialUnitsService: {
    downloadImportTemplate: vi.fn(),
    parseImportFile: vi.fn(),
    importBatch: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('MaterialUnitImportModal characterization', () => {
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

  it('parses file preview, toggles overwriteExisting, and confirms batch import', async () => {
    vi.mocked(materialUnitsService.downloadImportTemplate).mockResolvedValueOnce(true);
    const parseResult: MaterialUnitImportParseResultDto = {
      totalRows: 2,
      validRowCount: 2,
      existingRowCount: 1,
      errorRowCount: 0,
      errors: [],
      rows: [
        { rowNumber: 2, name: 'Cái', sortOrder: 1, isActive: true, isValid: true, isExisting: true, errorMessage: null },
        { rowNumber: 3, name: 'Bộ', sortOrder: 2, isActive: true, isValid: true, isExisting: false, errorMessage: null },
      ],
    };
    const importResult: MaterialUnitImportResultDto = {
      createdCount: 1,
      updatedCount: 1,
      skippedCount: 0,
      totalProcessed: 2,
      importedNames: ['Bộ'],
      errors: [],
    };
    vi.mocked(materialUnitsService.parseImportFile).mockResolvedValueOnce(parseResult);
    vi.mocked(materialUnitsService.importBatch).mockResolvedValueOnce(importResult);

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(createElement(MaterialUnitImportModal, { isOpen: true, onClose, onSuccess }));
    });

    const downloadBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Tải file mẫu Excel'),
    )!;
    await act(async () => {
      downloadBtn.click();
    });
    expect(materialUnitsService.downloadImportTemplate).toHaveBeenCalledTimes(1);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fakeFile = new File(['csv'], 'dvt.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], writable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();

    expect(document.body.textContent).toContain('Cái');
    expect(document.body.textContent).toContain('Bộ');

    const overwriteCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(overwriteCheckbox).not.toBeNull();
    await act(async () => {
      overwriteCheckbox.click();
    });

    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xác nhận nhập (2)'),
    )!;
    await act(async () => {
      confirmBtn.click();
    });
    await flush();

    expect(materialUnitsService.importBatch).toHaveBeenCalledWith({
      rows: parseResult.rows,
      overwriteExisting: true,
    });
    expect(onSuccess).toHaveBeenCalledWith(importResult);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
