import { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FolderPlus,
  Search,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
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
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<MaterialImportParseResultDto | null>(null);
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
      await materialsService.downloadImportTemplate();
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
      const res = await materialsService.parseImportFile(selectedFile);
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
    if (f) handleProcessFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) handleProcessFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Lọc danh sách dòng xem trước
  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((row: MaterialImportRowDto) => {
      // Tab filter
      if (filterTab === 'valid' && (!row.isValid || row.isExisting)) return false;
      if (filterTab === 'existing' && (!row.isValid || !row.isExisting)) return false;
      if (filterTab === 'error' && row.isValid) return false;

      // Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchCode = row.materialCode?.toLowerCase().includes(q);
        const matchName = row.materialName?.toLowerCase().includes(q);
        const matchCategory = `${row.danhMuc ?? ''} ${row.nhomVatTu ?? ''}`.toLowerCase().includes(q);
        const matchSpec = row.technicalSpec?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCategory && !matchSpec) return false;
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh mục vật tư từ file Excel"
      subtitle="Hỗ trợ cả file mẫu chuẩn Mayzer ERP và file bảng tính nội bộ tự động nhận diện cột."
      size="wide"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[var(--md-on-surface-variant)]">
            {parseResult && parseResult.validRowCount > 0 ? (
              <span>
                Sẽ xử lý <strong>{parseResult.validRowCount}</strong> dòng hợp lệ (
                {overwriteExisting
                  ? `thêm mới và cập nhật ${parseResult.existingRowCount} mã trùng`
                  : `bỏ qua ${parseResult.existingRowCount} mã trùng`}
                ).
              </span>
            ) : (
              <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleClose}
              disabled={isImporting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              disabled={!parseResult || parseResult.validRowCount === 0 || isImporting}
              onClick={handleConfirmImport}
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Đang nhập dữ liệu…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Xác nhận nhập ({parseResult?.validRowCount ?? 0} vật tư)
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Control Bar: Tải mẫu + Upload */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs flex items-center gap-1.5 cursor-pointer text-[var(--md-primary)] hover:bg-[var(--md-primary)]/10"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Đang tải file mẫu...
                </>
              ) : (
                <>
                  <Download size={13} />
                  Tải file mẫu Excel (.xlsx)
                </>
              )}
            </button>
            <span className="text-[11px] text-[var(--md-on-surface-variant)]">
              (Bao gồm sheet hướng dẫn, ĐVT, Xuất xứ & Cây danh mục tham chiếu)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isParsing || isImporting}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing || isImporting}
            >
              <FileSpreadsheet size={13} />
              {file ? 'Chọn file khác' : 'Chọn file Excel tải lên'}
            </button>
          </div>
        </div>

        {/* Khu vực Dropzone nếu chưa có file */}
        {!file && !isParsing && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--md-outline-variant)] hover:border-[var(--md-primary)] rounded-xl bg-[var(--md-surface-container-lowest)] cursor-pointer transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--md-primary-container)] text-[var(--md-primary)] flex items-center justify-center mb-3">
              <Upload size={24} />
            </div>
            <p className="text-sm font-semibold text-[var(--md-on-surface)]">
              Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Hệ thống tự động nhận diện cột: Mã vật tư, Tên, ĐVT, Danh mục, Nhóm, Xuất xứ, Quy cách, Giá trần...
            </p>
            <p className="text-[11px] text-[var(--md-primary)] font-medium mt-3">
              Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 5MB)
            </p>
          </div>
        )}

        {/* Loading khi đang phân tích file */}
        {isParsing && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <RefreshCw size={28} className="animate-spin text-[var(--md-primary)] mb-2" />
            <p className="text-sm font-medium text-[var(--md-on-surface)]">
              Đang phân tích và đối soát dữ liệu với CSDL…
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Kiểm tra mã vật tư, đơn vị tính và cấu trúc cây danh mục
            </p>
          </div>
        )}

        {/* Parse Error Notification */}
        {parseError && (
          <div className="p-3 rounded-lg border border-[var(--md-error)]/30 bg-[color-mix(in_srgb,var(--md-error)_8%,transparent)] text-xs text-[var(--md-error)] flex items-start gap-2">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi đọc file:</p>
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {/* Khi đã có kết quả Parse */}
        {parseResult && !isParsing && (
          <div className="space-y-3">
            {/* Thanh thống kê nhanh */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)]">
                <span className="text-[11px] text-[var(--md-on-surface-variant)]">Tổng số dòng</span>
                <p className="text-lg font-bold text-[var(--md-on-surface)] mt-0.5">{parseResult.totalRows}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Hợp lệ</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {parseResult.validRowCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Mã đã tồn tại</span>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {parseResult.existingRowCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Dòng có lỗi</span>
                <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {parseResult.errorRowCount}
                </p>
              </div>
            </div>

            {/* Tùy chọn Ghi đè & Thanh lọc xem trước */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
              {/* Checkbox Ghi đè (User Decision A2) */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--md-on-surface)]">
                <input
                  type="checkbox"
                  className="rounded border-[var(--md-outline)] text-[var(--md-primary)] focus:ring-[var(--md-primary)]"
                  checked={overwriteExisting}
                  onChange={e => setOverwriteExisting(e.target.checked)}
                />
                <span className="font-medium">
                  Cập nhật dữ liệu nếu mã vật tư đã tồn tại trên hệ thống
                </span>
                <span className="text-[11px] text-[var(--md-on-surface-variant)]">
                  (Mặc định: bỏ qua các mã đã có để chống ghi đè nhầm)
                </span>
              </label>

              {/* Bộ lọc tab */}
              <div className="flex items-center gap-1 bg-[var(--md-surface-container-highest)] p-1 rounded-md text-xs">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterTab === 'all'
                      ? 'bg-[var(--md-surface)] text-[var(--md-on-surface)] font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({parseResult.totalRows})
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterTab === 'valid'
                      ? 'bg-[var(--md-surface)] text-emerald-700 font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-emerald-700'
                  }`}
                  onClick={() => setFilterTab('valid')}
                >
                  Mới ({parseResult.validRowCount - parseResult.existingRowCount})
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterTab === 'existing'
                      ? 'bg-[var(--md-surface)] text-amber-700 font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-amber-700'
                  }`}
                  onClick={() => setFilterTab('existing')}
                >
                  Trùng mã ({parseResult.existingRowCount})
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterTab === 'error'
                      ? 'bg-[var(--md-surface)] text-rose-700 font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-rose-700'
                  }`}
                  onClick={() => setFilterTab('error')}
                >
                  Lỗi ({parseResult.errorRowCount})
                </button>
              </div>
            </div>

            {/* Ô tìm kiếm nhanh trong bảng preview */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[var(--md-on-surface-variant)]" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                placeholder="Lọc nhanh theo mã vật tư, tên, danh mục, quy cách trong bảng xem trước…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Bảng xem trước dữ liệu */}
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
          </div>
        )}
      </div>
    </Modal>
  );
}
