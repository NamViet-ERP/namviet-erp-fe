import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import HrmTimeInput from '../hr/HrmTimeInput';
import { showToast } from '../ui/Toast';
import type { PurchasePlanRow, PurchaseRequestRow } from '../../data/purchasingMock';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { updateYcmhRequest, usePurchasingStore } from '../../lib/purchasing/purchasingStore';

interface LineDraft {
  id: string;
  planId: string | null;
  planCode: string | null;
  itemCode: string;
  itemName: string;
  itemType: string;
  unit: string;
  stockQty: string;
  qty: string;
  note: string;
  orderStatus: string;
  /** Tick Hủy — ERP cancel[]; chỉ bỏ dòng khi Lưu lại */
  cancelled: boolean;
}

interface EditYcmhModalProps {
  open: boolean;
  request: PurchaseRequestRow | null;
  onClose: () => void;
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
  return {
    dateIso: `${m[3]}-${pad2(Number(m[2]))}-${pad2(Number(m[1]))}`,
    time: `${pad2(Number(m[4] ?? 0))}:${pad2(Number(m[5] ?? 0))}`,
  };
}

function joinDisplayDateTime(dateIso: string, time: string): string {
  const display = isoToDisplay(dateIso) || isoToDisplay(toIsoDate(new Date()));
  const raw = (time || '00:00').trim();
  const [h = '00', m = '00', s = '00'] = raw.split(':');
  return `${display} ${pad2(Number(h))}:${pad2(Number(m))}:${pad2(Number(s) || 0)}`;
}

function planToLine(plan: PurchasePlanRow): LineDraft {
  return {
    id: `new-${plan.id}-${Date.now()}`,
    planId: plan.id,
    planCode: plan.code,
    itemCode: plan.itemCode,
    itemName: plan.item,
    itemType: plan.category === 'Nhóm thành phẩm' || plan.scope === 'machine' ? 'Thành phẩm' : (plan.category || plan.itemType),
    unit: plan.scope === 'machine' || plan.itemType === 'Máy' ? 'Máy' : 'Cái',
    stockQty: plan.stockQty,
    qty: '0',
    note: '',
    orderStatus: 'Chưa đặt hàng',
    cancelled: false,
  };
}

