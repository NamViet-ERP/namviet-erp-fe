import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Folder,
  History,
  ImageIcon,
  Info,
  MessageSquare,
  Search,
  User,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import type { PurchaseOrderRow } from '../../data/purchasingMock';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrderRow | null;
  onClose: () => void;
}

type PoViewTab = 'summary' | 'payments' | 'feedback' | 'files' | 'activity';

const TABS: { id: PoViewTab; label: string; Icon: typeof Info }[] = [
  { id: 'summary', label: 'Tổng hợp đặt hàng', Icon: Info },
  { id: 'payments', label: 'Lịch sử chi', Icon: Info },
  { id: 'feedback', label: 'FeedBack', Icon: MessageSquare },
  { id: 'files', label: 'Tập tin', Icon: Folder },
  { id: 'activity', label: 'Lịch sử hoạt động', Icon: History },
];

function payLabel(status: PurchaseOrderRow['payStatus']): string {
  if (status === 'paid') return 'Đã chi';
  if (status === 'partial') return 'Chi 1 phần';
  return 'Chưa chi';
}

function approveLabel(order: PurchaseOrderRow): string {
  return order.approvedBy?.trim() ? 'Đã duyệt' : 'Chưa duyệt';
}

function sumQty(lines: PurchaseOrderRow['lines']): string {
  const n = lines.reduce((acc, l) => acc + (Number(String(l.qty).replace(/[^\d.-]/g, '')) || 0), 0);
  return n ? String(n) : '';
}

