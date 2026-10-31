import { describe, expect, it } from 'vitest';
import {
  currencyToDraft,
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  lineAmount,
  toApiLines,
} from './createPurchasePlanDraft';
import type { PurchasePlanLineApiDto } from '../../types/api/purchasingApi';

describe('createPurchasePlanDraft', () => {
  describe('lineAmount', () => {
    it('calculates amount with kgPerUnit when kgPerUnit > 0 (Dual-Mode: Steel / Structural)', () => {
      // Ví dụ SPEC: 1 tấm x 2434 kg x 26.000 đ = 63.284.000 đ
      expect(lineAmount('1', '26000', '2434')).toBe(63284000);
      // Ví dụ ống hàn: 4 cây x 200 kg x 18.527 đ = 14.821.600 đ
      expect(lineAmount('4', '18527', '200')).toBe(14821600);
      // Ví dụ ống hàn: 350 x 7 kg x 17.170 đ = 42.066.500 đ
      expect(lineAmount('350', '17170', '7')).toBe(42066500);
    });

    it('calculates amount without kgPerUnit or when kgPerUnit is 0 / empty (Dual-Mode: Standard items)', () => {
      // Bu lông, que hàn, van, sơn... không có kgPerUnit: SL x Đơn giá
      expect(lineAmount('10', '50000')).toBe(500000);
      expect(lineAmount('10', '50000', '')).toBe(500000);
      expect(lineAmount('10', '50000', '0')).toBe(500000);
      expect(lineAmount('10', '50000', undefined)).toBe(500000);
    });

    it('returns 0 when qty or unitPrice is invalid or <= 0', () => {
      expect(lineAmount('0', '50000', '200')).toBe(0);
      expect(lineAmount('-5', '50000', '200')).toBe(0);
      expect(lineAmount('10', '0', '200')).toBe(0);
      expect(lineAmount('10', '-1000', '200')).toBe(0);
      expect(lineAmount('abc', '50000', '200')).toBe(0);
      expect(lineAmount('10', 'xyz', '200')).toBe(0);
    });
  });

  describe('currencyToDraft', () => {
    it('rounds float prices to integer string and prevents scientific/overflow digits', () => {
      // Lỗi nổ số 26.818.181.818.181.816 do số lẻ thập phân từ công thức Excel
      expect(currencyToDraft(26818.181818181816)).toBe('26818');
      expect(currencyToDraft(14821600)).toBe('14821600');
      expect(currencyToDraft(1234.5)).toBe('1235');
      expect(currencyToDraft(0)).toBe('0');
    });

    it('returns empty string for null, undefined, NaN, or Infinity', () => {
      expect(currencyToDraft(null)).toBe('');
      expect(currencyToDraft(undefined)).toBe('');
      expect(currencyToDraft(Number.NaN)).toBe('');
      expect(currencyToDraft(Number.POSITIVE_INFINITY)).toBe('');
    });
  });

  describe('emptyLine', () => {
    it('creates an empty line with defaults', () => {
      const line = emptyLine();
      expect(line.lineType).toBe('material');
      expect(line.materialCode).toBe('');
      expect(line.quantity).toBe('1');
      expect(line.quotes).toEqual([]);
    });

    it('creates an empty line with specified lineType', () => {
      const serviceLine = emptyLine('service');
      expect(serviceLine.lineType).toBe('service');
      const expenseLine = emptyLine('expense');
      expect(expenseLine.lineType).toBe('expense');
    });
  });

  describe('fromPreviewLines', () => {
    it('converts preview lines and rounds currency fields to clean integers', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 2,
          lineNo: 1,
          isValid: true,
          materialCode: 'VT-001',
          productName: 'Thép tấm A515',
          unit: 'Tấm',
          quantity: 1,
          kgPerUnit: 2434.5,
          budgetUnitPrice: 26000,
          proposalUnitPrice: 26818.181818181816, // lẻ thập phân
          purchaseUnitPrice: 26000,
          selectedUnitPrice: 26818.181818181816, // lẻ thập phân
          quotes: [
            {
              sortOrder: 1,
              supplierName: 'NCC An Phát',
              unitPrice: 26818.181818181816,
              amount: 65275454.54545455,
            },
          ],
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
      expect(drafts[0].productName).toBe('Thép tấm A515');
      expect(drafts[0].quantity).toBe('1');
      // kgPerUnit giữ nguyên số thập phân
      expect(drafts[0].kgPerUnit).toBe('2434.5');
      // Đơn giá được làm tròn sạch sẽ
      expect(drafts[0].budgetUnitPrice).toBe('26000');
      expect(drafts[0].proposalUnitPrice).toBe('26818');
      expect(drafts[0].selectedUnitPrice).toBe('26818');
      expect(drafts[0].quotes).toHaveLength(1);
      expect(drafts[0].quotes[0].unitPrice).toBe('26818');
      expect(drafts[0].quotes[0].amount).toBe('65275455');
    });

    it('loads service and expense preview lines even without materialCode', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 4,
          lineNo: 3,
          isValid: true,
          lineType: 'service',
          materialCode: null,
          productName: 'Vận chuyển thiết bị siêu trường siêu trọng',
          unit: 'Chuyến',
          quantity: 2,
          budgetUnitPrice: 50000000,
          quotes: [],
        },
        {
          rowNumber: 5,
          lineNo: 4,
          isValid: true,
          lineType: 'expense',
          materialCode: '',
          productName: 'Chi phí tiếp khách và di chuyển dự án',
          unit: 'Gói',
          quantity: 1,
          budgetUnitPrice: 100000000,
          quotes: [],
        },
      ]);

      expect(drafts).toHaveLength(2);
      expect(drafts[0].lineType).toBe('service');
      expect(drafts[0].materialCode).toBe('');
      expect(drafts[0].productName).toBe('Vận chuyển thiết bị siêu trường siêu trọng');
      expect(drafts[0].unit).toBe('Chuyến');
      expect(drafts[0].quantity).toBe('2');
      expect(drafts[0].budgetUnitPrice).toBe('50000000');
      expect(drafts[0].kgPerUnit).toBe('');

      expect(drafts[1].lineType).toBe('expense');
      expect(drafts[1].materialCode).toBe('');
      expect(drafts[1].productName).toBe('Chi phí tiếp khách và di chuyển dự án');
      expect(drafts[1].unit).toBe('Gói');
      expect(drafts[1].quantity).toBe('1');
      expect(drafts[1].budgetUnitPrice).toBe('100000000');
    });

    it('returns [emptyLine()] if preview lines are empty or invalid', () => {
      const drafts = fromPreviewLines([]);
      expect(drafts).toHaveLength(1);
      expect(drafts[0].materialCode).toBe('');
      expect(drafts[0].lineType).toBe('material');
    });
  });

  describe('fromExistingPlanLines', () => {
    it('maps existing plan lines to draft lines with rounded currency fields', () => {
      const existing: PurchasePlanLineApiDto[] = [
        {
          id: 101,
          lineNo: 1,
          materialCode: 'VT-999',
          productName: 'Ống thép đúc',
          unit: 'Ống',
          quantity: 5,
          kgPerUnit: 12.5,
          orderedQty: 0,
          receivedQty: 0,
          defectQty: 0,
          remainingOrderableQty: 5,
          budgetUnitPrice: 20000.75,
          quotes: [
            {
              id: 1,
              supplierName: 'NCC A',
              unitPrice: 19000.4,
              amount: 95000.2,
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
      expect(drafts[0].kgPerUnit).toBe('12.5');
      expect(drafts[0].budgetUnitPrice).toBe('20001');
      expect(drafts[0].quotes).toHaveLength(1);
      expect(drafts[0].quotes[0].unitPrice).toBe('19000');
      expect(drafts[0].quotes[0].amount).toBe('95000');
    });

    it('returns [emptyLine()] when existing plan lines are null or empty', () => {
      expect(fromExistingPlanLines(null)).toHaveLength(1);
      expect(fromExistingPlanLines([])).toHaveLength(1);
    });
  });

  describe('toApiLines', () => {
    it('calculates amounts using dual-mode lineAmount and filters invalid lines', () => {
      const lines = [
        {
          ...emptyLine(),
          materialCode: 'VT-THEP',
          productName: 'Thép tấm',
          unit: 'Tấm',
          quantity: '2',
          kgPerUnit: '1000',
          budgetUnitPrice: '25000',
          proposalUnitPrice: '26000',
          purchaseUnitPrice: '25500',
          selectedUnitPrice: '25500',
        },
        {
          ...emptyLine(),
          materialCode: 'VT-BULONG',
          productName: 'Bu lông M16',
          unit: 'Cái',
          quantity: '100',
          kgPerUnit: '', // Không có kgPerUnit
          budgetUnitPrice: '5000',
        },
        emptyLine(), // invalid
      ];

      const apiLines = toApiLines(lines);
      expect(apiLines).toHaveLength(2);

      // Thép tấm: 2 * 1000 * 25000 = 50.000.000
      expect(apiLines[0].materialCode).toBe('VT-THEP');
      expect(apiLines[0].quantity).toBe(2);
      expect(apiLines[0].kgPerUnit).toBe(1000);
      expect(apiLines[0].budgetUnitPrice).toBe(25000);
      expect(apiLines[0].budgetAmount).toBe(50000000);
      expect(apiLines[0].proposalAmount).toBe(52000000);
      expect(apiLines[0].purchaseAmount).toBe(51000000);
      expect(apiLines[0].selectedAmount).toBe(51000000);

      // Bu lông: 100 * 5000 = 500.000
      expect(apiLines[1].materialCode).toBe('VT-BULONG');
      expect(apiLines[1].quantity).toBe(100);
      expect(apiLines[1].kgPerUnit).toBeNull();
      expect(apiLines[1].budgetUnitPrice).toBe(5000);
      expect(apiLines[1].budgetAmount).toBe(500000);
    });

    it('preserves service and expense lines without materialCode and maps lineType correctly', () => {
      const lines = [
        {
          ...emptyLine(),
          lineType: 'service' as const,
          materialCode: '',
          productName: 'Bể dập bụi và xử lý khí thải',
          unit: 'Hệ',
          quantity: '1',
          budgetUnitPrice: '380000000',
        },
        {
          ...emptyLine(),
          lineType: 'expense' as const,
          materialCode: '',
          productName: 'Nhân công vận hành chạy thử',
          unit: 'Gói',
          quantity: '1',
          budgetUnitPrice: '20000000',
        },
        {
          ...emptyLine(),
          lineType: 'material' as const,
          materialCode: '', // material missing materialCode -> must be filtered out
          productName: 'Thiếu mã',
          unit: 'Cái',
          quantity: '5',
        },
      ];

      const apiLines = toApiLines(lines);
      expect(apiLines).toHaveLength(2);

      expect(apiLines[0].lineType).toBe('service');
      expect(apiLines[0].materialCode).toBeNull();
      expect(apiLines[0].productName).toBe('Bể dập bụi và xử lý khí thải');
      expect(apiLines[0].budgetUnitPrice).toBe(380000000);
      expect(apiLines[0].budgetAmount).toBe(380000000);

      expect(apiLines[1].lineType).toBe('expense');
      expect(apiLines[1].materialCode).toBeNull();
      expect(apiLines[1].productName).toBe('Nhân công vận hành chạy thử');
      expect(apiLines[1].budgetUnitPrice).toBe(20000000);
      expect(apiLines[1].budgetAmount).toBe(20000000);
    });
  });
});
