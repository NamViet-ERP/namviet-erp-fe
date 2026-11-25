import { describe, expect, it, vi } from 'vitest';
import { buildCsvContent, downloadCsv, downloadCsvContent, escapeCsvCell } from './csvExport';
import * as apiClientModule from './apiClient';

describe('csvExport', () => {
  it('escapes quotes and formats UTF-8 BOM CSV output', () => {
    expect(escapeCsvCell('A "B"')).toBe('"A ""B"""');
    expect(escapeCsvCell(null)).toBe('""');
    expect(buildCsvContent(['Ma', 'Ten'], [['VT-1', 'Ong "thep"']])).toBe(
      '\uFEFF"Ma","Ten"\n"VT-1","Ong ""thep"""',
    );
  });

  it('delegates CSV Blob downloading to saveBlob', async () => {
    const spy = vi.spyOn(apiClientModule, 'saveBlob').mockResolvedValue(true);
    await downloadCsv('test.csv', ['Col'], [['Val']]);
    expect(spy).toHaveBeenCalledTimes(1);
    const [blob, name] = spy.mock.calls[0]!;
    expect(name).toBe('test.csv');
    expect(blob.type).toContain('text/csv');

    await downloadCsvContent('\uFEFFA,B', 'pre.csv');
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
