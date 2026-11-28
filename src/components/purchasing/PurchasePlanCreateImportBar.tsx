import { useState, useMemo, type RefObject } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Search,
  Upload,
} from 'lucide-react';
import Modal from '../ui/Modal';
import type { PurchasePlanImportPreviewApiDto } from '../../types/api/purchasingApi';
import { formatCurrency, formatCurrencyFull } from '../../utils/formatCurrency';
import type { DraftAmountStage, PlanAmountSourceMode } from './createPurchasePlanDraft';
import {
  RECONCILIATION_STAGES,
  RECONCILIATION_TOLERANCE_VND,
  type PurchasePlanReconciliationReport,
} from './purchasePlanReconciliation';

interface PurchasePlanCreateImportBarProps {
  busy: boolean;
  file: File | null;
  preview: PurchasePlanImportPreviewApiDto | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  templatePending: boolean;
  previewPending: boolean;
  amountSourceMode?: PlanAmountSourceMode;
  onAmountSourceModeChange?: (mode: PlanAmountSourceMode) => void;
  reconciliation?: PurchasePlanReconciliationReport | null;
  onDownloadTemplate: () => void;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  onClear: () => void;
}

function cleanErrorMessage(msg?: string): string {
  if (!msg) return '';
  return msg.replace(/^(?:Dòng(?: Excel)? \d+:\s*)+/i, '').trim();
}

