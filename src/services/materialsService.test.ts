import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const put = vi.hoisted(() => vi.fn());
const patch = vi.hoisted(() => vi.fn());
const del = vi.hoisted(() => vi.fn());
const getBlob = vi.hoisted(() => vi.fn());
const postForm = vi.hoisted(() => vi.fn());
const saveBlob = vi.hoisted(() => vi.fn());

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get,
    post,
    put,
    patch,
    delete: del,
    getBlob,
    postForm,
  },
  saveBlob,
}));

import { materialsService } from './materialsService';

describe('materialsService.parseImportFile', () => {
  beforeEach(() => {
    postForm.mockReset();
  });

  it('calls endpoint without query params when sheetName is omitted', async () => {
    const file = new File(['content'], 'materials.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    postForm.mockResolvedValueOnce({
      totalRows: 10,
      validRowCount: 10,
      existingRowCount: 0,
      errorRowCount: 0,
      rows: [],
      errors: [],
      availableSheets: ['KHMH'],
      selectedSheet: 'KHMH',
    });

    const res = await materialsService.parseImportFile(file);

    expect(postForm).toHaveBeenCalledTimes(1);
    expect(postForm.mock.calls[0][0]).toBe('/api/warehouse/materials/parse-import-file');
    const formData = postForm.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('sheetName')).toBeNull();
    expect(res.selectedSheet).toBe('KHMH');
  });

  it('calls endpoint with encoded query param and form data when sheetName is provided', async () => {
    const file = new File(['content'], 'ke-hoach.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    postForm.mockResolvedValueOnce({
      totalRows: 5,
      validRowCount: 5,
      existingRowCount: 0,
      errorRowCount: 0,
      rows: [],
      errors: [],
      availableSheets: ['Sheet 1', 'KHMH'],
      selectedSheet: 'KHMH',
    });

    const res = await materialsService.parseImportFile(file, 'KHMH');

    expect(postForm).toHaveBeenCalledTimes(1);
    expect(postForm.mock.calls[0][0]).toBe('/api/warehouse/materials/parse-import-file?sheetName=KHMH');
    const formData = postForm.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('sheetName')).toBe('KHMH');
    expect(res.selectedSheet).toBe('KHMH');
  });
});
