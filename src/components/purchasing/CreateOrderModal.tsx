import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Camera, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import { addStandaloneOrder, createOrderFromRequest, usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import type { OrderKind } from '../../data/purchasingMock';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { showToast } from '../ui/Toast';

export interface OrderPrefill {
  requestId?: string;
  project?: string;
  amount?: string;
}

interface LineDraft {
  key: string;
  itemCode: string;
  itemName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  tax: string;
  promo: string;
  note: string;
}

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  defaultKind?: OrderKind;
  prefill?: OrderPrefill | null;
}

const TAX_OPTIONS = [
  { value: '0', label: 'Miễn thuế' },
  { value: '5', label: '5%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
];

function emptyLine(): LineDraft {
  return {
    key: `l-${Date.now()}-${Math.random()}`,
    itemCode: '',
    itemName: '',
    qty: '1',
    unit: '',
    unitPrice: '0',
    tax: '0',
    promo: '0',
    note: '',
  };
}

function parseNum(v: string): number {
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0;
}

function emptyForm(kind: OrderKind) {
  return {
    kind,
    project: '',
    supplier: '',
    orderedAt: toIsoDate(new Date()),
    eta: '',
    poNumber: '',
    invoiceNo: '',
    note: '',
    packCost: '0',
    deduction: '0',
    discountType: 'percent' as 'percent' | 'amount',
    discount: '0',
    taxTotal: '0',
  };
}

/** Modal ERP: Thêm Đơn đặt hàng mới (trong nước). */
export default function CreateOrderModal({
  open,
  onClose,
  defaultKind = 'standard',
  prefill,
}: CreateOrderModalProps) {
  const { suppliers } = usePurchasingStore();
  const [form, setForm] = useState(() => emptyForm(defaultKind));
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm(defaultKind),
      project: prefill?.project ?? '',
    });
    setLines([emptyLine()]);
    setDragIndex(null);
  }, [open, prefill, defaultKind]);

  const moveLine = (from: number, to: number) => {
    if (to < 0 || to >= lines.length || from === to) return;
    setLines(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const lineAmount = (l: LineDraft) => {
    const qty = parseNum(l.qty);
    const price = parseNum(l.unitPrice);
    const promo = parseNum(l.promo);
    return Math.max(0, qty * price - promo);
  };

  const totals = useMemo(() => {
    const qty = lines.reduce((s, l) => s + parseNum(l.qty), 0);
    const value = lines.reduce((s, l) => s + lineAmount(l), 0);
    const pack = parseNum(form.packCost);
    const ded = parseNum(form.deduction);
    const disc = form.discountType === 'percent'
      ? (value * parseNum(form.discount)) / 100
      : parseNum(form.discount);
    const total = Math.max(0, value + pack - ded - disc);
    return { qty, value, total };
  }, [lines, form.packCost, form.deduction, form.discount, form.discountType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.project.trim() || !form.supplier.trim() || !form.orderedAt || !form.eta) {
      showToast('warning', 'Nhập đủ dự án, NCC, ngày chứng từ và ECD.');
      return;
    }
    if (!prefill?.requestId && lines.some(l => !l.itemName.trim())) {
      showToast('warning', 'Mỗi dòng hàng cần tên hàng.');
      return;
    }

    const amountStr = totals.total.toLocaleString('vi-VN');

    if (prefill?.requestId) {
      const row = createOrderFromRequest(prefill.requestId, {
        supplier: form.supplier.trim(),
        orderedAt: isoToDisplay(form.orderedAt),
        eta: isoToDisplay(form.eta),
        amount: amountStr,
      });
      if (!row) {
        showToast('error', 'Không tạo được PO từ YCMH.');
        return;
      }
      showToast('success', `Đã tạo ${row.code}`);
      onClose();
      return;
    }

    const row = addStandaloneOrder({
      kind: form.kind,
      project: form.project.trim(),
      supplier: form.supplier.trim(),
      orderedAt: isoToDisplay(form.orderedAt),
      eta: isoToDisplay(form.eta),
      etw: isoToDisplay(form.eta),
      poNumber: form.poNumber.trim(),
      invoiceNo: form.invoiceNo.trim(),
      amount: amountStr || '0',
      note: form.note.trim(),
      lines: lines.map(l => ({
        itemCode: l.itemCode.trim() || '—',
        itemName: l.itemName.trim(),
        qty: l.qty.trim() || '1',
        unit: l.unit.trim() || 'Cái',
        unitPrice: l.unitPrice.trim() || '0',
        promo: l.promo.trim() || '0',
        tax: l.tax.trim() || '0',
        amount: lineAmount(l).toLocaleString('vi-VN'),
      })),
    });
    showToast('success', `Đã tạo ${row.code}`);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Thêm Đơn đặt hàng mới"
      size="full"
      footer={(
        <div className="pur-po-create__footer">
          <div className="pur-po-create__sums">
            <span>Số lượng: <strong>{totals.qty}</strong></span>
            <span>Giá trị: <strong>{totals.value.toLocaleString('vi-VN')}</strong></span>
          </div>
          <div className="pur-po-create__tax-disc">
            <label>
              Thuế tổng
              <select
                value={form.taxTotal}
                onChange={e => setForm(p => ({ ...p, taxTotal: e.target.value }))}
              >
                {TAX_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <div className="pur-po-create__disc">
              <span>Chiết khấu</span>
              <label className="pur-po-create__radio">
                <input
                  type="radio"
                  name="po-disc"
                  checked={form.discountType === 'percent'}
                  onChange={() => setForm(p => ({ ...p, discountType: 'percent' }))}
                />
                %
              </label>
              <label className="pur-po-create__radio">
                <input
                  type="radio"
                  name="po-disc"
                  checked={form.discountType === 'amount'}
                  onChange={() => setForm(p => ({ ...p, discountType: 'amount' }))}
                />
                Tiền
              </label>
              <input
                value={form.discount}
                onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
              />
            </div>
          </div>
          <div className="pur-po-create__grand">
            <div>
              Thành tiền (VNĐ): <strong className="is-blue">{totals.total.toLocaleString('vi-VN')}</strong>
            </div>
            <div>
              Thành tiền (VNĐ): <strong className="is-red">{totals.total.toLocaleString('vi-VN')}</strong>
            </div>
          </div>
          <div className="pur-po-create__actions">
            <button type="button" className="pur-po-create__btn-back" onClick={onClose}>
              QUAY LẠI
            </button>
            <button type="submit" form="pur-create-order" className="pur-po-create__btn-save">
              LƯU LẠI
            </button>
          </div>
        </div>
      )}
    >
      <form id="pur-create-order" className="pur-po-create" onSubmit={onSubmit}>
        <div className="pur-po-create__meta">
          <label className="pur-po-create__field">
            <span>Loại đơn hàng</span>
            <select
              value={form.kind}
              onChange={e => setForm(p => ({ ...p, kind: e.target.value as OrderKind }))}
              disabled={Boolean(prefill?.requestId)}
            >
              <option value="standard">Trong nước</option>
              <option value="extra">Phát sinh (dự án)</option>
            </select>
          </label>
          <label className="pur-po-create__field">
            <span>Ngày dự kiến có hàng (EDD)</span>
            <HrmDatePicker value={form.eta} onChange={v => setForm(p => ({ ...p, eta: v }))} placeholder="dd/mm/yyyy" />
          </label>
          <label className="pur-po-create__field">
            <span>Số PO Nhà Cung Cấp</span>
            <input
              value={form.poNumber}
              onChange={e => setForm(p => ({ ...p, poNumber: e.target.value }))}
            />
          </label>
          <label className="pur-po-create__field">
            <span>Số Invoice</span>
            <input
              value={form.invoiceNo}
              onChange={e => setForm(p => ({ ...p, invoiceNo: e.target.value }))}
            />
          </label>
          <label className="pur-po-create__field pur-po-create__field--wide">
            <span>Lý do</span>
            <textarea
              rows={4}
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            />
          </label>
          <label className="pur-po-create__field">
            <span>Chi phí đóng gói</span>
            <input
              value={form.packCost}
              onChange={e => setForm(p => ({ ...p, packCost: e.target.value }))}
            />
          </label>
          <label className="pur-po-create__field">
            <span>Khoảng giảm trừ</span>
            <input
              value={form.deduction}
              onChange={e => setForm(p => ({ ...p, deduction: e.target.value }))}
            />
          </label>
          <label className="pur-po-create__field">
            <span>Dự án *</span>
            <input
              value={form.project}
              onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
              required
              readOnly={Boolean(prefill?.requestId)}
            />
          </label>
          <label className="pur-po-create__field">
            <span>Nhà cung cấp *</span>
            <input
              list="pur-po-create-suppliers"
              value={form.supplier}
              onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
              required
            />
            <datalist id="pur-po-create-suppliers">
              {suppliers.map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </label>
          <label className="pur-po-create__field">
            <span>Ngày chứng từ (POD) *</span>
            <HrmDatePicker
              value={form.orderedAt}
              onChange={v => setForm(p => ({ ...p, orderedAt: v }))}
              placeholder="dd/mm/yyyy"
            />
          </label>
        </div>

        {!prefill?.requestId && (
          <>
            <div className="pur-po-create__import">
              <button
                type="button"
                className="pur-po-create__btn-template"
                onClick={() => showToast('info', 'Tải mẫu import (UI demo).')}
              >
                TẢI MẪU IMPORT
              </button>
              <input
                ref={fileRef}
                type="file"
                className="pur-po-create__file"
                accept=".xlsx,.xls,.csv"
                onChange={() => showToast('info', 'Đã chọn file (UI demo).')}
              />
              <button
                type="button"
                className="pur-po-create__btn-import"
                onClick={() => {
                  if (!fileRef.current?.files?.length) {
                    fileRef.current?.click();
                    return;
                  }
                  showToast('info', 'Import mặt hàng (UI demo).');
                }}
              >
                IMPORT MẶT HÀNG
              </button>
            </div>

            <div className="pur-po-create__lines-head">
              <h3>Thông tin mặt hàng</h3>
              <button
                type="button"
                className="pur-po-create__btn-add"
                onClick={() => setLines(prev => [...prev, emptyLine()])}
              >
                <Plus size={14} aria-hidden />
                Thêm dòng
              </button>
            </div>

            <div className="pur-po-create__table-wrap">
              <table className="pur-po-create__table">
                <thead>
                  <tr>
                    <th>Hình</th>
                    <th>Tên hàng</th>
                    <th>Số lượng</th>
                    <th>Đơn vị tính</th>
                    <th>Đơn giá</th>
                    <th>Thuế</th>
                    <th>Khuyến Mãi</th>
                    <th>Thành Tiền</th>
                    <th>Ghi chú</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr
                      key={l.key}
                      className={dragIndex === i ? 'is-dragging' : undefined}
                      onDragOver={e => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === i) return;
                        moveLine(dragIndex, i);
                        setDragIndex(i);
                      }}
                    >
                      <td className="pur-po-create__td-img">
                        <div className="pur-po-create__img-cell">
                          <span
                            className="pur-po-create__grip"
                            title="Kéo để đổi thứ tự"
                            aria-label="Kéo để đổi thứ tự"
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.effectAllowed = 'move';
                              setDragIndex(i);
                            }}
                            onDragEnd={() => setDragIndex(null)}
                          >
                            <GripVertical size={14} aria-hidden />
                          </span>
                          <span className="pur-po-create__img-ph" aria-hidden>
                            <Camera size={16} />
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input"
                          placeholder="Không có mục nào được chọn"
                          value={l.itemName}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, itemName: e.target.value } : x)))}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input pur-po-create__input--num"
                          value={l.qty}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                        />
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input"
                          value={l.unit}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))}
                        />
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input pur-po-create__input--num"
                          value={l.unitPrice}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))}
                        />
                      </td>
                      <td>
                        <select
                          className="pur-po-create__input"
                          value={l.tax}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, tax: e.target.value } : x)))}
                        >
                          {TAX_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input pur-po-create__input--num"
                          value={l.promo}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, promo: e.target.value } : x)))}
                        />
                      </td>
                      <td className="pur-po-create__td-amount">
                        {lineAmount(l).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <input
                          className="pur-po-create__input pur-po-create__input--note"
                          value={l.note}
                          onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                        />
                      </td>
                      <td>
                        <div className="pur-po-create__row-acts">
                          <button
                            type="button"
                            className="pur-po-create__btn-move"
                            aria-label="Đưa dòng lên"
                            disabled={i === 0}
                            onClick={() => moveLine(i, i - 1)}
                          >
                            <ChevronUp size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="pur-po-create__btn-move"
                            aria-label="Đưa dòng xuống"
                            disabled={i >= lines.length - 1}
                            onClick={() => moveLine(i, i + 1)}
                          >
                            <ChevronDown size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="pur-po-create__btn-del"
                            aria-label="Xóa dòng"
                            disabled={lines.length <= 1}
                            onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
