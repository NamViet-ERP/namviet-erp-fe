import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import ExcelImportModalShell from '../shared/ExcelImportModalShell';
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
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewData, setPreviewData] = useState<SupplierImportPreviewResponseDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedSheet('');
    setPreviewData(null);
    setIsPreviewing(false);
    setIsImporting(false);
    setFilterTab('all');
    setSearch('');
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

  const processFile = async (file: File, targetSheet?: string) => {
    setSelectedFile(file);
    setIsPreviewing(true);
    setPreviewData(null);
    setFilterTab('all');
    setSearch('');

    try {
      const res = await suppliersService.previewImportExcel(file, targetSheet);
      setPreviewData(res);
      setSelectedSheet(res.selectedSheet || targetSheet || '');
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

  const handleSheetChange = (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (selectedFile) {
      void processFile(selectedFile, newSheet);
    }
  };

  const filteredItems = useMemo(() => {
    if (!previewData) return [];
    return previewData.rows
      .map((row: SupplierImportRowPreviewDto, index: number) => ({ ...row, originalIndex: index + 1 }))
      .filter((row: SupplierImportRowPreviewDto & { originalIndex: number }) => {
        if (filterTab === 'valid' && !row.isValid) return false;
        if (filterTab === 'error' && row.isValid) return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchCode = row.supplierCode?.toLowerCase().includes(q);
          const matchName = row.supplierName?.toLowerCase().includes(q);
          const matchTax = row.taxCode?.toLowerCase().includes(q);
          const matchPhone = row.contactPhone?.toLowerCase().includes(q);
          const matchType = `${row.supplierType ?? ''} ${row.scope ?? ''}`.toLowerCase().includes(q);
          const matchGroups = row.industryGroups?.toLowerCase().includes(q);
          const matchError = row.error?.toLowerCase().includes(q);
          const matchIndex =
            String(row.originalIndex) === q || `dòng ${row.originalIndex}`.toLowerCase().includes(q);
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
      const res = await suppliersService.importExcel(selectedFile, selectedSheet || undefined);
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
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh sách nhà cung cấp từ file Excel"
      subtitle="Hỗ trợ kiểm tra trùng lặp MST, cấp mã NCC tự động và thiết lập phân hạng D ban đầu."
      selectedFile={selectedFile}
      onFileSelect={file => void processFile(file)}
      acceptedExtensions={['xlsx', 'xls']}
      acceptAttr=".xlsx,.xls"
      maxFileSizeMb={10}
      isDownloadingTemplate={isDownloading}
      onDownloadTemplate={() => void handleDownloadTemplate()}
      templateHint="(Bao gồm sheet hướng dẫn, MST, thông tin liên hệ & phân hạng D)"
      dropzoneTitle="Kéo thả file Excel (.xlsx, .xls) danh sách NCC vào đây"
      dropzoneSubtitle="Hệ thống tự động nhận diện cột: Tên NCC, MST, SĐT, Website, Loại hình, Phạm vi, Hạn nợ, Nhóm ngành hàng..."
      dropzoneHint="Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 10MB)"
      isParsing={isPreviewing}
      parsingTitle="Đang kiểm tra tính hợp lệ và quét trùng tên / MST từ hệ thống…"
      parsingSubtitle="Đối soát trùng lặp với danh bạ nhà cung cấp hiện có"
      hasPreview={Boolean(previewData)}
      availableSheets={previewData?.availableSheets}
      selectedSheet={selectedSheet || previewData?.selectedSheet}
      onSheetChange={handleSheetChange}
      stats={previewData ? [
        { key: 'total', label: 'Tổng số dòng', value: previewData.totalRows, tone: 'neutral' },
        { key: 'valid', label: 'Hợp lệ', value: previewData.validRows, tone: 'success' },
        { key: 'error', label: 'Có lỗi / Trùng lặp', value: previewData.errorRows, tone: 'danger' },
      ] : undefined}
      statsColumns={3}
      filterTabs={previewData ? [
        { id: 'all', label: `Tất cả (${previewData.totalRows})`, tone: 'neutral' },
        { id: 'valid', label: `Hợp lệ (${previewData.validRows})`, tone: 'success' },
        { id: 'error', label: `Có lỗi / Trùng (${previewData.errorRows})`, tone: 'danger' },
      ] : undefined}
      activeFilterTab={filterTab}
      onFilterTabChange={tabId => setFilterTab(tabId as FilterTab)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lọc theo STT, tên NCC, MST, SĐT, loại hình, nhóm..."
      footerSummary={selectedFile && previewData && previewData.validRows > 0 ? (
        <span>
          Sheet: <strong>{selectedSheet || previewData.selectedSheet}</strong> — Sẽ xử lý{' '}
          <strong>{previewData.validRows}</strong> nhà cung cấp hợp lệ (bỏ qua {previewData.errorRows} dòng trùng/lỗi).
        </span>
      ) : (
        <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
      )}
      confirmLabel={`Xác nhận nhập (${previewData?.validRows ?? 0} NCC)`}
      confirmDisabled={!selectedFile || !previewData || previewData.validRows === 0}
      isImporting={isImporting}
      onConfirm={() => void handleConfirmImport()}
    >
      <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-[length:var(--fs-xs)]">
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
          <tbody className="divide-y divide-[var(--md-outline-variant)] bg-[var(--md-surface)]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
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
                      !r.isValid ? (isDuplicate ? 'bg-[var(--tint-warning-soft)]' : 'bg-[var(--tint-error-soft)]') : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 text-center text-[var(--md-on-surface-variant)] font-mono">
                      {r.originalIndex}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[length:var(--fs-micro)] font-medium text-[var(--md-on-success-container)] bg-[var(--md-success-container)] px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span>Hợp lệ</span>
                        </span>
                      ) : isDuplicate ? (
                        <span
                          className="inline-flex items-center gap-1 text-[length:var(--fs-micro)] font-medium text-[var(--md-on-warning-container)] bg-[var(--md-warning-container)] px-2 py-0.5 rounded-full cursor-help"
                          title={r.error || 'Trùng lặp tên hoặc MST'}
                        >
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>Trùng lặp</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[length:var(--fs-micro)] font-medium text-[var(--md-on-error-container)] bg-[var(--md-error-container)] px-2 py-0.5 rounded-full cursor-help"
                          title={r.error || 'Lỗi dữ liệu'}
                        >
                          <XCircle size={12} className="shrink-0" />
                          <span>Lỗi</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[var(--md-on-surface-variant)]">
                      {r.supplierCode || <span className="italic text-[length:var(--fs-micro)]">Tự cấp</span>}
                    </td>
                    <td className="py-2 px-2.5">
                      <span className="font-medium text-[var(--md-on-surface)]" title={r.supplierName}>
                        {r.supplierName}
                      </span>
                      {!r.isValid && r.error && (
                        <p className={`text-[length:var(--fs-micro)] mt-0.5 font-normal ${isDuplicate ? 'text-[var(--md-warning)]' : 'text-[var(--md-error)]'}`}>
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
                      <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">{r.scope || 'Trong nước'}</div>
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
    </ExcelImportModalShell>
  );
}
