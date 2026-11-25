import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/apiClient';
import { defectsService } from '../../services/defectsService';
import { exportReturnsService } from '../../services/exportReturnsService';
import { importsService } from '../../services/importsService';
import type { ImportAttachment } from '../../types';
import type { PurchaseDefectAttachmentApiDto } from '../../types/api/poDefectApi';
import {
  PendingDocList,
  PendingPhotoGrid,
  SavedDefectDocList,
  SavedDefectPhotoGrid,
  SavedExportReturnPhotoGrid,
  SavedImportDocList,
  SavedImportPhotoGrid,
} from './PendingLocalEvidence';

vi.mock('../../services/defectsService', () => ({
  defectsService: {
    getAttachmentBlob: vi.fn(),
    downloadAttachment: vi.fn(),
  },
}));

vi.mock('../../services/importsService', () => ({
  importsService: {
    downloadAttachment: vi.fn(),
  },
}));

vi.mock('../../services/exportReturnsService', () => ({
  exportReturnsService: {
    downloadAttachment: vi.fn(),
  },
}));

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

function buildImportAttachments(): ImportAttachment[] {
  return [
    {
      id: 'att-photo-1',
      kind: 'photo',
      fileName: 'anh-nhan-ong-thep-duc.jpg',
      storageKey: 'imports/nk-01/anh-nhan-ong-thep-duc.jpg',
      uploadedAt: '2026-11-25T08:00:00.000Z',
    },
    {
      id: 'att-defect-1',
      kind: 'defect_photo',
      fileName: 'anh-bich-thep-mop-meo.png',
      storageKey: 'imports/nk-01/anh-bich-thep-mop-meo.png',
      uploadedAt: '2026-11-25T08:05:00.000Z',
    },
    {
      id: 'att-doc-1',
      kind: 'document',
      fileName: 'bien-ban-giao-hang-po-088.pdf',
      storageKey: 'imports/nk-01/bien-ban-giao-hang-po-088.pdf',
      uploadedAt: '2026-11-25T08:10:00.000Z',
    },
  ];
}

function buildDefectAttachments(): PurchaseDefectAttachmentApiDto[] {
  return [
    {
      id: 'def-photo-1',
      kind: 'photo',
      fileName: 'anh-van-bi-dong-nut-vo.jpg',
      storageKey: 'defects/hl-01/anh-van-bi-dong-nut-vo.jpg',
      uploadedAt: '2026-11-25T09:00:00.000Z',
    },
    {
      id: 'def-doc-1',
      kind: 'document',
      fileName: 'bien-ban-giam-dinh-chat-luong.docx',
      storageKey: 'defects/hl-01/bien-ban-giam-dinh-chat-luong.docx',
      uploadedAt: '2026-11-25T09:05:00.000Z',
    },
  ];
}

