import { useState } from 'react';
import { Plus, Pencil, FolderKanban, CheckCircle2, Archive, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PermissionGate from '../../components/auth/PermissionGate';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useProjects, useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import type { WarehouseProjectApiDto } from '../../types/wms';

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

/** CRUD dự án vận hành — cùng chrome/table pattern với Kho dự án. */
export default function OperationsProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WarehouseProjectApiDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useProjects({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(search.trim() || statusFilter);

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
    setStatusFilter('');
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
          `Đã tạo dự án ${created.projectCode} — kho dự án đã sẵn sàng trong Kho hàng.`,
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
    <div className="hrm-page">
      <PageHeader
        title="Dự án"
        subtitle="Danh sách & phân công dự án EPC — tạo dự án sẽ tự sinh kho dự án bên Kho hàng."
        actions={(
          <PermissionGate permission="wms.projects.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden />
              Dự án mới
            </button>
          </PermissionGate>
        )}
      />

      <div className="hrm-stat-grid">
        <HrmStatCard
          label="Tổng dự án"
          value={statsAll?.totalCount ?? '—'}
          icon={FolderKanban}
          tone="primary"
        />
        <HrmStatCard
          label="Đang triển khai"
          value={statsActive?.totalCount ?? '—'}
          icon={CheckCircle2}
          tone="success"
        />
        <HrmStatCard
          label="Đã đóng"
          value={statsClosed?.totalCount ?? '—'}
          icon={Archive}
          tone="neutral"
        />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã DA, tên dự án…"
            />
            <div className="hrm-filter-select-wrap">
              <select
                className="hrm-filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                aria-label="Lọc trạng thái"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Active">Đang triển khai</option>
                <option value="Closed">Đã đóng</option>
              </select>
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                <X size={14} aria-hidden />
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table project-warehouse-table">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap project-col-code">Mã DA</th>
                <th className="table-header-cell">Tên dự án</th>
                <th className="table-header-cell">Khách hàng</th>
                <th className="table-header-cell project-col-pm">PIC / Quản lý</th>
                <th className="table-header-cell">Thành viên SC</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Ngày bắt đầu</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Ngày kết thúc</th>
                <th className="table-header-cell text-center project-col-status">Trạng thái</th>
                <th className="table-header-cell text-center whitespace-nowrap">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={9}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      message={
                        hasFilters
                          ? 'Không tìm thấy dự án phù hợp bộ lọc.'
                          : 'Chưa có dự án. Nhấn Dự án mới để bắt đầu.'
                      }
                      icon={FolderKanban}
                    />
                  </td>
                </tr>
              ) : (
                items.map(row => (
                  <tr key={row.projectCode} className="table-row">
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap project-col-code">
                      {row.projectCode}
                    </td>
                    <td className="table-cell font-semibold max-w-[260px]">
                      <span className="line-clamp-2" title={row.projectName}>{row.projectName}</span>
                    </td>
                    <td className="table-cell">
                      {row.clientName?.trim() || <span className="hrm-empty-cell">—</span>}
                    </td>
                    <td className="table-cell project-col-pm">
                      {row.pmName || <span className="hrm-empty-cell">—</span>}
                    </td>
                    <td className="table-cell max-w-[220px]">
                      <span className="line-clamp-2" title={row.scMembers ?? undefined}>
                        {row.scMembers?.trim() || <span className="hrm-empty-cell">—</span>}
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
                    <td className="table-cell text-center">
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
