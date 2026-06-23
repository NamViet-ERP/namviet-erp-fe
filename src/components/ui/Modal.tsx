import type { ModalSize } from '../../types';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'md-dialog--sm',
  md: 'md-dialog--md',
  lg: 'md-dialog--lg',
  xl: 'md-dialog--xl',
  full: 'md-dialog--full',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="md-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="md-dialog-title">
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div className={`md-dialog animate-scale-in ${sizeClass[size] ?? sizeClass.md}`}>
        <div className="md-dialog__header">
          <h3 id="md-dialog-title" className="md-dialog__title">{title}</h3>
          <button type="button" className="md-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="md-dialog__divider" aria-hidden />
        <div className="md-dialog__body">{children}</div>
        {footer && <div className="md-dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
