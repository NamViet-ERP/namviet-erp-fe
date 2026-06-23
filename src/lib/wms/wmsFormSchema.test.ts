import { describe, expect, it } from 'vitest';
import { validateImportCreate } from './importFormSchema';
import { validateExportCreate } from './exportFormSchema';
import { validateTransferCreate } from './transferFormSchema';

describe('validateImportCreate', () => {
  it('accepts valid project and line items', () => {
    const result = validateImportCreate('PRJ-01', [
      { materialCode: 'VT-001', qty: '2', unitPrice: '10000' },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects empty project', () => {
    const result = validateImportCreate('', [
      { materialCode: 'VT-001', qty: '1', unitPrice: '0' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = validateImportCreate('PRJ-01', [
      { materialCode: 'VT-001', qty: '0', unitPrice: '1000' },
    ]);
    expect(result.success).toBe(false);
  });
});

describe('validateExportCreate', () => {
  it('accepts valid export lines', () => {
    const result = validateExportCreate('PRJ-01', [
      { materialCode: 'VT-001', qty: '3' },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects missing project', () => {
    const result = validateExportCreate('', [
      { materialCode: 'VT-001', qty: '1' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects empty items', () => {
    const result = validateExportCreate('PRJ-01', []);
    expect(result.success).toBe(false);
  });
});

describe('validateTransferCreate', () => {
  it('accepts valid transfer lines', () => {
    const result = validateTransferCreate('PRJ-01', [
      { materialCode: 'VT-001', qty: '5' },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects missing source project', () => {
    const result = validateTransferCreate('', [
      { materialCode: 'VT-001', qty: '1' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects invalid quantity', () => {
    const result = validateTransferCreate('PRJ-01', [
      { materialCode: 'VT-001', qty: '' },
    ]);
    expect(result.success).toBe(false);
  });
});
