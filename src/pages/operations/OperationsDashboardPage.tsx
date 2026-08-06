import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import {
  Activity,
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
import { useProjects } from '../../hooks/useProjects';
import { useLowStockAlerts } from '../../hooks/useLowStockAlerts';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { usePurchasePayments } from '../../hooks/usePurchasePayments';
import { usePurchasePlans } from '../../hooks/usePurchasePlans';
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
      return status || '—';
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
      <td className="table-cell">{row.supplierName || '—'}</td>
      <td className="table-cell"><PoStatusPill {...poPlacementStatus(row.orderPlacementStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poDeliveryStatus(row.deliveryStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poApprovalStatus(row.approvalStatus)} /></td>
    </tr>
  ));
}

/** Tổng quan Vận hành — reuse chrome/KPI/table pattern của Kho + Mua hàng. */
export default function OperationsDashboardPage() {
  const { data: allProjects, isLoading: loadingAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: activeProjectsPage, isLoading: loadingActive } = useProjects({
    page: 1,
    pageSize: 8,
    status: 'Active',
  });
  const { data: closedProjects } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });

  const { data: lowStock = [], isLoading: loadingStock } = useLowStockAlerts(undefined, 10);

  const { data: ordersNone } = usePurchaseOrders({ page: 1, pageSize: 8, deliveryStatus: 'none' });
  const { data: ordersPartial } = usePurchaseOrders({ page: 1, pageSize: 8, deliveryStatus: 'partial' });
  const { data: ordersAll } = usePurchaseOrders({ page: 1, pageSize: 1 });
  const { data: ordersWarning } = usePurchaseOrders({ page: 1, pageSize: 5, paymentWarning: true });

  const { data: paymentsDraft } = usePurchasePayments({ page: 1, pageSize: 1, status: 'draft' });
  const { data: paymentsSubmitted } = usePurchasePayments({ page: 1, pageSize: 5, status: 'submitted' });
  const { data: plansOpen } = usePurchasePlans({ page: 1, pageSize: 1 });

  const activeCount = activeProjectsPage?.totalCount ?? 0;
  const totalProjects = allProjects?.totalCount ?? 0;
  const closedCount = closedProjects?.totalCount ?? 0;
  const openOrderCount = (ordersNone?.totalCount ?? 0) + (ordersPartial?.totalCount ?? 0);
  const openOrderRows = [...(ordersNone?.items ?? []), ...(ordersPartial?.items ?? [])].slice(0, 8);
  const pendingPaymentCount =
    (paymentsDraft?.totalCount ?? 0) + (paymentsSubmitted?.totalCount ?? 0);
  const pendingPaymentRows = [
    ...(paymentsSubmitted?.items ?? []),
    ...(paymentsDraft?.items ?? []),
  ].slice(0, 5);
  const paymentWarningCount = ordersWarning?.totalCount ?? 0;
  const planCount = plansOpen?.totalCount ?? 0;

  if ((loadingAll || loadingActive || loadingStock) && !activeProjectsPage && !allProjects) {
    return <PageLoader />;
  }

  return (
    <div className="page-stack relative operations-dashboard">
      <div className="dashboard-ambient dashboard-ambient--tl" aria-hidden />
      <div className="dashboard-ambient dashboard-ambient--br" aria-hidden />

      <div className="relative z-10">
        <PageHeader
          eyebrow="Tổng quan"
          title="Tổng quan vận hành"
          actions={(
            <p className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] shrink-0">
              <Activity size={13} className="text-[var(--md-secondary)]" aria-hidden />
              Cập nhật lúc:{' '}
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        />
      </div>

      <div className="dashboard-kpi-grid">
        <Card
          title="Dự án đang triển khai"
          value={activeCount}
          subtitle={`/${totalProjects} tổng · ${closedCount} đã đóng`}
          accent="teal"
          icon={CheckCircle2}
        />
        <Card
          title="Cảnh báo tồn thấp"
          value={lowStock.length}
          subtitle="Dưới ngưỡng tối thiểu"
          accent="amber"
          icon={AlertTriangle}
        />
        <Card
          title="Đơn hàng đang xử lý"
          value={openOrderCount}
          subtitle={`/${ordersAll?.totalCount ?? '—'} PO · ${planCount} KHMH`}
          accent="blue"
          icon={ShoppingCart}
        />
        <Card
          title="DNTT chờ xử lý"
          value={pendingPaymentCount}
          subtitle="Nháp + đã gửi"
          accent="purple"
          icon={Wallet}
        />
      </div>

      {lowStock.length > 0 && (
        <div className="alert-banner alert-banner--warning" role="alert">
          <AlertTriangle size={18} className="alert-banner__icon" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-[var(--md-on-surface)]">
              {lowStock.length} cảnh báo tồn dưới ngưỡng tối thiểu
            </p>
            <ul className="mt-1 text-xs text-[var(--md-on-surface-variant)] space-y-0.5">
              {lowStock.slice(0, 5).map(a => (
                <li key={`${a.projectCode}-${a.materialCode}`}>
                  <span className="font-mono">{a.projectCode}</span>
                  {' — '}
                  {a.materialCode} ({fmtStockQty(a.actualQty)}/{fmtStockQty(a.minStockQty)} {a.unit})
                </li>
              ))}
            </ul>
          </div>
          <Link to="/warehouse/stock" className="btn btn-outlined btn-sm shrink-0">
            Đi tới Kho
          </Link>
        </div>
      )}

      <div className="dashboard-ops-grid" aria-label="Cảnh báo nhanh">
        <div className="dashboard-ops-card" style={{ '--ops-color': 'var(--md-error)' } as CSSProperties}>
          <div className="dashboard-ops-card__icon">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className="dashboard-ops-card__label">Cảnh báo thanh toán PO</p>
            <p className="dashboard-ops-card__value">{paymentWarningCount}</p>
          </div>
          <Link to="/purchasing/orders" className="text-xs font-medium text-[var(--md-primary)] hover:underline ml-auto shrink-0">
            Xem ngay
          </Link>
        </div>
        <div className="dashboard-ops-card" style={{ '--ops-color': 'var(--md-primary)' } as CSSProperties}>
          <div className="dashboard-ops-card__icon">
            <Truck size={18} />
          </div>
          <div className="min-w-0">
            <p className="dashboard-ops-card__label">Tiến độ hàng về</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5 mb-0">Kế hoạch hàng về theo dự án / PO</p>
          </div>
          <Link to="/warehouse/arrival-plans" className="text-xs font-medium text-[var(--md-primary)] hover:underline ml-auto shrink-0">
            Xem tiến độ →
          </Link>
        </div>
        <div className="dashboard-ops-card" style={{ '--ops-color': 'var(--md-secondary)' } as CSSProperties}>
          <div className="dashboard-ops-card__icon">
            <FolderKanban size={18} />
          </div>
          <div className="min-w-0">
            <p className="dashboard-ops-card__label">Danh sách dự án</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5 mb-0">Phân công PIC / SC</p>
          </div>
          <Link to="/operations/projects" className="text-xs font-medium text-[var(--md-primary)] hover:underline ml-auto shrink-0">
            Mở →
          </Link>
        </div>
        <div className="dashboard-ops-card" style={{ '--ops-color': 'var(--md-tertiary, var(--md-primary))' } as CSSProperties}>
          <div className="dashboard-ops-card__icon">
            <Package size={18} />
          </div>
          <div className="min-w-0">
            <p className="dashboard-ops-card__label">Danh mục vật tư</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5 mb-0">Master VT vận hành</p>
          </div>
          <Link to="/operations/materials" className="text-xs font-medium text-[var(--md-primary)] hover:underline ml-auto shrink-0">
            Mở →
          </Link>
        </div>
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
              {lowStock.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Không có cảnh báo tồn thấp." />
                  </td>
                </tr>
              ) : (
                lowStock.map(row => (
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
          sub="PO chưa giao đủ — đặt hàng, nhận hàng, duyệt."
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
              <OpenPoRows rows={openOrderRows} />
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
              {pendingPaymentRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Không có đề nghị thanh toán chờ xử lý." icon={Wallet} />
                  </td>
                </tr>
              ) : (
                pendingPaymentRows.map(row => (
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
                    <td className="table-cell">{row.supplierName || '—'}</td>
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
          sub="Danh sách nhanh — tạo mới sẽ tự sinh kho dự án."
          action={{ to: '/operations/projects', label: 'Danh sách dự án →' }}
        />
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap -mx-1">
          <table className="wms-inventory-table project-warehouse-table">
            <thead>
              <tr>
                <th className="table-header-cell project-col-code">Mã</th>
                <th className="table-header-cell">Tên công trình</th>
                <th className="table-header-cell">Khách hàng</th>
                <th className="table-header-cell project-col-pm">PM</th>
                <th className="table-header-cell text-center project-col-status">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(activeProjectsPage?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="Chưa có dự án đang triển khai." icon={FolderKanban} />
                  </td>
                </tr>
              ) : (
                (activeProjectsPage?.items ?? []).map(row => (
                  <tr key={row.projectCode} className="table-row">
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)] project-col-code">
                      {row.projectCode}
                    </td>
                    <td className="table-cell font-semibold">{row.projectName}</td>
                    <td className="table-cell">{row.clientName?.trim() || '—'}</td>
                    <td className="table-cell project-col-pm">{row.pmName || '—'}</td>
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