/** Modal ERP: THÔNG TIN ĐƠN ĐẶT HÀNG PO — click mã chứng từ. */
export default function PurchaseOrderDetailModal({ order, onClose }: PurchaseOrderDetailModalProps) {
  const { payments } = usePurchasingStore();
  const [tab, setTab] = useState<PoViewTab>('summary');
  const [lineSearch, setLineSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [feedbackText, setFeedbackText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!order) return;
    setTab('summary');
    setLineSearch('');
    setPageSize(10);
    setPage(1);
    setFeedbackText('');
  }, [order]);

  const lines = useMemo(() => {
    if (!order) return [];
    const q = lineSearch.trim().toLowerCase();
    if (!q) return order.lines;
    return order.lines.filter(l =>
      `${l.itemCode} ${l.itemName}`.toLowerCase().includes(q),
    );
  }, [order, lineSearch]);

  const payRows = useMemo(() => {
    if (!order) return [];
    return payments.filter(p => p.poId === order.id || p.poCode === order.code);
  }, [order, payments]);

  const totalPages = Math.max(1, Math.ceil(lines.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageLines = lines.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = lines.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, lines.length);
  const totalAmount = order?.amountForeign || order?.amount || '0';
  const totalVnd = order?.amount || '0';

  if (!order) return null;

  const ycmhCount = order.requestCode ? 1 : 0;
  const orderType =
    order.kind === 'extra' ? 'Phát sinh' : order.channel === 'domestic' ? 'TN' : 'NN';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="THÔNG TIN ĐƠN ĐẶT HÀNG PO"
      size="full"
      footer={(
        <div className="pur-po-view__footer">
          <button type="button" className="pur-po-view__exit" onClick={onClose}>
            THOÁT
          </button>
        </div>
      )}
    >
      <div className="pur-po-view">
        <section className="pur-po-view__info">
          <div className="pur-po-view__info-top">
            <span className="pur-po-view__section-label">Thông tin</span>
            <span
              className={`pur-po-view__approve${order.approvedBy ? ' is-approved' : ''}`}
              data-tip={order.approvedAt?.trim() ? `Vào lúc: ${order.approvedAt.trim()}` : undefined}
              tabIndex={order.approvedAt?.trim() ? 0 : undefined}
            >
              <CheckCircle2 size={14} aria-hidden />
              {approveLabel(order)}
            </span>
          </div>

          <div className="pur-po-view__info-grid">
            <div className="pur-po-view__info-col">
              {order.requestCode ? (
                <a className="pur-po-view__ycmh" href={`#${order.requestCode}`} onClick={e => e.preventDefault()}>
                  {ycmhCount} YCMH :{order.requestCode}
                </a>
              ) : (
                <span className="pur-po-view__ycmh pur-po-view__ycmh--empty">0 YCMH</span>
              )}
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Mã chứng từ :</span>{' '}
                <strong>{order.code}</strong>
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Ngày chứng từ :</span> {order.orderedAt || '—'}
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Công ty đại diện đặt hàng :</span>{' '}
                {order.buyCompany || '—'}
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Nhà cung cấp :</span> {order.supplier || '—'}
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Loại :</span> {orderType}
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Lý do :</span> {order.note || ''}
              </p>
            </div>

            <div className="pur-po-view__info-col">
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Ngày dự kiến có hàng (ECD) :</span>{' '}
                <span className="pur-po-view__date-red">{order.eta || ''}</span>
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Ngày tàu khởi hành (ETD) :</span>{' '}
                <span className="pur-po-view__date-red">{order.etd || ''}</span>
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Ngày tàu cập cảng (ETA) :</span>{' '}
                <span className="pur-po-view__date-red">{order.etaPort || ''}</span>
              </p>
              <p className="pur-po-view__field">
                <span className="pur-po-view__k">Ngày hàng về kho (ETW) :</span>{' '}
                <span className="pur-po-view__date-red">{order.etw || ''}</span>
              </p>
              <p className="pur-po-view__field pur-po-view__field--user">
                <span className="pur-po-view__k">Người lập phiếu :</span>
                <span className="pur-po-view__user">
                  <span className="pur-po-view__avatar" aria-hidden>
                    <User size={12} />
                  </span>
                  —
                </span>
              </p>
              <p className="pur-po-view__field pur-po-view__field--pay">
                <span className="pur-po-view__k">Trạng thái chi :</span>
                <span className={`pur-po-view__pay pur-po-view__pay--${order.payStatus}`}>
                  {payLabel(order.payStatus)}
                </span>
              </p>
            </div>
          </div>
        </section>

        <div className="pur-po-view__tabs" role="tablist" aria-label="Chi tiết PO">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`pur-po-view__tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.Icon size={14} aria-hidden />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'summary' && (
          <div className="pur-po-view__summary">
            <div className="pur-po-view__tools">
              <select
                className="pur-po-view__page-size"
                value={pageSize}
                aria-label="Số dòng mỗi trang"
                onChange={e => {
                  setPageSize(Number(e.target.value) || 10);
                  setPage(1);
                }}
              >
                {[10, 15, 25, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="pur-po-view__search">
                <Search size={14} aria-hidden />
                <input
                  type="search"
                  placeholder="Tìm kiếm"
                  value={lineSearch}
                  onChange={e => {
                    setLineSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="pur-po-view__table-wrap">
              <table className="pur-po-view__table">
                <thead>
                  <tr>
                    <th className="pur-po-view__th-img">Hình</th>
                    <th>Tên hàng</th>
                    <th>Số lượng</th>
                    <th>Đơn vị tính</th>
                    <th>Đơn giá</th>
                    <th>Khuyến Mãi</th>
                    <th>Thuế</th>
                    <th>Thành Tiền</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLines.map(l => (
                    <tr key={l.id}>
                      <td className="pur-po-view__td-img">
                        <span className="pur-po-view__img-ph" aria-hidden>
                          <ImageIcon size={18} />
                        </span>
                      </td>
                      <td className="pur-po-view__td-name">{l.itemName}</td>
                      <td className="pur-po-view__td-num">{l.qty}</td>
                      <td className="pur-po-view__td-center">{l.unit || 'Cái'}</td>
                      <td className="pur-po-view__td-num">{l.unitPrice}</td>
                      <td className="pur-po-view__td-num">{l.promo || '0'}</td>
                      <td className="pur-po-view__td-center">{l.tax ? `${l.tax} %` : '0 %'}</td>
                      <td className="pur-po-view__td-num">{l.amount}</td>
                      <td />
                    </tr>
                  ))}
                  {pageLines.length === 0 && (
                    <tr>
                      <td colSpan={9} className="pur-po-view__empty">Không có mặt hàng</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="pur-po-view__total-row">
                    <td colSpan={2}>TỔNG CỘNG</td>
                    <td className="pur-po-view__td-num">{sumQty(order.lines)}</td>
                    <td colSpan={4} />
                    <td className="pur-po-view__td-num">{totalAmount}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pur-po-view__pager">
              <span>
                Hiển thị từ {from} đến {to} của {lines.length} các mục
              </span>
              <div className="pur-po-view__pager-btns">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Lùi lại
                </button>
                <button type="button" className="is-active" disabled>{safePage}</button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Đi tới
                </button>
              </div>
            </div>

            <table className="pur-po-view__money">
              <tbody>
                <tr>
                  <td>Chiết khấu</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Chi phí đóng gói</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Khoảng giảm trừ</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Tiền chưa quy đổi</td>
                  <td>{totalAmount}</td>
                </tr>
                <tr>
                  <td>Đơn vị tiền tệ</td>
                  <td>{order.currency || 'VNĐ'}</td>
                </tr>
                <tr className="pur-po-view__money-total">
                  <td>Tổng cộng</td>
                  <td>{totalVnd}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && (
          <div className="pur-po-view__table-wrap">
            <table className="pur-po-view__table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Ngày chứng từ</th>
                  <th>Mã chứng từ</th>
                  <th>Người tạo</th>
                  <th>Số tiền chi</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payRows.map((p, i) => (
                  <tr key={p.id}>
                    <td className="pur-po-view__td-center">{i + 1}</td>
                    <td className="pur-po-view__td-center">{p.dueDate || '—'}</td>
                    <td className="pur-po-view__td-center">{p.code}</td>
                    <td className="pur-po-view__td-center">—</td>
                    <td className="pur-po-view__td-num">{p.amount}</td>
                    <td className="pur-po-view__td-center">{p.status}</td>
                  </tr>
                ))}
                {payRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="pur-po-view__empty" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'feedback' && (
          <div className="pur-po-view__feedback">
            <textarea
              className="pur-po-view__feedback-input"
              placeholder="feedback"
              rows={5}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <button
              type="button"
              className="pur-po-view__link"
              onClick={() => showToast('info', 'Đính kèm file (UI demo).')}
            >
              File Đính Kèm
            </button>
            <div className="pur-po-view__tab-actions">
              <button
                type="button"
                className="pur-po-view__btn-primary"
                onClick={() => {
                  if (!feedbackText.trim()) {
                    showToast('warning', 'Nhập nội dung feedback.');
                    return;
                  }
                  showToast('success', 'Đã thêm bình luận (UI demo).');
                  setFeedbackText('');
                }}
              >
                THÊM BÌNH LUẬN
              </button>
            </div>
          </div>
        )}

        {tab === 'files' && (
          <div className="pur-po-view__files">
            <button
              type="button"
              className="pur-po-view__dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                showToast('info', 'Tải lên tập tin (UI demo).');
              }}
            >
              Thả tập tin vào đây để tải lên
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={() => showToast('info', 'Tải lên tập tin (UI demo).')}
            />
            <div className="pur-po-view__tab-actions">
              <button
                type="button"
                className="pur-po-view__btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                THÊM TẬP TIN
              </button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <ul className="pur-po-view__activity">
            <li className="pur-po-view__activity-item">
              <span className="pur-po-view__activity-avatar" aria-hidden>
                <User size={16} />
              </span>
              <div className="pur-po-view__activity-body">
                <p className="pur-po-view__activity-time">Khi tạo đơn</p>
                <span className="pur-po-view__activity-tag">Đơn đặt hàng</span>
                <p className="pur-po-view__activity-text">
                  Thêm mới đơn đặt hàng [{order.code}]
                </p>
              </div>
            </li>
          </ul>
        )}
      </div>
    </Modal>
  );
}
