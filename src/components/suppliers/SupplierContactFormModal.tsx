import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  restrictVnPhoneInput,
  validateOptionalVietnamPhone,
} from '../../lib/suppliers/supplierStatus';
import { SUPPLIER_CONTACT_ROLES } from '../../lib/suppliers/supplierContactRole';
import type {
  SupplierContactApiDto,
  UpsertSupplierContactRequest,
} from '../../types/api/supplierDirectoryApi';

const POSITION_MAX_LENGTH = 150;

interface SupplierContactFormModalProps {
  isOpen: boolean;
  editing: SupplierContactApiDto | null;
  isSaving: boolean;
  apiErrors?: { phone?: string; email?: string; fullName?: string };
  onClose: () => void;
  onSubmit: (body: UpsertSupplierContactRequest) => void;
}

const FORM_ID = 'supplier-contact-form';

export default function SupplierContactFormModal({
  isOpen,
  editing,
  isSaving,
  apiErrors,
  onClose,
  onSubmit,
}: SupplierContactFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa người liên hệ' : 'Thêm người liên hệ'}
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button type="submit" form={FORM_ID} className="btn btn-filled" disabled={isSaving}>
            Lưu
          </button>
        </>
      }
    >
      <ContactForm editing={editing} apiErrors={apiErrors} onSubmit={onSubmit} />
    </Modal>
  );
}

/** Modal chỉ render khi mở nên state khởi tạo lại mỗi lần mở — không cần đồng bộ qua effect. */
function ContactForm({
  editing,
  apiErrors,
  onSubmit,
}: Pick<SupplierContactFormModalProps, 'editing' | 'apiErrors' | 'onSubmit'>) {
  const [form, setForm] = useState({
    supplierId: editing ? String(editing.supplierId) : '',
    fullName: editing?.fullName ?? '',
    position: editing?.position ?? '',
    phone: restrictVnPhoneInput(editing?.phone ?? ''),
    email: editing?.email ?? '',
    note: editing?.note ?? '',
    role: editing?.role ?? 'secondary',
  });
  const [errors, setErrors] = useState<{
    supplierId?: string;
    fullName?: string;
    position?: string;
    phone?: string;
    email?: string;
  }>({});
  const { data: suppliers } = useSuppliers({ all: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const supplierId = Number(form.supplierId);
    const fullName = form.fullName.trim();
    const position = form.position.trim();
    const email = form.email.trim();
    const phone = restrictVnPhoneInput(form.phone);
    if (!supplierId) next.supplierId = 'Chọn nhà cung cấp.';
    if (!fullName) next.fullName = 'Họ tên là bắt buộc.';
    if (position.length > POSITION_MAX_LENGTH) {
      next.position = `Chức vụ tối đa ${POSITION_MAX_LENGTH} ký tự.`;
    }
    const phoneMsg = validateOptionalVietnamPhone(phone);
    if (phoneMsg) next.phone = phoneMsg;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Email không hợp lệ.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      supplierId,
      fullName,
      position: position || null,
      phone: phone || null,
      email: email || null,
      note: form.note.trim() || null,
      role: form.role,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
      <FormField label="Nhà cung cấp" required error={errors.supplierId}>
        <select
          className="form-select"
          value={form.supplierId}
          disabled={Boolean(editing)}
          onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
        >
          <option value="">- Chọn nhà cung cấp -</option>
          {(suppliers?.items ?? []).map(s => (
            <option key={s.id} value={s.id}>
              {s.supplierCode} - {s.supplierName}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Họ và tên" required error={errors.fullName ?? apiErrors?.fullName}>
          <input
            className="form-input"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          />
        </FormField>
        <FormField label="Chức vụ" error={errors.position}>
          <input
            className="form-input"
            value={form.position}
            maxLength={POSITION_MAX_LENGTH}
            onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            placeholder="VD: Trưởng phòng kinh doanh"
          />
        </FormField>
        <FormField label="Điện thoại" error={errors.phone ?? apiErrors?.phone}>
          <input
            className="form-input"
            value={form.phone}
            maxLength={10}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0912345678"
            onChange={e => {
              const phone = restrictVnPhoneInput(e.target.value);
              setForm(f => ({ ...f, phone }));
              setErrors(prev => ({ ...prev, phone: undefined }));
            }}
            onBlur={() => {
              setErrors(prev => ({
                ...prev,
                phone: validateOptionalVietnamPhone(form.phone) ?? undefined,
              }));
            }}
          />
        </FormField>
        <FormField label="Email" error={errors.email ?? apiErrors?.email}>
          <input
            className="form-input"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </FormField>
      </div>

      <FormField label="Vai trò liên hệ" required>
        <select
          className="form-select"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          aria-label="Vai trò liên hệ"
        >
          {SUPPLIER_CONTACT_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Ghi chú">
        <textarea
          className="form-input"
          rows={2}
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
      </FormField>
    </form>
  );
}
