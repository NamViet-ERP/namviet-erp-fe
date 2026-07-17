import { useEffect, useMemo, useState, type FormEvent } from 'react';
import PurchasingCreateModal, { PurchasingField } from './PurchasingCreateModal';
import { addDocument, usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../ui/Toast';

interface CreateDocumentModalProps {
  open: boolean;
  onClose: () => void;
  prefillPoId?: string | null;
  /** Loại đang thiếu — mở sẵn trong form. */
  prefillDocType?: string | null;
}

export default function CreateDocumentModal({
  open,
  onClose,
  prefillPoId,
  prefillDocType,
}: CreateDocumentModalProps) {
  const { orders, docTypes } = usePurchasingStore();
  const typeOptions = useMemo(
    () => docTypes.length > 0 ? docTypes : ['Hợp đồng'],
    [docTypes],
  );
  const [poId, setPoId] = useState('');
  const [name, setName] = useState('');
  const [docType, setDocType] = useState<string>('Hợp đồng');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    const nextPo = prefillPoId && orders.some(o => o.id === prefillPoId)
      ? prefillPoId
      : (orders[0]?.id ?? '');
    const fallback = typeOptions[0] ?? 'Hợp đồng';
    setPoId(nextPo);
    setName('');
    setFile(null);
    setDocType(prefillDocType || fallback);
  }, [open, prefillPoId, prefillDocType, orders, typeOptions]);

  const close = () => onClose();
  const order = orders.find(o => o.id === poId);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!order) {
      showToast('warning', 'Chọn đơn hàng.');
      return;
    }
    const fileName = (file?.name || name.trim() || `${docType} - ${order.code}.pdf`);
    const normalized = fileName.includes('.') ? fileName : `${fileName}.pdf`;
    addDocument(
      {
        name: normalized,
        project: order.project,
        poId: order.id,
        poCode: order.code,
        supplier: order.supplier,
        docType,
      },
      file,
    );
    showToast('success', `Đã thêm “${docType}” cho ${order.code}`);
    close();
  };

  return (
    <PurchasingCreateModal
      open={open}
      onClose={close}
      title={prefillDocType ? `Tải lên: ${prefillDocType}` : 'Tải file chứng từ'}
      formId="pur-create-document"
      onSubmit={onSubmit}
      submitLabel="Lưu file"
    >
      {orders.length === 0 ? (
        <p className="sm:col-span-2 text-sm text-[var(--md-error)]">Chưa có đơn hàng để gắn file.</p>
      ) : (
        <>
          <PurchasingField label="Đơn hàng" required className="sm:col-span-2">
            <select
              className="form-input form-input-md"
              value={poId}
              onChange={e => setPoId(e.target.value)}
              required
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.code} — {o.project}</option>
              ))}
            </select>
          </PurchasingField>
          <PurchasingField label="Loại giấy tờ" required>
            <select className="form-input form-input-md" value={docType} onChange={e => setDocType(e.target.value)}>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              {prefillDocType && !typeOptions.includes(prefillDocType) && (
                <option value={prefillDocType}>{prefillDocType}</option>
              )}
            </select>
          </PurchasingField>
          <PurchasingField label="Chọn file từ máy" className="sm:col-span-2">
            <input
              type="file"
              className="form-input form-input-md"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={e => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                if (next) setName(next.name);
              }}
            />
          </PurchasingField>
          <PurchasingField label="Tên hiển thị" className="sm:col-span-2">
            <input
              className="form-input form-input-md"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Để trống nếu đã chọn file"
            />
          </PurchasingField>
          <p className="sm:col-span-2 text-xs text-[var(--md-on-surface-variant)]">
            Chưa có file thật? Vẫn bấm “Lưu file” — hệ thống tạo file mẫu để demo.
          </p>
        </>
      )}
    </PurchasingCreateModal>
  );
}
