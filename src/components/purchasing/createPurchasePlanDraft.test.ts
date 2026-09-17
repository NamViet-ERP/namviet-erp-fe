import { describe, expect, it } from 'vitest';
import {
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  toApiLines,
} from './createPurchasePlanDraft';
import type { PurchasePlanLineApiDto } from '../../types/api/purchasingApi';

describe('createPurchasePlanDraft', () => {
  it('creates an empty line with defaults', () => {
    const line = emptyLine();
    expect(line.materialCode).toBe('');
    expect(line.quantity).toBe('1');
    expect(line.quotes).toEqual([]);
  });

  it('converts preview lines into draft lines', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 2,
        lineNo: 1,
        isValid: true,
        materialCode: 'VT-001',
        productName: 'Thép tấm',
        unit: 'Tấm',
        quantity: 10,
        quotes: [],
      },
      {
        rowNumber: 3,
        lineNo: 2,
        isValid: false,
        materialCode: '',
        productName: 'Lỗi',
        unit: '',
        quantity: 0,
        quotes: [],
      },
    ]);

    expect(drafts).toHaveLength(1);
    expect(drafts[0].materialCode).toBe('VT-001');
    expect(drafts[0].productName).toBe('Thép tấm');
    expect(drafts[0].quantity).toBe('10');
  });

  it('returns [emptyLine()] if preview lines are empty or invalid', () => {
    const drafts = fromPreviewLines([]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].materialCode).toBe('');
  });

  it('maps existing plan lines to draft lines', () => {
    const existing: PurchasePlanLineApiDto[] = [
      {
        id: 101,
        lineNo: 1,
        materialCode: 'VT-999',
        productName: 'Ống thép đúc',
        unit: 'Ống',
        quantity: 5,
        orderedQty: 0,
        receivedQty: 0,
        defectQty: 0,
        remainingOrderableQty: 5,
        budgetUnitPrice: 20000,
        quotes: [
          {
            id: 1,
            supplierName: 'NCC A',
            unitPrice: 19000,
            amount: 95000,
            sortOrder: 1,
          },
        ],
      },
    ];

    const drafts = fromExistingPlanLines(existing);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].key).toBe('line-101');
    expect(drafts[0].materialCode).toBe('VT-999');
    expect(drafts[0].productName).toBe('Ống thép đúc');
    expect(drafts[0].budgetUnitPrice).toBe('20000');
    expect(drafts[0].quotes).toHaveLength(1);
    expect(drafts[0].quotes[0].supplierName).toBe('NCC A');
  });

  it('returns [emptyLine()] when existing plan lines are null or empty', () => {
    expect(fromExistingPlanLines(null)).toHaveLength(1);
    expect(fromExistingPlanLines([])).toHaveLength(1);
  });

  it('filters invalid lines when converting to API lines', () => {
    const lines = [
      {
        ...emptyLine(),
        materialCode: 'VT-001',
        unit: 'Cái',
        quantity: '5',
      },
      emptyLine(), // invalid
    ];

    const apiLines = toApiLines(lines);
    expect(apiLines).toHaveLength(1);
    expect(apiLines[0].materialCode).toBe('VT-001');
    expect(apiLines[0].quantity).toBe(5);
  });
});
