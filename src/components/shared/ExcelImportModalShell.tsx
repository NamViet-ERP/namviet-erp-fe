import { useRef, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';

export interface ExcelImportStatCard {
  key: string;
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface ExcelImportFilterTab {
  id: string;
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}

export interface ExcelImportOverwriteOption {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export interface ExcelImportModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  acceptedExtensions?: readonly string[];
  acceptAttr?: string;
  maxFileSizeMb?: number;
  isDownloadingTemplate?: boolean;
  onDownloadTemplate: () => void;
  templateButtonLabel?: string;
  templateTitle?: string;
  templateHint?: ReactNode;
  selectFileAriaLabel?: string;
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  dropzoneHint: string;
  alwaysShowDropzone?: boolean;
  isParsing: boolean;
  parsingTitle?: string;
  parsingSubtitle?: string;
  parseError?: string | null;
  hasPreview: boolean;
  availableSheets?: readonly string[];
  selectedSheet?: string;
  onSheetChange?: (sheet: string) => void;
  stats?: readonly ExcelImportStatCard[];
  statsColumns?: 3 | 4;
  beforeUploadSlot?: ReactNode;
  alertSlot?: ReactNode;
  overwriteOption?: ExcelImportOverwriteOption;
  filterTabs?: readonly ExcelImportFilterTab[];
  activeFilterTab?: string;
  onFilterTabChange?: (tabId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  footerSummary: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmingLabel?: string;
  confirmDisabled: boolean;
  isImporting: boolean;
  onConfirm: () => void;
  children?: ReactNode;
  extraModals?: ReactNode;
}

const STAT_BOX_CLASS: Record<NonNullable<ExcelImportStatCard['tone']>, string> = {
  neutral: 'excel-import-stat--neutral',
  success: 'excel-import-stat--success',
  warning: 'excel-import-stat--warning',
  danger: 'excel-import-stat--danger',
};

const STAT_LABEL_CLASS: Record<NonNullable<ExcelImportStatCard['tone']>, string> = {
  neutral: 'excel-import-stat__label--neutral',
  success: 'excel-import-stat__label--success',
  warning: 'excel-import-stat__label--warning',
  danger: 'excel-import-stat__label--danger',
};

const STAT_VALUE_CLASS: Record<NonNullable<ExcelImportStatCard['tone']>, string> = {
  neutral: 'excel-import-stat__value--neutral',
  success: 'excel-import-stat__value--success',
  warning: 'excel-import-stat__value--warning',
  danger: 'excel-import-stat__value--danger',
};

const ACTIVE_TAB_CLASS: Record<NonNullable<ExcelImportFilterTab['tone']>, string> = {
  neutral: 'excel-import-tab--active-neutral',
  success: 'excel-import-tab--active-success',
  warning: 'excel-import-tab--active-warning',
  danger: 'excel-import-tab--active-danger',
};

export default function ExcelImportModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  selectedFile,
  onFileSelect,
  acceptedExtensions = ['xlsx', 'xls'],
  acceptAttr = '.xlsx,.xls',
  maxFileSizeMb = 5,
  isDownloadingTemplate = false,
  onDownloadTemplate,
  templateButtonLabel = 'Tải file mẫu Excel (.xlsx)',
  templateTitle,
  templateHint,
  selectFileAriaLabel,
  dropzoneTitle,
  dropzoneSubtitle,
  dropzoneHint,
  alwaysShowDropzone = false,
  isParsing,
  parsingTitle = 'Đang phân tích và đối soát dữ liệu với CSDL…',
  parsingSubtitle,
  parseError,
  hasPreview,
  availableSheets,
  selectedSheet,
  onSheetChange,
  stats,
  statsColumns = 4,
  beforeUploadSlot,
  alertSlot,
  overwriteOption,
  filterTabs,
  activeFilterTab,
  onFilterTabChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  footerSummary,
  cancelLabel = 'Hủy',
  confirmLabel,
  confirmingLabel = 'Đang nhập dữ liệu…',
  confirmDisabled,
  isImporting,
  onConfirm,
  children,
  extraModals,
}: ExcelImportModalShellProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isImporting) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const validateAndSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!acceptedExtensions.includes(ext)) {
      const extText = acceptedExtensions.map(e => `.${e}`).join(', ');
      showToast('warning', `Vui lòng chọn file bảng tính định dạng ${extText}`);
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      showToast('warning', `Kích thước file tối đa là ${maxFileSizeMb}MB`);
      return;
    }
    onFileSelect(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const activeSheet = selectedSheet || '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={title}
        subtitle={subtitle}
        size="wide"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-[var(--md-on-surface-variant)]">{footerSummary}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClose}
                disabled={isImporting}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                disabled={confirmDisabled || isImporting || isParsing}
                onClick={onConfirm}
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{confirmingLabel}</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>{confirmLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {beforeUploadSlot}

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
            <div className="flex items-center gap-2.5">
              {templateTitle ? (
                <>
                  <div className="w-9 h-9 rounded-lg bg-[var(--md-primary)]/10 text-[var(--md-primary)] flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--md-on-surface)]">{templateTitle}</div>
                    {templateHint ? (
                      <div className="excel-import-micro-note">{templateHint}</div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-xs flex items-center gap-1.5 cursor-pointer text-[var(--md-primary)] hover:bg-[var(--md-primary)]/10"
                    onClick={onDownloadTemplate}
                    disabled={isDownloadingTemplate}
                  >
                    {isDownloadingTemplate ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang tải file mẫu...</span>
                      </>
                    ) : (
                      <>
                        <Download size={13} />
                        <span>{templateButtonLabel}</span>
                      </>
                    )}
                  </button>
                  {templateHint ? (
                    <span className="excel-import-micro-note">{templateHint}</span>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {templateTitle ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm text-xs flex items-center gap-1.5 shrink-0"
                  onClick={onDownloadTemplate}
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>{isDownloadingTemplate ? 'Đang tải...' : templateButtonLabel}</span>
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                className="hidden"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
                aria-label={selectFileAriaLabel}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing || isImporting}
              >
                <FileSpreadsheet size={13} />
                <span>{selectedFile ? 'Chọn file khác' : 'Chọn file Excel tải lên'}</span>
              </button>
            </div>
          </div>

          {(alwaysShowDropzone || (!selectedFile && !isParsing)) && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center ${
                selectedFile
                  ? 'border-[var(--md-primary)] bg-[var(--md-primary)]/5'
                  : 'border-[var(--md-outline-variant)] hover:border-[var(--md-primary)] bg-[var(--md-surface-container-lowest)]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--md-primary-container)] text-[var(--md-primary)] flex items-center justify-center mb-3">
                {isParsing ? <RefreshCw size={24} className="animate-spin" /> : <Upload size={24} />}
              </div>
              {alwaysShowDropzone && selectedFile ? (
                <>
                  <p className="text-sm font-medium text-[var(--md-on-surface)]">
                    Đã chọn: <strong className="text-[var(--md-primary)]">{selectedFile.name}</strong>
                  </p>
                  <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Nhấn hoặc kéo thả file khác để thay thế
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--md-on-surface)]">{dropzoneTitle}</p>
                  <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">{dropzoneSubtitle}</p>
                  <p className="excel-import-dropzone__hint mt-3">{dropzoneHint}</p>
                </>
              )}
            </div>
          )}

          {isParsing && !alwaysShowDropzone && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw size={28} className="animate-spin text-[var(--md-primary)] mb-2" />
              <p className="text-sm font-medium text-[var(--md-on-surface)]">{parsingTitle}</p>
              {parsingSubtitle ? (
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">{parsingSubtitle}</p>
              ) : null}
            </div>
          )}

          {parseError && (
            <div className="p-3 rounded-lg border border-[var(--md-error)]/30 bg-[color-mix(in_srgb,var(--md-error)_8%,transparent)] text-xs text-[var(--md-error)] flex items-start gap-2">
              <XCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lỗi đọc file:</p>
                <p>{parseError}</p>
              </div>
            </div>
          )}

          {hasPreview && !isParsing && (
            <div className="space-y-3">
              {availableSheets && availableSheets.length > 1 && onSheetChange && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg border border-[var(--md-primary)]/30 bg-[var(--md-primary)]/5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-[var(--md-primary)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--md-on-surface)]">
                      Chọn Sheet cần xem / nhập:
                    </span>
                    <span className="excel-import-micro-note">
                      (File có {availableSheets.length} sheet)
                    </span>
                  </div>
                  <select
                    value={activeSheet}
                    onChange={e => onSheetChange(e.target.value)}
                    disabled={isParsing || isImporting}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)] cursor-pointer shadow-sm hover:border-[var(--md-primary)] transition-colors"
                  >
                    {availableSheets.map(s => (
                      <option key={s} value={s}>
                        {s} {s === activeSheet ? ' (Đang chọn)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {stats && stats.length > 0 && (
                <div className={`grid gap-2.5 ${statsColumns === 3 ? 'grid-cols-3 text-center' : 'grid-cols-2 sm:grid-cols-4'}`}>
                  {stats.map(stat => {
                    const tone = stat.tone ?? 'neutral';
                    return (
                      <div key={stat.key} className={`p-2.5 rounded-lg border ${STAT_BOX_CLASS[tone]}`}>
                        <span className={`excel-import-stat__label ${STAT_LABEL_CLASS[tone]}`}>{stat.label}</span>
                        <p className={`text-lg font-bold mt-0.5 ${STAT_VALUE_CLASS[tone]}`}>{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {alertSlot}

              {(overwriteOption || (filterTabs && filterTabs.length > 0) || onSearchChange) && (
                <div className="space-y-2.5">
                  {(overwriteOption || (filterTabs && filterTabs.length > 0)) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
                      {overwriteOption ? (
                        <label
                          htmlFor={overwriteOption.id}
                          className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--md-on-surface)]"
                        >
                          <input
                            id={overwriteOption.id}
                            type="checkbox"
                            className="rounded border-[var(--md-outline)] text-[var(--md-primary)] focus:ring-[var(--md-primary)]"
                            checked={overwriteOption.checked}
                            onChange={e => overwriteOption.onChange(e.target.checked)}
                          />
                          <span className="font-medium">{overwriteOption.label}</span>
                          {overwriteOption.hint ? (
                            <span className="excel-import-micro-note">
                              {overwriteOption.hint}
                            </span>
                          ) : null}
                        </label>
                      ) : null}

                      {filterTabs && filterTabs.length > 0 && onFilterTabChange && (
                        <div className="flex items-center gap-1 bg-[var(--md-surface-container-highest)] p-1 rounded-md text-xs">
                          {filterTabs.map(tab => {
                            const active = activeFilterTab === tab.id;
                            const tone = tab.tone ?? 'neutral';
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                className={`px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1 ${
                                  active
                                    ? ACTIVE_TAB_CLASS[tone]
                                    : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                                }`}
                                onClick={() => onFilterTabChange(tab.id)}
                              >
                                {tab.icon}
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {!overwriteOption && onSearchChange && (
                        <div className="relative flex-1 max-w-sm">
                          <Search size={14} className="absolute left-3 top-2.5 text-[var(--md-on-surface-variant)]" />
                          <input
                            type="text"
                            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={e => onSearchChange(e.target.value)}
                          />
                          {searchValue && (
                            <button
                              type="button"
                              onClick={() => onSearchChange('')}
                              className="absolute right-2.5 top-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {overwriteOption && onSearchChange && (
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-[var(--md-on-surface-variant)]" />
                      <input
                        type="text"
                        className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={e => onSearchChange(e.target.value)}
                      />
                      {searchValue && (
                        <button
                          type="button"
                          onClick={() => onSearchChange('')}
                          className="absolute right-2.5 top-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {children}
            </div>
          )}
        </div>
      </Modal>
      {extraModals}
    </>
  );
}
