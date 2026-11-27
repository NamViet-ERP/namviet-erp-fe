import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FolderKanban, ShoppingCart, Wallet } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import SectionCard from '../../../components/ui/SectionCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import TableShell from '../../../components/ui/TableShell';
import { formatPmDisplayName } from '../../../lib/projectPersonnel';
import { PoStatusPill, poApprovalStatus, poDeliveryStatus, poPlacementStatus } from '../../../lib/purchasing/purchaseOrderStatus';
import { projectStatusBadge } from '../../../lib/wms/projectStatusBadge';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { WmsLowStockAlertApiDto } from '../../../services/alertsService';
import type { PurchaseOrderApiDto, PurchasePaymentApiDto } from '../../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import {
  ORDER_FILTERS, PAYMENT_FILTERS, PROJECT_FILTERS, STOCK_FILTERS,
  hasPm, paymentStatusBadge, projectStatusLabel,
  type OrderFilter, type PaymentFilter, type ProjectFilter, type StockFilter,
} from './operationsDashboardMeta';

function OpsFilterTabs<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { id: T; label: string }[]; onChange: (id: T) => void; label: string }) {
  return (
    <div className="ops-projects-tabs" role="tablist" aria-label={label}>
      {options.map(item => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`ops-projects-tabs__btn${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function OpsBoard({
  title, desc, filter, to, toLabel, children,
}: { title: string; desc: string; filter: ReactNode; to: string; toLabel: string; children: ReactNode }) {
  return (
    <SectionCard noPadding className="ops-projects-board">
      <div className="ops-projects-board__head">
        <h2 className="ops-projects-board__title">{title}</h2>
        <p className="ops-projects-board__desc">{desc}</p>
      </div>
      <div className="hrm-list-toolbar">
        <div className="ops-projects__toolbar">
          {filter}
          <Link to={to} className="btn btn-outlined ops-projects__add">{toLabel}</Link>
        </div>
      </div>
      {children}
    </SectionCard>
  );
}

function OpenPoRows({ rows }: { rows: PurchaseOrderApiDto[] }) {
  return rows.map(row => (
    <tr key={row.code} className="table-row">
      <td className="table-cell"><EntityCodeLink code={row.code} to={`/purchasing/orders/${encodeURIComponent(row.code)}`} /></td>
      <td className="table-cell">{row.projectCode ? <EntityCodeLink code={row.projectCode} to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`} /> : '-'}</td>
      <td className="table-cell">{row.supplierName || '-'}</td>
      <td className="table-cell"><PoStatusPill {...poPlacementStatus(row.orderPlacementStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poDeliveryStatus(row.deliveryStatus)} /></td>
      <td className="table-cell"><PoStatusPill {...poApprovalStatus(row.approvalStatus)} /></td>
    </tr>
  ));
}

interface OperationsDashboardBoardsProps {
  stockPreview: WmsLowStockAlertApiDto[];
  openOrderRows: PurchaseOrderApiDto[];
  pendingPaymentRows: PurchasePaymentApiDto[];
  activeProjects: WarehouseProjectApiDto[];
}

