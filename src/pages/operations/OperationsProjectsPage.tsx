import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, FolderKanban, CheckCircle2, Archive, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PermissionGate from '../../components/auth/PermissionGate';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import ProjectPurchasingGantt from '../../components/operations/ProjectPurchasingGantt';
import CskhFilterTabs, { type CskhFilterOption } from '../cskh/CskhFilterTabs';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { formatDateCell, formatDateVi } from '../../lib/hrm/formatters';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import { dueAwareStatus, purchasingProgressMeta } from '../../lib/wms/purchasingProgressStatus';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useProjectPurchasingProgress,
} from '../../hooks/useProjects';
import type { WarehouseProjectApiDto } from '../../types/wms';

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatTaskDate(iso?: string | null) {
  return formatDateVi(iso ?? undefined) ?? '-';
}

function suggestProjectCode() {
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `DA-${new Date().getFullYear()}-${n}`;
}

function statusLabel(status: string) {
  if (status === 'Active') return 'Đang triển khai';
  if (status === 'Closed') return 'Đã đóng';
  if (status === 'Transferring') return 'Đang chuyển giao';
  if (status === 'Transferred') return 'Đã chuyển giao';
  return status;
}

type FormState = {
  projectCode: string;
  projectName: string;
  clientName: string;
  pmName: string;
  scMembers: string;
  startDate: string;
  endDate: string;
  materialBudget: string;
};

const emptyForm = (): FormState => ({
  projectCode: suggestProjectCode(),
  projectName: '',
  clientName: '',
  pmName: '',
  scMembers: '',
  startDate: todayIso(),
  endDate: '',
  materialBudget: '1',
});

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

type StatusFilter = 'all' | 'Active' | 'Closed';

const STATUS_FILTERS: CskhFilterOption<StatusFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'Active', label: 'Đang triển khai', tone: 'ok' },
  { id: 'Closed', label: 'Đã đóng', tone: 'muted' },
];

