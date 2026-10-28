import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, FolderKanban, CheckCircle2, Archive, RotateCcw, ArrowRight, ArrowLeftRight, Activity } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PermissionGate from '../../components/auth/PermissionGate';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import ProjectPersonnelSelect from '../../components/operations/ProjectPersonnelSelect';
import ProjectMemberMultiSelect from '../../components/operations/ProjectMemberMultiSelect';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
} from '../../hooks/useProjects';
import { useDebounce } from '../../hooks/useDebounce';
import { projectsService } from '../../services/projectsService';
import { nextProjectCode } from '../../lib/cskh/commandCenter';
import type { WarehouseProjectApiDto } from '../../types/wms';

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
  scMembers: string[];
  startDate: string;
  endDate: string;
  materialBudget: string;
};

const emptyForm = (projectCode = ''): FormState => ({
  projectCode,
  projectName: '',
  clientName: '',
  pmName: '',
  scMembers: [],
  startDate: todayIso(),
  endDate: '',
  materialBudget: '1',
});

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

type StatusFilter = 'all' | 'Active' | 'Transferring' | 'Closed';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Active', label: 'Đang triển khai' },
  { id: 'Transferring', label: 'Đang chuyển giao' },
  { id: 'Closed', label: 'Đã đóng' },
];

export default function OperationsProjectListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WarehouseProjectApiDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useProjects({
    page,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsTransferring } = useProjects({ page: 1, pageSize: 1, status: 'Transferring' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(search.trim() || statusFilter !== 'all');

  const openCreate = () => {
    setEditing(null);
    const currentYear = new Date().getFullYear();
    const fallbackCode = nextProjectCode(items.map(p => p.projectCode), currentYear);
    setForm(emptyForm(fallbackCode));
    setErrors({});
    setShowForm(true);

    void projectsService.getNextCode(currentYear).then(res => {
      if (res?.projectCode) {
        setForm(f => ({ ...f, projectCode: res.projectCode }));
      }
    }).catch(() => {
      // Giữ mã fallback nếu mạng hoặc BE chưa phản hồi
    });
  };

  const openEdit = (row: WarehouseProjectApiDto) => {
    setEditing(row);
    const pm = row.pmName?.trim() ?? '';
    setForm({
      projectCode: row.projectCode,
      projectName: row.projectName,
      clientName: row.clientName ?? '',
      pmName: pm,
      scMembers: (row.scMembers ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(s => Boolean(s) && s.toLowerCase() !== pm.toLowerCase()),
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
    const scMembersString = form.scMembers.map(s => s.trim()).filter(Boolean).join(', ') || null;
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
            scMembers: scMembersString,
          },
        });
        showToast('success', `Đã cập nhật dự án ${editing.projectCode}.`);
      } else {
        const created = await createMutation.mutateAsync({
          projectCode: form.projectCode.trim(),
          projectName: form.projectName.trim(),
          projectType: 'Project',
          pmId: EMPTY_PM_ID,
          pmName: form.pmName.trim(),
          startDate: form.startDate,
          endDate: form.endDate || null,
          materialBudget: budget,
          warehouseKeepers: [],
          clientName: form.clientName.trim() || null,
          scMembers: scMembersString,
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

  return (
    <div className="page-shell operations-dashboard ops-projects">
      <PageHeader
        eyebrow="Dự án EPC"
        title="Danh sách dự án"
        subtitle="Quản lý hợp đồng, chỉ huy trưởng, ngày bàn giao và thông tin các công trình EPC."
        actions={(
          <PermissionGate permission="wms.projects.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5 font-semibold"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden />
              + Thêm dự án
            </button>
          </PermissionGate>
        )}
      />

      <div className="dashboard-kpi-grid dashboard-kpi-grid--4 ops-projects-kpis" role="list" aria-label="Thống kê dự án">
        <Card
          title="Tổng dự án"
          value={statsAll?.totalCount ?? '-'}
          accent="info"
          icon={FolderKanban}
          selected={statusFilter === 'all'}
          onClick={() => { setStatusFilter('all'); setPage(1); }}
        />
        <Card
          title="Đang triển khai"
          value={statsActive?.totalCount ?? '-'}
          accent="success"
          icon={CheckCircle2}
          selected={statusFilter === 'Active'}
          onClick={() => { setStatusFilter('Active'); setPage(1); }}
        />
        <Card
          title="Đang chuyển giao"
          value={statsTransferring?.totalCount ?? '-'}
          accent="amber"
          icon={ArrowLeftRight}
          selected={statusFilter === 'Transferring'}
          onClick={() => { setStatusFilter('Transferring'); setPage(1); }}
        />
        <Card
          title="Đã đóng"
          value={statsClosed?.totalCount ?? '-'}
          accent="neutral"
          icon={Archive}
          selected={statusFilter === 'Closed'}
          onClick={() => { setStatusFilter('Closed'); setPage(1); }}
        />
      </div>

      <Panel noPadding className="ops-projects-board">
        <div className="ops-projects-board__head">
          <h2 className="ops-projects-board__title">Danh mục Master Dự Án</h2>
          <p className="ops-projects-board__desc">
            Quản lý tập trung các công trình EPC. Cập nhật thông tin hợp đồng, chỉ huy trưởng và thành viên điều hành.
          </p>
        </div>
        <div className="hrm-list-toolbar">
          <div className="ops-projects__toolbar">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã DA, tên dự án..."
            />
            <div className="ops-projects-tabs" role="tablist" aria-label="Lọc trạng thái">
              {STATUS_FILTERS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === item.id}
                  className={`ops-projects-tabs__btn${statusFilter === item.id ? ' is-active' : ''}`}
                  onClick={() => { setStatusFilter(item.id); setPage(1); }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="btn btn-text" title="Đặt lại bộ lọc">
                <RotateCcw size={14} aria-hidden />
                Xóa lọc
              </button>
            ) : null}
          </div>
        </div>

        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
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
                          : 'Chưa có dự án nào. Bấm "+ Thêm dự án" để bắt đầu.'
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
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          to={`/operations/executive-360?project=${encodeURIComponent(row.projectCode)}`}
                          title="Xem Bảng điều hành 360°"
                        >
                          <Activity size={14} aria-hidden />
                          <span>360°</span>
                        </Link>
                        <PermissionGate permission="wms.projects.update">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(row)}
                            title="Sửa thông tin dự án"
                          >
                            <Pencil size={14} aria-hidden />
                            Sửa
                          </button>
                        </PermissionGate>
                        <Link
                          to={`/operations/projects?project=${encodeURIComponent(row.projectCode)}`}
                          className="btn btn-text btn-sm flex items-center gap-1"
                          title="Xem tiến độ cung ứng"
                        >
                          <span>Tiến độ cung ứng</span>
                          <ArrowRight size={14} aria-hidden />
                        </Link>
                      </div>
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
      </Panel>

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
              {pending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ops-projects-create">
          <FormField label="Mã dự án" required error={errors.projectCode}>
            <input
              id="modal-project-code"
              name="projectCode"
              className="form-input"
              value={form.projectCode}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, projectCode: e.target.value.toUpperCase() }))}
              placeholder="VD: DA-2026-001"
            />
          </FormField>
          <FormField label="Khách hàng (viết tắt)" error={errors.clientName}>
            <input
              id="modal-client-name"
              name="clientName"
              className="form-input"
              value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              placeholder="VD: PVN"
            />
          </FormField>
          <FormField label="Tên dự án" required error={errors.projectName}>
            <input
              id="modal-project-name"
              name="projectName"
              className="form-input"
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
            />
          </FormField>
          <FormField label="PIC / Quản lý" required error={errors.pmName}>
            <ProjectPersonnelSelect
              value={form.pmName}
              onChange={name =>
                setForm(f => ({
                  ...f,
                  pmName: name,
                  scMembers: f.scMembers.filter(
                    m => m.trim().toLowerCase() !== name.trim().toLowerCase(),
                  ),
                }))
              }
              excludeNames={form.scMembers}
            />
          </FormField>
          <FormField label="Thành viên SC" error={errors.scMembers}>
            <ProjectMemberMultiSelect
              value={form.scMembers}
              onChange={members => setForm(f => ({ ...f, scMembers: members }))}
              excludeNames={form.pmName ? [form.pmName] : []}
            />
          </FormField>
          <FormField label="Ngân sách VT (tối thiểu 1)" error={errors.materialBudget}>
            <input
              id="modal-material-budget"
              name="materialBudget"
              className="form-input"
              inputMode="decimal"
              value={form.materialBudget}
              onChange={e => setForm(f => ({ ...f, materialBudget: e.target.value }))}
            />
          </FormField>
          <FormField label="Ngày bắt đầu" required error={errors.startDate}>
            <input
              id="modal-start-date"
              name="startDate"
              className="form-input"
              type="date"
              value={form.startDate}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Ngày kết thúc" error={errors.endDate}>
            <input
              id="modal-end-date"
              name="endDate"
              className="form-input"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </FormField>
        </div>
        {!editing ? (
          <p className="ops-projects-create__hint">
            Sau khi lưu, kho dự án cùng mã sẽ xuất hiện trong Kho hàng - Kho dự án.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
