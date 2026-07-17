import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Camera, Pencil, Plus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import { updateOrder, usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import type { PurchaseOrderLine, PurchaseOrderRow } from '../../data/purchasingMock';
import { isoToDisplay, parseDisplayDate, toIsoDate } from '../../lib/dates';
import { showToast } from '../ui/Toast';

interface EditOrderModalProps {
  order: PurchaseOrderRow | null;
  onClose: () => void;
}

interface LineDraft {
  key: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  qty: string;
  unit: string;
  unitPrice: string;
  tax: string;
  promo: string;
  note: string;
}

const TAX_OPTIONS = [
  { value: '0', label: 'Miễn thuế' },
  { value: '5', label: '5%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
];

function parseNum(v: string): number {
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0;
}

function toPickerIso(displayOrIso: string): string {
  const raw = displayOrIso.trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = parseDisplayDate(raw);
  return d ? toIsoDate(d) : '';
}

function lineFromOrder(l: PurchaseOrderLine): LineDraft {
  return {
    key: l.id,
    itemCode: l.itemCode,
    itemName: l.itemName,
    itemType: 'Thành phẩm',
    qty: l.qty,
    unit: l.unit || 'Máy',
    unitPrice: l.unitPrice,
    tax: l.tax || '0',
    promo: l.promo || '0',
    note: '',
  };
}

function emptyLine(): LineDraft {
  return {
    key: `l-${Date.now()}-${Math.random()}`,
    itemCode: '',
    itemName: '',
    itemType: 'Thành phẩm',
    qty: '1',
    unit: 'Máy',
    unitPrice: '0',
    tax: '0',
    promo: '0',
    note: '',
  };
}

function itemLabel(l: LineDraft): string {
  if (!l.itemCode.trim() && !l.itemName.trim()) return '';
  const code = l.itemCode.trim() || '—';
  const name = l.itemName.trim() || '—';
  return `[${code}] ${name}`;
}

/** Modal ERP: Sửa phiếu PO ≈ /admin/purchase_order/purchases_detail */
export default function EditOrderModal({ order, onClose }: EditOrderModalProps) {
  const { suppliers } = usePurchasingStore();
  const open = Boolean(order);
  const [tab, setTab] = useState<'main' | 'detail'>('main');
  const [supplier, setSupplier] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [orderKindLabel, setOrderKindLabel] = useState('Trong nước');
  const [orderType, setOrderType] = useState('');
  const [buyCompany, setBuyCompany] = useState('');
  const [orderedAt, setOrderedAt] = useState('');
  const [eta, setEta] = useState('');
  const [note, setNote] = useState('');
  const [packCost, setPackCost] = useState('0');
  const [deduction, setDeduction] = useState('0');
  const [poNumber, setPoNumber] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [taxTotal, setTaxTotal] = useState('0');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discount, setDiscount] = useState('0');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [filterProduct, setFilterProduct] = useState('');
  const [quickItem, setQuickItem] = useState('');

  useEffect(() => {
    if (!order) return;
    setTab('main');
    setSupplier(order.supplier);
    setCurrency(order.currency || 'VNĐ');
    setOrderKindLabel(order.channel === 'international' ? 'Ngoài nước' : 'Trong nước');
    setOrderType(order.project || '');
    setBuyCompany(order.buyCompany || '');
    setOrderedAt(toPickerIso(order.orderedAt));
    setEta(toPickerIso(order.eta));
    setNote(order.note || '');
    setPackCost('0');
    setDeduction('0');
    setPoNumber(order.poNumber || '');
    setInvoiceNo(order.invoiceNo || '');
    setTaxTotal('0');
    setDiscountType('percent');
    setDiscount('0');
    setLines(order.lines.length > 0 ? order.lines.map(lineFromOrder) : [emptyLine()]);
    setFilterProduct('');
    setQuickItem('');
  }, [order]);

  const lineAmount = (l: LineDraft) => {
    const qty = parseNum(l.qty);
    const price = parseNum(l.unitPrice);
    const promo = parseNum(l.promo);
    return Math.max(0, qty * price - promo);
  };

  const totals = useMemo(() => {
    const qty = lines.reduce((s, l) => s + parseNum(l.qty), 0);
    const value = lines.reduce((s, l) => s + lineAmount(l), 0);
    const pack = parseNum(packCost);
    const ded = parseNum(deduction);
    const disc = discountType === 'percent'
      ? (value * parseNum(discount)) / 100
      : parseNum(discount);
    const total = Math.max(0, value + pack - ded - disc);
    return { qty, value, total };
  }, [lines, packCost, deduction, discount, discountType]);

  const approved = Boolean(order?.approvedBy?.trim());
  const supplierOptions = useMemo(
    () => [...new Set([...(suppliers.map(s => s.name)), supplier].filter(Boolean))].sort(),
    [suppliers, supplier],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!supplier.trim() || !orderedAt || !eta) {
      showToast('warning', 'Nhập đủ NCC, ngày đặt hàng và ECD.');
      return;
    }
    if (lines.some(l => !l.itemName.trim())) {
      showToast('warning', 'Mỗi dòng hàng cần tên hàng.');
      return;
    }

    const nextLines: PurchaseOrderLine[] = lines.map((l, i) => ({
      id: l.key.startsWith('l-') ? `ol-${order.id}-${i}` : l.key,
      itemCode: l.itemCode.trim() || '—',
      itemName: l.itemName.trim(),
      qty: l.qty.trim() || '1',
      unit: l.unit.trim() || 'Cái',
      unitPrice: l.unitPrice.trim() || '0',
      promo: l.promo.trim() || '0',
      tax: l.tax.trim() || '0',
      amount: lineAmount(l).toLocaleString('vi-VN'),
    }));

    const amountStr = totals.total.toLocaleString('vi-VN');
    const saved = updateOrder(order.id, {
      supplier: supplier.trim(),
      orderedAt: isoToDisplay(orderedAt),
      eta: isoToDisplay(eta),
      etw: isoToDisplay(eta),
      poNumber,
      invoiceNo,
      buyCompany,
      currency,
      note,
      amount: amountStr,
      amountForeign: currency !== 'VNĐ' ? amountStr : order.amountForeign,
      lines: nextLines,
    });
    if (!saved) {
      showToast('error', 'Không lưu được phiếu.');
      return;
    }
    showToast('success', `Đã lưu ${saved.code}`);
    onClose();
  };

  if (!open || !order) return null;

  const linesEditor = (
    <div className="pur-po-edit__detail">
      <div className="pur-po-edit__table-wrap">
        <table className="pur-po-edit__table">
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
              <tr key={l.key}>
                <td className="pur-po-edit__td-img">
                  <div className="pur-po-edit__img-stack">
                    <span className="pur-po-edit__img-ph" aria-hidden>
                      <Camera size={18} />
                    </span>
                    <span className="pur-po-edit__badge">{l.itemType || 'Thành phẩm'}</span>
                  </div>
                </td>
                <td className="pur-po-edit__td-item">
                  <select
                    className="pur-po-edit__input pur-po-edit__input--item"
                    value={l.itemCode || l.itemName ? l.key : ''}
                    onChange={e => {
                      if (!e.target.value) {
                        setLines(prev => prev.map((x, j) => (
                          j === i ? { ...x, itemCode: '', itemName: '' } : x
                        )));
                      }
                    }}
                    aria-label="Tên hàng"
                  >
                    <option value="">Không có mục nào được chọn</option>
                    {(l.itemCode || l.itemName) ? (
                      <option value={l.key}>{itemLabel(l)}</option>
                    ) : null}
                  </select>
                </td>
                <td className="pur-po-edit__td-num">
                  <input
                    className="pur-po-edit__input pur-po-edit__input--uline"
                    value={l.qty}
                    onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                  />
                </td>
                <td className="pur-po-edit__td-unit">{l.unit || '—'}</td>
                <td className="pur-po-edit__td-num">
                  <input
                    className="pur-po-edit__input pur-po-edit__input--uline"
                    value={l.unitPrice}
                    onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))}
                  />
                </td>
                <td className="pur-po-edit__td-tax">
                  <select
                    className="pur-po-edit__input"
                    value={l.tax}
                    onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, tax: e.target.value } : x)))}
                  >
                    {TAX_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td className="pur-po-edit__td-num">
                  <input
                    className="pur-po-edit__input pur-po-edit__input--uline"
                    value={l.promo}
                    onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, promo: e.target.value } : x)))}
                  />
                </td>
                <td className="pur-po-edit__td-amount">
                  {lineAmount(l).toLocaleString('vi-VN')}
                </td>
                <td className="pur-po-edit__td-note">
                  <textarea
                    className="pur-po-edit__input pur-po-edit__input--note"
                    rows={2}
                    value={l.note}
                    onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                  />
                </td>
                <td className="pur-po-edit__td-act">
                  <button
                    type="button"
                    className="pur-po-edit__btn-del"
                    aria-label="Xóa dòng"
                    disabled={lines.length <= 1}
                    onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pur-po-edit__detail-tools">
        <button
          type="button"
          className="pur-po-edit__btn-add"
          onClick={() => setLines(prev => [...prev, emptyLine()])}
        >
          <Plus size={14} aria-hidden />
          Thêm dòng
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Thông tin đơn đặt hàng PO"
      size="full"
      footer={(
        <div className="pur-po-edit__footer">
          <div className="pur-po-edit__bar" role="group" aria-label="Tổng hợp phiếu">
            <div className="pur-po-edit__cell-box pur-po-edit__cell-box--sums">
              <div className="pur-po-edit__kv">
                <span>Số lượng:</span>
                <strong>{totals.qty}</strong>
              </div>
              <div className="pur-po-edit__kv">
                <span>Giá trị:</span>
                <strong>{totals.value.toLocaleString('vi-VN')}</strong>
              </div>
            </div>
            <div className="pur-po-edit__cell-box pur-po-edit__cell-box--tax">
              <span className="pur-po-edit__box-label">Thuế tổng:</span>
              <select value={taxTotal} onChange={e => setTaxTotal(e.target.value)}>
                {TAX_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="pur-po-edit__cell-box pur-po-edit__cell-box--disc">
              <div className="pur-po-edit__disc-radios" role="radiogroup" aria-label="Loại chiết khấu">
                <label className="pur-po-edit__radio">
                  <input
                    type="radio"
                    name="po-edit-disc"
                    checked={discountType === 'percent'}
                    onChange={() => setDiscountType('percent')}
                  />
                  <span>%</span>
                </label>
                <label className="pur-po-edit__radio">
                  <input
                    type="radio"
                    name="po-edit-disc"
                    checked={discountType === 'amount'}
                    onChange={() => setDiscountType('amount')}
                  />
                  <span>Tiền</span>
                </label>
              </div>
              <label className="pur-po-edit__disc-field">
                <span>Chiết khấu:</span>
                <input value={discount} onChange={e => setDiscount(e.target.value)} />
              </label>
            </div>
            <div className="pur-po-edit__cell-box pur-po-edit__cell-box--grand">
              <div className="pur-po-edit__kv is-blue">
                <span>Thành tiền ({currency}):</span>
                <strong>{totals.total.toLocaleString('vi-VN')}</strong>
              </div>
              <div className="pur-po-edit__kv is-red">
                <span>Thành tiền (VNĐ):</span>
                <strong>{totals.total.toLocaleString('vi-VN')}</strong>
              </div>
            </div>
          </div>
          <div className="pur-po-edit__actions">
            <button type="submit" form="pur-edit-order" className="pur-po-edit__btn-save">
              LƯU LẠI
            </button>
          </div>
        </div>
      )}
    >
      <form id="pur-edit-order" className="pur-po-edit" onSubmit={onSubmit}>
        <div className={`pur-po-edit__ribbon${approved ? ' is-approved' : ''}`}>
          {approved ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'}
        </div>

        <div className="pur-po-edit__section-head">Thông tin chung</div>

        {order.requestCode ? (
          <p className="pur-po-edit__ycmh">
            Từ YCMH : <a href={`#${order.requestCode}`} onClick={e => e.preventDefault()}>{order.requestCode}</a>
          </p>
        ) : null}

        <div className="pur-po-edit__tabs" role="tablist" aria-label="Sửa PO">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'main'}
            className={`pur-po-edit__tab${tab === 'main' ? ' is-active' : ''}`}
            onClick={() => setTab('main')}
          >
            Thông tin chính
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'detail'}
            className={`pur-po-edit__tab${tab === 'detail' ? ' is-active' : ''}`}
            onClick={() => setTab('detail')}
          >
            Chi tiết
          </button>
        </div>

        {tab === 'main' ? (
          <>
            <table className="pur-po-edit__form">
              <colgroup>
                <col className="pur-po-edit__col-label" />
                <col className="pur-po-edit__col-field" />
                <col className="pur-po-edit__col-label" />
                <col className="pur-po-edit__col-field" />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row"><span className="is-req">*</span>Mã chứng từ</th>
                  <td>
                    <input value={order.code} readOnly className="is-readonly" />
                  </td>
                  <th scope="row"><span className="is-req">*</span>Ngày đặt hàng (POD)</th>
                  <td>
                    <HrmDatePicker value={orderedAt} onChange={setOrderedAt} placeholder="dd/mm/yyyy" />
                  </td>
                </tr>
                <tr>
                  <th scope="row"><span className="is-req">*</span>Nhà cung cấp</th>
                  <td>
                    <div className="pur-po-edit__with-btn">
                      <select value={supplier} onChange={e => setSupplier(e.target.value)} required>
                        <option value="">Chọn NCC</option>
                        {supplierOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button type="button" className="pur-po-edit__plus" aria-label="Thêm NCC" onClick={() => showToast('info', 'Thêm NCC (UI demo).')}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <th scope="row"><span className="is-req">*</span>Loại</th>
                  <td>
                    <input value={orderType} onChange={e => setOrderType(e.target.value)} placeholder="Loại / nhóm" />
                  </td>
                </tr>
                <tr>
                  <th scope="row">Đơn vị tiền tệ</th>
                  <td>
                    <div className="pur-po-edit__with-btn">
                      <select value={currency} onChange={e => setCurrency(e.target.value)}>
                        <option value="">Đơn vị tiền tệ</option>
                        <option value="VNĐ">VNĐ</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <button type="button" className="pur-po-edit__plus" aria-label="Sửa tiền tệ" onClick={() => showToast('info', 'Sửa tiền tệ (UI demo).')}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                  <th scope="row">Công ty đại diện đặt hàng</th>
                  <td>
                    <input value={buyCompany} onChange={e => setBuyCompany(e.target.value)} />
                  </td>
                </tr>
                <tr>
                  <th scope="row">Loại đơn hàng</th>
                  <td>
                    <select value={orderKindLabel} onChange={e => setOrderKindLabel(e.target.value)}>
                      <option value="Trong nước">Trong nước</option>
                      <option value="Ngoài nước">Ngoài nước</option>
                    </select>
                  </td>
                  <th scope="row"><span className="is-req">*</span>Ngày dự kiến có hàng (ECD)</th>
                  <td>
                    <HrmDatePicker value={eta} onChange={setEta} placeholder="dd/mm/yyyy" />
                  </td>
                </tr>
                <tr>
                  <th scope="row" rowSpan={2}>Lý do</th>
                  <td rowSpan={2} className="pur-po-edit__form-reason">
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} />
                  </td>
                  <th scope="row">Chi phí giao hàng</th>
                  <td>
                    <input value={packCost} onChange={e => setPackCost(e.target.value)} inputMode="decimal" />
                  </td>
                </tr>
                <tr>
                  <th scope="row">Khoảng giảm trừ</th>
                  <td>
                    <input value={deduction} onChange={e => setDeduction(e.target.value)} inputMode="decimal" />
                  </td>
                </tr>
                <tr>
                  <th scope="row">Số PO NCC</th>
                  <td>
                    <input value={poNumber} onChange={e => setPoNumber(e.target.value)} />
                  </td>
                  <th scope="row">Invoice</th>
                  <td>
                    <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="pur-po-edit__load-row">
              <label className="pur-po-edit__load-field">
                <span>Chọn thành phẩm để lọc mặt hàng</span>
                <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                  <option value="">Nothing selected</option>
                  {lines.map(l => (
                    <option key={`fp-${l.key}`} value={l.itemCode || l.itemName}>
                      {l.itemCode || l.itemName || '—'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pur-po-edit__load-field">
                <span>Chọn nhanh mặt hàng</span>
                <select value={quickItem} onChange={e => setQuickItem(e.target.value)}>
                  <option value="">Nothing selected</option>
                  {lines.map(l => (
                    <option key={`qi-${l.key}`} value={l.key}>{l.itemName || l.itemCode || '—'}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="pur-po-edit__btn-load"
                onClick={() => showToast('info', 'Load dữ liệu (UI demo).')}
              >
                LOAD DỮ LIỆU
              </button>
            </div>

            <div className="pur-po-edit__section-head pur-po-edit__section-head--sub">Thông tin mặt hàng</div>
            {linesEditor}
          </>
        ) : (
          linesEditor
        )}
      </form>
    </Modal>
  );
}
