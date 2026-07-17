import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquare,
  NotebookPen,
  Pencil,
  Printer,
  Trash2,
  User,
} from 'lucide-react';
import type { PayStatus, PurchaseOrderRow, ReceiveStatus } from '../../data/purchasingMock';
import { approveOrder } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../ui/Toast';
import ConfirmDialog from '../ui/ConfirmDialog';
import PurchaseOrderExpandPanel from './PurchaseOrderExpandPanel';

interface PurchaseOrdersTableProps {
  rows: PurchaseOrderRow[];
  onView: (row: PurchaseOrderRow) => void;
  onEdit?: (row: PurchaseOrderRow) => void;
}

type TacVuAction =
  | 'view'
  | 'edit'
  | 'updateEcd'
  | 'updateDate'
  | 'updatePoInvoice'
  | 'updateContract'
  | 'updatePayPlan'
  | 'print'
  | 'delete';

const TACVU_ITEMS: { id: TacVuAction; label: string; Icon: typeof Eye; danger?: boolean }[] = [
  { id: 'view', label: 'Xem phiếu', Icon: Eye },
  { id: 'edit', label: 'Sửa phiếu', Icon: Pencil },
  { id: 'updateEcd', label: 'Cập nhật ngày dự kiến có hàng', Icon: NotebookPen },
  { id: 'updateDate', label: 'Cập nhật ngày', Icon: NotebookPen },
  { id: 'updatePoInvoice', label: 'Cập nhật số PO và Invoice', Icon: NotebookPen },
  { id: 'updateContract', label: 'Cập nhật số hợp đồng', Icon: NotebookPen },
  { id: 'updatePayPlan', label: 'Cập nhật số kế hoạch thanh toán', Icon: NotebookPen },
  { id: 'print', label: 'In phiếu', Icon: Printer },
  { id: 'delete', label: 'Xóa phiếu', Icon: Trash2, danger: true },
];

const APPROVE_HINT = 'Bạn có muốn duyệt phiếu?';

function payLabel(s: PayStatus): string {
  if (s === 'paid') return 'Đã chi';
  if (s === 'partial') return 'Chi 1 phần';
  return 'Chưa chi';
}

function receiveLabel(s: ReceiveStatus): string {
  if (s === 'full') return 'Nhập đủ';
  if (s === 'partial') return 'Nhập 1 phần';
  return 'Chưa nhập';
}

function pillClass(kind: 'ok' | 'warn' | 'danger' | 'info'): string {
  return `pur-erp__pill pur-erp__pill--${kind}`;
}

function payPill(s: PayStatus): string {
  return s === 'paid' ? pillClass('ok') : pillClass('warn');
}

function receivePill(s: ReceiveStatus): string {
  if (s === 'full') return pillClass('ok');
  if (s === 'partial') return pillClass('warn');
  return pillClass('danger');
}

function money(value: string, currency: string): string {
  const t = value.trim();
  if (!t) return '';
  const cur = currency.trim() || 'VNĐ';
  return t.includes('(') ? t : `${t}(${cur})`;
}

function isApproved(row: PurchaseOrderRow): boolean {
  return Boolean(row.approvedBy?.trim());
}

function ApproveStatusCell({
  row,
  onAskApprove,
}: {
  row: PurchaseOrderRow;
  onAskApprove: (row: PurchaseOrderRow) => void;
}) {
  const approved = isApproved(row);
  if (!approved) {
    return (
      <div className="pur-erp__approve">
        <button
          type="button"
          className={`${pillClass('warn')} pur-erp__approve-btn`}
          title={APPROVE_HINT}
          aria-label={APPROVE_HINT}
          onClick={() => onAskApprove(row)}
        >
          <Check size={12} aria-hidden />
          Chưa duyệt
        </button>
      </div>
    );
  }

  const tip = row.approvedAt?.trim() ? `Vào lúc: ${row.approvedAt.trim()}` : '';

  return (
    <div className="pur-erp__approve">
      <span className={pillClass('ok')}>Đã duyệt</span>
      <div className="pur-erp__approve-user">
        <span
          className="pur-erp__approve-avatar"
          data-tip={tip || undefined}
          tabIndex={tip ? 0 : undefined}
          role={tip ? 'img' : undefined}
          aria-label={tip || undefined}
        >
          <User size={11} aria-hidden />
        </span>
        <span className="pur-erp__approve-name">{row.approvedBy}</span>
      </div>
    </div>
  );
}

function DeadlineCell({ row }: { row: PurchaseOrderRow }) {
  return (
    <div className="pur-erp__deadline">
      <div>
        <span className="pur-erp__deadline-label">Ngày dự kiến có hàng (ECD): </span>
        <span className={`pur-erp__deadline-val${row.eta ? ' is-ecd' : ''}`}>{row.eta}</span>
      </div>
      <div>
        <span className="pur-erp__deadline-label">Ngày tàu khởi hành (ETD): </span>
        <span className="pur-erp__deadline-val">{row.etd}</span>
      </div>
      <div>
        <span className="pur-erp__deadline-label">Ngày tàu cập cảng (ETA): </span>
        <span className="pur-erp__deadline-val">{row.etaPort}</span>
      </div>
      <div>
        <span className="pur-erp__deadline-label">Ngày hàng về kho (ETW): </span>
        <span className="pur-erp__deadline-val">{row.etw}</span>
      </div>
    </div>
  );
}

