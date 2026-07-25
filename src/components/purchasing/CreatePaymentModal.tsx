import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import PurchasingCreateModal, { PurchasingField } from './PurchasingCreateModal';
import HrmDatePicker from '../hr/HrmDatePicker';
import { showToast } from '../ui/Toast';
import { useCreatePurchasePayment } from '../../hooks/usePurchasePayments';
import { getApiErrorMessage } from '../../lib/apiClient';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { formatCurrency } from '../../utils/formatCurrency';

interface CreatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefill từ PO (mã PO). */
  prefillPoCode?: string | null;
}

const empty = {
  poCode: '',
  supplier: '',
  invoiceNo: '',
  amount: '',
  dueDate: '',
};

export default function CreatePaymentModal({ open, onClose, prefillPoCode }: CreatePaymentModalProps) {
  const [form, setForm] = useState(empty);
  const createMutation = useCreatePurchasePayment();

  const poQuery = useQuery({
    queryKey: ['purchaseOrders', 'payment-prefill', form.poCode] as const,
    queryFn: () => purchaseOrdersService.getByCode(form.poCode),
    enabled: open && Boolean(form.poCode.trim()),
    retry: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      poCode: prefillPoCode?.trim() ?? '',
      supplier: '',
      invoiceNo: '',
      amount: '',
      dueDate: '',
    });
  }, [open, prefillPoCode]);

  useEffect(() => {
    if (!poQuery.data) return;
    const po = poQuery.data;
    setForm(prev => ({
      ...prev,
      supplier: po.supplierName ?? '',
      amount: prev.amount || String(po.totalAmount ?? ''),
      dueDate: prev.dueDate || (po.paymentDueDate ? String(po.paymentDueDate).slice(0, 10) : ''),
    }));
  }, [poQuery.data]);

  const close = () => {
    if (createMutation.isPending) return;
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const poCode = form.poCode.trim();
    if (!poCode) {
      showToast('warning', 'Nhập mã PO để tạo DNTT.');
      return;
    }
    if (!form.dueDate) {
      showToast('warning', 'Chọn hạn thanh toán.');
      return;
    }
    const amountRaw = form.amount.trim().replace(/,/g, '');
    const amount = amountRaw ? Number(amountRaw) : undefined;
    if (amountRaw && (Number.isNaN(amount) || (amount ?? 0) <= 0)) {
      showToast('warning', 'Số tiền không hợp lệ.');
      return;
    }

    try {
      const row = await createMutation.mutateAsync({
        poCode,
        invoiceNo: form.invoiceNo.trim() || null,
        amount: amount ?? null,
        dueDate: form.dueDate,
      });
      showToast('success', `Đã tạo ${row.code} cho ${row.poCode}`);
      close();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <PurchasingCreateModal
      open={open}
      onClose={close}
      title="Tạo DNTT từ PO"
      formId="pur-create-payment"
      onSubmit={onSubmit}
      submitLabel={createMutation.isPending ? 'Đang tạo…' : 'Tạo DNTT'}
      submitDisabled={createMutation.isPending}
    >
      <PurchasingField label="Mã PO" required>
        <input
          className="form-input form-input-md"
          value={form.poCode}
          readOnly={Boolean(prefillPoCode)}
          onChange={e => setForm(p => ({ ...p, poCode: e.target.value.toUpperCase() }))}
          placeholder="PO-0001"
        />
      </PurchasingField>
      <PurchasingField label="Hóa đơn">
        <input
          className="form-input form-input-md"
          value={form.invoiceNo}
          onChange={e => setForm(p => ({ ...p, invoiceNo: e.target.value }))}
        />
      </PurchasingField>
      <PurchasingField label="Nhà cung cấp" className="sm:col-span-2">
        <input
          className="form-input form-input-md"
          value={form.supplier || (poQuery.isFetching ? 'Đang tải…' : '')}
          readOnly
          placeholder="Tự điền từ PO"
        />
      </PurchasingField>
      <PurchasingField label="Số tiền">
        <input
          className="form-input form-input-md"
          value={form.amount}
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          placeholder={poQuery.data ? formatCurrency(poQuery.data.totalAmount) : 'Theo tổng PO'}
        />
      </PurchasingField>
      <PurchasingField label="Hạn thanh toán" required>
        <HrmDatePicker
          value={form.dueDate}
          onChange={v => setForm(p => ({ ...p, dueDate: v }))}
          placeholder="dd/mm/yyyy"
        />
      </PurchasingField>
      {poQuery.isError ? (
        <p className="sm:col-span-2 text-sm" style={{ color: 'var(--md-error)' }}>
          {getApiErrorMessage(poQuery.error)}
        </p>
      ) : null}
    </PurchasingCreateModal>
  );
}
