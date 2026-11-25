import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  Warehouse,
  Building2,
  FolderGit2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import Modal from '../ui/Modal';
import ExcelImportModalShell from '../shared/ExcelImportModalShell';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import { stockService } from '../../services/stockService';
import type { OpeningStockPreviewResponseDto } from '../../types/wms';
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: projectPage } = useProjects();
  const projects = projectPage?.items ?? [];

  const targetWarehouseLabel =
    targetType === 'project' ? `Kho Dự án ${selectedProjectCode}` : 'Kho trung tâm';

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setIsPreviewing(false);
    setIsImporting(false);
    setFilterTab('all');
    setSearch('');
    setShowErrorModal(false);
    setErrorSearch('');
    setCopied(false);
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

  const filteredItems = useMemo(() => {
    if (!previewData) return [];
    return previewData.items
      .map((item, index) => ({ ...item, originalIndex: index + 1 }))
      .filter(item => {
        if (filterTab === 'valid' && !item.isValid) return false;
        if (filterTab === 'error' && item.isValid) return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchCode = item.materialCode?.toLowerCase().includes(q);
          const matchName = item.materialName?.toLowerCase().includes(q);
          const matchUnit = item.unit?.toLowerCase().includes(q);
          const matchError = item.error?.toLowerCase().includes(q);
          const matchIndex =
            String(item.originalIndex) === q || `dòng ${item.originalIndex}`.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchUnit && !matchError && !matchIndex) {
            return false;
          }
        }

        return true;
      });
  }, [previewData, filterTab, search]);

  const errorItems = useMemo(() => {
    if (!previewData) return [];
    return previewData.items
      .map((item, index) => ({ ...item, originalIndex: index + 1 }))
      .filter(item => !item.isValid);
  }, [previewData]);

  const filteredErrorItems = useMemo(() => {
    if (!errorItems.length) return [];
    const q = errorSearch.trim().toLowerCase();
    if (!q) return errorItems;
    return errorItems.filter(it => {
      const idxStr = String(it.originalIndex);
      return (
        idxStr.includes(q) ||
        (it.materialCode ?? '').toLowerCase().includes(q) ||
        (it.materialName ?? '').toLowerCase().includes(q) ||
        (it.error ?? '').toLowerCase().includes(q) ||
        `dòng ${idxStr}`.includes(q)
      );
    });
  }, [errorItems, errorSearch]);

  const handleCopyErrors = async () => {
    if (!errorItems.length) return;
    const text = errorItems
      .map(err => `Dòng ${err.originalIndex}: [Mã: ${err.materialCode || 'Trống'}] ${err.error || 'Lỗi không xác định'}`)
      .join('\n');
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Không thể sao chép vào bộ nhớ tạm.');
    }
  };

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

  const targetDestinationSlot = (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--md-on-surface)]">
        <Warehouse size={16} className="text-[var(--md-primary)] shrink-0" />
        <span>Nơi tiếp nhận số dư tồn kho:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Segmented Pill Switcher cao cấp */}
        <div className="inline-flex p-1 rounded-lg bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-xs">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              targetType === 'general'
                ? 'bg-[var(--md-primary)] text-white shadow-sm'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
            onClick={() => {
              setTargetType('general');
              if (selectedFile) void processFile(selectedFile);
            }}
          >
            <Building2 size={13} />
            <span className="whitespace-nowrap">Kho trung tâm</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              targetType === 'project'
                ? 'bg-[var(--md-primary)] text-white shadow-sm'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
            onClick={() => setTargetType('project')}
          >
            <FolderGit2 size={13} />
            <span className="whitespace-nowrap">Kho Dự Án</span>
          </button>
        </div>

        {targetType === 'project' && (
          <select
            className="form-input form-input-sm text-xs min-w-[220px] max-w-[320px] truncate"
            value={selectedProjectCode}
            onChange={e => {
              setSelectedProjectCode(e.target.value);
              if (selectedFile) void processFile(selectedFile);
            }}
            disabled={isPreviewing || isImporting}
          >
            <option value="">-- Chọn dự án nhận tồn kho --</option>
            {projects.map(p => (
              <option key={p.projectCode} value={p.projectCode}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  const errorAlertSlot = previewData && previewData.errorRows > 0 ? (
    <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>Phát hiện {previewData.errorRows} dòng có lỗi đối soát</span>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-xs text-rose-700 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/10 inline-flex items-center gap-1 font-medium"
          onClick={() => setShowErrorModal(true)}
        >
          Xem chi tiết &amp; Sao chép danh sách lỗi
        </button>
      </div>
      <ul className="space-y-1 pl-5 list-disc text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
        {errorItems.slice(0, 5).map(it => (
          <li key={`err-summary-${it.originalIndex}`}>
            Dòng Excel {it.originalIndex}: Mã &apos;{it.materialCode || 'Trống'}&apos; — {it.error || 'Lỗi không xác định'}
          </li>
        ))}
        {errorItems.length > 5 && (
          <li className="list-none -ml-5 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium underline text-rose-700 dark:text-rose-300 hover:opacity-80 transition-opacity"
              onClick={() => setShowErrorModal(true)}
            >
              …và {errorItems.length - 5} lỗi khác (Bấm để xem và sao chép toàn bộ)
            </button>
          </li>
        )}
      </ul>
    </div>
  ) : null;

  const errorDetailsModal = previewData ? (
    <Modal
      isOpen={showErrorModal}
      onClose={() => setShowErrorModal(false)}
      size="lg"
      title={`Chi tiết lỗi đối soát tồn kho đầu kỳ (${errorItems.length} lỗi trên ${previewData.errorRows} dòng)`}
      subtitle={(
        <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
          File: <strong>{selectedFile?.name ?? 'Excel'}</strong> — Nơi nhận: <strong>{targetWarehouseLabel}</strong>
        </div>
      )}
      beforeBody={(
        <div className="px-6 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)] pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={errorSearch}
              onChange={e => setErrorSearch(e.target.value)}
              placeholder="Tìm theo số dòng, mã vật tư hoặc nội dung lỗi…"
              aria-label="Tìm kiếm lỗi"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
            />
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm inline-flex items-center gap-1.5 text-xs"
            onClick={() => void handleCopyErrors()}
            title="Sao chép toàn bộ lỗi vào bộ nhớ tạm"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Sao chép toàn bộ lỗi ({errorItems.length})</span>
              </>
            )}
          </button>
        </div>
      )}
      footer={(
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            Hiển thị <strong>{filteredErrorItems.length}</strong> / <strong>{errorItems.length}</strong> lỗi
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowErrorModal(false)}>
            Đóng
          </button>
        </div>
      )}
    >
      <div className="flex flex-col gap-3 py-1">
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-highest)]/40 text-xs text-[var(--md-on-surface-variant)]">
          <AlertCircle size={16} className="text-[var(--md-primary)] shrink-0 mt-0.5" aria-hidden />
          <div className="leading-relaxed">
            Các dòng lỗi này không hợp lệ và sẽ được bỏ qua khi nhập tồn kho. Bạn có thể sao chép danh sách này để gửi cho bộ phận chuẩn bị file Excel hiệu chỉnh lại mã hoặc đơn vị tính.
          </div>
        </div>

        <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden">
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] font-semibold border-b border-[var(--md-outline-variant)] shadow-sm z-10">
                <tr>
                  <th className="py-2 px-2.5 text-center w-24">Dòng Excel</th>
                  <th className="py-2 px-2.5 w-32">Mã vật tư</th>
                  <th className="py-2 px-2.5 w-48">Tên vật tư</th>
                  <th className="py-2 px-2.5">Chi tiết lỗi đối soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-outline-variant)]/60 bg-[var(--md-surface)]">
                {filteredErrorItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--md-on-surface-variant)]">
                      {errorSearch ? 'Không tìm thấy lỗi phù hợp với từ khóa.' : 'Không có dòng lỗi nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredErrorItems.map(err => (
                    <tr key={`modal-err-${err.originalIndex}`} className="hover:bg-[var(--md-surface-container-low)] transition-colors">
                      <td className="py-2 px-2.5 text-center tabular-nums font-semibold">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          Dòng {err.originalIndex}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono font-medium text-[var(--md-primary)]">
                        {err.materialCode || <span className="text-[var(--md-on-surface-variant)] italic">Trống</span>}
                      </td>
                      <td className="py-2 px-2.5 font-medium text-[var(--md-on-surface)]">
                        {err.materialName || '—'}
                      </td>
                      <td className="py-2 px-2.5 text-rose-600 dark:text-rose-400 font-normal leading-relaxed">
                        {err.error || 'Lỗi không xác định'}
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
  ) : null;

  return (
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập số dư tồn kho đầu kỳ từ file Excel (Admin)"
      subtitle="Hỗ trợ khởi tạo số dư kho tổng hoặc kho dự án, tự động đối soát với danh mục vật tư."
      selectedFile={selectedFile}
      onFileSelect={file => void processFile(file)}
      acceptedExtensions={['xlsx', 'xls']}
      acceptAttr=".xlsx,.xls"
      maxFileSizeMb={10}
      isDownloadingTemplate={isDownloading}
      onDownloadTemplate={() => void handleDownloadTemplate()}
      templateHint="(Bao gồm mã VT, tên VT, ĐVT, số lượng tồn và đơn giá vốn)"
      dropzoneTitle="Kéo thả file Excel (.xlsx, .xls) tồn kho đầu kỳ vào đây"
      dropzoneSubtitle="Hệ thống tự động nhận diện cột: Mã vật tư, Tên vật tư, ĐVT, Số lượng tồn, Đơn giá vốn, Ghi chú..."
      dropzoneHint="Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 10MB)"
      isParsing={isPreviewing}
      parsingTitle="Đang phân tích và đối soát số dư tồn kho với CSDL…"
      parsingSubtitle="Kiểm tra mã vật tư đang hoạt động, đơn vị tính và tính toàn vẹn số liệu"
      hasPreview={Boolean(previewData)}
      beforeUploadSlot={targetDestinationSlot}
      stats={previewData ? [
        { key: 'total', label: 'Tổng số dòng', value: previewData.totalRows, tone: 'neutral' },
        { key: 'valid', label: 'Hợp lệ', value: previewData.validRows, tone: 'success' },
        { key: 'error', label: 'Dòng có lỗi', value: previewData.errorRows, tone: 'danger' },
        { key: 'amount', label: 'Tổng giá trị vốn', value: formatCurrencyFull(previewData.totalAmount), tone: 'neutral' },
      ] : undefined}
      statsColumns={4}
      alertSlot={errorAlertSlot}
      filterTabs={previewData ? [
        { id: 'all', label: `Tất cả (${previewData.totalRows})`, tone: 'neutral' },
        { id: 'valid', label: `Hợp lệ (${previewData.validRows})`, tone: 'success' },
        { id: 'error', label: `Có lỗi (${previewData.errorRows})`, tone: 'danger' },
      ] : undefined}
      activeFilterTab={filterTab}
      onFilterTabChange={tabId => setFilterTab(tabId as FilterTab)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lọc theo STT, mã VT, tên VT, ĐVT, nội dung lỗi..."
      footerSummary={selectedFile && previewData && previewData.validRows > 0 ? (
        <span>
          Sẽ xử lý <strong>{previewData.validRows}</strong> mặt hàng hợp lệ vào{' '}
          <strong>{targetWarehouseLabel}</strong>
          {previewData.errorRows > 0 && ` (bỏ qua ${previewData.errorRows} dòng lỗi)`}.
        </span>
      ) : (
        <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
      )}
      confirmLabel={`Xác nhận nhập (${previewData?.validRows ?? 0} vật tư)`}
      confirmingLabel="Đang ghi nhận số dư…"
      confirmDisabled={!selectedFile || !previewData || previewData.validRows === 0}
      isImporting={isImporting}
      onConfirm={() => void handleConfirmImport()}
      extraModals={errorDetailsModal}
    >
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
                    {it.isValid && it.note && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-normal">
                        ℹ {it.note}
                      </p>
                    )}
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
    </ExcelImportModalShell>
  );
}
