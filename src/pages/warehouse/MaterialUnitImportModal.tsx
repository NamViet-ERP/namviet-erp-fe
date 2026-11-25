import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ruler,
} from 'lucide-react';
import ExcelImportModalShell from '../../components/shared/ExcelImportModalShell';
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

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setOverwriteExisting(false);
    setFilterTab('all');
    setSearch('');
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

  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((row: MaterialUnitImportRowDto) => {
      if (filterTab === 'valid' && (!row.isValid || row.isExisting)) return false;
      if (filterTab === 'existing' && (!row.isValid || !row.isExisting)) return false;
      if (filterTab === 'error' && row.isValid) return false;

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
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh mục đơn vị tính từ file Excel"
      subtitle="Hỗ trợ file bảng tính định dạng .xlsx, .xls, .csv với tự động nhận diện cột và chuẩn hóa tên đơn vị tính."
      selectedFile={file}
      onFileSelect={f => void handleProcessFile(f)}
      acceptedExtensions={['xlsx', 'xls', 'csv']}
      acceptAttr=".xlsx,.xls,.csv"
      maxFileSizeMb={5}
      isDownloadingTemplate={isDownloading}
      onDownloadTemplate={() => void handleDownloadTemplate()}
      templateTitle="File mẫu chuẩn hóa Đơn vị tính"
      templateHint="Tải file Excel mẫu gồm cột: Tên đơn vị tính (*), Thứ tự, Trạng thái, Ghi chú"
      templateButtonLabel="Tải file mẫu Excel"
      dropzoneTitle="Nhấn để chọn file hoặc kéo & thả file Excel/CSV vào đây"
      dropzoneSubtitle="Hỗ trợ định dạng .xlsx, .xls hoặc .csv (tối đa 5MB)"
      dropzoneHint="Tự động đối soát trùng đơn vị tính trên hệ thống"
      alwaysShowDropzone
      isParsing={isParsing}
      parseError={parseError}
      hasPreview={Boolean(parseResult)}
      overwriteOption={parseResult && parseResult.existingRowCount > 0 ? {
        id: 'unit-overwrite-checkbox',
        checked: overwriteExisting,
        onChange: setOverwriteExisting,
        label: `Ghi đè / Cập nhật ${parseResult.existingRowCount} đơn vị tính đã tồn tại (cập nhật thứ tự sắp xếp & trạng thái hoạt động).`,
      } : undefined}
      filterTabs={parseResult ? [
        { id: 'all', label: `Tất cả (${parseResult.totalRows})`, tone: 'neutral' },
        {
          id: 'valid',
          label: `Hợp lệ mới (${parseResult.validRowCount - parseResult.existingRowCount})`,
          tone: 'success',
          icon: <CheckCircle2 size={13} className="text-emerald-600" />,
        },
        {
          id: 'existing',
          label: `Đã có (${parseResult.existingRowCount})`,
          tone: 'warning',
          icon: <AlertTriangle size={13} className="text-amber-600" />,
        },
        {
          id: 'error',
          label: `Lỗi (${parseResult.errorRowCount})`,
          tone: 'danger',
          icon: <XCircle size={13} className="text-rose-600" />,
        },
      ] : undefined}
      activeFilterTab={filterTab}
      onFilterTabChange={tabId => setFilterTab(tabId as FilterTab)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lọc tên, dòng, lỗi..."
      footerSummary={parseResult && parseResult.validRowCount > 0 ? (
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
      cancelLabel="Hủy bỏ"
      confirmLabel={`Xác nhận nhập (${parseResult ? parseResult.validRowCount : 0})`}
      confirmingLabel="Đang nhập dữ liệu..."
      confirmDisabled={!parseResult || parseResult.validRowCount === 0}
      isImporting={isImporting}
      onConfirm={() => void handleConfirmImport()}
    >
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
                  <td className="py-2 px-3 text-center font-mono">{r.sortOrder}</td>
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
    </ExcelImportModalShell>
  );
}
