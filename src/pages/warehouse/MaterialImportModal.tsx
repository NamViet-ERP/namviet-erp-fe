import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderPlus,
} from 'lucide-react';
import ExcelImportModalShell from '../../components/shared/ExcelImportModalShell';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { materialsService } from '../../services/materialsService';
import type {
  MaterialImportParseResultDto,
  MaterialImportResultDto,
  MaterialImportRowDto,
} from '../../types/api/materialImportApi';
import { formatCurrencyFull } from '../../utils/formatCurrency';

interface MaterialImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: MaterialImportResultDto) => void;
}

type FilterTab = 'all' | 'valid' | 'existing' | 'error';

export default function MaterialImportModal({
  isOpen,
  onClose,
  onSuccess,
}: MaterialImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<MaterialImportParseResultDto | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const resetState = () => {
    setFile(null);
    setSelectedSheet('');
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
      await materialsService.downloadImportTemplate();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu. Vui lòng thử lại.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessFile = async (selectedFile: File, targetSheet?: string) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const res = await materialsService.parseImportFile(selectedFile, targetSheet);
      setParseResult(res);
      setSelectedSheet(res.selectedSheet || targetSheet || '');
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

  const handleSheetChange = (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (file) {
      void handleProcessFile(file, newSheet);
    }
  };

  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((row: MaterialImportRowDto) => {
      if (filterTab === 'valid' && (!row.isValid || row.isExisting)) return false;
      if (filterTab === 'existing' && (!row.isValid || !row.isExisting)) return false;
      if (filterTab === 'error' && row.isValid) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchCode = row.materialCode?.toLowerCase().includes(q);
        const matchName = row.materialName?.toLowerCase().includes(q);
        const matchCategory = `${row.danhMuc ?? ''} ${row.nhomVatTu ?? ''}`.toLowerCase().includes(q);
        const matchSpec = row.technicalSpec?.toLowerCase().includes(q);
        const matchRow = String(row.rowNumber).includes(q) || `dòng ${row.rowNumber}`.includes(q);
        const matchErrors = row.errors?.some(e => e.toLowerCase().includes(q));
        const matchWarnings = row.warnings?.some(w => w.toLowerCase().includes(q));
        if (!matchCode && !matchName && !matchCategory && !matchSpec && !matchRow && !matchErrors && !matchWarnings) {
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
      const result = await materialsService.importBatch({
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

  const formatCategoryPath = (row: MaterialImportRowDto) => {
    const parts = [row.danhMuc, row.nhomVatTu, row.loaiVatTu, row.phanLoai, row.kieu]
      .filter(p => p && p.trim() !== '-')
      .map(p => p!.trim());
    return parts.length > 0 ? parts.join(' › ') : '-';
  };

  return (
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh mục vật tư từ file Excel"
      subtitle="Hỗ trợ cả file mẫu chuẩn Mayzer ERP và file bảng tính nội bộ tự động nhận diện cột."
      selectedFile={file}
      onFileSelect={f => {
        setSelectedSheet('');
        void handleProcessFile(f);
      }}
      acceptedExtensions={['xlsx', 'xls', 'csv']}
      acceptAttr=".xlsx,.xls,.csv"
      maxFileSizeMb={5}
      isDownloadingTemplate={isDownloading}
      onDownloadTemplate={() => void handleDownloadTemplate()}
      templateHint="(Bao gồm sheet hướng dẫn, ĐVT, Xuất xứ & Cây danh mục tham chiếu)"
      dropzoneTitle="Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây"
      dropzoneSubtitle="Hệ thống tự động nhận diện cột: Mã vật tư, Tên, ĐVT, Danh mục, Nhóm, Xuất xứ, Quy cách, Giá trần..."
      dropzoneHint="Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 5MB)"
      isParsing={isParsing}
      parsingTitle="Đang phân tích và đối soát dữ liệu với CSDL…"
      parsingSubtitle="Kiểm tra mã vật tư, đơn vị tính và cấu trúc cây danh mục"
      parseError={parseError}
      hasPreview={Boolean(parseResult)}
      availableSheets={parseResult?.availableSheets}
      selectedSheet={selectedSheet || parseResult?.selectedSheet}
      onSheetChange={handleSheetChange}
      stats={parseResult ? [
        { key: 'total', label: 'Tổng số dòng', value: parseResult.totalRows, tone: 'neutral' },
        { key: 'valid', label: 'Hợp lệ', value: parseResult.validRowCount, tone: 'success' },
        { key: 'existing', label: 'Mã đã tồn tại', value: parseResult.existingRowCount, tone: 'warning' },
        { key: 'error', label: 'Dòng có lỗi', value: parseResult.errorRowCount, tone: 'danger' },
      ] : undefined}
      statsColumns={4}
      overwriteOption={parseResult ? {
        checked: overwriteExisting,
        onChange: setOverwriteExisting,
        label: 'Cập nhật dữ liệu nếu mã vật tư đã tồn tại trên hệ thống',
        hint: '(Mặc định: bỏ qua các mã đã có để chống ghi đè nhầm)',
      } : undefined}
      filterTabs={parseResult ? [
        { id: 'all', label: `Tất cả (${parseResult.totalRows})`, tone: 'neutral' },
        { id: 'valid', label: `Mới (${parseResult.validRowCount - parseResult.existingRowCount})`, tone: 'success' },
        { id: 'existing', label: `Mã đã tồn tại (${parseResult.existingRowCount})`, tone: 'warning' },
        { id: 'error', label: `Lỗi (${parseResult.errorRowCount})`, tone: 'danger' },
      ] : undefined}
      activeFilterTab={filterTab}
      onFilterTabChange={tabId => setFilterTab(tabId as FilterTab)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lọc nhanh theo số dòng, mã vật tư, tên, lỗi vi phạm, quy cách…"
      footerSummary={parseResult && parseResult.validRowCount > 0 ? (
        <span>
          {(selectedSheet || parseResult.selectedSheet) && (
            <span className="font-semibold text-[var(--md-primary)] mr-1.5">
              [{selectedSheet || parseResult.selectedSheet}]
            </span>
          )}
          Sẽ xử lý <strong>{parseResult.validRowCount}</strong> dòng hợp lệ (
          {overwriteExisting
            ? `thêm mới và cập nhật ${parseResult.existingRowCount} mã trùng`
            : `bỏ qua ${parseResult.existingRowCount} mã trùng`}
          ).
        </span>
      ) : (
        <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
      )}
      confirmLabel={`Xác nhận nhập (${parseResult?.validRowCount ?? 0} vật tư)`}
      confirmDisabled={!parseResult || parseResult.validRowCount === 0}
      isImporting={isImporting}
      onConfirm={() => void handleConfirmImport()}
    >
      <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] font-semibold border-b border-[var(--md-outline-variant)] z-10">
            <tr>
              <th className="py-2 px-2.5 w-12 text-center">Dòng</th>
              <th className="py-2 px-2.5 w-28">Trạng thái</th>
              <th className="py-2 px-2.5">Mã vật tư</th>
              <th className="py-2 px-2.5">Tên vật tư</th>
              <th className="py-2 px-2.5">Cây Danh mục</th>
              <th className="py-2 px-2.5 w-20 text-center">ĐVT</th>
              <th className="py-2 px-2.5 w-24">Xuất xứ</th>
              <th className="py-2 px-2.5">Quy cách</th>
              <th className="py-2 px-2.5 w-24 text-right">Giá trần</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-outline-variant)]/50 bg-[var(--md-surface)]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-[var(--md-on-surface-variant)]">
                  Không có dòng dữ liệu nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredRows.map((row: MaterialImportRowDto, idx: number) => {
                const isExisting = row.isExisting;
                const hasErrors = row.errors.length > 0;

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
                          title={row.errors.join('; ')}
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
                      {row.materialCode || <span className="text-rose-500 italic">Trống</span>}
                    </td>
                    <td className="py-2 px-2.5 text-[var(--md-on-surface)] font-medium">
                      {row.materialName}
                      {hasErrors && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{row.errors.join('; ')}</p>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-[var(--md-on-surface-variant)]">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>{formatCategoryPath(row)}</span>
                        {row.isNewCategory && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] text-sky-700 bg-sky-500/10 px-1.5 py-0.2 rounded font-medium"
                            title="Nhánh danh mục này sẽ được hệ thống tự động tạo mới"
                          >
                            <FolderPlus size={10} /> Tự tạo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-center text-[var(--md-on-surface)]">
                      {row.unit}
                    </td>
                    <td className="py-2 px-2.5 text-[var(--md-on-surface-variant)]">
                      {row.origin || '-'}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-[var(--md-on-surface-variant)] max-w-[180px] truncate" title={row.technicalSpec ?? ''}>
                      {row.technicalSpec || '-'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-[var(--md-on-surface)]">
                      {row.ceilingPrice != null ? formatCurrencyFull(row.ceilingPrice) : '-'}
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