export default function OperationsDashboardBoards({
  stockPreview, openOrderRows, pendingPaymentRows, activeProjects,
}: OperationsDashboardBoardsProps) {
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');

  const stockRows = useMemo(() => {
    if (stockFilter === 'zero') return stockPreview.filter(row => row.actualQty <= 0);
    if (stockFilter === 'low') return stockPreview.filter(row => row.actualQty > 0);
    return stockPreview;
  }, [stockPreview, stockFilter]);

  const orderRows = useMemo(
    () => (orderFilter === 'all' ? openOrderRows : openOrderRows.filter(row => row.deliveryStatus === orderFilter)),
    [openOrderRows, orderFilter],
  );
  const paymentRows = useMemo(
    () => (paymentFilter === 'all' ? pendingPaymentRows : pendingPaymentRows.filter(row => row.status === paymentFilter)),
    [pendingPaymentRows, paymentFilter],
  );
  const projectRows = useMemo(() => {
    if (projectFilter === 'noPm') return activeProjects.filter(row => !hasPm(row));
    if (projectFilter === 'hasPm') return activeProjects.filter(row => hasPm(row));
    return activeProjects;
  }, [activeProjects, projectFilter]);

  return (
    <>
      <OpsBoard
        title="Cảnh báo tồn kho thấp"
        desc="Tồn hiện tại thấp hơn ngưỡng tối thiểu đã thiết lập."
        to="/warehouse/stock"
        toLabel="Đi tới Kho"
        filter={<OpsFilterTabs value={stockFilter} options={STOCK_FILTERS} onChange={setStockFilter} label="Lọc tồn thấp" />}
      >
        <TableShell
          tableClassName="wms-inventory-table"
          colSpan={5}
          isEmpty={stockRows.length === 0}
          emptyMessage="Không có cảnh báo khớp bộ lọc."
          emptyIcon={AlertTriangle}
          header={(
            <tr>
              <th className="table-header-cell">Mã hàng</th>
              <th className="table-header-cell">Tên hàng</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell text-right">Tồn hiện tại</th>
              <th className="table-header-cell text-right">Tối thiểu</th>
            </tr>
          )}
        >
          {stockRows.map(row => (
            <tr key={`${row.projectCode}-${row.materialCode}`} className="table-row">
              <td className="table-cell"><EntityCodeLink code={row.materialCode} to="/warehouse/materials" state={{ highlightCode: row.materialCode }} /></td>
              <td className="table-cell">{row.materialName}</td>
              <td className="table-cell"><EntityCodeLink code={row.projectCode} to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`} /></td>
              <td className="table-cell text-right tabular-nums ops-dash__qty-low">{fmtStockQty(row.actualQty)} {row.unit}</td>
              <td className="table-cell text-right tabular-nums">{fmtStockQty(row.minStockQty)} {row.unit}</td>
            </tr>
          ))}
        </TableShell>
      </OpsBoard>

      <OpsBoard
        title="Đơn hàng cần theo dõi"
        desc="PO chưa giao đủ - đặt hàng, nhận hàng, duyệt."
        to="/purchasing/orders"
        toLabel="Đi tới Mua hàng"
        filter={<OpsFilterTabs value={orderFilter} options={ORDER_FILTERS} onChange={setOrderFilter} label="Lọc đơn hàng" />}
      >
        <TableShell
          tableClassName="wms-inventory-table"
          colSpan={6}
          isEmpty={orderRows.length === 0}
          emptyMessage="Không có đơn hàng khớp bộ lọc."
          emptyIcon={ShoppingCart}
          header={(
            <tr>
              <th className="table-header-cell">Mã PO</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell">Đặt NCC</th>
              <th className="table-header-cell">Giao hàng</th>
              <th className="table-header-cell">Duyệt</th>
            </tr>
          )}
        >
          <OpenPoRows rows={orderRows} />
        </TableShell>
      </OpsBoard>

      <OpsBoard
        title="Đề nghị thanh toán chờ xử lý"
        desc="DNTT nháp hoặc đã gửi, chưa thanh toán."
        to="/purchasing/payments"
        toLabel="Đi tới Đề nghị TT"
        filter={<OpsFilterTabs value={paymentFilter} options={PAYMENT_FILTERS} onChange={setPaymentFilter} label="Lọc đề nghị TT" />}
      >
        <TableShell
          tableClassName="wms-inventory-table"
          colSpan={5}
          isEmpty={paymentRows.length === 0}
          emptyMessage="Không có đề nghị khớp bộ lọc."
          emptyIcon={Wallet}
          header={(
            <tr>
              <th className="table-header-cell">Mã DNTT</th>
              <th className="table-header-cell">PO</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell text-right">Số tiền</th>
              <th className="table-header-cell">Trạng thái</th>
            </tr>
          )}
        >
          {paymentRows.map(row => (
            <tr key={row.code} className="table-row">
              <td className="table-cell"><EntityCodeLink code={row.code} to={`/purchasing/payments/${encodeURIComponent(row.code)}`} /></td>
              <td className="table-cell tabular-nums">{row.poCode}</td>
              <td className="table-cell">{row.supplierName || '-'}</td>
              <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.amount)}</td>
              <td className="table-cell"><StatusBadge {...paymentStatusBadge(row.status)} /></td>
            </tr>
          ))}
        </TableShell>
      </OpsBoard>

      <OpsBoard
        title="Dự án đang triển khai"
        desc="Danh sách nhanh - tạo mới sẽ tự sinh kho dự án."
        to="/operations/projects"
        toLabel="Danh sách dự án"
        filter={<OpsFilterTabs value={projectFilter} options={PROJECT_FILTERS} onChange={setProjectFilter} label="Lọc phân công" />}
      >
        <TableShell
          tableClassName="wms-inventory-table project-warehouse-table"
          colSpan={5}
          isEmpty={projectRows.length === 0}
          emptyMessage="Không có dự án khớp bộ lọc."
          emptyIcon={FolderKanban}
          header={(
            <tr>
              <th className="table-header-cell project-col-code">Mã</th>
              <th className="table-header-cell project-col-name">Tên công trình</th>
              <th className="table-header-cell project-col-client">Khách hàng</th>
              <th className="table-header-cell project-col-pm">PM</th>
              <th className="table-header-cell text-center project-col-status">Trạng thái</th>
            </tr>
          )}
        >
          {projectRows.map(row => (
            <tr key={row.projectCode} className="table-row">
              <td className="table-cell whitespace-nowrap project-col-code"><EntityCodeLink code={row.projectCode} to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`} /></td>
              <td className="table-cell project-col-name">{row.projectName}</td>
              <td className="table-cell project-col-client">{row.clientName?.trim() || '-'}</td>
              <td className="table-cell project-col-pm">{formatPmDisplayName(row.pmName)}</td>
              <td className="table-cell text-center project-col-status"><Badge status={projectStatusBadge(row.status)} label={projectStatusLabel(row.status)} /></td>
            </tr>
          ))}
        </TableShell>
      </OpsBoard>
    </>
  );
}
