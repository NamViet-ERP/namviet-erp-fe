import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Coins,
} from 'lucide-react';
import ExcelImportModalShell from '../../components/shared/ExcelImportModalShell';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { serviceExpenseItemsService } from '../../services/serviceExpenseItemsService';
import type {
  ServiceExpenseImportParseResultDto,
  ServiceExpenseImportResultDto,
  ServiceExpenseImportRowDto,
} from '../../types/api/serviceExpenseItem';
import { formatCurrencyFull } from '../../utils/formatCurrency';

interface ServiceExpenseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ServiceExpenseImportResultDto) => void;
}

type FilterTab = 'all' | 'valid' | 'existing' | 'error';

export default function ServiceExpenseImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ServiceExpenseImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ServiceExpenseImportParseResultDto | null>(null);
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
      await serviceExpenseItemsService.downloadImportTemplate();
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
      const res = await serviceExpenseItemsService.parseImportFile(selectedFile);
      setParseResult(res);
      const validCount = res.validRowCount ?? res.validRows ?? 0;
      if (validCount === 0) {
        showToast('warning', 'File không có dòng dữ liệu hợp lệ nào.');
      } else {
        showToast('success', `Đã đọc ${res.totalRows} dòng: ${validCount} hợp lệ.`);
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
    return (parseResult.rows ?? []).filter((row: ServiceExpenseImportRowDto) => {
      if (filterTab === 'valid' && (!row.isValid || row.isExisting)) return false;
      if (filterTab === 'existing' && (!row.isValid || !row.isExisting)) return false;
      if (filterTab === 'error' && row.isValid) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchCode = row.code?.toLowerCase().includes(q);
        const matchName = row.name?.toLowerCase().includes(q);
        const matchType = (row.type === 'expense' ? 'chi phí ngoài' : 'dịch vụ').includes(q);
        const matchUnit = row.unit?.toLowerCase().includes(q);
        const matchDesc = row.description?.toLowerCase().includes(q);
        const matchRow = String(row.rowNumber).includes(q) || `dòng ${row.rowNumber}`.includes(q);
        const matchErrors =
          (row.errors ?? []).some(e => e?.toLowerCase().includes(q)) ||
          row.errorMessage?.toLowerCase().includes(q);
        const matchWarnings = (row.warnings ?? []).some(w => w?.toLowerCase().includes(q));
        if (!matchCode && !matchName && !matchType && !matchUnit && !matchDesc && !matchRow && !matchErrors && !matchWarnings) {
          return false;
        }
      }

      return true;
    });
  }, [parseResult, filterTab, search]);

  const handleConfirmImport = async () => {
    const validCount = parseResult?.validRowCount ?? parseResult?.validRows ?? 0;
    if (!parseResult || validCount === 0) return;

    setIsImporting(true);
    try {
      const result = await serviceExpenseItemsService.importBatch({
        rows: (parseResult.rows ?? []).filter(r => r.isValid),
        overwriteExisting,
      });

      const createdCount = result.createdCount ?? result.insertedCount ?? 0;
      showToast(
        'success',
        `Nhập dữ liệu thành công! Thêm mới: ${createdCount}, Cập nhật: ${result.updatedCount ?? 0}, Bỏ qua: ${result.skippedCount ?? 0}`,
      );
      onSuccess(result);
      handleClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Lỗi khi nhập dữ liệu vào hệ thống'));
    } finally {
      setIsImporting(false);
    }
  };

  const validRowCount = parseResult ? (parseResult.validRowCount ?? parseResult.validRows ?? 0) : 0;
  const existingRowCount = parseResult ? (parseResult.existingRowCount ?? parseResult.existingRows ?? 0) : 0;
  const errorRowCount = parseResult ? (parseResult.errorRowCount ?? parseResult.errorRows ?? 0) : 0;

  return (
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh mục dịch vụ & chi phí từ file Excel"
      subtitle="Hỗ trợ file bảng tính định dạng .xlsx, .xls, .csv với tự động nhận diện cột và chuẩn hóa mã định danh."
      selectedFile={file}
      onFileSelect={f => void handleProcessFile(f)}
      acceptedExtensions={['xlsx', 'xls', 'csv']}
      acceptAttr=".xlsx,.xls,.csv"
      maxFileSizeMb={5}
      selectFileAriaLabel="Chọn file bảng tính tải lên"
      isDownloadingTemplate={isDownloading}
      onDownloadTemplate={() => void handleDownloadTemplate()}
      templateHint="(Bao gồm sheet hướng dẫn, ĐVT & phân loại dịch vụ / chi phí tham chiếu)"
      dropzoneTitle="Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây"
      dropzoneSubtitle="Hệ thống tự động nhận diện cột: Mã định danh, Tên dịch vụ / chi phí, Phân loại, Đơn vị tính, Đơn giá tham chiếu, Ghi chú…"
      dropzoneHint="Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 5MB)"
      isParsing={isParsing}
      parsingTitle="Đang phân tích và đối soát dữ liệu với CSDL…"
      parsingSubtitle="Kiểm tra mã định danh, đơn vị tính và phân loại hợp lệ"
      parseError={parseError}
      hasPreview={Boolean(parseResult)}
      stats={parseResult ? [
        { key: 'total', label: 'Tổng số dòng', value: parseResult.totalRows, tone: 'neutral' },
        { key: 'valid', label: 'Hợp lệ', value: validRowCount, tone: 'success' },
        { key: 'existing', label: 'Mã đã tồn tại', value: existingRowCount, tone: 'warning' },
        { key: 'error', label: 'Dòng có lỗi', value: errorRowCount, tone: 'danger' },
      ] : undefined}
      statsColumns={4}
      overwriteOption={parseResult ? {
        checked: overwriteExisting,
        onChange: setOverwriteExisting,
        label: 'Cập nhật dữ liệu nếu mã đã tồn tại trên hệ thống',
        hint: '(Mặc định: bỏ qua các mã đã có để chống ghi đè nhầm)',
      } : undefined}
      filterTabs={parseResult ? [
        { id: 'all', label: `Tất cả (${parseResult.totalRows})`, tone: 'neutral' },
        { id: 'valid', label: `Mới (${Math.max(0, validRowCount - existingRowCount)})`, tone: 'success' },
        { id: 'existing', label: `Mã đã tồn tại (${existingRowCount})`, tone: 'warning' },
        { id: 'error', label: `Lỗi (${errorRowCount})`, tone: 'danger' },
      ] : undefined}
      activeFilterTab={filterTab}
      onFilterTabChange={tabId => setFilterTab(tabId as FilterTab)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lọc nhanh theo số dòng, mã định danh, tên, phân loại, ĐVT, lỗi vi phạm…"
      footerSummary={parseResult && validRowCount > 0 ? (
        <span>
          Sẽ xử lý <strong>{validRowCount}</strong> dòng hợp lệ (
          {overwriteExisting
            ? `thêm mới và cập nhật ${existingRowCount} mã trùng`
            : `bỏ qua ${existingRowCount} mã trùng`}
          ).
        </span>
      ) : (
        <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
      )}
      confirmLabel={`Xác nhận nhập (${validRowCount} mục)`}
      confirmDisabled={!parseResult || validRowCount === 0}
      isImporting={isImporting}
      onConfirm={() => void handleConfirmImport()}
    >
      <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] font-semibold border-b border-[var(--md-outline-variant)] z-10">
            <tr>
              <th className="py-2 px-2.5 w-12 text-center">Dòng</th>
              <th className="py-2 px-2.5 w-28">Trạng thái</th>
              <th className="py-2 px-2.5 w-32">Mã định danh</th>
              <th className="py-2 px-2.5">Tên dịch vụ / chi phí</th>
              <th className="py-2 px-2.5 w-28 text-center">Phân loại</th>
              <th className="py-2 px-2.5 w-20 text-center">ĐVT</th>
              <th className="py-2 px-2.5 w-32 text-right">Đơn giá tham chiếu</th>
              <th className="py-2 px-2.5">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-outline-variant)]/50 bg-[var(--md-surface)]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-[var(--md-on-surface-variant)]">
                  Không có dòng dữ liệu nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredRows.map((row: ServiceExpenseImportRowDto, idx: number) => {
                const isExisting = row.isExisting;
                const rowErrors = (row.errors ?? []).filter(Boolean);
                if (rowErrors.length === 0 && row.errorMessage) {
                  rowErrors.push(row.errorMessage);
                }
                const hasErrors = !row.isValid || rowErrors.length > 0;
                const errorTooltip = rowErrors.join('; ') || row.errorMessage || 'Dữ liệu không hợp lệ';
                const isExpense = row.type === 'expense';

                return (
                  <tr
                    key={`${row.rowNumber}-${idx}`}
                    className={`hover:bg-[var(--md-surface-container-lowest)] transition-colors ${
                      hasErrors ? 'bg-rose-500/5' : isExisting ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 text-center text-[11px] text-[var(--md-on-surface-variant)] font-mono">
                      {row.rowNumber}
                    </td>
                    <td className="py-2 px-2.5">
                      {hasErrors ? (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-500/10 px-2 py-0.5 rounded-full"
                          title={errorTooltip}
                        >
                          <XCircle size={12} className="shrink-0" />
                          <span>Lỗi</span>
                        </div>
                      ) : isExisting ? (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full"
                          title={
                            overwriteExisting
                              ? 'Mã đã tồn tại - sẽ cập nhật thông tin'
                              : 'Mã đã tồn tại - sẽ bỏ qua do không tick ghi đè'
                          }
                        >
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>{overwriteExisting ? 'Sẽ cập nhật' : 'Đã có (Bỏ qua)'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span>Hợp lệ</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2.5 font-mono font-medium text-[var(--md-on-surface)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--md-primary)]/10 text-[var(--md-primary)] border border-[var(--md-primary)]/20">
                        {row.code || <span className="text-rose-500 italic">Trống</span>}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-[var(--md-on-surface)] font-medium">
                      {row.name}
                      {hasErrors && <p className="text-[10px] text-rose-600 mt-0.5">{errorTooltip}</p>}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          isExpense
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isExpense ? <Coins size={11} aria-hidden /> : <Briefcase size={11} aria-hidden />}
                        <span>{isExpense ? 'Chi phí ngoài' : 'Dịch vụ'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center text-[var(--md-on-surface)] font-medium">
                      {row.unit}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-[var(--md-on-surface)]">
                      {row.referencePrice != null ? formatCurrencyFull(row.referencePrice) : '—'}
                    </td>
                    <td
                      className="py-2 px-2.5 text-[11px] text-[var(--md-on-surface-variant)] max-w-xs truncate"
                      title={row.description ?? ''}
                    >
                      {row.description || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ExcelImportModalShell>
  );
}
