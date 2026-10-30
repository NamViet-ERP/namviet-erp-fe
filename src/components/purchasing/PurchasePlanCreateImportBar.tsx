import { useState, useMemo, type RefObject } from 'react';
import { AlertCircle, Check, Copy, Download, FileSpreadsheet, Search, Upload } from 'lucide-react';
import Modal from '../ui/Modal';
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
  const [showAllErrorsModal, setShowAllErrorsModal] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredErrors = useMemo(() => {
    if (!preview?.errors) return [];
    const query = filterText.trim().toLowerCase();
    if (!query) return preview.errors;
    return preview.errors.filter(err => {
      const rowStr = String(err.rowNumber);
      const fieldStr = (err.field ?? '').toLowerCase();
      const msgStr = (err.message ?? '').toLowerCase();
      return rowStr.includes(query) || fieldStr.includes(query) || msgStr.includes(query);
    });
  }, [preview, filterText]);

  const handleCopyErrors = async () => {
    if (!preview?.errors?.length) return;
    const text = preview.errors
      .map(err => `Dòng ${err.rowNumber}: [${err.field || 'Chung'}] ${err.message}`)
      .join('\n');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

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
            <span className="pur-create-plan__preview-error inline-flex items-center">
              Lỗi: <strong>{preview.errorRowCount}</strong>
              {preview.errors?.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline btn-xs ml-2 text-[var(--md-error)] border-[var(--md-error)]/40 hover:bg-[var(--md-error)]/10"
                  onClick={() => setShowAllErrorsModal(true)}
                >
                  Xem chi tiết {preview.errors.length} lỗi
                </button>
              )}
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
                <li className="pur-create-plan__error-more">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium underline text-[var(--md-error)] hover:opacity-80 transition-opacity"
                    onClick={() => setShowAllErrorsModal(true)}
                  >
                    …và {preview.errors.length - 5} lỗi khác (Bấm để xem chi tiết toàn bộ {preview.errors.length} lỗi)
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}

      {preview && (
        <Modal
          isOpen={showAllErrorsModal}
          onClose={() => setShowAllErrorsModal(false)}
          size="lg"
          title={`Chi tiết lỗi Import Excel (${preview.errors?.length ?? 0} lỗi trên ${preview.errorRowCount ?? 0} dòng)`}
          subtitle={
            <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
              File: <strong>{file?.name ?? 'Excel'}</strong> — Sheet: <strong>{preview.sheetName || '—'}</strong>
            </div>
          }
          beforeBody={
            <div className="px-6 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)] pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  placeholder="Tìm theo số dòng, tên cột hoặc nội dung lỗi…"
                  aria-label="Tìm kiếm lỗi"
                  className="form-input text-xs pl-9 pr-3 py-1.5 w-full rounded-md border border-[var(--md-outline)] bg-[var(--md-surface)]"
                />
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm inline-flex items-center gap-1.5 text-xs"
                onClick={handleCopyErrors}
                title="Sao chép toàn bộ lỗi vào bộ nhớ tạm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-[var(--md-success)]" />
                    <span className="text-[var(--md-success)] font-medium">Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Sao chép toàn bộ lỗi ({preview.errors?.length ?? 0})</span>
                  </>
                )}
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[var(--md-on-surface-variant)]">
                Hiển thị <strong>{filteredErrors.length}</strong> / <strong>{preview.errors?.length ?? 0}</strong> lỗi
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAllErrorsModal(false)}
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-highest)]/40 text-xs text-[var(--md-on-surface-variant)]">
              <AlertCircle size={16} className="text-[var(--md-primary)] shrink-0 mt-0.5" aria-hidden />
              <div className="leading-relaxed">
                Hệ thống đã tự động lọc bỏ các dòng lỗi này (thường là dòng tiêu đề nhóm, dòng trống, hoặc thiếu mã vật tư) và nạp đầy đủ{' '}
                <strong className="text-[var(--md-on-surface)]">{preview.validRowCount} dòng hợp lệ</strong> vào bảng.
              </div>
            </div>

            <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="form-table w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--md-surface-container-high)] shadow-sm z-10">
                    <tr>
                      <th className="table-header-cell text-center w-28">Dòng Excel</th>
                      <th className="table-header-cell text-left w-36">Cột / Trường</th>
                      <th className="table-header-cell text-left">Chi tiết lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-outline-variant)]/60">
                    {filteredErrors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-[var(--md-on-surface-variant)]">
                          {filterText ? 'Không tìm thấy lỗi phù hợp với từ khóa.' : 'Không có lỗi nào.'}
                        </td>
                      </tr>
                    ) : (
                      filteredErrors.map((err, idx) => (
                        <tr key={`${err.rowNumber}-${err.field}-${idx}`} className="hover:bg-[var(--md-surface-container-low)] transition-colors">
                          <td className="table-cell text-center tabular-nums font-semibold">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--md-error-container)] text-[var(--md-on-error-container)]">
                              Dòng {err.rowNumber}
                            </span>
                          </td>
                          <td className="table-cell font-medium text-[var(--md-on-surface)]">
                            {err.field ? (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--md-surface-container-highest)] font-mono text-[11px]">
                                {err.field}
                              </span>
                            ) : (
                              <span className="text-[var(--md-on-surface-variant)] italic">—</span>
                            )}
                          </td>
                          <td className="table-cell text-[var(--md-error)] font-normal leading-relaxed">
                            {err.message}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