/** CRUD dự án vận hành - Gantt tiến độ mua hàng theo dự án. */
export default function OperationsProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WarehouseProjectApiDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progressProjectFilter, setProgressProjectFilter] = useState('');

  const { data, isLoading } = useProjects({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });
  const { data: projectOptions } = useProjects({ page: 1, pageSize: 200 });
  const progressQ = useProjectPurchasingProgress(progressProjectFilter || undefined);

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(search.trim() || statusFilter !== 'all');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (row: WarehouseProjectApiDto) => {
    setEditing(row);
    setForm({
      projectCode: row.projectCode,
      projectName: row.projectName,
      clientName: row.clientName ?? '',
      pmName: row.pmName ?? '',
      scMembers: row.scMembers ?? '',
      startDate: row.startDate?.slice(0, 10) ?? todayIso(),
      endDate: row.endDate?.slice(0, 10) ?? '',
      materialBudget: String(row.materialBudget || 1),
    });
    setErrors({});
    setShowForm(true);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectCode.trim()) e.projectCode = 'Nhập mã dự án';
    if (!form.projectName.trim()) e.projectName = 'Nhập tên dự án';
    if (!form.pmName.trim()) e.pmName = 'Nhập PIC / quản lý';
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu';
    return e;
  };

  const handleSave = async () => {
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    const budget = Number(String(form.materialBudget).replace(/[^\d.]/g, '')) || 1;
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          code: editing.projectCode,
          body: {
            projectName: form.projectName.trim(),
            pmId: editing.pmId || EMPTY_PM_ID,
            pmName: form.pmName.trim(),
            endDate: form.endDate || null,
            materialBudget: budget,
            status: editing.status as 'Active' | 'Transferring' | 'Transferred' | 'Closed',
            warehouseKeepers: editing.warehouseKeepers ?? [],
            clientName: form.clientName.trim() || null,
            scMembers: form.scMembers.trim() || null,
          },
        });
        showToast('success', `Đã cập nhật dự án ${editing.projectCode}.`);
      } else {
        const created = await createMutation.mutateAsync({
          projectCode: form.projectCode.trim().toUpperCase(),
          projectName: form.projectName.trim(),
          projectType: 'Project',
          pmId: EMPTY_PM_ID,
          pmName: form.pmName.trim(),
          startDate: form.startDate,
          endDate: form.endDate || null,
          materialBudget: budget,
          warehouseKeepers: [],
          clientName: form.clientName.trim() || null,
          scMembers: form.scMembers.trim() || null,
        });
        showToast(
          'success',
          `Đã tạo dự án ${created.projectCode} - kho dự án đã sẵn sàng trong Kho hàng.`,
        );
      }
      setShowForm(false);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else showToast('error', getApiErrorMessage(err, 'Không lưu được dự án'));
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const projectSelectItems = projectOptions?.items ?? items;
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
    <div className="page-stack operations-dashboard cskh-desk">
      <PageHeader
        eyebrow="SLC"
        title="Dự án"
        actions={(
          <p className="page-header__updated">Hôm nay: {formatTaskDate(todayIso())}</p>
        )}
      />

      <div className="dashboard-kpi-grid dashboard-kpi-grid--3" role="list" aria-label="Thống kê dự án">
        <Card
          className="cskh-desk__kpi-card"
          title="Tổng dự án"
          value={statsAll?.totalCount ?? '-'}
          accent="info"
          icon={FolderKanban}
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Đang triển khai"
          value={statsActive?.totalCount ?? '-'}
          accent="success"
          icon={CheckCircle2}
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Đã đóng"
          value={statsClosed?.totalCount ?? '-'}
          accent="neutral"
          icon={Archive}
        />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Gantt tiến độ mua hàng</h2>
            <p className="section-heading__sub mb-0">Luồng KHMH/MHPS - PO - NK. Thanh là hạn giao, chấm xanh là nhập thực tế.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <label className="cskh-desk__year cskh-desk__year--wide">
              <span className="form-label">Dự án</span>
              <HrmSelect
                aria-label="Lọc dự án trên Gantt"
                value={progressProjectFilter || 'all'}
                options={ganttProjectOptions}
                allowEmpty={false}
                onChange={value => setProgressProjectFilter(value === 'all' ? '' : value)}
              />
            </label>
          </div>
        </div>
        {progressQ.isLoading ? (
          <div className="ops-gantt-skeleton" aria-busy="true">
            <div className="hrm-table-skeleton" />
          </div>
        ) : progressQ.isError ? (
          <p className="ops-gantt-note">Không tải được tiến độ. Tải lại trang để thử lại.</p>
        ) : !hasGanttRows ? (
          <EmptyState
            message={
              projectSelectItems.length === 0
                ? 'Chưa có dự án. Tạo dự án, rồi lập KHMH hoặc PO bên Mua hàng.'
                : 'Dự án chưa có KHMH/MHPS hoặc đơn đặt hàng. Lập phiếu bên Mua hàng để theo dõi Gantt.'
            }
            icon={FolderKanban}
          />
        ) : (
          <ProjectPurchasingGantt groups={progressGroups} />
        )}
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Bảng tiến độ theo đơn đặt hàng</h2>
            <p className="section-heading__sub mb-0">Theo dự án đang lọc trên Gantt.</p>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
          <table className="wms-inventory-table ops-progress-table">
            <thead>
              <tr>
                <th className="table-header-cell">Mã PO</th>
                <th className="table-header-cell">Dự án</th>
                <th className="table-header-cell">NCC</th>
                <th className="table-header-cell whitespace-nowrap">Ngày đặt</th>
                <th className="table-header-cell whitespace-nowrap">DK giao</th>
                <th className="table-header-cell whitespace-nowrap">Nhập kho</th>
                <th className="table-header-cell text-right">Đã nhận / Tổng</th>
                <th className="table-header-cell text-right ops-progress-col-pct">%</th>
                <th className="table-header-cell text-center">Trạng thái</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {progressQ.isLoading ? (
                <TableSkeletonRows colSpan={10} />
              ) : progressOrders.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState message="Chưa có đơn đặt hàng để theo dõi." icon={FolderKanban} />
                  </td>
                </tr>
              ) : (
                progressOrders.map(row => {
                  const st = purchasingProgressMeta(dueAwareStatus(row.status, row.plannedEnd));
                  return (
                    <tr key={row.poCode} className="table-row">
                      <td className="table-cell font-mono">{row.poCode}</td>
                      <td className="table-cell font-mono">{row.projectCode}</td>
                      <td className="table-cell">{row.supplierName?.trim() || '-'}</td>
                      <td className="table-cell whitespace-nowrap tabular-nums">{formatTaskDate(row.plannedStart)}</td>
                      <td className="table-cell whitespace-nowrap tabular-nums">{formatTaskDate(row.plannedEnd)}</td>
                      <td className="table-cell whitespace-nowrap tabular-nums">{formatTaskDate(row.actualEnd)}</td>
                      <td className="table-cell text-right font-mono tabular-nums">
                        {row.received}/{row.ordered}
                      </td>
                      <td className="table-cell ops-progress-col-pct">
                        <span className="ops-meter-cell">
                          <span className="ops-meter" aria-hidden>
                            <span
                              className={`ops-meter__fill ops-tone--${st.tone}`}
                              style={{ width: `${Math.min(100, Math.max(0, row.percentComplete))}%` }}
                            />
                          </span>
                          <span className="font-mono tabular-nums">{row.percentComplete}%</span>
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${st.badgeClass}`}>{st.label}</span>
                      </td>
                      <td className="table-cell text-center">
                        <PermissionGate permission="purchasing.orders.view">
                          <Link
                            className="btn btn-ghost btn-sm"
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
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Danh sách dự án</h2>
            <p className="section-heading__sub mb-0">Bấm Sửa để cập nhật PIC, khách hàng và ngày kết thúc.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã DA, tên dự án"
            />
            <CskhFilterTabs
              value={statusFilter}
              options={STATUS_FILTERS}
              onChange={id => { setStatusFilter(id); setPage(1); }}
              label="Lọc trạng thái"
            />
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                <X size={14} aria-hidden />
                Xóa lọc
              </button>
            ) : null}
            <PermissionGate permission="wms.projects.create">
              <Button type="button" className="cskh-desk__toolbar-add" leftIcon={Plus} onClick={openCreate}>
                Dự án mới
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="wms-inventory-table-wrap cskh-desk__table">
          <table className="wms-inventory-table project-warehouse-table project-warehouse-table--wide">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap project-col-code">Mã DA</th>
                <th className="table-header-cell project-col-name">Tên dự án</th>
                <th className="table-header-cell project-col-client">Khách hàng</th>
                <th className="table-header-cell project-col-pm">PIC / Quản lý</th>
                <th className="table-header-cell project-col-sc">Thành viên SC</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Ngày bắt đầu</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Ngày kết thúc</th>
                <th className="table-header-cell text-center project-col-status">Trạng thái</th>
                <th className="table-header-cell text-center whitespace-nowrap project-col-actions">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={9} rows={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      message={
                        hasFilters
                          ? 'Không tìm thấy dự án phù hợp bộ lọc.'
                          : 'Chưa có dự án. Bấm Dự án mới để bắt đầu.'
                      }
                      icon={FolderKanban}
                    />
                  </td>
                </tr>
              ) : (
                items.map(row => (
                  <tr key={row.projectCode} className="table-row">
                    <td className="table-cell whitespace-nowrap project-col-code">
                      <EntityCodeLink
                        code={row.projectCode}
                        to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                      />
                    </td>
                    <td className="table-cell font-semibold project-col-name">
                      <span title={row.projectName}>{row.projectName}</span>
                    </td>
                    <td className="table-cell project-col-client">
                      {row.clientName?.trim() || <span className="hrm-empty-cell">-</span>}
                    </td>
                    <td className="table-cell project-col-pm">
                      {row.pmName || <span className="hrm-empty-cell">-</span>}
                    </td>
                    <td className="table-cell project-col-sc">
                      <span title={row.scMembers ?? undefined}>
                        {row.scMembers?.trim() || <span className="hrm-empty-cell">-</span>}
                      </span>
                    </td>
                    <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
                      {formatDateCell(row.startDate)}
                    </td>
                    <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
                      {formatDateCell(row.endDate ?? undefined)}
                    </td>
                    <td className="table-cell text-center project-col-status">
                      <Badge status={projectStatusBadge(row.status)} label={statusLabel(row.status)} />
                    </td>
                    <td className="table-cell text-center project-col-actions">
                      <PermissionGate permission="wms.projects.update">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={14} aria-hidden />
                          Sửa
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && !isLoading ? (
          <Pagination
            embedded
            itemLabel="dự án"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={size => { setPageSize(size); setPage(1); }}
            totalItems={totalCount}
          />
        ) : null}
      </HrmPanel>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa dự án' : 'Tạo dự án mới'}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
              Hủy
            </button>
            <button type="button" className="btn btn-primary" disabled={pending} onClick={() => { void handleSave(); }}>
              {pending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mã dự án" required error={errors.projectCode}>
            <input
              className="form-input"
              value={form.projectCode}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, projectCode: e.target.value }))}
            />
          </FormField>
          <FormField label="Khách hàng (viết tắt)" error={errors.clientName}>
            <input
              className="form-input"
              value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              placeholder="VD: PVN"
            />
          </FormField>
          <FormField label="Tên dự án" required error={errors.projectName}>
            <input
              className="form-input"
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
            />
          </FormField>
          <FormField label="PIC / Quản lý" required error={errors.pmName}>
            <input
              className="form-input"
              value={form.pmName}
              onChange={e => setForm(f => ({ ...f, pmName: e.target.value }))}
            />
          </FormField>
          <FormField label="Thành viên SC" error={errors.scMembers}>
            <input
              className="form-input"
              value={form.scMembers}
              onChange={e => setForm(f => ({ ...f, scMembers: e.target.value }))}
              placeholder="Cách nhau bởi dấu phẩy"
            />
          </FormField>
          <FormField label="Ngân sách VT (tối thiểu 1)" error={errors.materialBudget}>
            <input
              className="form-input"
              inputMode="decimal"
              value={form.materialBudget}
              onChange={e => setForm(f => ({ ...f, materialBudget: e.target.value }))}
            />
          </FormField>
          <FormField label="Ngày bắt đầu" required error={errors.startDate}>
            <input
              className="form-input"
              type="date"
              value={form.startDate}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Ngày kết thúc" error={errors.endDate}>
            <input
              className="form-input"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </FormField>
        </div>
        {!editing ? (
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-3 mb-0 text-pretty">
            Sau khi lưu, kho dự án cùng mã sẽ xuất hiện trong Kho hàng → Kho dự án.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
