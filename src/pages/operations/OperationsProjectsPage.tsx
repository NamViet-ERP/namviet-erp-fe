import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Archive, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PermissionGate from '../../components/auth/PermissionGate';
import Badge from '../../components/ui/Badge';
import ProjectPurchasingGantt from '../../components/operations/ProjectPurchasingGantt';
import { formatDateCell, formatDateVi } from '../../lib/hrm/formatters';
import { dueAwareStatus, purchasingProgressMeta } from '../../lib/wms/purchasingProgressStatus';
import {
  useProjects,
  useProjectPurchasingProgress,
} from '../../hooks/useProjects';

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatTaskDate(iso?: string | null) {
  return formatDateVi(iso ?? undefined) ?? '-';
}

/** Theo dõi tiến độ cung ứng vật tư KHMH/MHPS - PO - Nhập kho theo từng dự án. */
export default function OperationsProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('project');
  const progressProjectFilter = projectParam ?? '';

  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });
  const { data: projectOptions } = useProjects({ page: 1, pageSize: 200 });
  const progressQ = useProjectPurchasingProgress(progressProjectFilter || undefined);

  const projectSelectItems = projectOptions?.items ?? [];
  const ganttProjectOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả dự án' },
      ...projectSelectItems.map(p => ({
        value: p.projectCode,
        label: `${p.projectCode} - ${p.projectName}`,
      })),
    ],
    [projectSelectItems],
  );
  const progressGroups = progressQ.data ?? [];
  const progressOrders = progressGroups.flatMap(g =>
    g.orders.map(order => ({ ...order, projectCode: g.projectCode, projectName: g.projectName })),
  );
  const hasGanttRows = progressGroups.some(g =>
    g.orders.length > 0 || (g.plans?.length ?? 0) > 0,
  );

  return (
    <div className="page-shell operations-dashboard ops-projects">
      <PageHeader
        eyebrow="Dự án EPC"
        title="Tiến độ cung ứng"
        subtitle="Theo dõi tiến độ cung ứng vật tư KHMH/MHPS - PO - Nhập kho theo từng dự án."
        actions={(
          <p className="page-header__updated">Hôm nay: {formatTaskDate(todayIso())}</p>
        )}
      />

      <div className="dashboard-kpi-grid dashboard-kpi-grid--3 ops-projects-kpis" role="list" aria-label="Thống kê dự án">
        <Card
          title="Tổng dự án"
          value={statsAll?.totalCount ?? '-'}
          accent="info"
          icon={FolderKanban}
        />
        <Card
          title="Đang triển khai"
          value={statsActive?.totalCount ?? '-'}
          accent="success"
          icon={CheckCircle2}
        />
        <Card
          title="Đã đóng"
          value={statsClosed?.totalCount ?? '-'}
          accent="neutral"
          icon={Archive}
        />
      </div>

      <Panel noPadding className="ops-projects-board">
        <div className="ops-projects-board__head">
          <h2 className="ops-projects-board__title">Gantt tiến độ mua hàng</h2>
          <p className="ops-projects-board__desc">
            Luồng KHMH/MHPS - PO - NK. Thanh là hạn giao, chấm xanh là nhập thực tế.
          </p>
        </div>
        <div className="hrm-list-toolbar">
          <label className="ops-projects__filter-field">
            <span>Dự án</span>
            <select
              className="form-input form-input-md"
              aria-label="Lọc dự án trên Gantt"
              value={progressProjectFilter || 'all'}
              onChange={e => {
                const val = e.target.value === 'all' ? '' : e.target.value;
                if (val) {
                  setSearchParams({ project: val });
                } else {
                  setSearchParams({});
                }
              }}
            >
              {ganttProjectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ops-projects__gantt-wrap">
          {progressQ.isLoading ? (
            <p className="ops-projects__hint">Đang tải dữ liệu tiến độ mua hàng...</p>
          ) : progressQ.isError ? (
            <p className="ops-projects__hint ops-projects__hint--err">
              Không tải được tiến độ mua hàng. Vui lòng thử lại sau.
            </p>
          ) : !hasGanttRows ? (
            <EmptyState
              message={
                progressProjectFilter
                  ? `Dự án ${progressProjectFilter} chưa có KHMH, MHPS hoặc PO nào có mốc thời gian để vẽ Gantt.`
                  : 'Chưa có KHMH, MHPS hoặc PO nào có mốc thời gian để vẽ Gantt.'
              }
              icon={FolderKanban}
            />
          ) : (
            <ProjectPurchasingGantt groups={progressGroups} />
          )}
        </div>
      </Panel>

      <Panel noPadding className="ops-projects-board">
        <div className="ops-projects-board__head">
          <h2 className="ops-projects-board__title">Tiến độ theo đơn đặt hàng (PO)</h2>
          <p className="ops-projects-board__desc">
            Tổng hợp các đơn mua hàng gắn dự án, tỷ lệ giao và trạng thái quá hạn.
          </p>
        </div>
        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
          <table className="wms-inventory-table project-warehouse-table project-warehouse-table--wide">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap project-col-code">Mã dự án</th>
                <th className="table-header-cell project-col-name">Dự án</th>
                <th className="table-header-cell project-col-code">Mã PO</th>
                <th className="table-header-cell project-col-name">Nhà cung cấp</th>
                <th className="table-header-cell text-right whitespace-nowrap">Đã giao</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Hạn giao hàng</th>
                <th className="table-header-cell text-center project-col-status">Trạng thái</th>
                <th className="table-header-cell text-center whitespace-nowrap project-col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {progressQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center">Đang tải danh sách PO...</td>
                </tr>
              ) : progressOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      message={
                        progressProjectFilter
                          ? `Dự án ${progressProjectFilter} chưa có đơn đặt hàng (PO).`
                          : 'Chưa có đơn đặt hàng (PO) nào cho dự án.'
                      }
                      icon={FolderKanban}
                    />
                  </td>
                </tr>
              ) : (
                progressOrders.map(row => {
                  const meta = purchasingProgressMeta(
                    dueAwareStatus(row.status, row.plannedEnd),
                  );
                  return (
                    <tr key={`${row.projectCode}-${row.poCode}`} className="table-row">
                      <td className="table-cell whitespace-nowrap project-col-code">
                        <Link
                          to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                          className="entity-code-link"
                        >
                          {row.projectCode}
                        </Link>
                      </td>
                      <td className="table-cell font-semibold project-col-name">
                        <span title={row.projectName}>{row.projectName}</span>
                      </td>
                      <td className="table-cell whitespace-nowrap project-col-code">
                        <Link
                          to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                          className="entity-code-link"
                        >
                          {row.poCode}
                        </Link>
                      </td>
                      <td className="table-cell project-col-client">
                        {row.supplierName || <span className="hrm-empty-cell">-</span>}
                      </td>
                      <td className="table-cell text-right tabular-nums">
                        {row.percentComplete}%
                      </td>
                      <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
                        {formatDateCell(row.plannedEnd)}
                      </td>
                      <td className="table-cell text-center project-col-status">
                        <Badge status={meta.tone} label={meta.label} />
                      </td>
                      <td className="table-cell text-center">
                        <PermissionGate permission="purchasing.orders.view">
                          <Link
                            className="btn btn-text btn-sm"
                            to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                          >
                            Xem đơn
                          </Link>
                        </PermissionGate>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="p-5 rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low,#f8fafc)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[var(--md-on-surface)] m-0">Quản lý danh mục Master Dự Án</h3>
          <p className="text-sm text-[var(--md-on-surface-variant)] mt-1 mb-0">
            Xem, thêm mới hoặc cập nhật thông tin hợp đồng, chỉ huy trưởng, khách hàng và ngày bàn giao công trình.
          </p>
        </div>
        <Link
          to="/operations/project-list"
          className="btn btn-primary inline-flex items-center gap-2 font-semibold shrink-0"
        >
          <span>Xem và quản lý thông tin hợp đồng tại Danh sách dự án</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