describe('PendingLocalEvidence characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let objectUrlSeq: number;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    objectUrlSeq = 0;
    createObjectURLSpy = vi.fn(() => `blob:erp-preview-${++objectUrlSeq}`);
    revokeObjectURLSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLSpy,
    });

    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('PendingPhotoGrid renders object URLs, handles remove, and revokes created URLs on unmount', async () => {
    const onRemove = vi.fn();
    const photoA = new File([new Uint8Array(1536)], 'thep-hinh-bai-1.jpg', { type: 'image/jpeg' });
    const photoB = new File([new Uint8Array(2048)], 'van-cong-nghiep.png', { type: 'image/png' });

    await act(async () => {
      root.render(createElement(PendingPhotoGrid, { files: [], onRemove }));
    });
    expect(container.querySelector('ul')).toBeNull();

    await act(async () => {
      root.render(createElement(PendingPhotoGrid, { files: [photoA, photoB], onRemove }));
    });

    const list = container.querySelector('ul[aria-label="Ảnh đã chọn"]');
    expect(list).not.toBeNull();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('thep-hinh-bai-1.jpg');
    expect(container.textContent).toContain('1.5 KB');

    const removeBtn = container.querySelector(
      'button[aria-label="Xóa ảnh van-cong-nghiep.png"]',
    ) as HTMLButtonElement;
    await act(async () => {
      removeBtn.click();
    });
    expect(onRemove).toHaveBeenCalledWith(1);

    await act(async () => {
      root.render(createElement(PendingPhotoGrid, { files: [photoA], onRemove }));
    });
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:erp-preview-1');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:erp-preview-2');
  });

  it('PendingDocList renders file metadata, extension badge, and remove callback', async () => {
    const onRemove = vi.fn();
    const doc = new File([new Uint8Array(512)], 'phieu-nhap-kho-crm2.pdf', {
      type: 'application/pdf',
    });
    const noExt = new File([new Uint8Array(256)], 'ghichuvattu', { type: 'text/plain' });

    await act(async () => {
      root.render(createElement(PendingDocList, { files: [], onRemove }));
    });
    expect(container.querySelector('ul')).toBeNull();

    await act(async () => {
      root.render(createElement(PendingDocList, { files: [doc, noExt], onRemove }));
    });

    const list = container.querySelector('ul[aria-label="File đã chọn"]');
    expect(list).not.toBeNull();
    expect(container.textContent).toContain('PDF · 512 B');
    expect(container.textContent).toContain('FILE · 256 B');

    const removeBtn = container.querySelector(
      'button[aria-label="Xóa file phieu-nhap-kho-crm2.pdf"]',
    ) as HTMLButtonElement;
    await act(async () => {
      removeBtn.click();
    });
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('SavedDefectPhotoGrid loads defect photo blobs, downloads on click, retries on failure, and deletes when editable', async () => {
    const attachments = buildDefectAttachments();
    const onDelete = vi.fn();

    vi.mocked(defectsService.getAttachmentBlob)
      .mockRejectedValueOnce(new Error('Mất kết nối máy chủ'))
      .mockResolvedValueOnce(new Blob(['img'], { type: 'image/jpeg' }));

    await act(async () => {
      root.render(
        createElement(SavedDefectPhotoGrid, {
          ticketCode: 'HL-2026-009',
          attachments,
          canEdit: true,
          onDelete,
        }),
      );
    });
    await flush();

    const list = container.querySelector('ul[aria-label="Ảnh hàng lỗi"]');
    expect(list).not.toBeNull();
    expect(container.textContent).toContain('Không tải được — bấm thử lại');

    const retryBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Không tải được — bấm thử lại'),
    )!;
    await act(async () => {
      retryBtn.click();
    });
    await flush();

    expect(defectsService.getAttachmentBlob).toHaveBeenCalledTimes(2);
    const img = container.querySelector('img[alt="anh-van-bi-dong-nut-vo.jpg"]');
    expect(img).not.toBeNull();

    const openBtn = container.querySelector('.pending-evidence__photo-open') as HTMLButtonElement;
    await act(async () => {
      openBtn.click();
    });
    expect(defectsService.downloadAttachment).toHaveBeenCalledWith(
      'HL-2026-009',
      'def-photo-1',
      'anh-van-bi-dong-nut-vo.jpg',
    );

    const deleteBtn = container.querySelector(
      'button[aria-label="Xóa ảnh anh-van-bi-dong-nut-vo.jpg"]',
    ) as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    expect(onDelete).toHaveBeenCalledWith('def-photo-1');
  });

  it('SavedImportPhotoGrid distinguishes 404 missing vs generic error, supports kinds filter, retry, download, and canEdit delete', async () => {
    const attachments = buildImportAttachments();
    const onDelete = vi.fn();
    const onDownload = vi.fn();

    vi.mocked(importsService.downloadAttachment)
      .mockRejectedValueOnce(new ApiError('Not Found', 404))
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))
      .mockResolvedValue(new Blob(['ok'], { type: 'image/png' }));

    await act(async () => {
      root.render(
        createElement(SavedImportPhotoGrid, {
          importId: 'IMP-2026-015',
          attachments,
          kinds: ['photo', 'defect_photo'],
          canEdit: true,
          onDelete,
          onDownload,
        }),
      );
    });
    await flush();

    const list = container.querySelector('ul[aria-label="Ảnh nhận hàng"]');
    expect(list).not.toBeNull();
    expect(container.textContent).toContain('Ảnh không còn trên máy chủ');
    expect(container.textContent).toContain('Không tải được — bấm thử lại');

    const retryMissingBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Ảnh không còn trên máy chủ'),
    )!;
    await act(async () => {
      retryMissingBtn.click();
    });
    await flush();

    const openButtons = container.querySelectorAll('.pending-evidence__photo-open');
    expect(openButtons.length).toBe(2);
    await act(async () => {
      (openButtons[0] as HTMLButtonElement).click();
    });
    expect(onDownload).toHaveBeenCalledWith('att-photo-1', 'anh-nhan-ong-thep-duc.jpg');

    const deleteBtn = container.querySelector(
      'button[aria-label="Xóa ảnh anh-bich-thep-mop-meo.png"]',
    ) as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    expect(onDelete).toHaveBeenCalledWith('att-defect-1');
  });

  it('SavedExportReturnPhotoGrid loads export return blobs, handles 404, downloads, and respects canEdit=false', async () => {
    const attachments = buildImportAttachments();
    const onDownload = vi.fn();
    const onDelete = vi.fn();

    vi.mocked(exportReturnsService.downloadAttachment)
      .mockRejectedValueOnce(new ApiError('Missing', 404))
      .mockResolvedValueOnce(new Blob(['ret'], { type: 'image/jpeg' }));

    await act(async () => {
      root.render(
        createElement(SavedExportReturnPhotoGrid, {
          returnId: 'TH-2026-004',
          attachments,
          canEdit: false,
          onDelete,
          onDownload,
        }),
      );
    });
    await flush();

    expect(container.querySelector('ul[aria-label="Ảnh trả hàng"]')).not.toBeNull();
    expect(container.textContent).toContain('Ảnh không còn trên máy chủ');
    expect(container.querySelector('.pending-evidence__remove')).toBeNull();

    const retryBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Ảnh không còn trên máy chủ'),
    )!;
    await act(async () => {
      retryBtn.click();
    });
    await flush();

    const openBtn = container.querySelector('.pending-evidence__photo-open') as HTMLButtonElement;
    await act(async () => {
      openBtn.click();
    });
    expect(onDownload).toHaveBeenCalledWith('att-photo-1', 'anh-nhan-ong-thep-duc.jpg');
  });

  it('SavedDefectDocList and SavedImportDocList filter documents, render empty state, trigger download and optional delete', async () => {
    const defectAttachments = buildDefectAttachments();
    const importAttachments = buildImportAttachments();
    const onDeleteDefect = vi.fn();
    const onDeleteImport = vi.fn();
    const onDownloadImport = vi.fn();

    await act(async () => {
      root.render(
        createElement('div', null, [
          createElement(SavedDefectDocList, {
            key: 'def-empty',
            ticketCode: 'HL-01',
            attachments: defectAttachments.filter(a => a.kind === 'photo'),
          }),
          createElement(SavedDefectDocList, {
            key: 'def-full',
            ticketCode: 'HL-01',
            attachments: defectAttachments,
            canEdit: true,
            onDelete: onDeleteDefect,
          }),
          createElement(SavedImportDocList, {
            key: 'imp-full',
            attachments: importAttachments,
            canEdit: true,
            onDelete: onDeleteImport,
            onDownload: onDownloadImport,
          }),
        ]),
      );
    });

    expect(container.textContent).toContain('Chưa có file.');
    const defLink = Array.from(container.querySelectorAll('button.pending-evidence__name--link')).find(
      b => b.textContent === 'bien-ban-giam-dinh-chat-luong.docx',
    ) as HTMLButtonElement;
    await act(async () => {
      defLink.click();
    });
    expect(defectsService.downloadAttachment).toHaveBeenCalledWith(
      'HL-01',
      'def-doc-1',
      'bien-ban-giam-dinh-chat-luong.docx',
    );

    const impLink = Array.from(container.querySelectorAll('button.pending-evidence__name--link')).find(
      b => b.textContent === 'bien-ban-giao-hang-po-088.pdf',
    ) as HTMLButtonElement;
    await act(async () => {
      impLink.click();
    });
    expect(onDownloadImport).toHaveBeenCalledWith('att-doc-1', 'bien-ban-giao-hang-po-088.pdf');

    const delDefBtn = container.querySelector(
      'button[aria-label="Xóa file bien-ban-giam-dinh-chat-luong.docx"]',
    ) as HTMLButtonElement;
    const delImpBtn = container.querySelector(
      'button[aria-label="Xóa file bien-ban-giao-hang-po-088.pdf"]',
    ) as HTMLButtonElement;
    await act(async () => {
      delDefBtn.click();
      delImpBtn.click();
    });
    expect(onDeleteDefect).toHaveBeenCalledWith('def-doc-1');
    expect(onDeleteImport).toHaveBeenCalledWith('att-doc-1');
  });
});
