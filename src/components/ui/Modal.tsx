import type { ModalSize, ModalVariant } from '../../types';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  /** Rendered next to the title — status badge, code chip. */
  titleAdornment?: ReactNode;
  /** Hint or meta under the title row (voucher status, helper). */
  subtitle?: ReactNode;
  /** Tighter header padding (voucher / detail sheets). */
  headerCompact?: boolean;
  /** Extra classes on the title (mono voucher codes). */
  titleClassName?: string;
  /** Fixed block between header and scrollable body (meta grid, filters). */
  beforeBody?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const sizeClass: Record<ModalSize, string> = {
  /** Xác nhận / mật khẩu — gọn */
  sm: 'md-dialog--sm',
  md: 'md-dialog--md',
  lg: 'md-dialog--lg',
  /** Form tạo/sửa danh mục — chuẩn ERP */
  xl: 'md-dialog--xl',
  /** Phiếu chứng từ (tạo + bảng dòng) — cùng khung với chi tiết phiếu */
  full: 'md-dialog--full',
  /** Phiếu nhiều cột (PO, KHMH) — rộng hơn full */
  wide: 'md-dialog--wide',
};

const variantClass: Record<ModalVariant, string> = {
  plain: '',
  branded: 'md-dialog--branded',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'plain',
  titleAdornment,
  subtitle,
  headerCompact = false,
  titleClassName,
  beforeBody,
  footer,
  className,
}: ModalProps) {
  useBodyScrollLock(isOpen);
  useEscapeToClose(isOpen, onClose);
  if (!isOpen) return null;

  const dialogClass = [
    'md-dialog animate-scale-in',
    sizeClass[size] ?? sizeClass.md,
    variantClass[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div className="md-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="md-dialog-title">
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div className={dialogClass}>
        <div className={`md-dialog__header${headerCompact ? ' md-dialog__header--compact' : ''}`}>
          <div className="min-w-0 flex-1">
            <div className="md-dialog__title-row">
              <h3 id="md-dialog-title" className={`md-dialog__title${titleClassName ? ` ${titleClassName}` : ''}`}>
                {title}
              </h3>
              {titleAdornment}
            </div>
            {subtitle}
          </div>
          <button type="button" className="md-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="md-dialog__divider" aria-hidden />
        {beforeBody}
        <div className="md-dialog__body">{children}</div>
        {footer && <div className="md-dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