function runTacVu(
  action: TacVuAction,
  row: PurchaseOrderRow,
  onView: (row: PurchaseOrderRow) => void,
  onEdit?: (row: PurchaseOrderRow) => void,
) {
  switch (action) {
    case 'view':
      onView(row);
      return;
    case 'edit':
      onEdit?.(row);
      return;
    case 'updateEcd':
      showToast('info', `Cập nhật ECD cho ${row.code} (UI demo).`);
      return;
    case 'updateDate':
      showToast('info', `Cập nhật ngày cho ${row.code} (UI demo).`);
      return;
    case 'updatePoInvoice':
      showToast('info', `Cập nhật PO/Invoice ${row.code} (UI demo).`);
      return;
    case 'updateContract':
      showToast('info', `Cập nhật số hợp đồng ${row.code} (UI demo).`);
      return;
    case 'updatePayPlan':
      showToast('info', `Cập nhật kế hoạch thanh toán ${row.code} (UI demo).`);
      return;
    case 'print':
      showToast('info', `In phiếu ${row.code} (UI demo).`);
      return;
    case 'delete':
      showToast('warning', `Xóa phiếu ${row.code} (UI demo).`);
      return;
    default:
      return;
  }
}

/** Bảng PO bám ERP purchase_order — đủ cột + Deadline 4 dòng. */
export default function PurchaseOrdersTable({ rows, onView, onEdit }: PurchaseOrdersTableProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [approveTarget, setApproveTarget] = useState<PurchaseOrderRow | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuId) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="pur-erp__table pur-erp__table--po">
        <thead>
          <tr>
            <th scope="col">Ngày đặt hàng (POD)</th>
            <th scope="col">Mã chứng từ</th>
            <th scope="col">PO NCC</th>
            <th scope="col">Invoice</th>
            <th scope="col">Nhà cung cấp</th>
            <th scope="col">Deadline</th>
            <th scope="col" className="pur-erp__th-num">Tổng giá trị</th>
            <th scope="col" className="pur-erp__th-num">Tổng giá trị VNĐ</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Tổng chi</th>
            <th scope="col">Tình trạng</th>
            <th scope="col">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const open = Boolean(expanded[row.id]);
            return (
              <Fragment key={row.id}>
                <tr className={open ? 'is-expanded' : undefined}>
                  <td>
                    <div className="pur-erp__pod-cell">
                      <div className="pur-erp__pod-top">
                        <button
                          type="button"
                          className="pur-erp__expand"
                          aria-expanded={open}
                          aria-label={open ? 'Thu gọn dòng hàng' : 'Mở rộng dòng hàng'}
                          onClick={() => setExpanded(p => ({ ...p, [row.id]: !p[row.id] }))}
                        >
                          <ChevronRight size={14} className={open ? 'is-open' : undefined} aria-hidden />
                        </button>
                        <span className="pur-erp__pod-date tabular-nums">{row.orderedAt}</span>
                      </div>
                      <div className="pur-erp__tacvu" ref={menuId === row.id ? menuRef : undefined}>
                        <button
                          type="button"
                          className="pur-erp__tacvu-btn"
                          aria-expanded={menuId === row.id}
                          aria-haspopup="menu"
                          onClick={() => setMenuId(menuId === row.id ? null : row.id)}
                        >
                          Tác vụ
                          <ChevronDown size={12} aria-hidden />
                        </button>
                        {menuId === row.id && (
                          <div className="pur-erp__tacvu-menu" role="menu">
                            {TACVU_ITEMS.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                className={item.danger ? 'is-danger' : undefined}
                                onClick={() => {
                                  runTacVu(item.id, row, onView, onEdit);
                                  setMenuId(null);
                                }}
                              >
                                <item.Icon size={14} aria-hidden />
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <button type="button" className="pur-erp__doc-link" onClick={() => onView(row)}>
                      {row.code}
                    </button>
                  </td>
                  <td className="pur-erp__td-center">{row.poNumber}</td>
                  <td className="pur-erp__td-center">{row.invoiceNo}</td>
                  <td>
                    <div className="pur-erp__supplier-cell">
                      <span className="pur-erp__supplier-name">{row.supplier}</span>
                      <span className="pur-erp__comment">
                        <MessageSquare size={12} aria-hidden />
                        0 bình luận
                      </span>
                    </div>
                  </td>
                  <td>
                    <DeadlineCell row={row} />
                  </td>
                  <td className="pur-erp__td-num whitespace-nowrap">
                    {money(row.amountForeign || '', row.currency || 'VNĐ')}
                  </td>
                  <td className="pur-erp__td-num whitespace-nowrap">
                    {money(row.amount, 'VNĐ')}
                  </td>
                  <td className="pur-erp__td-center">
                    <ApproveStatusCell row={row} onAskApprove={setApproveTarget} />
                  </td>
                  <td className="pur-erp__td-center">
                    <span className={payPill(row.payStatus)}>{payLabel(row.payStatus)}</span>
                  </td>
                  <td className="pur-erp__td-center">
                    <span className={receivePill(row.receiveStatus)}>{receiveLabel(row.receiveStatus)}</span>
                  </td>
                  <td className="pur-erp__note">{row.note}</td>
                </tr>
                {open && (
                  <tr className="pur-erp__expand-row">
                    <td colSpan={12}>
                      <PurchaseOrderExpandPanel row={row} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <ConfirmDialog
        isOpen={approveTarget != null}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget) return;
          if (approveOrder(approveTarget.id)) {
            showToast('success', `Đã duyệt ${approveTarget.code}.`);
          } else {
            showToast('warning', 'Không duyệt được phiếu này.');
          }
          setApproveTarget(null);
        }}
        title="Duyệt phiếu"
        message={APPROVE_HINT}
        confirmLabel="OK"
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
}

