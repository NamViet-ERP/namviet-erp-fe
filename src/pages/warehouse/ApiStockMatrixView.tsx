import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import StockMaterialProjectModal from '../../components/warehouse/StockMaterialProjectModal';
import { useStockMatrix } from '../../hooks/useStockMatrix';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import type { StockMatrixRowApiDto } from '../../types/wms';
import { formatCurrency } from '../../utils/formatCurrency';

function sumProjectActual(row: StockMatrixRowApiDto) {
  return row.projects.reduce((sum, p) => sum + p.actualQty, 0);
}

/** Tổng vật tư có thể dùng = phần kho tổng chưa giữ + tồn thực tế tại các dự án. */
function totalUsableQty(row: StockMatrixRowApiDto) {
  const generalFree = Math.max(0, row.generalActualQty - row.generalReservedQty);
  return generalFree + sumProjectActual(row);
}

function sumProjectPlannedImport(row: StockMatrixRowApiDto) {
  return row.projects.reduce((sum, p) => sum + p.plannedQty, 0);
}

function countActiveProjects(row: StockMatrixRowApiDto) {
  return row.projects.filter(
    p => p.actualQty !== 0 || p.plannedQty !== 0 || p.reservedQty !== 0,
  ).length;
}

export default function ApiStockMatrixView() {
  const { data: rows = [], isLoading, isError } = useStockMatrix();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRow, setSelectedRow] = useState<StockMatrixRowApiDto | null>(null);

  const projects = rows[0]?.projects ?? [];

  const filtered = rows.filter(row => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      row.materialCode.toLowerCase().includes(q) ||
      row.materialName.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (projectFilter === 'all') return true;
    if (projectFilter === 'general') return row.generalActualQty > 0 || row.generalReservedQty > 0;
    const col = row.projects.find(p => p.projectCode === projectFilter);
    return (col?.actualQty ?? 0) !== 0 || (col?.plannedQty ?? 0) !== 0 || (col?.reservedQty ?? 0) !== 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const stockColSpan = 10;

  return (
    <>
      <div className="surface-panel surface-panel--rounded-xl p-4 mb-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between page-filter-bar">
          <select
            className="form-select w-full md:w-72 text-sm"
            value={projectFilter}
            onChange={e => { setProjectFilter(e.target.value); setPage(1); }}
          >
            <option value="all">Tất cả vật tư</option>
            <option value="general">Chỉ còn tại kho tổng</option>
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
        <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-3 text-pretty">
          Nhấn dòng vật tư để mở chi tiết phân bổ theo dự án. Khả dụng = (Kho tổng − Xuất dự kiến) + Tồn dự án thực tế.
          Tồn dự kiến = Tồn dự án thực tế + Nhập dự kiến.
          Giá BQ = đơn giá bình quân gia quyền (WAC) từ các phiếu nhập đã duyệt.
        </p>
      </div>

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card stock-matrix-panel">
        <div className="overflow-x-auto wms-inventory-table-wrap wms-inventory-table-wrap--flush-top">
          <table className="wms-inventory-table stock-matrix-table">
            <thead>
              <tr>
                <th className="table-header-cell text-left stock-col-code">Mã VT</th>
                <th className="table-header-cell text-left stock-col-name">Tên vật tư</th>
                <th className="table-header-cell text-center w-14">ĐVT</th>
                <th className="table-header-cell text-right w-20">Kho tổng</th>
                <th className="table-header-cell text-right w-20" title="(Kho tổng − Xuất dự kiến) + Tồn dự án thực tế">Khả dụng</th>
                <th className="table-header-cell text-right w-20">Xuất dự kiến</th>
                <th className="table-header-cell text-right stock-col-project">
                  <span className="stock-matrix-th-stack">Tồn dự án<br />thực tế</span>
                </th>
                <th className="table-header-cell text-right stock-col-project" title="Tồn dự án thực tế + Nhập dự kiến">
                  <span className="stock-matrix-th-stack">Tồn<br />dự kiến</span>
                </th>
                <th
                  className="table-header-cell text-right w-24"
                  title="Weighted Average Cost (WAC) — đơn giá bình quân gia quyền từ các phiếu nhập đã duyệt (IAS 2)"
                >
                  Giá BQ
                </th>
                <th className="table-header-cell text-center w-14">Dự án</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={stockColSpan} />
              ) : isError ? (
                <tr>
                  <td colSpan={stockColSpan}>
                    <EmptyState message={WMS_ERROR.loadStock} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={stockColSpan}>
                    <EmptyState message={WMS_EMPTY.noStock} />
                  </td>
                </tr>
              ) : (
                paginated.map((row: StockMatrixRowApiDto) => {
                  const projectActual = sumProjectActual(row);
                  const activeCount = countActiveProjects(row);
                  const usableQty = totalUsableQty(row);

                  return (
                    <tr
                      key={row.materialCode}
                      onClick={() => setSelectedRow(row)}
                      className="wms-inventory-row--interactive stock-matrix-row table-row border-b border-[var(--md-outline-variant)] cursor-pointer"
                    >
                      <td className="table-cell font-mono font-bold stock-col-code" onClick={e => e.stopPropagation()}>
                        <Link
                          to="/warehouse/materials"
                          state={{ highlightCode: row.materialCode }}
                          className="text-[var(--md-primary)] hover:underline stock-cell-truncate"
                          title={row.materialCode}
                        >
                          {row.materialCode}
                        </Link>
                      </td>
                      <td className="table-cell stock-col-name">
                        <span className="font-semibold stock-cell-truncate block" title={row.materialName}>
                          {row.materialName}
                        </span>
                        {row.isActive === false && (
                          <span className="wms-badge-inactive">Ngừng SD</span>
                        )}
                      </td>
                      <td className="table-cell text-center">{row.unit}</td>
                      <td className="table-cell text-right font-bold tabular-nums stock-cell-general">
                        {row.generalActualQty}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums text-[var(--md-success)]">
                        {usableQty}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-qty--reserved">
                        {fmtStockQtyOrDash(row.generalReservedQty)}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums">
                        {projectActual}
                      </td>
                      <td className="table-cell text-right font-semibold tabular-nums">
                        {fmtPlannedStock(projectActual, sumProjectPlannedImport(row))}
                      </td>
                      <td className="table-cell text-right tabular-nums text-[var(--md-on-surface)]">
                        {row.weightedAverageUnitCost > 0
                          ? formatCurrency(row.weightedAverageUnitCost)
                          : '—'}
                      </td>
                      <td className="table-cell text-center">
                        {activeCount > 0 ? (
                          <span className="stock-project-badge tabular-nums">{activeCount}</span>
                        ) : (
                          <span className="text-[var(--md-on-surface-variant)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="surface-panel__footer px-4 pb-4">
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

      <StockMaterialProjectModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
}
