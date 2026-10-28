import type React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Archive, X, Warehouse, Trash2 } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import HrmPanel from '../../components/hr/HrmPanel';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatDateCell } from '../../lib/hrm/formatters';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import { useProjects, useDeleteProject } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { WarehouseProjectApiDto } from '../../types/wms';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import { getSessionUser, isSessionAdmin } from '../../constants/systemUsers';
import { useSession } from '../../auth/AuthProvider';

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
    <div className="hrm-page">
      <PageHeader
        title="Kho dự án"
        subtitle="Quản lý tồn kho vật tư riêng cho từng công trình. Kho dự án tự động kích hoạt theo Master Dự án EPC."
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
                <th className="table-header-cell text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={7}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadProjects)} icon={Warehouse} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
                    <td className="table-cell text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Link
                          to={`/warehouse/import?projectCode=${encodeURIComponent(p.projectCode)}`}
                          className="btn btn-outline btn-sm px-2.5 py-1 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          Nhập thực tế
                        </Link>
                        <Link
                          to={`/warehouse/export?projectCode=${encodeURIComponent(p.projectCode)}`}
                          className="btn btn-outline btn-sm px-2.5 py-1 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          Xuất thực tế
                        </Link>
                        <Link
                          to={`/warehouse/projects/${encodeURIComponent(p.projectCode)}`}
                          className="btn btn-outline btn-sm px-2.5 py-1 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          Thẻ kho
                        </Link>
                        {isAdmin && (
                          (p.stockMaterialCount ?? 0) === 0 ? (
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
                          )
                        )}
                      </div>
                    </td>
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
