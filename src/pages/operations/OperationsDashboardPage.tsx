import { useMemo, useState } from 'react';
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
import CskhFilterTabs, { type CskhFilterOption } from '../cskh/CskhFilterTabs';

type StockFilter = 'all' | 'zero' | 'low';
type OrderFilter = 'all' | 'none' | 'partial';
type PaymentFilter = 'all' | 'draft' | 'submitted';
type ProjectFilter = 'all' | 'noPm' | 'hasPm';

const STOCK_FILTERS: CskhFilterOption<StockFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'zero', label: 'Hết tồn', tone: 'danger' },
  { id: 'low', label: 'Dưới ngưỡng', tone: 'warn' },
];

const ORDER_FILTERS: CskhFilterOption<OrderFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'none', label: 'Chưa giao', tone: 'warn' },
  { id: 'partial', label: 'Giao 1 phần', tone: 'info' },
];

const PAYMENT_FILTERS: CskhFilterOption<PaymentFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'draft', label: 'Nháp', tone: 'info' },
  { id: 'submitted', label: 'Đã gửi', tone: 'warn' },
];

const PROJECT_FILTERS: CskhFilterOption<ProjectFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'noPm', label: 'Chưa gán PM', tone: 'warn' },
  { id: 'hasPm', label: 'Có PM', tone: 'ok' },
];

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function projectStatusLabel(status: string) {
  if (status === 'Active') return 'Đang triển khai';
  if (status === 'Closed') return 'Đã đóng';
  return status;
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

/** Tổng quan Vận hành — chrome bàn làm việc CSKH (khung navy, toolbar xếp lớp, chip lọc). */
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

  return (
    <div className="page-stack operations-dashboard cskh-desk">
      <PageHeader
        eyebrow="Tổng quan"
        title="Tổng quan SLC"
        actions={(
          <p className="page-header__updated">
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      />

      <div className="dashboard-kpi-grid" role="list" aria-label="Chỉ số vận hành">
        <Card
          className="cskh-desk__kpi-card"
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
          className="cskh-desk__kpi-card"
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
          className="cskh-desk__kpi-card"
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
          className="cskh-desk__kpi-card"
          title="Vật tư"
          to="/operations/materials"
          accent="stone"
          icon={Package}
          stats={[
            { label: 'Đang dùng', value: counts.materialActive, tone: 'ok' },
            { label: 'Ngừng dùng', value: counts.materialInactive, tone: 'warn' },
            { label: 'Tổng', value: counts.materialTotal, tone: 'neutral' },
          ]}
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Đơn hàng"
          to="/purchasing/orders"
          accent="success"
          icon={ShoppingCart}
          stats={[
            { label: 'Chưa giao', value: counts.orderNone, tone: 'warn' },
            { label: 'Giao 1 phần', value: counts.orderPartial, tone: 'info' },
            { label: 'Kế hoạch mua', value: counts.planCount, tone: 'neutral' },
          ]}
        />
        <Card
          className="cskh-desk__kpi-card"
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
          className="cskh-desk__kpi-card"
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
          className="cskh-desk__kpi-card"
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

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Cảnh báo tồn kho thấp</h2>
            <p className="section-heading__sub mb-0">Tồn hiện tại thấp hơn ngưỡng tối thiểu đã thiết lập.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={stockFilter} options={STOCK_FILTERS} onChange={setStockFilter} label="Lọc tồn thấp" />
            <Link to="/warehouse/stock" className="btn btn-outlined btn-sm cskh-desk__toolbar-add">
              Đi tới Kho
            </Link>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
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
                    <td className="table-cell font-semibold">{row.materialName}</td>
                    <td className="table-cell">
                      <EntityCodeLink
                        code={row.projectCode}
                        to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                      />
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-error)]">
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
        </div>
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Đơn hàng cần theo dõi</h2>
            <p className="section-heading__sub mb-0">PO chưa giao đủ - đặt hàng, nhận hàng, duyệt.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={orderFilter} options={ORDER_FILTERS} onChange={setOrderFilter} label="Lọc đơn hàng" />
            <Link to="/purchasing/orders" className="btn btn-outlined btn-sm cskh-desk__toolbar-add">
              Đi tới Mua hàng
            </Link>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
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
        </div>
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Đề nghị thanh toán chờ xử lý</h2>
            <p className="section-heading__sub mb-0">DNTT nháp hoặc đã gửi, chưa thanh toán.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={paymentFilter} options={PAYMENT_FILTERS} onChange={setPaymentFilter} label="Lọc đề nghị TT" />
            <Link to="/purchasing/payments" className="btn btn-outlined btn-sm cskh-desk__toolbar-add">
              Đi tới Đề nghị TT
            </Link>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
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
                    <td className="table-cell">{paymentStatusLabel(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Dự án đang triển khai</h2>
            <p className="section-heading__sub mb-0">Danh sách nhanh - tạo mới sẽ tự sinh kho dự án.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={projectFilter} options={PROJECT_FILTERS} onChange={setProjectFilter} label="Lọc phân công" />
            <Link to="/operations/projects" className="btn btn-outlined btn-sm cskh-desk__toolbar-add">
              Danh sách dự án
            </Link>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
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
                    <td className="table-cell font-semibold project-col-name">{row.projectName}</td>
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
        </div>
      </HrmPanel>
    </div>
  );
}
