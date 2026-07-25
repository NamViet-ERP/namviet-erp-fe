import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, Plus, RefreshCw, Send, Undo2 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Dropdown from '../../components/ui/Dropdown';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useApprovePurchaseOrder,
  usePlacePurchaseOrder,
  usePurchaseOrders,
  useUnapprovePurchaseOrder,
} from '../../hooks/usePurchaseOrders';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import {
  PoStatusPill,
  poDeliveryStatus,
  poPaymentStatus,
  poPaymentWarningStatus,
  poPlacementStatus,
} from '../../lib/purchasing/purchaseOrderStatus';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DropdownItem } from '../../types';

const PLACEMENT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'not_placed', label: 'Chưa đặt' },
  { value: 'placed', label: 'Đã đặt' },
];

const DELIVERY_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'none', label: 'Chưa giao' },
  { value: 'partial', label: '1 phần' },
  { value: 'complete', label: 'Đủ' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'partial', label: 'Thanh toán 1 phần' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'overdue', label: 'Quá hạn' },
];

const WARNING_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Đang có cảnh báo' },
  { value: 'false', label: 'Không cảnh báo' },
];

const COL_COUNT = 12;

/** Danh sách đơn hàng PO — cột + bộ lọc theo spec. */
export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [supplierName, setSupplierName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [orderPlacementStatus, setOrderPlacementStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentWarning, setPaymentWarning] = useState('');
  const approveMutation = useApprovePurchaseOrder();
  const unapproveMutation = useUnapprovePurchaseOrder();
  const placeMutation = usePlacePurchaseOrder();
  const { has } = usePermission();
  const canApprove = has('purchasing.orders.approve');
  const canUnapprove = has('purchasing.orders.unapprove');
  const canPlace = has('purchasing.orders.place');

  const listParams = useMemo(() => ({
    page,
    pageSize,
    search: supplierName.trim() || undefined,
    planCode: planCode.trim() || undefined,
    projectCode: projectCode.trim() || undefined,
    orderPlacementStatus: orderPlacementStatus || undefined,
    deliveryStatus: deliveryStatus || undefined,
    paymentStatus: paymentStatus || undefined,
    paymentWarning: paymentWarning === '' ? undefined : paymentWarning === 'true',
  }), [
    page, pageSize, supplierName, planCode, projectCode,
    orderPlacementStatus, deliveryStatus, paymentStatus, paymentWarning,
  ]);

  const { data, isLoading, isError, error, refetch } = usePurchaseOrders(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const handleApprove = async (code: string) => {
    try {
      await approveMutation.mutateAsync(code);
      showToast('success', `Đã duyệt PO ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không duyệt được PO ${code}`));
    }
  };

  const handleUnapprove = async (code: string) => {
    try {
      await unapproveMutation.mutateAsync(code);
      showToast('success', `Đã hủy duyệt PO ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không hủy duyệt được PO ${code}`));
    }
  };

  const handlePlace = async (code: string) => {
    try {
      await placeMutation.mutateAsync(code);
      showToast('success', `Đã đặt NCC cho PO ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không thể đặt NCC cho PO ${code}`));
    }
  };

  const rowActions = (row: (typeof items)[number]): DropdownItem[] => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => navigate(`/purchasing/orders/${encodeURIComponent(row.code)}`) },
    ...(canApprove && row.approvalStatus === 'draft'
      ? [{ label: 'Duyệt PO', icon: Check, onClick: () => void handleApprove(row.code) }]
      : []),
    ...(canUnapprove && row.approvalStatus === 'approved' && row.orderPlacementStatus !== 'placed'
      ? [{ label: 'Hủy duyệt', icon: Undo2, onClick: () => void handleUnapprove(row.code) }]
      : []),
    ...(canPlace && row.approvalStatus === 'approved' && row.orderPlacementStatus !== 'placed'
      ? [{ label: 'Đã đặt NCC', icon: Send, onClick: () => void handlePlace(row.code) }]
      : []),
  ];

  const resetFilters = () => {
    setSupplierName('');
    setPlanCode('');
    setProjectCode('');
    setOrderPlacementStatus('');
    setDeliveryStatus('');
    setPaymentStatus('');
    setPaymentWarning('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    supplierName.trim()
    || planCode.trim()
    || projectCode.trim()
    || orderPlacementStatus
    || deliveryStatus
    || paymentStatus
    || paymentWarning,
  );

  const tableHead = (
    <tr>
      <th>Ngày tạo</th>
      <th>Mã PO</th>
      <th>KHMH</th>
      <th>Dự án</th>
      <th>Nhà cung cấp</th>
      <th className="pur-erp__th-num">Tổng tiền</th>
      <th className="pur-erp__th-status">Trạng thái đặt</th>
      <th className="pur-erp__th-status">Trạng thái giao</th>
      <th className="pur-erp__th-status">Tình trạng thanh toán</th>
      <th className="pur-erp__th-status">Cảnh báo thanh toán</th>
      <th>Ghi chú</th>
      <th>Tác vụ</th>
    </tr>
  );

  return (
    <div className="page-shell pur-erp pur-erp--plan pur-erp--po">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Đơn hàng</h1>
          <p className="pur-erp__subtitle">PO theo KHMH — theo dõi đặt hàng, giao hàng và thanh toán</p>
        </div>
        <div className="pur-erp__head-actions">
          <button
            type="button"
            className="pur-erp__action pur-erp__action--primary"
            onClick={() => navigate('/purchasing/orders/new')}
          >
            <Plus size={14} aria-hidden />
            Tạo PO
          </button>
        </div>
      </header>

      <div className="pur-erp__workspace">
        <div className="pur-erp__filter-card pur-erp__filter-card--po">
          <div className="pur-erp__toolbar pur-erp__toolbar--po">
            <div className="pur-erp__toolbar-fields pur-erp__filter-grid pur-erp__filter-grid--po">
              <label className="pur-erp__field">
                <span>Nhà cung cấp</span>
                <input
                  className="pur-erp__select"
                  value={supplierName}
                  onChange={e => { setSupplierName(e.target.value); setPage(1); }}
                  placeholder="Tên NCC"
                  aria-label="Lọc nhà cung cấp"
                />
              </label>
              <label className="pur-erp__field">
                <span>KHMH</span>
                <input
                  className="pur-erp__select"
                  value={planCode}
                  onChange={e => { setPlanCode(e.target.value); setPage(1); }}
                  placeholder="Mã KHMH"
                  aria-label="Lọc mã KHMH"
                />
              </label>
              <label className="pur-erp__field">
                <span>Dự án</span>
                <input
                  className="pur-erp__select"
                  value={projectCode}
                  onChange={e => { setProjectCode(e.target.value); setPage(1); }}
                  placeholder="Mã dự án"
                  aria-label="Lọc dự án"
                />
              </label>
              <label className="pur-erp__field">
                <span>Trạng thái đặt</span>
                <select
                  className="pur-erp__select"
                  value={orderPlacementStatus}
                  onChange={e => { setOrderPlacementStatus(e.target.value); setPage(1); }}
                  aria-label="Lọc trạng thái đặt"
                >
                  {PLACEMENT_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="pur-erp__field">
                <span>Trạng thái giao</span>
                <select
                  className="pur-erp__select"
                  value={deliveryStatus}
                  onChange={e => { setDeliveryStatus(e.target.value); setPage(1); }}
                  aria-label="Lọc trạng thái giao"
                >
                  {DELIVERY_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="pur-erp__field">
                <span>Tình trạng thanh toán</span>
                <select
                  className="pur-erp__select"
                  value={paymentStatus}
                  onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}
                  aria-label="Lọc tình trạng thanh toán"
                >
                  {PAYMENT_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="pur-erp__field">
                <span>Cảnh báo thanh toán</span>
                <select
                  className="pur-erp__select"
                  value={paymentWarning}
                  onChange={e => { setPaymentWarning(e.target.value); setPage(1); }}
                  aria-label="Lọc đơn đang có cảnh báo thanh toán"
                >
                  {WARNING_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            {hasActiveFilters ? (
              <div className="pur-erp__toolbar-actions">
                <button type="button" className="hrm-filter-reset" onClick={resetFilters}>
                  <RefreshCw size={14} aria-hidden />
                  Xóa lọc
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pur-erp__panel">
          {isError ? (
            <EmptyState
              message={getApiErrorMessage(error, 'Không tải được danh sách đơn hàng.')}
              action={(
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { void refetch(); }}>
                  Thử lại
                </button>
              )}
            />
          ) : isLoading ? (
            <div className="overflow-x-auto table-scroll">
              <table className="pur-erp__table pur-erp__table--po">
                <thead>{tableHead}</thead>
                <tbody>
                  <TableSkeletonRows rows={8} colSpan={COL_COUNT} />
                </tbody>
              </table>
            </div>
          ) : items.length === 0 ? (
            <EmptyState message="Chưa có đơn hàng khớp bộ lọc." />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                <table className="pur-erp__table pur-erp__table--po">
                  <thead>{tableHead}</thead>
                  <tbody>
                    {items.map(row => {
                      const placement = poPlacementStatus(row.orderPlacementStatus);
                      const delivery = poDeliveryStatus(row.deliveryStatus);
                      const payment = poPaymentStatus(row.paymentStatus);
                      const warning = poPaymentWarningStatus(row.paymentWarning);
                      return (
                        <tr key={row.code}>
                          <td className="pur-erp__td-datetime">{formatDateTimeVi(row.createdAt) ?? '—'}</td>
                          <td className="pur-erp__td-code">{row.code}</td>
                        <td className="pur-erp__td-code">{row.planCode}</td>
                        <td className="pur-erp__td-project">
                          {row.projectName
                            ? `${row.projectName} (${row.projectCode})`
                            : (row.projectCode || '—')}
                        </td>
                        <td>{row.supplierName || '—'}</td>
                        <td className="pur-erp__td-num">{formatCurrency(row.totalAmount)} (VNĐ)</td>
                          <td className="pur-erp__td-status">
                            <PoStatusPill label={placement.label} tone={placement.tone} />
                          </td>
                          <td className="pur-erp__td-status">
                            <PoStatusPill label={delivery.label} tone={delivery.tone} />
                          </td>
                          <td className="pur-erp__td-status">
                            <PoStatusPill label={payment.label} tone={payment.tone} />
                          </td>
                          <td className="pur-erp__td-status">
                            <PoStatusPill label={warning.label} tone={warning.tone} />
                          </td>
                          <td>{row.note || '—'}</td>
                          <td className="text-center">
                            <Dropdown trigger="Tác vụ" items={rowActions(row)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                embedded
                itemLabel="đơn"
                currentPage={Math.min(page, totalPages)}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                totalItems={totalCount}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
