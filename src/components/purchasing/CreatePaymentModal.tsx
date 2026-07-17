import { useEffect, useState, type FormEvent } from 'react';
import PurchasingCreateModal, { PurchasingField } from './PurchasingCreateModal';
import HrmDatePicker from '../hr/HrmDatePicker';
import { createPaymentFromOrder } from '../../lib/purchasing/purchasingStore';
import { isoToDisplay } from '../../lib/dates';
import { showToast } from '../ui/Toast';

export interface PaymentPrefill {
  orderId: string;
  poCode: string;
  supplier: string;
  amount: string;
}

interface CreatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: PaymentPrefill | null;
}

const empty = {
  orderId: '',
  poCode: '',
  supplier: '',
  invoiceNo: '',
  amount: '',
  dueDate: '',
};

export default function CreatePaymentModal({ open, onClose, prefill }: CreatePaymentModalProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm({
      orderId: prefill?.orderId ?? '',
      poCode: prefill?.poCode ?? '',
      supplier: prefill?.supplier ?? '',
      invoiceNo: '',
      amount: prefill?.amount ?? '',
      dueDate: '',
    });
  }, [open, prefill]);

  const close = () => onClose();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.orderId) {
      showToast('warning', 'DNTT phải tạo từ một PO (nút trên danh sách đơn hàng).');
      return;
    }
    if (!form.dueDate) {
      showToast('warning', 'Chọn hạn thanh toán.');
      return;
    }
    const row = createPaymentFromOrder(form.orderId, {
      invoiceNo: form.invoiceNo,
      dueDate: isoToDisplay(form.dueDate),
      amount: form.amount,
    });
    if (!row) {
      showToast('error', 'PO đã có DNTT hoặc không tìm thấy.');
      return;
    }
    showToast('success', `Đã tạo ${row.code} cho ${row.poCode}`);
    close();
  };

  return (
    <PurchasingCreateModal open={open} onClose={close} title="Tạo DNTT từ PO" formId="pur-create-payment" onSubmit={onSubmit} submitLabel="Tạo DNTT">
      <PurchasingField label="Mã PO" required>
        <input className="form-input form-input-md" value={form.poCode} readOnly />
      </PurchasingField>
      <PurchasingField label="Hóa đơn">
        <input className="form-input form-input-md" value={form.invoiceNo} onChange={e => setForm(p => ({ ...p, invoiceNo: e.target.value }))} />
      </PurchasingField>
      <PurchasingField label="Nhà cung cấp" required className="sm:col-span-2">
        <input className="form-input form-input-md" value={form.supplier} readOnly />
      </PurchasingField>
      <PurchasingField label="Số tiền">
        <input className="form-input form-input-md" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
      </PurchasingField>
      <PurchasingField label="Hạn thanh toán" required>
        <HrmDatePicker value={form.dueDate} onChange={v => setForm(p => ({ ...p, dueDate: v }))} placeholder="dd/mm/yyyy" />
      </PurchasingField>
    </PurchasingCreateModal>
  );
}
