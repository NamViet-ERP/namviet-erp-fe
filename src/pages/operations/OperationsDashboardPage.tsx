import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Card from '../../components/ui/Card';
import HrmPanel from '../../components/hr/HrmPanel';
import Badge from '../../components/ui/Badge';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useOperationsDashboard } from '../../hooks/useOperationsDashboard';
import { fmtStockQty } from '../../lib/wms/stockQtyFormat';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import {
  PoStatusPill,
  poApprovalStatus,
  poDeliveryStatus,
  poPlacementStatus,
} from '../../lib/purchasing/purchaseOrderStatus';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PurchaseOrderApiDto } from '../../types/api/purchasingApi';

type StockFilter = 'all' | 'zero' | 'low';
type OrderFilter = 'all' | 'none' | 'partial';
type PaymentFilter = 'all' | 'draft' | 'submitted';
type ProjectFilter = 'all' | 'noPm' | 'hasPm';

const STOCK_FILTERS: { id: StockFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'zero', label: 'Hết tồn' },
  { id: 'low', label: 'Dưới ngưỡng' },
];

const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'none', label: 'Chưa giao' },
  { id: 'partial', label: 'Giao 1 phần' },
];

const PAYMENT_FILTERS: { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'submitted', label: 'Đã gửi' },
];

const PROJECT_FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'noPm', label: 'Chưa gán PM' },
  { id: 'hasPm', label: 'Có PM' },
];

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function projectStatusLabel(status: string) {
  if (status === 'Active') return 'Đang triển khai';
  if (status === 'Closed') return 'Đã đóng';
  return status;
}

function paymentStatusClass(status: string) {
  switch (status) {
    case 'draft':
      return 'badge badge-neutral';
    case 'submitted':
      return 'badge badge-warning';
    case 'paid':
      return 'badge badge-success';
    case 'cancelled':
      return 'badge badge-error';
    default:
      return 'badge badge-neutral';
  }
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'submitted':
      return 'Đã gửi';
    case 'paid':
      return 'Đã thanh toán';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || '-';
  }
}

function hasPm(row: { pmName?: string | null; pmId?: string | null }): boolean {
  return Boolean(row.pmName?.trim()) && row.pmId !== EMPTY_PM_ID;
}

function OpsFilterTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="ops-projects-tabs" role="tablist" aria-label={label}>
      {options.map(item => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ops-projects-tabs__btn${active ? ' is-active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function OpsBoard({
  title,
  desc,
  filter,
  to,
  toLabel,
  children,
}: {
  title: string;
  desc: string;
  filter: ReactNode;
  to: string;
  toLabel: string;
  children: ReactNode;
}) {
  return (
    <HrmPanel noPadding className="ops-projects-board">
      <div className="ops-projects-board__head">
        <h2 className="ops-projects-board__title">{title}</h2>
        <p className="ops-projects-board__desc">{desc}</p>
      </div>
      <div className="hrm-list-toolbar">
        <div className="ops-projects__toolbar">
          {filter}
          <Link to={to} className="btn btn-outline ops-projects__add">
            {toLabel}
          </Link>
        </div>
      </div>
      <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
        {children}
      </div>
    </HrmPanel>
  );
}

function OpenPoRows({ rows }: { rows: PurchaseOrderApiDto[] }) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={6}>
          <EmptyState message="Không có đơn hàng khớp bộ lọc." icon={ShoppingCart} />
        </td>
      </tr>
    );
  }

  return rows.map(row => (
    <tr key={row.code} className="table-row">
      <td className="table-cell">
        <EntityCodeLink
          code={row.code}
          to={`/purchasing/orders/${encodeURIComponent(row.code)}`}
        />
      </td>
      <td className="table-cell">
        {row.projectCode ? (
          <EntityCodeLink
            code={row.projectCode}
            to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
          />
        ) : '-'}
      </td>
      <td className="table-cell">{row.supplierName || '-'}</td>
      <td className="table-cell"><PoStatusPill {...poPlacementStatus(row.orderPlacementStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poDeliveryStatus(row.deliveryStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poApprovalStatus(row.approvalStatus)} /></td>
    </tr>
  ));
}

/** Tổng quan SLC - KPI + bảng cảnh báo theo chrome ERP. */
export default function OperationsDashboardPage() {
  const dash = useOperationsDashboard();
  const { counts } = dash;
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');

  const stockRows = useMemo(() => {
    if (stockFilter === 'zero') return dash.stockPreview.filter(row => row.actualQty <= 0);
    if (stockFilter === 'low') return dash.stockPreview.filter(row => row.actualQty > 0);
    return dash.stockPreview;
  }, [dash.stockPreview, stockFilter]);

  const orderRows = useMemo(() => {
    if (orderFilter === 'all') return dash.openOrderRows;
    return dash.openOrderRows.filter(row => row.deliveryStatus === orderFilter);
  }, [dash.openOrderRows, orderFilter]);

  const paymentRows = useMemo(() => {
    if (paymentFilter === 'all') return dash.pendingPaymentRows;
    return dash.pendingPaymentRows.filter(row => row.status === paymentFilter);
  }, [dash.pendingPaymentRows, paymentFilter]);

  const projectRows = useMemo(() => {
    if (projectFilter === 'noPm') return dash.activeProjects.filter(row => !hasPm(row));
    if (projectFilter === 'hasPm') return dash.activeProjects.filter(row => hasPm(row));
    return dash.activeProjects;
  }, [dash.activeProjects, projectFilter]);

  if (dash.isBootLoading) {
    return <PageLoader />;
  }

  if (dash.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Tổng quan vận hành"
          subtitle="Theo dõi tồn kho, đơn mua, thanh toán và dự án đang chạy."
        />
        <HrmPanel>
          <EmptyState message={getApiErrorMessage(dash.error, 'Không tải được tổng quan vận hành.')} />
          <div className="mt-3 text-center">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => dash.refetchAll()}>
              Thử lại
            </button>
          </div>
        </HrmPanel>
      </div>
    );
  }

  return (
    <div className="page-shell operations-dashboard">
      <PageHeader
        eyebrow="SLC"
        title="Tổng quan SLC"
        subtitle="Chỉ số dự án, mua hàng, tồn kho - bấm thẻ để đi tới màn chi tiết."
        actions={(
          <p className="page-header__updated">
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      />

      <div className="dashboard-kpi-grid" role="list" aria-label="Chỉ số vận hành">
        <Card
          title="Dự án"
          to="/operations/projects"
          accent="info"
          icon={CheckCircle2}
          stats={[
            { label: 'Đang triển khai', value: counts.projectActive, tone: 'ok' },
            { label: 'Đã đóng', value: counts.projectClosed, tone: 'info' },
            { label: 'Tổng', value: counts.projectTotal, tone: 'neutral' },
          ]}
        />
        <Card
          title="Phân công"
          to="/operations/projects"
          accent="neutral"
          icon={FolderKanban}
          stats={[
            { label: 'Chưa gán PM', value: counts.projectWithoutPm, tone: 'warn' },
            { label: 'Có PM', value: counts.projectWithPm, tone: 'ok' },
            { label: 'Có thủ kho', value: counts.projectWithKeeper, tone: 'info' },
          ]}
        />
        <Card
          title="Tồn thấp"
          to="/warehouse/stock"
          accent="warning"
          icon={AlertTriangle}
          stats={[
            { label: 'Dưới ngưỡng', value: counts.stockBelowMin, tone: 'warn' },
            { label: 'Hết tồn', value: counts.stockZero, tone: 'danger' },
            { label: 'Số dự án', value: counts.stockProjects, tone: 'info' },
          ]}
        />
        <Card
          title="Vật tư"
          to="/operations/materials"
          accent="success"
          icon={Package}
          stats={[
            { label: 'Đang dùng', value: counts.materialActive, tone: 'ok' },
            { label: 'Ngừng dùng', value: counts.materialInactive, tone: 'warn' },
            { label: 'Tổng', value: counts.materialTotal, tone: 'neutral' },
          ]}
        />
        <Card
          title="Đơn hàng"
          to="/purchasing/orders"
          accent="amber"
          icon={ShoppingCart}
          stats={[
            { label: 'Chưa giao', value: counts.orderNone, tone: 'warn' },
            { label: 'Giao 1 phần', value: counts.orderPartial, tone: 'info' },
            { label: 'Kế hoạch mua', value: counts.planCount, tone: 'neutral' },
          ]}
        />
        <Card
          title="Hàng về"
          to="/warehouse/arrival-plans"
          accent="primary"
          icon={Truck}
          stats={[
            { label: 'Quá hạn', value: counts.arrivalOverdue, tone: 'danger' },
            { label: 'Đến hạn', value: counts.arrivalDueToday, tone: 'warn' },
            { label: 'Sắp về', value: counts.arrivalUpcoming, tone: 'info' },
          ]}
        />
        <Card
          title="Đề nghị TT"
          to="/purchasing/payments"
          accent="purple"
          icon={Wallet}
          stats={[
            { label: 'Nháp', value: counts.paymentDraft, tone: 'info' },
            { label: 'Đã gửi', value: counts.paymentSubmitted, tone: 'warn' },
            { label: 'Đã thanh toán', value: counts.paymentPaid, tone: 'ok' },
          ]}
        />
        <Card
          title="Thanh toán PO"
          to="/purchasing/orders"
          accent="danger"
          icon={AlertTriangle}
          stats={[
            { label: 'Trễ hạn', value: counts.poOverdue, tone: 'danger' },
            { label: 'Chưa thanh toán', value: counts.poUnpaid, tone: 'warn' },
            { label: 'Thanh toán 1 phần', value: counts.poPartialPay, tone: 'info' },
          ]}
        />
      </div>

      <OpsBoard
        title="Cảnh báo tồn kho thấp"
        desc="Tồn hiện tại thấp hơn ngưỡng tối thiểu đã thiết lập."
        to="/warehouse/stock"
        toLabel="Đi tới Kho"
        filter={(
          <OpsFilterTabs
            value={stockFilter}
            options={STOCK_FILTERS}
            onChange={setStockFilter}
            label="Lọc tồn thấp"
          />
        )}
      >
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Mã hàng</th>
              <th className="table-header-cell">Tên hàng</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell text-right">Tồn hiện tại</th>
              <th className="table-header-cell text-right">Tối thiểu</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="Không có cảnh báo khớp bộ lọc." icon={AlertTriangle} />
                </td>
              </tr>
            ) : (
              stockRows.map(row => (
                <tr key={`${row.projectCode}-${row.materialCode}`} className="table-row">
                  <td className="table-cell">
                    <EntityCodeLink
                      code={row.materialCode}
                      to="/warehouse/materials"
                      state={{ highlightCode: row.materialCode }}
                    />
                  </td>
                  <td className="table-cell">{row.materialName}</td>
                  <td className="table-cell">
                    <EntityCodeLink
                      code={row.projectCode}
                      to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                    />
                  </td>
                  <td className="table-cell text-right tabular-nums ops-dash__qty-low">
                    {fmtStockQty(row.actualQty)} {row.unit}
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {fmtStockQty(row.minStockQty)} {row.unit}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </OpsBoard>

      <OpsBoard
        title="Đơn hàng cần theo dõi"
        desc="PO chưa giao đủ - đặt hàng, nhận hàng, duyệt."
        to="/purchasing/orders"
        toLabel="Đi tới Mua hàng"
        filter={(
          <OpsFilterTabs
            value={orderFilter}
            options={ORDER_FILTERS}
            onChange={setOrderFilter}
            label="Lọc đơn hàng"
          />
        )}
      >
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Mã PO</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell">Đặt NCC</th>
              <th className="table-header-cell">Giao hàng</th>
              <th className="table-header-cell">Duyệt</th>
            </tr>
          </thead>
          <tbody>
            <OpenPoRows rows={orderRows} />
          </tbody>
        </table>
      </OpsBoard>

      <OpsBoard
        title="Đề nghị thanh toán chờ xử lý"
        desc="DNTT nháp hoặc đã gửi, chưa thanh toán."
        to="/purchasing/payments"
        toLabel="Đi tới Đề nghị TT"
        filter={(
          <OpsFilterTabs
            value={paymentFilter}
            options={PAYMENT_FILTERS}
            onChange={setPaymentFilter}
            label="Lọc đề nghị TT"
          />
        )}
      >
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Mã DNTT</th>
              <th className="table-header-cell">PO</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell text-right">Số tiền</th>
              <th className="table-header-cell">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {paymentRows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="Không có đề nghị khớp bộ lọc." icon={Wallet} />
                </td>
              </tr>
            ) : (
              paymentRows.map(row => (
                <tr key={row.code} className="table-row">
                  <td className="table-cell">
                    <EntityCodeLink
                      code={row.code}
                      to={`/purchasing/payments/${encodeURIComponent(row.code)}`}
                    />
                  </td>
                  <td className="table-cell tabular-nums">{row.poCode}</td>
                  <td className="table-cell">{row.supplierName || '-'}</td>
                  <td className="table-cell text-right tabular-nums">{formatCurrency(row.amount)}</td>
                  <td className="table-cell">
                    <span className={paymentStatusClass(row.status)}>
                      {paymentStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </OpsBoard>

      <OpsBoard
        title="Dự án đang triển khai"
        desc="Danh sách nhanh - tạo mới sẽ tự sinh kho dự án."
        to="/operations/projects"
        toLabel="Danh sách dự án"
        filter={(
          <OpsFilterTabs
            value={projectFilter}
            options={PROJECT_FILTERS}
            onChange={setProjectFilter}
            label="Lọc phân công"
          />
        )}
      >
        <table className="wms-inventory-table project-warehouse-table">
          <thead>
            <tr>
              <th className="table-header-cell project-col-code">Mã</th>
              <th className="table-header-cell project-col-name">Tên công trình</th>
              <th className="table-header-cell project-col-client">Khách hàng</th>
              <th className="table-header-cell project-col-pm">PM</th>
              <th className="table-header-cell text-center project-col-status">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {projectRows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="Không có dự án khớp bộ lọc." icon={FolderKanban} />
                </td>
              </tr>
            ) : (
              projectRows.map(row => (
                <tr key={row.projectCode} className="table-row">
                  <td className="table-cell whitespace-nowrap project-col-code">
                    <EntityCodeLink
                      code={row.projectCode}
                      to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                    />
                  </td>
                  <td className="table-cell project-col-name">{row.projectName}</td>
                  <td className="table-cell project-col-client">{row.clientName?.trim() || '-'}</td>
                  <td className="table-cell project-col-pm">{row.pmName || '-'}</td>
                  <td className="table-cell text-center project-col-status">
                    <Badge status={projectStatusBadge(row.status)} label={projectStatusLabel(row.status)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </OpsBoard>
    </div>
  );
}
