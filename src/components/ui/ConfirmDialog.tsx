import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import Button from './Button';

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
  icon?: ReactNode;
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
  icon,
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
            {icon ?? (variant === 'danger' ? <AlertTriangle size={28} /> : <CheckCircle size={28} />)}
          </div>
          <h3 id="confirm-dialog-title" className="md-confirm__title">{title}</h3>
          <div id="confirm-dialog-message" className="md-confirm__message">{message}</div>
        </div>
        <div className="md-confirm__actions">
          <Button type="button" variant="outlined" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'filled'}
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
