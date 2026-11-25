import { AlertCircle, Check, Copy, Search } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import type { OpeningStockItemPreviewDto } from '../../types/wms';

export interface OpeningStockIndexedItem extends OpeningStockItemPreviewDto {
  originalIndex: number;
}

interface AdminOpeningStockErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  targetWarehouseLabel: string;
  totalErrorRows: number;
  errorItems: OpeningStockIndexedItem[];
  filteredErrorItems: OpeningStockIndexedItem[];
  errorSearch: string;
  onErrorSearchChange: (value: string) => void;
  copied: boolean;
  onCopyErrors: () => void;
}

export default function AdminOpeningStockErrorModal({
  isOpen,
  onClose,
  fileName,
  targetWarehouseLabel,
  totalErrorRows,
  errorItems,
  filteredErrorItems,
  errorSearch,
  onErrorSearchChange,
  copied,
  onCopyErrors,
}: AdminOpeningStockErrorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Chi tiết lỗi đối soát tồn kho đầu kỳ (${errorItems.length} lỗi trên ${totalErrorRows} dòng)`}
      subtitle={(
        <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
          File: <strong>{fileName}</strong> — Nơi nhận: <strong>{targetWarehouseLabel}</strong>
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
              onChange={e => onErrorSearchChange(e.target.value)}
              placeholder="Tìm theo số dòng, mã vật tư hoặc nội dung lỗi…"
              aria-label="Tìm kiếm lỗi"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
            />
          </div>
          <Button
            type="button"
            variant="outlined"
            size="sm"
            className="text-xs"
            onClick={onCopyErrors}
            title="Sao chép toàn bộ lỗi vào bộ nhớ tạm"
          >
            {copied ? (
              <>
                <Check size={14} className="text-[var(--md-success)]" />
                <span className="text-[var(--md-success)] font-medium">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Sao chép toàn bộ lỗi ({errorItems.length})</span>
              </>
            )}
          </Button>
        </div>
      )}
      footer={(
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            Hiển thị <strong>{filteredErrorItems.length}</strong> / <strong>{errorItems.length}</strong> lỗi
          </span>
          <Button type="button" variant="filled" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-3 py-1">
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] text-xs text-[var(--md-on-surface-variant)]">
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
              <tbody className="divide-y divide-[var(--md-outline-variant)] bg-[var(--md-surface)]">
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
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--md-error-container)] text-[var(--md-on-error-container)]">
                          Dòng {err.originalIndex}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono font-medium text-[var(--md-primary)]">
                        {err.materialCode || <span className="text-[var(--md-on-surface-variant)] italic">Trống</span>}
                      </td>
                      <td className="py-2 px-2.5 font-medium text-[var(--md-on-surface)]">
                        {err.materialName || '—'}
                      </td>
                      <td className="py-2 px-2.5 text-[var(--md-error)] font-normal leading-relaxed">
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
  );
}
