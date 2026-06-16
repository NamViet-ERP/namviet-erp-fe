import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--md-scrim)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      <div
        className="animate-scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        style={{
          position: 'relative',
          background: 'var(--md-surface-container)',
          borderRadius: '28px',
          boxShadow: 'var(--md-shadow-4)',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '28px 24px 8px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: variant === 'danger' ? 'var(--md-error-container)' : 'var(--md-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <AlertTriangle
              size={28}
              style={{ color: variant === 'danger' ? 'var(--md-error)' : 'var(--md-primary)' }}
            />
          </div>

          <h3
            id="confirm-dialog-title"
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--md-on-surface)',
              marginBottom: '8px',
            }}
          >
            {title}
          </h3>

          <div
            id="confirm-dialog-message"
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--md-on-surface-variant)',
            }}
          >
            {message}
          </div>
        </div>

        <div
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn btn-outline flex-1 text-sm"
            onClick={onClose}
            disabled={isLoading}
          >
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
    document.body
  );
}
