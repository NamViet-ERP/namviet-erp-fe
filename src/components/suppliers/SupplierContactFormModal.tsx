import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import { useSuppliers } from '../../hooks/useSuppliers';
import type {
  SupplierContactApiDto,
  UpsertSupplierContactRequest,
} from '../../types/api/supplierDirectoryApi';

interface SupplierContactFormModalProps {
  isOpen: boolean;
  editing: SupplierContactApiDto | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (body: UpsertSupplierContactRequest) => void;
}

const FORM_ID = 'supplier-contact-form';

export default function SupplierContactFormModal({
  isOpen,
  editing,
  isSaving,
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
      <ContactForm editing={editing} onSubmit={onSubmit} />
    </Modal>
  );
}

/** Modal chỉ render khi mở nên state khởi tạo lại mỗi lần mở — không cần đồng bộ qua effect. */
function ContactForm({
  editing,
  onSubmit,
}: Pick<SupplierContactFormModalProps, 'editing' | 'onSubmit'>) {
  const [form, setForm] = useState({
    supplierId: editing ? String(editing.supplierId) : '',
    fullName: editing?.fullName ?? '',
    position: editing?.position ?? '',
    phone: editing?.phone ?? '',
    email: editing?.email ?? '',
    note: editing?.note ?? '',
    isPrimary: editing?.isPrimary ?? false,
  });
  const [errors, setErrors] = useState<{ supplierId?: string; fullName?: string; email?: string }>({});
  const { data: suppliers } = useSuppliers({ all: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const supplierId = Number(form.supplierId);
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    if (!supplierId) next.supplierId = 'Chọn nhà cung cấp.';
    if (!fullName) next.fullName = 'Họ tên là bắt buộc.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Email không hợp lệ.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      supplierId,
      fullName,
      position: form.position.trim() || null,
      phone: form.phone.trim() || null,
      email: email || null,
      note: form.note.trim() || null,
      isPrimary: form.isPrimary,
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
          <option value="">— Chọn nhà cung cấp —</option>
          {(suppliers?.items ?? []).map(s => (
            <option key={s.id} value={s.id}>
              {s.supplierCode} — {s.supplierName}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Họ và tên" required error={errors.fullName}>
          <input
            className="form-input"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          />
        </FormField>
        <FormField label="Chức vụ">
          <input
            className="form-input"
            value={form.position}
            onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            placeholder="VD: Trưởng phòng kinh doanh"
          />
        </FormField>
        <FormField label="Điện thoại">
          <input
            className="form-input"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input
            className="form-input"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </FormField>
      </div>

      <FormField label="Ghi chú">
        <textarea
          className="form-input"
          rows={2}
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="form-checkbox"
          checked={form.isPrimary}
          onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))}
        />
        Là liên hệ chính của nhà cung cấp
      </label>
    </form>
  );
}
