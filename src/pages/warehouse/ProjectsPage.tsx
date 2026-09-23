import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, CheckCircle2, Archive, X, Warehouse, Trash2 } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import CurrencyInput from '../../components/ui/CurrencyInput';
import Badge from '../../components/ui/Badge';
import HrmPanel from '../../components/hr/HrmPanel';
import Card from '../../components/ui/Card';
import PermissionGate from '../../components/auth/PermissionGate';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatDateCell } from '../../lib/hrm/formatters';
import { parseCurrencyInput } from '../../utils/currencyInput';
import { MAX_MATERIAL_BUDGET, MAX_MATERIAL_BUDGET_LABEL } from '../../constants/wmsLimits';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import { useProjects, useCreateProject, useDeleteProject } from '../../hooks/useProjects';
import { projectsService } from '../../services/projectsService';
import { nextProjectCode } from '../../lib/cskh/commandCenter';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { WarehouseProjectApiDto, ProjectWarehouseKeeperDto } from '../../types/wms';
import WarehouseKeeperMultiSelect from '../../components/warehouse/WarehouseKeeperMultiSelect';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import { getSessionUser, isSessionAdmin } from '../../constants/systemUsers';
import { useSession } from '../../auth/AuthProvider';

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function validateCreateForm(form: {
  projectCode: string;
  projectName: string;
  startDate: string;
  materialBudget: string;
  warehouseKeepers: ProjectWarehouseKeeperDto[];
}): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.projectCode.trim()) errs.projectCode = 'Vui lòng nhập mã kho dự án';
  if (!form.projectName.trim()) errs.projectName = 'Vui lòng nhập tên công trình';
  if (form.warehouseKeepers.length < 1) {
    errs.warehouseKeepers = 'Chọn ít nhất 1 thủ kho phụ trách';
  }
  if (!form.startDate) errs.startDate = 'Vui lòng chọn ngày bắt đầu';
  if (parseCurrencyInput(form.materialBudget) <= 0) {
    errs.materialBudget = 'Vui lòng nhập ngân sách vật tư';
  } else if (parseCurrencyInput(form.materialBudget) > MAX_MATERIAL_BUDGET) {
    errs.materialBudget = `Ngân sách tối đa ${MAX_MATERIAL_BUDGET_LABEL} đ`;
  }
  return errs;
}

