import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import HrmTimeInput from '../hr/HrmTimeInput';
import { showToast } from '../ui/Toast';
import type { PurchasePlanRow } from '../../data/purchasingMock';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import {
  createYcmhFromPlans,
  nowDisplayDateTime,
  usePurchasingStore,
} from '../../lib/purchasing/purchasingStore';

interface LineDraft {
  planId: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  unit: string;
  stockQty: string;
  qty: string;
  note: string;
  remaining: number;
}

interface CreateYcmhFromPlansModalProps {
  open: boolean;
  planIds: string[];
  onClose: () => void;
  onCreated?: () => void;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function splitDisplayDateTime(value: string): { dateIso: string; time: string } {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/.exec(value.trim());
  if (!m) {
    const now = new Date();
    return {
      dateIso: toIsoDate(now),
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    };
  }
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const hh = m[4] != null ? pad2(Number(m[4])) : '00';
  const mm = m[5] != null ? pad2(Number(m[5])) : '00';
  return {
    dateIso: `${year}-${pad2(month)}-${pad2(day)}`,
    time: `${hh}:${mm}`,
  };
}

function joinDisplayDateTime(dateIso: string, time: string): string {
  const display = isoToDisplay(dateIso) || isoToDisplay(toIsoDate(new Date()));
  const raw = (time || '00:00').trim();
  const [h = '00', m = '00', s = '00'] = raw.split(':');
  return `${display} ${pad2(Number(h))}:${pad2(Number(m))}:${pad2(Number(s) || 0)}`;
}

function planUnit(plan: PurchasePlanRow): string {
  if (plan.scope === 'machine' || plan.itemType === 'Máy') return 'Máy';
  if (plan.itemType === 'Vật tư') return 'Cái';
  return 'Cái';
}

function planItemTypeLabel(plan: PurchasePlanRow): string {
  if (plan.category === 'Nhóm thành phẩm' || plan.scope === 'machine') return 'Thành phẩm';
  return plan.category || plan.itemType;
}

function toDraft(plan: PurchasePlanRow): LineDraft {
  return {
    planId: plan.id,
    itemCode: plan.itemCode,
    itemName: plan.item,
    itemType: planItemTypeLabel(plan),
    unit: planUnit(plan),
    stockQty: plan.stockQty,
    qty: '0',
    note: '',
    remaining: Math.max(0, Number(plan.remainingQty) || 0),
  };
}

/** Modal tạo YCMH từ kế hoạch — bám layout ERP THÊM YÊU CẦU MUA HÀNG. */
export default function CreateYcmhFromPlansModal({
  open,
  planIds,
  onClose,
  onCreated,
}: CreateYcmhFromPlansModalProps) {
  const { plans } = usePurchasingStore();
  const [dateIso, setDateIso] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [title, setTitle] = useState('Yêu cầu mua hàng (PR)');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'detail' | 'summary'>('detail');
  const [lines, setLines] = useState<LineDraft[]>([]);

  useEffect(() => {
    if (!open) return;
    const parts = splitDisplayDateTime(nowDisplayDateTime());
    setDateIso(parts.dateIso);
    setTimeValue(parts.time);
    setTitle('Yêu cầu mua hàng (PR)');
    setNote('');
    setTab('detail');
    const selected = planIds
      .map(id => plans.find(p => p.id === id))
      .filter((p): p is PurchasePlanRow => p != null && Number(p.remainingQty) > 0);
    setLines(selected.map(toDraft));
  }, [open, planIds, plans]);

  const summary = useMemo(() => {
    const map = new Map<string, { itemCode: string; itemName: string; itemType: string; unit: string; qty: number }>();
    for (const l of lines) {
      const key = l.itemCode || l.itemName;
      const prev = map.get(key);
      const qty = Number(l.qty) || 0;
      if (prev) prev.qty += qty;
      else map.set(key, { itemCode: l.itemCode, itemName: l.itemName, itemType: l.itemType, unit: l.unit, qty });
    }
    return [...map.values()];
  }, [lines]);

  const updateLine = (planId: string, patch: Partial<LineDraft>) => {
    setLines(prev => prev.map(l => (l.planId === planId ? { ...l, ...patch } : l)));
  };

  const removeLine = (planId: string) => {
    setLines(prev => prev.filter(l => l.planId !== planId));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dateIso) {
      showToast('warning', 'Chọn ngày chứng từ.');
      return;
    }
    if (lines.length === 0) {
      showToast('warning', 'Không còn mặt hàng nào trong phiếu.');
      return;
    }
    const payload = lines.map(l => ({
      planId: l.planId,
      qty: Number(l.qty) || 0,
      note: l.note,
    }));
    if (!payload.some(l => l.qty > 0)) {
      showToast('warning', 'Nhập số lượng cần mua cho ít nhất một dòng.');
      return;
    }
    const over = lines.find(l => (Number(l.qty) || 0) > l.remaining);
    if (over) {
      showToast('warning', `"${over.itemName}" vượt số còn lại (${over.remaining}).`);
      return;
    }

    const row = createYcmhFromPlans({
      title,
      note,
      createdAt: joinDisplayDateTime(dateIso, timeValue),
      lines: payload,
    });
    if (!row) {
      showToast('error', 'Không tạo được YCMH.');
      return;
    }
    showToast('success', `Đã lưu ${row.code}`);
    onCreated?.();
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Thêm yêu cầu mua hàng"
      size="full"
      footer={(
        <div className="md-dialog__footer-actions">
          <button type="button" className="btn btn-outlined" onClick={onClose}>Thoát</button>
          <button type="submit" form="pur-create-ycmh" className="btn btn-primary">Lưu lại</button>
        </div>
      )}
    >
      <form id="pur-create-ycmh" className="pur-ycmh modal-form-bordered" onSubmit={onSubmit}>
        <div className="pur-ycmh__meta">
          <label className="pur-erp__field">
            <span><span className="text-[var(--md-error)]">*</span> Ngày</span>
            <div className="pur-ycmh__datetime">
              <HrmDatePicker
                value={dateIso}
                onChange={setDateIso}
                placeholder="dd/mm/yyyy"
                className="pur-ycmh__date"
              />
              <HrmTimeInput
                value={timeValue}
                onChange={setTimeValue}
                className="pur-ycmh__time"
                placeholder="HH:mm"
              />
            </div>
          </label>
          <label className="pur-erp__field">
            <span>Tên phiếu yêu cầu</span>
            <input
              className="form-input form-input-md"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Tên phiếu yêu cầu"
            />
          </label>
          <label className="pur-erp__field">
            <span>Lý do</span>
            <textarea
              className="form-input form-input-md pur-ycmh__note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Lý do"
              rows={2}
            />
          </label>
        </div>

        <div className="pur-ycmh__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'detail'}
            className={`pur-ycmh__tab${tab === 'detail' ? ' is-active' : ''}`}
            onClick={() => setTab('detail')}
          >
            Chi tiết
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'summary'}
            className={`pur-ycmh__tab${tab === 'summary' ? ' is-active' : ''}`}
            onClick={() => setTab('summary')}
          >
            Tổng hợp
          </button>
        </div>

