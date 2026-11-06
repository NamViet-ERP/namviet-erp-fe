import { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import { stockService } from '../../services/stockService';
import type { OpeningStockItemPreviewDto, OpeningStockPreviewResponseDto } from '../../types/wms';
import { formatCurrencyFull } from '../../utils/formatCurrency';

interface AdminOpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FilterTab = 'all' | 'valid' | 'error';

export default function AdminOpeningStockModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminOpeningStockModalProps) {
  const [targetType, setTargetType] = useState<'general' | 'project'>('general');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<OpeningStockPreviewResponseDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projectPage } = useProjects();
  const projects = projectPage?.items ?? [];

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
      await stockService.downloadOpeningStockTemplate();
      showToast('success', 'Đã tải xuống file Excel mẫu tồn kho đầu kỳ.');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu.'));
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
      const projCode = targetType === 'project' ? selectedProjectCode : undefined;
      const res = await stockService.previewOpeningStock(file, projCode);
      setPreviewData(res);
      if (res.errorRows > 0) {
        showToast('warning', `Tìm thấy ${res.validRows} dòng hợp lệ và ${res.errorRows} dòng có lỗi/cảnh báo.`);
      } else {
        showToast('success', `Phân tích thành công: ${res.validRows} dòng dữ liệu hợp lệ.`);
      }
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đọc nội dung file Excel.'));
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
    return previewData.items
      .map((item: OpeningStockItemPreviewDto, index: number) => ({ ...item, originalIndex: index + 1 }))
      .filter((item: OpeningStockItemPreviewDto & { originalIndex: number }) => {
        // Tab Filter
        if (filterTab === 'valid' && !item.isValid) return false;
        if (filterTab === 'error' && item.isValid) return false;

        // Instant Search Filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchCode = item.materialCode?.toLowerCase().includes(q);
          const matchName = item.materialName?.toLowerCase().includes(q);
          const matchUnit = item.unit?.toLowerCase().includes(q);
          const matchError = item.error?.toLowerCase().includes(q);
          const matchIndex = String(item.originalIndex) === q || `dòng ${item.originalIndex}`.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchUnit && !matchError && !matchIndex) {
            return false;
          }
        }

        return true;
      });
  }, [previewData, filterTab, search]);

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    if (targetType === 'project' && !selectedProjectCode) {
      showToast('warning', 'Vui lòng chọn Dự án nhận tồn kho.');
      return;
    }
    setIsImporting(true);
    try {
      const projCode = targetType === 'project' ? selectedProjectCode : undefined;
      const res = await stockService.importOpeningStock(selectedFile, projCode);
      showToast('success', res.message || `Đã nạp thành công số dư tồn kho đầu kỳ! Mã phiếu: ${res.ticketCode}`);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Nạp số dư tồn kho thất bại.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập số dư tồn kho đầu kỳ từ file Excel (Admin)"
      subtitle="Hỗ trợ khởi tạo số dư kho tổng hoặc kho dự án, tự động đối soát với danh mục vật tư."
      size="wide"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[var(--md-on-surface-variant)]">
            {selectedFile && previewData && previewData.validRows > 0 ? (
              <span>
                Sẽ xử lý <strong>{previewData.validRows}</strong> mặt hàng hợp lệ vào{' '}
                <strong>{targetType === 'project' ? `Kho Dự án ${selectedProjectCode}` : 'Kho Tổng Nam Việt'}</strong>
                {previewData.errorRows > 0 && ` (bỏ qua ${previewData.errorRows} dòng lỗi)`}.
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
                  Đang ghi nhận số dư…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Xác nhận nhập ({previewData?.validRows ?? 0} vật tư)
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Control Bar: Tải mẫu + Nơi nhận + Upload */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
          <div className="flex flex-wrap items-center gap-2">
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
              (Bao gồm mã VT, tên VT, ĐVT, số lượng tồn và đơn giá vốn)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bộ chọn nơi nhận tồn kho (Kho Tổng / Kho Dự Án) */}
            <div className="flex items-center gap-3 bg-[var(--md-surface-container-highest)] px-2.5 py-1 rounded-md text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="stockTarget"
                  className="text-[var(--md-primary)] focus:ring-[var(--md-primary)]"
                  checked={targetType === 'general'}
                  onChange={() => {
                    setTargetType('general');
                    if (selectedFile) void processFile(selectedFile);
                  }}
                />
                <span className="font-medium text-[var(--md-on-surface)]">Kho Tổng</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="stockTarget"
                  className="text-[var(--md-primary)] focus:ring-[var(--md-primary)]"
                  checked={targetType === 'project'}
                  onChange={() => setTargetType('project')}
                />
                <span className="font-medium text-[var(--md-on-surface)]">Kho Dự Án</span>
              </label>
              {targetType === 'project' && (
                <select
                  className="form-input form-input-sm py-0.5 px-2 text-xs"
                  value={selectedProjectCode}
                  onChange={e => {
                    setSelectedProjectCode(e.target.value);
                    if (selectedFile) void processFile(selectedFile);
                  }}
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => (
                    <option key={p.projectCode} value={p.projectCode}>
                      {p.projectCode}
                    </option>
                  ))}
                </select>
              )}
            </div>

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
              Kéo thả file Excel (.xlsx, .xls) tồn kho đầu kỳ vào đây
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Hệ thống tự động nhận diện cột: Mã vật tư, Tên vật tư, ĐVT, Số lượng tồn, Đơn giá vốn, Ghi chú...
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
              Đang phân tích và đối soát số dư tồn kho với CSDL…
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Kiểm tra mã vật tư đang hoạt động, đơn vị tính và tính toàn vẹn số liệu
            </p>
          </div>
        )}

        {/* Bảng xem trước dữ liệu khi đã phân tích xong */}
        {previewData && !isPreviewing && (
          <div className="space-y-3">
            {/* Thanh tổng kết số liệu (KPI Quick Stats) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Dòng có lỗi</span>
                <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {previewData.errorRows}
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)]">
                <span className="text-[11px] text-[var(--md-on-surface-variant)]">Tổng giá trị vốn</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatCurrencyFull(previewData.totalAmount)}
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
                  Có lỗi ({previewData.errorRows})
                </button>
              </div>

              {/* Ô Instant Search */}
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--md-on-surface-variant)]" />
                <input
                  type="text"
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                  placeholder="Lọc theo STT, mã VT, tên VT, ĐVT, nội dung lỗi..."
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
                    <th className="py-2 px-2.5 w-36">Mã vật tư</th>
                    <th className="py-2 px-2.5">Tên vật tư</th>
                    <th className="py-2 px-2.5 text-center w-16">ĐVT</th>
                    <th className="py-2 px-2.5 text-right w-24">SL tồn</th>
                    <th className="py-2 px-2.5 text-right w-28">Đơn giá</th>
                    <th className="py-2 px-2.5 text-right w-32">Thành tiền</th>
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
                    filteredItems.map(it => (
                      <tr
                        key={`${it.materialCode}-${it.originalIndex}`}
                        className={`hover:bg-[var(--md-surface-container-lowest)] transition-colors ${
                          !it.isValid ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-2 px-2.5 text-center text-[var(--md-on-surface-variant)] font-mono">
                          {it.originalIndex}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          {it.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} className="shrink-0" />
                              <span>Hợp lệ</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full cursor-help"
                              title={it.error || 'Lỗi dữ liệu'}
                            >
                              <XCircle size={12} className="shrink-0" />
                              <span>Lỗi</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-medium text-[var(--md-primary)]">
                          {it.materialCode}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="font-medium text-[var(--md-on-surface)]" title={it.materialName}>
                            {it.materialName}
                          </span>
                          {!it.isValid && it.error && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 font-normal">
                              ⚠ {it.error}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center text-[var(--md-on-surface)]">{it.unit}</td>
                        <td className="py-2 px-2.5 text-right font-semibold tabular-nums text-[var(--md-on-surface)]">
                          {it.qty.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-2.5 text-right tabular-nums text-[var(--md-on-surface)]">
                          {it.unitPrice > 0 ? formatCurrencyFull(it.unitPrice) : '0 ₫'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                          {it.totalAmount > 0 ? formatCurrencyFull(it.totalAmount) : '0 ₫'}
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
