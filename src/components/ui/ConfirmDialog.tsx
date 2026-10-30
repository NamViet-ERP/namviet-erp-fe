import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDialogFocus } from '../../hooks/useDialogFocus';
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
  confirmDisabled?: boolean;
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
  confirmDisabled = false,
  icon,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(isOpen);
  useDialogFocus(isOpen, dialogRef, onClose);
  if (!isOpen) return null;

  return createPortal(
    <div className="md-dialog-overlay">
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        tabIndex={-1}
        data-modal-focus
        className="md-dialog md-dialog--confirm animate-scale-in rounded-2xl shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="md-confirm__body">
          <div className={`md-confirm__icon-wrap md-confirm__icon-wrap--${variant === 'danger' ? 'danger' : 'default'}`}>
            {icon ?? (variant === 'danger' ? <AlertTriangle size={28} /> : <CheckCircle size={28} />)}
          </div>
          <h3 id={titleId} className="md-confirm__title">{title}</h3>
          <div id={messageId} className="md-confirm__message">{message}</div>
        </div>
        <div className="md-confirm__actions">
          <Button type="button" variant="outlined" className="flex-1 rounded-lg" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'filled'}
            className="flex-1 rounded-lg"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