        {tab === 'detail' ? (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full border-collapse hrm-table pur-erp__table pur-ycmh__grid">
              <thead>
                <tr>
                  <th className="table-header-cell pur-ycmh__col-fit">STT</th>
                  <th className="table-header-cell pur-ycmh__col-item">Mã mặt hàng</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Loại</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Đơn vị</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Số lượng tồn kho</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Số lượng cần mua</th>
                  <th className="table-header-cell pur-ycmh__col-fit pur-ycmh__col-note">Ghi chú</th>
                  <th className="table-header-cell pur-ycmh__col-fit pur-ycmh__col-act">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-cell text-center text-[var(--md-on-surface-variant)]">
                      Không có mặt hàng.
                    </td>
                  </tr>
                ) : lines.map((l, i) => (
                  <tr key={l.planId} className="table-row">
                    <td className="table-cell pur-ycmh__col-fit">{i + 1}</td>
                    <td className="table-cell pur-ycmh__col-item">
                      <div className="font-medium">{l.itemName}</div>
                      <div className="text-xs text-[var(--md-on-surface-variant)]">{l.itemCode}</div>
                    </td>
                    <td className="table-cell pur-ycmh__col-fit">
                      <span className="pur-ycmh__type">{l.itemType}</span>
                    </td>
                    <td className="table-cell pur-ycmh__col-fit">{l.unit}</td>
                    <td className="table-cell pur-ycmh__col-fit font-mono">{l.stockQty}</td>
                    <td className="table-cell pur-ycmh__col-fit pur-ycmh__cell-qty">
                      <input
                        type="text"
                        className="pur-ycmh__qty"
                        inputMode="numeric"
                        autoComplete="off"
                        value={l.qty}
                        onChange={e => updateLine(l.planId, { qty: e.target.value.replace(/[^\d.]/g, '') })}
                        aria-label={`Số lượng cần mua ${l.itemName}`}
                      />
                    </td>
                    <td className="table-cell pur-ycmh__col-fit pur-ycmh__cell-note">
                      <textarea
                        className="pur-ycmh__line-note"
                        rows={1}
                        value={l.note}
                        onChange={e => updateLine(l.planId, { note: e.target.value })}
                        aria-label={`Ghi chú ${l.itemName}`}
                      />
                    </td>
                    <td className="table-cell pur-ycmh__col-fit pur-ycmh__col-act">
                      <button
                        type="button"
                        className="pur-ycmh__remove"
                        aria-label={`Xóa ${l.itemName}`}
                        onClick={() => removeLine(l.planId)}
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full border-collapse hrm-table pur-erp__table pur-ycmh__grid">
              <thead>
                <tr>
                  <th className="table-header-cell pur-ycmh__col-fit">STT</th>
                  <th className="table-header-cell pur-ycmh__col-item">Mã mặt hàng</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Loại</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Đơn vị</th>
                  <th className="table-header-cell pur-ycmh__col-fit">Số lượng cần mua</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((l, i) => (
                  <tr key={`${l.itemCode}-${i}`} className="table-row">
                    <td className="table-cell pur-ycmh__col-fit">{i + 1}</td>
                    <td className="table-cell pur-ycmh__col-item">
                      <div className="font-medium">{l.itemName}</div>
                      <div className="text-xs text-[var(--md-on-surface-variant)]">{l.itemCode}</div>
                    </td>
                    <td className="table-cell pur-ycmh__col-fit"><span className="pur-ycmh__type">{l.itemType}</span></td>
                    <td className="table-cell pur-ycmh__col-fit">{l.unit}</td>
                    <td className="table-cell pur-ycmh__col-fit font-mono">{l.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </Modal>
  );
}
