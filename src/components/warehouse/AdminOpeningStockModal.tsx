import { useState, useRef } from 'react';
import { Download, Upload, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projectPage } = useProjects();
  const projects = projectPage?.items ?? [];

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
      await stockService.downloadOpeningStockTemplate();
      showToast('success', 'Đã tải xuống file Excel mẫu tồn kho đầu kỳ.');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu.'));
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
      const projCode = targetType === 'project' ? selectedProjectCode : undefined;
      const res = await stockService.previewOpeningStock(file, projCode);
      setPreviewData(res);
      if (res.errorRows > 0) {
        showToast('warning', `Tìm thấy ${res.validRows} dòng hợp lệ và ${res.errorRows} dòng có cảnh báo/lỗi.`);
      } else {
        showToast('info', `Phân tích thành công: ${res.validRows} dòng dữ liệu hợp lệ.`);
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
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="⚡ Nạp Số Dư Tồn Kho Đầu Kỳ (Quản Trị Viên)"
      size="wide"
    >
      <div className="space-y-4 text-xs">
        {/* Banner lưu ý bảo mật */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
          <div className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
            <CheckCircle size={16} />
            <span>Nạp số dư khởi tạo kho (Opening Balance)</span>
          </div>
          <p className="leading-relaxed">
            Chức năng dành riêng cho Admin để thiết lập số tồn vật lý ban đầu. Hệ thống sẽ tự động cập nhật số dư tồn kho
            và tạo một phiếu Nhập kho đã duyệt với chứng từ <code>OPENING-STOCK</code> để bảo đảm toàn vẹn lịch sử giao dịch.
          </p>
        </div>

        {/* Cấu hình Kho nhận & Tải file mẫu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20">
          <div>
            <label className="block font-semibold mb-1 text-[var(--md-on-surface)]">
              Nơi nhận số dư tồn kho:
            </label>
            <div className="flex items-center gap-4 mt-1.5">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="stockTarget"
                  checked={targetType === 'general'}
                  onChange={() => {
                    setTargetType('general');
                    if (selectedFile) void processFile(selectedFile);
                  }}
                />
                <span className="font-medium">Kho Tổng Nam Việt</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="stockTarget"
                  checked={targetType === 'project'}
                  onChange={() => setTargetType('project')}
                />
                <span className="font-medium">Kho Dự Án</span>
              </label>
            </div>

            {targetType === 'project' && (
              <div className="mt-2.5">
                <select
                  className="form-input form-input-sm w-full"
                  value={selectedProjectCode}
                  onChange={e => {
                    setSelectedProjectCode(e.target.value);
                    if (selectedFile) void processFile(selectedFile);
                  }}
                >
                  <option value="">-- Chọn dự án nhận tồn kho --</option>
                  {projects.map(p => (
                    <option key={p.projectCode} value={p.projectCode}>
                      {p.projectCode} — {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 sm:border-l border-[var(--md-outline-variant02)] pt-2 sm:pt-0 sm:pl-3">
            <span className="text-[var(--md-on-surface-variant)] text-[11px] mb-2">
              File Excel gồm: Mã VT, Tên VT, ĐVT, Số lượng tồn, Đơn giá vốn, Ghi chú.
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={handleDownloadTemplate}
            >
              <Download size={14} />
              <span>Tải File Excel Mẫu Chuẩn</span>
            </button>
          </div>
        </div>

        {/* Khu vực chọn / kéo thả file */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[var(--md-outline-variant02)] hover:border-emerald-500/60 rounded-xl p-5 text-center transition-colors bg-[var(--md-surface)] cursor-pointer"
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
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--md-on-surface)]">
                {selectedFile ? selectedFile.name : 'Bấm để chọn hoặc kéo thả file Excel vào đây'}
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
            <Loader2 className="animate-spin text-emerald-600" size={18} />
            <span>Đang phân tích cấu trúc và kiểm tra mã vật tư từ file Excel...</span>
          </div>
        )}

        {/* Bảng xem trước dữ liệu (Auto Preview) */}
        {previewData && !isPreviewing && (
          <div className="space-y-3">
            {/* Thanh tổng kết số liệu */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20">
                <span className="block text-[11px] text-[var(--md-on-surface-variant)]">Tổng số dòng</span>
                <strong className="text-sm font-bold">{previewData.totalRows}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                <span className="block text-[11px]">Hợp lệ</span>
                <strong className="text-sm font-bold">{previewData.validRows}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20">
                <span className="block text-[11px] text-[var(--md-on-surface-variant)]">Tổng SL tồn</span>
                <strong className="text-sm font-bold">{previewData.totalQty.toLocaleString('vi-VN')}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20">
                <span className="block text-[11px] text-[var(--md-on-surface-variant)]">Tổng giá trị vốn</span>
                <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrencyFull(previewData.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Bảng danh sách dòng preview */}
            <div className="border border-[var(--md-outline-variant02)] rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm w-12 text-center">
                      STT
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Mã vật tư
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm">
                      Tên vật tư
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-center w-16">
                      ĐVT
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-right w-24">
                      SL tồn
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-right w-28">
                      Đơn giá
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-right w-32">
                      Thành tiền
                    </th>
                    <th className="sticky top-0 z-20 bg-[var(--md-surface)] dark:bg-slate-900 border-b border-[var(--md-outline-variant02)] py-2 px-2.5 font-semibold text-[var(--md-on-surface)] shadow-sm text-center w-28">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-outline-variant02)]/50">
                  {previewData.items.map((it, idx) => (
                    <tr
                      key={`${it.materialCode}-${idx}`}
                      className={`hover:bg-[var(--md-surface-variant)]/20 transition-colors ${
                        !it.isValid ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2.5 text-center text-[var(--md-on-surface-variant)]">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 font-mono font-medium">{it.materialCode}</td>
                      <td className="py-1.5 px-2.5 truncate max-w-[200px]" title={it.materialName}>
                        {it.materialName}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">{it.unit}</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold tabular-nums">
                        {it.qty.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-1.5 px-2.5 text-right tabular-nums">
                        {it.unitPrice > 0 ? formatCurrencyFull(it.unitPrice) : '0 ₫'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                        {it.totalAmount > 0 ? formatCurrencyFull(it.totalAmount) : '0 ₫'}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        {it.isValid ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Hợp lệ
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 truncate max-w-[120px] inline-block"
                            title={it.error || 'Lỗi'}
                          >
                            {it.error || 'Lỗi'}
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
                Sẵn sàng nạp <strong>{previewData.validRows}</strong> mặt hàng vào{' '}
                <strong>{targetType === 'project' ? `Dự án ${selectedProjectCode}` : 'Kho Tổng'}</strong>
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
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold shadow-sm"
              onClick={handleConfirmImport}
              disabled={!selectedFile || !previewData || previewData.validRows === 0 || isImporting}
            >
              {isImporting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
              <span>Xác Nhận Nạp Số Dư Tồn Kho</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