function formatSignedCurrency(diff: number): string {
  if (diff === 0) return formatCurrencyFull(0);
  const formatted = formatCurrencyFull(Math.abs(diff));
  return diff > 0 ? `+${formatted}` : `-${formatted}`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
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
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

export default function PurchasePlanCreateImportBar({
  busy,
  file,
  preview,
  fileInputRef,
  templatePending,
  previewPending,
  amountSourceMode,
  onAmountSourceModeChange,
  reconciliation,
  onDownloadTemplate,
  onFileChange,
  onImport,
  onClear,
}: PurchasePlanCreateImportBarProps) {
  const [showAllErrorsModal, setShowAllErrorsModal] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileStageFilter, setReconcileStageFilter] = useState<'all' | DraftAmountStage>('all');
  const [reconcileQuery, setReconcileQuery] = useState('');
  const [copiedMismatches, setCopiedMismatches] = useState(false);

  const activeMode: PlanAmountSourceMode = amountSourceMode ?? 'excel';

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

  const filteredMismatches = useMemo(() => {
    if (!reconciliation?.mismatches) return [];
    const query = reconcileQuery.trim().toLowerCase();
    return reconciliation.mismatches.filter(m => {
      if (reconcileStageFilter !== 'all' && m.stage !== reconcileStageFilter) {
        return false;
      }
      if (!query) return true;
      return (
        String(m.rowNumber).includes(query)
        || m.materialCode.toLowerCase().includes(query)
        || m.productName.toLowerCase().includes(query)
        || m.stageLabel.toLowerCase().includes(query)
        || m.reason.toLowerCase().includes(query)
      );
    });
  }, [reconciliation, reconcileStageFilter, reconcileQuery]);

  const handleCopyErrors = async () => {
    if (!preview?.errors?.length) return;
    const text = preview.errors
      .map(err => {
        const cleanMsg = cleanErrorMessage(err.message);
        return `Dòng Excel ${err.rowNumber}: [${err.field || 'Chung'}] ${cleanMsg}`;
      })
      .join('\n');
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyMismatches = async () => {
    if (!reconciliation?.mismatches?.length) return;
    const text = reconciliation.mismatches
      .map(m => {
        const excelTxt = m.excelAmount != null ? formatCurrencyFull(m.excelAmount) : 'Trống';
        const webTxt = m.webAmount != null ? formatCurrencyFull(m.webAmount) : 'Trống';
        return `Dòng Excel ${m.rowNumber}: [${m.materialCode || m.productName} - ${m.stageLabel}] Excel=${excelTxt} | Web=${webTxt} | Chênh=${formatSignedCurrency(m.diff)} | ${m.reason}`;
      })
      .join('\n');
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedMismatches(true);
      setTimeout(() => setCopiedMismatches(false), 2000);
    }
  };

  const closeReconcileModal = () => {
    setShowReconcileModal(false);
    setReconcileStageFilter('all');
    setReconcileQuery('');
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
              {preview.errors.slice(0, 5).map((err, i) => {
                const cleanMsg = cleanErrorMessage(err.message);
                return (
                  <li key={`${err.rowNumber}-${err.field}-${i}`}>
                    Dòng Excel {err.rowNumber}: {cleanMsg}
                  </li>
                );
              })}
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

      {preview && reconciliation && preview.validRowCount > 0 && (
        <div className="pur-create-plan__reconcile" aria-label="Đối chiếu giá Excel và Web tính">
          <div className="pur-create-plan__reconcile-head">
            <div className="pur-create-plan__reconcile-title-group">
              {reconciliation.hasMismatch ? (
                <>
                  <span className="pur-create-plan__reconcile-status pur-create-plan__reconcile-status--warn">
                    <AlertTriangle size={14} aria-hidden />
                    <span>
                      Lệch {reconciliation.mismatchedRowCount} dòng ({reconciliation.mismatches.length} mục)
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm pur-create-plan__reconcile-detail-btn"
                    onClick={() => setShowReconcileModal(true)}
                  >
                    Xem chi tiết dòng lệch
                  </button>
                </>
              ) : (
                <span className="pur-create-plan__reconcile-status pur-create-plan__reconcile-status--ok">
                  <CheckCircle2 size={14} aria-hidden />
                  <span>Khớp 100% giữa Excel và công thức Web</span>
                </span>
              )}
            </div>

            <div
              className="pur-create-plan__mode-switch flex-row items-center whitespace-nowrap"
              role="radiogroup"
              aria-label="Nguồn thành tiền lưu vào KHMH"
            >
              <button
                type="button"
                role="radio"
                aria-checked={activeMode === 'excel'}
                disabled={busy}
                className={`pur-create-plan__mode-pill${activeMode === 'excel' ? ' is-active' : ''}`}
                onClick={() => onAmountSourceModeChange?.('excel')}
              >
                Dùng giá Excel
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={activeMode === 'web'}
                disabled={busy}
                className={`pur-create-plan__mode-pill${activeMode === 'web' ? ' is-active' : ''}`}
                onClick={() => onAmountSourceModeChange?.('web')}
              >
                Dùng giá Web tính
              </button>
            </div>
          </div>

          <p className="pur-create-plan__reconcile-note">
            Công thức Web: trống KG/ĐVT → SL × ĐG · có KG/ĐVT → SL × KG/ĐVT × ĐG (theo đúng KG/ĐVT từng nhóm).
          </p>

          <div className="pur-create-plan__reconcile-table-wrap">
            <table className="form-table pur-create-plan__reconcile-table">
              <thead>
                <tr>
                  <th className="table-header-cell text-left">Nhóm</th>
                  <th className="table-header-cell text-right">Giá Excel</th>
                  <th className="table-header-cell text-right">Giá Web tính</th>
                  <th className="table-header-cell text-right">Chênh lệch</th>
                  <th className="table-header-cell text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.stages.map(stageSummary => {
                  const hasStageDiff = !stageSummary.matched || Math.abs(stageSummary.diff) > RECONCILIATION_TOLERANCE_VND;
                  const diffTone = stageSummary.diff > 0
                    ? ' pur-create-plan__reconcile-diff--pos'
                    : stageSummary.diff < 0
                      ? ' pur-create-plan__reconcile-diff--neg'
                      : ' pur-create-plan__reconcile-diff--zero';
                  return (
                    <tr key={stageSummary.stage}>
                      <td className="table-cell font-semibold">{stageSummary.label}</td>
                      <td className="table-cell text-right tabular-nums">{formatCurrencyFull(stageSummary.excelTotal)}</td>
                      <td className="table-cell text-right tabular-nums">{formatCurrencyFull(stageSummary.webTotal)}</td>
                      <td className={`table-cell text-right tabular-nums font-semibold${diffTone}`}>
                        {formatSignedCurrency(stageSummary.diff)}
                      </td>
                      <td className="table-cell text-center">
                        {hasStageDiff ? (
                          <span className="pur-create-plan__reconcile-badge pur-create-plan__reconcile-badge--warn">
                            Lệch {stageSummary.mismatchCount} dòng
                          </span>
                        ) : (
                          <span className="pur-create-plan__reconcile-badge pur-create-plan__reconcile-badge--ok">
                            Khớp
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && reconciliation && preview.validRowCount > 0 && (
        <Modal
          isOpen={showReconcileModal}
          onClose={closeReconcileModal}
          size="lg"
          title={`Chi tiết dòng lệch Excel vs Web (${reconciliation.mismatches.length} mục trên ${reconciliation.mismatchedRowCount} dòng)`}
          subtitle={
            <div className="pur-reconcile-modal__subtitle">
              File: <strong>{file?.name ?? 'Excel'}</strong> — Sheet: <strong>{preview.sheetName || '—'}</strong>
            </div>
          }
          beforeBody={
            <div className="pur-reconcile-modal__toolbar">
              <div className="pur-reconcile-modal__search-wrap">
                <Search size={15} className="pur-reconcile-modal__search-icon" aria-hidden />
                <input
                  type="search"
                  value={reconcileQuery}
                  onChange={e => setReconcileQuery(e.target.value)}
                  placeholder="Tìm theo dòng, mã VT, tên hàng hoặc nguyên nhân…"
                  aria-label="Tìm kiếm dòng lệch"
                  className="form-input form-input-sm pur-reconcile-modal__search"
                />
              </div>

              <div className="pur-reconcile-modal__filters" role="group" aria-label="Lọc theo nhóm">
                <button
                  type="button"
                  aria-pressed={reconcileStageFilter === 'all'}
                  className={`pur-reconcile-modal__filter-pill${reconcileStageFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setReconcileStageFilter('all')}
                >
                  Tất cả
                </button>
                {RECONCILIATION_STAGES.map(s => (
                  <button
                    key={s.stage}
                    type="button"
                    aria-pressed={reconcileStageFilter === s.stage}
                    className={`pur-reconcile-modal__filter-pill${reconcileStageFilter === s.stage ? ' is-active' : ''}`}
                    onClick={() => setReconcileStageFilter(s.stage)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm pur-reconcile-modal__copy-btn"
                aria-label="Sao chép danh sách lệch"
                onClick={handleCopyMismatches}
              >
                {copiedMismatches ? (
                  <>
                    <Check size={14} aria-hidden />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden />
                    <span>Sao chép danh sách lệch</span>
                  </>
                )}
              </button>
            </div>
          }
          footer={
            <div className="pur-reconcile-modal__footer">
              <span className="pur-reconcile-modal__count">
                Hiển thị <strong>{filteredMismatches.length}</strong> / <strong>{reconciliation.mismatches.length}</strong> mục lệch
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={closeReconcileModal}>
                Đóng
              </button>
            </div>
          }
        >
          <div className="pur-reconcile-modal__body">
            <div className="pur-reconcile-modal__table-wrap">
              <table className="form-table pur-reconcile-modal__table">
                <thead>
                  <tr>
                    <th className="table-header-cell text-center">Dòng Excel</th>
                    <th className="table-header-cell text-left">Mã VT / Tên hàng</th>
                    <th className="table-header-cell text-left">Nhóm</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-right">KG/ĐVT nhóm</th>
                    <th className="table-header-cell text-right">Đơn giá</th>
                    <th className="table-header-cell text-right">Giá Excel</th>
                    <th className="table-header-cell text-right">Giá Web tính</th>
                    <th className="table-header-cell text-right">Chênh lệch</th>
                    <th className="table-header-cell text-left">Nguyên nhân gợi ý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMismatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="table-cell pur-reconcile-modal__empty">
                        Không có mục lệch phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredMismatches.map((m, idx) => (
                      <tr key={`${m.lineKey}-${m.stage}-${idx}`}>
                        <td className="table-cell text-center tabular-nums">
                          <span className="pur-reconcile-modal__row-pill">Dòng {m.rowNumber}</span>
                        </td>
                        <td className="table-cell">
                          <div className="pur-reconcile-modal__item-cell">
                            {m.materialCode ? (
                              <span className="pur-reconcile-modal__item-code">{m.materialCode}</span>
                            ) : null}
                            <span className="pur-reconcile-modal__item-name">{m.productName || '—'}</span>
                          </div>
                        </td>
                        <td className="table-cell font-semibold">{m.stageLabel}</td>
                        <td className="table-cell text-right tabular-nums">
                          {formatCurrency(m.quantity)}
                          {m.unit ? ` ${m.unit}` : ''}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {m.stageKg != null ? formatCurrency(m.stageKg) : '—'}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {m.unitPrice != null ? formatCurrencyFull(m.unitPrice) : '—'}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {m.excelAmount != null ? formatCurrencyFull(m.excelAmount) : 'Trống'}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {m.webAmount != null ? formatCurrencyFull(m.webAmount) : 'Trống'}
                        </td>
                        <td className="table-cell text-right tabular-nums font-semibold pur-reconcile-modal__diff-cell">
                          {formatSignedCurrency(m.diff)}
                        </td>
                        <td className="table-cell pur-reconcile-modal__reason-cell">{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
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
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[length:var(--fs-micro)] font-semibold bg-[var(--md-error-container)] text-[var(--md-on-error-container)]">
                              Dòng {err.rowNumber}
                            </span>
                          </td>
                          <td className="table-cell font-medium text-[var(--md-on-surface)]">
                            {err.field ? (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--md-surface-container-highest)] font-mono text-[length:var(--fs-micro)]">
                                {err.field}
                              </span>
                            ) : (
                              <span className="text-[var(--md-on-surface-variant)] italic">—</span>
                            )}
                          </td>
                          <td className="table-cell text-[var(--md-error)] font-normal leading-relaxed">
                            {cleanErrorMessage(err.message)}
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