function clearFieldError(
  setErrors: Dispatch<SetStateAction<Record<string, string>>>,
  field: string,
) {
  setErrors(prev => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

function emptyListMessage(search: string, statusFilter: string) {
  if (search.trim()) {
    return `Không tìm thấy kho dự án phù hợp với "${search.trim()}".`;
  }
  if (statusFilter === 'Closed') {
    return 'Chưa có kho dự án nào đã đóng. Kho đóng sẽ xuất hiện ở đây sau khi bạn thực hiện thao tác Đóng kho.';
  }
  if (statusFilter === 'Active') {
    return 'Chưa có kho dự án đang hoạt động.';
  }
  return 'Chưa có kho dự án nào. Nhấn Tạo kho dự án để bắt đầu.';
}

function ProjectMaterialCountCell({ project }: { project: WarehouseProjectApiDto }) {
  const materialCount = project.stockMaterialCount ?? 0;
  return (
    <td className="table-cell text-right tabular-nums project-col-count">
      {materialCount}
    </td>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    projectCode: '',
    projectName: '',
    pmName: '',
    startDate: todayIso(),
    materialBudget: '',
    warehouseKeepers: [] as ProjectWarehouseKeeperDto[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error } = useProjects({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const [deletingProject, setDeletingProject] = useState<WarehouseProjectApiDto | null>(null);
  const { user: authUser } = useSession();
  const sessionUser = authUser ?? getSessionUser();
  const isAdmin = isSessionAdmin(sessionUser);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(search.trim() || statusFilter);

  const handleDeleteClick = (e: React.MouseEvent, p: WarehouseProjectApiDto) => {
    e.stopPropagation();
    setDeletingProject(p);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteMutation.mutateAsync(deletingProject.projectCode);
      showToast('success', `Đã xóa kho dự án ${deletingProject.projectCode}.`);
      setDeletingProject(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa kho dự án'));
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const openCreate = () => {
    const today = todayIso();
    const currentYear = new Date().getFullYear();
    const fallbackCode = nextProjectCode(items.map(p => p.projectCode), currentYear);
    const me = getSessionUser();
    const defaultKeepers: ProjectWarehouseKeeperDto[] = me?.id
      ? [{ userId: me.id, displayName: me.name || me.username || 'Thủ kho' }]
      : [];
    setForm({
      projectCode: fallbackCode,
      projectName: '',
      pmName: '',
      startDate: today,
      materialBudget: '',
      warehouseKeepers: defaultKeepers,
    });
    setErrors({});
    setShowCreate(true);

    void projectsService.getNextCode(currentYear).then(res => {
      if (res?.projectCode) {
        setForm(f => ({ ...f, projectCode: res.projectCode }));
      }
    }).catch(() => {
      // Giữ mã fallback nếu mạng hoặc BE chưa phản hồi
    });
  };

  const handleCreate = async () => {
    const clientErrors = validateCreateForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    try {
      const keepers = form.warehouseKeepers;
      const created = await createMutation.mutateAsync({
        projectCode: form.projectCode.trim().toUpperCase(),
        projectName: form.projectName.trim(),
        projectType: 'Project',
        pmId: EMPTY_PM_ID,
        pmName: keepers.map(k => k.displayName).join(', ') || form.pmName.trim() || '—',
        startDate: form.startDate,
        materialBudget: parseCurrencyInput(form.materialBudget),
        warehouseKeepers: keepers,
      });
      showToast('success', `Đã tạo kho dự án ${created.projectCode}.`);
      setShowCreate(false);
      navigate(`/warehouse/projects/${encodeURIComponent(created.projectCode)}`);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        showToast('error', getApiErrorMessage(err, 'Không thể tạo kho dự án'));
      }
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Kho dự án"
        subtitle="Mỗi công trình là một kho riêng — cấp vật tư qua Nhập kho, tiêu hao qua Xuất kho, hoàn dư qua Chuyển kho."
        actions={
          <PermissionGate permission="wms.projects.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={openCreate}
            >
              <Plus size={16} />
              Tạo kho dự án
            </button>
          </PermissionGate>
        }
      />

      <div className="dashboard-kpi-grid dashboard-kpi-grid--3" role="list" aria-label="Thống kê kho dự án">
        <Card
          title="Tổng kho dự án"
          value={statsAll?.totalCount ?? '-'}
          accent="amber"
          icon={FolderKanban}
          selected={!statusFilter}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        />
        <Card
          title="Đang hoạt động"
          value={statsActive?.totalCount ?? '-'}
          accent="blue"
          icon={CheckCircle2}
          selected={statusFilter === 'Active'}
          onClick={() => { setStatusFilter('Active'); setPage(1); }}
        />
        <Card
          title="Đã đóng kho"
          value={statsClosed?.totalCount ?? '-'}
          accent="teal"
          icon={Archive}
          selected={statusFilter === 'Closed'}
          onClick={() => { setStatusFilter('Closed'); setPage(1); }}
        />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã dự án, tên công trình..."
            />
            <div className="hrm-filter-select-wrap">
              <select
                className="hrm-filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                aria-label="Lọc trạng thái"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Active">Đang hoạt động</option>
                <option value="Closed">Đã đóng kho</option>
              </select>
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                <X size={14} />
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table project-warehouse-table">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap project-col-code">Mã kho</th>
                <th className="table-header-cell project-col-name">Tên công trình</th>
                <th className="table-header-cell project-col-pm">Thủ kho phụ trách</th>
                <th className="table-header-cell text-right project-col-count">Mặt hàng</th>
                <th className="table-header-cell project-col-date whitespace-nowrap">Ngày bắt đầu</th>
                <th className="table-header-cell text-center project-col-status">Trạng thái</th>
                {isAdmin && <th className="table-header-cell text-center w-16">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={isAdmin ? 7 : 6}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>
                    <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadProjects)} icon={Warehouse} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>
                    <EmptyState message={emptyListMessage(search, statusFilter)} icon={FolderKanban} />
                  </td>
                </tr>
              ) : (
                items.map(p => (
                  <tr
                    key={p.projectCode}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => navigate(`/warehouse/projects/${encodeURIComponent(p.projectCode)}`)}
                  >
                    <td className="table-cell whitespace-nowrap project-col-code">
                      <EntityCodeLink
                        code={p.projectCode}
                        to={`/warehouse/projects/${encodeURIComponent(p.projectCode)}`}
                      />
                    </td>
                    <td className="table-cell font-semibold project-col-name">
                      <span title={p.projectName}>{p.projectName}</span>
                    </td>
                    <td className="table-cell project-col-pm">
                      {(() => {
                        const keepers = p.warehouseKeepers ?? [];
                        if (keepers.length > 0) {
                          return (
                            <span title={keepers.map(k => k.displayName).join(', ')}>
                              {keepers.map(k => k.displayName).join(', ')}
                            </span>
                          );
                        }
                        return p.pmName && p.pmName !== '—'
                          ? p.pmName
                          : <span className="hrm-empty-cell">—</span>;
                      })()}
                    </td>
                    <ProjectMaterialCountCell project={p} />
                    <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
                      {formatDateCell(p.startDate)}
                    </td>
                    <td className="table-cell text-center project-col-status">
                      <Badge status={projectStatusBadge(p.status)} />
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                        {(p.stockMaterialCount ?? 0) === 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-[var(--md-error)] hover:bg-[color-mix(in_srgb,var(--md-error)_12%,transparent)]"
                            title={`Xóa kho dự án ${p.projectCode}`}
                            aria-label={`Xóa kho dự án ${p.projectCode}`}
                            onClick={e => handleDeleteClick(e, p)}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center p-1 text-[var(--md-outline)] opacity-40 cursor-not-allowed"
                            title="Kho đã có mặt hàng, không thể xóa"
                          >
                            <Trash2 size={15} />
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="kho dự án"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={totalCount}
          />
        )}
      </HrmPanel>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo kho dự án"
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
            <button
              type="button"
              className="btn btn-filled"
              disabled={createMutation.isPending}
              onClick={handleCreate}
            >
              Tạo kho
            </button>
          </>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          <FormField label="Mã kho dự án" required error={errors.projectCode}>
            <input
              className="form-input font-mono"
              value={form.projectCode}
              onChange={e => {
                setForm({ ...form, projectCode: e.target.value.toUpperCase() });
                clearFieldError(setErrors, 'projectCode');
              }}
              placeholder="VD: DA-2026-001"
            />
          </FormField>
          <FormField label="Tên công trình" required error={errors.projectName}>
            <input
              className="form-input"
              value={form.projectName}
              onChange={e => {
                setForm({ ...form, projectName: e.target.value });
                clearFieldError(setErrors, 'projectName');
              }}
              placeholder="VD: Dự án Nhiệt điện Long Phú 1"
            />
          </FormField>
          <FormField label="Người phụ trách dự án (Thủ kho)" required error={errors.warehouseKeepers}>
            <WarehouseKeeperMultiSelect
              value={form.warehouseKeepers}
              onChange={warehouseKeepers => {
                setForm({ ...form, warehouseKeepers });
                clearFieldError(setErrors, 'warehouseKeepers');
              }}
              placeholder="Chọn ≥1 thủ kho…"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Ngày bắt đầu" required error={errors.startDate}>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={e => {
                  setForm({ ...form, startDate: e.target.value });
                  clearFieldError(setErrors, 'startDate');
                }}
              />
            </FormField>
            <FormField label="Ngân sách Vật tư" required error={errors.materialBudget}>
              <CurrencyInput
                suffix="(VNĐ)"
                className="tabular-nums"
                value={form.materialBudget}
                onChange={(_raw, numeric) => {
                  setForm({ ...form, materialBudget: numeric > 0 ? String(numeric) : '' });
                  clearFieldError(setErrors, 'materialBudget');
                }}
                placeholder="0"
              />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa kho dự án"
        message={
          deletingProject ? (
            <div className="space-y-2 text-left">
              <p>
                Bạn có chắc chắn muốn xóa kho dự án <strong>{deletingProject.projectName}</strong> ({deletingProject.projectCode})?
              </p>
              <p className="text-[var(--md-on-surface-variant)] text-sm">
                Thao tác này chỉ dành cho trường hợp tạo nhầm khi kho chưa có mặt hàng hay phát sinh giao dịch. Dữ liệu kho dự án sẽ bị xóa.
              </p>
            </div>
          ) : ''
        }
        confirmLabel="Xóa kho"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
