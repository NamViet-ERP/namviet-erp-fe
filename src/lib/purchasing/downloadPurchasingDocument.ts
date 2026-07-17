import type { DocumentRow } from '../../data/purchasingMock';

/** In-memory blobs for UI-only uploads (lost on refresh). */
const documentBlobs = new Map<string, Blob>();

export function attachPurchasingDocumentBlob(docId: string, blob: Blob) {
  documentBlobs.set(docId, blob);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** UTF-8 HTML mock — tiếng Việt đọc đúng (PDF Type1/Helvetica không hỗ trợ Unicode). */
export function buildMockDocumentBlob(doc: DocumentRow): Blob {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.name)}</title>
  <style>
    body { font-family: "Segoe UI", Tahoma, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; margin: 0; }
    dt { color: #555; font-weight: 600; }
    dd { margin: 0; }
    .note { margin-top: 28px; padding: 12px 14px; background: #f5f5f5; border-radius: 8px; font-size: 0.875rem; color: #444; }
  </style>
</head>
<body>
  <h1>NamViet ERP — Hồ sơ cung ứng</h1>
  <p class="meta">File mẫu UI (tiếng Việt UTF-8). Thay bằng file thật khi có backend.</p>
  <dl>
    <dt>Tài liệu</dt><dd>${escapeHtml(doc.name)}</dd>
    <dt>Loại</dt><dd>${escapeHtml(doc.docType)}</dd>
    <dt>Dự án</dt><dd>${escapeHtml(doc.project)}</dd>
    <dt>PO</dt><dd>${escapeHtml(doc.poCode)}</dd>
    <dt>NCC</dt><dd>${escapeHtml(doc.supplier)}</dd>
    <dt>Ngày</dt><dd>${escapeHtml(doc.uploadedAt)}</dd>
  </dl>
  <p class="note">Đây là chứng từ demo để kiểm tra tải xuống. Trạng thái Đủ / Thiếu… được tính theo checklist của PO trên màn Hồ sơ, không ghi trong file.</p>
</body>
</html>
`;
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

/** @deprecated alias — kept for existing imports */
export function buildMockPdfBlob(doc: DocumentRow): Blob {
  return buildMockDocumentBlob(doc);
}

function mockDownloadName(originalName: string) {
  const base = originalName.replace(/\.(pdf|docx?|xlsx?|png|jpe?g)$/i, '').trim() || 'ho-so';
  return `${base}.html`;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download stored upload blob, or generate UTF-8 HTML mock. */
export function downloadPurchasingDocument(doc: DocumentRow) {
  const stored = documentBlobs.get(doc.id);
  if (stored) {
    const isGeneratedHtml = stored.type.startsWith('text/html');
    triggerBrowserDownload(stored, isGeneratedHtml ? mockDownloadName(doc.name) : doc.name);
    return;
  }
  triggerBrowserDownload(buildMockDocumentBlob(doc), mockDownloadName(doc.name));
}
