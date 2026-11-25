import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Import } from '../../../types';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import ImportDetailModal from './ImportDetailModal';

vi.mock('../../../lib/wms/printVoucher', () => ({
  printVoucherWithFeedback: vi.fn(),
}));

vi.mock('../../../services/importsService', () => ({
  importsService: {
    downloadAttachment: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
  },
}));

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  descriptor?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function buildImportVoucher(overrides: Partial<Import> = {}): Import {
  return {
    id: 'imp-2026-018',
    voucherCode: 'NK-2026-018',
    date: '2026-11-25',
    createdAt: '2026-11-25T08:30:00.000Z',
    supplier: 'Công ty TNHH VLXD Minh Long',
    referenceCode: 'PO-2026-088',
    planCode: 'KHMH-2026-012',
    totalValue: 450_000_000,
    status: 'draft',
    warehouseApproval: 'pending',
    approvedBy: '',
    warehouseKeeper: 'Trần Minh Quang',
    createdBy: 'Nguyễn Văn Thành',
    note: 'Giao thép hình đợt 1 tại bãi công trường Cầu Rạch Miễu 2',
    warehouseId: 'WH-CRM2',
    project: 'DA-CRM2-2026',
    items: [
      {
        lineId: 101,
        productId: 'VT-THEP-001',
        sku: 'VT-THEP-001',
        name: 'Thép hình H300',
        qty: 100,
        plannedQty: 100,
        unit: 'Cây',
        unitPrice: 4_500_000,
      },
    ],
    attachments: [],
    ...overrides,
  };
}

let root: Root;
let container: HTMLDivElement;
const origScrollIntoView = Element.prototype.scrollIntoView;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  Element.prototype.scrollIntoView = vi.fn();
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:mock-preview'),
    });
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }
  vi.clearAllMocks();

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  Element.prototype.scrollIntoView = origScrollIntoView;
  vi.unstubAllGlobals();
});

function getDialog(): HTMLElement {
  const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null;
  expect(dialog).not.toBeNull();
  return dialog!;
}

function findButton(dialog: HTMLElement, label: string): HTMLButtonElement {
  const btn = [...dialog.querySelectorAll('button')].find(b =>
    b.textContent?.replace(/\s+/g, ' ').trim().includes(label),
  ) as HTMLButtonElement | undefined;
  expect(btn, `Expected button containing "${label}"`).toBeDefined();
  return btn!;
}

