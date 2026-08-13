import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  useBodyScrollLock(isOpen);
  useEscapeToClose(isOpen, onClose);
  if (!isOpen) return null;

  return createPortal(
    <div className="md-dialog-overlay">
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div
        className="md-dialog md-dialog--confirm animate-scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="md-confirm__body">
          <div className={`md-confirm__icon-wrap md-confirm__icon-wrap--${variant === 'danger' ? 'danger' : 'default'}`}>
            <AlertTriangle size={28} />
          </div>
          <h3 id="confirm-dialog-title" className="md-confirm__title">{title}</h3>
          <div id="confirm-dialog-message" className="md-confirm__message">{message}</div>
        </div>
        <div className="md-confirm__actions">
          <button type="button" className="btn btn-outline flex-1 text-sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn flex-1 text-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
