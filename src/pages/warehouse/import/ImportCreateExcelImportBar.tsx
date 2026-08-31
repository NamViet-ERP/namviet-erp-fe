import { Download, Plus, Upload } from 'lucide-react';
import type { ImportParseErrorApiDto } from '../../../types/api/importParseApi';

export interface ImportCreateExcelImportBarProps {
  isDownloadingTemplate: boolean;
  isPending: boolean;
  importDisabled: boolean;
  selectedFileName: string;
  isImportParsing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDownloadTemplate: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}

export default function ImportCreateExcelImportBar({
  isDownloadingTemplate,
  isPending,
  importDisabled,
  selectedFileName,
  isImportParsing,
  fileInputRef,
  onDownloadTemplate,
  onFileChange,
  onImport,
}: ImportCreateExcelImportBarProps) {
  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-sm text-xs"
        disabled={isDownloadingTemplate || isPending}
        onClick={onDownloadTemplate}
      >
        <Download size={12} />
        {isDownloadingTemplate ? 'Đang tải…' : 'Tải mẫu import'}
      </button>
      <label className={`btn btn-outline btn-sm text-xs ${importDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
        <Upload size={12} />
        Chọn file
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          disabled={importDisabled}
          onChange={onFileChange}
        />
      </label>
      {selectedFileName ? (
        <span className="text-[11px] text-[var(--md-on-surface-variant)] max-w-[140px] truncate" title={selectedFileName}>
          {selectedFileName}
        </span>
      ) : null}
      <button
        type="button"
        className="btn btn-filled btn-sm text-xs"
        disabled={importDisabled || !selectedFileName}
        onClick={onImport}
      >
        {isImportParsing ? 'Đang import…' : 'Import mặt hàng'}
      </button>
    </>
  );
}

export function ImportCreateItemsToolbar({
  isPoLineMode,
  selectedPoCode,
  selectedPoLineCount,
  showExcelBar,
  excelBar,
  onAddMaterialLine,
  projectCode,
  issueFromGeneralWarehouse = false,
}: {
  isPoLineMode: boolean;
  selectedPoCode: string;
  selectedPoLineCount: number;
  showExcelBar: boolean;
  excelBar: React.ReactNode;
  onAddMaterialLine: () => void;
  projectCode: string;
  issueFromGeneralWarehouse?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">
          {isPoLineMode ? 'Chọn vật tư dự kiến nhập' : 'Chi tiết vật tư'}
        </div>
        {isPoLineMode && selectedPoCode ? (
          <p className="mt-0.5 text-[11px] text-[var(--md-on-surface-variant)]">
            {selectedPoLineCount > 0
              ? `Đã chọn ${selectedPoLineCount} dòng · tick/bỏ tick và chỉnh SL trước khi lưu`
              : issueFromGeneralWarehouse
                ? 'Tick dòng còn khả dụng trung tâm - hết hàng thì không tăng SL'
                : 'Tick ít nhất một dòng còn SL trên PO'}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {showExcelBar ? excelBar : null}
        {!isPoLineMode ? (
          <button
            type="button"
            className="btn btn-outline btn-sm text-xs"
            onClick={onAddMaterialLine}
            disabled={!projectCode}
          >
            <Plus size={12} /> Thêm vật tư
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ImportParseErrorsList({ importErrors }: { importErrors: ImportParseErrorApiDto[] }) {
  return (
    <ul className="rounded-lg border border-[var(--md-error)]/30 bg-[color-mix(in_srgb,var(--md-error)_6%,transparent)] px-3 py-2 text-[11px] text-[var(--md-error)] space-y-0.5 max-h-28 overflow-y-auto">
      {importErrors.slice(0, 20).map((err, i) => (
        <li key={`${err.rowNumber}-${err.field}-${i}`}>
          Dòng {err.rowNumber} · {err.field}: {err.message}
        </li>
      ))}
      {importErrors.length > 20 ? <li>…và {importErrors.length - 20} lỗi khác</li> : null}
    </ul>
  );
}
