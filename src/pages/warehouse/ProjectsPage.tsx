import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useProjects } from '../../hooks/useProjects';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useProjects({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader eyebrow="Kho hàng" title="Dự án & công trình" />

      <div className="rounded-2xl shadow-card p-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between page-filter-bar">
          <select
            className="form-select w-full md:w-48 text-sm"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Closed">Đã đóng kho</option>
          </select>
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Tìm mã dự án, tên công trình..."
          />
        </div>
      </div>

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-[var(--md-on-surface-variant)]">Đang tải...</div>
        ) : isError ? (
          <EmptyState message="Không thể tải danh sách dự án." />
        ) : items.length === 0 ? (
          <EmptyState message="Không tìm thấy dự án phù hợp." />
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                  <th className="table-header-cell text-left">Mã dự án</th>
                  <th className="table-header-cell text-left">Tên công trình</th>
                  <th className="table-header-cell text-left">PM</th>
                  <th className="table-header-cell text-left">Ngày bắt đầu</th>
                  <th className="table-header-cell text-center">Trạng thái</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr
                    key={p.projectCode}
                    className="table-row border-b border-[var(--md-outline-variant)] hover:bg-[var(--tint-primary-weak)] cursor-pointer"
                    onClick={() => navigate(`/warehouse/projects/${encodeURIComponent(p.projectCode)}`)}
                  >
                    <td className="table-cell font-mono font-bold text-[var(--md-primary)]">{p.projectCode}</td>
                    <td className="table-cell font-semibold">{p.projectName}</td>
                    <td className="table-cell">{p.pmName}</td>
                    <td className="table-cell">{p.startDate}</td>
                    <td className="table-cell text-center">
                      <Badge status={p.status === 'Closed' ? 'completed' : 'active'} />
                    </td>
                    <td className="table-cell text-center">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/warehouse/projects/${encodeURIComponent(p.projectCode)}`);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalCount > 0 && (
          <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              totalItems={totalCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
