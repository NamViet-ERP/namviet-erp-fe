import { useEffect, useState, type FormEvent } from 'react';
import PurchasingCreateModal, { PurchasingField } from './PurchasingCreateModal';
import { addSupplier } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../ui/Toast';

interface CreateSupplierModalProps {
  open: boolean;
  onClose: () => void;
}

const empty = {
  code: '',
  name: '',
  contact: '',
  phone: '',
  email: '',
  category: 'Thiết bị điện',
  rating: 'B',
};

export default function CreateSupplierModal({ open, onClose }: CreateSupplierModalProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const close = () => onClose();

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      showToast('warning', 'Nhập tên NCC và người liên hệ.');
      return;
    }
    const row = addSupplier({
      code: form.code.trim() || `NCC-${String(Date.now()).slice(-3)}`,
      name: form.name.trim(),
      contact: form.contact.trim(),
      phone: form.phone.trim() || '—',
      email: form.email.trim() || '—',
      category: form.category,
      rating: form.rating,
    });
    showToast('success', `Đã thêm ${row.code}`);
    close();
  };

  return (
    <PurchasingCreateModal open={open} onClose={close} title="Thêm nhà cung cấp" formId="pur-create-supplier" onSubmit={onSubmit} submitLabel="Thêm NCC">
      <PurchasingField label="Mã NCC">
        <input className="form-input form-input-md" value={form.code} onChange={set('code')} placeholder="Tự sinh nếu để trống" />
      </PurchasingField>
      <PurchasingField label="Xếp hạng">
        <select className="form-input form-input-md" value={form.rating} onChange={set('rating')}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </PurchasingField>
      <PurchasingField label="Tên NCC" required className="sm:col-span-2">
        <input className="form-input form-input-md" value={form.name} onChange={set('name')} required />
      </PurchasingField>
      <PurchasingField label="Người liên hệ" required>
        <input className="form-input form-input-md" value={form.contact} onChange={set('contact')} required />
      </PurchasingField>
      <PurchasingField label="Ngành hàng">
        <select className="form-input form-input-md" value={form.category} onChange={set('category')}>
          <option>Thiết bị điện</option>
          <option>Vật tư</option>
          <option>Nhập khẩu</option>
          <option>Gia công</option>
          <option>Vận chuyển</option>
        </select>
      </PurchasingField>
      <PurchasingField label="SĐT">
        <input className="form-input form-input-md" value={form.phone} onChange={set('phone')} />
      </PurchasingField>
      <PurchasingField label="Email">
        <input type="email" className="form-input form-input-md" value={form.email} onChange={set('email')} />
      </PurchasingField>
    </PurchasingCreateModal>
  );
}
