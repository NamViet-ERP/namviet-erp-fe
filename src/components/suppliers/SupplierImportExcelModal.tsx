import { useState, useRef } from 'react';
import { Download, Upload, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { suppliersService } from '../../services/suppliersService';
import type { SupplierImportPreviewResponseDto } from '../../types/wms';

interface SupplierImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierImportExcelModal({
  isOpen,
  onClose,
  onSuccess,
}: SupplierImportExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<SupplierImportPreviewResponseDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setIsPreviewing(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      await suppliersService.downloadTemplate();
      showToast('success', 'Đã tải xuống file Excel mẫu nhà cung cấp.');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu NCC.'));
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('warning', 'Vui lòng chọn file Excel định dạng .xlsx hoặc .xls');
      return;
    }
    setSelectedFile(file);
    setIsPreviewing(true);
    setPreviewData(null);
    try {
      const res = await suppliersService.previewImportExcel(file);
      setPreviewData(res);
      if (res.errorRows > 0) {
        showToast('warning', `Tìm thấy ${res.validRows} NCC hợp lệ và ${res.errorRows} dòng có lỗi trùng/thiếu thông tin.`);
      } else {
        showToast('info', `Phân tích thành công: ${res.validRows} nhà cung cấp hợp lệ.`);
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
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

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
      title="📥 Nạp Danh Sách Nhà Cung Cấp Hàng Loạt (Excel)"
      size="wide"
    >
      <div className="space-y-4 text-xs">
        {/* Banner hướng dẫn */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-sm flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
              <CheckCircle size={16} />
              <span>Khởi tạo Master Data Nhà Cung Cấp từ Excel</span>
            </div>
            <p className="leading-relaxed">
              File Excel bao gồm: Tên NCC, Mã số thuế, SĐT, Website, Loại hình, Phạm vi, Hạn nợ, Điều khoản và Nhóm ngành hàng.
              NCC sau khi nạp sẽ ở <strong>Hạng D - Trạng thái Mới (Chờ duyệt)</strong> theo chuẩn Master Data Mayzer ERP.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm shrink-0 inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            onClick={handleDownloadTemplate}
          >
            <Download size={14} />
            <span>Tải File Mẫu NCC</span>
          </button>
        </div>

        {/* Khu vực chọn / kéo thả file */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[var(--md-outline-variant02)] hover:border-blue-500/60 rounded-xl p-5 text-center transition-colors bg-[var(--md-surface)] cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--md-on-surface)]">
                {selectedFile ? selectedFile.name : 'Bấm để chọn hoặc kéo thả file Excel danh sách NCC vào đây'}
              </p>
              <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-0.5">
                Chỉ hỗ trợ file Excel (.xlsx, .xls), dung lượng tối đa 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Loading state preview */}
        {isPreviewing && (
          <div className="p-6 text-center text-[var(--md-on-surface-variant)] flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={18} />
            <span>Đang kiểm tra tính hợp lệ và quét trùng tên / MST từ hệ thống...</span>
          </div>
        )}

        {/* Bảng xem trước dữ liệu (Auto Preview) */}
        {previewData && !isPreviewing && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20">
                <span className="block text-[11px] text-[var(--md-on-surface-variant)]">Tổng số dòng</span>
                <strong className="text-sm font-bold">{previewData.totalRows}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                <span className="block text-[11px]">Hợp lệ</span>
                <strong className="text-sm font-bold">{previewData.validRows}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300">
                <span className="block text-[11px]">Có cảnh báo / Lỗi</span>
                <strong className="text-sm font-bold">{previewData.errorRows}</strong>
              </div>
            </div>

            <div className="border border-[var(--md-outline-variant02)] rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm w-12 text-center">
                      STT
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Mã NCC
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Tên nhà cung cấp
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Mã số thuế
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      SĐT
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Loại hình
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Nhóm ngành hàng
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-center w-28">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-outline-variant02)]/50">
                  {previewData.rows.map((r, idx) => (
                    <tr
                      key={`${r.supplierName}-${idx}`}
                      className={`hover:bg-[var(--md-surface-variant)]/20 transition-colors ${
                        !r.isValid ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2.5 text-center text-[var(--md-on-surface-variant)]">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 font-mono text-[var(--md-on-surface-variant)]">{r.supplierCode || '—'}</td>
                      <td className="py-1.5 px-2.5 font-medium max-w-[200px] truncate" title={r.supplierName}>
                        {r.supplierName}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono">{r.taxCode || '—'}</td>
                      <td className="py-1.5 px-2.5">{r.contactPhone || '—'}</td>
                      <td className="py-1.5 px-2.5">{r.supplierType || '—'}</td>
                      <td className="py-1.5 px-2.5 max-w-[160px] truncate" title={r.industryGroups || undefined}>
                        {r.industryGroups || '—'}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        {r.isValid ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Hợp lệ
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 truncate max-w-[120px] inline-block"
                            title={r.error || 'Lỗi'}
                          >
                            {r.error || 'Lỗi'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--md-outline-variant02)]">
          <div className="text-[11px] text-[var(--md-on-surface-variant)]">
            {selectedFile && previewData && (
              <span>
                Sẵn sàng nạp <strong>{previewData.validRows}</strong> nhà cung cấp vào hệ thống.
              </span>
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
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-sm"
              onClick={handleConfirmImport}
              disabled={!selectedFile || !previewData || previewData.validRows === 0 || isImporting}
            >
              {isImporting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
              <span>Xác Nhận Nạp Danh Sách NCC</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
