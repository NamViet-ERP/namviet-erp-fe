import { describe, expect, it } from 'vitest';
import { validateImportCreate, getImportFormFieldErrors } from './importFormSchema';
import { validateExportCreate, getExportFormFieldErrors } from './exportFormSchema';
import { validateTransferCreate, getTransferFormFieldErrors } from './transferFormSchema';
import {
  DUPLICATE_MATERIAL_MESSAGE,
  findDuplicateMaterialLineIndex,
  getDuplicateMaterialLineErrors,
} from './voucherDuplicateMaterial';

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

describe('voucherDuplicateMaterial', () => {
  const items = [
    { materialCode: 'VT-001', qty: '10', unitPrice: '1000' },
    { materialCode: 'VT-002', qty: '5', unitPrice: '2000' },
    { materialCode: 'vt-001', qty: '3', unitPrice: '3000' },
  ];

  it('finds earlier duplicate line index case-insensitively', () => {
    expect(findDuplicateMaterialLineIndex(items, 'VT-001', 2)).toBe(0);
    expect(findDuplicateMaterialLineIndex(items, 'VT-002', 1)).toBeNull();
  });

  it('flags only later duplicate lines', () => {
    const errors = getDuplicateMaterialLineErrors(items);
    expect(errors[2]?.materialCode).toBe(DUPLICATE_MATERIAL_MESSAGE);
    expect(errors[0]).toBeUndefined();
  });
});

describe('getImportFormFieldErrors duplicate materials', () => {
  it('includes duplicate line errors on submit', () => {
    const errors = getImportFormFieldErrors(
      'PRJ-01',
      'PO-1',
      'NCC A',
      true,
      [
        { materialCode: 'VT-001', qty: '10', unitPrice: '1000' },
        { materialCode: 'VT-001', qty: '5', unitPrice: '2000' },
      ],
    );
    expect(errors.lineErrors?.[1]?.materialCode).toBe(DUPLICATE_MATERIAL_MESSAGE);
  });
});

describe('getExportFormFieldErrors duplicate materials', () => {
  it('includes duplicate line errors on submit', () => {
    const errors = getExportFormFieldErrors('PRJ-01', [
      { materialCode: 'VT-001', qty: '10' },
      { materialCode: 'VT-001', qty: '5' },
    ]);
    expect(errors.lineErrors?.[1]?.materialCode).toBe(DUPLICATE_MATERIAL_MESSAGE);
  });
});

describe('getTransferFormFieldErrors duplicate materials', () => {
  it('includes duplicate line errors on submit', () => {
    const errors = getTransferFormFieldErrors(
      'PRJ-01',
      'PRJ-02',
      'cross-project',
      [
        { materialCode: 'VT-001', qty: '10' },
        { materialCode: 'VT-001', qty: '5' },
      ],
    );
    expect(errors.lineErrors?.[1]?.materialCode).toBe(DUPLICATE_MATERIAL_MESSAGE);
  });
});