/** Modal cập nhật YCMH — ERP editPurchase / CẬP NHẬT YÊU CẦU MUA HÀNG. */
export default function EditYcmhModal({ open, request, onClose }: EditYcmhModalProps) {
  const { plans } = usePurchasingStore();
  const [dateIso, setDateIso] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'detail' | 'summary'>('detail');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [addPlanId, setAddPlanId] = useState('');

  useEffect(() => {
    if (!open || !request) return;
    const parts = splitDisplayDateTime(request.createdAt);
    setDateIso(parts.dateIso);
    setTimeValue(parts.time);
    setTitle(request.title || 'Yêu cầu mua hàng (PR)');
    setNote(request.note || '');
    setTab('detail');
    setAddPlanId('');
    setLines(request.lines.map(l => ({
      id: l.id,
      planId: l.planId,
      planCode: l.planCode,
      itemCode: l.itemCode,
      itemName: l.itemName,
      itemType: l.itemType,
      unit: l.unit,
      stockQty: l.stockQty,
      qty: String(l.qty),
      note: l.note,
      orderStatus: request.orderId ? (request.orderStatusLabel || 'Đặt hàng đủ') : 'Chưa đặt hàng',
      cancelled: false,
    })));
  }, [open, request]);

  const usedCodes = useMemo(() => new Set(lines.map(l => l.itemCode)), [lines]);
  const addableMachines = useMemo(
    () => plans.filter(p => p.scope === 'machine' && !usedCodes.has(p.itemCode)),
    [plans, usedCodes],
  );

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

  const updateLine = (id: string, patch: Partial<LineDraft>) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const toggleCancel = (id: string, cancelled: boolean) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, cancelled } : l)));
  };

  const onAddMachine = (planId: string) => {
    setAddPlanId(planId);
    if (!planId) return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (usedCodes.has(plan.itemCode)) {
      showToast('warning', 'Mặt hàng đã có trong phiếu.');
      setAddPlanId('');
      return;
    }
    setLines(prev => [...prev, planToLine(plan)]);
    setAddPlanId('');
    showToast('success', `Đã thêm ${plan.item}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!request) return;
    if (!dateIso) {
      showToast('warning', 'Chọn ngày chứng từ.');
      return;
    }
    if (lines.length === 0) {
      showToast('warning', 'Không còn mặt hàng nào trong phiếu.');
      return;
    }
    const payload = lines
      .filter(l => !l.cancelled)
      .map(l => ({
      id: l.id,
      qty: Number(l.qty) || 0,
      note: l.note,
      planId: l.planId,
      planCode: l.planCode,
      itemCode: l.itemCode,
      itemName: l.itemName,
      itemType: l.itemType,
      unit: l.unit,
      stockQty: l.stockQty,
    }));
    if (payload.length === 0) {
      showToast('warning', 'Không còn mặt hàng nào sau khi hủy. Bỏ tick Hủy hoặc thêm máy.');
      return;
    }
    if (!payload.some(l => l.qty > 0)) {
      showToast('warning', 'Nhập số lượng cần mua cho ít nhất một dòng.');
      return;
    }

    const row = updateYcmhRequest(request.id, {
      title,
      note,
      createdAt: joinDisplayDateTime(dateIso, timeValue),
      lines: payload,
    });
    if (!row) {
      showToast('error', 'Không lưu được YCMH.');
      return;
    }
    showToast('success', `Đã cập nhật ${row.code}`);
    onClose();
  };

  return (
    <Modal
      isOpen={open && Boolean(request)}
      onClose={onClose}
      title="Cập nhật yêu cầu mua hàng"
      size="full"
      footer={(
        <div className="md-dialog__footer-actions">
          <button type="button" className="btn btn-outlined" onClick={onClose}>Thoát</button>
          <button type="submit" form="pur-edit-ycmh" className="btn btn-primary">Lưu lại</button>
        </div>
      )}
    >
      {!request ? null : (
        <form id="pur-edit-ycmh" className="pur-ycmh modal-form-bordered" onSubmit={onSubmit}>
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
            <>
              <div className="pur-ycmh__add-machine">
                <span className="pur-ycmh__add-machine-label">Bổ sung thêm máy</span>
                <select
                  className="pur-ycmh__add-machine-select"
                  value={addPlanId}
                  onChange={e => onAddMachine(e.target.value)}
                  aria-label="Bổ sung thêm máy"
                >
                  <option value="">Thành phẩm</option>
                  {addableMachines.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.itemCode} — {p.item}
                    </option>
                  ))}
                </select>
              </div>

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
                      <th className="table-header-cell pur-ycmh__col-fit">Trạng thái đặt hàng</th>
                      <th className="table-header-cell pur-ycmh__col-fit pur-ycmh__col-note">Ghi chú</th>
                      <th className="table-header-cell pur-ycmh__col-fit pur-ycmh__col-act">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="table-cell text-center text-[var(--md-on-surface-variant)]">
                          Không có mặt hàng.
                        </td>
                      </tr>
                    ) : lines.map((l, i) => (
                      <tr key={l.id} className={`table-row${l.cancelled ? ' is-cancelled' : ''}`}>
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
                            disabled={l.cancelled}
                            onChange={e => updateLine(l.id, { qty: e.target.value.replace(/[^\d.]/g, '') })}
                            aria-label={`Số lượng cần mua ${l.itemName}`}
                          />
                        </td>
                        <td className="table-cell pur-ycmh__col-fit">
                          <span className="pur-ycmh__order-status">{l.orderStatus}</span>
                        </td>
                        <td className="table-cell pur-ycmh__col-fit pur-ycmh__cell-note">
                          <textarea
                            className="pur-ycmh__line-note"
                            rows={1}
                            value={l.note}
                            disabled={l.cancelled}
                            onChange={e => updateLine(l.id, { note: e.target.value })}
                            aria-label={`Ghi chú ${l.itemName}`}
                          />
                        </td>
                        <td className="table-cell pur-ycmh__col-fit pur-ycmh__col-act">
                          <label className="pur-ycmh__huy">
                            <input
                              type="checkbox"
                              className="pur-ycmh__huy-check"
                              checked={l.cancelled}
                              onChange={e => toggleCancel(l.id, e.target.checked)}
                            />
                            <span>Hủy</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
      )}
    </Modal>
  );
}
