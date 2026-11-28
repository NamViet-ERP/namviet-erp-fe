import { describe, expect, it } from 'vitest';
import {
  computeWebStageAmount,
  currencyToDraft,
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  lineAmount,
  resolveDraftStageAmount,
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

    it('calculates amount with decimal unitPrice and kgPerUnit cleanly', () => {
      expect(lineAmount('2', '1000,5')).toBe(2001);
      expect(lineAmount('1.5', '1.000,5')).toBe(1500.75);
      expect(lineAmount('2', '26818.18', '1')).toBe(53636.36);
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
    it('preserves up to 2 decimals while preventing long float noise', () => {
      expect(currencyToDraft(26818.181818181816)).toBe('26818.18');
      expect(currencyToDraft(20000.75)).toBe('20000.75');
      expect(currencyToDraft(14821600)).toBe('14821600');
      expect(currencyToDraft(1234.5)).toBe('1234.5');
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
      expect(line.description).toBe('');
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
      expect(drafts[0].excelRowNumber).toBe(2);
      expect(drafts[0].materialCode).toBe('VT-001');
      expect(drafts[0].productName).toBe('Thép tấm A515');
      expect(drafts[0].quantity).toBe('1');
      // kgPerUnit giữ nguyên số thập phân
      expect(drafts[0].kgPerUnit).toBe('2434.5');
      // Đơn giá giữ tối đa 2 chữ số thập phân sạch sẽ
      expect(drafts[0].budgetUnitPrice).toBe('26000');
      expect(drafts[0].proposalUnitPrice).toBe('26818.18');
      expect(drafts[0].selectedUnitPrice).toBe('26818.18');
      expect(drafts[0].quotes).toHaveLength(1);
      expect(drafts[0].quotes[0].unitPrice).toBe('26818.18');
      expect(drafts[0].quotes[0].amount).toBe('65275454.55');
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
          description: 'Ống dẫn dầu áp lực cao',
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
      expect(drafts[0].description).toBe('Ống dẫn dầu áp lực cao');
      expect(drafts[0].kgPerUnit).toBe('12.5');
      expect(drafts[0].budgetUnitPrice).toBe('20000.75');
      expect(drafts[0].quotes).toHaveLength(1);
      expect(drafts[0].quotes[0].unitPrice).toBe('19000.4');
      expect(drafts[0].quotes[0].amount).toBe('95000.2');
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
          description: 'Thép lót sàn tầng lửng',
          unit: 'Tấm',
          quantity: '2',
          kgPerUnit: '1000',
          budgetUnitPrice: '25000',
          proposalKgPerUnit: '1000',
          proposalUnitPrice: '26000',
          purchaseKgPerUnit: '1000',
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
      expect(apiLines[0].description).toBe('Thép lót sàn tầng lửng');
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

    it('parses Vietnamese-formatted currency strings and decimal unit prices in toApiLines', () => {
      const lines = [
        {
          ...emptyLine(),
          materialCode: 'VT-001',
          productName: 'Thép tấm A515',
          unit: 'Tấm',
          quantity: '2',
          budgetUnitPrice: '1.500.000,5',
          proposalUnitPrice: '26.818,18',
          purchaseUnitPrice: '1.200.000',
          selectedUnitPrice: '1.200.000,25',
          quotes: [
            {
              key: 'q-1',
              sortOrder: 1,
              supplierName: 'NCC A',
              unitPrice: '19.000,4',
              amount: '38.000,8',
            },
          ],
        },
      ];

      const apiLines = toApiLines(lines);
      expect(apiLines).toHaveLength(1);
      expect(apiLines[0].budgetUnitPrice).toBe(1500000.5);
      expect(apiLines[0].budgetAmount).toBe(3000001);
      expect(apiLines[0].proposalUnitPrice).toBe(26818.18);
      expect(apiLines[0].proposalAmount).toBe(53636.36);
      expect(apiLines[0].purchaseUnitPrice).toBe(1200000);
      expect(apiLines[0].selectedUnitPrice).toBe(1200000.25);
      expect(apiLines[0].selectedAmount).toBe(2400000.5);
      expect(apiLines[0].quotes).toEqual([
        {
          sortOrder: 1,
          supplierName: 'NCC A',
          unitPrice: 19000.4,
          amount: 38000.8,
        },
      ]);
    });

    it('preserves exact Inox 304 Excel amounts on import round-trip without multiplying by kgPerUnit', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 5,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          statusNote: 'Đã duyệt mẫu',
          budgetUnitPrice: 928_000,
          budgetAmount: 180_032_000,
          proposalKgPerUnit: 194,
          proposalUnitPrice: 13_916_000,
          proposalAmount: 222_656_000,
          proposalSupplierName: 'Công ty Inox Nam Phát',
          proposalNote: 'Giá đã gồm cắt CNC',
          proposalStatus: 'Đã trình',
          orderedDate: '2026-11-12T00:00:00Z',
          deliveryNote: 'Giao tại xưởng Bình Dương',
          purchaseKgPerUnit: 194,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          purchaseSupplierName: 'Công ty Inox Nam Phát',
          purchaseNote: 'Chiết khấu 1.4%',
          selectedUnitPrice: 13_916_000,
          selectedAmount: 222_656_000,
          selectedSupplierName: 'Công ty Inox Nam Phát',
          quotes: [],
        },
      ]);

      expect(drafts[0].lockBudgetAmount).toBe(true);
      expect(drafts[0].lockProposalAmount).toBe(true);
      expect(drafts[0].lockPurchaseAmount).toBe(true);
      expect(drafts[0].lockSelectedAmount).toBe(true);

      const apiLines = toApiLines(drafts);
      expect(apiLines).toHaveLength(1);
      expect(apiLines[0].budgetAmount).toBe(180_032_000);
      expect(apiLines[0].proposalAmount).toBe(222_656_000);
      expect(apiLines[0].purchaseAmount).toBe(219_600_000);
      expect(apiLines[0].selectedAmount).toBe(222_656_000);
      expect(apiLines[0].statusNote).toBe('Đã duyệt mẫu');
      expect(apiLines[0].proposalKgPerUnit).toBe(194);
      expect(apiLines[0].proposalNote).toBe('Giá đã gồm cắt CNC');
      expect(apiLines[0].proposalStatus).toBe('Đã trình');
      expect(apiLines[0].orderedDate).toBe('2026-11-12');
      expect(apiLines[0].deliveryNote).toBe('Giao tại xưởng Bình Dương');
      expect(apiLines[0].purchaseKgPerUnit).toBe(194);
      expect(apiLines[0].purchaseNote).toBe('Chiết khấu 1.4%');
    });

    it('preserves lump-sum, blank (null), and explicit 0 Excel amounts verbatim', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 6,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-TRON-GOI',
          productName: 'Bu lông neo M24 trọn gói',
          unit: 'Bộ',
          quantity: 60,
          budgetAmount: 0,
          proposalUnitPrice: 1_345_300,
          proposalAmount: 1_345_300,
          quotes: [],
        },
        {
          rowNumber: 7,
          lineNo: 2,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-BO-TRONG-TT',
          productName: 'Thép tấm không nhập thành tiền đề xuất',
          unit: 'Tấm',
          quantity: 4,
          kgPerUnit: 250,
          proposalUnitPrice: 26_818.18,
          proposalAmount: null,
          quotes: [],
        },
      ]);

      const apiLines = toApiLines(drafts);
      expect(apiLines).toHaveLength(2);
      expect(apiLines[0].budgetAmount).toBe(0);
      expect(apiLines[0].proposalAmount).toBe(1_345_300);
      expect(apiLines[1].proposalUnitPrice).toBe(26_818.18);
      expect(apiLines[1].proposalAmount).toBeNull();
    });

    it('preserves stored amounts and metadata verbatim on edit round-trip via fromExistingPlanLines', () => {
      const existing: PurchasePlanLineApiDto[] = [
        {
          id: 707,
          lineNo: 1,
          lineType: 'material',
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304 dày 10mm',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          statusNote: 'Đã ký PO',
          budgetUnitPrice: 928_000,
          budgetAmount: 180_032_000,
          proposalKgPerUnit: 194,
          proposalUnitPrice: 13_916_000,
          proposalAmount: 222_656_000,
          proposalNote: 'Trọn gói 16 tấm',
          proposalStatus: 'Duyệt',
          orderedDate: '2026-11-15T00:00:00Z',
          deliveryNote: 'Xe tải 5 tấn',
          purchaseKgPerUnit: 194,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          purchaseNote: 'Bao vận chuyển',
          selectedUnitPrice: 13_916_000,
          selectedAmount: 222_656_000,
          orderedQty: 0,
          receivedQty: 0,
          defectQty: 0,
          remainingOrderableQty: 16,
          quotes: [
            {
              id: 1,
              sortOrder: 1,
              kgPerUnit: 194,
              unitPrice: 13_916_000,
              amount: 222_656_000,
              supplierName: 'Công ty Inox Nam Phát',
              note: 'Giao 3 ngày',
              status: 'Chọn',
            },
          ],
        },
      ];

      const drafts = fromExistingPlanLines(existing);
      const apiLines = toApiLines(drafts);
      expect(apiLines).toHaveLength(1);
      expect(apiLines[0].budgetAmount).toBe(180_032_000);
      expect(apiLines[0].proposalAmount).toBe(222_656_000);
      expect(apiLines[0].purchaseAmount).toBe(219_600_000);
      expect(apiLines[0].selectedAmount).toBe(222_656_000);
      expect(apiLines[0].statusNote).toBe('Đã ký PO');
      expect(apiLines[0].proposalNote).toBe('Trọn gói 16 tấm');
      expect(apiLines[0].proposalStatus).toBe('Duyệt');
      expect(apiLines[0].orderedDate).toBe('2026-11-15');
      expect(apiLines[0].deliveryNote).toBe('Xe tải 5 tấn');
      expect(apiLines[0].purchaseNote).toBe('Bao vận chuyển');
      expect(apiLines[0].quotes).toEqual([
        {
          sortOrder: 1,
          kgPerUnit: 194,
          unitPrice: 13_916_000,
          amount: 222_656_000,
          supplierName: 'Công ty Inox Nam Phát',
          note: 'Giao 3 ngày',
          status: 'Chọn',
        },
      ]);
    });

    it('preserves quote kgPerUnit, note, status, and amount even when unitPrice and supplierName are blank', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 9,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-QUOTE-01',
          productName: 'Thép hình I200',
          unit: 'Cây',
          quantity: 10,
          quotes: [
            {
              sortOrder: 1,
              kgPerUnit: 21.3,
              unitPrice: null,
              amount: 45_000_000,
              supplierName: null,
              note: 'Báo giá trọn lô',
              status: 'Chờ duyệt',
            },
          ],
        },
      ]);

      const apiLines = toApiLines(drafts);
      expect(apiLines[0].quotes).toEqual([
        {
          sortOrder: 1,
          kgPerUnit: 21.3,
          unitPrice: null,
          amount: 45_000_000,
          supplierName: null,
          note: 'Báo giá trọn lô',
          status: 'Chờ duyệt',
        },
      ]);
    });
  });

  describe('resolveDraftStageAmount', () => {
    it('returns stored amount verbatim when locked and computes via lineAmount when unlocked', () => {
      const manual = {
        ...emptyLine(),
        quantity: '2',
        kgPerUnit: '100',
        budgetUnitPrice: '25000',
        proposalKgPerUnit: '50',
        proposalUnitPrice: '30000',
      };
      expect(resolveDraftStageAmount(manual, 'budget')).toBe(5_000_000);
      expect(resolveDraftStageAmount(manual, 'proposal')).toBe(3_000_000);
      expect(resolveDraftStageAmount(manual, 'purchase')).toBeNull();

      const lockedZero = {
        ...manual,
        lockBudgetAmount: true,
        budgetAmount: '0',
      };
      expect(resolveDraftStageAmount(lockedZero, 'budget')).toBe(0);

      const lockedBlank = {
        ...manual,
        lockProposalAmount: true,
        proposalAmount: '',
      };
      expect(resolveDraftStageAmount(lockedBlank, 'proposal')).toBeNull();
    });

    it('isolates KG/ĐVT per stage so proposal/purchase/selected never inherit budget kgPerUnit', () => {
      // Tấm Inox 304: Dự toán tính theo KG (16 × 194 × 58.000 = 180.032.000),
      // Đề xuất & Mua hàng tính theo Tấm (KG/ĐVT nhóm trống -> SL × ĐG, không nhân 194)
      const inoxLine = {
        ...emptyLine(),
        materialCode: 'VT-INOX-304',
        productName: 'Tấm Inox 304 dày 10mm',
        unit: 'Tấm',
        quantity: '16',
        kgPerUnit: '194',
        budgetUnitPrice: '58000',
        proposalKgPerUnit: '',
        proposalUnitPrice: '13916000',
        purchaseKgPerUnit: '',
        purchaseUnitPrice: '13725000',
        selectedUnitPrice: '13916000',
      };

      expect(computeWebStageAmount(inoxLine, 'budget')).toBe(180_032_000);
      expect(computeWebStageAmount(inoxLine, 'proposal')).toBe(222_656_000);
      expect(computeWebStageAmount(inoxLine, 'purchase')).toBe(219_600_000);
      expect(computeWebStageAmount(inoxLine, 'selected')).toBe(222_656_000);
    });

    it('uses steel plate stage KG/ĐVT cleanly and resolves selected KG from purchaseKgPerUnit || proposalKgPerUnit only', () => {
      const steelPlate = {
        ...emptyLine(),
        materialCode: 'VT-THEP-TAM',
        productName: 'Thép tấm A515 dày 20mm',
        unit: 'Tấm',
        quantity: '1',
        kgPerUnit: '2434',
        budgetUnitPrice: '26000',
        proposalKgPerUnit: '2434',
        proposalUnitPrice: '26681.56',
        purchaseKgPerUnit: '',
        purchaseUnitPrice: '64046455',
        selectedUnitPrice: '26681.56',
      };

      expect(computeWebStageAmount(steelPlate, 'budget')).toBe(63_284_000);
      expect(computeWebStageAmount(steelPlate, 'proposal')).toBe(64_942_917.04);
      expect(computeWebStageAmount(steelPlate, 'purchase')).toBe(64_046_455);
      // selected falls back to proposalKgPerUnit (2434), never to budget kgPerUnit
      expect(computeWebStageAmount(steelPlate, 'selected')).toBe(64_942_917.04);

      const purchaseOverridesProposalKg = {
        ...steelPlate,
        purchaseKgPerUnit: '2500',
        selectedUnitPrice: '26000',
      };
      expect(computeWebStageAmount(purchaseOverridesProposalKg, 'selected')).toBe(65_000_000);
    });

    it('switches between excel verbatim and web computed amounts cleanly in resolveDraftStageAmount and toApiLines', () => {
      const drafts = fromPreviewLines([
        {
          rowNumber: 12,
          lineNo: 1,
          isValid: true,
          lineType: 'material',
          materialCode: 'VT-INOX-304',
          productName: 'Tấm Inox 304',
          unit: 'Tấm',
          quantity: 16,
          kgPerUnit: 194,
          budgetUnitPrice: 58_000,
          budgetAmount: 180_032_000,
          proposalKgPerUnit: null,
          proposalUnitPrice: 58_000,
          proposalAmount: 180_032_000, // Excel multiplied by 194 even though proposalKgPerUnit was blank
          purchaseKgPerUnit: null,
          purchaseUnitPrice: 13_725_000,
          purchaseAmount: 219_600_000,
          selectedUnitPrice: 13_916_000,
          selectedAmount: 222_656_000,
          quotes: [],
        },
      ]);

      expect(drafts[0].excelRowNumber).toBe(12);
      // Default / 'excel' mode keeps Excel proposalAmount verbatim
      expect(resolveDraftStageAmount(drafts[0], 'proposal', 'excel')).toBe(180_032_000);
      // 'web' mode computes SL × ĐG = 16 × 58.000 = 928.000 because proposalKgPerUnit is missing
      expect(resolveDraftStageAmount(drafts[0], 'proposal', 'web')).toBe(928_000);

      const excelPayload = toApiLines(drafts, 'excel');
      expect(excelPayload[0].proposalAmount).toBe(180_032_000);

      const webPayload = toApiLines(drafts, 'web');
      expect(webPayload[0].budgetAmount).toBe(180_032_000);
      expect(webPayload[0].proposalAmount).toBe(928_000);
      expect(webPayload[0].purchaseAmount).toBe(219_600_000);
      expect(webPayload[0].selectedAmount).toBe(222_656_000);
    });
  });
});
