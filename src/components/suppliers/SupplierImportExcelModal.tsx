import { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { suppliersService } from '../../services/suppliersService';
import type { SupplierImportPreviewResponseDto, SupplierImportRowPreviewDto } from '../../types/wms';

interface SupplierImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FilterTab = 'all' | 'valid' | 'error';

export default function SupplierImportExcelModal({
  isOpen,
  onClose,
  onSuccess,
}: SupplierImportExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<SupplierImportPreviewResponseDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setIsPreviewing(false);
    setIsImporting(false);
    setFilterTab('all');
    setSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isImporting) return;
    handleReset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await suppliersService.downloadTemplate();
      showToast('success', 'Đã tải xuống file Excel mẫu nhà cung cấp.');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu NCC.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      showToast('warning', 'Vui lòng chọn file Excel định dạng .xlsx hoặc .xls');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('warning', 'Kích thước file tối đa là 10MB');
      return;
    }

    setSelectedFile(file);
    setIsPreviewing(true);
    setPreviewData(null);
    setFilterTab('all');
    setSearch('');

    try {
      const res = await suppliersService.previewImportExcel(file);
      setPreviewData(res);
      if (res.errorRows > 0) {
        showToast('warning', `Tìm thấy ${res.validRows} NCC hợp lệ và ${res.errorRows} dòng có lỗi trùng/thiếu thông tin.`);
      } else {
        showToast('success', `Phân tích thành công: ${res.validRows} nhà cung cấp hợp lệ.`);
      }
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đọc nội dung file Excel NCC.'));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Filter preview items by Tab & Instant Search
  const filteredItems = useMemo(() => {
    if (!previewData) return [];
    return previewData.rows
      .map((row: SupplierImportRowPreviewDto, index: number) => ({ ...row, originalIndex: index + 1 }))
      .filter((row: SupplierImportRowPreviewDto & { originalIndex: number }) => {
        // Tab Filter
        if (filterTab === 'valid' && !row.isValid) return false;
        if (filterTab === 'error' && row.isValid) return false;

        // Instant Search Filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchCode = row.supplierCode?.toLowerCase().includes(q);
          const matchName = row.supplierName?.toLowerCase().includes(q);
          const matchTax = row.taxCode?.toLowerCase().includes(q);
          const matchPhone = row.contactPhone?.toLowerCase().includes(q);
          const matchType = `${row.supplierType ?? ''} ${row.scope ?? ''}`.toLowerCase().includes(q);
          const matchGroups = row.industryGroups?.toLowerCase().includes(q);
          const matchError = row.error?.toLowerCase().includes(q);
          const matchIndex = String(row.originalIndex) === q || `dòng ${row.originalIndex}`.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchTax && !matchPhone && !matchType && !matchGroups && !matchError && !matchIndex) {
            return false;
          }
        }

        return true;
      });
  }, [previewData, filterTab, search]);

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      const res = await suppliersService.importExcel(selectedFile);
      if (res.errors && res.errors.length > 0 && res.importedCount === 0) {
        showToast('error', `Nhập thất bại: ${res.errors.join('; ')}`);
        return;
      }
      showToast(
        'success',
        `Nạp thành công ${res.importedCount} NCC vào hệ thống! (Mặc định Hạng D - Chờ sếp duyệt)`,
      );
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Nhập danh sách nhà cung cấp thất bại.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh sách nhà cung cấp từ file Excel"
      subtitle="Hỗ trợ kiểm tra trùng lặp MST, cấp mã NCC tự động và thiết lập phân hạng D ban đầu."
      size="wide"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[var(--md-on-surface-variant)]">
            {selectedFile && previewData && previewData.validRows > 0 ? (
              <span>
                Sẽ xử lý <strong>{previewData.validRows}</strong> nhà cung cấp hợp lệ (
                bỏ qua {previewData.errorRows} dòng trùng/lỗi).
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
              onClick={handleConfirmImport}
              disabled={!selectedFile || !previewData || previewData.validRows === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Đang nhập dữ liệu…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Xác nhận nhập ({previewData?.validRows ?? 0} NCC)
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
              (Bao gồm sheet hướng dẫn, MST, thông tin liên hệ & phân hạng D)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPreviewing || isImporting}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreviewing || isImporting}
            >
              <FileSpreadsheet size={13} />
              {selectedFile ? 'Chọn file khác' : 'Chọn file Excel tải lên'}
            </button>
          </div>
        </div>

        {/* Khu vực Dropzone nếu chưa có file */}
        {!selectedFile && !isPreviewing && (
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
              Kéo thả file Excel (.xlsx, .xls) danh sách NCC vào đây
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Hệ thống tự động nhận diện cột: Tên NCC, MST, SĐT, Website, Loại hình, Phạm vi, Hạn nợ, Nhóm ngành hàng...
            </p>
            <p className="text-[11px] text-[var(--md-primary)] font-medium mt-3">
              Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 10MB)
            </p>
          </div>
        )}

        {/* Loading khi đang phân tích file */}
        {isPreviewing && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <RefreshCw size={28} className="animate-spin text-[var(--md-primary)] mb-2" />
            <p className="text-sm font-medium text-[var(--md-on-surface)]">
              Đang kiểm tra tính hợp lệ và quét trùng tên / MST từ hệ thống…
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Đối soát trùng lặp với danh bạ nhà cung cấp hiện có
            </p>
          </div>
        )}

        {/* Bảng xem trước dữ liệu khi đã phân tích xong */}
        {previewData && !isPreviewing && (
          <div className="space-y-3">
            {/* Thanh tổng kết số liệu (KPI Quick Stats) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)]">
                <span className="text-[11px] text-[var(--md-on-surface-variant)]">Tổng số dòng</span>
                <p className="text-lg font-bold text-[var(--md-on-surface)] mt-0.5">{previewData.totalRows}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Hợp lệ</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {previewData.validRows}
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Có lỗi / Trùng lặp</span>
                <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {previewData.errorRows}
                </p>
              </div>
            </div>

            {/* Thanh điều khiển Preview Bar: Bộ lọc Tab + Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
              {/* Bộ 3 Tabs lọc */}
              <div className="flex items-center gap-1 bg-[var(--md-surface-container-highest)] p-1 rounded-md text-xs">
                <button
                  type="button"
                  className={`px-3 py-1 rounded transition-colors ${
                    filterTab === 'all'
                      ? 'bg-[var(--md-surface)] text-[var(--md-on-surface)] font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({previewData.totalRows})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded transition-colors ${
                    filterTab === 'valid'
                      ? 'bg-[var(--md-surface)] text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-emerald-700'
                  }`}
                  onClick={() => setFilterTab('valid')}
                >
                  Hợp lệ ({previewData.validRows})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded transition-colors ${
                    filterTab === 'error'
                      ? 'bg-[var(--md-surface)] text-rose-700 dark:text-rose-300 font-semibold shadow-sm'
                      : 'text-[var(--md-on-surface-variant)] hover:text-rose-700'
                  }`}
                  onClick={() => setFilterTab('error')}
                >
                  Có lỗi / Trùng ({previewData.errorRows})
                </button>
              </div>

              {/* Ô Instant Search */}
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--md-on-surface-variant)]" />
                <input
                  type="text"
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                  placeholder="Lọc theo STT, tên NCC, MST, SĐT, loại hình, nhóm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Bảng danh sách dòng preview */}
            <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] font-semibold border-b border-[var(--md-outline-variant)] shadow-sm">
                  <tr>
                    <th className="py-2 px-2.5 w-12 text-center">STT</th>
                    <th className="py-2 px-2.5 w-28 text-center">Trạng thái</th>
                    <th className="py-2 px-2.5 w-32">Mã NCC</th>
                    <th className="py-2 px-2.5">Tên nhà cung cấp</th>
                    <th className="py-2 px-2.5 w-32">Mã số thuế</th>
                    <th className="py-2 px-2.5 w-28">SĐT</th>
                    <th className="py-2 px-2.5 w-36">Loại hình / Phạm vi</th>
                    <th className="py-2 px-2.5">Nhóm ngành hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-outline-variant)]/50 bg-[var(--md-surface)]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[var(--md-on-surface-variant)]">
                        Không có dòng dữ liệu nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(r => {
                      const isDuplicate = !r.isValid && Boolean(r.error && (r.error.toLowerCase().includes('trùng') || r.error.toLowerCase().includes('đã tồn tại')));

                      return (
                        <tr
                          key={`${r.supplierName}-${r.originalIndex}`}
                          className={`hover:bg-[var(--md-surface-container-lowest)] transition-colors ${
                            !r.isValid ? (isDuplicate ? 'bg-amber-500/5 dark:bg-amber-950/20' : 'bg-rose-500/5 dark:bg-rose-950/20') : ''
                          }`}
                        >
                          <td className="py-2 px-2.5 text-center text-[var(--md-on-surface-variant)] font-mono">
                            {r.originalIndex}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={12} className="shrink-0" />
                                <span>Hợp lệ</span>
                              </span>
                            ) : isDuplicate ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full cursor-help"
                                title={r.error || 'Trùng lặp tên hoặc MST'}
                              >
                                <AlertTriangle size={12} className="shrink-0" />
                                <span>Trùng lặp</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full cursor-help"
                                title={r.error || 'Lỗi dữ liệu'}
                              >
                                <XCircle size={12} className="shrink-0" />
                                <span>Lỗi</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[var(--md-on-surface-variant)]">
                            {r.supplierCode || <span className="italic text-[10px]">Tự cấp</span>}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="font-medium text-[var(--md-on-surface)]" title={r.supplierName}>
                              {r.supplierName}
                            </span>
                            {!r.isValid && r.error && (
                              <p className={`text-[10px] mt-0.5 font-normal ${isDuplicate ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                ⚠ {r.error}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[var(--md-on-surface)]">
                            {r.taxCode || '—'}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[var(--md-on-surface)]">
                            {r.contactPhone || '—'}
                          </td>
                          <td className="py-2 px-2.5 text-[var(--md-on-surface)]">
                            <div>{r.supplierType || 'Nhà phân phối'}</div>
                            <div className="text-[10px] text-[var(--md-on-surface-variant)]">{r.scope || 'Trong nước'}</div>
                          </td>
                          <td className="py-2 px-2.5 max-w-[160px] truncate text-[var(--md-on-surface-variant)]" title={r.industryGroups || undefined}>
                            {r.industryGroups || '—'}
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