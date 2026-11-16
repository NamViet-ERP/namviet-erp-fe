import { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Ruler,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { materialUnitsService } from '../../services/materialUnitsService';
import type {
  MaterialUnitImportParseResultDto,
  MaterialUnitImportResultDto,
  MaterialUnitImportRowDto,
} from '../../types/wms';

interface MaterialUnitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: MaterialUnitImportResultDto) => void;
}

type FilterTab = 'all' | 'valid' | 'existing' | 'error';

export default function MaterialUnitImportModal({
  isOpen,
  onClose,
  onSuccess,
}: MaterialUnitImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<MaterialUnitImportParseResultDto | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setOverwriteExisting(false);
    setFilterTab('all');
    setSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await materialUnitsService.downloadImportTemplate();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu. Vui lòng thử lại.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      showToast('warning', 'Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc .csv');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('warning', 'Kích thước file tối đa là 5MB');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const res = await materialUnitsService.parseImportFile(selectedFile);
      setParseResult(res);
      if (res.validRowCount === 0) {
        showToast('warning', 'File không có dòng dữ liệu hợp lệ nào.');
      } else {
        showToast('success', `Đã đọc ${res.totalRows} dòng: ${res.validRowCount} hợp lệ.`);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Không thể đọc dữ liệu file');
      setParseError(msg);
      showToast('error', msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleProcessFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) void handleProcessFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Lọc danh sách dòng xem trước
  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((row: MaterialUnitImportRowDto) => {
      // Tab filter
      if (filterTab === 'valid' && (!row.isValid || row.isExisting)) return false;
      if (filterTab === 'existing' && (!row.isValid || !row.isExisting)) return false;
      if (filterTab === 'error' && row.isValid) return false;

      // Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = row.name?.toLowerCase().includes(q);
        const matchNote = row.note?.toLowerCase().includes(q);
        const matchRow = String(row.rowNumber).includes(q) || `dòng ${row.rowNumber}`.includes(q);
        const matchError = row.errorMessage?.toLowerCase().includes(q);
        if (!matchName && !matchNote && !matchRow && !matchError) {
          return false;
        }
      }

      return true;
    });
  }, [parseResult, filterTab, search]);

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validRowCount === 0) return;

    setIsImporting(true);
    try {
      const result = await materialUnitsService.importBatch({
        rows: parseResult.rows.filter(r => r.isValid),
        overwriteExisting,
      });

      showToast(
        'success',
        `Nhập dữ liệu thành công! Thêm mới: ${result.createdCount}, Cập nhật: ${result.updatedCount}, Bỏ qua: ${result.skippedCount}`,
      );
      onSuccess(result);
      handleClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Lỗi khi nhập dữ liệu vào hệ thống'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh mục đơn vị tính từ file Excel"
      subtitle="Hỗ trợ file bảng tính định dạng .xlsx, .xls, .csv với tự động nhận diện cột và chuẩn hóa tên đơn vị tính."
      size="wide"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[var(--md-on-surface-variant)]">
            {parseResult && parseResult.validRowCount > 0 ? (
              <span>
                Sẽ xử lý <strong>{parseResult.validRowCount}</strong> dòng hợp lệ (
                {overwriteExisting
                  ? `thêm mới và cập nhật ${parseResult.existingRowCount} đơn vị trùng`
                  : `bỏ qua ${parseResult.existingRowCount} đơn vị trùng`}
                ).
              </span>
            ) : (
              <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2"
              onClick={() => void handleConfirmImport()}
              disabled={!parseResult || parseResult.validRowCount === 0 || isImporting || isParsing}
            >
              {isImporting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" aria-hidden />
                  <span>Đang nhập dữ liệu...</span>
                </>
              ) : (
                <>
                  <Upload size={15} aria-hidden />
                  <span>Xác nhận nhập ({parseResult ? parseResult.validRowCount : 0})</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Control Bar: Tải file mẫu bên trái, Chọn file bên phải */}
        <div className="flex items-center justify-between p-3.5 bg-[var(--md-surface-variant)]/30 rounded-xl border border-[var(--md-outline-variant02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--md-primary)]/10 text-[var(--md-primary)] flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--md-on-surface)]">
                File mẫu chuẩn hóa Đơn vị tính
              </div>
              <div className="text-xs text-[var(--md-on-surface-variant)]">
                Tải file Excel mẫu gồm cột: Tên đơn vị tính (*), Thứ tự, Trạng thái, Ghi chú
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1.5 shrink-0"
            onClick={() => void handleDownloadTemplate()}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <RefreshCw size={14} className="animate-spin" aria-hidden />
            ) : (
              <Download size={14} aria-hidden />
            )}
            <span>{isDownloading ? 'Đang tải...' : 'Tải file mẫu Excel'}</span>
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file
              ? 'border-[var(--md-primary)] bg-[var(--md-primary)]/5'
              : 'border-[var(--md-outline-variant02)] hover:border-[var(--md-primary)] hover:bg-[var(--md-surface-variant)]/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--md-surface-variant)]/60 flex items-center justify-center text-[var(--md-primary)]">
              {isParsing ? (
                <RefreshCw size={24} className="animate-spin" />
              ) : (
                <Upload size={24} />
              )}
            </div>
            {file ? (
              <div>
                <p className="text-sm font-medium text-[var(--md-on-surface)]">
                  Đã chọn: <strong className="text-[var(--md-primary)]">{file.name}</strong>
                </p>
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · Nhấn hoặc kéo thả file khác để thay thế
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-[var(--md-on-surface)]">
                  Nhấn để chọn file hoặc kéo & thả file Excel/CSV vào đây
                </p>
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                  Hỗ trợ định dạng .xlsx, .xls hoặc .csv (tối đa 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Parse Error Alert */}
        {parseError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-red-600 dark:text-red-400 text-sm">
            <XCircle size={18} className="shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview Section */}
        {parseResult && (
          <div className="space-y-3">
            {/* Filter Tabs & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--md-outline-variant02)]">
              <div className="inline-flex items-center gap-1 p-1 bg-[var(--md-surface-variant)]/40 rounded-lg border border-[var(--md-outline-variant02)] text-xs">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    filterTab === 'all'
                      ? 'bg-[var(--md-surface)] text-[var(--md-primary)] shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({parseResult.totalRows})
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium transition-all inline-flex items-center gap-1 ${
                    filterTab === 'valid'
                      ? 'bg-[var(--md-surface)] text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('valid')}
                >
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Hợp lệ mới ({parseResult.validRowCount - parseResult.existingRowCount})</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium transition-all inline-flex items-center gap-1 ${
                    filterTab === 'existing'
                      ? 'bg-[var(--md-surface)] text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('existing')}
                >
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>Đã có ({parseResult.existingRowCount})</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium transition-all inline-flex items-center gap-1 ${
                    filterTab === 'error'
                      ? 'bg-[var(--md-surface)] text-rose-700 dark:text-rose-400 shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('error')}
                >
                  <XCircle size={13} className="text-rose-600" />
                  <span>Lỗi ({parseResult.errorRowCount})</span>
                </button>
              </div>

              {/* Search Box in Preview */}
              <div className="relative w-64">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]"
                />
                <input
                  type="text"
                  placeholder="Lọc tên, dòng, lỗi..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--md-surface)] border border-[var(--md-outline-variant02)] rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:border-[var(--md-primary)]"
                />
              </div>
            </div>

            {/* Overwrite Existing Checkbox */}
            {parseResult.existingRowCount > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  id="unit-overwrite-checkbox"
                  checked={overwriteExisting}
                  onChange={e => setOverwriteExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--md-primary)] focus:ring-[var(--md-primary)]"
                />
                <label htmlFor="unit-overwrite-checkbox" className="cursor-pointer select-none font-medium">
                  Ghi đè / Cập nhật {parseResult.existingRowCount} đơn vị tính đã tồn tại (cập nhật thứ tự sắp xếp & trạng thái hoạt động).
                </label>
              </div>
            )}

            {/* Preview Data Table */}
            <div className="border border-[var(--md-outline-variant02)] rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[var(--md-surface-variant)]/60 text-[var(--md-on-surface-variant)] sticky top-0 z-10 uppercase text-[11px] font-semibold border-b border-[var(--md-outline-variant02)]">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">Dòng</th>
                    <th className="py-2.5 px-3">Tên đơn vị tính</th>
                    <th className="py-2.5 px-3 w-24 text-center">Thứ tự</th>
                    <th className="py-2.5 px-3 w-28 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3">Ghi chú</th>
                    <th className="py-2.5 px-3 w-44">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-outline-variant02)]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--md-on-surface-variant)]">
                        Không có dòng dữ liệu nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r: MaterialUnitImportRowDto) => (
                      <tr
                        key={r.rowNumber}
                        className={`hover:bg-[var(--md-surface-variant)]/20 transition-colors ${
                          !r.isValid ? 'bg-rose-500/5' : r.isExisting ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-[var(--md-on-surface-variant)]">
                          {r.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                          <div className="flex items-center gap-1.5">
                            <Ruler size={13} className="text-[var(--md-primary)] shrink-0" />
                            <span>{r.name || '—'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {r.sortOrder}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              r.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {r.isActive ? 'Bật' : 'Tắt'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[var(--md-on-surface-variant)] max-w-xs truncate" title={r.note ?? ''}>
                          {r.note || '—'}
                        </td>
                        <td className="py-2 px-3">
                          {!r.isValid ? (
                            <span
                              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium"
                              title={r.errorMessage ?? ''}
                            >
                              <XCircle size={13} className="shrink-0" />
                              <span className="truncate max-w-[140px]">{r.errorMessage || 'Lỗi dữ liệu'}</span>
                            </span>
                          ) : r.isExisting ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <AlertTriangle size={13} className="shrink-0" />
                              <span>Đã có trong CSDL</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 size={13} className="shrink-0" />
                              <span>Hợp lệ</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