describe('ImportDetailModal Characterization', () => {
  it('draft mode: renders header fields, items table, and triggers print/edit/delete/convert callbacks', async () => {
    const voucher = buildImportVoucher({ status: 'draft' });
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onDeleteDraft = vi.fn();
    const onConvertToDirect = vi.fn();

    await act(async () => {
      root.render(
        createElement(ImportDetailModal, {
          isOpen: true,
          onClose,
          selected: voucher,
          projectName: code => (code === 'DA-CRM2-2026' ? 'Dự án Cầu Rạch Miễu 2' : code ?? '-'),
          onEdit,
          onDeleteDraft,
          onConvertToDirect,
        }),
      );
    });

    const dialog = getDialog();
    expect(dialog.textContent).toContain('NK-2026-018');
    expect(dialog.textContent).toContain('Dự án Cầu Rạch Miễu 2');
    expect(dialog.textContent).toContain('Công ty TNHH VLXD Minh Long');
    expect(dialog.textContent).toContain('PO-2026-088');
    expect(dialog.textContent).toContain('KHMH-2026-012');
    expect(dialog.textContent).toContain('Thép hình H300');
    expect(dialog.textContent).toContain('VT-THEP-001');
    expect(dialog.textContent).toContain('Đơn giá');
    expect(dialog.textContent).toContain('Thành tiền');

    await act(async () => {
      findButton(dialog, 'In phiếu').click();
      findButton(dialog, 'Sửa phiếu').click();
      findButton(dialog, 'Xóa nháp').click();
      findButton(dialog, 'Chuyển sang xuất thẳng').click();
    });

    expect(printVoucherWithFeedback).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(voucher);
    expect(onDeleteDraft).toHaveBeenCalledWith(voucher);
    expect(onConvertToDirect).toHaveBeenCalledWith(voucher);
  });

  it('pending settlement mode: validates missing evidence, requires line reason & shortage report, then submits settlement payload', async () => {
    const onApprove = vi.fn();
    const pendingWithoutEvidence = buildImportVoucher({
      status: 'pending',
      receiptEvaluation: '',
      attachments: [],
    });

    await act(async () => {
      root.render(
        createElement(ImportDetailModal, {
          isOpen: true,
          onClose: vi.fn(),
          selected: pendingWithoutEvidence,
          projectName: () => 'Dự án Cầu Rạch Miễu 2',
          canUpdateEvidence: true,
          onApprove,
          onUploadAttachment: vi.fn().mockResolvedValue(undefined),
        }),
      );
    });

    const dialog = getDialog();
    expect(dialog.querySelector('input[aria-label="SL thực tế VT-THEP-001"]')).not.toBeNull();
    expect(dialog.querySelector('input[aria-label="Lỗi VT-THEP-001"]')).not.toBeNull();
    expect(dialog.querySelector('input[aria-label="Thiếu VT-THEP-001"]')).not.toBeNull();

    // Attempt approve without evaluation, photo, or document
    await act(async () => {
      findButton(dialog, 'Duyệt thực tế').click();
    });

    expect(dialog.textContent).toContain('Vui lòng nhập đánh giá nhận hàng');
    expect(dialog.textContent).toContain('Vui lòng chọn ít nhất 1 ảnh nhận hàng');
    expect(dialog.textContent).toContain('Vui lòng chọn ít nhất 1 file chứng từ');
    expect(onApprove).not.toHaveBeenCalled();

    // Now render with valid photo + document attachments & evaluation
    const pendingWithEvidence = buildImportVoucher({
      id: 'imp-2026-019',
      voucherCode: 'NK-2026-019',
      status: 'pending',
      receiptEvaluation: 'Hàng thép hình H300 đúng quy cách, kiểm đếm thực tế tại bãi.',
      attachments: [
        {
          id: 'att-photo-1',
          kind: 'photo',
          fileName: 'anh-nhan-hang-h300.jpg',
          storageKey: 'imports/anh-nhan-hang-h300.jpg',
          uploadedAt: '2026-11-25T09:00:00Z',
        },
        {
          id: 'att-doc-1',
          kind: 'document',
          fileName: 'bien-ban-giao-hang.pdf',
          storageKey: 'imports/bien-ban-giao-hang.pdf',
          uploadedAt: '2026-11-25T09:01:00Z',
        },
      ],
    });

    await act(async () => {
      root.render(
        createElement(ImportDetailModal, {
          isOpen: true,
          onClose: vi.fn(),
          selected: pendingWithEvidence,
          projectName: () => 'Dự án Cầu Rạch Miễu 2',
          canUpdateEvidence: true,
          onApprove,
          onUploadAttachment: vi.fn().mockResolvedValue(undefined),
        }),
      );
    });

    const activeDialog = getDialog();
    const acceptedInput = activeDialog.querySelector(
      'input[aria-label="SL thực tế VT-THEP-001"]',
    ) as HTMLInputElement;
    expect(acceptedInput.value).toBe('100');

    // Change accepted qty to 90 → shortage automatically becomes 10
    await act(async () => {
      setInputValue(acceptedInput, '90');
    });

    const shortageInput = activeDialog.querySelector(
      'input[aria-label="Thiếu VT-THEP-001"]',
    ) as HTMLInputElement;
    expect(shortageInput.value).toBe('10');

    // Line reason input appears and is required before approving
    const reasonInput = activeDialog.querySelector(
      'input[aria-label="Lý do VT-THEP-001"]',
    ) as HTMLInputElement;
    expect(reasonInput).not.toBeNull();

    await act(async () => {
      findButton(activeDialog, 'Duyệt thực tế').click();
    });
    expect(activeDialog.querySelector('[data-settlement-error]')?.textContent).toContain(
      'Mỗi dòng bị trừ SL (lỗi hoặc thiếu) cần lý do trên dòng.',
    );
    expect(onApprove).not.toHaveBeenCalled();

    // Fill line reason + shortage report
    await act(async () => {
      setInputValue(reasonInput, 'NCC giao thiếu 10 cây đợt 1');
    });
    const shortageTextarea = activeDialog.querySelector(
      'textarea[placeholder*="NCC giao thiếu"]',
    ) as HTMLTextAreaElement;
    expect(shortageTextarea).not.toBeNull();
    await act(async () => {
      setInputValue(shortageTextarea, 'Công ty TNHH VLXD Minh Long cam kết giao bù 10 cây ngày 28/11');
    });

    await act(async () => {
      findButton(activeDialog, 'Duyệt thực tế').click();
    });

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledWith(pendingWithEvidence, {
      evaluation: 'Hàng thép hình H300 đúng quy cách, kiểm đếm thực tế tại bãi.',
      shortageReport: 'Công ty TNHH VLXD Minh Long cam kết giao bù 10 cây ngày 28/11',
      defectReason: '',
      lines: [
        {
          lineId: 101,
          acceptedQty: 90,
          defectQty: 0,
          shortageQty: 10,
          defectLineReason: null,
          shortageLineReason: 'NCC giao thiếu 10 cây đợt 1',
        },
      ],
    });
  });

  it('approved read-only mode: hides approve CTA, displays saved evaluation/docs/shortage report, and respects showPrices={false}', async () => {
    const approvedVoucher = buildImportVoucher({
      status: 'approved',
      approvedBy: 'Lê Hoàng Nam',
      approvedAt: '2026-11-25T10:15:00Z',
      receiptEvaluation: 'Đã kiểm nhận đầy đủ theo chứng từ CO/CQ.',
      shortageReport: 'Thiếu 5 cây thép hình H300 đã lập biên bản đối chiếu.',
      items: [
        {
          lineId: 101,
          productId: 'VT-THEP-001',
          sku: 'VT-THEP-001',
          name: 'Thép hình H300',
          qty: 95,
          plannedQty: 100,
          acceptedQty: 95,
          defectQty: 0,
          shortageQty: 5,
          shortageLineReason: 'Giao bù đợt 2',
          unit: 'Cây',
          unitPrice: 4_500_000,
        },
      ],
      attachments: [
        {
          id: 'att-photo-2',
          kind: 'photo',
          fileName: 'anh-bai-thep-crm2.jpg',
          storageKey: 'imports/anh-bai-thep-crm2.jpg',
          uploadedAt: '2026-11-25T09:30:00Z',
        },
        {
          id: 'att-doc-2',
          kind: 'document',
          fileName: 'chung-chi-chat-luong-cq.pdf',
          storageKey: 'imports/chung-chi-chat-luong-cq.pdf',
          uploadedAt: '2026-11-25T09:31:00Z',
        },
      ],
    });

    await act(async () => {
      root.render(
        createElement(ImportDetailModal, {
          isOpen: true,
          onClose: vi.fn(),
          selected: approvedVoucher,
          projectName: () => 'Dự án Cầu Rạch Miễu 2',
          canUpdateEvidence: true,
          onApprove: vi.fn(),
          showPrices: false,
        }),
      );
    });

    const dialog = getDialog();
    expect(dialog.textContent).not.toContain('Duyệt thực tế');
    expect(dialog.textContent).not.toContain('Đơn giá');
    expect(dialog.textContent).not.toContain('Thành tiền');
    expect(dialog.textContent).toContain('Đã kiểm nhận đầy đủ theo chứng từ CO/CQ.');
    expect(dialog.textContent).toContain('Phiếu đã duyệt - chỉ xem chứng từ và ảnh.');
    expect(dialog.textContent).toContain('Thiếu 5 cây thép hình H300 đã lập biên bản đối chiếu.');
    expect(dialog.textContent).toContain('chung-chi-chat-luong-cq.pdf');
    expect(dialog.textContent).toContain('Giao bù đợt 2');
  });
});
