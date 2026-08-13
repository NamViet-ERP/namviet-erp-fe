import { type RefObject } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import type { PurchasePlanImportPreviewApiDto } from '../../types/api/purchasingApi';

interface PurchasePlanCreateImportBarProps {
  busy: boolean;
  file: File | null;
  preview: PurchasePlanImportPreviewApiDto | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  templatePending: boolean;
  previewPending: boolean;
  onDownloadTemplate: () => void;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  onClear: () => void;
}

export default function PurchasePlanCreateImportBar({
  busy,
  file,
  preview,
  fileInputRef,
  templatePending,
  previewPending,
  onDownloadTemplate,
  onFileChange,
  onImport,
  onClear,
}: PurchasePlanCreateImportBarProps) {
  return (
    <section className="pur-create-plan__import" aria-label="Import Excel">
      <div className="pur-create-plan__import-bar">
        <span className="pur-create-plan__import-label">Import Excel</span>
        <div className="pur-create-plan__import-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={onDownloadTemplate}
          >
            <Download size={14} aria-hidden />
            {templatePending ? 'Đang tải…' : 'Tải mẫu'}
          </button>

          <label className="btn btn-outline btn-sm">
            <Upload size={14} aria-hidden />
            Chọn file
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              disabled={busy}
              onChange={e => {
                onFileChange(e.target.files?.[0] ?? null);
              }}
              aria-label="File Excel KHMH"
            />
          </label>

          {file ? (
            <span className="pur-create-plan__file-name" title={file.name}>{file.name}</span>
          ) : (
            <span className="pur-create-plan__file-placeholder">Chưa chọn file</span>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy || !file}
            onClick={onImport}
          >
            <FileSpreadsheet size={14} aria-hidden />
            {previewPending ? 'Đang import…' : 'Import'}
          </button>

          {preview ? (
            <button type="button" className="btn btn-text btn-sm" disabled={busy} onClick={onClear}>
              Xóa kết quả file
            </button>
          ) : null}
        </div>
      </div>

      {preview && (
        <div className="pur-create-plan__preview">
          <span>Sheet: <strong>{preview.sheetName || '—'}</strong></span>
          <span>Hợp lệ: <strong>{preview.validRowCount}</strong>/{preview.totalRows}</span>
          {preview.errorRowCount > 0 ? (
            <span className="pur-create-plan__preview-error">
              Lỗi: <strong>{preview.errorRowCount}</strong>
            </span>
          ) : (
            <span className="pur-create-plan__preview-ok">Đã đổ vào bảng bên dưới</span>
          )}
          {preview.errors?.length ? (
            <ul className="pur-create-plan__preview-errors">
              {preview.errors.slice(0, 5).map((err, i) => (
                <li key={`${err.rowNumber}-${err.field}-${i}`}>
                  Dòng Excel {err.rowNumber}: {err.message}
                </li>
              ))}
              {preview.errors.length > 5 ? (
                <li>…và {preview.errors.length - 5} lỗi khác</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
