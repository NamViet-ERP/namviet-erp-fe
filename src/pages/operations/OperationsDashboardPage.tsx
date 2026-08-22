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

function SectionHeading({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="section-heading__title m-0">{title}</h2>
        {sub ? <p className="section-heading__sub mb-0 text-pretty">{sub}</p> : null}
      </div>
      {action ? (
        <Link to={action.to} className="btn btn-outlined btn-sm shrink-0">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function OpenPoRows({ rows }: { rows: PurchaseOrderApiDto[] }) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={6}>
          <EmptyState message="Không có đơn hàng đang mở." icon={ShoppingCart} />
        </td>
      </tr>
    );
  }

  return rows.map(row => (
    <tr key={row.code} className="table-row">
      <td className="table-cell">
        <Link
          className="font-mono text-sm text-[var(--md-primary)] hover:underline"
          to={`/purchasing/orders/${encodeURIComponent(row.code)}`}
        >
          {row.code}
        </Link>
      </td>
      <td className="table-cell tabular-nums">{row.projectCode}</td>
      <td className="table-cell">{row.supplierName || '-'}</td>
      <td className="table-cell"><PoStatusPill {...poPlacementStatus(row.orderPlacementStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poDeliveryStatus(row.deliveryStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poApprovalStatus(row.approvalStatus)} /></td>
    </tr>
  ));
}

/** Tổng quan Vận hành — reuse chrome/KPI/table pattern của Kho + Mua hàng. */
export default function OperationsDashboardPage() {
  const dash = useOperationsDashboard();
  const { counts } = dash;

  if (dash.isBootLoading) {
    return <PageLoader />;
  }

  return (
    <div className="page-stack operations-dashboard">
      <PageHeader
          eyebrow="Tổng quan"
          title="Tổng quan vận hành"
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
          accent="stone"
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
          accent="success"
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

      <HrmPanel>
        <SectionHeading
          title="Cảnh báo tồn kho thấp"
          sub="Tồn hiện tại thấp hơn ngưỡng tối thiểu đã thiết lập."
          action={{ to: '/warehouse/stock', label: 'Đi tới Kho →' }}
        />
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap -mx-1">
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
              {dash.stockPreview.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Không có cảnh báo tồn thấp." />
                  </td>
                </tr>
              ) : (
                dash.stockPreview.map(row => (
                  <tr key={`${row.projectCode}-${row.materialCode}`} className="table-row">
                    <td className="table-cell font-mono text-sm">{row.materialCode}</td>
                    <td className="table-cell font-semibold">{row.materialName}</td>
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)]">{row.projectCode}</td>
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

      <HrmPanel>
        <SectionHeading
          title="Đơn hàng cần theo dõi"
          sub="PO chưa giao đủ - đặt hàng, nhận hàng, duyệt."
          action={{ to: '/purchasing/orders', label: 'Đi tới Mua hàng →' }}
        />
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap -mx-1">
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
              <OpenPoRows rows={dash.openOrderRows} />
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <HrmPanel>
        <SectionHeading
          title="Đề nghị thanh toán chờ xử lý"
          sub="DNTT nháp hoặc đã gửi, chưa thanh toán."
          action={{ to: '/purchasing/payments', label: 'Đi tới Đề nghị TT →' }}
        />
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap -mx-1">
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
              {dash.pendingPaymentRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Không có đề nghị thanh toán chờ xử lý." icon={Wallet} />
                  </td>
                </tr>
              ) : (
                dash.pendingPaymentRows.map(row => (
                  <tr key={row.code} className="table-row">
                    <td className="table-cell">
                      <Link
                        className="font-mono text-sm text-[var(--md-primary)] hover:underline"
                        to={`/purchasing/payments/${encodeURIComponent(row.code)}`}
                      >
                        {row.code}
                      </Link>
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

      <HrmPanel>
        <SectionHeading
          title="Dự án đang triển khai"
          sub="Danh sách nhanh - tạo mới sẽ tự sinh kho dự án."
          action={{ to: '/operations/projects', label: 'Danh sách dự án →' }}
        />
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
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
              {dash.activeProjects.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Chưa có dự án đang triển khai." icon={FolderKanban} />
                  </td>
                </tr>
              ) : (
                dash.activeProjects.map(row => (
                  <tr key={row.projectCode} className="table-row">
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap project-col-code">
                      {row.projectCode}
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
