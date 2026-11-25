import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, CheckCircle2, FolderKanban } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FilterToolbar from '../../components/ui/FilterToolbar';
import KpiCard from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProjects, useDeleteProject } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { WarehouseProjectApiDto } from '../../types/wms';
import { getSessionUser, isSessionAdmin } from '../../constants/systemUsers';
import { useSession } from '../../auth/AuthProvider';
import ProjectsTable from './projects/ProjectsTable';

const STATUS_FILTER_OPTIONS = [
  { value: 'Active', label: 'Đang hoạt động' },
  { value: 'Closed', label: 'Đã đóng kho' },
] as const;

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
  return 'Chưa có kho dự án nào. Kho dự án sẽ tự động kích hoạt khi Ban Giám Đốc/PMO khởi tạo Dự án mới bên phân hệ Dự án EPC.';
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError, error } = useProjects({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: statsAll } = useProjects({ page: 1, pageSize: 1 });
  const { data: statsActive } = useProjects({ page: 1, pageSize: 1, status: 'Active' });
  const { data: statsClosed } = useProjects({ page: 1, pageSize: 1, status: 'Closed' });
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

  return (
    <PageShell>
      <PageHeader
        title="Kho dự án"
        subtitle="Quản lý tồn kho vật tư riêng cho từng công trình. Kho dự án tự động kích hoạt theo Master Dự án EPC."
      />

      <MetricsStrip columns={3} ariaLabel="Thống kê kho dự án">
        <KpiCard
          label="Tổng kho dự án"
          value={statsAll?.totalCount ?? '-'}
          tone="primary"
          icon={FolderKanban}
          selected={!statusFilter}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        />
        <KpiCard
          label="Đang hoạt động"
          value={statsActive?.totalCount ?? '-'}
          tone="success"
          icon={CheckCircle2}
          selected={statusFilter === 'Active'}
          onClick={() => { setStatusFilter('Active'); setPage(1); }}
        />
        <KpiCard
          label="Đã đóng kho"
          value={statsClosed?.totalCount ?? '-'}
          tone="neutral"
          icon={Archive}
          selected={statusFilter === 'Closed'}
          onClick={() => { setStatusFilter('Closed'); setPage(1); }}
        />
      </MetricsStrip>

      <SectionCard noPadding>
        <FilterToolbar
          search={search}
          onSearchChange={v => { setSearch(v); setPage(1); }}
          searchPlaceholder="Tìm mã dự án, tên công trình..."
          hasActiveFilters={hasFilters}
          onReset={resetFilters}
          filters={
            <SelectField
              variant="hrm"
              className="hrm-filter-select-wrap"
              selectClassName="hrm-filter-select"
              aria-label="Lọc trạng thái"
              value={statusFilter}
              placeholder="Tất cả trạng thái"
              options={STATUS_FILTER_OPTIONS}
              onChange={val => { setStatusFilter(val); setPage(1); }}
            />
          }
        />

        <ProjectsTable
          items={items}
          isLoading={isLoading}
          isError={isError}
          error={error}
          emptyMessage={emptyListMessage(search, statusFilter)}
          isAdmin={isAdmin}
          onRowClick={projectCode => navigate(`/warehouse/projects/${encodeURIComponent(projectCode)}`)}
          onDeleteClick={handleDeleteClick}
          pagination={
            totalCount > 0 && !isLoading
              ? {
                  itemLabel: 'kho dự án',
                  currentPage: page,
                  totalPages,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: s => { setPageSize(s); setPage(1); },
                  totalItems: totalCount,
                }
              : undefined
          }
        />
      </SectionCard>

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
    </PageShell>
  );
}
