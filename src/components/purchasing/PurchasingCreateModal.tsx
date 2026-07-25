import type { FormEvent, ReactNode } from 'react';
import Modal from '../ui/Modal';

interface PurchasingCreateModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formId: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/** Shared create dialog chrome for Mua hàng UI-only forms. */
export default function PurchasingCreateModal({
  open,
  onClose,
  title,
  formId,
  submitLabel = 'Thêm',
  submitDisabled = false,
  onSubmit,
  children,
  size = 'lg',
}: PurchasingCreateModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitDisabled}>Hủy</button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={submitDisabled}>{submitLabel}</button>
        </>
      )}
    >
      <form id={formId} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={onSubmit}>
        {children}
      </form>
    </Modal>
  );
}

export function PurchasingField({
  label,
  required,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
