import { useEffect, useState, type FormEvent } from 'react';
import PurchasingCreateModal, { PurchasingField } from './PurchasingCreateModal';
import { addStandaloneRequest, createRequestFromPlan } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../ui/Toast';

export interface RequestPrefill {
  planId?: string;
  project?: string;
  item?: string;
  requester?: string;
}

interface CreateRequestModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: RequestPrefill | null;
}

const empty = {
  project: '',
  item: '',
  requester: '',
  itemCount: '1',
  amount: '',
};

export default function CreateRequestModal({ open, onClose, prefill }: CreateRequestModalProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm({
      project: prefill?.project ?? '',
      item: prefill?.item ?? '',
      requester: prefill?.requester ?? '',
      itemCount: '1',
      amount: '',
    });
  }, [open, prefill]);

  const close = () => onClose();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.project.trim() || !form.requester.trim()) {
      showToast('warning', 'Nhập dự án và người yêu cầu.');
      return;
    }

    if (prefill?.planId) {
      const row = createRequestFromPlan(prefill.planId, {
        requester: form.requester.trim(),
        amount: form.amount.trim() || '0',
        itemCount: Number(form.itemCount) || 1,
      });
      if (!row) {
        showToast('error', 'Không tạo được YCMH từ kế hoạch.');
        return;
      }
      showToast('success', `Đã tạo ${row.code} từ ${prefill.project ? 'kế hoạch' : 'form'}`);
      close();
      return;
    }

    const row = addStandaloneRequest({
      project: form.project.trim(),
      item: form.item.trim(),
      requester: form.requester.trim(),
      itemCount: Number(form.itemCount) || 1,
      amount: form.amount.trim() || '0',
    });
    showToast('success', `Đã tạo ${row.code}`);
    close();
  };

  return (
    <PurchasingCreateModal
      open={open}
      onClose={close}
      title={prefill?.planId ? 'Tạo YCMH từ kế hoạch' : 'Tạo yêu cầu mua hàng'}
      formId="pur-create-request"
      onSubmit={onSubmit}
      submitLabel="Tạo YCMH"
    >
      {prefill?.planId && (
        <p className="sm:col-span-2 text-xs text-[var(--md-on-surface-variant)]">
          Nối từ kế hoạch — sau khi lưu, dòng kế hoạch sẽ chuyển sang “Đã YCMH đủ”.
        </p>
      )}
      <PurchasingField label="Dự án" required className="sm:col-span-2">
        <input
          className="form-input form-input-md"
          value={form.project}
          onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
          required
          readOnly={Boolean(prefill?.planId)}
        />
      </PurchasingField>
      <PurchasingField label="Mặt hàng" className="sm:col-span-2">
        <input
          className="form-input form-input-md"
          value={form.item}
          onChange={e => setForm(p => ({ ...p, item: e.target.value }))}
          readOnly={Boolean(prefill?.planId)}
        />
      </PurchasingField>
      <PurchasingField label="Người yêu cầu" required>
        <input className="form-input form-input-md" value={form.requester} onChange={e => setForm(p => ({ ...p, requester: e.target.value }))} required />
      </PurchasingField>
      <PurchasingField label="Số dòng hàng">
        <input type="number" min={1} className="form-input form-input-md" value={form.itemCount} onChange={e => setForm(p => ({ ...p, itemCount: e.target.value }))} />
      </PurchasingField>
      <PurchasingField label="Ước tính" className="sm:col-span-2">
        <input className="form-input form-input-md" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="vd: 120.000.000" />
      </PurchasingField>
    </PurchasingCreateModal>
  );
}
