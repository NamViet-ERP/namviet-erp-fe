import { useState } from 'react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { useStockMatrix } from '../../hooks/useStockMatrix';
import type { StockMatrixRowApiDto } from '../../types/wms';

function getProjectShortName(name: string) {
  const cleaned = name.replace(/Dự án |Nhà máy |Sữa |Bia /g, '');
  return cleaned.length > 18 ? `${cleaned.slice(0, 16)}…` : cleaned;
}

export default function ApiStockMatrixView() {
  const { data: rows = [], isLoading, isError } = useStockMatrix();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const projects = rows[0]?.projects ?? [];

  const filtered = rows.filter(row => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      row.materialCode.toLowerCase().includes(q) ||
      row.materialName.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (projectFilter === 'all') return true;
    if (projectFilter === 'general') return row.generalActualQty > 0;
    const col = row.projects.find(p => p.projectCode === projectFilter);
    return (col?.actualQty ?? 0) > 0 || (col?.plannedQty ?? 0) > 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const displayedProjects =
    projectFilter === 'all' ? projects : projects.filter(p => p.projectCode === projectFilter);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-[var(--md-on-surface-variant)]">Đang tải tồn kho...</div>;
  }

  if (isError) {
    return <EmptyState message="Không thể tải dữ liệu tồn kho." />;
  }

  return (
    <>
      <div className="rounded-2xl shadow-card p-4 mb-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between page-filter-bar">
          <select
            className="form-select w-full md:w-64 text-sm"
            value={projectFilter}
            onChange={e => { setProjectFilter(e.target.value); setPage(1); }}
          >
            <option value="all">Tất cả dự án & Kho tổng</option>
            <option value="general">Kho tổng</option>
            {projects.map(p => (
              <option key={p.projectCode} value={p.projectCode}>{p.projectName}</option>
            ))}
          </select>
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Tìm mã vật tư, tên vật tư..."
          />
        </div>
      </div>

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        {filtered.length === 0 ? (
          <EmptyState message="Không có dữ liệu tồn kho." />
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs" style={{ minWidth: '1100px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--md-outline-variant)' }}>
                  <th className="table-header-cell text-left">Mã VT</th>
                  <th className="table-header-cell text-left">Tên vật tư</th>
                  <th className="table-header-cell text-center">ĐVT</th>
                  <th className="table-header-cell text-right">Kho tổng</th>
                  <th className="table-header-cell text-right">KHẢ DỤNG</th>
                  <th className="table-header-cell text-right">GIỮ KHO</th>
                  {displayedProjects.map(p => (
                    <th key={p.projectCode} className="table-header-cell text-right whitespace-nowrap">
                      {getProjectShortName(p.projectName)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row: StockMatrixRowApiDto) => (
                  <tr key={row.materialCode} className="table-row border-b border-[var(--md-outline-variant)]">
                    <td className="table-cell font-mono font-bold text-[var(--md-primary)]">{row.materialCode}</td>
                    <td className="table-cell font-semibold">
                      {row.materialName}
                      {row.isActive === false && (
                        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Ngừng SD
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-center">{row.unit}</td>
                    <td className="table-cell text-right font-bold" style={{ background: 'var(--tint-primary-weak)' }}>
                      {row.generalActualQty}
                    </td>
                    <td className="table-cell text-right font-bold text-[var(--md-success)]">{row.generalAvailableQty}</td>
                    <td className="table-cell text-right text-rose-500">{row.generalReservedQty}</td>
                    {displayedProjects.map(p => {
                      const col = row.projects.find(c => c.projectCode === p.projectCode);
                      return (
                        <td key={p.projectCode} className="table-cell text-right">
                          <div className="font-bold">{col?.actualQty ?? 0}</div>
                          {(col?.plannedQty ?? 0) !== 0 && (
                            <div className="text-[10px] text-amber-600">+{col?.plannedQty}</div>
                          )}
                          {(col?.reservedQty ?? 0) !== 0 && (
                            <div className="text-[10px] text-rose-500">−{col?.reservedQty}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              totalItems={filtered.length}
            />
          </div>
        )}
      </div>
    </>
  );
}
