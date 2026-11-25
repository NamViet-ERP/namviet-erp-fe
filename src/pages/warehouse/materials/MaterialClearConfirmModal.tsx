import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { materialsService } from '../../../services/materialsService';

interface MaterialClearConfirmModalProps {
  isOpen: boolean;
  totalCount: number;
  onClose: () => void;
  onCleared: () => Promise<void> | void;
}

export default function MaterialClearConfirmModal({
  isOpen,
  totalCount,
  onClose,
  onCleared,
}: MaterialClearConfirmModalProps) {
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClearConfirmText('');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isClearingAll) {
      setClearConfirmText('');
      onClose();
    }
  };

  const handleClearAllMaterials = async () => {
    if (clearConfirmText.trim() !== 'XOA HET') return;
    try {
      setIsClearingAll(true);
      const res = await materialsService.clearAll();
      showToast('success', res.message || 'Đã dọn sạch danh mục vật tư');
      setClearConfirmText('');
      onClose();
      await onCleared();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể dọn sạch danh mục vật tư'));
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Dọn sạch toàn bộ danh mục vật tư"
      size="md"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setClearConfirmText('');
              onClose();
            }}
            disabled={isClearingAll}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger flex items-center gap-1.5"
            disabled={clearConfirmText.trim() !== 'XOA HET' || isClearingAll}
            onClick={handleClearAllMaterials}
          >
            <Trash2 size={16} aria-hidden />
            {isClearingAll ? 'Đang dọn sạch...' : 'Xác nhận dọn sạch'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm leading-relaxed">
          <p className="font-semibold mb-1 flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
            <Trash2 size={16} />
            Cảnh báo quan trọng (Chỉ Quản trị viên)
          </p>
          <p>
            Thao tác này sẽ dọn sạch toàn bộ danh mục vật tư hiện tại trên hệ thống (hiện có <strong className="font-bold underline">{totalCount}</strong> vật tư).
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-rose-700/90 dark:text-rose-300/90">
            <li>Các vật tư chưa phát sinh giao dịch sẽ được <strong>xóa hoàn toàn</strong> khỏi cơ sở dữ liệu.</li>
            <li>Các vật tư đã có phát sinh giao dịch sẽ được <strong>chuyển sang trạng thái lưu trữ</strong> để bảo toàn lịch sử phiếu kho.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Để xác nhận, vui lòng nhập chính xác cụm từ <span className="font-mono text-rose-600 font-bold bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">XOA HET</span> vào ô bên dưới:
          </label>
          <input
            type="text"
            className="form-input w-full font-mono text-center tracking-wider text-rose-600 font-bold"
            placeholder="Nhập 'XOA HET'"
            value={clearConfirmText}
            onChange={e => setClearConfirmText(e.target.value)}
            disabled={isClearingAll}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
